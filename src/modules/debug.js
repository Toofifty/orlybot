import bot from '../bot'
import { tag, ticks, pre } from '../util'
import userdata from '../userdata'
import Store from '../store'

bot.cmd('_users', ({ msg }) => {
    msg(JSON.stringify(bot.users))
}).hide()

bot.cmd('_channels', ({ msg }) => {
    msg(JSON.stringify(bot.users))
}).hide()

bot.cmd('_me', ({ user, msg }) => {
    msg(`${tag(user)} ID: ${ticks(user.id)}`)
}).hide()

bot.cmd('_userdata', ({ user, msg }, [other]) => {
    if (other) user = bot.getUser(other)
    msg(pre(JSON.stringify(userdata.all(user))))
}).hide()

bot.cmd('_store', async ({ msg }, [store]) => {
    msg(pre(JSON.stringify((await Store.createAsync(store)).data)))
}).hide()

bot.cmd('_priv', ({ user }) => {
    bot.priv(user, 'hello!')
}).hide()

bot.cmd('_eval', ({ msg }, [code]) => {
    msg(pre(eval(code)))
}).hide()

bot.cmd('_kw', ({ msg }) => {
    msg(Object.keys(bot.keywords).map(ticks).join(' ') || 'Nothing interesting happens.')
}).hide()

bot.cmd('_tok', ({ msg }, args) => {
    msg(args.map(ticks).join(' '))
}).hide()
