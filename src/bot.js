import Slackbot from 'slackbots'
import fs from 'fs'
import Command from './command'
import { pickBy } from './util';

const IGNORE_TYPE = ['error', 'hello', 'user_typing']
const IGNORE_SUBTYPE = ['bot_message', 'channel_join']

class Bot {
    constructor () {
        this.channels = {}
        this.commands = {}
        this.keywords = {}
        this.users = {}
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
            try {
                this.channels = JSON.parse(data)
            } catch {
                this.channels = {}
            }
        })

        this.bot.on('message', ({ type, ...message }) => {
            // ignore
            if (IGNORE_TYPE.includes(type)) return
            if (message.subtype && IGNORE_SUBTYPE.includes(message.subtype)) return

            if (type === 'channel_joined') {
                this.channels[message.channel.id] = message.channel
                fs.writeFile('./data/channels.json', JSON.stringify(this.channels), null, err => {
                    if (err) console.error(err)
                })
                return
            }

            // try load users
            if (Object.keys(this.users).length === 0) {
                this.bot.getUsers()._value.members.forEach(member => {
                    this.users[member.id] = member
                })
            }

            if (!this.channels[message.channel]) {
                console.error('Channels are out of date, re-invite orly')
                return
            }

            if (!message.text) {
                return
            }

            const args = message.text.split(/\s+/g)
            const meta = {
                channel: this.channels[message.channel].name,
                user: this.users[message.user]
            }

            if (args.length > 0 && this.commands[args[0]]) {
                const cmd = args.shift()
                return this.commands[cmd].run(args, message, meta)
            }

            Object.keys(this.keywords).forEach(keyword => {
                if (message.text.toLowerCase().includes(keyword)) {
                    this.keywords[keyword](message, meta)
                }
            })
        })

        setInterval(() => {
            if (this.queue.length > 0) {
                const { channel, message } = this.queue.shift()
                this.bot.postMessageToChannel(channel, message)
            }
        })
    }

    /**
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
     * @param {string} keyword
     * @param {(message: any, meta: { channel: string, user }) => any} callback
     * @returns {void}
     */
    kw (keyword, callback) {
        this.keywords[keyword] = callback
    }

    /**
     * @param {string|object} channel
     * @param {string} message
     * @param {number} timeout
     */
    msg (channel, message, timeout) {
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
     * @param {string|object} user
     * @param {string} message
     */
    priv (user, message) {
        if (typeof user === 'object') {
            user = user.name
        }
        this.bot.postMessageToUser(user, message)
    }

    getCommands () {
        return pickBy(this.commands, (key, value) => !value.hidden)
    }
}

export default new Bot()