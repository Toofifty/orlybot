import Command from './command';

export interface Profile {
    display_name: string;
}

export interface User {
    id: string;
    name: string;
    profile: Profile;
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
    validator?: (value: string) => void;
    def?: any;
}

export interface QueuedMessage {
    channel: string;
    message: string;
    attachment?: any;
    isPrivate?: boolean;
}

export interface Channel {
    id: string;
    name: string;
    is_private: boolean;
}

export interface SlackMessageEvent {
    type: string;
    subtype: string;
    channel: string;
    text: string;
    user: string;
}
