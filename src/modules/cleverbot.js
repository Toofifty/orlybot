import bot from '../bot'
import cleverbotIO from 'cleverbot.io'
import { tag } from '../util'

if (process.env.CLEVERBOT_ENABLED !== "0") {
    const NAME = 'Fred'

    const cleverbot = new cleverbotIO(
        process.env.CLEVERBOT_USER,
        process.env.CLEVERBOT_KEY
    )

    cleverbot.setNick(NAME)
    cleverbot.create((err, sess) => {
        if (err) {
            console.error(err)
            return
        }
        bot.kw(NAME.toLowerCase(), ({ text }, { channel, user }) => {
            cleverbot.ask(text, (err, res) => {
                if (err) {
                    console.error(err)
                    return
                }
                bot.msg(channel, `${tag(user)}: ${res}`)
            })
        })
    })
}