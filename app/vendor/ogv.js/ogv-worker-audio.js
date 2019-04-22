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

	module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var OGVWorkerSupport = __webpack_require__(2);

	var proxy = new OGVWorkerSupport([
		'loadedMetadata',
		'audioFormat',
		'audioBuffer',
		'cpuTime'
	], {
		init: function(args, callback) {
			this.target.init(callback);
		},

		processHeader: function(args, callback) {
			this.target.processHeader(args[0], function(ok) {
				callback([ok]);
			});
		},

		processAudio: function(args, callback) {
			this.target.processAudio(args[0], function(ok) {
				callback([ok]);
			});
		}
	});

	module.exports = proxy;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	var OGVLoader = __webpack_require__(3);

	/**
	 * Web Worker wrapper for codec fun
	 */
	function OGVWorkerSupport(propList, handlers) {

		var transferables = (function() {
			var buffer = new ArrayBuffer(1024),
				bytes = new Uint8Array(buffer);
			try {
				postMessage({
					action: 'transferTest',
					bytes: bytes
				}, [buffer]);
				if (buffer.byteLength) {
					// No transferable support
					return false;
				} else {
					return true;
				}
			} catch (e) {
				return false;
			}
		})();

		var self = this;
		self.target = null;

		var sentProps = {},
			pendingEvents = [];

		function copyObject(obj) {
			var copy = {};
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					copy[prop] = obj[prop];
				}
			}
			return copy;
		}

		function copyAudioBuffer(data) {
			if (data == null) {
				return null;
			} else {
				// Array of Float32Arrays
				var copy = [];
				for (var i = 0; i < data.length; i++) {
					copy[i] = new Float32Array(data[i]);
				}
				return copy;
			}
		}

		function handleEvent(data) {
			handlers[data.action].call(self, data.args, function(args) {
				args = args || [];

				// Collect and send any changed properties...
				var props = {},
					transfers = [];
				propList.forEach(function(propName) {
					var propVal = self.target[propName];

					if (sentProps[propName] !== propVal) {
						// Save this value for later reference...
						sentProps[propName] = propVal;

						if (propName == 'duration' && isNaN(propVal) && isNaN(sentProps[propName])) {
							// NaN is not === itself. Nice!
							// no need to update it here.
						} else if (propName == 'audioBuffer') {
							// Don't send the entire emscripten heap!
							propVal = copyAudioBuffer(propVal);
							props[propName] = propVal;
							if (propVal) {
								for (var i = 0; i < propVal.length; i++) {
									transfers.push(propVal[i].buffer);
								}
							}
						} else if (propName == 'frameBuffer') {
							// We already extract ahead of time now,
							// so transfer the small buffers.
							props[propName] = propVal;
							if (propVal) {
								transfers.push(propVal.y.bytes.buffer);
								transfers.push(propVal.u.bytes.buffer);
								transfers.push(propVal.v.bytes.buffer);
							}
						} else {
							props[propName] = propVal;
						}
					}
				});

				var out = {
					action: 'callback',
					callbackId: data.callbackId,
					args: args,
					props: props
				};
				if (transferables) {
					postMessage(out, transfers);
				} else {
					postMessage(out);
				}
			});
		}

		handlers.construct = function(args, callback) {
			var className = args[0],
				options = args[1];

			OGVLoader.loadClass(className, function(classObj) {
				self.target = new classObj(options);
				callback();
				while (pendingEvents.length) {
					handleEvent(pendingEvents.shift());
				}
			});
		};

		addEventListener('message', function workerOnMessage(event) {
			var data = event.data;
			if (!data || typeof data !== 'object') {
				// invalid
				return;
			} else if (data.action == 'transferTest') {
				// ignore
			} else if (typeof data.action !== 'string' || typeof data.callbackId !== 'string' || typeof data.args !== 'object') {
				console.log('invalid message data', data);
			} else if (!(data.action in handlers)) {
				console.log('invalid message action', data.action);
			} else if (data.action == 'construct') {
				// always handle constructor
				handleEvent(data);
			} else if (!self.target) {
				// queue until constructed
				pendingEvents.push(data);
			} else {
				handleEvent(data);
			}
		});

	}

	module.exports = OGVWorkerSupport;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	var OGVVersion = ("1.4.2-20170425024925-504d7197");

	(function() {
		var global = this;

		var scriptMap = {
			OGVDemuxerOgg: 'ogv-demuxer-ogg.js',
			OGVDemuxerOggW: 'ogv-demuxer-ogg-wasm.js',
			OGVDemuxerWebM: 'ogv-demuxer-webm.js',
			OGVDemuxerWebMW: 'ogv-demuxer-webm-wasm.js',
			OGVDecoderAudioOpus: 'ogv-decoder-audio-opus.js',
			OGVDecoderAudioOpusW: 'ogv-decoder-audio-opus-wasm.js',
			OGVDecoderAudioVorbis: 'ogv-decoder-audio-vorbis.js',
			OGVDecoderAudioVorbisW: 'ogv-decoder-audio-vorbis-wasm.js',
			OGVDecoderVideoTheora: 'ogv-decoder-video-theora.js',
			OGVDecoderVideoTheoraW: 'ogv-decoder-video-theora-wasm.js',
			OGVDecoderVideoVP8: 'ogv-decoder-video-vp8.js',
			OGVDecoderVideoVP8W: 'ogv-decoder-video-vp8-wasm.js',
			OGVDecoderVideoVP8MT: 'ogv-decoder-video-vp8-mt.js',
			OGVDecoderVideoVP9: 'ogv-decoder-video-vp9.js',
			OGVDecoderVideoVP9W: 'ogv-decoder-video-vp9-wasm.js',
			OGVDecoderVideoVP9MT: 'ogv-decoder-video-vp9-mt.js'
		};

	  // @fixme make this less awful
		var proxyTypes = {
			OGVDecoderAudioOpus: 'audio',
			OGVDecoderAudioOpusW: 'audio',
			OGVDecoderAudioVorbis: 'audio',
			OGVDecoderAudioVorbisW: 'audio',
			OGVDecoderVideoTheora: 'video',
			OGVDecoderVideoTheoraW: 'video',
			OGVDecoderVideoVP8: 'video',
			OGVDecoderVideoVP8W: 'video',
			OGVDecoderVideoVP9: 'video',
			OGVDecoderVideoVP9W: 'video'
		};
		var proxyInfo = {
			audio: {
				proxy: __webpack_require__(4),
				worker: 'ogv-worker-audio.js',
			},
			video: {
				proxy: __webpack_require__(6),
				worker: 'ogv-worker-video.js'
			}
		}

		function urlForClass(className) {
			var scriptName = scriptMap[className];
			if (scriptName) {
				return urlForScript(scriptName);
			} else {
				throw new Error('asked for URL for unknown class ' + className);
			}
		};

		function urlForScript(scriptName) {
			if (scriptName) {
				var base = OGVLoader.base;
				if (base === undefined) {
					base = '';
				} else {
					base += '/';
				}
				return base + scriptName + '?version=' + encodeURIComponent(OGVVersion);
			} else {
				throw new Error('asked for URL for unknown script ' + scriptName);
			}
		};

		var scriptStatus = {},
			scriptCallbacks = {};
		function loadWebScript(src, callback) {
			if (scriptStatus[src] == 'done') {
				callback();
			} else if (scriptStatus[src] == 'loading') {
				scriptCallbacks[src].push(callback);
			} else {
				scriptStatus[src] = 'loading';
				scriptCallbacks[src] = [callback];

				var scriptNode = document.createElement('script');
				function done(event) {
					var callbacks = scriptCallbacks[src];
					delete scriptCallbacks[src];
					scriptStatus[src] = 'done';

					callbacks.forEach(function(cb) {
						cb();
					});
				}
				scriptNode.addEventListener('load', done);
				scriptNode.addEventListener('error', done);
				scriptNode.src = src;
				document.querySelector('head').appendChild(scriptNode);
			}
		}

		function loadWebAssembly(src, callback) {
			if (!src.match(/-wasm\.js/)) {
				callback(null);
			} else {
				var wasmSrc = src.replace(/-wasm\.js/, '-wasm.wasm');
				var xhr = new XMLHttpRequest();
				xhr.responseType = 'arraybuffer';
				xhr.onload = function() {
					callback(xhr.response);
				};
				xhr.onerror = function() {
					callback(null);
				};
				xhr.open('GET', wasmSrc);
				xhr.send();
			}
		}

		function defaultBase() {
			if (typeof global.window === 'object') {

				// for browser, try to autodetect
				var scriptNodes = document.querySelectorAll('script'),
					regex = /^(?:|(.*)\/)ogv(?:-support)?\.js(?:\?|#|$)/,
					path,
					matches;
				for (var i = 0; i < scriptNodes.length; i++) {
					path = scriptNodes[i].getAttribute('src');
					if (path) {
						matches = path.match(regex);
						if (matches) {
							return matches[1];
						}
					}
				}

				return undefined; // current dir

			} else {

				// for workers, assume current directory
				// if not a worker, too bad.
				return undefined;

			}
		}

		var OGVLoader = {
			base: defaultBase(),

			loadClass: function(className, callback, options) {
				options = options || {};
				if (options.worker) {
					this.workerProxy(className, callback);
					return;
				}
				var url = urlForClass(className);
				loadWebAssembly(url, function(wasmBinary) {
					function wasmClassWrapper(options) {
						options = options || {};
						if (wasmBinary !== null) {
							options.wasmBinary = wasmBinary;
						}
						return new global[className](options);
					}
					if (typeof global[className] === 'function') {
						// already loaded!
						callback(wasmClassWrapper);
					} else if (typeof global.window === 'object') {
						loadWebScript(url, function() {
							callback(wasmClassWrapper);
						});
					} else if (typeof global.importScripts === 'function') {
						// worker has convenient sync importScripts
						global.importScripts(url);
						callback(wasmClassWrapper);
					}
				});
			},

			workerProxy: function(className, callback) {
				var proxyType = proxyTypes[className],
					info = proxyInfo[proxyType];

				if (!info) {
					throw new Error('Requested worker for class with no proxy: ' + className);
				}

				var proxyClass = info.proxy,
					workerScript = info.worker,
					codecUrl = urlForScript(scriptMap[className]),
					workerUrl = urlForScript(workerScript),
					worker;

				var construct = function(options) {
					return new proxyClass(worker, className, options);
				};

				if (workerUrl.match(/^https?:|\/\//i)) {
					// Can't load workers natively cross-domain, but if CORS
					// is set up we can fetch the worker stub and the desired
					// class and load them from a blob.
					var getCodec,
						getWorker,
						codecResponse,
						workerResponse,
						codecLoaded = false,
						workerLoaded = false,
						blob;

					function completionCheck() {
						if ((codecLoaded == true) && (workerLoaded == true)) {
							try {
								blob = new Blob([codecResponse + " " + workerResponse], {type: 'application/javascript'});
							} catch (e) { // Backwards-compatibility
								window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
								blob = new BlobBuilder();
								blob.append(codecResponse + " " + workerResponse);
								blob = blob.getBlob();
							}
							// Create the web worker
							worker = new Worker(URL.createObjectURL(blob));
							callback(construct);
						}
					}

					// Load the codec
					getCodec = new XMLHttpRequest();
					getCodec.open("GET", codecUrl, true);
					getCodec.onreadystatechange = function() {
						if(getCodec.readyState == 4 && getCodec.status == 200) {
							codecResponse = getCodec.responseText;
							// Update the codec response loaded flag
							codecLoaded = true;
							completionCheck();
						}
					};
					getCodec.send();

					// Load the worker
					getWorker = new XMLHttpRequest();
					getWorker.open("GET", workerUrl, true);
					getWorker.onreadystatechange = function() {
						if(getWorker.readyState == 4 && getWorker.status == 200) {
							workerResponse = getWorker.responseText;
							// Update the worker response loaded flag
							workerLoaded = true;
							completionCheck();
						}
					};
					getWorker.send();
				} else {
					// Local URL; load it directly for simplicity.
					worker = new Worker(workerUrl);
					callback(construct);
				}
			}
		};

		module.exports = OGVLoader;

	})();


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var OGVProxyClass = __webpack_require__(5);

	var OGVDecoderAudioProxy = OGVProxyClass({
		loadedMetadata: false,
		audioFormat: null,
		audioBuffer: null,
		cpuTime: 0
	}, {
		init: function(callback) {
			this.proxy('init', [], callback);
		},

		processHeader: function(data, callback) {
			this.proxy('processHeader', [data], callback, [data]);
		},

		processAudio: function(data, callback) {
			this.proxy('processAudio', [data], callback, [data]);
		},

		close: function() {
			this.terminate();
		}
	});

	module.exports = OGVDecoderAudioProxy;


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	/**
	 * Proxy object for web worker interface for codec classes.
	 *
	 * Used by the high-level player interface.
	 *
	 * @author Brion Vibber <brion@pobox.com>
	 * @copyright 2015
	 * @license MIT-style
	 */
	function OGVProxyClass(initialProps, methods) {
		return function(worker, className, options) {
			options = options || {};
			var self = this;

			var transferables = (function() {
				var buffer = new ArrayBuffer(1024),
					bytes = new Uint8Array(buffer);
				try {
					worker.postMessage({
						action: 'transferTest',
						bytes: bytes
					}, [buffer]);
					if (buffer.byteLength) {
						// No transferable support
						return false;
					} else {
						return true;
					}
				} catch (e) {
					return false;
				}
			})();

			// Set up proxied property getters
			var props = {};
			for (var iPropName in initialProps) {
				if (initialProps.hasOwnProperty(iPropName)) {
					(function(propName) {
						props[propName] = initialProps[propName];
						Object.defineProperty(self, propName, {
							get: function getProperty() {
								return props[propName];
							}
						});
					})(iPropName);
				}
			}

			// Current player wants to avoid async confusion.
			var processingQueue = 0;
			Object.defineProperty(self, 'processing', {
				get: function() {
					return (processingQueue > 0);
				}
			});

			// Set up proxied methods
			for (var method in methods) {
				if (methods.hasOwnProperty(method)) {
					self[method] = methods[method];
				}
			}

			// And some infrastructure!
			var messageCount = 0,
				pendingCallbacks = {};
			this.proxy = function(action, args, callback, transfers) {
				if (!worker) {
					throw 'Tried to call "' + action + '" method on closed proxy object';
				}
				var callbackId = 'callback-' + (++messageCount) + '-' + action;
				if (callback) {
					pendingCallbacks[callbackId] = callback;
				}
				var out = {
					'action': action,
					'callbackId': callbackId,
					'args': args || []
				};
				processingQueue++;
				if (transferables) {
					worker.postMessage(out, transfers || []);
				} else {
					worker.postMessage(out);
				}
			};
			this.terminate = function() {
				if (worker) {
					worker.terminate();
					worker = null;
					processingQueue = 0;
					pendingCallbacks = {};
				}
			};

			worker.addEventListener('message', function proxyOnMessage(event) {
				processingQueue--;
				if (event.data.action !== 'callback') {
					// ignore
					return;
				}

				var data = event.data,
					callbackId = data.callbackId,
					args = data.args,
					callback = pendingCallbacks[callbackId];

				// Save any updated properties returned to us...
				if (data.props) {
					for (var propName in data.props) {
						if (data.props.hasOwnProperty(propName)) {
							props[propName] = data.props[propName];
						}
					}
				}

				if (callback) {
					delete pendingCallbacks[callbackId];
					callback.apply(this, args);
				}
			});

			// Tell the proxy to load and initialize the appropriate class
			self.proxy('construct', [className, options], function() {});

			return self;
		};
	}

	module.exports = OGVProxyClass;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	var OGVProxyClass = __webpack_require__(5);

	var OGVDecoderVideoProxy = OGVProxyClass({
		loadedMetadata: false,
		videoFormat: null,
		frameBuffer: null,
		cpuTime: 0
	}, {
		init: function(callback) {
			this.proxy('init', [], callback);
		},

		processHeader: function(data, callback) {
			this.proxy('processHeader', [data], callback, [data]);
		},

		processFrame: function(data, callback) {
			this.proxy('processFrame', [data], callback, [data]);
		},

		close: function() {
			this.terminate();
		}
	});

	module.exports = OGVDecoderVideoProxy;

/***/ })
/******/ ]);