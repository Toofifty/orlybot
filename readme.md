# orlybot

`orlybot` is a Slack bot built in NodeJS made purely for fun.

It initially began as a way to fetch posts from the [/r/orlybooks](https://old.reddit.com/r/orlybooks) subreddit, and eventually was developed to do many more functions and games.

## Usage

Clone
Install dependencies
Setup `.env`

## Modules

Currently available modules include

-   `cleverbot` - talk to a cleverbot API
-   `connect4` - play connect 4
-   `crypto` - get crypto currency exchange rates
-   `reddit` - grab a post from reddit
-   `trivia` - play a game of trivia
-   `yahtzee` - play Yahtzee!

## Adding a module

### Create and register the module

Create a new js file inside the `src/modules` directory, then import in inside the `src/orly.js` file.

### Registering commands

Import the `bot` object with

```js
import bot from '../bot'
```

Register a command using the `bot.cmd` function, providing a callback to be fired when the command is encountered.

```js
bot.cmd('randint', (args, message, meta) => {
    const randint = Math.floor(Math.random() * 10)
    bot.msg(meta.channel, `You rolled a ${randint}`)
})
```

#### Command metadata

### Using the store
