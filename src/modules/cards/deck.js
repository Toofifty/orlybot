import { SUITS } from './constants'
import { randint } from '../../util'
import { normval } from './card'

/**
 * Generate a new 52-card deck
 *
 * @return {{ value: string|number, suit: string }[]}
 */
export const create = () => Object.keys(SUITS).reduce((deck, suit) => [
    ...deck,
    ...Array(13).fill(0).map((_, i) => ({
        value: normval(i + 1),
        suit
    }))
], [])

/**
 * Shuffle a deck
 *
 * @param {{ value: string|number, suit: string }[]} deck
 * @return {{ value: string|number, suit: string }[]}
 */
export const shuffle = deck => deck
    .map(card => ({
        card,
        weight: randint(52)
    }))
    .sort((a, b) => Math.sign(a.weight - b.weight))
    .map(({ card }) => card)

/**
 * Draw `num` cards from the top of the deck. Returns cards
 * drawn and new value of the deck
 *
 * @param {{ value: string|number, suit: string }[]} deck
 * @param {number} num
 * @return {{
 *      cards: { value: string|number, suit: string }[],
 *      deck: { value: string|number, suit: string }[]
 * }}
 */
export const draw = (deck, num = 1) => ({
    cards: deck.slice(0, num),
    deck: deck.slice(num)
})
