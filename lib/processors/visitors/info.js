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



const AssetDeclaration = require('composer-common').AssetDeclaration;
const ClassDeclaration = require('composer-common').ClassDeclaration;
const EnumDeclaration = require('composer-common').EnumDeclaration;
const ConceptDeclaration = require('composer-common').ConceptDeclaration;
const EnumValueDeclaration = require('composer-common').EnumValueDeclaration;
const AclRule = require('composer-common').AclRule;
const Field = require('composer-common').Field;
const ModelFile = require('composer-common').ModelFile;
const ModelManager = require('composer-common').ModelManager;
const Script = require('composer-common').Script;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const RelationshipDeclaration = require('composer-common').RelationshipDeclaration;
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;
const FunctionDeclaration = require('composer-common').FunctionDeclaration;
const Decorator = require('composer-common').Decorator;
const Query = require('composer-common').Query;
const QueryFile = require('composer-common').QueryFile;
const debug = require('debug')('concerto:infovisitor');
const util = require('util');

/**
 * Convert the contents of a {@link ModelManager} instance to a set of JSON
 * Schema v4 files - one per concrete asset and transaction type.
 * Set a fileWriter property (instance of {@link FileWriter}) on the parameters
 * object to control where the generated code is written to disk.
 * @private
 * @class
 * @memberof module:composer-common
 */
class InfoVisitor {

    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {

        if (thing instanceof BusinessNetworkDefinition) {
            return this.visitBusinessNetwork(thing, parameters);
        } else if (thing instanceof ModelManager) {
            return this.visitModelManager(thing, parameters);
        } else if (thing instanceof ModelFile) {
            return this.visitModelFile(thing, parameters);
        } else if (thing instanceof AssetDeclaration) {
            return this.visitAssetDeclaration(thing, parameters);
        } else if (thing instanceof ParticipantDeclaration) {
            return this.visitParticipantDeclaration(thing, parameters);
        } else if (thing instanceof TransactionDeclaration) {
            return this.visitTransactionDeclaration(thing, parameters);
        } else if (thing instanceof EnumDeclaration) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing instanceof ConceptDeclaration) {
            return this.visitConceptDeclaration(thing, parameters);
        } else if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationshipDeclaration(thing, parameters);
        } else if (thing instanceof EnumValueDeclaration) {
            return this.visitEnumValueDeclaration(thing, parameters);
        } else if (thing instanceof AclRule) {
            return this.visitAclRule(thing, parameters);
        }  else if (thing instanceof Script) {
            return this.visitScript(thing, parameters);
        }  else if (thing instanceof FunctionDeclaration) {
            return this.visitFunctionDeclaration(thing, parameters);
        } else if (thing instanceof QueryFile) {
            return this.visitQueryFile(thing, parameters);
        }else if (thing instanceof Query) {
            return this.visitQuery(thing, parameters);
        } else {
            //throw new Error('Unrecognised type: ' + typeof thing + ', value: ' + util.inspect(thing, { showHidden: true, depth: null }));
            throw new Error('Unrecognised type: ' + typeof thing );
        }
    }

    /**
     * Visitor design pattern
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitBusinessNetwork(businessNetworkDefinition, parameters) {

        businessNetworkDefinition.getModelManager().getModelFiles().forEach((decl) => {
            decl.accept(this, parameters);
        });

        parameters.ctx.scripts = { files: [] };
        businessNetworkDefinition.getScriptManager().getScripts().forEach( (script) => {
            script.accept(this,parameters);
        });

        parameters.ctx.acls = { rules: [] };
        businessNetworkDefinition.getAclManager().getAclRules().forEach((aclRule) => {
            aclRule.accept(this, parameters);
        });
        if (parameters.ctx.acls.rules.length===0){
            delete parameters.ctx.acls;
        }

        // parameters.ctx.queries
        let queryFile = businessNetworkDefinition.getQueryManager().getQueryFile();
        if (queryFile){
            parameters.ctx.queries = queryFile.accept(this,parameters) ;
        }


        return null;
    }

    /**
     * Visitor design pattern
     * @param {ModelManager} modelManager - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelManager(modelManager, parameters) {
        debug('entering visitModelManager');

        // Save the model manager so that we have access to it later.
        parameters.modelManager = modelManager;

        // Visit all of the files in the model manager.
        let jsonSchemas = [];
        modelManager.getModelFiles().forEach((modelFile) => {
            if (parameters.system || !modelFile.isSystemModelFile()){
                jsonSchemas = jsonSchemas.concat(modelFile.accept(this, parameters));
            }
        });
        return jsonSchemas;

    }

    /**
     * Visitor design pattern
     * @param {AclManager} aclManager - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitAclRule(aclRule, parameters) {
        debug('entering vistAclManager');

        let jsonSchemas = {
            description: aclRule.getDescription(),
            name: aclRule.getName(),
            verb: aclRule.getVerbs(),
            noun: aclRule.getNoun().getFullyQualifiedName(),

            participant: !aclRule.getParticipant() ? 'none' : aclRule.getParticipant().toString().replace(/ModelBinding/i,'').trim(),
            transaction: aclRule.getTransaction(),
            predicate: aclRule.getPredicate().getExpression(),
            action: aclRule.getAction()
        };
        parameters.ctx.acls.rules.push(jsonSchemas);

        return null;

    }

    /**
     * Visitor design pattern
     * @param {Script} script - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitQueryFile(queryFile,parameters){
        debug('enterng visitqueeryfile');

        let schema = [];

        queryFile.getQueries().forEach((query)=>{
            schema.push(query.accept(this,parameters));
        });

        return schema;
    }


    /**
     * Visitor design pattern
     * @param {Script} script - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitQuery(query,parameters){
        debug('enterng visitquery');


        let jsonSchemas = {
            description: query.getDescription(),
            name: query.getName(),
            selector: query.getSelect().getText()

        };

        return jsonSchemas;
    }

    /**
     * Visitor design pattern
     * @param {Script} script - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitScript(script, parameters) {
        debug('entering visitScript');

        let jsonSchemas = {
            identifier: script.getIdentifier(),
            name: script.getName(),
            functions:[]

        };

        script.getFunctionDeclarations().forEach((declaration) => {
            parameters.first = true;
            jsonSchemas.functions.push(declaration.accept(this, parameters));
        });

        parameters.ctx.scripts.files.push(jsonSchemas);

        return jsonSchemas;

    }


    /**
     * Visitor design pattern
     * @param {ModelFile} modelFile - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelFile(modelFile, parameters) {
        debug('entering visitModelFile', modelFile.getNamespace());

        // Save the model file so that we have access to it later.
        parameters.modelFile = modelFile;

        // Visit all of the asset and transaction declarations, but ignore the abstract ones.
        let jsonSchemas = [];
        modelFile.getAssetDeclarations()
            .concat(modelFile.getTransactionDeclarations())
            .concat(modelFile.getConceptDeclarations())
            .concat(modelFile.getParticipantDeclarations())
            .concat(modelFile.getEventDeclarations())
            .concat(modelFile.getEnumDeclarations())
            .filter((declaration) => {

                if (parameters.system){
                    // only system types
                    return declaration.isSystemType();
                } else {
                    return !declaration.isSystemType();
                }

            })
            .forEach((declaration) => {
                parameters.first = true;
                jsonSchemas.push(declaration.accept(this, parameters));
            });
        return jsonSchemas;

    }

    /**
     * Visitor design pattern
     * @param {AssetDeclaration} assetDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitAssetDeclaration(assetDeclaration, parameters) {
        debug('entering visitAssetDeclaration', assetDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this asset.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema.$schema = 'http://json-schema.org/draft-04/schema#';
            jsonSchema.title = assetDeclaration.getName();
            jsonSchema.description = `An asset named ${assetDeclaration.getName()}`;
            jsonSchema.type = 'asset';
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(assetDeclaration, parameters, jsonSchema);


    }

    visitFunctionDeclaration(fnDeclaration,parameters){
        debug('entering visitFunctionDeclaration', fnDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this asset.
        let jsonSchema = {text:fnDeclaration.getFunctionText(),
            name:fnDeclaration.getName(),
            paramaterNames:fnDeclaration.getParameterNames(),
            paramaterTypes:fnDeclaration.getParameterTypes()
        };

        return jsonSchema;
    }

    /**
     * Visitor design pattern
     * @param {ParticipantDeclaration} participantDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitParticipantDeclaration(participantDeclaration, parameters) {
        debug('entering visitParticipantDeclaration', participantDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this asset.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema.$schema = 'http://json-schema.org/draft-04/schema#';
            jsonSchema.title = participantDeclaration.getName();
            jsonSchema.description = `An participant named ${participantDeclaration.getName()}`;
            jsonSchema.type = 'participant';
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(participantDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {TransactionDeclaration} transactionDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitTransactionDeclaration(transactionDeclaration, parameters) {
        debug('entering visitTransactionDeclaration', transactionDeclaration.getName());

        // If this is the top declaration, then we are building a schema for this transaction.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema.$schema = 'http://json-schema.org/draft-04/schema#';
            jsonSchema.title = transactionDeclaration.getName();
            jsonSchema.description = `A transaction named ${transactionDeclaration.getName()}`;
            jsonSchema.type = 'transaction';
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(transactionDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {ConceptDeclaration} conceptDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitConceptDeclaration(conceptDeclaration, parameters) {
        debug('entering visitConceptDeclaration', conceptDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this asset.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema.$schema = 'http://json-schema.org/draft-04/schema#';
            jsonSchema.title = conceptDeclaration.getName();
            jsonSchema.description = `A concept named ${conceptDeclaration.getName()}`;
            jsonSchema.type = 'concept';
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(conceptDeclaration, parameters, jsonSchema);
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclaration(classDeclaration, parameters) {
        debug('entering visitClassDeclaration', classDeclaration.getName());

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(classDeclaration, parameters, {});

    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @param {Object} jsonSchema - the base JSON Schema object to use
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclarationCommon(classDeclaration, parameters, jsonSchema) {
        debug('entering visitClassDeclarationCommon', classDeclaration.getName());

        // Set the required properties into the schema.
        Object.assign(jsonSchema, {
            decorators: {},
            properties: {},
            required: []
        });

        if (!jsonSchema.type) {
            jsonSchema.type = 'object';
        }

        // If no description exists, add it now.
        if (!jsonSchema.description) {
            jsonSchema.description = `An instance of ${classDeclaration.getFullyQualifiedName()}`;
        }

        // Walk over all of the properties of this class and its super classes.
        classDeclaration.getProperties().forEach((property) => {

            // Get the schema for the property.
            jsonSchema.properties[property.getName()] = property.accept(this, parameters);

            // If the property is required, add it to the list.
            if (!property.isOptional()) {
                jsonSchema.required.push(property.getName());
            }

        });

        classDeclaration.getDecorators().forEach((decorator) =>{
            jsonSchema.decorators[decorator.getName()] = decorator.getArguments();
        });

        // If this is a top level schema, now we need to write it to disk.
        if (jsonSchema.$schema) {

            //     let fileName = `${classDeclaration.getFullyQualifiedName()}.json`;
            let newInfo = {
                'fqn': classDeclaration.getFullyQualifiedName(),
                'name': jsonSchema.title,
                'description': jsonSchema.description,
                'type': jsonSchema.type,
                'properties': jsonSchema.properties,
                'decorators': jsonSchema.decorators
            };

            parameters.data[jsonSchema.type].push(newInfo);
        }

        // Return the created schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {Field} field - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitField(field, parameters) {
        debug('entering visitField', field.getName());

        // Is this a primitive typed property?
        let jsonSchema;
        if (field.isPrimitive()) {

            // Render the type as JSON Schema.
            jsonSchema = {};
            switch (field.getType()) {
            case 'String':
                jsonSchema.type = 'string';
                break;
            case 'Double':
                jsonSchema.type = 'number';
                break;
            case 'Integer':
                jsonSchema.type = 'integer';
                break;
            case 'Long':
                jsonSchema.type = 'integer';
                break;
            case 'DateTime':
                jsonSchema.format = 'date-time';
                jsonSchema.type = 'string';
                break;
            case 'Boolean':
                jsonSchema.type = 'boolean';
                break;
            }

            // If this field has a default value, add it.
            if (field.getDefaultValue()) {
                jsonSchema.default = field.getDefaultValue();
            }

            // If this is the identifying field, mark it as such.
            if (field.getName() === field.getParent().getIdentifierFieldName()) {
                jsonSchema.description = 'The instance identifier for this type';
            }

            // Not primitive, so must be a class or enumeration!
        } else {

            // Look up the type of the property.
            let type = parameters.modelFile.getType(field.getType());

            // Render the type as JSON Schema.
            jsonSchema = type.accept(this, parameters);

        }

        // Is the type an array?
        if (field.isArray()) {
            jsonSchema = {
                type: 'array',
                items: jsonSchema
            };
        }

        // add on the decorators
        jsonSchema.decorators={};
        field.getDecorators().forEach((decorator) =>{
            jsonSchema.decorators[decorator.getName()] = decorator.getArguments();
        });

        // Return the schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {EnumDeclaration} enumDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(enumDeclaration, parameters) {
        debug('entering visitEnumDeclaration', enumDeclaration.getName());

        // Create the schema.
        let jsonSchema = {
            type: 'enum',
            enum: []
        };

        // Walk over all of the properties which should just be enum value declarations.
        enumDeclaration.getProperties().forEach((property) => {
            jsonSchema.enum.push(property.accept(this, parameters));
        });

        // Return the schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {EnumValueDeclaration} enumValueDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumValueDeclaration(enumValueDeclaration, parameters) {
        debug('entering visitEnumValueDeclaration', enumValueDeclaration.getName());

        // The "schema" in this case is just the name of the value.
        return enumValueDeclaration.getName();

    }

    /**
     * Visitor design pattern
     * @param {RelationshipDeclaration} relationshipDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @privateparent
     */
    visitRelationshipDeclaration(relationshipDeclaration, parameters) {
        debug('entering visitRelationship', relationshipDeclaration.getName());

        // Create the schema.
        let jsonSchema = {
            type: 'string',
            description: `The identifier of an instance of ${relationshipDeclaration.getFullyQualifiedTypeName()}`
        };

        // Is the type an array?
        if (relationshipDeclaration.isArray()) {
            jsonSchema = {
                type: 'array',
                items: jsonSchema
            };
        }

        // Return the schema.
        return jsonSchema;

    }
}

module.exports = InfoVisitor;