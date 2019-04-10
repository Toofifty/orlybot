import fs from 'fs'

class UserData {
    constructor () {
        this.data = {}
        this.load()
    }

    load () {
        fs.readFile('./data/userdata.json', 'utf8', (err, data) => {
            if (err) {
                this.save()
                return
            }
            this.data = JSON.parse(data || '{}')
        })
    }

    save () {
        fs.writeFile('./data/userdata.json', JSON.stringify(this.data), null, err => {
            if (err) console.error(err)
        })
    }

    /**
     * Set user key value
     *
     * @param {string|object} user
     * @param {string} key
     * @param {any} value
     */
    set (user, key, value) {
        if (typeof user === 'object') {
            user = user.id
        }
        if (!this.data[user]) {
            this.data[user] = {}
        }
        this.data[user][key] = value
        this.save()
        return value
    }

    /**
     * Get user key value
     *
     * @param {string|object} user
     * @param {string} key
     * @param {any} def default
     */
    get (user, key, def = null) {
        if (typeof user === 'object') {
            user = user.id
        }
        if (!this.data[user]) {
            this.data[user] = {}
        }
        return this.data[user][key] !== undefined ? this.data[user][key] : def
    }

    get allUsers () {
        return Object.keys(this.data)
    }
}

export default new UserData()