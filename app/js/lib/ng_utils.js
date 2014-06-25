/*!
 * Webogram v0.1.7 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

angular.module('izhukov.utils', [])

.provider('Storage', function () {

  var keyPrefix = '';
  var cache = {};
  var useCs = !!(window.chrome && chrome.storage && chrome.storage.local);
  var useLs = !useCs && !!window.localStorage;

  this.setPrefix = function (newPrefix) {
    keyPrefix = newPrefix
  };

  this.$get = ['$q', function ($q) {
    function getValue() {
      var keys = Array.prototype.slice.call(arguments),
          result = [],
          single = keys.length == 1,
          allFound = true;

      for (var i = 0; i < keys.length; i++) {
        keys[i] = keyPrefix + keys[i];
      }

      angular.forEach(keys, function (key) {
        if (cache[key] !== undefined) {
          result.push(cache[key]);
        }
        else if (useLs) {
          var value = localStorage.getItem(key);
          value = (value === undefined || value === null) ? false : JSON.parse(value);
          result.push(cache[key] = value);
        }
        else if (!useCs) {
          result.push(cache[key] = false);
        }
        else {
          allFound = false;
        }
      });

      if (allFound) {
        return $q.when(single ? result[0] : result);
      }

      var deferred = $q.defer();

      chrome.storage.local.get(keys, function (resultObj) {
        result = [];
        angular.forEach(keys, function (key) {
          var value = resultObj[key];
          value = value === undefined || value === null ? false : JSON.parse(value);
          result.push(cache[key] = value);
        });

        deferred.resolve(single ? result[0] : result);
      });

      return deferred.promise;
    };

    function setValue(obj) {
      var keyValues = {};
      angular.forEach(obj, function (value, key) {
        keyValues[keyPrefix + key] = JSON.stringify(value);
        cache[keyPrefix + key] = value;
      });

      if (useLs) {
        angular.forEach(keyValues, function (value, key) {
          localStorage.setItem(key, value);
        });
        return $q.when();
      }

      if (!useCs) {
        return $q.when();
      }

      var deferred = $q.defer();

      chrome.storage.local.set(keyValues, function () {
        deferred.resolve();
      });

      return deferred.promise;
    };

    function removeValue () {
      var keys = Array.prototype.slice.call(arguments);

      for (var i = 0; i < keys.length; i++) {
        keys[i] = keyPrefix + keys[i];
      }

      angular.forEach(keys, function(key){
        delete cache[key];
      });

      if (useLs) {
        angular.forEach(keys, function(key){
          localStorage.removeItem(key);
        });

        return $q.when();
      }

      if (!useCs) {
        return $q.when();
      }

      var deferred = $q.defer();

      chrome.storage.local.remove(keys, function () {
        deferred.resolve();
      });

      return deferred.promise;
    };

    return {
      get: getValue,
      set: setValue,
      remove: removeValue
    };
  }];

})

.service('FileManager', function ($window, $timeout, $q) {

  $window.URL = $window.URL || $window.webkitURL;
  $window.BlobBuilder = $window.BlobBuilder || $window.WebKitBlobBuilder || $window.MozBlobBuilder;

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
      fileWriter.write(new Blob([bytesToArrayBuffer(bytes)]));
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

  function isAvailable (argument) {
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

    $window.requestFileSystem($window.TEMPORARY, 5*1024*1024, function (fs) {
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
          deferred.reject(error);
        });
      }, function (error) {
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

