import * as Slackbot from 'slackbots';
import Command from './command';
import { pickBy, find, readfile, writefile } from './util';
import {
    Dict,
    KeywordCallback,
    User,
    QueuedMessage,
    SlackMessageEvent,
    CommandCallback,
    Channel,
    CommandContext,
} from './types';
import MessageInterpreter from './message-interpreter';

export class Bot {
    private channels: Dict<Channel> = {};
    private commands: Dict<Command> = {};
    private keywords: Dict<KeywordCallback> = {};
    private users: Dict<User> = {};
    private queue: QueuedMessage[] = [];
    private bot: Slackbot;
    private admins: string[] = [];

    constructor() {
        this.bot = new Slackbot({
            token: process.env.SLACK_TOKEN,
            name: process.env.SLACK_NAME,
        });

        this.admins = (process.env.SLACK_ADMINS || '').split(',');

        this.loadChannels();

        const messageInterpreter = new MessageInterpreter(this);
        messageInterpreter.start();

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

    public onMessage(callback: (message: SlackMessageEvent) => void): void {
        this.bot.on('message', callback);
    }

    private async loadChannels(): Promise<void> {
        try {
            const data = await readfile('./data/channels.json');
            this.channels = JSON.parse(data.toString() || '{}');
        } catch (error) {
            writefile('./data/channels.json', '{}');
        }
    }

    public initializeData(): void {
        // try load channels
        if (Object.keys(this.channels).length === 0) {
            console.log('Loading channels');
            this.bot.getChannels()._value.channels.forEach(channel => {
                this.channels[channel.id] = channel;
            });
            writefile('./data/channels.json', JSON.stringify(this.channels));
        }

        // try load users
        if (Object.keys(this.users).length === 0) {
            console.log('Loading users');
            this.bot.getUsers()._value.members.forEach(member => {
                this.users[member.id] = member;
            });
            writefile('./data/users.json', JSON.stringify(this.users));
        }
    }

    /**
     * Get channel by ID
     */
    public getChannel(id: string): Channel {
        if (!(id in this.channels)) {
            throw Error(`Could not find channel ${id}`);
        }

        return this.channels[id];
    }

    /**
     * Get channel name by ID
     */
    public getChannelName(id: string): string {
        return this.getChannel(id).name;
    }

    /**
     * Find user by name
     */
    public getUser(name: string): User {
        return find(this.users, user => user.name === name);
    }

    /**
     * Get all stored users
     */
    public getUsers(): Dict<User> {
        return this.users;
    }

    /**
     * Find user by id
     */
    public getUserById(id: string) {
        return this.users[id];
    }

    public hasCommand(name: string) {
        return name in this.commands;
    }

    /**
     * Get registered keywords
     */
    public getKeywords(): string[] {
        return Object.keys(this.keywords);
    }

    /**
     * Execute the given command
     */
    public executeCommand(
        command: string,
        context: CommandContext,
        args: string[]
    ): void {
        const cmd = this.commands[command];
        if (!cmd.hidden || this.admins.includes(context.user.id)) {
            return this.commands[command].run(context, args);
        } else {
            context.send('Nothing interesting happens.');
        }
    }

    public executeKeyword(
        keyword: string,
        context: CommandContext,
        message: string
    ): void {
        return this.keywords[keyword](context, message);
    }

    /**
     * Register command
     */
    public cmd(
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
    public kw(keyword: string, callback?: KeywordCallback): void {
        if (!callback) {
            delete this.keywords[keyword];
        } else {
            this.keywords[keyword] = callback;
        }
    }

    /**
     * Send message to channel
     */
    public send(
        channel: Channel | string,
        message: string,
        timeout: number = 0
    ): void {
        if (typeof channel === 'object') {
            channel = channel.name;
        } else if (channel in this.channels) {
            channel = this.getChannelName(channel);
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
     * Send message and attachment to channel
     */
    public sendAttachment(
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
    public priv(user: User | string, message: string): void {
        if (typeof user === 'object') {
            user = user.name;
        }
        this.bot.postMessageToUser(user, message);
    }

    /**
     * Get all non-hidden commands
     */
    public getCommands(showHidden: boolean = false): Dict<Command> {
        if (showHidden) {
            return this.commands;
        }
        return pickBy(this.commands, (_key, value) => !value.hidden);
    }
}

export default new Bot();
