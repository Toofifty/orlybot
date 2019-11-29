import * as request from 'request';
import * as decode from 'decode-html';
import bot from 'core/bot';
import { pickBy, emoji, randint, tag } from 'core/util';

bot.cmd('help', ({ send }, [cmd]) => {
    let commands = bot.getCommands();
    if (cmd) commands = pickBy(commands, key => key === cmd);
    send(
        Object.keys(commands)
            .map(key => commands[key].help)
            .join('\n') || 'Nothing interesting happens'
    );
})
    .arg({ name: 'cmd' })
    .desc('Get command list / usage for a command');

bot.cmd('_help', ({ send }, [cmd]) => {
    let commands = bot.getCommands(true);
    if (cmd) commands = pickBy(commands, key => key === cmd);
    send(
        Object.keys(commands)
            .map(key => commands[key].help)
            .join('\n') || 'Nothing interesting happens'
    );
})
    .arg({ name: 'cmd' })
    .desc('Get command list / usage for a command (includes hidden commands)')
    .hide();

bot.cmd('joke', ({ send }) => {
    request(
        'https://official-joke-api.appspot.com/random_joke',
        (err, _res, body) => {
            if (err) {
                console.error(err);
                return;
            }
            const { setup, punchline } = JSON.parse(body);
            send(decode(setup));
            send(decode(punchline), 5000);
        }
    );
}).desc('Funny jokes lmao');

bot.cmd('roll', ({ send, user }, [argMax = '6']) => {
    const max = Number(argMax);
    const result =
        max > 0 && max <= 9
            ? emoji(
                  [
                      'one',
                      'two',
                      'three',
                      'four',
                      'five',
                      'six',
                      'seven',
                      'eight',
                      'nine',
                  ][randint(max - 1)]
              )
            : randint(max + 1);
    send(`${tag(user)} rolled a *${result}*`);
})
    .arg({ name: 'sides', def: 6 })
    .desc('Roll a dice');

bot.cmd('poker', ({ send }) => {
    send('lmao u wish');
}).desc('Play a game of poker!');
