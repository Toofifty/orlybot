import bot from '../bot'
// import fs from 'fs'
import request from 'request'



bot.cmd('crypto', ([primary = 'BTC', secondary = 'USD'], _message, { channel }) => {
    console.log('test');
    primary = primary.toUpperCase()
    secondary = secondary.toUpperCase()

    request({
        url: `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${primary}&tsyms=${secondary}&api_key=d0bff0f914f0b86c544f6ee1f959ef5e18cf978135988d24cb493442551777fd`,
        json: true
    }, (err, _res, body) => {
        try {
            const content = body.RAW[primary][secondary]
            // console.log(JSON.stringify(body))
            bot.msgAttachment('bot-test', '', {
                "attachments": [
                    {
                        "fallback": "Required plain-text summary of the attachment.",
                        "color": "#" + make_colour(6),
                        // "pretext": "Optional text that appears above the attachment block",
                        // "author_name": "Bobby Tables",
                        // "author_link": "http://flickr.com/bobby/",
                        // "author_icon": "http://flickr.com/icons/bobby.jpg",
                        // "title": "Slack API Documentation",
                        // "title_link": "https://api.slack.com/",
                        "title": `${primary}/${secondary} Price Information`,
                        "fields": [
                            {
                                "title": `Price`,
                                "value": content.PRICE.toLocaleString() + " " + content.TOSYMBOL,
                                "short": true
                            },
                            {
                                "title": `Market Cap`,
                                "value": content.MKTCAP.toLocaleString() + " " + content.TOSYMBOL,
                                "short": true
                            }
                        ],
                        // "image_url": "https://www.cryptocompare.com/media/19633/btc.png",
                        "thumb_url": `https://www.cryptocompare.com/${content.IMAGEURL}`,
                        // "footer": "Slack API",
                        // "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                        "ts": +Date.now()/1000
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