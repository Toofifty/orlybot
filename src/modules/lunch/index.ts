import * as parse from 'parse-duration';
import bot from 'core/bot';
import Store from 'core/store';
import { Dict } from 'core/types';
import { cmd } from 'core/command';
import { error } from 'core/user-error';
import { tag } from 'core/util';
import { LunchStore } from './types';
import { decide, weight } from './decide';
import { dateTZ } from 'core/date';

/**
 * Lunch module
 *
 * Choose and vote for a place to go for lunch
 *
 * lunch\?? - generate lunch prediction for the day
 * lunch add [name] [category] - add new lunch option
 * lunch categories - list all lunch categories
 * lunch categories add - add new lunch category
 * lunch who - see who is going to lunch today
 * lunch join - join the lunchtrain
 * lunch leave - leave the lunchtrain
 * lunch vote <yes/no> - vote on the lunch option, if more than 50% vote no,
 *                       lunch will be re-rolled
 * lunch overrule [name] - force overrule the lunch option, to keep history
 *                         if nobody agreed on generated option
 */

const store = Store.create('lunch', {} as Dict<LunchStore>);
const LUNCH_TRAIN = ':steam_locomotive::railway_car::railway_car:';

const checkStore = (channel: string) => {
    const { today, history } = store.get([channel], defaultStore());
    if (today.date !== dateTZ().toDateString()) {
        store.commit([channel, 'history'], [...history, today]);
        store.commit([channel, 'today'], {
            option: null,
            date: dateTZ().toDateString(),
            participants: [],
            successful: true,
        });
    }
};

const defaultStore = (): LunchStore => ({
    today: {
        option: null,
        date: dateTZ().toDateString(),
        participants: [],
        successful: true,
    },
    history: [],
    options: [],
    categories: [],
});

bot.cmd('l', bot.passThrough('lunch'), 'Shortcut for `lunch`');
bot.cmd('I', bot.passThrough('lunch'), 'Shortcut for `lunch`');
bot.cmd('lunch?', bot.passThrough('lunch'), "What's for lunch?");
bot.cmd('whats for lunch?', bot.passThrough('lunch'), "What's for lunch?");
bot.kw("what's for lunch?", ctx => bot.passThrough('lunch')(ctx, []));

bot.cmd(
    'lunch',
    ({ channel, send, user }) => {
        checkStore(channel);
        const { today, options, history } = store.get(
            [channel],
            defaultStore()
        );

        // Check to see if they're part of the lunch train
        if (!today.participants.includes(user.id))
            return error(
                "Only passengers of the lunch train can ask what's for lunch. Board the lunch train!"
            );

        if (today.option)
            return send(
                `I still think we should get ${
                    today.option.icon ? `${today.option.icon} ` : ''
                }*${today.option.name}*.`
            );

        if (options.length === 0)
            return error(
                "I don't have any lunch options! Add some with `lunch options:add <name> <category> [icon]`"
            );

        const { weight, ...decision } = decide(options, history);
        send(
            `I think we should get ${
                decision.icon ? `${decision.icon} ` : ''
            }*${decision.name}*! (${weight}% chance)`
        );
        store.commit([channel, 'today', 'option'], decision);
    },
    "What's for lunch?"
)
    .sub(
        cmd('override', ({ channel, send, user }, [name]) => {
            checkStore(channel);
            const { today, options } = store.get([channel], defaultStore());

            if (!today.participants.includes(user.id))
                return error(
                    "Only passengers of the lunch train can override what's for lunch."
                );

            const lunch = options.find(option => option.name === name);

            if (!lunch)
                return error('That option does not exist :man-shrugging:');

            send(
                `Lunch overridden to ${lunch.icon ? `${lunch.icon} ` : ''}*${
                    lunch.name
                }*!`
            );
            store.commit([channel, 'today', 'option'], lunch);
        })
            .desc("Override today's lunch option")
            .arg({ name: 'option-name', required: true })
    )
    .sub(
        cmd('options', ({ channel, send }) => {
            checkStore(channel);
            const options = store.get([channel, 'options']);

            if (options.length === 0) return error('No bueno :confused:');
            const history = store.get([channel, 'history']);

            const weightedOptions = options
                .map(option => ({
                    ...option,
                    weight: weight(option, history),
                }))
                .sort((a, b) => (a.name > b.name ? 1 : -1));

            const totalWeight = weightedOptions.reduce(
                (total, option) => total + option.weight,
                0
            );

            send(
                `All options:\n ${weightedOptions
                    .map(
                        option =>
                            `${option.icon ? `${option.icon} ` : ''}*${
                                option.name
                            }* (${((option.weight / totalWeight) * 100).toFixed(
                                2
                            )}%) - ${option.category}`
                    )
                    .join('\n')}`
            );
        }).desc('List all lunch options')
    )
    .sub(
        cmd('options:add', ({ channel, send }, [name, category, icon]) => {
            const { options, categories } = store.get(
                [channel],
                defaultStore()
            );

            if (!categories.includes(category.toLowerCase()))
                return error(
                    `Couldn't find category ${category.toLowerCase()}`
                );

            if (options.find(option => option.name === name))
                return error('That option already exists');

            store.commit(
                [channel, 'options'],
                [...options, { name, category, icon }]
            );
            send(`Added new ${category} lunch option: *${name}* ${icon || ''}`);
        })
            .desc('Add a new lunch option')
            .arg({ name: 'name', required: true })
            .arg({ name: 'category', required: true })
            .arg({ name: 'icon' })
    )
    .sub(
        cmd('options:remove', ({ channel, send }, [name]) => {
            checkStore(channel);
            const options = store.get([channel, 'options']);

            const index = options.findIndex(
                option => option.name.toLowerCase() === name.toLowerCase()
            );
            if (index === -1)
                return error(`Couldn't find lunch option *${name}*`);
            const option = options[index];
            options.splice(index, 1);
            send(`Removed ${option.category} lunch option: *${option.name}`);
        })
            .desc('Remove a lunch option')
            .arg({ name: 'name', required: true })
    )
    .sub(
        cmd('categories', ({ channel, send }) => {
            checkStore(channel);
            const categories = store.get([channel, 'categories']);

            if (categories.length === 0)
                return error('No categories found :confused:');

            send(`All categories: ${categories.join(', ')}`);
        }).desc('List all lunch categories')
    )
    .sub(
        cmd('categories:add', ({ channel, send }, [name]) => {
            checkStore(channel);
            const categories = store.get([channel, 'categories']);

            if (categories.includes(name.toLowerCase()))
                return error('That category is already added');

            store.commit(
                [channel, 'categories'],
                [...categories, name.toLowerCase()]
            );
            send(`Added new category: *${name.toLowerCase()}*`);
        })
            .desc('Add a new lunch category')
            .arg({ name: 'name', required: true })
    )
    .sub(
        cmd('categories:remove', ({ channel, send }, [name]) => {
            const { categories, options } = store.get(
                [channel],
                defaultStore()
            );

            if (!categories.includes(name.toLowerCase()))
                return error("Couldn't find that category");

            if (options.some(option => option.category === name))
                return error('Can only delete a category if it has no options');

            const index = categories.indexOf(name.toLowerCase());
            categories.splice(index, 1);

            store.commit([channel, 'categories'], categories);
            send(`Removed category: *${name.toLowerCase()}*`);
        })
            .desc('Remove a lunch category')
            .arg({ name: 'name', required: true })
    )
    .sub(
        cmd('who', ({ channel, send }) => {
            checkStore(channel);
            const participants = store.get([channel, 'today', 'participants']);

            if (participants.length === 0)
                return send(
                    `Nobody has joined the lunch train ${LUNCH_TRAIN} yet :confused:. Join using \`lunch join\`!`
                );

            send(
                `Choo choo! Here's how the lunch train is looking today: \n${LUNCH_TRAIN}${participants
                    .map(id => tag(id))
                    .join(':railway_car:')}:railway_car:`
            );

            if (!store.get([channel, 'today', 'option']))
                send(
                    "Hmmm... we haven't picked a restaurant yet. Ask me `whats for lunch?` and I'll choose one."
                );
        }).desc('Check who is going to lunch today')
    )
    .sub(
        cmd('join', ({ channel, send, user }) => {
            checkStore(channel);
            const participants = store.get([channel, 'today', 'participants']);

            if (participants.includes(user.id))
                return send(
                    `You're already on the lunch train! A bit eager today, aren't we ${tag(
                        user
                    )}?`
                );

            store.commit(
                [channel, 'today', 'participants'],
                [...participants, user.id]
            );
            send(
                `${tag(
                    user
                )} joined the lunch train! ${LUNCH_TRAIN} Anyone else?`
            );
        }).desc(`Join the lunchtrain! ${LUNCH_TRAIN}`)
    )
    .sub(
        cmd('leave', ({ channel, send, user }) => {
            checkStore(channel);
            const participants = store.get([channel, 'today', 'participants']);

            if (!participants.includes(user.id))
                return error(`You're not on the lunch train ${tag(user)}`);

            const index = participants.indexOf(user.id);
            participants.splice(index, 1);

            store.commit([channel, 'today', 'participants'], participants);

            send(`${tag(user)} left the lunch train :cry:`);
        }).desc('Leave the lunchtrain :cry:')
    )
    .sub(
        cmd('reroll', ctx => {
            const { channel, send, user } = ctx;
            checkStore(channel);
            const { participants, rerollVoters = [], option } = store.get([
                channel,
                'today',
            ]);

            if (!participants.find(id => id === user.id))
                return error('You have to join the lunch train to vote');

            if (rerollVoters.find(id => id === user.id))
                return error("You've already voted to reroll");

            send(
                `${tag(
                    user
                )} voted to reroll today's lunch (${rerollVoters.length +
                    1}/${Math.floor(participants.length / 2) + 1})`
            );
            store.commit(
                [channel, 'today', 'rerollVoters'],
                [...rerollVoters, user.id]
            );

            if (rerollVoters.length + 1 > participants.length / 2) {
                send(
                    `Looks like we\'re not getting ${option.name}, rerolling...`
                );
                const { today, history } = store.get([channel], defaultStore());
                store.commit([channel, 'today'], {
                    option: null,
                    date: dateTZ().toDateString(),
                    participants,
                    successful: true,
                });
                store.commit(
                    [channel, 'history'],
                    [...history, { ...today, successful: false }]
                );
                bot.passThrough('lunch')(ctx, []);
            }
        }).desc("Vote to reroll today's lunch option")
    )
    .sub(
        cmd('history', ({ send, channel }) => {
            checkStore(channel);
            const { today, history } = store.get([channel]);
            let response = '*Recent lunch :sandwich: history*\n';

            if (today && today.option) {
                response += `Today - *${today.option.name}* ${today.option
                    .icon || ''}\n`;
            }

            response += history
                .map(
                    visit =>
                        `${visit.successful ? '' : '~'}${visit.date} - *${
                            visit.option.name
                        }* ${visit.option.icon || ''}${
                            visit.successful ? '' : '~'
                        }` +
                        (visit.successful
                            ? ` (${visit.participants.length} participants)`
                            : ` (${visit.rerollVoters.length} votes to reroll)`)
                )
                .join('\n');

            send(response);
        }).desc('Get recent lunch history')
    )
    .sub(
        cmd('depart', ({ send, channel, user }, [time = '5mins']) => {
            checkStore(channel);
            const { participants, option } = store.get([channel, 'today']);
            const inSeconds = parse(time) / 1000;

            if (!participants.find(id => id === user.id)) {
                return error(
                    "You can't tell the lunch train to depart if you're not in it :angry:"
                );
            }

            if (!option) {
                return error("We haven't even picked where we're going...");
            }

            const departTime = new Date();
            departTime.setSeconds(departTime.getSeconds() + inSeconds);

            send(`Noted! We'll leave at ${departTime.toLocaleTimeString()}`);

            setTimeout(() => {
                send(
                    `Choo choo! The lunch train is departing! \n${LUNCH_TRAIN}${participants
                        .map(id => tag(id))
                        .join(':railway_car:')}:railway_car:`
                );
            }, inSeconds * 1000);

            console.log(inSeconds);
        })
            .arg({ name: 'in', def: '5mins' })
            .desc('Tell the lunch train to depart')
    );
