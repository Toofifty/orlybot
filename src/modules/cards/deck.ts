import { SUITS } from './constants';
import { randint } from '../../util';
import { normval } from './card';
import { Deck } from './types';

/**
 * Generate a new 52-card deck
 */
export const create = (): Deck =>
    Object.keys(SUITS).reduce(
        (deck, suit) => [
            ...deck,
            ...Array(13)
                .fill(0)
                .map((_, i) => ({
                    value: normval(i + 1),
                    suit,
                })),
        ],
        []
    );

/**
 * Shuffle a deck
 */
export const shuffle = (deck: Deck) =>
    deck
        .map(card => ({
            card,
            weight: randint(52),
        }))
        .sort((a, b) => Math.sign(a.weight - b.weight))
        .map(({ card }) => card);

/**
 * Draw `num` cards from the top of the deck. Returns cards
 * drawn and new value of the deck
 */
export const draw = (deck: Deck, num = 1) => ({
    cards: deck.slice(0, num),
    deck: deck.slice(num),
});
