export type CardValue = string | number;

export interface Card {
    value: CardValue;
    suit: string;
}

export type Deck = Card[];
