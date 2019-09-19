import Command from 'command';
import { YahtzeeStore } from 'modules/yahtzee';

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
    /**
     * Current channel
     */
    channel: string;

    /**
     * Command user
     */
    user: User;

    /**
     * Arguments for the command
     */
    args: string[];

    /**
     * Send a message to the current channel
     */
    send: (message: string, timeout?: number) => void;

    /**
     * Send a message with attachment to the current channel
     */
    sendAttachment: (
        message: string,
        attachment: any,
        timeout?: number
    ) => void;

    /**
     * Entire message
     */
    message: string;

    /**
     * Split command term
     */
    term: string;
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

export interface SlackMessageEvent {
    type: string;
    subtype: string;
    channel: string;
    text: string;
    user: string;
}

interface NextInt {
    0: 1;
    1: 2;
    2: 3;
    3: 4;
    4: 5;
    [rest: number]: number;
}

export type PathType<T, P extends any[], Index extends keyof P & number = 0> = {
    [K in keyof P & number & Index]: P[K] extends undefined
        ? T
        : P[K] extends keyof T
        ? NextInt[K] extends (keyof P & number)
            ? PathType<T[P[K]], P, Extract<NextInt[K], keyof P & number>>
            : T[P[K]]
        : never;
}[Index];

type B = PathType<YahtzeeStore, ['channel', 'players']>;

export type Path5<
    T
> = keyof T[keyof T][keyof T[keyof T]][keyof T[keyof T][keyof T[keyof T]]];
export type Path4<T> = keyof T[keyof T][keyof T[keyof T]];
export type Path3<T> = keyof T[keyof T][keyof T[keyof T]];
export type Path2<T> = keyof T[keyof T];
export type Path1<T> = keyof T;
export type PathOf<T> = [Path1<T>, Path2<T>?, Path3<T>?, Path4<T>?];
