/*!
 * Webogram v0.4.6 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

angular.module('izhukov.utils', [])

.provider('Storage', function () {

  this.setPrefix = function (newPrefix) {
    ConfigStorage.prefix(newPrefix);
  };

  this.$get = ['$q', function ($q) {
    var methods = {};
    angular.forEach(['get', 'set', 'remove'], function (methodName) {
      methods[methodName] = function () {
        var deferred = $q.defer(),
            args = Array.prototype.slice.call(arguments);

        args.push(function (result) {
          deferred.resolve(result);
        });
        ConfigStorage[methodName].apply(ConfigStorage, args);

        return deferred.promise;
      };
    });
    return methods;
  }];

})

.service('qSync', function () {

  return {
    when: function (result) {
      return {then: function (cb) {
        return cb(result);
      }};
    },
    reject: function (result) {
      return {then: function (cb, badcb) {
        return badcb(result);
      }};
    }
  }

})

.service('FileManager', function ($window, $q, $timeout, qSync) {

  $window.URL = $window.URL || $window.webkitURL;
  $window.BlobBuilder = $window.BlobBuilder || $window.WebKitBlobBuilder || $window.MozBlobBuilder;
  var buggyUnknownBlob = navigator.userAgent.indexOf('Safari') != -1 &&
                         navigator.userAgent.indexOf('Chrome') == -1;

  var blobSupported = true;

  try {
    blobConstruct([], '');
  } catch (e) {
    blobSupported = false;
  }

  function isBlobAvailable () {
    return blobSupported;
  }

  function fileCopyTo (fromFileEntry, toFileEntry) {
    return getFileWriter(toFileEntry).then(function (fileWriter) {
      return fileWriteData(fileWriter, fromFileEntry).then(function () {
        return fileWriter;
      }, function (error) {
        return $q.reject(error);
        fileWriter.truncate(0);
      });
    });
  }

  function fileWriteData(fileWriter, bytes) {
    var deferred = $q.defer();

    fileWriter.onwriteend = function(e) {
      deferred.resolve();
    };
    fileWriter.onerror = function (e) {
      deferred.reject(e);
    };

    if (bytes.file) {
      bytes.file(function (file) {
        fileWriter.write(file);
      }, function (error) {
        deferred.reject(error);
      })
    }
    else if (bytes instanceof Blob) { // is file bytes
      fileWriter.write(bytes);
    }
    else {
      try {
        var blob = blobConstruct([bytesToArrayBuffer(bytes)]);
        fileWriter.write(blob);
      } catch (e) {
        deferred.reject(e);
      }
    }

    return deferred.promise;
  }

  function chooseSaveFile (fileName, ext, mimeType) {
    if (!$window.chrome || !chrome.fileSystem || !chrome.fileSystem.chooseEntry) {
      return qSync.reject();
    };
    var deferred = $q.defer();

    chrome.fileSystem.chooseEntry({
      type: 'saveFile',
      suggestedName: fileName,
      accepts: [{
        mimeTypes: [mimeType],
        extensions: [ext]
      }]
    }, function (writableFileEntry) {
      deferred.resolve(writableFileEntry);
    });

    return deferred.promise;
  }

  function getFileWriter (fileEntry) {
    var deferred = $q.defer();

    fileEntry.createWriter(function (fileWriter) {
      deferred.resolve(fileWriter);
    }, function (error) {
      deferred.reject(error);
    });

    return deferred.promise;
  }

  function getFakeFileWriter (mimeType, saveFileCallback) {
    var blobParts = [],
        fakeFileWriter = {
          write: function (blob) {
            if (!blobSupported) {
              if (fakeFileWriter.onerror) {
                fakeFileWriter.onerror(new Error('Blob not supported by browser'));
              }
              return false;
            }
            blobParts.push(blob);
            setZeroTimeout(function () {
              if (fakeFileWriter.onwriteend) {
                fakeFileWriter.onwriteend();
              }
            });
          },
          truncate: function () {
            blobParts = [];
          },
          finalize: function () {
            var blob = blobConstruct(blobParts, mimeType);
            if (saveFileCallback) {
              saveFileCallback(blob);
            }
            return blob;
          }
        };

    return fakeFileWriter;
  };

  function getUrl (fileData, mimeType) {
    // console.log(dT(), 'get url', fileData, mimeType, fileData.toURL !== undefined, fileData instanceof Blob);
    if (fileData.toURL !== undefined) {
      return fileData.toURL(mimeType);
    }
    if (fileData instanceof Blob) {
      return URL.createObjectURL(fileData);
    }
    return 'data:' + mimeType + ';base64,' + bytesToBase64(fileData);
  }

  function getByteArray(fileData) {
    if (fileData instanceof Blob) {
      var deferred = $q.defer();
      try {
        var reader = new FileReader();
        reader.onloadend = function (e) {
          deferred.resolve(new Uint8Array(e.target.result));
        };
        reader.onerror = function (e) {
          deferred.reject(e);
        };
        reader.readAsArrayBuffer(fileData);

        return deferred.promise;
      } catch (e) {
        return $q.reject(e);
      }
    }
    return $q.when(fileData);
  }

  function getDataUrl(blob) {
    var deferred;
    try {
      var reader = new FileReader();
      reader.onloadend = function() {
        deferred.resolve(reader.result);
      }
      reader.readAsDataURL(blob);
    } catch (e) {
      return $q.reject(e);
    }

    deferred = $q.defer();

    return deferred.promise;
  }

  function getFileCorrectUrl(blob, mimeType) {
    if (buggyUnknownBlob && blob instanceof Blob) {
      var mimeType = blob.type || blob.mimeType || mimeType || '';
      if (!mimeType.match(/image\/(jpeg|gif|png|bmp)|video\/quicktime/)) {
        return getDataUrl(blob);
      }
    }
    return qSync.when(getUrl(blob, mimeType));
  }

  function downloadFile (blob, mimeType, fileName) {
    if (window.navigator && navigator.msSaveBlob !== undefined) {
      window.navigator.msSaveBlob(blob, fileName);
      return false;
    }

    if (window.navigator && navigator.getDeviceStorage) {
      var storageName = 'sdcard';
      switch (mimeType.split('/')[0]) {
        case 'video': storageName = 'videos'; break;
        case 'audio': storageName = 'music'; break;
        case 'image': storageName = 'pictures'; break;
      }
      var deviceStorage = navigator.getDeviceStorage(storageName);

      var request = deviceStorage.addNamed(blob, fileName);

      request.onsuccess = function () {
        console.log('Device storage save result', this.result);
      };
      request.onerror = function () {
      };
      return;
    }

    var popup = false;
    if (window.safari) {
      popup = window.open();
    }

    getFileCorrectUrl(blob, mimeType).then(function (url) {
      if (popup) {
        try {
          popup.location.href = url;
          return;
        } catch (e) {}
      }
      var anchor = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
      anchor.href = url;
      anchor.target  = '_blank';
      anchor.download = fileName;
      if (anchor.dataset) {
        anchor.dataset.downloadurl = ["video/quicktime", fileName, url].join(':');
      }
      $(anchor).css({position: 'absolute', top: 1, left: 1}).appendTo('body');

      try {
        var clickEvent = document.createEvent('MouseEvents');
        clickEvent.initMouseEvent(
          'click', true, false, window, 0, 0, 0, 0, 0
          , false, false, false, false, 0, null
        );
        anchor.dispatchEvent(clickEvent);
      } catch (e) {
        console.error('Download click error', e);
        try {
          anchor[0].click();
        } catch (e) {
          window.open(url, '_blank');
        }
      }
      $timeout(function () {
        $(anchor).remove();
      }, 100);
    });
  }

  return {
    isAvailable: isBlobAvailable,
    copy: fileCopyTo,
    write: fileWriteData,
    getFileWriter: getFileWriter,
    getFakeFileWriter: getFakeFileWriter,
    chooseSave: chooseSaveFile,
    getUrl: getUrl,
    getDataUrl: getDataUrl,
    getByteArray: getByteArray,
    getFileCorrectUrl: getFileCorrectUrl,
    download: downloadFile
  };
})

.service('IdbFileStorage', function ($q, $window, FileManager) {

  $window.indexedDB = $window.indexedDB || $window.webkitIndexedDB || $window.mozIndexedDB || $window.OIndexedDB || $window.msIndexedDB;
  $window.IDBTransaction = $window.IDBTransaction || $window.webkitIDBTransaction || $window.OIDBTransaction || $window.msIDBTransaction;

  var dbName = 'cachedFiles';
  var dbStoreName = 'files';
  var dbVersion = 1;
  var openDbPromise;
  var storageIsAvailable = $window.indexedDB !== undefined &&
                           $window.IDBTransaction !== undefined;

  // IndexedDB is REALLY slow without blob support in Safari 8, no point in it
  if (storageIsAvailable &&
      navigator.userAgent.indexOf('Safari') != -1 &&
      navigator.userAgent.indexOf('Chrome') == -1
      // && navigator.userAgent.match(/Version\/([67]|8.0.[012])/)
  ) {
    storageIsAvailable = false;
  }

  var storeBlobsAvailable = storageIsAvailable || false;

  function isAvailable () {
    return storageIsAvailable;
  }

  function openDatabase() {
    if (openDbPromise) {
      return openDbPromise;
    }

    try {
      var request = indexedDB.open(dbName, dbVersion),
          deferred = $q.defer(),
          createObjectStore = function (db) {
            db.createObjectStore(dbStoreName);
          };
      if (!request) {
        throw new Exception();
      }
    } catch (error) {
      storageIsAvailable = false;
      return $q.reject(error);
    }

    request.onsuccess = function (event) {
      db = request.result;

      db.onerror = function (error) {
        storageIsAvailable = false;
        console.error('Error creating/accessing IndexedDB database', error);
        deferred.reject(error);
      };

      // Interim solution for Google Chrome to create an objectStore. Will be deprecated
      if (db.setVersion) {
        if (db.version != dbVersion) {
          db.setVersion(dbVersion).onsuccess = function () {
            createObjectStore(db);
            deferred.resolve(db);
          };
        }
        else {
          deferred.resolve(db);
        }
      }
      else {
        deferred.resolve(db);
      }
    };

    request.onerror = function (event) {
      storageIsAvailable = false;
      console.error('Error creating/accessing IndexedDB database', event);
      deferred.reject(event);
    }

    request.onupgradeneeded = function (event) {
      createObjectStore(event.target.result);
    };

    return openDbPromise = deferred.promise;
  };

  function saveFile (fileName, blob) {
    return openDatabase().then(function (db) {
      if (!storeBlobsAvailable) {
        return saveFileBase64(db, fileName, blob);
      }

      try {
        var objectStore = db.transaction([dbStoreName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(dbStoreName),
            request = objectStore.put(blob, fileName);
      } catch (error) {
        if (storeBlobsAvailable) {
          storeBlobsAvailable = false;
          return saveFileBase64(db, fileName, blob);
        }
        storageIsAvailable = false;
        return $q.reject(error);
      }

      var deferred = $q.defer();

      request.onsuccess = function (event) {
        deferred.resolve(blob);
      };

      request.onerror = function (error) {
        deferred.reject(error);
      };

      return deferred.promise;
    });
  };

  function saveFileBase64(db, fileName, blob) {
    try {
      var reader = new FileReader();
      reader.readAsDataURL(blob);
    } catch (e) {
      storageIsAvailable = false;
      return $q.reject();
    }

    var deferred = $q.defer();

    reader.onloadend = function() {
      try {
        var objectStore = db.transaction([dbStoreName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(dbStoreName),
            request = objectStore.put(reader.result, fileName);
      } catch (error) {
        storageIsAvailable = false;
        deferred.reject(error);
        return;
      };
      request.onsuccess = function (event) {
        deferred.resolve(blob);
      };

      request.onerror = function (error) {
        deferred.reject(error);
      };
    }

    return deferred.promise;
  }

  function getFile (fileName) {
    return openDatabase().then(function (db) {
      var deferred = $q.defer(),
          objectStore = db.transaction([dbStoreName], IDBTransaction.READ || 'readonly').objectStore(dbStoreName),
          request = objectStore.get(fileName);

      request.onsuccess = function (event) {
        var result = event.target.result;
        if (result === undefined) {
          deferred.reject();
        } else if (typeof result === 'string' &&
                   result.substr(0, 5) === 'data:') {
          deferred.resolve(dataUrlToBlob(result));
        } else {
          deferred.resolve(result);
        }
      };

      request.onerror = function (error) {
        deferred.reject(error);
      };

      return deferred.promise;
    });
  }

  function getFileWriter (fileName, mimeType) {
    var fakeWriter = FileManager.getFakeFileWriter(mimeType, function (blob) {
      saveFile(fileName, blob);
    });
    return $q.when(fakeWriter);
  }

  openDatabase();

  return {
    isAvailable: isAvailable,
    saveFile: saveFile,
    getFile: getFile,
    getFileWriter: getFileWriter
  };
})


.service('TmpfsFileStorage', function ($q, $window, FileManager) {

  $window.requestFileSystem = $window.requestFileSystem || $window.webkitRequestFileSystem;

  var reqFsPromise,
      fileSystem,
      storageIsAvailable = $window.requestFileSystem !== undefined;

  function requestFS () {
    if (reqFsPromise) {
      return reqFsPromise;
    }

    if (!$window.requestFileSystem) {
      return reqFsPromise = $q.reject({type: 'FS_BROWSER_UNSUPPORTED', description: 'requestFileSystem not present'});
    }

    var deferred = $q.defer();

    $window.requestFileSystem($window.TEMPORARY, 500 * 1024 * 1024, function (fs) {
      cachedFs = fs;
      deferred.resolve();
    }, function (e) {
      storageIsAvailable = false;
      deferred.reject(e);
    });

    return reqFsPromise = deferred.promise;
  };

  function isAvailable () {
    return storageIsAvailable;
  }

  function getFile (fileName, size) {
    size = size || 1;
    return requestFS().then(function () {
      // console.log(dT(), 'get file', fileName);
      var deferred = $q.defer();
      cachedFs.root.getFile(fileName, {create: false}, function(fileEntry) {
        fileEntry.file(function(file) {
          // console.log(dT(), 'aa', file);
          if (file.size >= size) {
            deferred.resolve(fileEntry);
          } else {
            deferred.reject(new Error('FILE_NOT_FOUND'));
          }
        }, function (error) {
          console.log(dT(), 'error', error);
          deferred.reject(error);
        });
      }, function () {
        deferred.reject(new Error('FILE_NOT_FOUND'));
      });
      return deferred.promise;
    });
  }

  function saveFile (fileName, blob) {
    return getFileWriter(fileName).then(function (fileWriter) {
      return FileManager.write(fileWriter, blob).then(function () {
        return fileWriter.finalize();
      })
    });
  }

  function getFileWriter (fileName) {
    // console.log(dT(), 'get file writer', fileName);
    return requestFS().then(function () {
      var deferred = $q.defer();
      cachedFs.root.getFile(fileName, {create: true}, function (fileEntry) {
        FileManager.getFileWriter(fileEntry).then(function (fileWriter) {
          fileWriter.finalize = function () {
            return fileEntry;
          }
          deferred.resolve(fileWriter);
        }, function (error) {
          storageIsAvailable = false;
          deferred.reject(error);
        });
      }, function (error) {
        storageIsAvailable = false;
        deferred.reject(error);
      });

      return deferred.promise;
    })
  }

  requestFS();

  return {
    isAvailable: isAvailable,
    saveFile: saveFile,
    getFile: getFile,
    getFileWriter: getFileWriter
  };
})

.service('MemoryFileStorage', function ($q, FileManager) {

  var storage = {};

  function isAvailable () {
    return true;
  }

  function getFile (fileName, size) {
    if (storage[fileName]) {
      return $q.when(storage[fileName]);
    }
    return $q.reject(new Error('FILE_NOT_FOUND'));
  }

  function saveFile (fileName, blob) {
    return $q.when(storage[fileName] = blob);
  }

  function getFileWriter (fileName, mimeType) {
    var fakeWriter = FileManager.getFakeFileWriter(mimeType, function (blob) {
      saveFile(fileName, blob);
    });
    return $q.when(fakeWriter);
  }

  return {
    isAvailable: isAvailable,
    saveFile: saveFile,
    getFile: getFile,
    getFileWriter: getFileWriter
  };
})

.service('CryptoWorker', function ($timeout, $q) {

  var webWorker = false,
      naClEmbed = false,
      taskID = 0,
      awaiting = {},
      webCrypto = Config.Modes.webcrypto && window.crypto && (window.crypto.subtle || window.crypto.webkitSubtle)/* || window.msCrypto && window.msCrypto.subtle*/,
      useSha1Crypto = webCrypto && webCrypto.digest !== undefined,
      useSha256Crypto = webCrypto && webCrypto.digest !== undefined,
      finalizeTask = function (taskID, result) {
        var deferred = awaiting[taskID];
        if (deferred !== undefined) {
          // console.log(dT(), 'CW done');
          deferred.resolve(result);
          delete awaiting[taskID];
        }
      };

  if (Config.Modes.nacl &&
      navigator.mimeTypes &&
      navigator.mimeTypes['application/x-pnacl'] !== undefined) {
    var listener = $('<div id="nacl_listener"><embed id="mtproto_crypto" width="0" height="0" src="nacl/mtproto_crypto.nmf" type="application/x-pnacl" /></div>').appendTo($('body'))[0];
    listener.addEventListener('load', function (e) {
      naClEmbed = listener.firstChild;
      console.log(dT(), 'NaCl ready');
    }, true);
    listener.addEventListener('message', function (e) {
      finalizeTask(e.data.taskID, e.data.result);
    }, true);
    listener.addEventListener('error', function (e) {
      console.error('NaCl error', e);
    }, true);
  }

  if (window.Worker) {
    var tmpWorker = new Worker('js/lib/crypto_worker.js');
    tmpWorker.onmessage = function (e) {
      if (!webWorker) {
        webWorker = tmpWorker;
      } else {
        finalizeTask(e.data.taskID, e.data.result);
      }
    };
    tmpWorker.onerror = function(error) {
      console.error('CW error', error, error.stack);
      webWorker = false;
    };
  }

  function performTaskWorker (task, params, embed) {
    // console.log(dT(), 'CW start', task);
    var deferred = $q.defer();

    awaiting[taskID] = deferred;

    params.task = task;
    params.taskID = taskID;
    (embed || webWorker).postMessage(params);

    taskID++;

    return deferred.promise;
  }

  return {
    sha1Hash: function (bytes) {
      if (useSha1Crypto) {
        // We don't use buffer since typedArray.subarray(...).buffer gives the whole buffer and not sliced one. webCrypto.digest supports typed array
        var deferred = $q.defer(),
            bytesTyped = Array.isArray(bytes) ? convertToUint8Array(bytes) : bytes;
        // console.log(dT(), 'Native sha1 start');
        webCrypto.digest({name: 'SHA-1'}, bytesTyped).then(function (digest) {
          // console.log(dT(), 'Native sha1 done');
          deferred.resolve(digest);
        }, function  (e) {
          console.error('Crypto digest error', e);
          useSha1Crypto = false;
          deferred.resolve(sha1HashSync(bytes));
        });

        return deferred.promise;
      }
      return $timeout(function () {
        return sha1HashSync(bytes);
      });
    },
    sha256Hash: function (bytes) {
      if (useSha256Crypto) {
        var deferred = $q.defer(),
            bytesTyped = Array.isArray(bytes) ? convertToUint8Array(bytes) : bytes;
        // console.log(dT(), 'Native sha1 start');
        webCrypto.digest({name: 'SHA-256'}, bytesTyped).then(function (digest) {
          // console.log(dT(), 'Native sha1 done');
          deferred.resolve(digest);
        }, function  (e) {
          console.error('Crypto digest error', e);
          useSha256Crypto = false;
          deferred.resolve(sha256HashSync(bytes));
        });

        return deferred.promise;
      }
      return $timeout(function () {
        return sha256HashSync(bytes);
      });
    },
    aesEncrypt: function (bytes, keyBytes, ivBytes) {
      if (naClEmbed) {
        return performTaskWorker('aes-encrypt', {
          bytes: addPadding(convertToArrayBuffer(bytes)),
          keyBytes: convertToArrayBuffer(keyBytes),
          ivBytes: convertToArrayBuffer(ivBytes)
        }, naClEmbed);
      }
      return $timeout(function () {
        return convertToArrayBuffer(aesEncryptSync(bytes, keyBytes, ivBytes));
      });
    },
    aesDecrypt: function (encryptedBytes, keyBytes, ivBytes) {
      if (naClEmbed) {
        return performTaskWorker('aes-decrypt', {
          encryptedBytes: addPadding(convertToArrayBuffer(encryptedBytes)),
          keyBytes: convertToArrayBuffer(keyBytes),
          ivBytes: convertToArrayBuffer(ivBytes)
        }, naClEmbed);
      }
      return $timeout(function () {
        return convertToArrayBuffer(aesDecryptSync(encryptedBytes, keyBytes, ivBytes));
      });
    },
    factorize: function (bytes) {
      bytes = convertToByteArray(bytes);
      if (naClEmbed && bytes.length <= 8) {
        return performTaskWorker('factorize', {bytes: bytes}, naClEmbed);
      }
      if (webWorker) {
        return performTaskWorker('factorize', {bytes: bytes});
      }
      return $timeout(function () {
        return pqPrimeFactorization(bytes);
      });
    },
    modPow: function (x, y, m) {
      if (webWorker) {
        return performTaskWorker('mod-pow', {
          x: x,
          y: y,
          m: m
        });
      }
      return $timeout(function () {
        return bytesModPow(x, y, m);
      });
    },
  };
})

.service('ExternalResourcesManager', function ($q, $http) {
  var urlPromises = {};

  function downloadImage (url) {
    if (urlPromises[url] !== undefined) {
      return urlPromises[url];
    }

    return urlPromises[url] = $http.get(url, {responseType: 'blob', transformRequest: null})
      .then(function (response) {
        window.URL = window.URL || window.webkitURL;
        return window.URL.createObjectURL(response.data);
      });
  }

  return {
    downloadImage: downloadImage
  }
})

.service('IdleManager', function ($rootScope, $window, $timeout) {

  $rootScope.idle = {isIDLE: false};

  var toPromise, started = false;

  var hidden = 'hidden';
  var visibilityChange = 'visibilitychange';
  if (typeof document.hidden !== 'undefined') {
    // default
  } else if (typeof document.mozHidden !== 'undefined') {
    hidden = 'mozHidden';
    visibilityChange = 'mozvisibilitychange';
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
  }

  return {
    start: start
  };

  function start () {
    if (!started) {
      started = true;
      $($window).on(visibilityChange + ' blur focus keydown mousedown touchstart', onEvent);

      setTimeout(function () {
        onEvent({type: 'blur'});
      }, 0);
    }
  }

  function onEvent (e) {
    // console.log('event', e.type);
    if (e.type == 'mousemove') {
      var e = e.originalEvent || e;
      if (e && e.movementX === 0 && e.movementY === 0) {
        return;
      }
      $($window).off('mousemove', onEvent);
    }

    var isIDLE = e.type == 'blur' || e.type == 'timeout' ? true : false;
    if (hidden && document[hidden]) {
      isIDLE = true;
    }

    $timeout.cancel(toPromise);
    if (!isIDLE) {
      // console.log('update timeout');
      toPromise = $timeout(function () {
        onEvent({type: 'timeout'});
      }, 30000);
    }

    if ($rootScope.idle.isIDLE == isIDLE) {
      return;
    }

    // console.log('IDLE changed', isIDLE);
    $rootScope.$apply(function () {
      $rootScope.idle.isIDLE = isIDLE;
    });

    if (isIDLE && e.type == 'timeout') {
      $($window).on('mousemove', onEvent);
    }
  }
})

.service('AppRuntimeManager', function ($window) {

  return {
    reload: function () {
      try {
        location.reload();
      } catch (e) {};

      if ($window.chrome && chrome.runtime && chrome.runtime.reload) {
        chrome.runtime.reload();
      };
    },
    close: function () {
      try {
        $window.close();
      } catch (e) {}
    },
    focus: function () {
      if (window.navigator.mozApps && document.hidden) {
        // Get app instance and launch it to bring app to foreground
        window.navigator.mozApps.getSelf().onsuccess = function() {
          this.result.launch();
        };
      } else {
        if (window.chrome && chrome.app && chrome.app.window) {
          chrome.app.window.current().focus();
        }
        window.focus();
      }
    }
  }
})




