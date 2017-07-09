#!/usr/bin/env node

const opus = require('../lib/opus');

const yargs = require('yargs');

// CLI to move it it's own file
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
        default: 'default.njk',
        describe: 'Template file to use as basis for markdown',
        type: 'string'
    }).option('r', {
        alias: 'renderer',
        default: 'markdown',
        describe: 'Rendere to use for the final output',
        type: 'string'
    }).strict()
    .help().argv;


opus(results);

