import bot from '../bot'
import cleverbotIO from 'cleverbot.io'
import { tag } from '../util'
import { error } from '../user-error'

if (process.env.CLEVERBOT_ENABLED !== '0') {
    const NAME = 'Fred'

    const cleverbot = new cleverbotIO(
        process.env.CLEVERBOT_USER,
        process.env.CLEVERBOT_KEY
    )

    cleverbot.setNick(NAME)
    cleverbot.create((err, _sess) => {
        if (err) error(err)
        bot.kw(NAME.toLowerCase(), ({ msg, user }, message) => {
            cleverbot.ask(message, (err, res) => {
                if (err) error(err)
                msg(`${tag(user)}: ${res}`)
            })
        })
    })
}
