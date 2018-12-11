import { surroundingAgent } from './engine.mjs';
import {
  Value,
  Descriptor,
  BuiltinFunctionValue,
  ModuleRecord,
} from './value.mjs';
import { ToString, DefinePropertyOrThrow } from './abstract-ops/all.mjs';
import { X, AwaitFulfilledFunctions } from './completion.mjs';
import { inspect } from './api.mjs';

export class OutOfRange extends RangeError {
  constructor(fn, detail) {
    super(`${fn}() argument out of range`);

    this.detail = detail;
  }
}

export class CallSite {
  constructor(context) {
    this.context = context;
    this.isToplevel = false;
    this.isConstructor = false;
    this.lineNumber = null;
    this.columnNumber = null;
    this.methodName = null;
    this.evalOrigin = null;
  }

  isEval() {
    return this.context.Function === this.context.Realm.Intrinsics['%eval%'];
  }

  isNative() {
    return this.context.Function instanceof BuiltinFunctionValue;
  }

  isAsync() {
    if (this.context.Function !== Value.null) {
      return this.context.Function.ECMAScriptCode && this.context.Function.ECMAScriptCode.async;
    }
    return false;
  }

  getThisValue() {
    if (this.context.LexicalEnvironment.HasThisBinding() === Value.true) {
      return this.context.LexicalEnvironment.GetThisBinding();
    }
    return null;
  }

  getFunctionName() {
    if (this.context.Function !== Value.null) {
      const name = this.context.Function.properties.get(new Value('name'));
      if (name) {
        return X(ToString(name.Value)).stringValue();
      }
    }
    return null;
  }

  getSpecifier() {
    if (this.context.ScriptOrModule instanceof ModuleRecord) {
      return this.context.ScriptOrModule.HostDefined.specifier;
    }
    return null;
  }

  getMethodName() {
    const idx = surroundingAgent.executionContextStack.indexOf(this.context);
    const parent = surroundingAgent.executionContextStack[idx - 1];
    if (parent) {
      return parent.callSite.methodName;
    }
    return null;
  }

  setLocation(node) {
    const { line, column } = node.loc.start;
    this.lineNumber = line;
    this.columnNumber = column;
    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      if (node.callee.type === 'MemberExpression' || node.callee.type === 'Identifier') {
        this.methodName = node.callee.sourceText();
      }
    }
  }

  copy(context) {
    const c = new CallSite(context);
    c.isToplevel = this.isToplevel;
    c.isConstructor = this.isConstructor;
    c.lineNumber = this.lineNumber;
    c.columnNumber = this.columnNumber;
    c.methodName = this.methodName;
    c.evalOrigin = this.evalOrigin;
    return c;
  }

  static loc(site) {
    if (site.isNative() && !site.isEval()) {
      return '(native)';
    }
    let out = '';
    const specifier = site.getSpecifier();
    if (!specifier && site.isEval()) {
      out += this.formatEvalOrigin(site.evalOrigin);
    }
    if (specifier) {
      out += specifier;
    } else {
      out += '<anonymous>';
    }
    if (site.lineNumber !== null) {
      out += `:${site.lineNumber}`;
      if (site.columnNumber !== null) {
        out += `:${site.columnNumber}`;
      }
    }
    return out.trim();
  }

  static formatEvalOrigin(origin) {
    const specifier = origin.getSpecifier();
    if (specifier) {
      return specifier;
    }
    let out = 'eval at ';

    const name = origin.getFunctionName();
    if (name) {
      out += name;
    } else {
      out += '<anonymous>';
    }

    if (origin.lineNumber !== null) {
      out += `:${origin.lineNumber}`;
      if (origin.columnNumber !== null) {
        out += `:${origin.columnNumber}`;
      }
    }

    out += ', ';

    return out;
  }

  toString() {
    const isAsync = this.isAsync();
    const functionName = this.getFunctionName();
    const isMethodCall = !(this.isToplevel || this.isConstructor);

    let string = isAsync ? 'async ' : '';

    if (isMethodCall) {
      const methodName = this.getMethodName();
      if (functionName) {
        string += functionName;
        if (methodName && functionName !== methodName && !methodName.endsWith(functionName)) {
          string += ` [as ${methodName}]`;
        }
      } else if (methodName) {
        string += methodName;
      } else {
        string += '<anonymous>';
      }
    } else if (this.isConstructor) {
      string += 'new ';
      if (functionName) {
        string += functionName;
      } else {
        string += '<anonymous>';
      }
    } else if (functionName) {
      string += functionName;
    } else {
      return `${string}${CallSite.loc(this)}`;
    }

    return `${string} (${CallSite.loc(this)})`;
  }
}

export function unwind(iterator, maxSteps = 1) {
  let steps = 0;
  while (true) {
    const { done, value } = iterator.next('Unwind');
    if (done) {
      return value;
    }
    steps += 1;
    if (steps > maxSteps) {
      throw new RangeError('Max steps exceeded');
    }
  }
}

const kSafeToResume = Symbol('kSameToResume');

export function handleInResume(fn, ...args) {
  const bound = () => fn(...args);
  bound[kSafeToResume] = true;
  return bound;
}

export function resume(context, completion) {
  const { value } = context.codeEvaluationState.next(completion);
  if (typeof value === 'function' && value[kSafeToResume] === true) {
    return X(value());
  }
  return value;
}

function inlineInspect(V) {
  return inspect(V, surroundingAgent.currentRealmRecord, true);
}

const kMaxAsyncFrames = 8;
function captureAsyncStackTrace(stack, promise) {
  let added = 0;
  while (added < kMaxAsyncFrames) {
    if (promise.PromiseFulfillReactions.length !== 1) {
      return;
    }
    const [reaction] = promise.PromiseFulfillReactions;
    if (reaction.Handler.nativeFunction === AwaitFulfilledFunctions) {
      const asyncContext = reaction.Handler.AsyncContext;
      stack.push(asyncContext.callSite);
      added += 1;
      if ('PromiseState' in asyncContext.promiseCapability.Promise) {
        promise = asyncContext.promiseCapability.Promise;
      } else {
        return;
      }
    } else {
      if ('PromiseState' in reaction.Capability.Promise) {
        promise = reaction.Capability.Promise;
      } else {
        return;
      }
    }
  }
}

export function captureStack(O) {
  const stack = [];

  for (const e of surroundingAgent.executionContextStack.slice(0, -1).reverse()) {
    stack.push(e.callSite);
    if (e.callSite.isToplevel) {
      break;
    }
  }

  if (stack[0].context.promiseCapability) {
    stack.pop();
    captureAsyncStackTrace(stack, stack[0].context.promiseCapability.Promise);
  }

  const errorString = X(ToString(O)).stringValue();
  const trace = `${errorString}${stack.map((s) => `\n  at ${s}`).join('')}`;

  X(DefinePropertyOrThrow(O, new Value('stack'), Descriptor({
    Value: new Value(trace),
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.false,
  })));
}

const messages = {
  NotAFunction: (v) => `${inlineInspect(v)} is not a function`,
  NotAConstructor: (v) => `${inlineInspect(v)} is not a constructor`,
  NotAnObject: (v) => `${inlineInspect(v)} is not an object`,
  NotATypeObject: (t, v) => `${inlineInspect(v)} is not a ${t} object`,
  NotAnTypeObject: (t, v) => `${inlineInspect(v)} is not an ${t} object`,
  PromiseResolveFunction: (v) => `Promise resolve function ${inlineInspect(v)} is not callable`,
  PromiseRejectFunction: (v) => `Promise reject function ${inlineInspect(v)} is not callable`,
  ProxyRevoked: (n) => `Cannot perform '${n}' on a proxy that has been revoked`,
  BufferDetachKeyMismatch: (k, b) => `${inlineInspect(k)} is not the [[ArrayBufferDetachKey]] of ${inlineInspect(b)}`,
  BufferDetached: () => 'Cannot operate on detached ArrayBuffer',
  TypedArrayTooSmall: () => 'Derived TypedArray constructor created an array which was too small',
  NotDefined: (n) => `${inlineInspect(n)} is not defined`,
  StrictModeDelete: (n) => `Cannot not delete property ${inlineInspect(n)}`,
  CannotSetProperty: (p, o) => `Cannot set property ${inlineInspect(p)} on ${inlineInspect(o)}`,
  AlreadyDeclared: (n) => `${inlineInspect(n)} is already declared`,
  ConstructorRequiresNew: (n) => `${n} constructor requires new`,
  NegativeIndex: (n = 'Index') => `${n} cannot be negative`,
  TypedArrayOffsetAlignment: (n, m) => `Start offset of ${n} should be a multiple of ${m}`,
  TypedArrayCreationOOB: () => 'Sum of start offset and byte length should be less than the size of underlying buffer',
  TypedArrayOOB: () => 'Sum of start offset and byte length should be less than the size of the TypedArray',
  TypedArrayLengthAlignment: (n, m) => `Size of ${n} should be a multiple of ${m}`,
  DataViewOOB: () => 'Offset is outside the bounds of the DataView',
  ResolutionNullOrAmbiguous: (r, n, m) => (r === null
    ? `Could not resolve import ${inlineInspect(n)} from ${m.HostDefined.specifier}`
    : `Star export ${inlineInspect(n)} from ${m.HostDefined.specifier} is ambiguous`),
  CouldNotResolveModule: (s) => `Could not resolve module ${inlineInspect(s)}`,
  ArrayPastSafeLength: () => 'Cannot make length of array-like object surpass the bounds for a safe integer',
  SubclassSameValue: (v) => `Subclass constructor returned the same object ${inlineInspect(v)}`,
  SubclassLengthTooSmall: (v) => `Subclass constructor returned a smaller-than-requested object ${inlineInspect(v)}`,
  StringRepeatCount: (v) => `Count ${inlineInspect(v)} is invalid`,
  RegExpArgumentNotAllowed: (m) => `First argument to ${m} must not be a regular expression`,
  InvalidRegExpFlags: (f) => `Invalid RegExp flags: ${f}`,
  IncompatibleReceiver: (m) => `${m} called on incompatible receiver`,
  InvalidHint: (v) => `Invalid hint: ${inlineInspect(v)}`,
};

export function msg(key, ...args) {
  return messages[key](...args);
}
