const js2flowchart = require('js2flowchart');
const path = require("path");
const fs = require("fs");

/**
 * Txfns processing
 */
function txfns(context) {
    let bnd = context._bnd;

    // generate the flowcharts
    context.scripts.files.forEach((file) => {
        file.functions.forEach((fn) => {
            let name = fn.name;
            let code = fn.text;
            let svg = js2flowchart.convertCodeToSvg(code);
            fs.writeFileSync(path.resolve(context._meta.args.outdir, name + '.svg'), svg, 'utf-8');
        });
    });


    return context;
}

module.exports = txfns;