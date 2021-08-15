const Prapi = require('./index')

module.exports = {
  deferred() {
    const promise = new Prapi()
    return {
      promise,
      resolve: promise.resolve,
      reject: promise.reject,
    }
  }
}