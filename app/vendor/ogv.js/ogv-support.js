/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	//
	// -- ogv-support.js
	// https://github.com/brion/ogv.js
	// Copyright (c) 2013-2016 Brion Vibber
	//

	(function() {

	  var OGVCompat = __webpack_require__(1),
	    OGVVersion = ("1.4.2-20170425024925-504d7197");

	  if (window) {
	    // 1.0-compat globals
	    window.OGVCompat = OGVCompat;
	    window.OGVVersion = OGVVersion;
	  }

	  module.exports = {
	    OGVCompat: OGVCompat,
	    OGVVersion: OGVVersion
	  };

	})();


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var BogoSlow = __webpack_require__(2);

	var OGVCompat = {
		benchmark: new BogoSlow(),

		hasTypedArrays: function() {
			// emscripten-compiled code requires typed arrays
			return !!window.Uint32Array;
		},

		hasWebAudio: function() {
			return !!(window.AudioContext || window.webkitAudioContext);
		},

		hasFlash: function() {
			if (navigator.userAgent.indexOf('Trident') !== -1) {
				// We only do the ActiveX test because we only need Flash in
				// Internet Explorer 10/11. Other browsers use Web Audio directly
				// (Edge, Safari) or native playback, so there's no need to test
				// other ways of loading Flash.
				try {
					var obj = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
					return true;
				} catch(e) {
					return false;
				}
			}
			return false;
		},

		hasAudio: function() {
			return this.hasWebAudio() || this.hasFlash();
		},

		isBlacklisted: function(userAgent) {
			// JIT bugs in old Safari versions
			var blacklist = [
				/\(i.* OS [67]_.* like Mac OS X\).* Mobile\/.* Safari\//,
				/\(Macintosh.* Version\/6\..* Safari\/\d/
			];
			var blacklisted = false;
			blacklist.forEach(function(regex) {
				if (userAgent.match(regex)) {
					blacklisted = true;
				}
			});
			return blacklisted;
		},

		isSlow: function() {
			return this.benchmark.slow;
		},

		isTooSlow: function() {
			return this.benchmark.tooSlow;
		},

		supported: function(component) {
			if (component === 'OGVDecoder') {
				return (this.hasTypedArrays() && !this.isBlacklisted(navigator.userAgent));
			}
			if (component === 'OGVPlayer') {
				return (this.supported('OGVDecoder') && this.hasAudio() && !this.isTooSlow());
			}
			return false;
		}
	};

	module.exports = OGVCompat;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	/**
	 * A quick CPU/JS engine benchmark to guesstimate whether we're
	 * fast enough to handle 360p video in JavaScript.
	 */
	function BogoSlow() {
		var self = this;

		var timer;
		// FIXME: avoid to use window scope here
		if (window.performance && window.performance.now) {
			timer = function() {
				return window.performance.now();
			};
		} else {
			timer = function() {
				return Date.now();
			};
		}

		var savedSpeed = null;
		function run() {
			var ops = 0;
			var fibonacci = function(n) {
				ops++;
				if (n < 2) {
					return n;
				} else {
					return fibonacci(n - 2) + fibonacci(n - 1);
				}
			};

			var start = timer();

			fibonacci(30);

			var delta = timer() - start;
			savedSpeed = (ops / delta);
		}

		/**
		 * Return a scale value of operations/sec from the benchmark.
		 * If the benchmark has already been run, uses a memoized result.
		 *
		 * @property {number}
		 */
		Object.defineProperty(self, 'speed', {
			get: function() {
				if (savedSpeed === null) {
					run();
				}
				return savedSpeed;
			}
		});

		/**
		 * Return the defined cutoff speed value for 'slow' devices,
		 * based on results measured from some test devices.
		 *
		 * @property {number}
		 */
		Object.defineProperty(self, 'slowCutoff', {
			get: function() {
				// 2012 Retina MacBook Pro (Safari 7)  ~150,000
				// 2009 Dell T5500         (IE 11)     ~100,000
				// iPad Air                (iOS 7)      ~65,000
				// 2010 MBP / OS X 10.9    (Safari 7)   ~62,500
				// 2010 MBP / Win7 VM      (IE 11)      ~50,000+-
				//   ^ these play 360p ok
				// ----------- line of moderate doom ----------
				return 50000;
				//   v these play 160p ok
				// iPad Mini non-Retina    (iOS 8 beta) ~25,000
				// Dell Inspiron Duo       (IE 11)      ~25,000
				// Surface RT              (IE 11)      ~18,000
				// iPod Touch 5th-gen      (iOS 8 beta) ~16,000
			}
		});

		/**
		 * Return the defined cutoff speed value for 'too slow' devices,
		 * based on results measured from some test devices.
		 *
		 * No longer used.
		 *
		 * @property {number}
		 * @deprecated
		 */
		Object.defineProperty(self, 'tooSlowCutoff', {
			get: function() {
				return 0;
			}
		});

		/**
		 * 'Slow' devices can play audio and should sorta play our
		 * extra-tiny Wikimedia 160p15 transcodes
		 *
		 * @property {boolean}
		 */
		Object.defineProperty(self, 'slow', {
			get: function() {
				return (self.speed < self.slowCutoff);
			}
		});

		/**
		 * 'Too slow' devices aren't reliable at all
		 *
		 * @property {boolean}
		 */
		Object.defineProperty(self, 'tooSlow', {
			get: function() {
				return (self.speed < self.tooSlowCutoff);
			}
		});
	}

	module.exports = BogoSlow;


/***/ })
/******/ ]);