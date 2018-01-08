/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const path = require('path');

const vfs = require('vinyl-fs');
const map = require('map-stream');
const winston = require('winston');
// get the logger
const LOG = winston.loggers.get('opus');


let setupStream = function(context,meta){

    let srcPath = path.join(meta.inputdir,meta.pattern);
    context[meta.streamId] = {
        srcPath: srcPath,
        pipeElements : []
    };
    LOG.info(`Setup the stream and stored in context under ${meta.streamid} ${srcPath}`);
};

// let hello = function(file,cb){
//     console.log('debug '+file.path);
//     cb(null,file);
// };

let execute = async function(context,meta){
    // get the array of the stream bits based on the key
    // supplied
    let pipeElements = context[meta.streamId].pipeElements;

    let glob =[context[meta.streamId].srcPath];
    LOG.info(`Input glob is ${glob}`);

    let stream = vfs.src(glob);
    for (let element of pipeElements){
        stream = stream.pipe(map(element));
    }
    LOG.info(`Output for stream will go to ${meta.outputdir} `);
    stream.pipe(vfs.dest(path.resolve(meta.outputdir)));

    await new Promise((resolve)=>{
        stream.on('finish',resolve);
    });

};

module.exports = function(processors){
    processors.stream = { pre : setupStream, post: execute };
};