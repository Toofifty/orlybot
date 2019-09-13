import bot from '../../bot'
import { cmd } from '../../command'
import { pre } from '../../util'
import { toCards } from './card'
import { renderHand, renderMini } from './render'
import Store from '../../store'
import { create as createDeck, shuffle, draw } from './deck'
import { error } from '../../user-error'

const store = new Store('cards', { deck: [] })

bot.cmd('cards', ({ msg }) => msg('Try `help cards`'))
    .desc('Card and deck commands')
    .sub(
        cmd('render', ({ msg }, args) => msg(pre(renderHand(toCards(args)))))
            .desc('Render one or more cards')
            .arg({ name: 'cards', required: true })
    )

bot.cmd('deck', ({ msg }) => {
    const deck = store.get('deck')
    if (deck.length === 0) {
        error('No deck stored - generate one with `deck new`')
    }
    msg(deck.map(renderMini).join(', '))
})
    .desc('Print the current deck')
    .sub(
        cmd('new', ({ msg }) => {
            store.commit('deck', createDeck())
            msg('Generated a new deck')
        })
            .desc('Generate a new deck')
    )
    .sub(
        cmd('shuffle', ({ msg }) => {
            const deck = store.get('deck')
            store.commit('deck', shuffle(deck))
            msg('Shuffled deck')
        })
            .desc('Shuffle the current deck')
    )
    .sub(
        cmd('draw', ({ msg }, [num = 1]) => {
            const deck = store.get('deck')
            const { cards, deck: newDeck } = draw(deck, num)
            store.commit('deck', newDeck)
            msg(`Drew ${cards.length} cards`)
            msg(pre(renderHand(cards)))
        })
            .desc('Draw cards from the top of the deck')
            .arg({ name: 'num', def: 1 })
    )
