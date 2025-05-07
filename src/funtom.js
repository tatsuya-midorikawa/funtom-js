Object.prototype.pipe = (fx, ...args) => fx(this, ...args);
Function.prototype.compose = (fx) => (...args) => fx(this(...args));
Function.prototype.curry = function(...args) {
  const f = this;
  const curried = (...args) => args.length >= f.length
    ? f.apply(f, args)
    : (...nextArgs) => curried.apply(f, args.concat(nextArgs));
  return curried.apply(f, args);
};