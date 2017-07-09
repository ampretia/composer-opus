# Hyperledger Composer Opus

A Proof-Of-Idea to see if the power of template engines, plus the Introspector API, and the NPM meta-data in a Compser BusinessNeworkArchive could be used to generate a set of documentation for the archive.  

Example for the [carauction-network](./test/out/carauction.md)

The idea was to have a set of summary documentation for the network, including the readme, object models, code etc. 

## High level flow
- The BNA file is read in and processed by the Composer api
- A set of generators are then used to process this and add information to 'context' object
- This object is then passed direct to the nunjuck template engine
- A template is then processed - today that is a markdown template
- The markdown can then be processed as needed

## TODO:
- Diagrams of the model (via mermaid probably)
- Details of the model elements
- Details of the queries, acls, etc
- Complete the meta data
- Templates - personall will let those with better design skills do that. 