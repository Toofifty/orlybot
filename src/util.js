/**
 * Slack tag
 *
 * @param {string|object} user
 */
export const tag = (user) => {
    if (typeof user === 'object') {
        user = user.id
    }
    return `<@${user}>`
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
export const randint = (max) => {
    return Math.floor(Math.random() * max)
}

/**
 * Wrap in backticks
 *
 * @param {string} str
 */
export const ticks = (str) => `\`${str}\``

/**
 * Wrap in colons
 *
 * @param {string} str
 */
export const emoji = (str) => `:${str}:`