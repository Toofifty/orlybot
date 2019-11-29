import bot from 'core/bot';
import { cmd } from 'core/command';
import { User, Dict } from 'core/types';
import Store from 'core/store';
import { tag, userFromTag } from 'core/util';
import { error } from 'core/user-error';
import { create as newDeck, shuffle } from '../cards/deck';
import { makeEffectRunner } from './effects';
import { BlackjackStore, GameStatus, HandStatus, Player } from './types';

// flow:
// [waitingForPlayers]
// `blackjack start` - shuffle players, shuffle deck
// [dealFirst] - deal one to each player in order (show via priv), then dealer
// [waitForBets] - wait for initial bets
// `blackjack bet $n` - put into previous + total (wait for all)
// [dealSecond] - deal one to each player in order (via priv), then dealer
// [waitForBets] - wait for second bets or players to sit
// `blackjack sit` / `blackjack bet $n`
// [dealExtra] - deal to players not sitting
//    - if players busts, broadcast message
// [waitForBets] - only wait for players in 'playing' state
//    - if no players waiting, continue to [showDealerCards]
//    - otherwise, loop back to [dealExtra]
// [showDealerCards] - flip dealer cards #1 and #2
//    - if under 10, draw a card
//    - if under 18, randomly decide to draw or sit
//    - if over, sit
// [payout]
//    - if any player beat the dealer, pay out x2
//    - if they didn't, remove money

const store = Store.create('blackjack', {} as Dict<BlackjackStore>);
const runEffect = makeEffectRunner(store);

const noGame = (send: (text: string) => void, channel: string) => {
    if (store.get([channel]) === undefined) {
        send(
            `There's no blackjack game at the moment in *#${channel}*. ` +
                'Start one with `blackjack new`'
        );
        return true;
    }
    return false;
};

const notInGame = (
    send: (text: string) => void,
    channel: string,
    user: User
) => {
    if (!findPlayer(channel, user)) {
        send(`You're not part of the blackjack game ${tag(user)}`);
        return true;
    }
    return false;
};

const addPlayer = (channel: string, user: User) => {
    const players = store.get([channel, 'players'], []);

    if (findPlayer(channel, user)) {
        error("You're already a part of this game");
    }

    store.commit(
        [channel, 'players'],
        [
            ...players,
            {
                user,
                hand: [],
                previousBet: 0,
                totalBet: 0,
                bank: store.get([channel, 'startingCash']),
                handStatus: HandStatus.playing,
            },
        ]
    );
};

const updatePlayer = (channel: string, player: Player) => {
    const players = store.get([channel, 'players']);
    players.splice(
        players.findIndex(p => p.user.id === player.user.id),
        1,
        player
    );
    store.commit([channel, 'players'], players);
};

const findPlayer = (channel: string, user: User) =>
    store
        .get([channel, 'players'], [])
        .find(player => player.user.id === user.id);

bot.cmd('blackjack', ({ send }) => send('Try `help blackjack`'), 'Gambling!')
    .sub(
        cmd('new', ({ send, channel, user }, [cash = '100']) => {
            if (store.get([channel])) {
                return error(
                    "There's already a game of blackjack running, try `blackjack status`"
                );
            }
            send(`Started a new game of blackjack for #${channel}`);
            send('Use `blackjack join` to join');
            store.commit([channel], {
                players: [],
                dealer: { hand: [] },
                deck: shuffle(newDeck()),
                startingCash: Number(cash),
                status: GameStatus.waitingForPlayers,
            });
            addPlayer(channel, user);
            send(`${tag(user)} joined the game`);
        })
            .desc('Start a new channel-wide game of blackjack')
            .arg({ name: 'starting-cash', def: 100 })
            .arg({ name: 'min-bet', def: 10 })
    )
    .sub(
        cmd('join', ({ send, channel, user }) => {
            if (noGame(send, channel)) return;
            addPlayer(channel, user);
            send(`${tag(user)} joined the game`);
        }).desc('Join the current game of blackjack in the channel')
    )
    .sub(
        cmd('start', ({ send, channel, user }) => {
            if (noGame(send, channel) || notInGame(send, channel, user)) return;
            const status = store.get([channel, 'status']);
            if (status === GameStatus.waitingForPlayers) {
                send('Starting blackjack...');
                store.commit([channel, 'status'], GameStatus.dealFirst);
                runEffect(channel);
            } else {
                error('Blackjack has already been started');
            }
        }).desc('Begin the blackjack game')
    )
    .sub(
        cmd('status', ({ send, channel }) => {
            if (noGame(send, channel)) return;
            const status = store.get([channel, 'status']);
            send(`Status: _${status}_`);
            if (status === GameStatus.waitingForPlayers) {
                const players = store.get([channel, 'players']);
                send(
                    `Players joined:\n${players
                        .map(p => tag(p.user.name))
                        .join(', ')}`
                );
            }
        }).desc('Get the status of the current blackjack game')
    )
    .sub(
        cmd('bet', ({ send, channel, user }, [coins]) => {
            if (noGame(send, channel) || notInGame(send, channel, user)) return;

            const player = findPlayer(channel, user);

            if (player.handStatus === HandStatus.busted)
                return error("You've already gone bust");

            if (player.handStatus === HandStatus.sitting)
                return error("You're already sitting");

            if (player.handStatus === HandStatus.hasBet)
                return error("You've already placed your bet for this round");

            if (player.handStatus === HandStatus.folded)
                return error("You've already folded");

            if (Number(coins) < 0) return error('Nice try.');
            if (Number(coins) < player.previousBet)
                return error(
                    'Your bet needs to be greater than or equal to your previous bet'
                );
            if (Number(coins) > player.bank)
                return error("You don't have enough cash for that");

            player.previousBet = Number(coins);
            player.totalBet += player.previousBet;
            player.bank -= player.previousBet;
            player.handStatus = HandStatus.hasBet;

            updatePlayer(channel, player);

            send(`Bet received from ${tag(user)}`);
            runEffect(channel);
        })
            .desc('Place your bet')
            .arg({ name: 'coins', required: true })
    )
    .sub(
        cmd('cash', ({ send, channel, user }, [player]) => {
            if (noGame(send, channel)) return;
            if (player) {
                const target = userFromTag(player) || bot.getUser(player);
                if (!target) return error("I couldn't find that user");
                if (notInGame(send, channel, target)) return;

                send(
                    `${tag(target)} has ${
                        findPlayer(channel, target).bank
                    } cash`
                );
                return;
            }
            if (notInGame(send, channel, user)) return;

            send(
                `You have ${findPlayer(channel, user).bank} cash (${tag(user)})`
            );
        })
            .desc('Check how much cash you or another player has')
            .arg({ name: 'player' })
    )
    .sub(
        cmd('sit', ({ send, channel, user }) => {
            if (noGame(send, channel) || notInGame(send, channel, user)) return;

            const player = findPlayer(channel, user);

            if (player.hand.length < 2)
                return error("You can't sit with only one card");

            player.handStatus = HandStatus.sitting;

            updatePlayer(channel, player);

            send(`${tag(user)} is now sitting`);

            runEffect(channel);
        }).desc('Sit')
    )
    .sub(
        cmd('next', ({ send, channel }) => {
            if (noGame(send, channel)) return;
            const status = store.get([channel, 'status']);
            send(`Running effect: ${status}`);
            runEffect(channel);
        }).desc('Force the next effect to run (debug)')
    )
    .sub(
        cmd('cancel', ({ send, channel }) => {
            if (noGame(send, channel)) return;
            send('Blackjack cancelled');
            store.commit([channel], undefined);
        }).desc('Stop the current game of blackjack')
    );
