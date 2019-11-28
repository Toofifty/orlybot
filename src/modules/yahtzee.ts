import bot from '../bot';
import { cmd } from '../command';
import Store, { ChanneledStore } from '../store';
import { pre, tag, emoji, randint, table } from '../util';
import { Dict, User } from 'types';
import { error } from '../user-error';

type Rule = (dice: number[]) => number;

interface YahtzeePlayer {
    categories: Dict<number>;
    rolls: number;
    dice: (number | undefined)[];
}

interface YahtzeeStore {
    players: Dict<YahtzeePlayer>;
    turn: number;
}

const store = Store.create('yahtzee', {} as ChanneledStore<YahtzeeStore>);

/**
 * Sum of dice
 */
const sum = (dice: number[]) => dice.reduce((sum, die) => sum + die, 0);

/**
 * Generate range array (inclusive)
 */
const r = (start: number, end: number) =>
    [...Array(end - start + 1).keys()].map(n => n + start);

/**
 * Check if dice have all wanted values
 */
const has = (dice: number[], want: number[]) =>
    want.filter(num => dice.includes(num)).length === want.length;

/**
 * Check for n of a kind
 */
const ofAKind = (dice: number[], n: number) => {
    const kinds = dice.reduce(
        (kinds, dice) => {
            kinds[dice - 1]++;
            return kinds;
        },
        [0, 0, 0, 0, 0, 0]
    );
    return kinds.filter(kind => kind >= n).length > 0;
};

/**
 * Check for full house
 */
const isFullHouse = (dice: number[]) => {
    const kinds = dice.reduce(
        (kinds, dice) => {
            kinds[dice - 1]++;
            return kinds;
        },
        [0, 0, 0, 0, 0, 0]
    );
    return (
        kinds.filter(kind => kind === 2).length > 0 &&
        kinds.filter(kind => kind === 3).length > 0
    );
};

/**
 * Rule definitions
 */
const rules: Dict<Rule> = {
    ones: dice => sum(dice.filter(die => die === 1)),
    twos: dice => sum(dice.filter(die => die === 2)),
    threes: dice => sum(dice.filter(die => die === 3)),
    fours: dice => sum(dice.filter(die => die === 4)),
    fives: dice => sum(dice.filter(die => die === 5)),
    sixes: dice => sum(dice.filter(die => die === 6)),
    three_of_a_kind: dice => (ofAKind(dice, 3) ? sum(dice) : 0),
    four_of_a_kind: dice => (ofAKind(dice, 4) ? sum(dice) : 0),
    full_house: dice => (isFullHouse(dice) ? 25 : 0),
    small_straight: dice =>
        has(dice, r(1, 4)) || has(dice, r(2, 5)) || has(dice, r(3, 6)) ? 30 : 0,
    large_straight: dice => (has(dice, r(1, 5)) || has(dice, r(2, 6)) ? 40 : 0),
    yahtzee: dice => (ofAKind(dice, 5) ? 50 : 0),
    chance: dice => sum(dice),
};

/**
 * Get dice emoji for number
 */
const diceEmoji = (n: number) =>
    emoji(['one', 'two', 'three', 'four', 'five', 'six'][n - 1]);

/**
 * Get dice status message for user
 */
const diceStatus = (user: User, dice: number[]) =>
    `${tag(user)}: ${dice.map(diceEmoji).join(' ')}`;

/**
 * Check if there is no game for the channel (and send channel)
 */
const noGame = (send: (text: string) => void, channel: string) => {
    if (store.get([channel]) === undefined) {
        send(`There's no Yahtzee! game at the moment in *#${channel}*`);
        return true;
    }
    return false;
};

/**
 * Check if the user is in the game (and send channel)
 */
const notInGame = (
    send: (text: string) => void,
    channel: string,
    user: User
) => {
    if (
        store.get([channel, 'turn']) > 0 &&
        !store.get([channel, 'players', user.id])
    ) {
        send(`You're not in this game ${tag(user)}`);
        return true;
    }
    return false;
};

const getTotal = (player: YahtzeePlayer) => {
    const {
        ones,
        twos,
        threes,
        fours,
        fives,
        sixes,
        three_of_a_kind,
        four_of_a_kind,
        full_house,
        small_straight,
        large_straight,
        yahtzee,
        chance,
    } = player.categories;
    const upper_section = sum([ones, twos, threes, fours, fives, sixes]);
    const lower_section = sum([
        three_of_a_kind,
        four_of_a_kind,
        full_house,
        small_straight,
        large_straight,
        yahtzee,
        chance,
    ]);
    return {
        ...player.categories,
        upper_section,
        lower_section,
        total: upper_section + lower_section,
    };
};

const getTotals = (players: Dict<YahtzeePlayer>) =>
    Object.values(players).map(getTotal);

bot.cmd('yz', ({ send }) => send('Try `help yz`'))
    .desc('Play Yahtzee!')
    .sub(
        cmd('new', ({ send, channel, user }) => {
            if (
                store.get([channel]) !== undefined &&
                store.get([channel, 'turn']) > 0 &&
                !store.get([channel, 'players', user.id])
            ) {
                send(`You can't reset a game you're not in ${tag(user)}`);
                return;
            }

            store.commit([channel], {
                players: {},
                turn: 0,
            });
            send('Starting a new game of Yahtzee!');
        }).desc('Create a new game of Yahtzee!')
    )
    .sub(
        cmd('cancel', ({ send, channel, user }) => {
            if (noGame(send, channel) || notInGame(send, channel, user)) return;

            send('Resetting Yahtzee! :(');
            store.commit([channel], { players: {}, turn: 0 });
        }).desc('Cancel the current Yahtzee! game')
    )
    .sub(
        cmd('roll', ({ send, channel, user }, [dice = '1,2,3,4,5']) => {
            if (noGame(send, channel) || notInGame(send, channel, user)) return;

            const player = store.get([channel, 'players', user.id], {
                categories: Object.keys(rules).reduce(
                    (cats, cat) => ((cats[cat] = null), cats),
                    {}
                ),
                rolls: 0,
                dice: Array(5),
            });

            if (player.rolls >= 4) {
                send(`You've had your turn ${tag(user)}`);
                return;
            }

            if (player.rolls === 3) {
                send(
                    `You're out of rolls, pick your category with \`yahtzee! save [cat]\` to continue
                    ${diceStatus(user, player.dice)}`
                );
                return;
            }

            if (player.dice[0] === undefined) dice = '1,2,3,4,5';

            dice.split(',')
                .map(Number)
                .forEach(num => {
                    if (num > 0 && num <= 5)
                        player.dice[num - 1] = randint(6) + 1;
                });

            send(diceStatus(user, player.dice));
            store.commit([channel, 'players', user.id, 'dice'], player.dice);
            store.commit(
                [channel, 'players', user.id, 'rolls'],
                player.rolls + 1
            );
        })
            .desc('Roll your dice')
            .arg({
                name: 'dice-numbers',
                def: '1,2,3,4,5',
                validator: value => {
                    const nums = value.split(',').map(Number);
                    if (nums.length > 5) {
                        error('Too many dice specified');
                    }
                    nums.forEach(num => {
                        if (isNaN(num) || num < 1 || num > 5) {
                            error(
                                'You can only specify dice numbers between 1 and 5'
                            );
                        }
                    });
                },
            })
    )
    .sub(
        cmd('save', ({ send, channel, user }, categories) => {
            if (noGame(send, channel)) return;

            const category = categories.join(' ');
            const cat = category.toLowerCase().replace(/ /g, '_');

            if (!rules[cat]) {
                send(`Unknown category *${cat}*, try \`yz help\``);
                return;
            }

            const player = store.get([channel, 'players', user.id]);

            if (!player) {
                if (store.get([channel, 'turn']) > 0) {
                    send(`You're not in this game ${tag(user)}`);
                } else {
                    send(`You haven't rolled yet ${tag(user)}`);
                }
                return;
            }

            if (player.categories[cat] !== null) {
                send(`You've already filled that box ${tag(user)}`);
                return;
            }

            const result = rules[cat](player.dice);
            send(`${tag(user)} *+${result}* points for *${category}*`);
            store.commit(
                [channel, 'players', user.id, 'categories', cat],
                result
            );
            store.commit([channel, 'players', user.id, 'dice'], Array(5));
            store.commit([channel, 'players', user.id, 'rolls'], 4);

            const { players, turn } = store.get([channel]);

            // check to switch to new turn
            // make sure all players have 4 rolls
            const newTurn = !Object.values(players).some(
                ({ rolls }) => rolls < 4
            );

            // start next turn
            const nextTurn = () => {
                send(`Yahtzee: turn *${turn + 2}*`);
                Object.keys(players).forEach(player => {
                    store.commit([channel, 'players', player, 'rolls'], 0);
                });
                store.commit([channel, 'turn'], turn + 1);
            };

            if (newTurn) {
                if (turn === 0) {
                    // allow new people to join the game before second turn
                    send('Ready for the second turn? Say `next turn`');
                    bot.kw('next turn', () => {
                        nextTurn();
                        bot.kw('next turn', null);
                    });
                    return;
                }
                nextTurn();
            }
        })
            .desc('Finish your turn')
            .arg({ name: 'category', required: true })
    )
    .sub(
        cmd('scores', ({ send, channel }) => {
            if (noGame(send, channel)) return;

            const { players } = store.get([channel]);
            if (Object.keys(players).length === 0) {
                send('No scores to show');
                return;
            }
            send(
                pre(
                    table(
                        Object.keys(players).map(
                            player => bot.getUserById(player).name
                        ),
                        [
                            ...Object.keys(rules),
                            'upper_section',
                            'lower_section',
                            'total',
                        ],
                        getTotals(players)
                    )
                )
            );
        }).desc('Print the scoresheet')
    )
    .sub(
        cmd('dice', ({ send, channel, user }) => {
            if (noGame(send, channel) || notInGame(send, channel, user)) return;

            const player = store.get([channel, 'players', user.id]);
            if (!player) {
                if (store.get([channel, 'turn']) > 0) {
                    send(`You're not in this game ${tag(user)}`);
                } else {
                    send(`You haven't rolled yet ${tag(user)}`);
                }
                return;
            }

            if (player.dice[0] === null) {
                send(`You haven't rolled yet ${tag(user)}`);
                return;
            }

            send(diceStatus(user, player.dice));
        }).desc('Show your dice')
    )
    .sub(
        cmd('help', ({ send }) => {
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
                chance: 'Any combination (+sum of all)',
            };
            send(pre(table(['description'], Object.keys(defs), [defs])));
        }).desc('Get Yahtzee! game help')
    );
