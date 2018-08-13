import {
  surroundingAgent,
  EnqueueJob,
  HostPromiseRejectionTracker,
} from '../engine.mjs';
import {
  Type,
  New as NewValue,
  wellKnownSymbols,
} from '../value.mjs';
import {
  Assert,
  IsCallable,
  CreateBuiltinFunction,
  Call,
  OrdinaryCreateFromConstructor,
  SameValue,
  Construct,
  Get,
  IsPromise,
  IsConstructor,
} from '../abstract-ops/all.mjs';
import {
  Q,
  NormalCompletion,
  AbruptCompletion,
  ThrowCompletion,
} from '../completion.mjs';

export function PromiseResolve(C, x) {
  Assert(Type(C) === 'Object');
  if (IsPromise(x).isTrue()) {
    const xConstructor = Q(Get(x, NewValue('constructor')));
    if (SameValue(xConstructor, C)) {
      return x;
    }
  }
  const promiseCapability = NewPromiseCapability(C);
  Q(Call(promiseCapability.Resolve, NewValue(undefined), [x]));
  return promiseCapability.Promise;
}

function GetCapabilitiesExecutorFunctions(realm, [resolve, reject]) {
  const F = this;

  const promiseCapability = F.Capability;
  if (promiseCapability.Resolve !== undefined) {
    return surroundingAgent.Throw('TypeError');
  }
  if (promiseCapability.Reject !== undefined) {
    return surroundingAgent.Throw('TypeError');
  }
  promiseCapability.Resolve = resolve;
  promiseCapability.Reject = reject;
  return NewValue(undefined);
}

class PromiseCapabilityRecord {}

export function NewPromiseCapability(C) {
  if (IsConstructor(C).isFalse()) {
    return surroundingAgent.Throw('TypeError');
  }
  const promiseCapability = new PromiseCapabilityRecord();
  const steps = GetCapabilitiesExecutorFunctions;
  const executor = CreateBuiltinFunction(steps, ['Capability']);
  executor.Capability = promiseCapability;
  const promise = Q(Construct(C, [executor]));
  if (IsCallable(promiseCapability.Resolve).isFalse()) {
    return surroundingAgent.Throw('TypeError');
  }
  if (IsCallable(promiseCapability.Reject).isFalse()) {
    return surroundingAgent.Throw('TypeError');
  }
  promiseCapability.Promise = promise;
  return promiseCapability;
}

export function PromiseReactionJob(reaction, argument) {
  // Assert: reaction is a PromiseReaction Record.
  const promiseCapability = reaction.Capability;
  const type = reaction.Type;
  const handler = reaction.Handler;
  let handlerResult;
  if (Type(handler) === 'Undefined') {
    if (type === 'Fulfill') {
      handlerResult = new NormalCompletion(argument);
    } else {
      Assert(type === 'Reject');
      handlerResult = new ThrowCompletion(argument);
    }
  } else {
    handlerResult = Call(handler, NewValue(undefined), [argument]);
  }
  let status;
  if (handlerResult instanceof AbruptCompletion) {
    status = Call(promiseCapability.Reject, NewValue(undefined), [handlerResult.Value]);
  } else {
    status = Call(promiseCapability.Resolve, NewValue(undefined), [handlerResult.Value]);
  }
  return status;
}

function PromiseResolveTheableJob(promiseToResolve, thenable, then) {
  const resolvingFunctions = CreateResolvingFunctions(promiseToResolve);
  const thenCallResult = Call(then, thenable, [
    resolvingFunctions.Resolve, resolvingFunctions.Reject,
  ]);
  if (thenCallResult instanceof AbruptCompletion) {
    const status = Call(resolvingFunctions.Reject, NewValue(undefined), [thenCallResult.Value]);
    return status;
  }
  return thenCallResult;
}

function TriggerPromiseReactions(reactions, argument) {
  reactions.forEach((reaction) => {
    EnqueueJob('PromiseJobs', PromiseReactionJob, [reaction, argument]);
  });
  return NewValue(undefined);
}

function FulfillPromise(promise, value) {
  Assert(promise.PromiseState === 'pending');
  const reactions = promise.PromiseFulfillReactions;
  promise.PromiseResult = value;
  promise.PromiseFulfillReactions = undefined;
  promise.PromiseRejectReactions = undefined;
  promise.PromiseState = 'fulfilled';
  return TriggerPromiseReactions(reactions, value);
}

function RejectPromise(promise, reason) {
  Assert(promise.PromiseState === 'pending');
  const reactions = promise.PromiseRejectReactions;
  promise.PromiseResult = reason;
  promise.PromiseFulfillReactions = undefined;
  promise.PromiseRejectReactions = undefined;
  promise.PromiseState = 'rejected';
  if (promise.PromiseIsHandled === false) {
    HostPromiseRejectionTracker(promise, 'reject');
  }
  return TriggerPromiseReactions(reactions, reason);
}

function PromiseResolveFunctions(realm, [resolution]) {
  const F = this;
  Assert('Promise' in F && Type(F.Promise) === 'Object');
  const promise = F.Promise;
  const alreadyResolved = F.AlreadyResolved;
  if (alreadyResolved.Value === true) {
    return NewValue(undefined);
  }
  alreadyResolved.Value = true;
  if (SameValue(resolution, promise) === true) {
    const selfResolutionError = Construct(surroundingAgent.intrinsic('%TypeError%'), []);
    return RejectPromise(promise, selfResolutionError);
  }
  if (Type(resolution) !== 'Object') {
    return FulfillPromise(promise, resolution);
  }

  const then = Get(resolution, NewValue('then'));
  if (then instanceof AbruptCompletion) {
    return RejectPromise(promise, then.Value);
  }
  const thenAction = then.Value;
  if (IsCallable(thenAction).isFalse()) {
    return FulfillPromise(promise, resolution);
  }
  EnqueueJob('PromiseJobs', PromiseResolveTheableJob, [promise, resolution, thenAction]);
  return NewValue(undefined);
}

function PromiseRejectFunctions(realm, [reason]) {
  const F = this;
  Assert('Promise' in F && Type(F.Promise) === 'Object');
  const promise = F.Promise;
  const alreadyResolved = F.AlreadyResolved;
  if (alreadyResolved.Value === true) {
    return NewValue(undefined);
  }
  alreadyResolved.Value = true;
  return RejectPromise(promise, reason);
}

function CreateResolvingFunctions(promise) {
  const alreadyResolved = { Value: false };
  const stepsResolve = PromiseResolveFunctions;
  const resolve = CreateBuiltinFunction(stepsResolve, ['Promise', 'AlreadyResolved']);
  resolve.Promise = promise;
  resolve.AlreadyResolved = alreadyResolved;
  const stepsReject = PromiseRejectFunctions;
  const reject = CreateBuiltinFunction(stepsReject, ['Promise', 'AlreadyResolved']);
  reject.Promise = promise;
  reject.AlreadyResolved = alreadyResolved;
  return {
    Resolve: resolve,
    Reject: reject,
  };
}

function PromiseConstructor(realm, [executor], { NewTarget }) {
  if (Type(NewTarget) === 'Undefined') {
    return surroundingAgent.Throw('TypeError');
  }
  if (IsCallable(executor).isFalse()) {
    return surroundingAgent.Throw('TypeError');
  }
  const promise = Q(OrdinaryCreateFromConstructor(NewTarget, '%PromisePrototype%', [
    'PromiseState',
    'PromiseResult',
    'PromiseFulfillReactions',
    'PromiseRejectReactions',
    'PromiseIsHandled',
  ]));
  promise.PromiseState = 'pending';
  promise.PromiseFulfillReactions = [];
  promise.PromiseRejectReactions = [];
  promise.PromiseIsHandled = false;
  const resolvingFunctions = CreateResolvingFunctions(promise);
  const completion = Call(executor, NewValue(undefined), [
    resolvingFunctions.Resolve, resolvingFunctions.Reject,
  ]);
  if (completion instanceof AbruptCompletion) {
    Q(Call(resolvingFunctions.Reject, NewValue(undefined), [completion.Value]));
  }
  return promise;
}

function PromiseAll() {
  return NewValue(undefined);
}

function PromiseRace() {
  return NewValue(undefined);
}

function PromiseReject(realm, [r], { thisValue }) {
  const C = thisValue;
  if (Type(C) !== 'Object') {
    return surroundingAgent.Throw('TypeError');
  }
  const promiseCapability = NewPromiseCapability(C);
  Q(Call(promiseCapability.Reject, NewValue(undefined), [r]));
  return promiseCapability.Promise;
}

function JSPromiseResolve(realm, [x], { thisValue }) {
  const C = thisValue;
  if (Type(C) !== 'Object') {
    return surroundingAgent.Throw('TypeError');
  }
  return Q(PromiseResolve(C, x));
}

function PromiseSymbolSpecies(realm, args, { thisValue }) {
  return thisValue;
}

export function CreatePromise(realmRec) {
  const promiseConstructor = CreateBuiltinFunction(PromiseConstructor, [], realmRec);

  const proto = realmRec.Intrinsics['%PromisePrototype%'];

  promiseConstructor.DefineOwnProperty(NewValue('prototype'), {
    Value: proto,
    Writable: true,
    Enumerable: false,
    Configurable: true,
  });
  proto.DefineOwnProperty(NewValue('constructor'), {
    Value: promiseConstructor,
    Writable: true,
    Enumerable: false,
    Configurable: true,
  });

  [
    ['all', PromiseAll],
    ['race', PromiseRace],
    ['reject', PromiseReject],
    ['resolve', JSPromiseResolve],
  ].forEach(([name, fn]) => {
    promiseConstructor.DefineOwnProperty(NewValue(name), {
      Value: CreateBuiltinFunction(fn, [], realmRec),
      Writable: true,
      Enumerable: false,
      Configurable: true,
    });
  });

  promiseConstructor.DefineOwnProperty(wellKnownSymbols.species, {
    Get: CreateBuiltinFunction(PromiseSymbolSpecies, [], realmRec),
    Set: NewValue(undefined),
    Enumerable: false,
    Configurable: true,
  });

  realmRec.Intrinsics['%Promise_all%'] = Get(promiseConstructor, NewValue('all'));
  realmRec.Intrinsics['%Promise_reject%'] = Get(promiseConstructor, NewValue('reject'));
  realmRec.Intrinsics['%Promise_resolve%'] = Get(promiseConstructor, NewValue('resolve'));

  realmRec.Intrinsics['%Promise%'] = promiseConstructor;
}
