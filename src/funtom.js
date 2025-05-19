Object.prototype.pipe = function(fx, ...args) { return fx(this, ...args); }
Function.prototype.compose = function(fx) { return function(...args) { fx(this(...args)); } }
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
