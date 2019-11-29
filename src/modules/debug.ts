import bot from 'core/bot';
import { tag, ticks, pre } from 'core/util';
import userdata from 'core/userdata';
import Store from 'core/store';

bot.cmd('_users', ({ send }) => {
    send(JSON.stringify(bot.getUsers()));
}).hide();

bot.cmd('_channels', ({ send }) => {
    send(JSON.stringify(bot.getUsers()));
}).hide();

bot.cmd('_me', ({ user, send }) => {
    send(`${tag(user)} ID: ${ticks(user.id)}`);
}).hide();

bot.cmd('_userdata', ({ user, send }, [other]) => {
    if (other) user = bot.getUser(other);
    send(pre(JSON.stringify(userdata.all(user))));
}).hide();

bot.cmd('_store', async ({ send }, [store]) => {
    send(pre(JSON.stringify((await Store.createAsync(store)).getData())));
}).hide();

bot.cmd('_priv', ({ user }) => {
    bot.priv(user, 'hello!');
}).hide();

bot.cmd('_eval', ({ send }, [code]) => {
    send(pre(eval(code)));
}).hide();

bot.cmd('_kw', ({ send }) => {
    send(
        Object.keys(bot.getKeywords())
            .map(ticks)
            .join(' ') || 'Nothing interesting happens.'
    );
}).hide();

bot.cmd('_tok', ({ send }, args) => {
    send(args.map(ticks).join(' '));
}).hide();
