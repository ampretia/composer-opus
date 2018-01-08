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

winston.loggers.add('opus', {
    console: {
        level: 'silly',
        colorize: true,
        label: 'composer-opus'
    }
});
const BusinessNetworkDefinition = require("composer-admin").BusinessNetworkDefinition;

const path = require("path");
const fs = require("fs");
const nunjucks = require("nunjucks");
const util = require("util");
const mkdirp = require("mkdirp");
const vfs = require('vinyl-fs');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
// load the generators
const basics = require("./generators/basics");
const classdeclarations = require("./generators/classdeclarations");
const acls = require("./generators/acls");
const txfns = require("./generators/txfns");
const queries = require("./generators/queries");
const InfoVisitor = require("./visitors/info");


// get the logger
const LOG = winston.loggers.get('opus');

// main function
async function go(args) {
  let bnaFile = args.archive;
  LOG.info(`Loading BNA from ${bnaFile}`);

  // load the network definition from file
  let buffer = fs.readFileSync(bnaFile);
  mkdirp.sync(args.outdir);

  args.indexname = 'index.html';

  // sort out template and target file
  const targetFile = path.resolve(args.outdir, args.indexname);
  const contextFile = path.resolve(args.outdir, args.indexname + '.json');
  const templatePath = path.resolve(__dirname, "..", "_template");
  const assetsPath = path.resolve(__dirname, '..', "_template", "assets." + args.template);

  const markdowntemplate = 'md.' + args.template + '.njk';
  const htmltemplate = 'html.' + args.template + '.njk';


  LOG.info(`Using ${markdowntemplate} to render to Markdown`);
  LOG.info(`Using ${htmltemplate} to render to HTML`);

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

fs.writeFileSync('temp.md',renderedMarkdown);

    // convert markdown to the html
    let md = new MarkdownIt();
    md.use(markdownItAnchor, {
      level: 1,
      // slugify: string => string,
      permalink: false,
      // renderPermalink: (slug, opts, state, permalink) => {},
      permalinkClass: 'header-anchor',
      permalinkSymbol: '¶',
      permalinkBefore: false
    });

    // render the context for the html
    let htmlCtx = { context: context, body: md.render(renderedMarkdown) };
    let renderedHTML = env.render(htmltemplate, htmlCtx);

    // and write out the file
    fs.writeFileSync(targetFile, renderedHTML, { encoding: "utf8" });

    // use the vinyl fs to move the names      
    vfs.src([assetsPath + '/**/*'])
      .pipe(vfs.dest(path.resolve(args.outdir, 'assets')));

    LOG.info("All written to " + args.outdir);
  } catch (error) {
    LOG.error(error);
  };

}

module.exports = go;
