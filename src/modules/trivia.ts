import * as decode from 'decode-html';
import fetch from 'node-fetch';
import bot from 'core/bot';
import { randint, tag } from 'core/util';
import userdata from 'core/userdata';
import { cmd } from 'core/command';
import { CommandContext } from 'core/types';
import { error } from 'core/user-error';

interface Trivia {
    answerId: number | null;
    answer: string;
    wrong: string[];
    listen: () => void;
    reset: () => void;
}

interface ApiQuestion {
    category: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

const categories = {
    'General Knowledge': 9,
    'Entertainment: Books': 10,
    'Entertainment: Film': 11,
    'Entertainment: Music': 12,
    'Entertainment: Musicals & Theatre': 13,
    'Entertainment: Television': 14,
    'Entertainment: Video Games': 15,
    'Entertainment: Board Games': 16,
    'Science & Nature': 17,
    'Science: Computers': 18,
    'Science: Mathematics': 19,
    Mythology: 20,
    Sports: 21,
    Geography: 22,
    History: 23,
    Politics: 24,
    Art: 25,
    Celebrities: 26,
    Animals: 27,
    Vehicles: 28,
    'Entertainment: Comics': 29,
    'Science: Gadgets': 30,
};

const incorrect = ({ send, user }: CommandContext) => {
    const badGuesses = userdata
        .update(user, 'trivia_bad_guesses', g => g + 1, 0)
        .toLocaleString();
    send(`${tag(user)} - nope! Bad guess #${badGuesses} :(`);
};

const correct = ({ send, user }: CommandContext) => {
    const wins = userdata
        .update(user, 'trivia_wins', w => w + 1, 0)
        .toLocaleString();
    send(`You got it ${tag(user)}! You've won ${wins} trivias :)`);
    trivia.reset();
};

const trivia: Trivia = {
    answerId: null,
    answer: '',
    wrong: [],
    listen() {
        this.wrong.forEach(kw => bot.kw(kw, incorrect));
        bot.kw(this.answer, correct);
    },
    reset() {
        this.wrong.forEach(kw => bot.kw(kw, null));
        bot.kw(this.answer, null);
        this.answerId = null;
        this.answer = '';
        this.wrong = [];
    },
};

bot.cmd('trivia', async ({ send }, [arg]) => {
    if (trivia.answerId !== null) {
        send('A question has already been asked, answer that first');
        return;
    }

    const data = await fetch(
        `https://opentdb.com/api.php?amount=1${arg ? `&difficuly=${arg}` : ''}`
    ).then(res => res.json());

    const {
        category,
        question,
        correct_answer,
        incorrect_answers,
    }: ApiQuestion = data.results[0];

    send(decode(`*${category}*: ${question}`));

    trivia.answerId = randint(4);
    trivia.answer = decode(`${correct_answer}`).toLowerCase();
    trivia.wrong = incorrect_answers.map(v => decode(`${v}`).toLowerCase());

    const answers = incorrect_answers;
    answers.splice(trivia.answerId, 0, correct_answer);
    send(decode(answers.map((a, i) => `${i + 1}. *${a}*`).join('\n')), 5000);

    trivia.listen();
})
    .desc('Play trivia!')
    .arg({
        name: 'difficulty',
        def: 'easy',
        validator: value => {
            if (!['easy', 'medium', 'hard'].includes(value))
                error(`Unknown difficulty \`${value}\``);
        },
    })
    .sub(
        cmd('cancel', ({ send }) => {
            if (trivia.answerId === null) {
                send("There's no trivia game at the moment");
                return;
            }
            send("Trivia has been cancelled :'(");
            trivia.reset();
        }).desc('Cancel the current trivia game')
    )
    .sub(
        cmd('score', ({ send }, [player]) => {
            if (player) {
                const user = bot.getUser(player);
                send(
                    `${tag(user)} has *${userdata.get(
                        user,
                        'trivia_wins',
                        0
                    )}* trivia wins and *${userdata.get(
                        user,
                        'trivia_bad_guesses',
                        0
                    )}* total incorrect guesses`
                );
                return;
            }
            send(
                userdata.allUsers
                    .map(userId => {
                        const { name } = bot.getUserById(userId);
                        return `*${name}* - ${userdata.get(
                            userId,
                            'trivia_wins',
                            0
                        )} wins / ${userdata.get(
                            userId,
                            'trivia_bad_guesses',
                            0
                        )} bad guesses`;
                    })
                    .join('\n')
            );
        })
            .arg({ name: 'user' })
            .desc('Get trivia win counts')
    );
