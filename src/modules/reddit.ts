import fetch from 'node-fetch';
import bot from 'core/bot';
import { error } from 'core/user-error';
import { readfile, writefile } from 'core/util';

let seen = [];

readfile('./data/seen.csv', 'utf8')
    .then(data => {
        seen = data.split(',');
    })
    .catch(err => {
        if (err.code === 'ENOENT') return writefile('./data/seen.csv', '');
        console.error(err);
    });

interface RedditResponse {
    kind: string;
    data: RedditResponseData;
}

interface RedditResponseData {
    children: RedditPost[];
}

interface RedditPost {
    kind: string;
    data: RedditPostData;
}

interface RedditPostData {
    title: string;
    url: string;
}

bot.cmd(
    'orly',
    async ({ send }, [subreddit = 'orlybooks', sort = 'hot', time = '']) => {
        if (time) {
            time = `?sort=${sort}&t=${time}`;
        }

        const { data }: RedditResponse = await fetch(
            `https://www.reddit.com/r/${subreddit}/${sort}.json${time}`
        ).then(res => res.json());

        const post = data.children
            .map(post => post.data)
            .filter(
                ({ url }) =>
                    !seen.includes(url) &&
                    !url.includes('/comments/') &&
                    url !== `/r/${subreddit}`
            )[0];

        if (post) {
            const { title, url } = post;
            send(`*${title}*\n${url}`);
            seen.push(url);
            writefile('./data/seen.csv', seen.join(','));
        } else {
            error(`No new posts found in /r/${subreddit}`);
        }
    }
)
    .arg({ name: 'subreddit', def: 'orlybooks' })
    .arg({ name: 'sort', def: 'hot' })
    .arg({ name: 'time', def: '' })
    .desc('Get posts from a subreddit');
