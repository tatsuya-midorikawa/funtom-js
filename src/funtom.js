Object.prototype.pipe = function(fn, ...args) { return fn(this, ...args); }
Function.prototype.compose = function(fn) { return function(...args) { fn(this(...args)); } }
Function.prototype.curry = function (...args) {
  const f = this;
  const curried = (...args) => args.length >= f.length
    ? f.apply(f, args)
    : (...nextArgs) => curried.apply(f, args.concat(nextArgs));
  return curried.apply(f, args);
}

const match = (expression, pattern) => expression(pattern);

// Maybe Monad
// Usage:
//    const maybe = Maybe.Just(5)
//        .pipe(Maybe.bind(x => Maybe.Just(x + 1)))
//        .pipe(Maybe.map(x => x + 1))
//        .pipe(Maybe.value);
var Maybe = Maybe || {};
(function (global) {
  const _ = Maybe;
  // Maybe Patterns : Just, Nothing
  _.Just = value => _ => _.Just(value);         // 'T -> 'U -> Maybe<'T>
  _.Nothing = () => _ => _.Nothing();           // unit -> 'U -> Maybe<'T>

  // ('T -> Maybe<'U>) -> Maybe<'T> -> Maybe<'U>
  _.bind = binder => maybe => match(maybe, {     
    Just: value => binder(value),
    Nothing: () => maybe,
  });

  // 'T -> Maybe<'T> -> bool
  _.contains = value => maybe => match(maybe, { 
    Just: v => v === value,
    Nothing: () => false,
  });

  // Maybe<'T> -> Maybe<'T> -> bool
  _.equals = lhs => rhs => match(lhs, {
    Just: v1 => match(rhs, { Just: v2 => v1 === v2, Nothing: () => false, }),
    Nothing: () => match(rhs, { Just: _ => false, Nothing: () => true, }),
  });

  // ('T -> bool) -> Maybe<'T> -> bool
  _.exists = predicate => maybe => match(maybe, { 
    Just: value => predicate(value),
    Nothing: () => false,
  });
  
  // ('T -> bool) -> Maybe<'T> -> Maybe<'T>
  _.filter = predicate => maybe => match(maybe, { 
    Just: value => predicate(value) ? maybe : _.Nothing(),
    Nothing: () => maybe,
  });

  // Maybe<'T> -> ('T -> 'U) -> Maybe<'U>
  _.map = mapper => maybe => match(maybe, {     
    Just: value =>  {
      let v = mapper(value);
      return v ? _.Just(v) : _.Nothing();
    },
    Nothing: () => maybe,
  });

  // ('State -> 'T -> 'State) -> 'State -> Maybe<'T> -> 'State
  _.fold = folder => state => maybe => match(maybe, { 
    Just: value => folder(state, value),
    Nothing: () => state,
  });

  // Maybe<'T> -> 'T
  _.get = maybe => match(maybe, {
    Just: value => value,
    Nothing: () => null,
  });

  // Maybe<'T> -> 'T[]
  _.toArray = maybe => match(maybe, {
    Just: value => [value],
    Nothing: () => [],
  });

}(this));

var IO = IO || {};
(function (global) {
  const _ = IO;
  // IO Patterns : IO
  _.IO = action => _ => _.IO(action);         // (() -> 'T) -> _ -> IO<'T>
  _.Pure = value => _ => _.Pure(() => value);   // 'T -> _ -> IO<'T>

  // ('T -> IO<'U>) -> IO<'T> -> IO<'U>
  _.bind = binder => io => match(io, {     
    IO: fn => binder(fn()),  
    Pure: fn => binder(fn()),
  });

  // ('T -> 'U) -> IO<'T> -> IO<'U>
  _.map = mapper => io => match(io, {
    IO: fn => _.IO(() => mapper(fn())),
    Pure: fn => _.Pure(mapper(fn())),
  });

  // IO<'T> -> 'T
  _.run = io => match(io, {
    IO: fn => fn(),
    Pure: fn => fn(),
  });

  _.console = {
    log: message => _.IO(() => console.log(message)), // 'T -> IO<'T>
    error: message => _.IO(() => console.error(message)), // 'T -> IO<'T>
    warn: message => _.IO(() => console.warn(message)), // 'T -> IO<'T>
    info: message => _.IO(() => console.info(message)), // 'T -> IO<'T>
  }

  _.datetime = {
    now: () => _.IO(() => new Date()), // unit -> IO<Date>
  }
}(this));