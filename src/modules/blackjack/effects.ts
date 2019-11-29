import Store from 'core/store';
import { Dict } from 'core/types';
import bot from 'core/bot';
import { pre, tag, randint } from 'core/util';
import { BlackjackStore, GameStatus, Player, HandStatus } from './types';
import { shuffle, draw } from '../cards/deck';
import { renderHand, renderMiniHand } from '../cards/render';
import { getValue } from './cards';

export const makeEffectRunner = (store: Store<Dict<BlackjackStore>>) => (
    channel: string
) => {
    const status = store.get([channel, 'status']);

    const runEffect = makeEffectRunner(store);

    const updateGameStatus = (status: GameStatus) => {
        store.commit([channel, 'status'], status);
        bot.send(channel, `Status: _${status}_`);
    };

    const shuffleDeck = () => {
        const deck = store.get([channel, 'deck']);
        store.commit([channel, 'deck'], shuffle(deck));
    };

    const drawCard = () => {
        const { cards, deck } = draw(store.get([channel, 'deck']));
        store.commit([channel, 'deck'], deck);
        return cards.shift();
    };

    const drawPlayer = (player: Player) => {
        player.hand.push(drawCard());
        bot.priv(
            player.user,
            `${renderMiniHand(
                player.hand
            )} is your blackjack hand in the #${channel} game`
        );

        if (getValue(player.hand) === -1) {
            bot.send(channel, `Oops! ${tag(player.user)} went bust!`);
            bot.send(
                channel,
                `${tag(player.user)}'s cards:\n ${pre(renderHand(player.hand))}`
            );

            player.handStatus = HandStatus.busted;
        }

        updatePlayer(player);
    };

    const drawDealer = (render: boolean = true) => {
        const hand = store.get([channel, 'dealer', 'hand']);
        hand.push(drawCard());
        store.commit([channel, 'dealer', 'hand'], hand);
        render &&
            bot.send(
                channel,
                `Dealer's hand:\n${Array(hand.length)
                    .fill(':black_joker:')
                    .join(' ')}`
            );
    };

    const updatePlayer = (player: Player) => {
        const players = store.get([channel, 'players']);
        players.splice(
            players.findIndex(p => p.user.id === player.user.id),
            1,
            player
        );
        store.commit([channel, 'players'], players);
    };

    const showPlayerBets = () => {
        bot.send(
            channel,
            store
                .get([channel, 'players'])
                .map(
                    player =>
                        `${tag(player.user)} - ${Array(player.hand.length)
                            .fill(':black_joker:')
                            .join('')} - bet: ${player.totalBet}`
                )
                .join('\n')
        );
    };

    const effects = {
        [GameStatus.dealFirst]: () => {
            shuffleDeck();
            store.get([channel, 'players']).forEach(drawPlayer);
            drawDealer();
            updateGameStatus(GameStatus.waitForBets);
        },
        [GameStatus.dealSecond]: () => {
            store.get([channel, 'players']).forEach(drawPlayer);
            drawDealer();
            updateGameStatus(GameStatus.waitForBets);
        },
        [GameStatus.dealExtra]: () => {
            store
                .get([channel, 'players'])
                .filter(p => p.handStatus === HandStatus.playing)
                .forEach(drawPlayer);
            updateGameStatus(GameStatus.waitForBets);
        },
        [GameStatus.waitForBets]: () => {
            const players = store.get([channel, 'players']);
            if (players.every(p => p.handStatus !== HandStatus.playing)) {
                bot.send(channel, 'All bets placed!');
                showPlayerBets();
                if (players.every(p => p.hand.length === 1)) {
                    updateGameStatus(GameStatus.dealSecond);
                } else if (
                    players.every(p => p.handStatus !== HandStatus.hasBet)
                ) {
                    updateGameStatus(GameStatus.showDealerCards);
                } else {
                    updateGameStatus(GameStatus.dealExtra);
                }
                players.forEach(p => {
                    if (p.handStatus === HandStatus.hasBet) {
                        p.handStatus = HandStatus.playing;
                        updatePlayer(p);
                    }
                });
                runEffect(channel);
            }
        },
        [GameStatus.showDealerCards]: () => {
            let hand = store.get([channel, 'dealer', 'hand']);

            bot.send(channel, '_The dealer is drawing cards_');
            bot.send(channel, pre(renderHand(hand)));

            while (getValue(hand) < 18) {
                if (getValue(hand) === -1) {
                    bot.send(channel, 'Dealer busts!');
                    break;
                }

                if (getValue(hand) === 22) {
                    bot.send(channel, 'Dealer got blackjack!');
                    break;
                }

                if (getValue(hand) >= 18) {
                    bot.send(
                        channel,
                        `Dealer sits on ${renderMiniHand(hand)}.`
                    );
                    break;
                }

                if (getValue(hand) > 11) {
                    // random chance to draw
                    if (randint(10) < 21 - getValue(hand)) {
                        bot.send(
                            channel,
                            `Dealer sits on ${renderMiniHand(hand)}.`
                        );
                        break;
                    } else {
                        bot.send(channel, 'Dealer draws.');
                        drawDealer();
                        hand = store.get([channel, 'dealer', 'hand']);
                    }
                } else {
                    // always draw <= 11
                    bot.send(channel, 'Dealer draws.');
                    drawDealer();
                    hand = store.get([channel, 'dealer', 'hand']);
                }

                bot.send(channel, pre(renderHand(hand)));
            }

            if (getValue(hand) < 22 && getValue(hand) > 0) {
                bot.send(channel, `Paying out *${getValue(hand) + 1}+*`);
            }

            store.get([channel, 'players']).forEach(player => {
                bot.send(
                    channel,
                    `${tag(player.user)} - ${getValue(
                        player.hand
                    )} - ${renderMiniHand(player.hand)}`
                        .replace(' 22 ', 'blackjack')
                        .replace(' -1 ', 'bust')
                );
                if (getValue(player.hand) > getValue(hand)) {
                    bot.send(
                        channel,
                        `${tag(player.user)} won ${player.totalBet} coins!`
                    );
                    player.bank += player.totalBet;
                } else {
                    bot.send(
                        channel,
                        `${tag(player.user)} lost ${player.totalBet} coins :(`
                    );
                }
                player.previousBet = 0;
                player.totalBet = 0;
                player.hand = [];
                player.handStatus = HandStatus.playing;
                updatePlayer(player);
            });

            store.commit([channel, 'dealer', 'hand'], []);

            updateGameStatus(GameStatus.dealFirst);
        },
    };

    effects[status]();
};
