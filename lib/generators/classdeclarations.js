/**
 * Takes care of the class declarations
 * 
 * TODO: Extract comments and structure of the types for a more detailed section
 * 
 * @param {Object} context add the details to this for the template
 */
function classdeclarations(context){
      
      context.classdeclarations = context._bnd
        .getIntrospector()
        .getClassDeclarations()
        .reduce((result, current) => {
          let info = {};
          info.name = current.name;
          info.namespace = current.modelFile.namespace;
          result.push(info);
          return result;
        }, []);

        return context;

}

module.exports = classdeclarations;