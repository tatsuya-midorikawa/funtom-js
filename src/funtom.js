Object.prototype.pipe = (fx, ...args) => fx(this, ...args);
Function.prototype.compose = (fx) => (...args) => fx(this(...args));
Function.prototype.curry = function (...args) {
  const f = this;
  const curried = (...args) => args.length >= f.length
    ? f.apply(f, args)
    : (...nextArgs) => curried.apply(f, args.concat(nextArgs));
  return curried.apply(f, args);
}

// Maybe Monad
var Maybe = Maybe || {};
(function (global) {
  const _ = Maybe;
  _.Just = function (value) {
    this.value = value;
  }
  _.Just.prototype.bind = function (transform) {
    return transform(this.value);
  }
  _.Just.prototype.toString = function () {
    return 'Just(' + this.value + ')';
  }
  _.Nothing = function () {
    this.value = null;
  }
  _.Nothing.prototype.bind = function () {
    return this;
  }
  _.Nothing.prototype.toString = function () {
    return 'Nothing';
  }
}(this));
