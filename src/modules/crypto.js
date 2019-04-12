import bot from '../bot'
import request from 'request'
import { randcolour } from '../util'

bot.cmd('crypto', ([primary = 'BTC', secondary = 'USD'], _message, { channel }) => {
    primary = primary.toUpperCase()
    secondary = secondary.toUpperCase()

    request({
        url: 'https://min-api.cryptocompare.com/data/pricemultifull'
            + `?fsyms=${primary}&tsyms=${secondary}&api_key=${process.env.CRYPTO_API}`,
        json: true
    }, (err, _res, body) => {
        if (err) {
            console.error(err)
            return
        }
        try {
            const content = body.RAW[primary][secondary]
            bot.msgAttachment(channel, '', {
                attachments: [{
                    fallback: 'Lorenc sucks ass',
                    color: randcolour(),
                    title: `${primary}/${secondary} Price Information`,
                    fields: [
                        {
                            title: 'Price',
                            value: `${content.PRICE < 1 ? content.PRICE : content.PRICE.toLocaleString()} ${content.TOSYMBOL}`,
                            short: true
                        },
                        {
                            title: 'Market Cap',
                            value: `${content.MKTCAP < 1 ? content.MKTCAP : content.MKTCAP.toLocaleString()} ${content.TOSYMBOL}`,
                            short: true
                        }
                    ],
                    thumb_url: `https://www.cryptocompare.com/${content.IMAGEURL}`,
                    ts: +Date.now() / 1000
                }]
            })
        } catch (e) {
            console.error(e)
            bot.msg(channel, e)
        }
    })
})
    .desc('Shows the current price of a particular cryptocurrency pair.')
    .arg({ name: 'primary', def: 'BTC' })
    .arg({ name: 'secondary', def: 'USD' })
