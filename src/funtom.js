Object.prototype.pipe = (fx, ...args) => fx(this, ...args);
Function.prototype.compose = (fx) => (...args) => fx(this(...args));
Function.prototype.curry = function(...args) {
  const f = this;
  const curried = function(...args) {
    if (args.length >= f.length) {
      return f.apply(f, args);
    } else {
      return function (...nextArgs) {
        return curried.apply(f, args.concat(nextArgs));
      };
    }
  };
  return args.length >= f.length 
    ? f.apply(f, args)
    : curried.apply(f, args);
};