export default class Command {
    constructor (keyword, data) {
        this.argz = []
        this.callback = null
        this.hidden = false
        this.description = null
        this.keyword = keyword

        this.set(data)
    }

    /**
     * Set data on command
     *
     * @param {*} data
     */
    set (data) {
        Object.keys(data)
            .filter(key => data[key] !== undefined)
            .forEach(key => this[key] = data[key])
        return this
    }

    /**
     * Add callback
     *
     * @param {({ args: string[], message: any, meta: { channel: any, user: any }}) => any)} description
     */
    do (callback) {
        return this.set({ callback })
    }

    /**
     * Add description
     *
     * @param {string} description
     */
    desc (description) {
        return this.set({ description })
    }

    /**
     * Add argument
     *
     * @param {{required: bool, name: string, def: any}} data
     */
    arg (data) {
        this.argz.push(data)
        return this
    }

    /**
     * Hide from help
     */
    hide (hidden = true) {
        return this.set({ hidden })
    }

    /**
     * Get help message
     */
    helpMessage () {
        const args = this.argz.map(({ required = false, name, def }) =>
            `${required ? '<' : '['}${name}`
            + `${def !== undefined ? `=${JSON.stringify(def)}` : ''}${required ? '>' : ']'}`
        ).join(' ')
        return `\`${this.keyword}${args ? ` ${args}` : ''}\` - ${this.description}`
    }

    /**
     * Run command
     *
     * @param {string[]} args
     * @param {any} message
     * @param {{ channel: any, user: any }} meta
     */
    run (args, message, meta) {
        return this.callback(args, message, meta)
    }
}