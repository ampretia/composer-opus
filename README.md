# Hyperledger Composer Opus

A Proof-Of-Idea to see if the power of template engines, plus the Introspector API, and the NPM meta-data in a Compser BusinessNeworkArchive could be used to generate a set of documentation for the archive.  

Example for the [carauction-network](./test/out/carauction.md)  - this is taking advantage of githubs auto rendered of markdown.

The idea was to have a set of summary documentation for the network, including the readme, object models, code etc. 

## Command line
```
$ opus
Options:
  -a, --archive    Archive file to document                  [string] [required]
  -o, --outdir     Output Directory                  [string] [default: "./out"]
  -t, --template   Template file to use as basis for markdown
                                               [string] [default: "default.njk"]
  -n, --indexname  Name of the generated markdown file
                                               [string] [default: "bnd-opus.md"]
  --help           Show help                                           [boolean]

```

For example for the Car Auction, (as in the example above)

```
$ opus --archive carauction-network.bna --indexname carauction.md
```
## High level flow
- The BNA file is read in and processed by the Composer api
- A set of generators are then used to process this and add information to 'context' object
- This object is then passed direct to the nunjuck template engine
- A template is then processed - today that is a markdown template
- The markdown can then be processed as needed

## TODO:
- Diagrams of the model (via mermaid probably)
- Remove system model elements
- Details of the model elements
- Details of the queries, acls, etc
- Complete the meta data
- Templates - personall will let those with better design skills do that. 