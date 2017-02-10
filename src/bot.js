'use strict'

var Bot = require('slackbots')
var request = require('request')
var util = require('util')
var fs = require('fs')

var settings = {
  token: 'xoxb-138434470642-NZggQ2cApB76caL5KHKM3dkv',
  name: 'orly'
}

var bot = new Bot(settings)
var seen = []

fs.readFile('seen', 'utf8', function (e, d) {
  if (e)
    fs.writeFile('seen', '', function (e) {
      if (e) {
        console.log('failed to read/write data')
        return
      }
    })
  console.log(d)
  seen = d.split(',')
})

var get_orly = function (sr, sort, channel) {
  channel = 'random'
  console.log('making request!')
  var t = sort == 'top' ? '?t=all' : ''
  request({
    url: 'https://www.reddit.com/r/' + sr + '/' + sort + '.json' + t,
    json: true
  }, function (e, r, b) {
    if (e) console.log(e)
    else {
      if (!b.hasOwnProperty('data')) {
        console.log('errored! gonna try again in 2 min!')
        setTimeout(function () {
          get_orly(channel)
        }, 120000)
        return
      }
      var post = b['data']['children'][1]['data']
      var img = post['url']
      var title = post['title']
      var i = 1
      while (seen.indexOf(img) > -1 || img.indexOf('/comments/') > -1) {
        post = b['data']['children'][i++]['data']
        img = post['url']
        title = post['title']
      }
      bot.postMessageToChannel(channel, '*' + title + '*\n' + img)
      console.log('sent ' + img + '!')
      seen.push(img)
      fs.writeFile('seen', seen.join(','))
      console.log('saved! ' + seen.length)
    }
  })
}

// bot.on('start', get_orly)

bot.on('message', function (message) {
  console.log('message!', message.text)
  if (message.type == 'message' && message.text !== undefined && message.text.toLowerCase().indexOf('orly') > -1) {
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
  }
})
