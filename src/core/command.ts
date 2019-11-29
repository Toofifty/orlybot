import {
    Dict,
    CommandCallback,
    CommandData,
    CommandArgument,
    CommandContext,
} from './types';
import { stringifyArg } from './util';
import { error } from './user-error';

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
    arg(data: Partial<CommandArgument>): Command {
        this.argz.push({ required: false, name: 'null', ...data });
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
        const args = [this.keyword, ...this.argz.map(stringifyArg)].join(' ');
        const description = `${this.hidden ? '[hidden] ' : ''}${
            this.description
        }`;
        return (
            `\`${args}\` - ${description}` +
            (this.hasSubcommands
                ? `\n${Object.keys(this.subcommands)
                      .map(key => this.subcommands[key].help)
                      .join('\n')}`
                : '')
        );
    }

    /**
     * Validate arguments against the argument list
     */
    private validate(args: string[]): void {
        if (args.length > this.argz.length) {
            const unexpected = args.slice(this.argz.length);
            error(
                `Too many arguments - unexpected \`${unexpected.join(' ')}\``
            );
        }
        this.argz.forEach(({ required, validator, name, def }, i) => {
            const arg = args[i];
            if (arg === undefined && required && def === undefined) {
                error(`Argument \`${name}\` is required`);
            }
            arg !== undefined && validator && validator(arg);
        });
    }

    /**
     * Run command
     */
    run(context: CommandContext, args: string[]): void {
        const [sub] = args;
        if (sub && this.subcommands[sub]) {
            return this.subcommands[args.shift()].run(context, args);
        }

        this.validate(args);

        return this.callback(context, args);
    }
}
