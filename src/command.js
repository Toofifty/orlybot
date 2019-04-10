/**
 * Create a new command
 *
 * @param {string} keyword
 * @param {(args: string[], message: any, meta: { channel: string, user }) => any} callback
 * @param {string} desc
 * @param {string[]} args
 * @return {Command}
 */
export const cmd = (keyword, callback = null, description = null, args = {}) => {
    return new Command(keyword, { callback, description, args })
}

export default class Command {
    constructor (keyword, data) {
        this.argz = []
        this.callback = null
        this.hidden = false
        this.description = null
        this.keyword = keyword
        this.subs = {}

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
     * Add sub command
     *
     * @param {Command} command
     */
    sub (command) {
        this.subs[command.keyword] = command
        return this
    }

    /**
     * Hide from help
     */
    hide (hidden = true) {
        return this.set({ hidden })
    }

    /**
     * If command has sub commands
     */
    get hasSubs () {
        return Object.keys(this.subs).length > 0
    }

    /**
     * Get help message
     */
    get help () {
        const args = this.argz.map(({ required = false, name, def }) =>
            `${required ? '<' : '['}`
            + `${name}${def !== undefined ? `=${JSON.stringify(def)}` : ''}`
            + `${required ? '>' : ']'}`
        ).join(' ')
        return `\`${this.keyword}${args ? ` ${args}` : ''}\` - ${this.description}`
            + (this.hasSubs
                ? `\n${Object.entries(this.subs).map(cmd => cmd.help).join('\n')}`
                : '')
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