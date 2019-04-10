import Store from './store'

class UserData {
    constructor () {
        this.store = new Store('userdata', {})
    }

    /**
     * Set user key value
     *
     * @param {string|object} user
     * @param {string} key
     * @param {any} value
     */
    set (user, key, value) {
        if (typeof user === 'object') user = user.id
        if (!this.store.get(user)) {
            this.store.commit(user, {})
        }
        return this.store.commit([user, key], value)
    }

    /**
     * Get user key value
     *
     * @param {string|object} user
     * @param {string} key
     * @param {any} def default
     */
    get (user, key, def = null) {
        if (typeof user === 'object') user = user.id
        return this.store.get([user, key], def)
    }

    all (user) {
        if (typeof user === 'object') user = user.id
        return this.store.get(user)
    }

    get allUsers () {
        return Object.keys(this.store.data)
    }
}

export default new UserData()