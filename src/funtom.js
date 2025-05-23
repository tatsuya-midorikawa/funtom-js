Object.prototype.pipe = function (fn, ...args) { return fn(this, ...args); }
Function.prototype.compose = function (fn) { return function (...args) { fn(this(...args)); } }
Function.prototype.curry = function (...args) {
  const f = this;
  const curried = (...args) => args.length >= f.length
    ? f.apply(f, args)
    : (...nextArgs) => curried.apply(f, args.concat(nextArgs));
  return curried.apply(f, args);
}

const nameof = obj => obj?.constructor.name ?? '';

// Pattern Matching
//   This is a simple pattern matching function that allows you to match against the name of the class.
//   When performing pattern matching, you need to define a method with the same name as the type. For example, in the case of the Just class, you must define a method called Just.
// Usage:
//   class Just {
//      constructor(value) {
//        this.value = value;
//      }
//      Just = _ => _.Just(this.value);   // Need to use this to avoid recursion
//   }
//
//   class Nothing {
//      Nothing = _ => _.Nothing();
//   }
//
//   let just = new Just(5);
//   let nothing = new Nothing();
//
//   // Output: Just: 5
//   match(just, {
//     Just: v => console.log(`Just: ${v}`),
//     Nothing: () => console.log('Nothing'),
//     _ : () => console.log('Unknown'),
//   });
//
//   // Output: Nothing
//   match(nothing, {
//     Just: v => console.log(`Just: ${v}`),
//     Nothing: () => console.log('Nothing'),
//     _ : () => console.log('Unknown'),
//   });
// 
//   // Output: Unknown
//   match({ name: 100 }, {
//     Just: v => console.log(`Just: ${v}`),
//     Nothing: () => console.log('Nothing'),
//     _ : () => console.log('Unknown'),
//   });
const match = (obj, pattern) => {
  const name = nameof(obj);
  return obj && obj[name] && pattern[name]
    ? obj[name](pattern)
    : pattern['_']
      ? pattern['_']()
      : obj;
}

// Maybe Monad
// Usage:
//    const maybe = Maybe.Just(5)
//        .pipe(Maybe.bind(x => Maybe.Just(x + 1)))
//        .pipe(Maybe.map(x => x + 1))
//        .pipe(Maybe.get);
class Maybe {
  static Just = value => new Just(value);
  static Nothing = () => new Nothing();

  // ('T -> Maybe<'U>) -> Maybe<'T> -> Maybe<'U>
  static bind = binder => maybe => match(maybe, {
    Just: v => binder(v),
    Nothing: () => maybe,
  });
  // 'T -> Maybe<'T> -> bool
  static contains = value => maybe => match(maybe, {
    Just: v => v === value,
    Nothing: () => false,
  });
  // Maybe<'T> -> Maybe<'T> -> bool
  static equals = lhs => rhs => match(lhs, {
    Just: v1 => match(rhs, { Just: v2 => v1 === v2, Nothing: () => false, }),
    Nothing: () => match(rhs, { Just: _ => false, Nothing: () => true, }),
  });
  // ('T -> bool) -> Maybe<'T> -> bool
  static exists = predicate => maybe => match(maybe, {
    Just: v => predicate(v),
    Nothing: () => false,
  });
  // ('T -> bool) -> Maybe<'T> -> Maybe<'T>
  static filter = predicate => maybe => match(maybe, {
    Just: value => predicate(value) ? maybe : _.Nothing(),
    Nothing: () => maybe,
  });
  // ('State -> 'T -> 'State) -> 'State -> Maybe<'T> -> 'State
  static fold = folder => state => maybe => match(maybe, {
    Just: value => folder(state, value),
    Nothing: () => state,
  });
  // 'T -> Maybe<'T>
  static fromNullable = value => value != null 
    ? Maybe.Just(value) 
    : Maybe.Nothing();
  // Maybe<'T> -> 'T
  static get = maybe => match(maybe, {
    Just: value => value,
    Nothing: () => null,
  });
  // 'T -> Maybe<'T> -> 'T
  static getOrElse = defaultValue => maybe => match(maybe, {
    Just: value => value,
    Nothing: () => defaultValue,
  });
  // Maybe<'T> -> ('T -> 'U) -> Maybe<'U>
  static map = mapper => maybe => match(maybe, {
    Just: value => {
      let v = mapper(value);
      return v ? Maybe.Just(v) : Maybe.Nothing();
    },
    Nothing: () => maybe,
  });
  // Maybe<'T> -> 'T[]
  static toArray = maybe => match(maybe, {
    Just: value => [value],
    Nothing: () => [],
  });
  
  isJust = () => false;
  isNothing = () => false; 
}

class Just extends Maybe {
  constructor (value) {
    super();
    this.value = value;
  }

  Just = _ => _.Just(this.value);
  isJust = () => true;
}

class Nothing extends Maybe {
  Nothing = _ =>  _.Nothing();
  isNothing = () => true; 
}

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

  _.Date = {
    now: () => _.IO(() => new Date()), // unit -> IO<Date>
  }
}(this));