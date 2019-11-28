import { print, symbol } from './card';
import { emoji } from '../../util';
import { Card } from './types';

/**
 * Render the value and emoji
 */
export const renderMini = ({ value, suit }: Card) =>
    `${print(value)}${emoji(suit)}`;

/**
 * Render a card for monospace font
 */
export const renderCard = ({ value, suit }: Card) => {
    const spacer = Number(value) !== 10 ? ' ' : '';
    return [
        '┌──┐',
        `│${print(value)}${spacer}│`,
        `│ ${symbol(suit)}│`,
        '└──┘',
    ].join('\n');
};

/**
 * Render multiple cards next to each other
 */
export const renderHand = (cards: Card[]) => {
    return cards
        .map(card => renderCard(card).split('\n'))
        .reduce((hand, card) => {
            card.forEach((line, index) => {
                if (!hand[index]) {
                    hand.push(`${line} `);
                } else {
                    hand[index] += `${line} `;
                }
            });
            return hand;
        }, [])
        .join('\n');
};

export const renderMiniHand = (cards: Card[], brackets: boolean = true) =>
    (brackets ? '[*' : '*') +
    cards.map(renderMini).join(brackets ? '*] [*' : ' ') +
    (brackets ? '*]' : '*');
