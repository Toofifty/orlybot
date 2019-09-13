import bot from '../bot'
import request from 'request'
import decode from 'decode-html'
import { randint, tag } from '../util'
import userdata from '../userdata'
import { cmd } from '../command'

const incorrect = ({ msg, user }) => {
    msg(`${tag(user)} - nope!`)
}

const correct = ({ msg, user }) => {
    const wins = userdata.set(user, 'trivia_wins', userdata.get(user, 'trivia_wins', 0) + 1)
    msg(`You got it ${tag(user)}! You've won ${wins.toLocaleString()} trivias :)`)
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

bot.cmd('trivia', ({ msg }, [arg]) => {
    if (trivia.answerId !== null) {
        msg('A question has already been asked, answer that first')
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
            msg(decode(`*${category}*: ${question}`))

            trivia.answerId = randint(4)
            trivia.answer = decode(`${correct_answer}`).toLowerCase()
            trivia.wrong = incorrect_answers.map(v => decode(`${v}`).toLowerCase())

            const answers = incorrect_answers
            answers.splice(trivia.answerId, 0, correct_answer)
            msg(decode(answers.map((a, i) => `${i + 1}. *${a}*`).join('\n')), 5000)

            trivia.listen()
        }
    )
})
    .desc('Play trivia!')
    .arg({ name: 'difficulty', def: 'easy' })
    .sub(
        cmd('cancel', ({ msg }) => {
            if (trivia.answerId === null) {
                msg('There\'s no trivia game at the moment')
                return
            }
            msg('Trivia has been cancelled :\'(')
            trivia.reset()
        })
            .desc('Cancel the current trivia game')
    )
    .sub(
        cmd('score', ({ msg }, [player]) => {
            if (player) {
                bot.msg(
                    msg,
                    `${tag(bot.getUser(player))} has *${userdata.get(
                        bot.getUser(player), 'trivia_wins', 0
                    )}* trivia wins`
                )
                return
            }
            bot.msg(
                msg,
                userdata.allUsers.map(userId => {
                    const { name } = bot.getUserById(userId)
                    return `*${name}* - ${userdata.get(userId, 'trivia_wins', 0)} wins`
                }).join('\n')
            )
        })
            .arg({ name: 'user' })
            .desc('Get trivia win counts')
    )
