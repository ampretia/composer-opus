
/** Gets the basic information and adds to the context
 * 
 */
function basics(context) {
  let bnd = context._bnd;
  let bndMeta = bnd.getMetadata();
  context.core={};
  context.core.name = bnd.getName();
  context.core.version = bnd.getVersion();
  context.core.readme = bndMeta.readme;

  return context;
}

module.exports = basics;