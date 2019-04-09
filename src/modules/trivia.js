import bot from '../bot'
import request from 'request'
import decode from 'decode-html'
import { randint, tag } from '../util'

const incorrect = (_message, { channel, user }) => {
    bot.msg(channel, `${tag(user)} - nope!`)
}

const correct = (_message, { channel, user }) => {
    bot.msg(channel, `You got it ${tag(user)}!`)
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
        if (arg === 'cancel') {
            bot.msg(channel, 'Trivia has been cancelled :\'(')
            trivia.reset()
        } else {
            bot.msg(channel, 'A question has already been asked, answer that first')
        }
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
            trivia.answer = decode('' + correct_answer)
            trivia.wrong = incorrect_answers.map(v => v.toLowerCase())

            let answers = incorrect_answers
            answers.splice(trivia.answerId, 0, correct_answer)
            bot.msg(channel, decode(answers.map((a, i) => `${i + 1}. *${a}*`).join('\n')), 5000)

            trivia.listen()
        }
    )
})
.desc('Play trivia! Stop with `trivia cancel`')
.arg({ name: 'difficulty', def: 'easy' })