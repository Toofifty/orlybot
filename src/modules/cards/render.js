import { print, symbol } from './card'
import { emoji } from '../../util'

/**
 * Render the value and emoji
 *
 * @param {{ value: string|number, suit: string }} card
 * @return {string}
 */
export const renderMini = ({ value, suit }) => `${print(value)}${emoji(suit)}`

/**
 * Render a card for monospace font
 *
 * @param {{ value: string|number, suit: string }} card
 * @return {string}
 */
export const renderCard = ({ value, suit }) => {
    const spacer = Number(value) !== 10 ? ' ' : ''
    return [
        '┌──┐',
        `│${print(value)}${spacer}│`,
        `│ ${symbol(suit)}│`,
        '└──┘'
    ].join('\n')
}

/**
 * Render multiple cards next to each other
 *
 * @param {{ value: string|number, suit: string }[]} cards
 * @return {string}
 */
export const renderHand = cards => {
    return cards
        .map(card => renderCard(card).split('\n'))
        .reduce((hand, card) => {
            card.forEach((line, index) => {
                if (!hand[index]) {
                    hand.push(`${line} `)
                } else {
                    hand[index] += `${line} `
                }
            })
            return hand
        }, [])
        .join('\n')
}
