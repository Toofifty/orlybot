import bot from '../bot'
import { cmd } from '../command'
import { userFromTag, tag, pre, emoji } from '../util'
import Store from '../store'

const EMPTY = ':white_circle:'
const RED = ':red_circle:'
const BLUE = ':large_blue_circle:'

const colours = [EMPTY, RED, BLUE]

const numberEmoji = n => emoji([
    'one', 'two', 'three', 'four', 'five', 'six', 'seven'
][n - 1])

const gamename = (...users) => users.map(u => u.id).sort().join('')

const gameboard = (...users) => {
    const board = store.get([gamename(...users), 'board'])
    return [
        users.map(user => tag(user.id)).join(' vs '),
        Array(7).fill().map((_, i) => numberEmoji(i + 1)).join(' '),
        board.map(line => line.map(cell => colours[cell]).join(' ')).join('\n')
    ].join('\n')
}

const store = Store.create('connect4', {})

bot.cmd('c4', ({ msg }) => msg('Try `help c4`'))
    .desc('Play connect 4!')
    .sub(
        cmd('new', ({ user, msg }, [otherTag]) => {
            const other = userFromTag(otherTag)
            if (!other) {
                msg(`I don't know who ${otherTag} is`)
                return
            }
            if (store.get(gamename(user, other)) !== undefined) {
                msg(`You're already in a game with ${otherTag}!`)
                return
            }

            store.commit(gamename(user, other), {
                board: [...Array(6)].map(_ => Array(7).fill(0)),
                turn: 0,
                players: [user, other]
            })
            msg(`Starting new game between ${tag(user)} and ${otherTag}`)
            msg(gameboard(user, other))
        })
    )
    .sub(
        cmd('board', ({ user, msg }, [otherTag]) => {
            const other = userFromTag(otherTag)
            if (!other) {
                msg(`I don't know who ${otherTag} is`)
                return
            }
            if (store.get(gamename(user, other)) === undefined) {
                bot.msg(`You're not in a game with ${otherTag}`)
                return
            }
            msg(gameboard(user, other))
        })
    )
    .sub(
        cmd('place', ({ user, msg }, [column, otherTag]) => {
            if (!otherTag) {
                msg(`You need to tag who you're playing against, like \`c4 place ${column} @user\``)
                return
            }
            const other = userFromTag(otherTag)
            if (!other) {
                msg(`I don't know who ${otherTag} is`)
                return
            }
            const game = store.get(gamename(user, other))
            if (game === undefined) {
                msg(`You're not in a game with ${otherTag}`)
                return
            }
            if (user.id !== game.players[game.turn].id) {
                msg(`It's not your turn ${tag(user)}`)
                return
            }
            column = parseInt(column)
            if (!column || column < 1 || column > 7) {
                msg(`Not a valid column ${tag(user)}`)
                return
            }
            for (let i = 5; i >= 0; i--) {
                if (game.board[i][column - 1] === 0) {
                    console.log('set', i, column - 1)
                    game.board[i][column - 1] = game.turn + 1
                    store.commit([gamename(user, other), 'board'], game.board)
                    store.commit([gamename(user, other), 'turn'], (game.turn + 1) % 2)
                    break
                }
            }
            msg(gameboard(user, other))
        })
    )
    .sub(
        cmd('cancel', ({ user, msg }, [otherTag]) => {
            const other = userFromTag(otherTag)
            if (!other) {
                msg(`I don't know who ${otherTag} is`)
                return
            }
            if (store.get(gamename(user, other)) === undefined) {
                bot.msg(`You're not in a game with ${otherTag}`)
                return
            }
            msg('Game over man, game over')
            store.commit(gamename(user, other), undefined)
        })
    )
    .sub(
        cmd('_eval', ({ msg }, [code]) => {
            msg(pre(eval(code)))
        }).hide()
    )
