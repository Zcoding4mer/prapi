(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.Prapi = factory())
}(this, (function () {
  function resolvePromise(promise, x) {
    const xtype = typeof x
    if (promise === x) {
      reject(promise, TypeError('use same object'))
      return
    }
    if (x instanceof Prapi === true) {
      const reaction = createReaction(null, null, promise)
      if (x.state === 'pending') {
        addReaction(x, reaction)
      } else {
        performReaction(x, reaction)
      }
      return
    }
    if (xtype === 'object' && x !== null || xtype === 'function') {
      let then
      try {
        then = x.then
      } catch (e) {
        reject(promise, e)
        return
      }
      const ttype = typeof then
      if (ttype === 'function') {
        let called = false
        function resPromise(y) {
          if (!called) {
            called = true
            resolvePromise(promise, y)
          }
        }
        function rejPromise(r) {
          if (!called) {
            called = true
            reject(promise, r)
          }
        }
        try {
          then.call(x, resPromise, rejPromise)
        } catch (e) {
          if (!called) {
            called = true
            reject(promise, e)
          }
        }
      } else {
        resolve(promise, x)
        return
      }
    } else {
      resolve(promise, x)
      return
    }
  }
  function reject(promise, reason) {
    if (promise.state !== 'pending') return promise
    promise.state = 'rejected'
    promise.result = reason
    performAllReactions(promise)
    return promise
  }
  function resolve(promise, value) {
    if (promise.state !== 'pending') return promise
    promise.state = 'fulfilled'
    promise.result = value
    performAllReactions(promise)
    return promise
  }
  function createReaction(onFulfilled, onRejected, nextPromise) {
    const onFulfilledType = typeof onFulfilled
    const onRejectedType = typeof onRejected
    return function (prePromise) {
      const promiseResult = prePromise.result
      const promiseState = prePromise.state
      if (promiseState === 'fulfilled') {
        setTimeout(() => {
          if (onFulfilledType !== 'function') {
            resolvePromise(nextPromise, promiseResult)
            return
          } else {
            let onFulfilledResult
            try {
              onFulfilledResult = onFulfilled(promiseResult)
            } catch (e) {
              reject(nextPromise, e)
              return
            }
            resolvePromise(nextPromise, onFulfilledResult)
          }
        }, 0)
      } else if (promiseState === 'rejected') {
        setTimeout(() => {
          if (onRejectedType !== 'function') {
            reject(nextPromise, promiseResult)
            return
          } else {
            let onRejectedResult
            try {
              onRejectedResult = onRejected(promiseResult)
            } catch (e) {
              reject(nextPromise, e)
              return
            }
            resolvePromise(nextPromise, onRejectedResult)
          }
        }, 0)
      }
    }
  }
  function addReaction(promise, reaction) {
    promise.reactions.push(reaction)
  }
  function performReaction(promise, reaction) {
    reaction(promise)
  }
  function performAllReactions(promise) {
    if (promise.state === 'pending') return
    const reactionsLength = promise.reactions.length
    for (let i = 0; i < reactionsLength; i++) {
      const reaction = promise.reactions.shift()
      reaction(promise)
    }
  }
  function Prapi() {
    if (typeof new.target === 'undefined') return
    this.state = 'pending'
    this.result = undefined
    this.reactions = []
    this.resolve = resolvePromise.bind(null, this)
    this.reject = reject.bind(null, this)
  }

  Prapi.resolve = function (value) {
    const p = new Prapi()
    resolve(p, value)
    return p
  }
  Prapi.reject = function (reason) {
    const p = new Prapi()
    reject(p, reason)
    return p
  }
  Prapi.prototype.then = function (onFulfilled, onRejected) {
    const prePromise = this
    const promiseState = prePromise.state
    const nextPromise = new Prapi()
    const reaction = createReaction(onFulfilled, onRejected, nextPromise)
    if (promiseState !== 'pending') {
      performReaction(prePromise, reaction)
    } else {
      addReaction(prePromise, reaction)
    }
    return nextPromise
  }
  return Prapi
})))