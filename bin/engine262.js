#!/usr/bin/env node

'use strict';

require('@snek/source-map-support/register');
const repl = require('repl');
const fs = require('fs');
const path = require('path');
const {
  initializeAgent,
  inspect,
  Realm,
  AbruptCompletion,
  Value,
  Object: APIObject,
  Abstract,
  Throw,
} = require('..');

initializeAgent();

function createRealm() {
  const realm = new Realm({
    resolveImportedModule(referencingModule, specifier) {
      const dir = referencingModule.specifier === 'repl'
        ? `${process.cwd()}/repl`
        : path.dirname(referencingModule.specifier);
      const resolved = path.resolve(dir, specifier);
      if (realm.moduleEntry && resolved === realm.moduleEntry.specifier) {
        return realm.moduleEntry;
      }
      if (!fs.existsSync(resolved)) {
        return Throw(realm, 'Error', `Cannot resolve module ${specifier}`);
      }
      const source = fs.readFileSync(resolved, 'utf8');
      return realm.createSourceTextModule(resolved, source);
    },
  });

  const print = new Value(realm, (args) => {
    console.log(...args.map((a) => inspect(a))); // eslint-disable-line no-console
    return Value.undefined;
  }, [], realm);
  const raw = new Value(realm, (args) => {
    console.log(...args); // eslint-disable-line no-console
    return Value.undefined;
  }, [], realm);
  Abstract.CreateDataProperty(print, new Value(realm, 'raw'), raw);
  Abstract.CreateDataProperty(realm.global, new Value(realm, 'print'), print);

  const $ = new APIObject(realm);
  realm.$ = $;

  Abstract.CreateDataProperty($, new Value(realm, 'global'), realm.global);
  Abstract.CreateDataProperty($, new Value(realm, 'createRealm'), new Value(realm, () => {
    const r = createRealm();
    return r.$;
  }));
  Abstract.CreateDataProperty($, new Value(realm, 'evalScript'),
    new Value(realm, ([sourceText]) => realm.evaluateScript(sourceText.stringValue())));

  Abstract.CreateDataProperty(realm.global, new Value(realm, '$'), $);

  return realm;
}

if (process.argv[2]) {
  const realm = createRealm();
  const source = fs.readFileSync(process.argv[2], 'utf8');
  let result;
  if (process.argv[2].endsWith('.mjs')) {
    result = realm.createSourceTextModule(path.resolve(process.argv[2]), source);
    if (!(result instanceof AbruptCompletion)) {
      const module = result;
      realm.moduleEntry = module;
      result = module.Instantiate();
      if (!(result instanceof AbruptCompletion)) {
        result = module.Evaluate();
      }
    }
  } else {
    result = realm.evaluateScript(source);
  }
  if (result instanceof AbruptCompletion) {
    const inspected = inspect(result, realm);
    process.stdout.write(inspected);
    process.exit(1);
  } else {
    process.exit(0);
  }
} else {
  const realm = createRealm();
  const ctx = realm.createREPLContext();
  repl.start({
    prompt: '> ',
    eval: (cmd, context, filename, callback) => {
      const completion = ctx.evaluateREPLInput(cmd);
      callback(null, completion);
    },
    completer: () => [],
    writer: (o) => inspect(o, realm),
  });
}
