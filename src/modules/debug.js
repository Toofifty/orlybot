import bot from '../bot'
import { tag, ticks } from '../util'

bot.cmd('_users', (_args, _message, { channel }) => {
    bot.msg(channel, JSON.stringify(bot.users))
}).hide()

bot.cmd('_channels', (_args, _message, { channel }) => {
    bot.msg(channel, JSON.stringify(bot.users))
}).hide()

bot.cmd('_me', (_args, _message, { user, channel }) => {
    bot.msg(channel, tag(user))
}).hide()

bot.cmd('_priv', (_args, _message, { user }) => {
    bot.priv(user, 'hello!')
}).hide()

bot.cmd('_eval', (_args, { text }, { user, channel }) => {
    if (!text.includes('`')) {
        bot.msg(channel, 'Nothing interesting happens.')
        return
    }
    let [, code] = text.match(/_eval\s+`(.+)`/)
    code = code
        .replace(/while/, 'whle')
        .replace(/do\s*{/, 'doot')
        .replace(/process/, 'prcss')
    bot.msg(channel, '```' + eval(code) + '```')
}).hide()

bot.cmd('_kw', (_args, _message, { user, channel }) => {
    bot.msg(
        channel,
        Object.keys(bot.keywords).map(ticks).join(' ') || 'Nothing interesting happens.'
    )
}).hide()