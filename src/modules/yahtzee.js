import bot from '../bot'
import { cmd } from '../command'
import Store from '../store'
import { pre, tag, emoji, randint, table } from '../util'

const store = new Store('yahtzee', {})

/**
 * Sum of dice
 *
 * @param {number[]} dice
 */
const sum = dice => dice.reduce((sum, die) => sum + die, 0)

/**
 * Generate range array (inclusive)
 *
 * @param {number} start
 * @param {number} end
 */
const r = (start, end) => [...Array(end - start + 1).keys()].map(n => n + start)

/**
 * Check if dice have all wanted values
 *
 * @param {number[]} dice
 * @param {number[]} want
 */
const has = (dice, want) => want.filter(num => dice.includes(num)).length === want.length

/**
 * Check for n of a kind
 *
 * @param {number[]} dice
 * @param {number} n
 */
const ofAKind = (dice, n) => {
    const kinds = dice.reduce((kinds, dice) => {
        kinds[dice - 1]++
        return kinds
    }, [0, 0, 0, 0, 0])
    return kinds.filter(kind => kind >= n).length > 0
}

/**
 * Check for full house
 *
 * @param {number[]} dice
 */
const isFullHouse = dice => {
    const kinds = dice.reduce((kinds, dice) => {
        kinds[dice - 1]++
        return kinds
    }, [0, 0, 0, 0, 0])
    return kinds.filter(kind => kind === 2).length > 0
        && kinds.filter(kind => kind === 3).length > 0
}

/**
 * Rule definitions
 */
const rules = {
    ones: dice => sum(dice.filter(die => die === 1)),
    twos: dice => sum(dice.filter(die => die === 2)),
    threes: dice => sum(dice.filter(die => die === 3)),
    fours: dice => sum(dice.filter(die => die === 4)),
    fives: dice => sum(dice.filter(die => die === 5)),
    sixes: dice => sum(dice.filter(die => die === 6)),
    three_of_a_kind: dice => ofAKind(dice, 3) ? sum(dice) : 0,
    four_of_a_kind: dice => ofAKind(dice, 4) ? sum(dice) : 0,
    full_house: dice => isFullHouse(dice) ? 25 : 0,
    small_straight: dice => has(dice, r(1, 4)) || has(dice, r(2, 5)) || has(dice, r(3, 6)) ? 30 : 0,
    large_straight: dice => has(dice, r(1, 5)) || has(dice, r(2, 6)) ? 40 : 0,
    yahtzee: dice => ofAKind(dice, 5) ? 50 : 0,
    chance: dice => sum(dice)
}

/**
 * Get dice emoji for number
 *
 * @param {number} n
 */
const diceEmoji = n => emoji(['one', 'two', 'three', 'four', 'five', 'six'][n - 1])

/**
 * Get dice status message for user
 *
 * @param {any} user
 * @param {number[]} dice
 */
const diceStatus = (user, dice) => `${tag(user)}: ${dice.map(diceEmoji).join(' ')}`

/**
 * Check if there is no game for the channel (and msg channel)
 *
 * @param {string} channel
 */
const noGame = channel => {
    if (store.get(channel) === undefined) {
        bot.msg(channel, 'There\'s no Yahtzee! game at the moment')
        return true
    }
    return false
}

/**
 * Check if the user is in the game (and msg channel)
 *
 * @param {string} channel
 * @param {any} user
 */
const notInGame = (channel, user) => {
    if (store.get([channel, 'turns']) > 0 && !store.get([channel, 'players', user.id])) {
        bot.msg(channel, `You're not in this game ${tag(user)}`)
        return true
    }
    return false
}

bot.cmd('yz', (_args, _message, { channel }) => bot.msg(channel, 'Try `help yz`'))
    .desc('Play Yahtzee!')
    .sub(
        cmd('new', (_args, _message, { channel, user }) => {
            if (store.get(channel) !== undefined
                && store.get([channel, 'turns']) > 0
                && !store.get([channel, 'players', user.id])) {
                bot.msg(channel, `You can't reset a game you're not in ${tag(user)}`)
                return
            }

            bot.msg(channel, 'Starting a new game of Yahtzee!')
            store.commit(channel, {
                players: {},
                turn: 0
            })
        })
            .desc('Create a new game of Yahtzee@')
    )
    .sub(
        cmd('cancel', (_args, _message, { channel, user }) => {
            if (noGame(channel) || notInGame(channel, user)) return

            bot.msg(channel, 'Resetting Yahtzee! :(')
            store.commit(channel, {})
        })
            .desc('Cancel the current Yahtzee! game')
    )
    .sub(
        cmd('roll', ([dice = '1,2,3,4,5'], _message, { channel, user }) => {
            if (noGame(channel) || notInGame(channel, user)) return

            const player = store.get([channel, 'players', user.id], {
                categories: Object.keys(rules).reduce((cats, cat) => (cats[cat] = null, cats), {}),
                rolls: 0,
                dice: Array(5)
            })
            if (player.rolls >= 4) {
                bot.msg(channel, `You've had your turn ${tag(user)}`)
                return
            }
            if (player.rolls === 3) {
                bot.msg(
                    channel,
                    `You're out of rolls, pick your category with \`yahtzee! save [cat]\` to continue\n${
                        diceStatus(user, player.dice)}`
                )
                return
            }
            if (player.dice[0] === undefined) dice = '1,2,3,4,5'
            dice.split(',').forEach(num => {
                if (num > 0 && num <= 5) player.dice[num - 1] = randint(6) + 1
            })
            bot.msg(channel, diceStatus(user, player.dice))
            store.commit([channel, 'players', user.id, 'dice'], player.dice)
            store.commit([channel, 'players', user.id, 'rolls'], player.rolls + 1)
        })
            .desc('Roll your dice')
            .arg({ name: 'dice-numbers', def: '1,2,3,4,5' })
    )
    .sub(
        cmd('save', ([category], _message, { channel, user }) => {
            if (noGame(channel)) return

            const cat = category.toLowerCase().replace(/ /g, '_')

            if (!rules[cat]) {
                bot.msg(channel, 'Unknown category! Try `yz help`')
                return
            }

            const player = store.get([channel, 'players', user.id])
            if (!player) {
                if (store.get([channel, 'turns']) > 0) {
                    bot.msg(channel, `You're not in this game ${tag(user)}`)
                } else {
                    bot.msg(channel, `You haven't rolled yet ${tag(user)}`)
                }
                return
            }

            if (player.categories[cat] !== null) {
                bot.msg(channel, `You've already filled that box ${tag(user)}`)
                return
            }

            const result = rules[cat](player.dice)
            bot.msg(channel, `${tag(user)} *+${result}* points for *${category}*`)
            store.commit([channel, 'players', user.id, 'categories', cat], result)
            store.commit([channel, 'players', user.id, 'dice'], Array(5))
            store.commit([channel, 'players', user.id, 'rolls'], 4)

            const { players, turn } = store.get(channel)
            // check to switch to new turn
            // make sure all players have 4 rolls
            const newTurn = !Object.values(players).some(({ rolls }) => rolls < 4)

            // start next turn
            const nextTurn = () => {
                bot.msg(channel, `Yahtzee: turn *${turn + 2}*`)
                Object.keys(players).forEach(player => {
                    store.commit([channel, 'players', player, 'rolls'], 0)
                })
                store.commit([channel, 'turn'], turn + 1)
            }

            if (newTurn) {
                if (turn === 0) {
                // allow new people to join the game before second turn
                    bot.msg(channel, 'Ready for the second turn? Say `next turn`')
                    bot.kw('next turn', (_message, _meta) => {
                        nextTurn()
                        bot.kw('next turn', null)
                    })
                    return
                }
                nextTurn()
            }
        })
            .desc('Finish your turn')
            .arg({ name: 'category' })
    )
    .sub(
        cmd('scores', (_args, _message, { channel }) => {
            if (noGame(channel)) return

            const { players } = store.get(channel)
            if (Object.keys(players).length === 0) {
                bot.msg(channel, 'No scores to show')
                return
            }
            bot.msg(channel, pre(table(
                Object.keys(players).map(player => bot.getUserById(player).name),
                [...Object.keys(rules), 'upper_section', 'lower_section', 'total'],
                Object.values(players).map(player => {
                    const {
                        ones, twos, threes, fours, fives, sixes,
                        three_of_a_kind, four_of_a_kind, full_house,
                        small_straight, large_straight, yahtzee, chance
                    } = player.categories
                    const upper_section = ones + twos + threes + fours + fives + sixes
                    const lower_section = three_of_a_kind + four_of_a_kind + full_house
                    + small_straight + large_straight + yahtzee + chance
                    return {
                        ...player.categories,
                        upper_section,
                        lower_section,
                        total: upper_section + lower_section
                    }
                })
            )))
        })
            .desc('Print the scoresheet')
    )
    .sub(
        cmd('dice', (_args, _message, { channel, user }) => {
            if (noGame(channel) || notInGame(channel, user)) return

            const player = store.get([channel, 'players', user.id])
            if (!player) {
                if (store.get([channel, 'turns']) > 0) {
                    bot.msg(channel, `You're not in this game ${tag(user)}`)
                } else {
                    bot.msg(channel, `You haven't rolled yet ${tag(user)}`)
                }
                return
            }

            if (player.dice[0] === null) {
                bot.msg(channel, `You haven't rolled yet ${tag(user)}`)
                return
            }

            bot.msg(channel, diceStatus(user, player.dice))
        })
            .desc('Show your dice')
    )
    .sub(
        cmd('help', (_args, _message, { channel }) => {
            const defs = {
                ones: 'Sum of ones',
                twos: 'Sum of twos',
                threes: 'Sum of threes',
                fours: 'Sum of fours',
                fives: 'Sum of fives',
                sixes: 'Sum of sixes',
                three_of_a_kind: 'At least three dice the same (+sum of all)',
                four_of_a_kind: 'At least four dice the same (+sum of all)',
                full_house: 'Three of one number of two of another (+25)',
                small_straight: 'Four sequential dice (+30)',
                large_straight: 'Five sequential dice (+40)',
                yahtzee: 'All five dice the same (+50)',
                chance: 'Any combination (+sum of all)'
            }
            bot.msg(channel, pre(table(
                ['description'],
                Object.keys(defs),
                [defs]
            )))
        })
            .desc('Get Yahtzee! game help')
    )
