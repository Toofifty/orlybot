import fs from 'fs'

/**
 * Persistent data storage
 *
 * Usage:
 *
 * const store = new Store('name', {
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
        this._load()
    }

    get file () {
        return `./data/${this.name}.json`
    }

    _load () {
        fs.readFile(this.file, 'utf8', (err, data) => {
            if (err) {
                this._save()
                return
            }
            if (data) {
                this.data = JSON.parse(data || '{}')
            }
        })
    }

    _save () {
        fs.writeFile(this.file, JSON.stringify(this.data), null, err => {
            if (err) console.error(err)
        })
    }

    /**
     * Get split parts from a path
     *
     * @param {string|string[]} path
     * @return {string[]}
     */
    _parts (path) {
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
            const props = this._parts(path)
            const target = props.pop()
            const item = props.reduce((item, prop) => item[prop], this.data)
            item[target] = value
            this._save()
            return value
        } catch (e) {
            throw new TypeError(`Invalid path name in ${this.name} store: ${path}`)
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
            const result = this._parts(path).reduce((item, prop) => item[prop], this.data)
            if (result === undefined) throw 'reee'
            return result
        } catch (e) {
            if (def) this.commit(path, def)
            return def
        }
    }
}