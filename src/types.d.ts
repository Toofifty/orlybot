import Command from 'command';

export interface User {
    id: string;
}

export interface Dict<T> {
    [key: string]: T;
}

export type KeyPredicate<T> = (key: string, element: T) => boolean;
export type ElementPredicate<T> = (element: T, index: number) => boolean;

export interface CommandContext {
    channel: string;
    user: User;
    args: string[];
    message: { text: string };
    msg: (text: string) => void;
}

export type CommandCallback = (context: CommandContext, args: string[]) => void;

export interface CommandData {
    callback: CommandCallback;
    hidden: boolean;
    description: string | null;
    keyword: string;
    subcommands: Dict<Command>;
}

export interface CommandArgument {
    name: string;
    required: boolean;
    def?: any;
}
