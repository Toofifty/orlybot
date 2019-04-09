export const tag = (user) => {
    if (typeof user === 'object') {
        user = user.id
    }
    return `<@${user}>`
}

export const pickBy = (obj, predicate) => {
    return Object.keys(obj)
        .filter(key => predicate(key, obj[key]))
        .reduce((result, key) => (result[key] = obj[key], result), {})
}

export const randint = (max) => {
    return Math.floor(Math.random() * max)
}

export const ticks = (str) => `\`${str}\``

export const emoji = (str) => `:${str}:`