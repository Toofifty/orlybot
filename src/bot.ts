import * as Slackbot from 'slackbots';
import * as fs from 'fs';
import Command from './command';
import { pickBy, tokenize, find, pre, readfile } from './util';
import UserError from './user-error';
import {
    Dict,
    KeywordCallback,
    User,
    QueuedMessage,
    MessageEvent,
    CommandCallback,
    Channel,
} from 'types';

const IGNORE_TYPE = ['error', 'hello', 'user_typing'];
const IGNORE_SUBTYPE = ['bot_message', 'channel_join'];

class Bot {
    private channels: Dict<Channel> = {};
    private commands: Dict<Command> = {};
    private keywords: Dict<KeywordCallback> = {};
    private users: Dict<User> = {};
    private queue: QueuedMessage[] = [];
    private bot: Slackbot;

    constructor() {
        this.bot = new Slackbot({
            token: process.env.SLACK_TOKEN,
            name: process.env.SLACK_NAME,
        });

        fs.readFile('./data/channels.json', (err, data) => {
            if (err) {
                fs.writeFile('./data/channels.json', '{}', null, err => {
                    if (err) console.error;
                });
                return;
            }
            console.log(data.toString());
            this.channels = JSON.parse(data.toString() || '{}');
        });

        this.bot.on('message', ({ type, ...message }: MessageEvent) => {
            console.log(message);

            // ignore
            if (
                IGNORE_TYPE.includes(type) ||
                IGNORE_SUBTYPE.includes(message.subtype)
            )
                return;

            // try load channels
            if (Object.keys(this.channels).length === 0) {
                console.log('Loading channels');
                this.bot.getChannels()._value.channels.forEach(channel => {
                    this.channels[channel.id] = channel;
                });
                fs.writeFile(
                    './data/channels.json',
                    JSON.stringify(this.channels),
                    null,
                    err => {
                        if (err) console.error(err);
                    }
                );
            }

            // try load users
            if (Object.keys(this.users).length === 0) {
                console.log('Loading users');
                this.bot.getUsers()._value.members.forEach(member => {
                    this.users[member.id] = member;
                });
                fs.writeFile(
                    './data/users.json',
                    JSON.stringify(this.users),
                    null,
                    err => {
                        if (err) console.error(err);
                    }
                );
            }

            if (!this.channels[message.channel]) {
                console.error('Channels are out of date, re-invite orly');
                return;
            }

            if (!message.text) return;

            const terms = message.text.split('&amp;&amp;');
            const channel = this.channels[message.channel].name;
            const meta = {
                message,
                channel,
                user: this.users[message.user],
                msg: text => this.msg(channel, text),
            };

            terms.forEach(term => {
                const args = tokenize(term.trim());
                console.log(args);

                const context = { ...meta, args };

                if (args.length > 0 && this.commands[args[0]]) {
                    try {
                        this.commands[args.shift()].run(context, args);
                    } catch (err) {
                        if (err instanceof UserError) {
                            this.msg(channel, err.message);
                        } else {
                            this.msg(channel, pre(`!! ${err}`));
                            throw err;
                        }
                    }
                } else {
                    Object.keys(this.keywords).forEach(keyword => {
                        if (term.toLowerCase().includes(keyword)) {
                            try {
                                this.keywords[keyword](context, message.text);
                            } catch (err) {
                                if (err instanceof UserError) {
                                    this.msg(channel, err.message);
                                } else {
                                    this.msg(channel, pre(`!! ${err}`));
                                    throw err;
                                }
                            }
                        }
                    });
                }
            });
        });

        // message sending queue
        setInterval(() => {
            if (this.queue.length > 0) {
                const {
                    channel,
                    message,
                    attachment = {},
                } = this.queue.shift();
                this.bot.postMessageToChannel(channel, message, attachment);
            }
        }, 1000);
    }

    /**
     * Find user by name
     */
    getUser(name: string): User {
        return find(this.users, user => user.name === name);
    }

    /**
     * Find user by id
     */
    getUserById(id: string) {
        return this.users[id];
    }

    /**
     * Register command
     */
    cmd(
        keyword: string,
        callback: CommandCallback = null,
        description: string = null
    ): Command {
        this.commands[keyword] = new Command(keyword, {
            callback,
            description,
        });
        return this.commands[keyword];
    }

    /**
     * Register keyword listener
     */
    kw(keyword: string, callback?: KeywordCallback): void {
        if (!callback) {
            delete this.keywords[keyword];
        } else {
            this.keywords[keyword] = callback;
        }
    }

    /**
     * Post message to channel
     */
    msg(channel: Channel | string, message: string, timeout: number = 0): void {
        if (typeof channel === 'object') {
            channel = channel.name;
        }
        if (!timeout) {
            this.queue.push({ channel, message });
        } else {
            setTimeout(() => {
                this.queue.push({ channel: channel as string, message });
            }, timeout);
        }
    }

    /**
     * Post message to channel
     */
    msgAttachment(
        channel: Channel | string,
        message: string,
        attachment: any,
        timeout: number = 0
    ): void {
        if (typeof channel === 'object') {
            channel = channel.name;
        }
        if (!timeout) {
            this.queue.push({ channel, message, attachment });
        } else {
            setTimeout(() => {
                this.queue.push({
                    channel: channel as string,
                    message,
                    attachment,
                });
            }, timeout);
        }
    }

    /**
     * Post private message to user
     */
    priv(user: User | string, message: string): void {
        if (typeof user === 'object') {
            user = user.name;
        }
        this.bot.postMessageToUser(user, message);
    }

    /**
     * Get all non-hidden commands
     */
    getCommands(): Dict<Command> {
        return pickBy(this.commands, (_key, value) => !value.hidden);
    }
}

export default new Bot();
