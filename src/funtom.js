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
  _.Just = value => _ => _.Just(value);         // 'T => 'U => Maybe<'T>
  _.Nothing = () => _ => _.Nothing();           // 'T => 'U => Maybe<'T>
  _.value = maybe => match(maybe, {             // Maybe<'T> => 'T
    Just: value => value,
    Nothing: () => null,
  });
  _.bind = binder => maybe => match(maybe, {     // ('T => Maybe<'U>) => Maybe<'T> => Maybe<'U>
    Just: value => binder(value),
    Nothing: () => maybe,
  });
  _.map = mapper => maybe => match(maybe, {     // Maybe<'T> => ('T => 'U) => Maybe<'U>
    Just: value =>  {
      let v = mapper(value);
      return v ? _.Just(v) : _.Nothing();
    },
    Nothing: () => maybe,
  });

}(this));
