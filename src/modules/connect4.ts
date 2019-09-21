import bot from '../bot';
import { cmd } from '../command';
import { userFromTag, tag, pre, emoji } from '../util';
import Store from '../store';
import { User, Dict } from 'types';
import { error } from '../user-error';

const EMPTY = ':white_circle:';
const RED = ':red_circle:';
const BLUE = ':large_blue_circle:';

const colours = [EMPTY, RED, BLUE];

interface Connect4Store {
    board: number[][];
    players: [User, User];
    turn: number;
}

const store = Store.create('connect4', {} as Dict<Connect4Store>);

const numberEmoji = (n: number) =>
    emoji(['one', 'two', 'three', 'four', 'five', 'six', 'seven'][n - 1]);

const gamename = (...users: User[]) =>
    users
        .map(u => u.id)
        .sort()
        .join('');

const gameboard = (...users: User[]) => {
    const board = store.get([gamename(...users), 'board']);
    return [
        users.map(user => tag(user.id)).join(' vs '),
        Array(7)
            .fill(0)
            .map((_, i) => numberEmoji(i + 1))
            .join(' '),
        board.map(line => line.map(cell => colours[cell]).join(' ')).join('\n'),
    ].join('\n');
};

const checkPlayers = (user: User, otherTag?: string) => {
    if (!otherTag) {
        error('You need to tag someone to play');
    }
    const other = userFromTag(otherTag);
    if (!other) {
        error(`I don't know who ${otherTag} is`);
    }

    if (store.get([gamename(user, other)]) !== undefined) {
        error(`You're already in a game with ${otherTag}!`);
    }

    return other;
};

bot.cmd('c4', ({ send }) => send('Try `help c4`'))
    .desc('Play connect 4!')
    .sub(
        cmd('new', ({ user, send }, [otherTag]) => {
            const other = checkPlayers(user, otherTag);

            store.commit([gamename(user, other)], {
                board: [...Array(6)].map(_ => Array(7).fill(0)),
                turn: 0,
                players: [user, other],
            });
            send(`Starting new game between ${tag(user)} and ${otherTag}`);
            send(gameboard(user, other));
        })
            .arg({ name: '@player', required: true })
            .desc('Begin a new game of Connect 4 with @player')
    )
    .sub(
        cmd('board', ({ user, send }, [otherTag]) => {
            const other = checkPlayers(user, otherTag);
            send(gameboard(user, other));
        })
            .arg({ name: '@player', required: true })
            .desc('Print out the board for the current game')
    )
    .sub(
        cmd('place', ({ user, send }, [columnArg, otherTag]) => {
            if (!otherTag) {
                send(
                    `You need to tag who you're playing against, like \`c4 place ${columnArg} @user\``
                );
                return;
            }
            const other = checkPlayers(user, otherTag);
            const game = store.get([gamename(user, other)]);
            if (user.id !== game.players[game.turn].id) {
                send(`It's not your turn ${tag(user)}`);
                return;
            }
            const column = Number(columnArg);
            if (!column || column < 1 || column > 7) {
                send(`Not a valid column ${tag(user)}`);
                return;
            }
            for (let i = 5; i >= 0; i--) {
                if (game.board[i][column - 1] === 0) {
                    game.board[i][column - 1] = game.turn + 1;
                    store.commit([gamename(user, other), 'board'], game.board);
                    store.commit(
                        [gamename(user, other), 'turn'],
                        (game.turn + 1) % 2
                    );
                    break;
                }
            }
            send(gameboard(user, other));
        })
            .arg({ name: 'column', required: true })
            .arg({ name: '@player', required: true })
            .desc('Place a token in the column (1-7)')
    )
    .sub(
        cmd('cancel', ({ user, send }, [otherTag]) => {
            const other = checkPlayers(user, otherTag);
            send('Game over man, game over');
            store.commit([gamename(user, other)], undefined);
        })
            .arg({ name: '@player', required: true })
            .desc('Cancel yor game with @player')
    );
