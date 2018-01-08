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
          // current is the classdec

          if (!current.isSystemType()){
            let info = {};
            // console.log(current);
            info.name = current.getName();
            info.namespace = current.modelFile.namespace;
            info.properties = current.getOwnProperties();
            info.isAbstract = current.isAbstract();
            info.isConcept = current.isConcept();
            info.isEnum = current.isEnum();
            info.isEvent = current.isEvent();
            info.idField = current.getIdentifierFieldName();

            result.push(info);
          }

          return result;
        }, []);

        return context;

}

module.exports = classdeclarations;