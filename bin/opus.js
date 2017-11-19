#!/usr/bin/env node

const opus = require('../lib/opus');
const yargs = require('yargs');

// Standard Command yargs processing.
let results = yargs
    .option('a', {
        alias: 'archive',
        demandOption: true,
        describe: 'Archive file to document',
        type: 'string'
    })
    .option('o', {
        alias: 'outdir',
        demandOption: false,
        default: './out',
        describe: 'Output Directory',
        type: 'string'
    }).option('t', {
        alias: 'template',
        demandOption: false,
        default: 'default',
        describe: 'Name of the template to use',
        type: 'string'
    })
    .strict()
    .help().argv;

opus(results);

