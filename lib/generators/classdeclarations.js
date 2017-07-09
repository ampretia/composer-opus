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