'use strict'

var Bot = require('slackbots')
var request = require('request')
var util = require('util')
var fs = require('fs')
var decode = require('decode-html')
var cb = require('cleverbot.io')
var cleverbot = new cb('uim5IM6pXFCUy3AL', 'E2ktGYNVuzQ9orLAEilnoVwinfFX1oep')
var channel = 'coffee'
var current_answer = null
var current_answer_text = ''
var wrong_answers = []

var settings = {
  token: 'xoxb-138434470642-NZggQ2cApB76caL5KHKM3dkv',
  name: 'greg'
}

var bot = new Bot(settings)
var seen = []

var users = []
var employees = ['alex', 'luke', 'lorenc', 'alister']

var get_user = (id) => {
  var user = users.filter(user => user.id === id)
  if (user.length > 0) {
    user = user[0]
    return user.profile.display_name
  }
  return 'null'
}

fs.readFile('seen', 'utf8', function (e, d) {
  if (e)
    fs.writeFile('seen', '', function (e) {
      if (e) {
        console.log('failed to read/write data')
        return
      }
    })
  seen = d.split(',')
})

cleverbot.setNick('greg')

var get_orly = function (sr, sort) {
  console.log('making request!')
  var t = sort == 'top' ? '?t=all' : ''
  request({
    url: 'https://www.reddit.com/r/' + sr + '/' + sort + '.json' + t,
    json: true
  }, function (e, r, b) {
    if (e) console.log(e)
    else {
      var post = b['data']['children'][1]['data']
      var img = post['url']
      var title = post['title']
      var i = 1
      while (seen.indexOf(img) > -1 || img.indexOf('/comments/') > -1) {
        post = b['data']['children'][i++]['data']
        img = post['url']
        title = post['title']
      }
      bot.postMessageToChannel(channel, decode('*' + title + '*\n' + img))
      console.log('sent ' + img + '!')
      seen.push(img)
      fs.writeFile('seen', seen.join(','), {}, (err) => {
        console.error(err)
      })
      console.log('saved! ' + seen.length)
    }
  })
}

// bot.on('start', get_orly)

cleverbot.create(function (e, sess) {
  bot.postMessageToChannel(channel, 'yeet')
  bot.on('message', function (message) {
    if (users.length === 0) {
      users = bot.getUsers()._value.members
    }
    console.log(message)
    if (message.type == 'message' && message.text !== undefined && message.username !== 'orly') {
      if (message.text.toLowerCase().indexOf('orly') > -1) {
        var m = message.text.toLowerCase().split(' ')
        console.log('to me!')
        if (m.length > 3) {
          get_orly(m[1], m[2], m[3])
        } if (m.length > 2) {
          get_orly(m[1], m[2])
        } else if (m.length > 1) {
          get_orly(m[1], 'hot', message.channel)
        } else {
          get_orly('orlybooks', 'hot', message.channel)
        }
      } else if (message.text.toLowerCase().indexOf('trivia') === 0) {
        if (current_answer !== null) {
          var m = message.text.toLowerCase().split(' ')
          if (m.length > 1 && m[1].toLowerCase() === 'cancel') {
            bot.postMessageToChannel(channel, 'Trivia question cancelled')
            current_answer = null
            current_answer_text = ''
            wrong_answers = []
            return
          } else {
            bot.postMessageToChannel(channel, 'A question has already been asked, answer that first')
            return
          }
        }
        var url = 'https://opentdb.com/api.php?amount=1'
        var m = message.text.toLowerCase().split(' ')
        if (m.length > 1) {
          url = url + '&difficulty=' + m[1]
        }
        request('https://opentdb.com/api.php?amount=1', function (e, r, b) {
          if (e) {
            console.error(e)
          } else {
            b = JSON.parse(b)
            const q = b.results[0]
            bot.postMessageToChannel(channel, decode(q.category + ': ' + q.question))
            const ri = Math.floor(Math.random() * 4)
            let answers = q.incorrect_answers
            answers.splice(ri, 0, q.correct_answer)
            current_answer = ri + 1
            current_answer_text = decode('' + q.correct_answer)
            wrong_answers = q.incorrect_answers.map(v => v.toLowerCase())
            setTimeout(() => {
              bot.postMessageToChannel(channel, decode(answers.map((a, i) => `${i+1}. ${a}`).join('\n')))
            }, 5000)
          }
        })
      } else if (employees.indexOf(message.text.toLowerCase()) >= 0) {
        request('https://evilinsult.com/generate_insult.php?lang=en&type=json', function (e, r, b) {
          if (e) console.error(e)
          else {
            b = JSON.parse(b)
            bot.postMessageToChannel(channel, decode(b.insult))
          }
        })
      } else if (message.text.toLowerCase().includes('joke')) {
        request('https://official-joke-api.appspot.com/random_joke', function (e, r, b) {
          if (e) console.error(e)
          else {
            b = JSON.parse(b)
            bot.postMessageToChannel(channel, decode(b.setup))
            setTimeout(() => {
              bot.postMessageToChannel(channel, decode(b.punchline))
            }, 10000)
          }
        })
      } else if (message.text.toLowerCase().indexOf('test') === 0) {
        console.log(bot.getUsers()._value.members)
      } else if (message.text.toLowerCase().indexOf('dd') === 0) {
        let param = parseInt(message.text.substring(2, message.text.length))
        if (param > 0 && param < 50) {
          for (var i = 0; i < param; i++) { 
            bot.postMessageToChannel(channel, " ")
          }
        }
      } else if (message.text.toLowerCase().includes('greg')) {
        console.log('ask cleverbot')
        cleverbot.ask(message.text, function (e, r) {
          console.log('cleverbot responded')
          if (e) console.error(e)
          bot.postMessageToChannel(channel, r)
        })
      } else {
        if (message.text === current_answer_text.toLowerCase()) {
          bot.postMessageToChannel(channel, `You got it ${get_user(message.user)}!`)
          current_answer = null
          current_answer_text = ''
          wrong_answers = []
        } else if (wrong_answers.includes(message.text)) {
          bot.postMessageToChannel(channel, `${get_user(message.user)} - nope!`)
        }
      }
    }
  })
})