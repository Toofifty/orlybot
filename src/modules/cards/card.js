import {
    HEARTS,
    CLUBS,
    DIAMONDS,
    SPADES,
    KING,
    QUEEN,
    JACK,
    ACE,
    SUITS
} from './constants'

/**
 * Normalise a suit in any form (single letter, upper/lower case)
 * into the enum value
 *
 * @param {string} suit
 * @return {string}
 */
export const normsuit = suit => {
    try {
        return {
            h: HEARTS,
            c: CLUBS,
            d: DIAMONDS,
            s: SPADES
        }[suit[0].toLowerCase()]
    } catch {
        throw Error(`Invalid suit ${suit}`)
    }
}

/**
 * Normalise any card value in any form (single letter, number, upper/lower case)
 * into the enum value, or keep as number value if it's not a picture card
 *
 * @param {string|number} value
 * @return {string|number}
 */
export const normval = value => {
    if (isNaN(value)) {
        try {
            return {
                a: ACE,
                j: JACK,
                q: QUEEN,
                k: KING
            }[value[0].toLowerCase()]
        } catch {
            throw Error(`Invalid picture card value ${value}`)
        }
    }

    if (value < 1 || value > 13) {
        throw Error(`Invalid card value ${value}`)
    }

    return {
        1: ACE,
        11: JACK,
        12: QUEEN,
        13: KING
    }[value] || value
}

/**
 * Expand many shorthand cards to values and suits
 *
 * @param {string[]} shorts
 * @return {{ value: string|number, suit: string }[]}
 */
export const toCards = shorts => shorts.map(toCard)

/**
 * Expand a shorthand card to a value and suit
 *
 * @param {string} short
 * @return {{ value: string|number, suit: string }}
 */
export const toCard = short => {
    const [, value, suit] = short.match(/^(\d{1,2}|a|j|q|k)(h|c|s|d)$/i)

    if (!value || !suit) {
        throw Error('Invalid card')
    }

    return {
        value: normval(value),
        suit: normsuit(suit)
    }
}

/**
 * Get the symbol for a suit
 *
 * @param {string} suit
 * @return {string}
 */
export const symbol = suit => SUITS[suit]

/**
 * Get the print character/digit for a value
 *
 * @param {string|number} value
 * @return {string|number}
 */
export const print = value => isNaN(value) ? value[0].toUpperCase() : value
