const BusinessNetworkDefinition = require("composer-admin")
  .BusinessNetworkDefinition;
const path = require("path");
const fs = require("fs");
const nunjucks = require("nunjucks");
const util = require("util");
const mkdirp = require("mkdirp");

// load the generators
const basics = require("./generators/basics");
const classdeclarations = require("./generators/classdeclarations");
const acls = require("./generators/acls");
const txfns = require("./generators/txfns");
const queries = require("./generators/queries");


// convience method
let LOG = console.log;

// main function
function go(args) {
  let bnaFile = args.archive;
  // load the network definition from file
  let buffer = fs.readFileSync(bnaFile);
  mkdirp(args.outdir);

  // sort out template and target file
  const targetFile = path.resolve(args.outdir, args.indexname);
  const templatePath = path.resolve(__dirname, "..", "_template");

  // Note autoescape false - otherwise the --> in the cto file is replaced with --&gt;
  let env = nunjucks.configure(templatePath, { autoescape: false });

  // generators to use
  let generators = [basics, classdeclarations, acls, txfns, queries];

  let context = {};
  BusinessNetworkDefinition.fromArchive(buffer)
    // parse that
    .then(result => {
      // bnd = result;
      context._bnd = result;
      context = generators.reduce((context, current) => {
        return current(context);
      }, context);

      delete context._bnd;

      // render the model
      let renderedMarkown = env.render(args.template, context);

      // and write out the file
      fs.writeFileSync(targetFile, renderedMarkown, { encoding: "utf8" });
      console.log("All written to " + targetFile);
    })
    .catch(error => {
      console.log(error);
    });
}

module.exports = go;
