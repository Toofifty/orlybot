import bot from '../bot'
import { pickBy, emoji, randint, tag } from '../util'
import request from 'request'
import decode from 'decode-html'

bot.cmd('help', ({ msg }, [cmd]) => {
    let commands = bot.getCommands()
    if (cmd) commands = pickBy(commands, key => key === cmd)
    msg(
        Object.keys(commands).map(key => commands[key].help).join('\n')
        || 'Nothing interesting happens'
    )
})
    .arg({ name: 'cmd' })
    .desc('Get command list / usage for a command')

bot.cmd('joke', ({ msg }) => {
    request('https://official-joke-api.appspot.com/random_joke', (err, _res, body) => {
        if (err) {
            console.error(err)
            return
        }
        const { setup, punchline } = JSON.parse(body)
        msg(decode(setup))
        msg(decode(punchline), 5000)
    })
})
    .desc('Funny jokes lmao')

bot.cmd('roll', ({ msg, user }, [max = 6]) => {
    const result = max > 0 && max <= 9
        ? emoji(
            [
                'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'
            ][randint(parseInt(max) - 1)]
        )
        : randint(parseInt(max) + 1)
    msg(`${tag(user)} rolled a *${result}*`)
})
    .arg({ name: 'sides', def: 6 })
    .desc('Roll a dice')

bot.cmd('poker', ({ msg }) => {
    msg('lmao u wish')
}).desc('Play a game of poker!')
