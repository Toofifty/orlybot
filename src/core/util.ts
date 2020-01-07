import * as fs from 'fs';
import { promisify } from 'util';
import {
    User,
    Dict,
    KeyPredicate,
    ElementPredicate,
    CommandArgument,
} from './types';
import bot from './bot';

/**
 * Slack tag
 */
export const tag = (user: User | string) => {
    if (typeof user === 'object') {
        user = user.id;
    }
    return `<@${user}>`;
};

/**
 * Get user from slack tag
 */
export const userFromTag = (tag: string): User =>
    bot.getUserById(tag.substring(2, tag.length - 1));

/**
 * Find in array
 */
export const find = <T>(
    arr: T[] | Dict<T>,
    predicate: ElementPredicate<T>
): T | null => {
    if (!Array.isArray(arr)) {
        arr = Object.values(arr) as T[];
    }
    return arr.filter(predicate)[0] || null;
};

/**
 * Filter object
 */
export const pickBy = <T>(obj: Dict<T>, predicate: KeyPredicate<T>): Dict<T> =>
    Object.keys(obj)
        .filter(key => predicate(key, obj[key]))
        .reduce(
            (result: Dict<T>, key) => ((result[key] = obj[key]), result),
            {}
        );

/**
 * Get random int
 *
 * @param {number} max
 */
export const randint = (max: number): number => Math.floor(Math.random() * max);

/**
 * Get random hex colour
 */
export const randcolour = (): string =>
    `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;

/**
 * Choose a random value from an array
 */
export const choose = <T>(arr: T[]): T => arr[randint(arr.length)];

/**
 * Wrap in backticks
 */
export const ticks = (str: string): string => `\`${str}\``;

/**
 * Wrap in 3 backticks
 */
export const pre = (str: string): string => ticks(ticks(ticks(str)));

/**
 * Wrap in colons
 */
export const emoji = (str: string) => `:${str}:`;

/**
 * Get last element in array/string
 */
export const last = <T>(arr: string | T[]): string | T => arr[arr.length - 1];

const TOKEN_DELIMETERS = ["'", '"', '`', '“', '“'];

/**
 * Tokenize a string, splitting on spaces but keeping
 * quoted items together
 */
export const tokenize = (str: string): string[] =>
    Array.from(str.trim()).reduce(
        ({ quote, tokens, working }, letter, i) => {
            if (
                last(working) !== '\\' &&
                !quote &&
                TOKEN_DELIMETERS.includes(letter)
            ) {
                return { quote: letter, tokens, working };
            }
            if (last(working) !== '\\' && quote === letter) {
                if (i === str.length - 1) {
                    return { quote, tokens: [...tokens, working], working: '' };
                }
                return {
                    quote: null,
                    tokens: [...tokens, working],
                    working: '',
                };
            }
            if (i === str.length - 1) {
                return {
                    quote,
                    tokens: [...tokens, working + letter],
                    working: '',
                };
            }
            if (letter === ' ' && !quote && !working) {
                return { quote, tokens, working };
            }
            if (letter === ' ' && !quote) {
                return { quote, tokens: [...tokens, working], working: '' };
            }
            return { quote, tokens, working: working + letter };
        },
        { quote: null, tokens: [], working: '' }
    ).tokens;

/**
 * Stringify an argument for printing in the help command
 */
export const stringifyArg = ({ required, name, def }: CommandArgument) =>
    `${required ? '<' : '['}` +
    `${name}${def !== undefined ? `=${JSON.stringify(def)}` : ''}` +
    `${required ? '>' : ']'}`;

/**
 * Get a formatted table for the dataset
 */
export const table = (
    colHeaders: string[],
    rowHeaders: string[],
    data: any[]
): string => {
    const widths = [
        Math.max(...rowHeaders.map(col => col.length)),
        ...colHeaders.map((header, i) =>
            Math.max(
                header.length,
                ...Object.values(data[i]).map(val => (`${val}` || '').length)
            )
        ),
    ];
    return [
        ['', ...colHeaders]
            .map((header, i) => header.padStart(widths[i]))
            .join(' | '),
        ['', ...colHeaders]
            .map((_h, i) => '-'.padStart(widths[i], '-'))
            .join('-|-'),
        ...rowHeaders.map(col =>
            [
                col.replace(/_/g, ' ').padEnd(widths[0]),
                ...data.map((cell, i) =>
                    (cell[col] !== null ? `${cell[col]}` : '-').padStart(
                        widths[i + 1]
                    )
                ),
            ].join(' | ')
        ),
    ].join('\n');
};

/**
 * Create a callback to call multiple functions
 */
export const callMany = (...fns: Function[]) => (...args: any) =>
    fns.forEach(fn => fn(args));

export const readfile = promisify(fs.readFile);
export const writefile = promisify(fs.writeFile);
export const fileExists = promisify(fs.exists);
