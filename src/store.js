import { readfile, writefile } from './util'

/**
 * Persistent data storage
 *
 * Usage:
 *
 * const store = Store.create('name', {
 *     value: 'default',
 *     other: {
 *         more: 'values'
 *     }
 * })
 *
 * store.get('other.more') => 'values'
 * store.get(['other', 'more']) => 'values'
 * store.get('other.not_there', 'missing') => 'missing'
 * store.commit('value', 'changed') => 'changed'
 * store.get('value') => 'changed'
 */
export default class Store {
    constructor (name, initial) {
        this.name = name
        this.data = { ...initial }
    }

    static create (name, initial) {
        const store = new Store(name, initial)
        store._load()
        return store
    }

    static async createAsync (name, initial) {
        const store = new Store(name, initial)
        await store._load()
        return store
    }

    get file () {
        return `./data/${this.name}.json`
    }

    async _load () {
        try {
            const data = await readfile(this.file, 'utf8')
            this.data = JSON.parse(data || '{}')
        } catch (err) {
            this._save()
        }
    }

    async _save () {
        try {
            await writefile(this.file, JSON.stringify(this.data))
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * Get split parts from a path
     *
     * @param {string|string[]} path
     * @return {string[]}
     */
    static _parts (path) {
        if (Array.isArray(path)) {
            return path
        }
        return path.split('.')
    }

    /**
     * Commit a value to the store
     *
     * @param {string|string[]} path
     * @param {any} value
     */
    commit (path, value) {
        try {
            const props = Store._parts(path)
            const target = props.pop()
            const item = props.reduce((item, prop) => item[prop], this.data)
            item[target] = value
            this._save()
            return value
        } catch (err) {
            throw new TypeError(
                `Invalid path name in ${this.name} store: ${Store._parts(path).join('/')}`
            )
        }
    }

    /**
     * Get a value from the store
     *
     * @param {string|string[]} path
     * @param {any} def default
     */
    get (path, def) {
        try {
            const result = Store._parts(path).reduce((item, prop) => item[prop], this.data)
            if (result === undefined) throw 'reee'
            return result
        } catch (err) {
            if (def) this.commit(path, def)
            return def
        }
    }
}
