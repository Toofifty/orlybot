export default class Command {
    constructor (keyword, data) {
        this.argz = []
        this.callback = null
        this.hidden = false
        this.description = null
        this.keyword = keyword

        this.set(data)
    }

    set (data) {
        Object.keys(data).forEach(key => this[key] = data[key])
    }

    do (callback) {
        if (callback !== undefined) {
            this.callback = callback
        }
        return this
    }

    desc (description) {
        if (description !== undefined) {
            this.description = description
        }
        return this
    }

    /**
     *
     * @param {{required: bool, name: string, def: any}} data
     */
    arg (data) {
        this.argz.push(data)
        return this
    }

    args (argz) {
        if (argz !== undefined) {
            this.argz = argz
        }
        return this
    }

    hide () {
        this.hidden = true
        return this
    }

    helpMessage () {
        const args = this.argz.map(({ required = false, name, def }) =>
            `${required ? '<' : '['}${name}`
            + `${def !== undefined ? `=${JSON.stringify(def)}` : ''}${required ? '>' : ']'}`
        ).join(' ')
        return `\`${this.keyword}${args ? ` ${args}` : ''}\` - ${this.description}`
    }

    run (args, message, meta) {
        return this.callback(args, message, meta)
    }
}