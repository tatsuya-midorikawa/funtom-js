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
  static just = value => new Just(value);
  static nothing = () => new Nothing();

  // bind :: (a -> Maybe b) -> Maybe a -> Maybe b
  static bind = binder => maybe => match(maybe, {
    Just: v => binder(v),
    Nothing: () => maybe,
  });
  // contains :: a -> Maybe a -> bool
  static contains = value => maybe => match(maybe, {
    Just: v => v === value,
    Nothing: () => false,
  });
  // equals :: Maybe a -> Maybe a -> bool
  static equals = lhs => rhs => match(lhs, {
    Just: v1 => match(rhs, { Just: v2 => v1 === v2, Nothing: () => false, }),
    Nothing: () => match(rhs, { Just: _ => false, Nothing: () => true, }),
  });
  // exists :: (a -> bool) -> Maybe a -> bool
  static exists = predicate => maybe => match(maybe, {
    Just: v => predicate(v),
    Nothing: () => false,
  });
  // filter :: (a -> bool) -> Maybe a -> Maybe a
  static filter = predicate => maybe => match(maybe, {
    Just: value => predicate(value) ? maybe : _.Nothing(),
    Nothing: () => maybe,
  });
  // fold :: (state -> a -> state) -> state -> Maybe a -> state
  static fold = folder => state => maybe => match(maybe, {
    Just: value => folder(state, value),
    Nothing: () => state,
  });
  // fromNullable :: a -> Maybe a
  static fromNullable = value => value != null 
    ? Maybe.just(value) 
    : Maybe.nothing();
  // get :: Maybe a -> a | null
  static get = maybe => match(maybe, {
    Just: value => value,
    Nothing: () => null,
  });
  // getOrElse :: a -> Maybe a -> a
  static getOrElse = defaultValue => maybe => match(maybe, {
    Just: value => value,
    Nothing: () => defaultValue,
  });
  // map :: Maybe a -> (a -> b) -> Maybe a
  static map = mapper => maybe => match(maybe, {
    Just: value => {
      let v = mapper(value);
      return v ? Maybe.just(v) : Maybe.nothing();
    },
    Nothing: () => maybe,
  });
  // toArray :: Maybe a -> a[]
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

// IO Monad
// Usage:
//    const io = IO.of(() => 5)
//        .pipe(IO.bind(x => IO.of(() => x + 1)))
//        .pipe(IO.map(x => x + 1))
//        .pipe(IO.run);
class IO {
  constructor(effect) {
    if (typeof effect !== 'function') {
      throw new Error('IO expects a function');
    }
    this.effect = effect;
  }

  IO = _ => _.IO(this.effect);

  // pure :: a -> IO a
  static pure = value => new IO(() => value);
  // of :: (() -> a) -> IO a
  static of = effect => new IO(effect);

  // bind :: (a -> IO b) -> IO a -> IO b
  static bind = binder => io => new IO(() => binder(io.effect()));
  // map :: (a -> b) -> IO a -> IO b
  static map = mapper => io => new IO(() => mapper(io.effect()));
  // run :: IO a -> a
  static run = io => match(io, { IO: effect => IO.run(effect()), _ : () => io });

  static console = {
    log: (msg, ...params) => new IO(() => console.log(msg, ...params)),
    error: (msg, ...params) => new IO(() => console.error(msg, ...params)),
    warn: (msg, ...params) => new IO(() => console.warn(msg, ...params)),
    info: (msg, ...params) => new IO(() => console.info(msg, ...params)),
    table: (data, properties) => new IO(() => console.table(data, ...properties)),
  }

  static Date = {
    now: () => new IO(() => Date.now()),
  }

  static Math = {
    random: () => new IO(() => Math.random()),
  }
}