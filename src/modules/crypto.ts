import fetch from 'node-fetch';
import bot from 'core/bot';
import { randcolour } from 'core/util';

const BASE_URL = 'https://min-api.cryptocompare.com/data/pricemultifull';

interface CryptoContent {
    PRICE: number;
    TOSYMBOL: string;
    MKTCAP: number;
    IMAGEURL: string;
}

bot.cmd(
    'crypto',
    async ({ sendAttachment }, [primary = 'BTC', secondary = 'USD']) => {
        primary = primary.toUpperCase();
        secondary = secondary.toUpperCase();

        const data = await fetch(
            `${BASE_URL}?fsyms=${primary}&tsyms=${secondary}&api_key=${process.env.CRYPTO_API}`
        ).then(res => res.json());

        const content: CryptoContent = data.RAW[primary][secondary];

        sendAttachment('', {
            attachments: [
                {
                    fallback: 'Lorenc sucks ass',
                    color: randcolour(),
                    title: `${primary}/${secondary} Price Information`,
                    fields: [
                        {
                            title: 'Price',
                            value: `${content.PRICE.toFixed(6)} ${
                                content.TOSYMBOL
                            }`,
                            short: true,
                        },
                        {
                            title: 'Market Cap',
                            value: `${content.MKTCAP.toFixed(6)} ${
                                content.TOSYMBOL
                            }`,
                            short: true,
                        },
                    ],
                    thumb_url: `https://www.cryptocompare.com/${content.IMAGEURL}`,
                    ts: +Date.now() / 1000,
                },
            ],
        });
    }
)
    .desc('Shows the current price of a particular cryptocurrency pair.')
    .arg({ name: 'primary', def: 'BTC' })
    .arg({ name: 'secondary', def: 'USD' });
