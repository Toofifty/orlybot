import bot from '../bot'
import { tag, ticks, pre } from '../util'
import userdata from '../userdata'

bot.cmd('_users', (_args, _message, { channel }) => {
    bot.msg(channel, JSON.stringify(bot.users))
}).hide()

bot.cmd('_channels', (_args, _message, { channel }) => {
    bot.msg(channel, JSON.stringify(bot.users))
}).hide()

bot.cmd('_me', (_args, _message, { user, channel }) => {
    bot.msg(channel, `${tag(user)} ID: ${ticks(user.id)}`)
}).hide()

bot.cmd('_userdata', ([other], _message, { user, channel }) => {
    if (other) user = bot.getUser(other)
    bot.msg(channel, pre(JSON.stringify(userdata.all(user))))
}).hide()

bot.cmd('_priv', (_args, _message, { user }) => {
    bot.priv(user, 'hello!')
}).hide()

bot.cmd('_eval', ([code], { text }, { user, channel }) => {
    bot.msg(channel, pre(eval(code)))
}).hide()

bot.cmd('_kw', (_args, _message, { channel, user }) => {
    bot.msg(
        channel,
        Object.keys(bot.keywords).map(ticks).join(' ') || 'Nothing interesting happens.'
    )
}).hide()

bot.cmd('_tok', (args, _message, { channel }) => {
    bot.msg(channel, args.map(ticks).join(' '))
}).hide()