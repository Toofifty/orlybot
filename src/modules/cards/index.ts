import bot from '../../bot';
import { cmd } from '../../command';
import { pre } from '../../util';
import { toCards } from './card';
import { renderHand, renderMini } from './render';
import Store from '../../store';
import { create as createDeck, shuffle, draw } from './deck';
import { error } from '../../user-error';
import { Deck } from './types';

interface CardStore {
    deck: Deck;
}

const store = Store.create<CardStore>('cards', { deck: [] });

bot.cmd('cards', ({ send }) => send('Try `help cards`'))
    .desc('Card and deck commands')
    .sub(
        cmd('render', ({ send }, args) => send(pre(renderHand(toCards(args)))))
            .desc('Render one or more cards')
            .arg({ name: 'cards', required: true })
    );

bot.cmd('deck', ({ send }) => {
    const deck = store.get(['deck']);
    if (deck.length === 0) {
        error('No deck stored - generate one with `deck new`');
    }
    send(deck.map(renderMini).join(', '));
})
    .desc('Print the current deck')
    .sub(
        cmd('new', ({ send }) => {
            store.commit(['deck'], createDeck());
            send('Generated a new deck');
        }).desc('Generate a new deck')
    )
    .sub(
        cmd('shuffle', ({ send }) => {
            const deck = store.get(['deck']);
            store.commit(['deck'], shuffle(deck));
            send('Shuffled deck');
        }).desc('Shuffle the current deck')
    )
    .sub(
        cmd('draw', ({ send }, [num = '1']) => {
            const deck = store.get(['deck']);
            const { cards, deck: newDeck } = draw(deck, Number(num));
            store.commit(['deck'], newDeck);
            send(`Drew ${cards.length} cards`);
            send(pre(renderHand(cards)));
        })
            .desc('Draw cards from the top of the deck')
            .arg({ name: 'num', def: 1 })
    );
