import cleverbotIO from 'cleverbot.io';
import bot from 'core/bot';
import { tag } from 'core/util';
import { error } from 'core/user-error';

if (process.env.CLEVERBOT_ENABLED !== '0') {
    const NAME = 'Fred';

    const cleverbot = new cleverbotIO(
        process.env.CLEVERBOT_USER,
        process.env.CLEVERBOT_KEY
    );

    cleverbot.setNick(NAME);
    cleverbot.create((err: string, _sess: any) => {
        if (err) error(err);
        bot.kw(NAME.toLowerCase(), ({ send, user }, message) => {
            cleverbot.ask(message, (err: string, res: string) => {
                if (err) error(err);
                send(`${tag(user)}: ${res}`);
            });
        });
    });
}
