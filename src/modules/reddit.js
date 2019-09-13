import bot from '../bot'
import fs from 'fs'
import request from 'request'
import { error } from '../user-error'

let seen = []

fs.readFile('./data/seen.csv', 'utf8', (err, data) => {
    if (err) {
        fs.writeFile('./data/seen.csv', '', null, err => {
            if (err) {
                console.error
            }
        })
        return
    }
    seen = data.split(',')
})

bot.cmd('orly', ({ msg }, [subreddit = 'orlybook', sort = 'hot', time = '']) => {
    if (time) {
        time = `?sort=${sort}&t=${time}`
    }

    request({
        url: `https://www.reddit.com/r/${subreddit}/${sort}.json${time}`,
        json: true
    }, (err, _res, body) => {
        if (err) error(err)

        let i = 0
        let post, img, title
        do {
            if (!body.data) {
                break
            }
            post = body.data.children[i++].data
            img = post.url
            title = post.title
        } while (seen.indexOf(img) > -1 || img.indexOf('/comments/') > -1)

        msg(`*${title}*\n${img}`)
        seen.push(img)
        fs.writeFile('./data/seen.csv', seen.join(','), null, err => {
            if (err) error(err)
        })
    })
})
    .arg({ name: 'subreddit', def: 'orlybooks' })
    .arg({ name: 'sort', def: 'hot' })
    .arg({ name: 'time', def: '' })
    .desc('Get posts from a subreddit')
