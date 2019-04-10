import bot from '../bot'
// import fs from 'fs'
import request from 'request'



bot.cmd('crypto', ([primary = 'BTC', secondary = 'USD'], _message, { channel }) => {
    console.log('test');
    primary = primary.toUpperCase()
    secondary = secondary.toUpperCase()

    request({
        url: `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${primary}&tsyms=${secondary}&api_key=`,
        json: true
    }, (err, _res, body) => {
        try {
            const content = body.RAW[primary][secondary]
            bot.msgAttachment(meta., '', {
                'attachments': [
                    {
                        'fallback': 'Required plain-text summary of the attachment.',
                        'color': '#' + make_colour(6),
                        'title': `${primary}/${secondary} Price Information`,
                        'fields': [
                            {
                                'title': `Price`,
                                'value': content.PRICE.toLocaleString() + ' ' + content.TOSYMBOL,
                                'short': true
                            },
                            {
                                'title': `Market Cap`,
                                'value': content.MKTCAP.toLocaleString() + ' ' + content.TOSYMBOL,
                                'short': true
                            }
                        ],
                        'thumb_url': `https://www.cryptocompare.com/${content.IMAGEURL}`,
                        'ts': +Date.now()/1000
                    }
                ]
            });
        } catch (e) {
            console.error(e)
            bot.msg(meta.channel, e)
        }
    });
});


function make_colour(length)
{
    var text = "";
    var possible = "0123456789ABCDEF";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}