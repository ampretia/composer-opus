const fs = require("fs");
const BusinessNetworkDefinition = require("composer-admin")
  .BusinessNetworkDefinition;
const path = require("path");
const nunjucks = require("nunjucks");
const util = require("util");
var mkdirp = require('mkdirp');
    

var prettyjson = require("prettyjson");

let LOG = console.log;

function go(args) {
    let bnaFile = args.archive;
  // load the network definition from file
  let buffer = fs.readFileSync(bnaFile);
  let bnd;
  mkdirp(args.outdir);

  const targetFile = path.resolve(args.outdir, "bnd-score.md");
  const templatePath = path.resolve(__dirname, "..", "_template");
  
  // Note autoescape false - otherwise the --> in the cto file is replaced with --&gt;
  let env = nunjucks.configure(templatePath, { autoescape: false });

  let context = {};
  BusinessNetworkDefinition.fromArchive(buffer)
    // parse that
    .then(result => {
      bnd = result;
      bndMeta = bnd.getMetadata();
      context.name = bnd.getName();
      context.version = bnd.getVersion();
      context.readme = bndMeta.readme;
      //context.readme = context.metadata.

      context.classdeclarations = bnd
        .getIntrospector()
        .getClassDeclarations()
        .reduce((result, current) => {
          let info = {};
          info.name = current.name;
          info.namespace = current.modelFile.namespace;
          result.push(info);
          return result;
        }, []);



      // render the model
      let renderedMarkown = env.render(args.template, context);

      // and write out the file
      fs.writeFileSync(targetFile, renderedMarkown, { encoding: "utf8" });
    })
    .catch(error => {
      console.log(error);
    });

  // form up the context

  // load up the template

  // process template based on the context

  // add diagram creation

  // optinal rendering to pdf/html
}

module.exports = go;