import { SlackMessageEvent, CommandContext } from './types';
import { Bot } from './bot';
import UserError from './user-error';
import { pre, tokenize } from './util';

const IGNORE_TYPE = ['error', 'hello', 'user_typing'];
const IGNORE_SUBTYPE = ['bot_message', 'channel_join'];

export default class MessageInterpreter {
    private bot: Bot;

    public constructor(bot: Bot) {
        this.bot = bot;
    }

    public start(): void {
        this.bot.onMessage(async message => {
            try {
                await this.onMessage(message);
            } catch (error) {
                this.returnErrorToChannel(error, message.channel);
            }
        });
    }

    /**
     * Print the error message to the specified channel
     */
    private returnErrorToChannel(error: Error, channel: string): void {
        if (error instanceof UserError) {
            this.bot.send(channel, `\`!\` ${error.message}`);
        } else {
            this.bot.send(channel, pre(`!! ${error.message}`));
            // re-throw to get stack trace
            throw error;
        }
    }

    /**
     * On slack message listener
     */
    private onMessage({
        type,
        subtype,
        ...message
    }: SlackMessageEvent): Promise<void[]> {
        this.bot.initializeData();
        if (!message.text || this.isIgnoredType(type, subtype)) return;

        const channel = this.bot.getChannelName(message.channel);
        const terms = message.text.split('&amp;&amp;');

        const rootContext: CommandContext = {
            channel,
            args: [],
            user: this.bot.getUserById(message.user),
            message: message.text,
            term: '',
            send: (message: string, timeout: number = 0) => {
                return this.bot.send(channel, message, timeout);
            },
            sendAttachment: (
                message: string,
                attachment: any,
                timeout: number = 0
            ) => {
                return this.bot.sendAttachment(
                    channel,
                    message,
                    attachment,
                    timeout
                );
            },
        };

        const lcMessage = message.text.toLowerCase();

        return Promise.all(
            terms.map(async term => {
                const args = tokenize(term.trim());
                const context = {
                    ...rootContext,
                    args,
                    term,
                };

                const lcTerm = term.toLowerCase();

                if (args.length > 0 && this.bot.hasCommand(args[0])) {
                    await this.bot.executeCommand(args.shift(), context, args);
                } else {
                    await Promise.all(
                        this.bot.getKeywords().map(async keyword => {
                            if (lcTerm.includes(keyword)) {
                                await this.bot.executeKeyword(
                                    keyword,
                                    context,
                                    message.text
                                );
                            } else if (lcMessage.includes(keyword)) {
                                await this.bot.executeKeyword(
                                    keyword,
                                    context,
                                    message.text
                                );
                            }
                        })
                    );
                }
            })
        );
    }

    /**
     * Check if type of subtype should be ignored
     */
    private isIgnoredType(type: string, subtype: string): boolean {
        return IGNORE_TYPE.includes(type) || IGNORE_SUBTYPE.includes(subtype);
    }
}
