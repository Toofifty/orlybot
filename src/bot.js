import Slackbot from 'slackbots'
import fs from 'fs'
import Command from './command'
import { pickBy, tokenize, find, pre } from './util'

const IGNORE_TYPE = ['error', 'hello', 'user_typing']
const IGNORE_SUBTYPE = ['bot_message', 'channel_join']

class Bot {
    constructor () {
        /**
         * Channel list
         */
        this.channels = {}

        /**
         * Command definitions
         */
        this.commands = {}

        /**
         * Keyword definitions
         */
        this.keywords = {}

        /**
         * User list
         */
        this.users = {}

        /**
         * Message queue
         */
        this.queue = []

        this.bot = new Slackbot({
            token: process.env.SLACK_TOKEN,
            name: process.env.SLACK_NAME
        })

        fs.readFile('./data/channels.json', (err, data) => {
            if (err) {
                fs.writeFile('./data/channels.json', '{}', null, err => {
                    if (err) console.error
                })
                return
            }
            this.channels = JSON.parse(data || '{}')
        })

        this.bot.on('message', ({ type, ...message }) => {
            // ignore
            if (IGNORE_TYPE.includes(type) || IGNORE_SUBTYPE.includes(message.subtype)) return

            // try load channels
            if (Object.keys(this.channels).length === 0) {
                console.log('Loading channels')
                this.bot.getChannels()._value.channels.forEach(channel => {
                    this.channels[channel.id] = channel
                })
                fs.writeFile('./data/channels.json', JSON.stringify(this.channels), null, err => {
                    if (err) console.error(err)
                })
            }

            // try load users
            if (Object.keys(this.users).length === 0) {
                console.log('Loading users')
                this.bot.getUsers()._value.members.forEach(member => {
                    this.users[member.id] = member
                })
                fs.writeFile('./data/users.json', JSON.stringify(this.users), null, err => {
                    if (err) console.error(err)
                })
            }

            if (!this.channels[message.channel]) {
                console.error('Channels are out of date, re-invite orly')
                return
            }

            if (!message.text) return

            const terms = message.text.split('&amp;&amp;')
            const meta = {
                channel: this.channels[message.channel].name,
                user: this.users[message.user]
            }

            terms.forEach(term => {
                const args = tokenize(term.trim())
                console.log(args)

                if (args.length > 0 && this.commands[args[0]]) {
                    try {
                        this.commands[args.shift()].run(args, message, meta)
                    } catch (err) {
                        this.msg(meta.channel, pre(`!! ${err}`))
                        throw err
                    }
                } else {
                    Object.keys(this.keywords).forEach(keyword => {
                        if (term.toLowerCase().includes(keyword)) {
                            try {
                                this.keywords[keyword](message, meta)
                            } catch (err) {
                                this.msg(meta.channel, pre(`!! ${err}`))
                                throw err
                            }
                        }
                    })
                }
            })
        })

        // message sending queue
        setInterval(() => {
            if (this.queue.length > 0) {
                const { channel, message, attachment = {} } = this.queue.shift()
                this.bot.postMessageToChannel(channel, message, attachment)
            }
        }, 1000)
    }

    getUser (name) {
        return find(this.users, user => user.name === name)
    }

    getUserById (id) {
        return this.users[id]
    }

    /**
     * Listen for command
     *
     * @param {string} keyword
     * @param {(args: string[], message: any, meta: { channel: string, user }) => any} callback
     * @param {string} desc
     * @param {string[]} args
     * @return {Command}
     */
    cmd (keyword, callback = null, description = null, args = {}) {
        this.commands[keyword] = new Command(keyword, { callback, description, args })
        return this.commands[keyword]
    }

    /**
     * Listen for keyword
     *
     * @param {string} keyword
     * @param {(message: any, meta: { channel: string, user }) => any} callback
     * @returns {void}
     */
    kw (keyword, callback) {
        if (!callback) {
            delete this.keywords[keyword]
        } else {
            this.keywords[keyword] = callback
        }
    }

    /**
     * Post message to channel
     *
     * @param {string|object} channel
     * @param {string} message
     * @param {number} timeout
     */
    msg (channel, message, timeout = 0) {
        if (typeof channel === 'object') {
            channel = channel.name
        }
        if (!timeout) {
            this.queue.push({ channel, message })
        } else {
            setTimeout(() => {
                this.queue.push({ channel, message })
            }, timeout)
        }
    }


    /**
     * Post message to channel
     *
     * @param {string|object} channel
     * @param {string} message
     * @param {number} timeout
     */
    msgAttachment (channel, message, attachment, timeout = 0) {
        if (typeof channel === 'object') {
            channel = channel.name
        }
        if (!timeout) {
            this.queue.push({ channel, message, attachment })
        } else {
            setTimeout(() => {
                this.queue.push({ channel, message, attachment })
            }, timeout)
        }
    }

    /**
     * Post message to user
     *
     * @param {string|object} user
     * @param {string} message
     */
    priv (user, message) {
        if (typeof user === 'object') {
            user = user.name
        }
        this.bot.postMessageToUser(user, message)
    }

    /**
     * Get all non-hidden commands
     */
    getCommands () {
        return pickBy(this.commands, (key, value) => !value.hidden)
    }
}

export default new Bot()
