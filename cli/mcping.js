#!/usr/bin/env node

const mcping = require('./lib/ping');
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
            default: '25565'
        }
    ]
});

const options = optionator.parse(process.argv);

if (options.help) {
    console.log(optionator.generateHelp());
    process.exit(1);
}

mcping(options.host, options.port, function (err, res) {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        console.log(res);
    }
})
