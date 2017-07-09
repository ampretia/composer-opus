function basics(context) {
  let bnd = context._bnd;
  let bndMeta = bnd.getMetadata();
  context.name = bnd.getName();
  context.version = bnd.getVersion();
  context.readme = bndMeta.readme;

  return context;
}


module.exports = basics;