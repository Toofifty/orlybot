import bot from '../bot'
import { pre, randint } from '../util'
import Store from '../store'

const store = Store.create('cards', {
    deck: []
})

const SUITS = Object.freeze({
    HEARTS: '♡',
    CLUBS: '♧',
    DIAMONDS: '♢',
    SPADES: '♤'
})

/**
 * Check if a value and suit are valid
 *
 * @param {string} value
 * @param {string} suit
 */
export const checkValidCard = (value, suit) => {
    if (!Object.keys(SUITS).includes(suit.toUpperCase())) {
        throw Error('Invalid suit')
    }
    if (!isNaN(value)) {
        if (value < 1 || value > 13) {
            throw Error('Invalid number card value')
        }
    } else if (!['ace', 'jack', 'queen', 'king'].includes(value.toLowerCase())) {
        throw Error('Invalid card value')
    }
}

/**
 * Render a card
 *
 * @param {string|number} value
 * @param {string} suit
 * @return {string}
 */
export const renderCard = (value, suit) => {
    if (isNaN(value)) {
        // named cards to first letter
        value = value[0].toUpperCase()
    }
    const spacer = Number(value) !== 10 ? ' ' : ''
    const symbol = SUITS[suit.toUpperCase()]
    return [
        '.--.',
        `|${value}${spacer}|`,
        `| ${symbol}|`,
        '\'--\''
    ].join('\n')
}

export const renderHand = cards => {
    const singleRenders = cards.map(
        ({ value, suit }) => renderCard(value, suit).split('\n')
    )
    return singleRenders.reduce((hand, card) => {
        card.forEach((line, index) => {
            if (!hand[index]) {
                hand.push(`${line} `)
            } else {
                hand[index] += `${line} `
            }
        })
        return hand
    }, []).join('\n')
}

/**
 * Expand a shorthand card to a value and suit
 *
 * @param {string} card
 * @return [string|number,string]
 */
export const expand = card => {
    const [, value, suit] = card.match(/^(\d{1,2}|a|j|q|k)(h|c|s|d)$/i)

    if (!value) {
        throw Error('Invalid card value')
    }

    return [
        {
            a: 'Ace',
            j: 'Jack',
            q: 'Queen',
            k: 'King'
        }[value.toLowerCase()] || Number(value),
        {
            c: 'clubs',
            d: 'diamonds',
            h: 'hearts',
            s: 'spades'
        }[suit.toLowerCase()]
    ]
}

/**
 * Generate a new deck of cards
 *
 * @return {string[]}
 */
export const newDeck = () => Object.keys(SUITS).reduce((deck, suit) => [
    ...deck,
    ...Array(13).fill(0).map((_, i) => `${{
        1: 'A',
        11: 'J',
        12: 'Q',
        13: 'K'
    }[i + 1] || i + 1}${suit[0].toUpperCase()}`)
], [])

/**
 * Shuffle a deck
 *
 * @param {string[]} deck
 */
export const shuffle = deck => deck.map(card => ({
    card,
    weight: randint(52)
}))
    .sort((a, b) => Math.sign(a.weight - b.weight))
    .map(({ card }) => card)

bot.cmd('new-deck', (_args, _message, { channel }) => {
    store.commit('deck', newDeck())
    bot.msg(channel, pre(store.get('deck').join(', ')))
})

bot.cmd('print-deck', (_args, _message, { channel }) => {
    bot.msg(channel, pre(store.get('deck').join(', ')))
})

bot.cmd('shuffle', (_args, _message, { channel }) => {
    store.commit('deck', shuffle(store.get('deck')))
    bot.msg(channel, pre(store.get('deck').join(', ')))
})

bot.cmd('draw', ([num = 1], _message, { channel }) => {
    const cards = []
    Array(Number(num)).fill(0).forEach(() => {
        const [card, ...deck] = store.get('deck')
        store.commit('deck', deck)
        const [value, suit] = expand(card)
        cards.push({ value, suit })
    })
    bot.msg(channel, pre(renderHand(cards)))
})

bot.cmd('card', ([card], _message, { channel }) => {
    const [value, suit] = card.includes('-') ? card.split('-') : expand(card)
    checkValidCard(value, suit)
    bot.msg(channel, pre(renderCard(value, suit)))
})

bot.cmd('hand', (args, _message, { channel }) => {
    const hand = args.map(card => {
        const [value, suit] = card.includes('-') ? card.split('-') : expand(card)
        checkValidCard(value, suit)
        return { value, suit }
    })
    bot.msg(channel, pre(renderHand(hand)))
})
