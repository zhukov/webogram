/*!
 * Webogram v0.3.2 - messaging web application for MTProto
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

.service('FileManager', function ($window, $timeout, $q) {

  $window.URL = $window.URL || $window.webkitURL;
  $window.BlobBuilder = $window.BlobBuilder || $window.WebKitBlobBuilder || $window.MozBlobBuilder;

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

  function blobConstruct (blobParts, mimeType) {
    var blob;
    try {
      blob = new Blob(blobParts, {type: mimeType});
    } catch (e) {
      var bb = new BlobBuilder;
      angular.forEach(blobParts, function(blobPart) {
        bb.append(blobPart);
      });
      blob = bb.getBlob(mimeType);
    }
    return blob;
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
      } catch (e) {
        deferred.reject(e);
      }
      fileWriter.write(blob);
    }

    return deferred.promise;
  }

  function chooseSaveFile (fileName, ext, mimeType) {
    if (!$window.chrome || !chrome.fileSystem || !chrome.fileSystem.chooseEntry) {
      return $q.reject();
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
            $timeout(function () {
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

  function downloadFile (url, mimeType, fileName) {
    // if (Config.Mobile) {
    //   window.open(url, '_blank');
    //   return;
    // }
    var anchor = $('<a>Download</a>')
              .css({position: 'absolute', top: 1, left: 1})
              .attr('href', url)
              .attr('target', '_blank')
              .attr('download', fileName)
              .appendTo('body');

    anchor[0].dataset.downloadurl = [mimeType, fileName, url].join(':');
    anchor[0].click();
    $timeout(function () {
      anchor.remove();
    }, 100);
  }

  return {
    isAvailable: isBlobAvailable,
    copy: fileCopyTo,
    write: fileWriteData,
    getFileWriter: getFileWriter,
    getFakeFileWriter: getFakeFileWriter,
    chooseSave: chooseSaveFile,
    getUrl: getUrl,
    download: downloadFile
  };
})

.service('IdbFileStorage', function ($q, $window, FileManager) {

  $window.indexedDB = $window.indexedDB || $window.webkitIndexedDB || $window.mozIndexedDB || $window.OIndexedDB || $window.msIndexedDB;
  $window.IDBTransaction = $window.IDBTransaction || $window.webkitIDBTransaction || $window.OIDBTransaction || $window.msIDBTransaction;

  var dbName = 'cachedFiles',
      dbStoreName = 'files',
      dbVersion = 1,
      openDbPromise,
      storageIsAvailable = $window.indexedDB !== undefined && $window.IDBTransaction !== undefined;

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
      try {
        var deferred = $q.defer(),
            objectStore = db.transaction([dbStoreName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(dbStoreName),
            request = objectStore.put(blob, fileName);
      } catch (error) {
        storageIsAvailable = false;
        return $q.reject(error);
      }

      request.onsuccess = function (event) {
        deferred.resolve(blob);
      };

      request.onerror = function (error) {
        deferred.reject(error);
      };

      return deferred.promise;
    });
  };

  function getFile (fileName) {
    return openDatabase().then(function (db) {
      var deferred = $q.defer(),
          objectStore = db.transaction([dbStoreName], IDBTransaction.READ || 'readonly').objectStore(dbStoreName),
          request = objectStore.get(fileName);

      request.onsuccess = function (event) {
        if (event.target.result === undefined) {
          deferred.reject();
        } else {
          deferred.resolve(event.target.result);
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

  var worker = window.Worker && new Worker('js/lib/crypto_worker.js') || false,
      taskID = 0,
      awaiting = {};

  if (worker) {
    worker.onmessage = function (e) {
      var deferred = awaiting[e.data.taskID];
      if (deferred !== undefined) {
        console.log(dT(), 'CW done');
        deferred.resolve(e.data.result);
        delete awaiting[e.data.taskID];
      }
    };

    worker.onerror = function(error) {
      console.error('CW error', error, error.stack);
      worker = false;
    };
  }

  function performTaskWorker (task, params) {
    console.log(dT(), 'CW start', task);
    var deferred = $q.defer();

    awaiting[taskID] = deferred;

    params.task = task;
    params.taskID = taskID;
    worker.postMessage(params);

    taskID++;

    return deferred.promise;
  }

  return {
    sha1Hash: function (bytes) {
      if (worker && false) { // due overhead for data transfer
        return performTaskWorker ('sha1-hash', {bytes: bytes});
      }
      return $timeout(function () {
        return sha1Hash(bytes);
      });
    },
    aesEncrypt: function (bytes, keyBytes, ivBytes) {
      if (worker && false) { // due overhead for data transfer
        return performTaskWorker('aes-encrypt', {
          bytes: bytes,
          keyBytes: keyBytes,
          ivBytes: ivBytes
        });
      }
      return $timeout(function () {
        return aesEncrypt(bytes, keyBytes, ivBytes);
      });
    },
    aesDecrypt: function (encryptedBytes, keyBytes, ivBytes) {
      if (worker && false) { // due overhead for data transfer
        return performTaskWorker('aes-decrypt', {
          encryptedBytes: encryptedBytes,
          keyBytes: keyBytes,
          ivBytes: ivBytes
        });
      }
      return $timeout(function () {
        return aesDecrypt(encryptedBytes, keyBytes, ivBytes);
      });
    },
    factorize: function (bytes) {
      if (worker) {
        return performTaskWorker('factorize', {bytes: bytes});
      }
      return $timeout(function () {
        return pqPrimeFactorization(bytes);
      });
    },
    modPow: function (x, y, m) {
      if (worker) {
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




