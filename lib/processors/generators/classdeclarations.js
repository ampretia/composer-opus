'use strict';

const parser = require('./tempparser.js');
const doctrine = require('doctrine');
/**
 * Takes care of the class declarations
 *
 * TODO: Extract comments and structure of the types for a more detailed section
 *
 * @param {Object} context add the details to this for the template
 */
function classdeclarations(context){

    let data = {};
    let introspector = context._bnd.getIntrospector();
    let modelFiles = introspector.getModelManager().getModelFiles();
    for(let n=0; n < modelFiles.length; n++) {
        const modelFile = modelFiles[n];
        let ns = modelFile.getNamespace();
        let output = parser.parse(modelFile.definitions);

        for (const [key, value] of Object.entries(output)) {
            let name = `${ns}.${key}`;
            data[name]= doctrine.parse(value,{sloppy:true,unwrap:true});
        }

    }

    ['asset','concept','transaction','enum','participant'].forEach((t)=>{

    // need to added the parsed comments to the existing structure
        for (let i=0; i<context.types[t].length;i++){
            let resource = context.types[t][i];
            if (data[resource.fqn]){
                context.types[t][i].tags= data[resource.fqn].tags;
            }
        }
    });

    return context;

}

module.exports = classdeclarations;