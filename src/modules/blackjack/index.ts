import bot from '../../bot';
import { cmd } from '../../command';
import { User, Dict } from '../../types';
import { Card, Deck, CardValue } from '../cards/types';
import Store from '../../store';
import { create as newDeck, shuffle } from '../cards/deck';
import { tag } from '../../util';
import { ACE, JACK, QUEEN, KING } from '../cards/constants';
import { error } from '../../user-error';
import { makeEffectRunner, Status } from './effects';

enum HandStatus {
    playing = 'Playing',
    sitting = 'Sitting',
    folded = 'Folded',
    busted = 'Busted',
}

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

interface Player {
    user: User;
    hand: Card[];
    previousBet: number;
    totalBet: number;
    bank: number;
    handStatus: HandStatus;
}

interface Dealer {
    hand: Card[];
}

interface BlackjackStore {
    players: Player[];
    dealer: Dealer;
    deck: Deck;
    startingCash: number;
    status: Status;
}

const store = Store.create('blackjack', {} as Dict<BlackjackStore>);
const runEffect = makeEffectRunner(store);

const getValue = (cards: Card[]) => {
    const aces = cards.filter(({ value }) => value === 'ace');

    let total = cards.reduce((total, { value }) => {
        return total + getNumberValue(value);
    }, 0);

    aces.forEach(() => {
        if (total <= 11) {
            total += 10;
        }
    });

    if (total === 21 && cards.length === 2) {
        // blackjack
        return 22;
    }

    return total;
};

const getNumberValue = (value: CardValue) => {
    if (typeof value === 'string') {
        return {
            [ACE]: 1,
            [JACK]: 10,
            [QUEEN]: 10,
            [KING]: 10,
        }[value];
    }
    return value;
};

const addPlayer = (channel: string, user: User) => {
    store.commit(
        [channel, 'players'],
        [
            ...store.get([channel, 'players'], []),
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

bot.cmd('blackjack')
    .sub(
        cmd('new', ({ send, channel, user }, [cash = '100']) => {
            send(`Started a new game of blackjack for #${channel}`);
            store.commit([channel], {
                players: [],
                dealer: { hand: [] },
                deck: shuffle(newDeck()),
                startingCash: Number(cash),
                status: Status.waitingForPlayers,
            });
        })
            .desc('Start a new channel-wide game of blackjack')
            .arg({
                name: 'starting-cash',
                def: 100,
            })
    )
    .sub(
        cmd('join', ({ send, channel, user }) => {
            addPlayer(channel, user);
            send(`${tag(user)} joined the game`);
        }).desc('Join the current game of blackjack in the channel')
    )
    .sub(
        cmd('start', ({ send, channel, user }) => {
            const status = store.get([channel, 'status']);
            if (status === Status.waitingForPlayers) {
                send('Starting blackjack...');
                store.commit([channel, 'status'], Status.dealFirst);
                runEffect(channel);
            } else {
                error('Blackjack has already been started');
            }
        })
    );
