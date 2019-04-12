import fs from 'fs'
import { promisify } from 'util'

/**
 * Slack tag
 *
 * @param {string|object} user
 */
export const tag = user => {
    if (typeof user === 'object') {
        user = user.id
    }
    return `<@${user}>`
}

/**
 * Find in array
 *
 * @param {any[]} arr
 * @param {(element: any, index: number) => boolean} predicate
 */
export const find = (arr, predicate) => {
    if (!Array.isArray(arr)) {
        arr = Object.values(arr)
    }
    return arr.filter(predicate)[0] || null
}

/**
 * Filter object
 *
 * @param {any} obj
 * @param {(key: string, value: any) => boolean} predicate
 */
export const pickBy = (obj, predicate) => {
    return Object.keys(obj)
        .filter(key => predicate(key, obj[key]))
        .reduce((result, key) => (result[key] = obj[key], result), {})
}

/**
 * Get random int
 *
 * @param {number} max
 */
export const randint = max => {
    return Math.floor(Math.random() * max)
}

/**
 * Get random hex colour
 */
export const randcolour = () => {
    return `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`
}

/**
 * Wrap in backticks
 *
 * @param {string} str
 */
export const ticks = str => `\`${str}\``

/**
 * Wrap in 3 backticks
 *
 * @param {string} str
 */
export const pre = str => ticks(ticks(ticks(str)))

/**
 * Wrap in colons
 *
 * @param {string} str
 */
export const emoji = str => `:${str}:`

/**
 * Get last element in array/string
 *
 * @param {any[]|string} arr
 */
export const last = arr => arr[arr.length - 1]

/**
 * Tokenize a string, splitting on spaces but keeping
 * quoted items together
 *
 * @param {string} str
 */
export const tokenize = str => {
    return Array
        .from(str.trim())
        .reduce(({ quote, tokens, working }, letter, i) => {
            if (last(working) !== '\\' && !quote
                && (letter === '\'' || letter === '"' || letter === '`')) {
                return { quote: letter, tokens, working }
            }
            if (last(working) !== '\\' && quote === letter) {
                if (i === str.length - 1) {
                    return { quote, tokens: [...tokens, working], working: '' }
                }
                return { quote: null, tokens: [...tokens, working], working: '' }
            }
            if (i === str.length - 1) {
                return { quote, tokens: [...tokens, working + letter], working: '' }
            }
            if (letter === ' ' && !quote) {
                return { quote, tokens: [...tokens, working], working: '' }
            }
            return { quote, tokens, working: working + letter }
        }, { quote: null, tokens: [], working: '' })
        .tokens
}

/**
 * Get a formatted table for the dataset
 *
 * @param {string[]} colHeaders
 * @param {string[]} columns
 * @param {any[]} data array of objects
 */
export const table = (colHeaders, rowHeaders, data) => {
    const widths = [
        Math.max(...rowHeaders.map(col => col.length)),
        ...colHeaders.map((header, i) =>
            Math.max(header.length, ...Object.values(data[i]).map(val => (`${val}` || '').length))
        )
    ]
    return [
        ['', ...colHeaders].map((header, i) => header.padStart(widths[i])).join(' | '),
        ['', ...colHeaders].map((_h, i) => '-'.padStart(widths[i], '-')).join('-|-'),
        ...rowHeaders.map(col =>
            [col.replace(/_/g, ' ').padEnd(widths[0]), ...data.map((cell, i) =>
                (cell[col] !== null ? `${cell[col]}` : '-').padStart(widths[i + 1])
            )].join(' | ')
        )
    ].join('\n')
}

export const readfile = promisify(fs.readFile)
export const writefile = promisify(fs.writeFile)
