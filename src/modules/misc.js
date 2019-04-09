import bot from '../bot'
import { pickBy, emoji, randint, tag } from '../util'
import request from 'request'
import decode from 'decode-html'

bot.cmd('help', (args, _message, { channel }) => {
    const [cmd] = args
    let commands = bot.getCommands()
    if (cmd) commands = pickBy(commands, key => key === cmd)
    bot.msg(channel, Object.keys(commands).map(key => commands[key].helpMessage()).join('\n'))
})
.arg({ name: 'cmd' })
.desc('Get command list / usage for a command')

bot.cmd('joke', (_args, _message, { channel }) => {
    request('https://official-joke-api.appspot.com/random_joke', (err, _res, body) => {
        if (err) {
            console.error(err)
            return
        }
        const { setup, punchline } = JSON.parse(body)
        bot.msg(channel, decode(setup))
        bot.msg(channel, decode(punchline), 5000)
    })
})
.desc('Funny jokes lmao')

bot.cmd('roll', ([max = 6], _message, { channel, user }) => {
    const result = max > 0 && max <= 9
        ? emoji(
            ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
            [randint(parseInt(max) - 1)]
        )
        : randint(parseInt(max) + 1)
    bot.msg(channel, `${tag(user)} rolled a *${result}*`)
})
.arg({ name: 'sides', def: 6 })
.desc('Roll a dice')

bot.kw('lorenc', (_message, { channel }) => {
    request('https://evilinsult.com/generate_insult.php?lang=en&type=json', (err, _res, body) => {
        if (err) {
            console.error(err)
            return
        }
        const { insult } = JSON.parse(body)
        bot.msg(channel, decode(insult))
    })
})