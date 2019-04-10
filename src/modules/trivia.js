import bot from '../bot'
import request from 'request'
import decode from 'decode-html'
import { randint, tag } from '../util'
import userdata from '../userdata'
import { cmd } from '../command'

const incorrect = (_message, { channel, user }) => {
    bot.msg(channel, `${tag(user)} - nope!`)
}

const correct = (_message, { channel, user }) => {
    const wins = userdata.set(user, 'trivia_wins', userdata.get(user, 'trivia_wins', 0) + 1)
    bot.msg(channel, `You got it ${tag(user)}! You've won ${wins} trivias :)`)
    trivia.reset()
}

const trivia = {
    answerId: null,
    answer: '',
    wrong: [],
    listen () {
        this.wrong.forEach(kw => bot.kw(kw, incorrect))
        bot.kw(this.answer, correct)
    },
    reset () {
        this.wrong.forEach(kw => bot.kw(kw, null))
        bot.kw(this.answer, null)
        this.answerId = null
        this.answer = ''
        this.wrong = []
    }
}

bot.cmd('trivia', ([arg], _message, { channel }) => {
    if (trivia.answerId !== null) {
        bot.msg(channel, 'A question has already been asked, answer that first')
        return
    }
    request(
        `https://opentdb.com/api.php?amount=1${arg ? `&difficuly=${arg}` : ''}`,
        (err, _res, body) => {
            if (err) {
                console.error(err)
                return
            }
            body = JSON.parse(body)
            const { category, question, correct_answer, incorrect_answers } = body.results[0]
            bot.msg(channel, decode(`*${category}*: ${question}`))

            trivia.answerId = randint(4)
            trivia.answer = decode('' + correct_answer).toLowerCase()
            trivia.wrong = incorrect_answers.map(v => decode('' + v).toLowerCase())

            let answers = incorrect_answers
            answers.splice(trivia.answerId, 0, correct_answer)
            bot.msg(channel, decode(answers.map((a, i) => `${i + 1}. *${a}*`).join('\n')), 5000)

            trivia.listen()
        }
    )
})
.desc('Play trivia!')
.arg({ name: 'difficulty', def: 'easy' })
.sub(
    cmd('cancel', (_args, _message, { channel }) => {
        if (trivia.answerId === null) {
            bot.msg(channel, 'There\'s no trivia game at the moment')
            return
        }
        bot.msg(channel, 'Trivia has been cancelled :\'(')
        trivia.reset()
    })
    .desc('Cancel the current trivia game')
)
.sub(
    cmd('score', ([player], _message, { channel }) => {
        if (player) {
            bot.msg(
                channel,
                `${tag(bot.getUser(player))} has *${userdata.get(
                    bot.getUser(player), 'trivia_wins', 0
                )}* trivia wins`
            )
            return
        }
        bot.msg(
            channel,
            userdata.allUsers.map(userId => {
                const { name } = bot.getUserById(userId)
                return `*${name}* - ${userdata.get(userId, 'trivia_wins', 0)} wins`
            }).join('\n')
        )
    })
    .arg({ name: 'user' })
    .desc('Get trivia win counts')
)