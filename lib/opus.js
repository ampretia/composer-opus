'use strict';

const BusinessNetworkDefinition = require("composer-admin").BusinessNetworkDefinition;
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
const InfoVisitor = require("./visitors/info");

// 3rd party tools
var vfs = require('vinyl-fs');
const MarkdownIt = require('markdown-it');



// convience method
let LOG = console.log;

// main function
async function go(args) {
  let bnaFile = args.archive;
  // load the network definition from file
  let buffer = fs.readFileSync(bnaFile);
  mkdirp(args.outdir);

  args.indexname = 'index.html';

  // sort out template and target file
  const targetFile = path.resolve(args.outdir, args.indexname);
  const contextFile = path.resolve(args.outdir, args.indexname + '.json');
  const templatePath = path.resolve(__dirname, "..", "_template");
  const assetsPath = path.resolve(__dirname, '..', "_template", "assets." + args.template);

  const markdowntemplate = 'md.' + args.template + '.njk';
  const htmltemplate = 'html.' + args.template + '.njk';

  // Note autoescape false - otherwise the --> in the cto file is replaced with --&gt;
  let env = nunjucks.configure(templatePath, { autoescape: false });

  // generators to use
  let generators = [basics,txfns/*, classdeclarations, acls, queries*/];

  let context = {_meta: {
    args
  }};

  try {
    context._bnd = await BusinessNetworkDefinition.fromArchive(buffer);

    // run standard Composer Introspector
    let visitor = new InfoVisitor();
    context.types = { asset: [], transaction: [], concept: [], enum: [], participant: [] };
    context._bnd.accept(visitor, { data: context.types, ctx: context });

    // run specific generators now to add extra information and structure
    context = generators.reduce((context, current) => {
      return current(context);
    }, context);

    // remove the BusinessNetworkDefinition and the metadata
    delete context._bnd;
    delete context._meta;

    // write out the JSON context file
    let fileContents = JSON.stringify(context, null, 8);
    fs.writeFileSync(contextFile, fileContents, { encoding: "utf8" });

    // render the context file into markdown
    let renderedMarkdown = env.render(markdowntemplate, context);

    // convert markdown to the html
    let md = new MarkdownIt();

    // render the context for the html
    let htmlCtx = { context: context, body: md.render(renderedMarkdown) };
    let renderedHTML = env.render(htmltemplate, htmlCtx);

    // and write out the file
    fs.writeFileSync(targetFile, renderedHTML, { encoding: "utf8" });

    // use the vinyl fs to move the names      
    vfs.src([assetsPath + '/**/*'])
      .pipe(vfs.dest(path.resolve(args.outdir, 'assets')));

    console.log("All written to " + args.outdir);
  } catch (error) {
    console.log(error);
  };

}

module.exports = go;
