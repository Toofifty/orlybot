import bot from 'core/bot';
import Store from 'core/store';
import { Dict } from 'core/types';
import { cmd } from 'core/command';
import { error } from 'core/user-error';
import { LunchStore } from './types';

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

const checkStore = (channel: string) =>
    !store.get([channel]) && store.commit([channel], defaultStore());

const defaultStore = (): LunchStore => ({
    today: null,
    history: [],
    options: [],
    categories: [],
});

bot.cmd('lunch?', bot.passThrough('lunch'), "What's for lunch?");
bot.cmd("what's for lunch?", bot.passThrough('lunch'), "What's for lunch?");

bot.cmd(
    'lunch',
    ({ channel, send, user }) => {
        const { today, options } = store.get([channel], defaultStore());

        if (today) return send(`Let's get *${today.option.name}*!`);

        if (options.length === 0)
            return error("You haven't given me any options!");
    },
    "What's for lunch?"
)
    .sub(
        cmd('add', ({ channel, send }, [name, category]) => {
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
                [...options, { name, category }]
            );
            send(`Added now ${category} lunch option: *${name}*`);
        })
            .desc('Add a new lunch option')
            .arg({ name: 'name', required: true })
            .arg({ name: 'category', required: true })
    )
    .sub(
        cmd('remove', ({ channel, send }, [name]) => {
            checkStore(channel);
            const options = store.get([channel, 'options']);

            const index = options.findIndex(
                option => option.name.toLowerCase() === name.toLowerCase()
            );
            if (index === -1)
                return error(`Couldn't find lunch option *${name}*`);
            const option = options[index];
            options.splice(index, 1);
            send(`Added now ${option.category} lunch option: *${option.name}`);
        })
            .desc('Remove a lunch option')
            .arg({ name: 'name', required: true })
    )
    .sub(
        cmd('options', ({ channel, send }) => {
            checkStore(channel);
            const options = store.get([channel, 'options']);

            if (options.length === 0)
                return error('No options found :confused:');

            send(
                `All options:\n ${options
                    .map(option => `*${option.name}* - ${option.category}`)
                    .join('\n')}`
            );
        })
    )
    .sub(
        cmd('categories', ({ channel, send }) => {
            checkStore(channel);
            const categories = store.get([channel, 'categories']);

            if (categories.length === 0)
                return error('No categories found :confused:');

            send(`All categories: ${categories.join(', ')}`);
        })
            .desc('List all lunch categories')
            .sub(
                cmd('add', ({ channel, send }, [name]) => {
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
                cmd('remove', ({ channel, send }, [name]) => {
                    const { categories, options } = store.get(
                        [channel],
                        defaultStore()
                    );

                    if (!categories.includes(name.toLowerCase()))
                        return error("Couldn't find that category");

                    if (options.some(option => option.category === name))
                        return error(
                            'Can only delete a category if it has no options'
                        );

                    const index = categories.indexOf(name.toLowerCase());
                    categories.splice(index, 1);

                    store.commit([channel, 'categories'], categories);
                    send(`Removed category: *${name.toLowerCase()}*`);
                })
                    .desc('Remove a lunch category')
                    .arg({ name: 'name', required: true })
            )
    )
    .sub(cmd('who').desc('Check who is going to lunch today'))
    .sub(
        cmd('join').desc(
            'Join the lunchtrain! :steam_locomotive::railway_car::railway_car:'
        )
    )
    .sub(cmd('leave').desc('Leave the lunchtrain :cry:'))
    .sub(
        cmd('vote')
            .desc("Vote on today's lunch option")
            .arg({ name: 'choice', def: 'yes' })
    )
    .sub(
        cmd('overrule')
            .desc("Overrule today's lunch option")
            .arg({ name: 'option-name', required: true })
    );
