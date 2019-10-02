export enum Status {
    waitingForPlayers = 'Waiting for players',
    dealFirst = 'Dealing first round',
    waitForBets = 'Waiting for bets',
    dealSecond = 'Dealing second round',
    dealExtra = 'Dealing extra round',
    showDealerCards = 'Show dealer cards',
    payout = 'Pay out',
}

export const makeEffectRunner = store => channel => {};
