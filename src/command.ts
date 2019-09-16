import {
    Dict,
    CommandCallback,
    CommandData,
    CommandArgument,
    CommandContext,
} from 'types';
import { stringifyArg } from './util';

/**
 * Create a new command
 */
export const cmd = (
    keyword: string,
    callback: CommandCallback = null,
    description: string = null
): Command => new Command(keyword, { callback, description });

export default class Command implements CommandData {
    public callback: CommandCallback;
    public argz: CommandArgument[];
    public hidden: boolean;
    public description: string | null;
    public subcommands: Dict<Command>;
    public keyword: string;

    constructor(keyword: string, data: Partial<CommandData>) {
        this.argz = [];
        this.callback = null;
        this.hidden = false;
        this.description = null;
        this.keyword = keyword;
        this.subcommands = {};

        this.set(data);
    }

    /**
     * Set data on command
     */
    set(data: Partial<CommandData>): Command {
        Object.keys(data)
            .filter(key => data[key] !== undefined)
            .forEach(key => (this[key] = data[key]));
        return this;
    }

    /**
     * Add callback
     */
    do(callback: CommandCallback) {
        return this.set({ callback });
    }

    /**
     * Add description
     */
    desc(description: string) {
        return this.set({ description });
    }

    /**
     * Add argument
     */
    arg(data: CommandArgument): Command {
        this.argz.push(data);
        return this;
    }

    /**
     * Add sub command
     */
    sub(command: Command): Command {
        this.subcommands[command.keyword] = command;
        command.keyword = `${this.keyword} ${command.keyword}`;
        return this;
    }

    /**
     * Hide from help
     */
    hide(hidden: boolean = true) {
        return this.set({ hidden });
    }

    /**
     * If command has sub commands
     */
    get hasSubcommands() {
        return Object.keys(this.subcommands).length > 0;
    }

    /**
     * Get help message
     */
    get help(): string {
        const args = this.argz.map(stringifyArg).join(' ');
        return `\`${this.keyword}${args}\` - ${this.description}` +
            this.hasSubcommands
            ? `\n${Object.keys(this.subcommands)
                  .map(key => this.subcommands[key].help)
                  .join('\n')}`
            : '';
    }

    /**
     * Run command
     */
    run(context: CommandContext, args: string[]): void {
        const [sub] = args;
        if (sub && this.subcommands[sub]) {
            return this.subcommands[args.shift()].run(context, args);
        }

        return this.callback(context, args);
    }
}
