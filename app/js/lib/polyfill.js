// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
;(function (global) {
  'use strict'
  global.console = global.console || {}
  var con = global.console
  var prop
  var method
  var empty = {}
  var dummy = function () {}
  var properties = 'memory'.split(',')
  var methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
  'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
  'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',')
  while (prop = properties.pop()) if (!con[prop]) con[prop] = empty
  while (method = methods.pop()) if (!con[method]) con[method] = dummy
})(typeof window === 'undefined' ? this : window)
// Using `this` for web workers while maintaining compatibility with browser
// targeted script loaders such as Browserify or Webpack where the only way to
// get to the global object is via `window`.

/* Array.indexOf polyfill */
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement, fromIndex) {
    var k
    if (this == null) {
      throw new TypeError('"this" is null or not defined')
    }

    var O = Object(this)
    var len = O.length >>> 0
    if (len === 0) {
      return -1
    }
    var n = +fromIndex || 0

    if (Math.abs(n) === Infinity) {
      n = 0
    }
    if (n >= len) {
      return -1
    }
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0)
    while (k < len) {
      if (k in O && O[k] === searchElement) {
        return k
      }
      k++
    }
    return -1
  }
}

/* Array.isArray polyfill */
if (!Array.isArray) {
  Array.isArray = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]'
  }
}

/* Object.create polyfill */
if (typeof Object.create != 'function') {
  Object.create = (function () {
    var Object = function () {}
    return function (prototype) {
      if (arguments.length > 1) {
        throw Error('Second argument not supported')
      }
      if (typeof prototype != 'object') {
        throw TypeError('Argument must be an object')
      }
      Object.prototype = prototype
      var result = { }
      Object.prototype = null
      return result
    }
  })()
}

/* Function.bind polyfill */
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== 'function') {
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable')
    }

    var aArgs = Array.prototype.slice.call(arguments, 1)
    var fToBind = this
    var fNOP = function () {}
    var fBound = function () {
      return fToBind.apply(this instanceof fNOP && oThis
        ? this
        : oThis,
        aArgs.concat(Array.prototype.slice.call(arguments)))
    }

    fNOP.prototype = this.prototype
    fBound.prototype = new fNOP()

    return fBound
  }
}

/* setZeroTimeout polyfill, from http://dbaron.org/log/20100309-faster-timeouts */
(function (global) {
  var messageName = 'zero-timeout-message'
  var originalSetTimeout = global.setTimeout
  var originalClearTimeout = global.clearTimeout

  var originalMinId = originalSetTimeout(function () {}, 0)
  var zeroTimeouts = []
  var zeroMinId = originalMinId + 100000000

  function setZeroTimeout (fn) {
    var timeoutId = ++zeroMinId
    zeroTimeouts.push([timeoutId, fn])
    global.postMessage(messageName, '*')
    return timeoutId
  }

  function clearZeroTimeout(timeoutId) {
    if (timeoutId && timeoutId >= zeroMinId) {
      for (var i = 0, len = zeroTimeouts.length; i < len; i++) {
        if (zeroTimeouts[i][0] == timeoutId) {
          console.warn('spliced timeout', timeoutId, i)
          zeroTimeouts.splice(i, 1)
          break
        }
      }
    }
  }

  function handleMessage (event) {
    if (event.source == global && event.data == messageName) {
      event.stopPropagation()
      if (zeroTimeouts.length > 0) {
        var fn = zeroTimeouts.shift()[1]
        fn()
      }
    }
  }

  global.addEventListener('message', handleMessage, true)

  global.setTimeout = function (callback, delay) {
    if (!delay || delay <= 5) {
      return setZeroTimeout(callback)
    }
    return originalSetTimeout(callback, delay)
  }

  global.clearTimeout = function (timeoutId) {
    if (timeoutId >= zeroMinId) {
      clearZeroTimeout(timeoutId)
    }
    return originalClearTimeout(timeoutId)
  }

  global.setZeroTimeout = setZeroTimeout
})(this)
