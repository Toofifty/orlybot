import { Card, CardValue } from '../cards/types';
import { ACE, JACK, QUEEN, KING } from '../cards/constants';

export const getValue = (cards: Card[]) => {
    const aces = cards.filter(({ value }) => value === 'ace');

    let total = cards.reduce((total, { value }) => {
        return total + getNumberValue(value);
    }, 0);

    aces.forEach(() => {
        if (total <= 11) {
            total += 10;
        }
    });

    // bust
    if (total >= 22) return -1;

    if (total === 21 && cards.length === 2) {
        // blackjack
        return 22;
    }

    return total;
};

export const getNumberValue = (value: CardValue) => {
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
