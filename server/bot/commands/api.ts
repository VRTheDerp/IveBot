// All the types!
import { Command } from '../imports/types'
// All the tools!
import fetch from 'isomorphic-unfetch'
import moment from 'moment'
import { zeroWidthSpace, getInsult, fetchLimited } from '../imports/tools'
// Get the NASA API token.
import 'json5/lib/require'
import {
  NASAtoken, fixerAPIkey, weatherAPIkey, oxfordAPI, cvAPIkey
} from '../../../config.json5'

export const handleOcr: Command = {
  name: 'ocr',
  aliases: ['textrecognition', 'itt', 'textr', 'text'],
  opts: {
    description: 'Get text from an image.',
    fullDescription: 'Get text from an image. Powered by Google Cloud Vision.',
    example: '/ocr <with uploaded image>',
    usage: '/ocr (--hastebin) <link to image/uploaded image>',
    argsRequired: false
  },
  generator: async (message, args, { client }) => {
    // To hasteb.in or not to hasteb.in.
    const useHastebin = args[0] === '--hastebin'
    if (useHastebin) args.shift()
    // Get the image and convert it to Base64.
    try {
      // Check if a message link was passed.
      const regex = /https?:\/\/((canary|ptb|www).)?discord(app)?.com\/channels\/\d{17,18}\/\d{17,18}\/\d{17,18}/
      let url = args.length ? args.join('%20') : message.attachments[0].url
      if (regex.test(url)) {
        const split = url.split('/')
        const mess = await client.getMessage(split[split.length - 2], split.pop())
        url = /^https?:\/\/\S+$/.test(mess.content) ? mess.content : mess.attachments[0].url
      }
      // const image = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
      const fetchedImage = await fetchLimited(url, 16)
      if (fetchedImage === false) return 'The file provided is larger than 16 MB!'
      const image = fetchedImage.toString('base64')
      // Now send the request.
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${cvAPIkey}`, {
        body: JSON.stringify({
          requests: [{
            image: { content: image }, features: [{ type: 'TEXT_DETECTION' }]
          }]
        }),
        method: 'POST'
      })
      // Parse the response.
      const result = (await res.json())
      // If no text was found.
      if (!result.responses[0].fullTextAnnotation
      ) return 'I was unable to get any results for the image.'
      // If the result is too long, upload it to hasteb.in.
      const text = result.responses[0].fullTextAnnotation.text
      let hastebin = ''
      try {
        if (text.length > 2000 || useHastebin) {
          const { key } = await fetch('https://hasteb.in/documents', {
            method: 'POST', body: text
          }).then(e => e.json())
          hastebin = key
        }
      } catch (e) {
        return `Failed to upload long OCR result to hasteb.in! (${text.length} characters long)`
      }
      // Return our answer.
      return {
        content: hastebin
          ? `🤔 **Text recognition result uploaded to hasteb.in${!useHastebin ? ' due to length' : ''}:**
https://hasteb.in/${hastebin} (will be deleted after 30 days)`
          : '🤔 **Text recognition result:**\n' + text,
        embed: {
          color: 0x666666,
          author: {
            name: `${message.author.username}#${message.author.discriminator}'s Image`,
            icon_url: message.author.avatarURL
          },
          footer: {
            text: 'Powered by Google Cloud Vision API',
            icon_url: 'https://www.gstatic.com/devrel-devsite/prod/' +
            'v2210deb8920cd4a55bd580441aa58e7853afc04b39a9d9ac4198e1cd7fbe04ef/cloud/images/' +
            'favicons/onecloud/favicon.ico'
          },
          timestamp: new Date(message.timestamp).toISOString()
        }
      }
    } catch (e) { return `Invalid image URL, you ${getInsult()}.` }
  }
}

export const handleCat: Command = {
  name: 'cat',
  opts: {
    description: 'Random cat from <https://random.cat>',
    fullDescription: 'Random cat from <https://random.cat>',
    usage: '/cat',
    example: '/cat',
    argsRequired: false
  },
  generator: async () => {
    try {
      // Fetch a cat and process it (this sounds funny to me idk why)
      const { file } = await (await fetch(`http://aws.random.cat/meow`)).json()
      // Send it.
      return { embed: { image: { url: file }, color: 0x123456 }, content: '🐱' }
    } catch (e) {
      return `Something went wrong 👾 Error: ${e}`
    }
  }
}

export const handleRobohash: Command = {
  name: 'robohash',
  aliases: ['robo', 'rh'],
  opts: {
    description: 'Take some text, make it a robot/monster/head/cat/human.',
    fullDescription: 'Takes some text and hashes it in the form of an image :P',
    usage: '/robohash <cat/robot/monster/head/human> <text to hash>',
    example: '/robohash cat voldemort#6931'
  },
  generator: (message, args) => {
    // Get text to hash.
    const target = args.shift()
    const text = args.join('%20')
    // Send a robohash.
    const color = 0xcf1c1c
    if (target === 'robot') {
      return {
        embed: { image: { url: `https://robohash.org/${text}.png` }, color }, content: '🤖'
      }
    } else if (target === 'monster') {
      return {
        embed: { image: { url: `https://robohash.org/${text}.png?set=set2` }, color }, content: '👾'
      }
    } else if (target === 'head') {
      return {
        embed: { image: { url: `https://robohash.org/${text}.png?set=set3` }, color }
      }
    } else if (target === 'cat') {
      return {
        embed: { image: { url: `https://robohash.org/${text}.png?set=set4` }, color }
      }
    } else if (target === 'human') {
      return {
        embed: { image: { url: `https://robohash.org/${text}.png?set=set5` }, color }, content: '🤔'
      }
    } else {
      return 'Proper usage: /robohash <robot, monster, head, cat, human> <text to robohash>'
    }
  }
}

export const handleApod: Command = {
  name: 'astronomy-picture-of-the-day',
  aliases: ['apod'],
  opts: {
    description: 'The astronomy picture of the day.',
    fullDescription: 'The astronomy picture of the day. Truly beautiful. Usually.',
    usage: '/astronomy-picture-of-the-day (date)',
    example: '/astronomy-picture-of-the-day 2nd March 2017',
    argsRequired: false
  },
  generator: async (message, args) => {
    // Check for date.
    const date = moment(args.join(' '), [
      moment.ISO_8601, moment.RFC_2822, 'Do M YYYY', 'Do MM YYYY', 'Do MMM YYYY',
      'Do MMMM YYYY', 'D M YYYY', 'D MM YYYY', 'D MMM YYYY', 'D MMMM YYYY'
    ])
    if (date.isValid()) {
      const dateStr = date.format('YYYY-MM-DD')
      // Fetch a picture or video.
      try { // eslint-disable-next-line camelcase
        const { media_type, url, title, explanation } = await (await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}&date=${dateStr}`
        )).json() // eslint-disable-next-line camelcase
        return media_type === 'video'
          ? `**${title}**\n${explanation}\n${url.split('embed/').join('watch?v=')}`
          : {
            content: `**${title}**\n${explanation}`,
            embed: { image: { url }, color: 0x2361BE }
          }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } else if (args.length) {
      return 'Invalid date.'
    }
    // Fetch a picture or video.
    try { // eslint-disable-next-line camelcase
      const { media_type, url, hdurl, title, explanation } = await (await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`
      )).json() // eslint-disable-next-line camelcase
      return media_type === 'video'
        ? `**${title}**\n${explanation}\n${url.split('embed/').join('watch?v=')}`
        : {
          content: `**${title}**\n${explanation}`,
          embed: { image: { url: hdurl }, color: 0x2361BE }
        }
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
  }
}

export const handleDog: Command = {
  name: 'dog',
  opts: {
    description: 'Random dog from <https://dog.ceo>',
    fullDescription: 'Random dog from <https://dog.ceo>',
    usage: '/dog (list) (breed, works with random image AND list) (sub-breed ONLY without list)',
    example: '/dog list | /dog labrador | /dog',
    argsRequired: false
  },
  generator: async (message, args) => {
    // List of breeds.
    if (args[0] === 'list') {
      try {
        const { message } = await (await fetch('https://dog.ceo/api/breeds/list/all')).json()
        // If only list of breeds was asked.
        if (!args[1]) return `**List of breeds:** ${Object.keys(message).join(', ')}`
        // If list of sub-breeds was asked.
        if (!message[args[1]]) return 'This breed does not exist!'
        else if (message[args[1]].length === 0) return 'This breed has no sub-breeds!'
        return `**List of sub-breeds:** ${message[args[1]].join(', ')}`
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
      // Fetch a random picture for a sub-breed.
    } else if (args[0] && args[1]) {
      try {
        const { message } = await (await fetch(
          `http://dog.ceo/api/breed/${args[0].toLowerCase()}/${args[1].toLowerCase()}/images/random`
        )).json()
        if (!message || message === 'Breed not found') return 'This breed/sub-breed does not exist!'
        return {
          embed: { image: { url: message }, color: 0x654321 },
          content: `🐕 ${args[0]} ${args[1]}`
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } else if (args[0]) {
      // Fetch a random picture for a breed.
      try {
        const { message } = await (await fetch(
          `http://dog.ceo/api/breed/${args[0].toLowerCase()}/images/random`
        )).json()
        if (!message || message === 'Breed not found') return 'This breed does not exist!'
        return { embed: { image: { url: message }, color: 0x654321 }, content: '🐕 ' + args[0] }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    }
    // Fetch a random picture.
    try {
      const { message } = await (await fetch(`http://dog.ceo/api/breeds/image/random`)).json()
      return { embed: { image: { url: message }, color: 0x654321 }, content: '🐕' }
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
  }
}

export const handleUrban: Command = {
  name: 'urban',
  aliases: ['urb'],
  opts: {
    description: 'Get an Urban Dictionary definition ;)',
    fullDescription: 'Get an Urban Dictionary definition ;)',
    usage: '/urban <term>',
    example: '/urban nub',
    argsRequired: false // this is fun.
  },
  generator: async (message, args) => {
    try {
      // Fetch the definition and parse it to JSON.
      const { list } = await (await fetch(
        `http://api.urbandictionary.com/v0/define?term=${args.join(' ')}`
      )).json()
      try {
        let response = list[0].definition.trim()
        if (response.length > 1900) {
          const splitRes = response.split('')
          response = ''
          for (let i = 0; i < 595; i += 1) response += splitRes[i]
          response += '[...]'
        }
        return {
          content: `**🍸 Definition of ${args.join(' ')}:**`,
          embed: {
            color: 0x555555,
            description: response,
            footer: { text: 'Do not trust Urban Dictionary.' },
            title: args.join(' ')
          }
        }
        // Else, there will be an exception thrown.
      } catch (err) {
        return 'No definition was found.'
      }
    } catch (e) {
      return `Something went wrong 👾 Error: ${e}`
    }
  }
}

export const handleNamemc: Command = {
  name: 'namemc',
  aliases: ['nmc'],
  opts: {
    description: 'A Minecraft user\'s previous usernames and skin.',
    fullDescription: 'Displays previous usernames and skins of a Minecraft player.',
    usage: '/namemc <premium Minecraft username>',
    example: '/namemc voldemort'
  },
  generator: async (message, args) => {
    if (args.length > 1) return 'Minecraft users cannot have spaces in their name.'
    try {
      // Fetch the UUID and name of the user and parse it to JSON.
      const { id, name } = await (await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${args[0]}`
      )).json()
      // Fetch the previous names as well.
      try {
        const names: Array<{ name: string, changedToAt?: number }> = await (await fetch(
          `https://api.mojang.com/user/profiles/${id}/names`
        )).json()
        return {
          content: '**Minecraft history and skin for ' + name + ':**',
          embed: {
            color: 0x00AE86,
            title: 'Skin and Name History',
            fields: [...names.map(object => ({
              name: object.name,
              value: object.changedToAt
                ? `Changed to this name on ${moment(object.changedToAt).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
                : zeroWidthSpace
            })), { name: 'Skin', value: zeroWidthSpace }],
            description: '**Name History**\n',
            image: { url: `https://mc-heads.net/body/${id}`, height: 216, width: 90 },
            footer: { text: 'Skin is recovered through https://mc-heads.net' }
          }
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } catch (e) { return `Enter a valid Minecraft username (account must be premium)` }
  }
}

// Initialize cache.
let currency: { timestamp: number, rates: { [index: string]: number } }
export const handleCurrency: Command = {
  name: 'currency',
  aliases: ['cur'],
  opts: {
    description: 'Convert a currency from one currency to another.',
    fullDescription: 'Convert a currency from one currency to another.',
    usage: '/currency (list) <currency symbol to convert from> <currency symbol to convert to> (amount, default: 1)',
    example: '/currency EUR USD 40'
  },
  generator: async (message, args) => {
    // Check cache if old, and refresh accordingly.
    if (!currency || Date.now() - currency.timestamp > 3600000) {
      currency = await ( // This just fetches the data and parses it to JSON.
        await fetch(`http://data.fixer.io/api/latest?access_key=${fixerAPIkey}`)
      ).json()
      currency.timestamp = Date.now() // To set the timestamp to the current time of the system.
    }
    // For /currency list
    if (args.length === 1 && args[0].toLowerCase() === 'list') {
      return {
        content: '**List of symbols:**',
        embed: {
          description: Object.keys(currency.rates).toString().split(',').join(', '),
          color: 0x666666,
          title: '💲 Currency symbols',
          fields: [{ name: 'Tip', value: `Symbols are usually (but NOT ALWAYS) the country 2 \
letter code + the first letter of the currency name.` }]
        }
      }
    }
    // Calculate the currencies to conver from and to, as well as the amount.
    if (args.length < 2) return 'Invalid usage, use /help currency for proper usage.'
    const from = args[0].toUpperCase()
    const to = args[1].toUpperCase()
    // Check if everything is in order.
    if (from.length !== 3 || !currency.rates[from]) return 'Invalid currency to convert from.'
    else if (to.length !== 3 || !currency.rates[to]) return 'Invalid currency to convert to.'
    else if (!args[2]) args[2] = '1' // If no amount was provided, the amount should be one.
    else if (args.length > 3) return 'Enter a single number for currency conversion.'
    else if (isNaN(+args[2])) return 'Enter a proper number to convert.'
    // Now we convert the amount.
    const convertedAmount = ((currency.rates[to] / currency.rates[from]) * +args[2])
    const roundedOffAmount = Math.ceil(convertedAmount * Math.pow(10, 4)) / Math.pow(10, 4)
    return `**${from}** ${args[2]} = **${to}** ${roundedOffAmount}`
  }
}

// Our weather and define types.
/* eslint-disable camelcase */
type Weather = { cod: string, coord: { lon: number, lat: number }, weather: Array<{
  main: string,
  description: string,
  icon: string
}>, main: { temp: number, temp_min: number, temp_max: number, humidity: number, pressure: number },
  visibility: number, wind: { speed: number, deg: number },
  clouds: { all: number }, rain: { '3h': number }, snow: { '3h': number }
}
type Categories = Array<{
  lexicalCategory: { id: string, text: string },
  entries: Array<{
    senses: Array<{
      definitions: Array<string>,
      shortDefinitions?: Array<string>,
      examples: Array<{ text: string }>,
      registers: Array<{ id: string, text: string }>
    }>
  }>
}> /* eslint-enable camelcase */
export const handleWeather: Command = {
  name: 'weather',
  aliases: ['wt'],
  opts: {
    description: 'It\'s really cloudy here..',
    fullDescription: 'What\'s the weather like at your place?',
    usage: '/weather <city name> (country code) (--fahrenheit or -f)',
    example: '/weather Shanghai CN'
  },
  generator: async (message, args) => {
    const farhenheit = args.includes('--fahrenheit') || args.includes('-f')
    if (farhenheit) args.splice(args.includes('-f') ? args.indexOf('-f') : args.indexOf('--fahrenheit'), 1)
    // Get the response from our API.
    const weather: Weather = await (await fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${args.join(',')}&appid=${weatherAPIkey}${
        farhenheit ? '&units=imperial' : '&units=metric'
      }`
    )).json()
    const temp = farhenheit ? '°F' : '°C'
    // If the place doesn't exist..
    if (weather.cod === '404') return 'Enter a valid city >_<'
    // We generate the entire embed.
    return {
      content: `**🌇🌃🌁🌆 The weather for ${args.join(', ')}:**`,
      embed: {
        title: 'Weather at ' + args.join(', '),
        color: 0x6D6BEA,
        description: `**Description:** ${weather.weather[0].main} - ${weather.weather[0].description}`,
        thumbnail: { url: `http://openweathermap.org/img/w/${weather.weather[0].icon}.png` },
        footer: { text: 'Weather data from https://openweathermap.org' },
        fields: [{
          name: 'Co-ordinates 🗺',
          value: `${Math.abs(weather.coord.lat)}${weather.coord.lat >= 0 ? '°N' : '°S'} /\
 ${Math.abs(weather.coord.lon)}${weather.coord.lon >= 0 ? '°E' : '°W'}
**(Latitude/Longitude)**`,
          inline: true
        }, {
          name: 'Temperature 🌡',
          value: `
${weather.main.temp}${temp}/${weather.main.temp_max}${temp}/${weather.main.temp_min}${temp}
**(avg/max/min)**`,
          inline: true // Description goes here
        }, {
          name: 'Wind 🎐',
          value: `${weather.wind.speed} m/s | ${weather.wind.deg}°
**(speed | direction)**`,
          inline: true
        }, { name: 'Pressure 🍃', value: weather.main.pressure + ' millibars', inline: true },
        { name: 'Humidity 💧', value: weather.main.humidity + '%', inline: true },
        {
          name: 'Cloud cover 🌥',
          value: weather.clouds ? `${weather.clouds.all}% of sky` : 'N/A',
          inline: true
        },
        {
          name: 'Visibility 🌫',
          value: weather.visibility ? `${weather.visibility} meters` : 'N/A',
          inline: true
        }, {
          name: 'Rain, past 3h 🌧',
          value: weather.rain ? `${weather.rain['3h']}mm` : 'N/A',
          inline: true
        }, {
          name: 'Snow, past 3h 🌨❄',
          value: weather.snow ? `${weather.snow['3h']}mm` : 'N/A',
          inline: true
        }]
      }
    }
  }
}

export const handleDefine: Command = {
  name: 'define',
  aliases: ['def'],
  opts: {
    description: 'Define a word in the Oxford Dictionary.',
    fullDescription: 'Define a word in the Oxford Dictionary.',
    usage: '/define <term>',
    example: '/define cyclone'
  },
  generator: async (message, args) => {
    // Setup request to find word.
    const headers = { 'app_id': oxfordAPI.appId, 'app_key': oxfordAPI.appKey, Accept: 'application/json' }
    // Search for the word, destructure for results, and then pass them on to our second request.
    try {
      const r = await (await fetch(
        `https://od-api.oxforddictionaries.com/api/v2/lemmas/en/${args.join(' ')}`, { headers }
      )).json()
      // If the word doesn't exist in the Oxford Dictionary..
      if (r.error === 'No entries were found for a given inflected word' || (
        r.error && r.error.startsWith('No lemma was found')
      )) {
        return 'Did you enter a valid word? 👾'
      }
      try {
        // Here we get the dictionary entries for the specified word.
        const word = r.results[0].lexicalEntries[0].inflectionOf[0].id
        const { results } = await (await fetch(
          `https://od-api.oxforddictionaries.com/api/v2/entries/en/${word}` +
            '?strictMatch=false&fields=definitions%2Cexamples',
          { headers }
        )).json()
        // Now we create an embed based on the 1st entry.
        const fields: Array<{ name: string, value: string, inline?: boolean }> = []
        // Function to check for maximum number of fields in an embed, then push.
        const safePush = (object: { name: string, value: string }) => {
          if (fields.length < 24) fields.push(object)
          else if (fields.length === 24) fields.push({ name: '...too many definitions.', value: zeroWidthSpace })
        }
        for (let i = 0; i < results.length; i++) {
          // Our super filter to remove what we don't need.
          const categories: Categories = results[i].lexicalEntries
          categories.forEach(
            // The function run on each category.
            category => {
              // If our field doesn't have the category name, we push the category name to it.
              if (!fields.includes({
                name: '**' + category.lexicalCategory.text + '**', value: zeroWidthSpace
              })) {
                // We don't push an empty field for the first element, else we do.
                if (fields.length !== 0) safePush({ name: zeroWidthSpace, value: zeroWidthSpace })
                safePush({ name: '**' + category.lexicalCategory.text + '**', value: zeroWidthSpace })
              }
              // Here we add every definition and example to the fields.
              let a = 1 // Index for the definition.
              category.entries.forEach(({ senses }) => {
                // Iterate over every definition.
                senses.forEach((sense) => {
                  // Check if there is a definition.
                  if (!sense.shortDefinitions && !sense.definitions) return
                  // Then safely push the definition to the array.
                  safePush({
                    name: `**${a}.** ` + (sense.registers ? `(${sense.registers[0].text}) ` : '') + (
                      (sense.shortDefinitions || sense.definitions)[0]
                    ),
                    value: sense.examples && sense.examples[0].text
                      ? `e.g. ${sense.examples[0].text}` : 'No example is available.'
                  })
                  // Add 1 to the index.
                  a += 1
                })
              })
            }
          )
        }
        return {
          content: `📕 **|** Definition of **${args.join(' ')}**:`,
          embed: {
            color: 0x7289DA,
            type: 'rich',
            title: results[0].word,
            footer: { text: 'Powered by Oxford Dictionary \\o/' },
            fields
          }
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } catch (e) { return 'Did you enter a valid word? 👾' }
  }
}

const noimageposts = [1037, 1608, 1663].map(e => 'https://xkcd.com' + e)
export const handleXkcd: Command = {
  name: 'xkcd',
  opts: {
    description: 'Get the latest, random or search for an xkcd comic.',
    fullDescription: 'Get the latest, random or search for an xkcd comic.',
    usage: '/xkcd (latest (default)|random|search) (search query, if searching)',
    example: '/xkcd random',
    argsRequired: false
  },
  generator: async (message, args) => {
    if (args.length >= 2 && args[0] === 'search') {
      try {
        // Fetch all posts and parse the HTML.
        const req = await fetch('https://xkcd.com/archive')
        if (!req.ok) return 'Failed to fetch list of xkcd comics!\nhttps://xkcd.com/1348'
        const posts = (await req.text()).split('<br/>').map(e => ({
          name: e.substring(0, e.length - 4).split('>').pop(),
          url: 'https://xkcd.com/' + e.substring(e.lastIndexOf('href="/') + 7).split('/"').shift()
        })).slice(4)
        posts.splice(posts.length - 11, 11) // Slice and splice invalid elements.
        // Construct search result.
        // TODO: More powerful search required.
        const res = posts.filter(post => post.name.toLowerCase().startsWith(args.slice(1).join(' ').toLowerCase()))
          .map(e => e && noimageposts.includes(e.url) ? { ...e, url: e.url + '(no image)' } : e)
        if (!res.length) return 'No results were found for your search criteria!'
        return `**Top results:**
1. ${res[0].url}${res[1] ? `\n2. <${res[1].url}>` : ''}${res[2] ? `\n3. <${res[2].url}>` : ''}`
      } catch (e) { console.error(e); return 'Failed to fetch list of xkcd comics!\nhttps://xkcd.com/1348' }
    } else if (
      args.length > 1 || (args.length === 1 && args[0] !== 'latest' && args[0] !== 'random')
    ) return 'Correct usage: /xkcd (latest|random|search) (search query if searching)'
    // Get the latest xkcd comic.
    try {
      const { num } = await (await fetch('http://xkcd.com/info.0.json')).json()
      if (args[0] === 'random') return `https://xkcd.com/${Math.floor(Math.random() * (num - 1)) + 1}`
      else return `https://xkcd.com/${num}`
    } catch (e) { return 'Failed to fetch an xkcd comic!\nhttps://xkcd.com/1348' }
  }
}

export const handleHttpCat: Command = {
  name: 'httpcat',
  aliases: ['http.cat'],
  opts: {
    description: 'Get an HTTP cat from https://http.cat',
    fullDescription: 'Get an HTTP cat from https://http.cat',
    example: '/httpcat <HTTP error code>',
    usage: '/httpcat 200',
    argsRequired: false
  },
  generator: async (message, args) => {
    if (isNaN(+args[0]) || args.length > 1) return 'Enter a valid HTTP status code!'

    const req = await fetch('https://http.cat/' + args[0], { method: 'HEAD' })
    if (req.status === 404) return 'Enter a valid HTTP status code!\nhttps://http.cat/404'

    return 'https://http.cat/' + args[0]
  }
}
