import Command from 'command';

export interface User {
    id: string;
    name: string;
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
export type KeywordCallback = (
    context: CommandContext,
    message: string
) => void;

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

export interface QueuedMessage {
    channel: string;
    message: string;
    attachment?: any;
}

export interface Channel {
    id: string;
    name: string;
}

export interface MessageEvent {
    type: string;
    subtype: string;
    channel: string;
    text: string;
    user: string;
}
