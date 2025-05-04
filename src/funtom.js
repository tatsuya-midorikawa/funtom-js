Object.prototype.pipe = (fx, ...args) => fx(this, ...args);
Object.prototype.compose = (fx) => (...args) => fx(this(...args));