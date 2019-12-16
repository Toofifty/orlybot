import * as Slackbot from 'slackbots';
import * as fs from 'fs';
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
        if (!process.env.SLACK_TOKEN || !process.env.SLACK_NAME) {
            throw new Error(
                'Could not load Slack token or name from .env file'
            );
        }

        if (!fs.existsSync('./data')) fs.mkdirSync('./data');

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
                    isPrivate,
                } = this.queue.shift();
                if (isPrivate) {
                    this.bot.postMessageToGroup(channel, message, attachment);
                } else {
                    this.bot.postMessageToChannel(channel, message, attachment);
                }
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

    public async addChannel(channel: Channel): Promise<void> {
        this.channels[channel.id] = channel;
        await writefile('./data/channels.json', JSON.stringify(this.channels));
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

    public getChannelByName(name: string): Channel {
        return find(this.channels, channel => channel.name === name);
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

    public allowedChannel(channel: string): boolean {
        const allowed = (process.env.CHANNEL_LOCK || '').split(',');
        return allowed.length === 0 || allowed.includes(channel);
    }

    public allowedCommand(command: string): boolean {
        const blacklisted = (process.env.COMMAND_BLACKLIST || '').split(',');
        return blacklisted.length === 0 || !blacklisted.includes(command);
    }

    /**
     * Execute the given command
     */
    public executeCommand(
        command: string,
        context: CommandContext,
        args: string[]
    ): void {
        if (!this.allowedChannel(context.channel)) {
            return this.priv(
                context.user,
                `I'm not allowed to talk in #${context.channel} :(`
            );
        }
        if (!this.allowedCommand(command)) {
            return this.priv(
                context.user,
                `I'm sorry Dave, I'm afraid I can't do that. (the *${command}* command is disabled)`
            );
        }
        const cmd = this.commands[command];
        if (!cmd.hidden || this.admins.includes(context.user.id)) {
            return this.commands[command].run(context, args);
        } else {
            context.send('Nothing interesting happens.');
        }
    }

    /**
     * Pass context through to new command, a-la
     * an alias
     */
    public passThrough(fullCmd: string): CommandCallback {
        return (context: CommandContext, dynArgs: string[]) => {
            const [command, ...args] = fullCmd.split(' ');
            return this.executeCommand(command, context, [...args, ...dynArgs]);
        };
    }

    public executeKeyword(
        keyword: string,
        context: CommandContext,
        message: string
    ): void {
        if (!this.allowedChannel(context.channel)) {
            return this.priv(
                context.user,
                `I'm not allowed to talk in #${context.channel} :(`
            );
        }
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

        if (typeof channel !== 'object') {
            channel = this.getChannelByName(channel);
        }

        if (!timeout) {
            this.queue.push({
                channel: channel.name,
                message,
                isPrivate: channel.is_private,
            });
        } else {
            setTimeout(() => {
                this.queue.push({
                    channel: (channel as Channel).name,
                    message,
                    isPrivate: (channel as Channel).is_private,
                });
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
