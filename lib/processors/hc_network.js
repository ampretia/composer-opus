
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
const fs = require('fs');

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;

// load the generators
const basics = require('./generators/basics');
const classdeclarations = require('./generators/classdeclarations');
// const acls = require('./generators/acls');
const txfns = require('./generators/txfns');
// const queries = require('./generators/queries');
const InfoVisitor = require('./visitors/info');
const LOG = winston.loggers.get('opus');


let process = async function(context,options){
    let bnaFile = context._args.archive;


    // generators to use
    let generators = [basics,txfns, classdeclarations/*, acls, queries*/];

    if (options.systemns){
        context._bnd = new BusinessNetworkDefinition('id@1.0.0', 'description', null, 'readme');
    }else {
        LOG.info(`Loading BNA from ${bnaFile}`);

        // load the network definition from file
        let buffer = fs.readFileSync(bnaFile);
        context._bnd = await BusinessNetworkDefinition.fromArchive(buffer);
    }

    // run standard Composer Introspector
    let visitor = new InfoVisitor();
    context.types = { asset: [], transaction: [], concept: [], enum: [], participant: [] };
    context._bnd.accept(visitor, { data: context.types, ctx: context, system: options.systemns });

    // run specific generators now to add extra information and structure
    context = generators.reduce((context, current) => {
        return current(context,options);
    }, context);

    // remove the BusinessNetworkDefinition and the metadata
    delete context._bnd;
};

module.exports = function(processors){
    processors.composernetwork = { post : process };
};