import bot from '../../bot'
import { cmd } from '../../command'
import { pre } from '../../util'
import { toCards } from './card'
import { renderHand, renderMini } from './render'
import Store from '../../store'
import { create as createDeck, shuffle, draw } from './deck'
import { err } from '../../user-error'

const store = new Store('cards', { deck: [] })

bot.cmd('cards', (_args, _message, { channel }) => bot.msg(channel, 'Try `help cards`'))
    .desc('Card and deck commands')
    .sub(
        cmd('render', (args, _message, { channel }) => {
            bot.msg(channel, pre(renderHand(toCards(args))))
        })
            .desc('Render one or more cards')
            .arg({ name: 'cards', required: true })
    )

bot.cmd('deck', (_args, _message, { channel }) => {
    const deck = store.get('deck')
    if (deck.length === 0) {
        err('No deck stored - generate one with `deck new`')
    }
    bot.msg(channel, deck.map(renderMini).join(', '))
})
    .desc('Print the current deck')
    .sub(
        cmd('new', (_args, _message, { channel }) => {
            store.commit('deck', createDeck())
            bot.msg(channel, 'Generated a new deck')
        })
            .desc('Generate a new deck')
    )
    .sub(
        cmd('shuffle', (_args, _message, { channel }) => {
            const deck = store.get('deck')
            store.commit('deck', shuffle(deck))
            bot.msg(channel, 'Shuffled deck')
        })
            .desc('Shuffle the current deck')
    )
    .sub(
        cmd('draw', ([num = 1], _message, { channel }) => {
            const deck = store.get('deck')
            const { cards, deck: newDeck } = draw(deck, num)
            store.commit('deck', newDeck)
            bot.msg(channel, `Drew ${cards.length} cards`)
            bot.msg(channel, pre(renderHand(cards)))
        })
            .desc('Draw cards from the top of the deck')
            .arg({ name: 'num', def: 1 })
    )
