import { Deck, Card } from '../cards/types';
import { User } from '../../types';

export enum HandStatus {
    playing = 'Playing',
    sitting = 'Sitting',
    hasBet = 'Has bet',
    folded = 'Folded',
    busted = 'Busted',
}

export enum GameStatus {
    waitingForPlayers = 'Waiting for players',
    dealFirst = 'Dealing first round',
    waitForBets = 'Waiting for bets',
    dealSecond = 'Dealing second round',
    dealExtra = 'Dealing extra round',
    showDealerCards = 'Show dealer cards',
    payout = 'Pay out',
}

export interface Player {
    user: User;
    hand: Card[];
    previousBet: number;
    totalBet: number;
    bank: number;
    handStatus: HandStatus;
}

export interface Dealer {
    hand: Card[];
}

export interface BlackjackStore {
    players: Player[];
    dealer: Dealer;
    deck: Deck;
    startingCash: number;
    status: GameStatus;
}
