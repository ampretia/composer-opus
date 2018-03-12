'use strict';
const jsome = require('jsome');

let s=`/**   @param {String} description Hello */`;

const cmtsParser = require('comment-parser');

jsome(cmtsParser(s));