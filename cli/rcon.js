#!/usr/bin/env node

const readlineSync = require('readline-sync')
const Rcon = require('rcon-client').Rcon
const optionator = require('optionator')({
    options: [
        {
            option: 'help',
            type: 'Boolean',
            alias: 'h',
            description: 'Display help'
        }, {
            option: 'host',
            type: 'String',
            default: 'localhost'
        }, {
            option: 'port',
            type: 'Int',
            default: '25575'
        }, {
            option: 'password',
            type: 'String'
        }
    ]
})

const options = optionator.parse(process.argv)

// process.once('SIGINT', function () {
//     process.exit(1)
// })

if (!options.password) {
    options.password = readlineSync.question('Please enter password: ', {
        hideEchoBack: true,
        mask: '*'
    })
}

const rcon = new Rcon({
    host: options.host,
    port: options.port,
    password: options.password
})

async function main() {
    let input = readlineSync.prompt()
    let result = null

    while (input !== 'exit') {
        result = await rcon.send(input)
        console.log(result)
        input = readlineSync.prompt()
    }

    rcon.end()
}

rcon.on("connect", () => console.log("connected"))
rcon.on('authenticated', main)
rcon.on("end", () => console.log("end"))

rcon.connect()
