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
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const prettyoutput = require('prettyoutput');
const cloneDeep = require('lodash.clonedeep');
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
const mkdirp = require('mkdirp');

// setup the logging
winston.loggers.add('opus', {
    console: {
        level: 'silly',
        colorize: true,
        label: 'composer-opus'
    }
});

const LOG = winston.loggers.get('opus');

// A set of processors - load these and get them to add to the structure
let _processors = {};
require('./processors/nunjucks')(_processors);
require('./processors/root')(_processors);
require('./processors/stream')(_processors);
require('./processors/markdownit')(_processors);
require('./processors/file')(_processors);
require('./processors/hc_network')(_processors);

/**
 *
 * @param {*} node
 * @param {*} context
 * @param {*} parent
 */
function setupContext(node,context,parent){
    if (!node){
        return;
    }
    for (let i in node.subtasks){
        setupContext( node.subtasks[i],context,node );
    }

    if (!node.options){
        node.options = {}
    }
    
    if (parent){
        node.options.parent=parent.taskid;
    }
    context[node.taskid] = node.options;

    LOG.info(`${node.taskid}  ${node.processor}, parent = ${node.options.parent}`);
}

/**
 * Process a node.
 *
 * Each node, will has a pre and post execution phase - inbetween which each child node is procesed
 *
 * @param {Node}   node node to process
 * @param {Object} context current context to be processing
 */
async function processNode(node,context){
    if (!node){
        // need to ensure this recursion doesn't endless...
        return;
    }

    let process = _processors[node.processor];
    if (!process){
        throw new Error(`No processor this node  ${node.taskid} ${node.processor} `);
    }

    // do any pre-processing that might be required
    let options = JSON.stringify(node.options);
    LOG.info(`>>>> Processing..... ${node.taskid} processor => ${node.processor} with ${options}`);
    if (process.pre){
        await process.pre(context,node.options);
    }

    // loop over all the children and process those
    for (let i in node.subtasks){
        await processNode( node.subtasks[i],context );
    }

    // do any post-processing that might be required
    if (process.post){
        await process.post(context,node.options);
    }

    LOG.info(`<<<< Processed..... ${node.taskid}`);
}

/**
 * Is an object?
 *
 * @param {Object} a value to test
 * @return {boolean} True if object, false if not
 */
function isObject(a) {
    return (!!a) && (a.constructor === Object);
}

/**
 * Given the String of a dotted path to a object property, actually resolve that to the value
 *
 * @param {String} path the.dot.notation.of.object.property
 * @param {Object} obj to find the value of
 * @return {Object} value of the supplied property
 */
function resolve(path, obj) {
    return path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : null;
    }, obj);
}

/**
 * Function to vist the keys of an object and look for strings that
 * have a specific regular expression.
 *
 * If they are found, then it will repalce said regular expression with the value
 * from the same object.
 *
 * Single pass only!
 *
 * @param {Object} obj
 * @param {Object} context
 */
function visit(obj,context){

    let keys = Object.keys(obj);

    for (let key of keys){
        let value = obj[key];
        if (isObject(value)){
            visit(value,context);
        }
        if (typeof value === 'string') {
            let matches = value.match(/\${(.*)}/);
            if (matches){
                let replacement = resolve(matches[1],context);
                let m = '${'+matches[1]+'}';
                obj[key] = value.replace(m,replacement);
            }
        }
    }

}
/**
 * Main function for the system
 *
 * @param {Object} args details from yargs of command line options
 */
async function go(args) {
  
    let rimrafOptions={};
    let context = { _args : args,
                    default : { 
                       template : path.resolve(__dirname,'..','_template'),
                       temp     : path.resolve(__dirname,'..','_tmp') } };
    try {

        // load in the config information
        let configFile = path.resolve(context._args.config);
        LOG.info(`Loading configuration from ${configFile}`);
        context.tasks = yaml.safeLoad(fs.readFileSync(configFile, 'utf8')).tasks;

        //
        rimrafOptions = Object.assign({}, fs);
        rimrafOptions.disableGlob = true;



        // put the meta data into the context tree
        setupContext(context.tasks, context);

        // deal with any issues of variables
        visit(context,context);

        // clean out the temporary and output directories
        LOG.info(`Clearing out the ${context.root.tempdir}`);
        await rimraf(context.root.tempdir,rimrafOptions);

        LOG.info(`Clearing out the ${context.root.outputdir}`);
        await rimraf(context.root.outputdir,rimrafOptions);
        
        mkdirp.sync(context.root.outputdir)
        mkdirp.sync(context.root.tempdir)


        // output the context prior to any processing
        let beforeContext = cloneDeep(context);
        delete beforeContext._args;
        delete beforeContext.tasks;
        LOG.info('\n'+ prettyoutput(beforeContext,{maxDepth:50}));

        // start off with the root node and off we go.
        await processNode(context.tasks, context);

        // write out the JSON context file for reference later
        if (args.debug){
            let afterContext = cloneDeep(context);
            fs.writeFileSync('afterContext.json',JSON.stringify(afterContext));
        }

        LOG.info('All done');
    } catch (error) {
        LOG.error(error);
    }

}

module.exports = go;
