/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

angular.module('izhukov.utils', [])

  .provider('Storage', function () {
    this.setPrefix = function (newPrefix) {
      ConfigStorage.prefix(newPrefix)
    }

    this.$get = ['$q', function ($q) {
      var methods = {}
      angular.forEach(['get', 'set', 'remove', 'clear'], function (methodName) {
        methods[methodName] = function () {
          var deferred = $q.defer()
          var args = Array.prototype.slice.call(arguments)

          args.push(function (result) {
            deferred.resolve(result)
          })
          ConfigStorage[methodName].apply(ConfigStorage, args)

          return deferred.promise
        }
      })

      methods.noPrefix = function () {
        ConfigStorage.noPrefix()
      }

      return methods
    }]
  })

  .service('qSync', function () {
    return {
      when: function (result) {
        return {then: function (cb) {
            return cb(result)
        }}
      },
      reject: function (result) {
        return {then: function (cb, badcb) {
            if (badcb) {
              return badcb(result)
            }
        }}
      }
    }
  })

  .service('FileManager', function ($window, $q, $timeout, qSync) {
    $window.URL = $window.URL || $window.webkitURL
    $window.BlobBuilder = $window.BlobBuilder || $window.WebKitBlobBuilder || $window.MozBlobBuilder
    var isSafari = 'safari' in window
    var safariVersion = parseFloat(isSafari && (navigator.userAgent.match(/Version\/(\d+\.\d+).* Safari/) || [])[1])
    var safariWithDownload = isSafari && safariVersion >= 11.0
    var buggyUnknownBlob = isSafari && !safariWithDownload

    var blobSupported = true

    try {
      blobConstruct([], '')
    } catch (e) {
      blobSupported = false
    }

    function isBlobAvailable () {
      return blobSupported
    }

    function fileCopyTo (fromFileEntry, toFileEntry) {
      return getFileWriter(toFileEntry).then(function (fileWriter) {
        return fileWriteData(fileWriter, fromFileEntry).then(function () {
          return fileWriter
        }, function (error) {
          try {
            fileWriter.truncate(0)
          } catch (e) {}
          return $q.reject(error)
        })
      })
    }

    function fileWriteData (fileWriter, bytes) {
      var deferred = $q.defer()

      fileWriter.onwriteend = function (e) {
        deferred.resolve()
      }
      fileWriter.onerror = function (e) {
        deferred.reject(e)
      }

      if (bytes.file) {
        bytes.file(function (file) {
          fileWriter.write(file)
        }, function (error) {
          deferred.reject(error)
        })
      }
      else if (bytes instanceof Blob) { // is file bytes
        fileWriter.write(bytes)
      }else {
        try {
          var blob = blobConstruct([bytesToArrayBuffer(bytes)])
          fileWriter.write(blob)
        } catch (e) {
          deferred.reject(e)
        }
      }

      return deferred.promise
    }

    function chooseSaveFile (fileName, ext, mimeType) {
      if (!$window.chrome || !chrome.fileSystem || !chrome.fileSystem.chooseEntry) {
        return qSync.reject()
      }
      var deferred = $q.defer()

      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: fileName,
        accepts: [{
          mimeTypes: [mimeType],
          extensions: [ext]
        }]
      }, function (writableFileEntry) {
        deferred.resolve(writableFileEntry)
      })

      return deferred.promise
    }

    function getFileWriter (fileEntry) {
      var deferred = $q.defer()

      fileEntry.createWriter(function (fileWriter) {
        deferred.resolve(fileWriter)
      }, function (error) {
        deferred.reject(error)
      })

      return deferred.promise
    }

    function getFakeFileWriter (mimeType, saveFileCallback) {
      var blobParts = []
      var fakeFileWriter = {
        write: function (blob) {
          if (!blobSupported) {
            if (fakeFileWriter.onerror) {
              fakeFileWriter.onerror(new Error('Blob not supported by browser'))
            }
            return false
          }
          blobParts.push(blob)
          setZeroTimeout(function () {
            if (fakeFileWriter.onwriteend) {
              fakeFileWriter.onwriteend()
            }
          })
        },
        truncate: function () {
          blobParts = []
        },
        finalize: function () {
          var blob = blobConstruct(blobParts, mimeType)
          if (saveFileCallback) {
            saveFileCallback(blob)
          }
          return blob
        }
      }

      return fakeFileWriter
    }

    function getUrl (fileData, mimeType) {
      var safeMimeType = blobSafeMimeType(mimeType)
      // console.log(dT(), 'get url', fileData, mimeType, fileData.toURL !== undefined, fileData instanceof Blob)
      if (fileData.toURL !== undefined) {
        return fileData.toURL(safeMimeType)
      }
      if (fileData instanceof Blob) {
        return URL.createObjectURL(fileData)
      }
      return 'data:' + safeMimeType + ';base64,' + bytesToBase64(fileData)
    }

    function getByteArray (fileData) {
      if (fileData instanceof Blob) {
        var deferred = $q.defer()
        try {
          var reader = new FileReader()
          reader.onloadend = function (e) {
            deferred.resolve(new Uint8Array(e.target.result))
          }
          reader.onerror = function (e) {
            deferred.reject(e)
          }
          reader.readAsArrayBuffer(fileData)

          return deferred.promise
        } catch (e) {
          return $q.reject(e)
        }
      }
      else if (fileData.file) {
        var deferred = $q.defer()
        fileData.file(function (blob) {
          getByteArray(blob).then(function (result) {
            deferred.resolve(result)
          }, function (error) {
            deferred.reject(error)
          })
        }, function (error) {
          deferred.reject(error)
        })
        return deferred.promise
      }
      return $q.when(fileData)
    }

    function getDataUrl (blob) {
      var deferred
      try {
        var reader = new FileReader()
        reader.onloadend = function () {
          deferred.resolve(reader.result)
        }
        reader.readAsDataURL(blob)
      } catch (e) {
        return $q.reject(e)
      }

      deferred = $q.defer()

      return deferred.promise
    }

    function getFileCorrectUrl (blob, mimeType) {
      if (buggyUnknownBlob && blob instanceof Blob) {
        var mimeType = blob.type || blob.mimeType || mimeType || ''
        if (!mimeType.match(/image\/(jpeg|gif|png|bmp)|video\/quicktime/)) {
          return getDataUrl(blob)
        }
      }
      return qSync.when(getUrl(blob, mimeType))
    }

    function downloadFile (blob, mimeType, fileName) {
      if (window.navigator && navigator.msSaveBlob !== undefined) {
        window.navigator.msSaveBlob(blob, fileName)
        return false
      }

      if (window.navigator && navigator.getDeviceStorage) {
        var storageName = 'sdcard'
        var subdir = 'telegram/'
        switch (mimeType.split('/')[0]) {
          case 'video':
            storageName = 'videos'
            break
          case 'audio':
            storageName = 'music'
            break
          case 'image':
            storageName = 'pictures'
            break
        }
        var deviceStorage = navigator.getDeviceStorage(storageName)

        var request = deviceStorage.addNamed(blob, subdir + fileName)

        request.onsuccess = function () {
          console.log('Device storage save result', this.result)
        }
        request.onerror = function () {}
        return
      }

      var popup = false
      if (isSafari && !safariWithDownload) {
        popup = window.open()
      }

      getFileCorrectUrl(blob, mimeType).then(function (url) {
        if (popup) {
          try {
            popup.location.href = url
            return
          } catch (e) {}
        }
        var anchor = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
        anchor.href = url
        if (!safariWithDownload) {
          anchor.target = '_blank'
        }
        anchor.download = fileName
        if (anchor.dataset) {
          anchor.dataset.downloadurl = ['video/quicktime', fileName, url].join(':')
        }
        $(anchor).css({position: 'absolute', top: 1, left: 1}).appendTo('body')

        try {
          var clickEvent = document.createEvent('MouseEvents')
          clickEvent.initMouseEvent(
            'click', true, false, window, 0, 0, 0, 0, 0
            , false, false, false, false, 0, null
          )
          anchor.dispatchEvent(clickEvent)
        } catch (e) {
          console.error('Download click error', e)
          try {
            anchor[0].click()
          } catch (e) {
            window.open(url, '_blank')
          }
        }
        $timeout(function () {
          $(anchor).remove()
        }, 100)
      })
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
    }
  })

  .service('IdbFileStorage', function ($q, $window, FileManager) {
    $window.indexedDB = $window.indexedDB || $window.webkitIndexedDB || $window.mozIndexedDB || $window.OIndexedDB || $window.msIndexedDB
    $window.IDBTransaction = $window.IDBTransaction || $window.webkitIDBTransaction || $window.OIDBTransaction || $window.msIDBTransaction

    var dbName = 'cachedFiles'
    var dbStoreName = 'files'
    var dbVersion = 2
    var openDbPromise
    var storageIsAvailable = $window.indexedDB !== undefined &&
      $window.IDBTransaction !== undefined

    // IndexedDB is REALLY slow without blob support in Safari 8, no point in it
    if (storageIsAvailable &&
      navigator.userAgent.indexOf('Safari') != -1 &&
      navigator.userAgent.indexOf('Chrome') == -1 &&
      navigator.userAgent.match(/Version\/[678]/)
    ) {
      storageIsAvailable = false
    }

    var storeBlobsAvailable = storageIsAvailable || false

    function isAvailable () {
      return storageIsAvailable
    }

    function openDatabase () {
      if (openDbPromise) {
        return openDbPromise
      }

      try {
        var request = indexedDB.open(dbName, dbVersion)
        var deferred = $q.defer()
        var createObjectStore = function (db) {
          db.createObjectStore(dbStoreName)
        }
        if (!request) {
          throw new Exception()
        }
      } catch (error) {
        console.error('error opening db', error.message)
        storageIsAvailable = false
        return $q.reject(error)
      }

      var finished = false
      setTimeout(function () {
        if (!finished) {
          request.onerror({type: 'IDB_CREATE_TIMEOUT'})
        }
      }, 3000)

      request.onsuccess = function (event) {
        finished = true
        var db = request.result

        db.onerror = function (error) {
          storageIsAvailable = false
          console.error('Error creating/accessing IndexedDB database', error)
          deferred.reject(error)
        }

        deferred.resolve(db)
      }

      request.onerror = function (event) {
        finished = true
        storageIsAvailable = false
        console.error('Error creating/accessing IndexedDB database', event)
        deferred.reject(event)
      }

      request.onupgradeneeded = function (event) {
        finished = true
        console.warn('performing idb upgrade from', event.oldVersion, 'to', event.newVersion)
        var db = event.target.result
        if (event.oldVersion == 1) {
          db.deleteObjectStore(dbStoreName)
        }
        createObjectStore(db)
      }

      return openDbPromise = deferred.promise
    }

    function saveFile (fileName, blob) {
      return openDatabase().then(function (db) {
        if (!storeBlobsAvailable) {
          return saveFileBase64(db, fileName, blob)
        }

        if (!(blob instanceof Blob)) {
          blob = blobConstruct([blob])
        }

        try {
          var objectStore = db.transaction([dbStoreName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(dbStoreName)
          var request = objectStore.put(blob, fileName)
        } catch (error) {
          if (storeBlobsAvailable) {
            storeBlobsAvailable = false
            return saveFileBase64(db, fileName, blob)
          }
          storageIsAvailable = false
          return $q.reject(error)
        }

        var deferred = $q.defer()

        request.onsuccess = function (event) {
          deferred.resolve(blob)
        }

        request.onerror = function (error) {
          deferred.reject(error)
        }

        return deferred.promise
      })
    }

    function saveFileBase64 (db, fileName, blob) {
      if (getBlobSize(blob) > 10 * 1024 * 1024) {
        return $q.reject()
      }
      if (!(blob instanceof Blob)) {
        var safeMimeType = blobSafeMimeType(blob.type || 'image/jpeg')
        var address = 'data:' + safeMimeType + ';base64,' + bytesToBase64(blob)
        return storagePutB64String(db, fileName, address).then(function () {
          return blob
        })
      }

      try {
        var reader = new FileReader()
      } catch (e) {
        storageIsAvailable = false
        return $q.reject()
      }

      var deferred = $q.defer()

      reader.onloadend = function () {
        storagePutB64String(db, fileName, reader.result).then(function () {
          deferred.resolve(blob)
        }, function (error) {
          deferred.reject(error)
        })
      }

      reader.onerror = function (error) {
        deferred.reject(error)
      }

      try {
        reader.readAsDataURL(blob)
      } catch (e) {
        storageIsAvailable = false
        return $q.reject()
      }

      return deferred.promise
    }

    function storagePutB64String (db, fileName, b64string) {
      try {
        var objectStore = db.transaction([dbStoreName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(dbStoreName)
        var request = objectStore.put(b64string, fileName)
      } catch (error) {
        storageIsAvailable = false
        return $q.reject(error)
      }

      var deferred = $q.defer()

      request.onsuccess = function (event) {
        deferred.resolve()
      }

      request.onerror = function (error) {
        deferred.reject(error)
      }

      return deferred.promise
    }

    function getBlobSize (blob) {
      return blob.size || blob.byteLength || blob.length
    }

    function getFile (fileName) {
      return openDatabase().then(function (db) {
        var deferred = $q.defer()
        var objectStore = db.transaction([dbStoreName], IDBTransaction.READ || 'readonly').objectStore(dbStoreName)
        var request = objectStore.get(fileName)

        request.onsuccess = function (event) {
          var result = event.target.result
          if (result === undefined) {
            deferred.reject()
          } else if (typeof result === 'string' &&
            result.substr(0, 5) === 'data:') {
            deferred.resolve(dataUrlToBlob(result))
          } else {
            deferred.resolve(result)
          }
        }

        request.onerror = function (error) {
          deferred.reject(error)
        }

        return deferred.promise
      })
    }

    function getFileWriter (fileName, mimeType) {
      var fakeWriter = FileManager.getFakeFileWriter(mimeType, function (blob) {
        saveFile(fileName, blob)
      })
      return $q.when(fakeWriter)
    }

    openDatabase()

    return {
      name: 'IndexedDB',
      isAvailable: isAvailable,
      saveFile: saveFile,
      getFile: getFile,
      getFileWriter: getFileWriter
    }
  })

  .service('TmpfsFileStorage', function ($q, $window, FileManager) {
    $window.requestFileSystem = $window.requestFileSystem || $window.webkitRequestFileSystem

    var reqFsPromise,
      fileSystem
    var storageIsAvailable = $window.requestFileSystem !== undefined

    function requestFS () {
      if (reqFsPromise) {
        return reqFsPromise
      }

      if (!$window.requestFileSystem) {
        return reqFsPromise = $q.reject({type: 'FS_BROWSER_UNSUPPORTED', description: 'requestFileSystem not present'})
      }

      var deferred = $q.defer()

      $window.requestFileSystem($window.TEMPORARY, 500 * 1024 * 1024, function (fs) {
        cachedFs = fs
        deferred.resolve()
      }, function (e) {
        storageIsAvailable = false
        deferred.reject(e)
      })

      return reqFsPromise = deferred.promise
    }

    function isAvailable () {
      return Config.allow_tmpfs && storageIsAvailable
    }

    function getFile (fileName, size) {
      size = size || 1
      return requestFS().then(function () {
        // console.log(dT(), 'get file', fileName)
        var deferred = $q.defer()
        cachedFs.root.getFile(fileName, {create: false}, function (fileEntry) {
          fileEntry.file(function (file) {
            // console.log(dT(), 'aa', file)
            if (file.size >= size) {
              deferred.resolve(fileEntry)
            } else {
              deferred.reject(new Error('FILE_NOT_FOUND'))
            }
          }, function (error) {
            console.log(dT(), 'error', error)
            deferred.reject(error)
          })
        }, function () {
          deferred.reject(new Error('FILE_NOT_FOUND'))
        })
        return deferred.promise
      })
    }

    function saveFile (fileName, blob) {
      return getFileWriter(fileName).then(function (fileWriter) {
        return FileManager.write(fileWriter, blob).then(function () {
          return fileWriter.finalize()
        })
      })
    }

    function getFileWriter (fileName) {
      // console.log(dT(), 'get file writer', fileName)
      return requestFS().then(function () {
        var deferred = $q.defer()
        cachedFs.root.getFile(fileName, {create: true}, function (fileEntry) {
          FileManager.getFileWriter(fileEntry).then(function (fileWriter) {
            fileWriter.finalize = function () {
              return fileEntry
            }
            deferred.resolve(fileWriter)
          }, function (error) {
            storageIsAvailable = false
            deferred.reject(error)
          })
        }, function (error) {
          storageIsAvailable = false
          deferred.reject(error)
        })

        return deferred.promise
      })
    }

    requestFS()

    return {
      name: 'TmpFS',
      isAvailable: isAvailable,
      saveFile: saveFile,
      getFile: getFile,
      getFileWriter: getFileWriter
    }
  })

  .service('MemoryFileStorage', function ($q, FileManager) {
    var storage = {}

    function isAvailable () {
      return true
    }

    function getFile (fileName, size) {
      if (storage[fileName]) {
        return $q.when(storage[fileName])
      }
      return $q.reject(new Error('FILE_NOT_FOUND'))
    }

    function saveFile (fileName, blob) {
      return $q.when(storage[fileName] = blob)
    }

    function getFileWriter (fileName, mimeType) {
      var fakeWriter = FileManager.getFakeFileWriter(mimeType, function (blob) {
        saveFile(fileName, blob)
      })
      return $q.when(fakeWriter)
    }

    return {
      name: 'Memory',
      isAvailable: isAvailable,
      saveFile: saveFile,
      getFile: getFile,
      getFileWriter: getFileWriter
    }
  })

  .service('WebpManager', function (qSync, $q) {
    var nativeWebpSupport = false

    var image = new Image()
    image.onload = function () {
      nativeWebpSupport = this.width === 2 && this.height === 1
    }
    image.onerror = function () {
      nativeWebpSupport = false
    }
    image.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA=='

    var canvas
    var context

    function getCanvasFromWebp (data) {
      var start = tsNow()

      var decoder = new WebPDecoder()

      var config = decoder.WebPDecoderConfig
      var buffer = config.j || config.output
      var bitstream = config.input

      if (!decoder.WebPInitDecoderConfig(config)) {
        console.error('[webpjs] Library version mismatch!')
        return false
      }

      // console.log('[webpjs] status code', decoder.VP8StatusCode)
      var StatusCode = decoder.VP8StatusCode

      status = decoder.WebPGetFeatures(data, data.length, bitstream)
      if (status != (StatusCode.VP8_STATUS_OK || 0)) {
        console.error('[webpjs] status error', status, StatusCode)
      }

      var mode = decoder.WEBP_CSP_MODE
      buffer.colorspace = mode.MODE_RGBA
      buffer.J = 4

      try {
        status = decoder.WebPDecode(data, data.length, config)
      } catch (e) {
        status = e
      }

      ok = (status == 0)
      if (!ok) {
        console.error('[webpjs] decoding failed', status, StatusCode)
        return false
      }

      // console.log('[webpjs] decoded: ', buffer.width, buffer.height, bitstream.has_alpha, 'Now saving...')
      var bitmap = buffer.c.RGBA.ma

      // console.log('[webpjs] done in ', tsNow() - start)

      if (!bitmap) {
        return false
      }
      var biHeight = buffer.height
      var biWidth = buffer.width

      if (!canvas || !context) {
        canvas = document.createElement('canvas')
        context = canvas.getContext('2d')
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height)
      }
      canvas.height = biHeight
      canvas.width = biWidth

      var output = context.createImageData(canvas.width, canvas.height)
      var outputData = output.data

      for (var h = 0; h < biHeight; h++) {
        for (var w = 0; w < biWidth; w++) {
          outputData[0 + w * 4 + (biWidth * 4) * h] = bitmap[1 + w * 4 + (biWidth * 4) * h]
          outputData[1 + w * 4 + (biWidth * 4) * h] = bitmap[2 + w * 4 + (biWidth * 4) * h]
          outputData[2 + w * 4 + (biWidth * 4) * h] = bitmap[3 + w * 4 + (biWidth * 4) * h]
          outputData[3 + w * 4 + (biWidth * 4) * h] = bitmap[0 + w * 4 + (biWidth * 4) * h]
        }
      }

      context.putImageData(output, 0, 0)

      return true
    }

    function getPngBlobFromWebp (data) {
      if (!getCanvasFromWebp(data)) {
        return $q.reject({type: 'WEBP_PROCESS_FAILED'})
      }
      if (canvas.toBlob === undefined) {
        return qSync.when(dataUrlToBlob(canvas.toDataURL('image/png')))
      }

      var deferred = $q.defer()
      canvas.toBlob(function (blob) {
        deferred.resolve(blob)
      }, 'image/png')
      return deferred.promise
    }

    return {
      isWebpSupported: function () {
        return nativeWebpSupport
      },
      getPngBlobFromWebp: getPngBlobFromWebp
    }
  })

  .service('CryptoWorker', function ($timeout, $q) {
    var webWorker = false
    var naClEmbed = false
    var taskID = 0
    var awaiting = {}
    var webCrypto = Config.Modes.webcrypto && window.crypto && (window.crypto.subtle || window.crypto.webkitSubtle) /* || window.msCrypto && window.msCrypto.subtle*/
    var useSha1Crypto = webCrypto && webCrypto.digest !== undefined
    var useSha256Crypto = webCrypto && webCrypto.digest !== undefined
    var finalizeTask = function (taskID, result) {
      var deferred = awaiting[taskID]
      if (deferred !== undefined) {
        // console.log(dT(), 'CW done')
        deferred.resolve(result)
        delete awaiting[taskID]
      }
    }

    if (Config.Modes.nacl &&
      navigator.mimeTypes &&
      navigator.mimeTypes['application/x-pnacl'] !== undefined) {
      var listener = $('<div id="nacl_listener"><embed id="mtproto_crypto" width="0" height="0" src="nacl/mtproto_crypto.nmf" type="application/x-pnacl" /></div>').appendTo($('body'))[0]
      listener.addEventListener('load', function (e) {
        naClEmbed = listener.firstChild
        console.log(dT(), 'NaCl ready')
      }, true)
      listener.addEventListener('message', function (e) {
        finalizeTask(e.data.taskID, e.data.result)
      }, true)
      listener.addEventListener('error', function (e) {
        console.error('NaCl error', e)
      }, true)
    }

    if (window.Worker) {
      var tmpWorker = new Worker('js/lib/crypto_worker.js')
      tmpWorker.onmessage = function (e) {
        if (!webWorker) {
          webWorker = tmpWorker
        } else {
          finalizeTask(e.data.taskID, e.data.result)
        }
      }
      tmpWorker.onerror = function (error) {
        console.error('CW error', error, error.stack)
        webWorker = false
      }
    }

    function performTaskWorker (task, params, embed) {
      // console.log(dT(), 'CW start', task)
      var deferred = $q.defer()

      awaiting[taskID] = deferred

      params.task = task
      params.taskID = taskID
      ;(embed || webWorker).postMessage(params)

      taskID++

      return deferred.promise
    }

    return {
      sha1Hash: function (bytes) {
        if (useSha1Crypto) {
          // We don't use buffer since typedArray.subarray(...).buffer gives the whole buffer and not sliced one. webCrypto.digest supports typed array
          var deferred = $q.defer()
          var bytesTyped = Array.isArray(bytes) ? convertToUint8Array(bytes) : bytes
          // console.log(dT(), 'Native sha1 start')
          webCrypto.digest({name: 'SHA-1'}, bytesTyped).then(function (digest) {
            // console.log(dT(), 'Native sha1 done')
            deferred.resolve(digest)
          }, function (e) {
            console.error('Crypto digest error', e)
            useSha1Crypto = false
            deferred.resolve(sha1HashSync(bytes))
          })

          return deferred.promise
        }
        return $timeout(function () {
          return sha1HashSync(bytes)
        })
      },
      sha256Hash: function (bytes) {
        if (useSha256Crypto) {
          var deferred = $q.defer()
          var bytesTyped = Array.isArray(bytes) ? convertToUint8Array(bytes) : bytes
          // console.log(dT(), 'Native sha1 start')
          webCrypto.digest({name: 'SHA-256'}, bytesTyped).then(function (digest) {
            // console.log(dT(), 'Native sha1 done')
            deferred.resolve(digest)
          }, function (e) {
            console.error('Crypto digest error', e)
            useSha256Crypto = false
            deferred.resolve(sha256HashSync(bytes))
          })

          return deferred.promise
        }
        return $timeout(function () {
          return sha256HashSync(bytes)
        })
      },
      aesEncrypt: function (bytes, keyBytes, ivBytes) {
        if (naClEmbed) {
          return performTaskWorker('aes-encrypt', {
            bytes: addPadding(convertToArrayBuffer(bytes)),
            keyBytes: convertToArrayBuffer(keyBytes),
            ivBytes: convertToArrayBuffer(ivBytes)
          }, naClEmbed)
        }
        return $timeout(function () {
          return convertToArrayBuffer(aesEncryptSync(bytes, keyBytes, ivBytes))
        })
      },
      aesDecrypt: function (encryptedBytes, keyBytes, ivBytes) {
        if (naClEmbed) {
          return performTaskWorker('aes-decrypt', {
            encryptedBytes: addPadding(convertToArrayBuffer(encryptedBytes)),
            keyBytes: convertToArrayBuffer(keyBytes),
            ivBytes: convertToArrayBuffer(ivBytes)
          }, naClEmbed)
        }
        return $timeout(function () {
          return convertToArrayBuffer(aesDecryptSync(encryptedBytes, keyBytes, ivBytes))
        })
      },
      factorize: function (bytes) {
        bytes = convertToByteArray(bytes)
        if (naClEmbed && bytes.length <= 8) {
          return performTaskWorker('factorize', {bytes: bytes}, naClEmbed)
        }
        if (webWorker) {
          return performTaskWorker('factorize', {bytes: bytes})
        }
        return $timeout(function () {
          return pqPrimeFactorization(bytes)
        })
      },
      modPow: function (x, y, m) {
        if (webWorker) {
          return performTaskWorker('mod-pow', {
            x: x,
            y: y,
            m: m
          })
        }
        return $timeout(function () {
          return bytesModPow(x, y, m)
        })
      }
    }
  })

  .service('ExternalResourcesManager', function ($q, $http, $sce) {
    var urlPromises = {}

    function downloadByURL (url) {
      if (urlPromises[url] !== undefined) {
        return urlPromises[url]
      }

      return urlPromises[url] = $http.get(url, {responseType: 'blob', transformRequest: null})
        .then(function (response) {
          window.URL = window.URL || window.webkitURL
          var url = window.URL.createObjectURL(response.data)
          return $sce.trustAsResourceUrl(url)
        }, function (error) {
          if (!Config.Modes.chrome_packed) {
            return $q.when($sce.trustAsResourceUrl(url))
          }
          return $q.reject(error)
        })
    }

    return {
      downloadByURL: downloadByURL
    }
  })

  .service('IdleManager', function ($rootScope, $window, $timeout) {

    $rootScope.idle = {isIDLE: false, initial: true}

    var toPromise
    var debouncePromise
    var started = false

    var hidden = 'hidden'
    var visibilityChange = 'visibilitychange'
    if (typeof document.hidden !== 'undefined') {
      // default
    } else if (typeof document.mozHidden !== 'undefined') {
      hidden = 'mozHidden'
      visibilityChange = 'mozvisibilitychange'
    } else if (typeof document.msHidden !== 'undefined') {
      hidden = 'msHidden'
      visibilityChange = 'msvisibilitychange'
    } else if (typeof document.webkitHidden !== 'undefined') {
      hidden = 'webkitHidden'
      visibilityChange = 'webkitvisibilitychange'
    }
    if (!Config.Mobile) {
      visibilityChange = ''
    }

    return {
      start: start
    }

    function start () {
      if (!started) {
        started = true
        $($window).on(visibilityChange + ' blur focus keydown mousedown touchstart', onEvent)

        setTimeout(function () {
          onEvent({type: 'blur', fake_initial: true})
        }, 0)
      }
    }

    function onEvent (e) {
      // console.log('event', e.type)
      if (e.type == 'mousemove') {
        var e = e.originalEvent || e
        if (e && e.movementX === 0 && e.movementY === 0) {
          return
        }
        $($window).off('mousemove', onEvent)
      }

      var isIDLE = e.type == 'blur' || e.type == 'timeout' ? true : false
      if (hidden && document[hidden]) {
        isIDLE = true
      }

      $timeout.cancel(toPromise)
      if (!isIDLE) {
        // console.log('update timeout')
        toPromise = $timeout(function () {
          onEvent({type: 'timeout'})
        }, 30000)
      }

      if (e.type == 'focus' && !$rootScope.idle.afterFocus) {
        $rootScope.idle.afterFocus = true
        setTimeout(function () {
          delete $rootScope.idle.afterFocus
        }, 10)
      }

      var debounceTimeout = $rootScope.idle.initial ? 0 : 1000
      if (e && !e.fake_initial) {
        delete $rootScope.idle.initial
      }

      $timeout.cancel(debouncePromise)

      if ($rootScope.idle.isIDLE == isIDLE) {
        return
      }

      debouncePromise = $timeout(function () {
        // console.log(dT(), 'IDLE changed', isIDLE)
        $rootScope.idle.isIDLE = isIDLE
        if (isIDLE && e.type == 'timeout') {
          $($window).on('mousemove', onEvent)
        }
      }, debounceTimeout)

    }
  })

  .service('GeoLocationManager', function ($q) {
    var lastCoords = false

    function isAvailable () {
      return navigator.geolocation !== undefined
    }

    function getPosition (force) {
      if (!force && lastCoords) {
        return $q.when(lastCoords)
      }
      if (!isAvailable()) {
        return $q.reject()
      }
      var deferred = $q.defer()
      navigator.geolocation.getCurrentPosition(function (position) {
        lastCoords = {
          lat: position.coords.latitude,
          long: position.coords.longitude
        }
        deferred.resolve(lastCoords)
      }, function (error) {
        deferred.reject(error)
      })

      return deferred.promise
    }

    return {
      getPosition: getPosition,
      isAvailable: isAvailable
    }
  })

  .service('AppRuntimeManager', function ($window) {
    return {
      reload: function () {
        try {
          location.reload()
        } catch (e) {}

        if ($window.chrome && chrome.runtime && chrome.runtime.reload) {
          chrome.runtime.reload()
        }
      },
      close: function () {
        try {
          $window.close()
        } catch (e) {}
      },
      focus: function () {
        if (window.navigator.mozApps && document.hidden) {
          // Get app instance and launch it to bring app to foreground
          window.navigator.mozApps.getSelf().onsuccess = function () {
            this.result.launch()
          }
        } else {
          if (window.chrome && chrome.app && chrome.app.window) {
            chrome.app.window.current().focus()
          }
          window.focus()
        }
      }
    }
  })

  .service('RichTextProcessor', function ($sce, $sanitize) {
    var emojiData = Config.Emoji
    var emojiIconSize = 18
    var emojiSupported = navigator.userAgent.search(/OS X|iPhone|iPad|iOS|Android/i) != -1,
      emojiCode

    var emojiRegExp = '\\u0023\\u20E3|\\u00a9|\\u00ae|\\u203c|\\u2049|\\u2139|[\\u2194-\\u2199]|\\u21a9|\\u21aa|\\u231a|\\u231b|\\u23e9|[\\u23ea-\\u23ec]|\\u23f0|\\u24c2|\\u25aa|\\u25ab|\\u25b6|\\u2611|\\u2614|\\u26fd|\\u2705|\\u2709|[\\u2795-\\u2797]|\\u27a1|\\u27b0|\\u27bf|\\u2934|\\u2935|[\\u2b05-\\u2b07]|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55|\\u3030|\\u303d|\\u3297|\\u3299|[\\uE000-\\uF8FF\\u270A-\\u2764\\u2122\\u25C0\\u25FB-\\u25FE\\u2615\\u263a\\u2648-\\u2653\\u2660-\\u2668\\u267B\\u267F\\u2693\\u261d\\u26A0-\\u26FA\\u2708\\u2702\\u2601\\u260E]|[\\u2600\\u26C4\\u26BE\\u23F3\\u2764]|\\uD83D[\\uDC00-\\uDFFF]|\\uD83C[\\uDDE8-\\uDDFA\uDDEC]\\uD83C[\\uDDEA-\\uDDFA\uDDE7]|[0-9]\\u20e3|\\uD83C[\\uDC00-\\uDFFF]'

    var alphaCharsRegExp = 'a-z' +
      '\\u00c0-\\u00d6\\u00d8-\\u00f6\\u00f8-\\u00ff' + // Latin-1
      '\\u0100-\\u024f' + // Latin Extended A and B
      '\\u0253\\u0254\\u0256\\u0257\\u0259\\u025b\\u0263\\u0268\\u026f\\u0272\\u0289\\u028b' + // IPA Extensions
      '\\u02bb' + // Hawaiian
      '\\u0300-\\u036f' + // Combining diacritics
      '\\u1e00-\\u1eff' + // Latin Extended Additional (mostly for Vietnamese)
      '\\u0400-\\u04ff\\u0500-\\u0527' + // Cyrillic
      '\\u2de0-\\u2dff\\ua640-\\ua69f' + // Cyrillic Extended A/B
      '\\u0591-\\u05bf\\u05c1-\\u05c2\\u05c4-\\u05c5\\u05c7' +
      '\\u05d0-\\u05ea\\u05f0-\\u05f4' + // Hebrew
      '\\ufb1d-\\ufb28\\ufb2a-\\ufb36\\ufb38-\\ufb3c\\ufb3e\\ufb40-\\ufb41' +
      '\\ufb43-\\ufb44\\ufb46-\\ufb4f' + // Hebrew Pres. Forms
      '\\u0610-\\u061a\\u0620-\\u065f\\u066e-\\u06d3\\u06d5-\\u06dc' +
      '\\u06de-\\u06e8\\u06ea-\\u06ef\\u06fa-\\u06fc\\u06ff' + // Arabic
      '\\u0750-\\u077f\\u08a0\\u08a2-\\u08ac\\u08e4-\\u08fe' + // Arabic Supplement and Extended A
      '\\ufb50-\\ufbb1\\ufbd3-\\ufd3d\\ufd50-\\ufd8f\\ufd92-\\ufdc7\\ufdf0-\\ufdfb' + // Pres. Forms A
      '\\ufe70-\\ufe74\\ufe76-\\ufefc' + // Pres. Forms B
      '\\u200c' + // Zero-Width Non-Joiner
      '\\u0e01-\\u0e3a\\u0e40-\\u0e4e' + // Thai
      '\\u1100-\\u11ff\\u3130-\\u3185\\uA960-\\uA97F\\uAC00-\\uD7AF\\uD7B0-\\uD7FF' + // Hangul (Korean)
      '\\u3003\\u3005\\u303b' + // Kanji/Han iteration marks
      '\\uff21-\\uff3a\\uff41-\\uff5a' + // full width Alphabet
      '\\uff66-\\uff9f' + // half width Katakana
      '\\uffa1-\\uffdc'; // half width Hangul (Korean)

    var alphaNumericRegExp = '0-9\_' + alphaCharsRegExp

    var domainAddChars = '\u00b7'

    // Based on Regular Expression for URL validation by Diego Perini
    var urlRegExp = '((?:https?|ftp)://|mailto:)?' +
      // user:pass authentication
      '(?:\\S{1,64}(?::\\S{0,64})?@)?' +
      '(?:' +
      // sindresorhus/ip-regexp
      '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}' +
      '|' +
      // host name
      '[' + alphaCharsRegExp + '0-9][' + alphaCharsRegExp + domainAddChars + '0-9\-]{0,64}' +
      // domain name
      '(?:\\.[' + alphaCharsRegExp + '0-9][' + alphaCharsRegExp + domainAddChars + '0-9\-]{0,64}){0,10}' +

      // TLD identifier
      '(?:\\.(xn--[0-9a-z]{2,16}|[' + alphaCharsRegExp + ']{2,24}))' +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:/(?:\\S{0,255}[^\\s.;,(\\[\\]{}<>"\'])?)?'

    var usernameRegExp = '[a-zA-Z\\d_]{5,32}'
    var botCommandRegExp = '\\/([a-zA-Z\\d_]{1,32})(?:@(' + usernameRegExp + '))?(\\b|$)'

    var fullRegExp = new RegExp('(^| )(@)(' + usernameRegExp + ')|(' + urlRegExp + ')|(\\n)|(' + emojiRegExp + ')|(^|[\\s\\(\\]])(#[' + alphaNumericRegExp + ']{2,64})|(^|\\s)' + botCommandRegExp, 'i')

    var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var youtubeRegExp = /^(?:https?:\/\/)?(?:www\.)?youtu(?:|\.be|be\.com|\.b)(?:\/v\/|\/watch\\?v=|e\/|(?:\/\??#)?\/watch(?:.+)v=)(.{11})(?:\&[^\s]*)?/
    var vimeoRegExp = /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/
    var instagramRegExp = /^https?:\/\/(?:instagr\.am\/p\/|instagram\.com\/p\/)([a-zA-Z0-9\-\_]+)/i
    var vineRegExp = /^https?:\/\/vine\.co\/v\/([a-zA-Z0-9\-\_]+)/i
    var twitterRegExp = /^https?:\/\/twitter\.com\/.+?\/status\/\d+/i
    var facebookRegExp = /^https?:\/\/(?:www\.|m\.)?facebook\.com\/(?:.+?\/posts\/\d+|(?:story\.php|permalink\.php)\?story_fbid=(\d+)(?:&substory_index=\d+)?&id=(\d+))/i
    var gplusRegExp = /^https?:\/\/plus\.google\.com\/\d+\/posts\/[a-zA-Z0-9\-\_]+/i
    var soundcloudRegExp = /^https?:\/\/(?:soundcloud\.com|snd\.sc)\/([a-zA-Z0-9%\-\_]+)\/([a-zA-Z0-9%\-\_]+)/i
    var spotifyRegExp = /(https?:\/\/(open\.spotify\.com|play\.spotify\.com|spoti\.fi)\/(.+)|spotify:(.+))/i

    var markdownTestRegExp = /[`_*@]/
    var markdownRegExp = /(^|\s|\n)(````?)([\s\S]+?)(````?)([\s\n\.,:?!;]|$)|(^|\s)(`|\*\*|__)([^\n]+?)\7([\s\.,:?!;]|$)|@(\d+)\s*\((.+?)\)/m

    var siteHashtags = {
      Telegram: 'tg://search_hashtag?hashtag={1}',
      Twitter: 'https://twitter.com/hashtag/{1}',
      Instagram: 'https://instagram.com/explore/tags/{1}/',
      'Google Plus': 'https://plus.google.com/explore/{1}'
    }

    var siteMentions = {
      Telegram: '#/im?p=%40{1}',
      Twitter: 'https://twitter.com/{1}',
      Instagram: 'https://instagram.com/{1}/',
      GitHub: 'https://github.com/{1}'
    }

    var markdownEntities = {
      '`': 'messageEntityCode',
      '**': 'messageEntityBold',
      '__': 'messageEntityItalic'
    }

    return {
      wrapRichText: wrapRichText,
      wrapPlainText: wrapPlainText,
      wrapDraftText: wrapDraftText,
      wrapUrl: wrapUrl,
      parseEntities: parseEntities,
      parseMarkdown: parseMarkdown,
      parseEmojis: parseEmojis,
      mergeEntities: mergeEntities
    }

    function getEmojiSpritesheetCoords (emojiCode) {
      var i
      var row, column
      var totalColumns
      for (var cat = 0; cat < Config.EmojiCategories.length; cat++) {
        totalColumns = Config.EmojiCategorySpritesheetDimens[cat][1]
        i = Config.EmojiCategories[cat].indexOf(emojiCode)
        if (i > -1) {
          row = Math.floor(i / totalColumns)
          column = (i % totalColumns)
          return { category: cat, row: row, column: column }
        }
      }
      console.error('emoji not found in spritesheet', emojiCode)
      return null
    }

    function parseEntities (text, options) {
      options = options || {}

      var match
      var raw = text,
        url
      var entities = [],
        emojiCode,
        emojiCoords,
        matchIndex
      var rawOffset = 0

      // var start = tsNow()

      while ((match = raw.match(fullRegExp))) {
        matchIndex = rawOffset + match.index

        if (match[3]) { // mentions
          entities.push({
            _: 'messageEntityMention',
            offset: matchIndex + match[1].length,
            length: match[2].length + match[3].length
          })
        }
        else if (match[4]) {
          if (emailRegExp.test(match[4])) { // email
            entities.push({
              _: 'messageEntityEmail',
              offset: matchIndex,
              length: match[4].length
            })
          } else {
            var url = false
            var protocol = match[5]
            var tld = match[6]
            var excluded = ''

            if (tld) { // URL
              if (!protocol && (tld.substr(0, 4) === 'xn--' || Config.TLD.indexOf(tld.toLowerCase()) !== -1)) {
                protocol = 'http://'
              }

              if (protocol) {
                var balanced = checkBrackets(match[4])

                if (balanced.length !== match[4].length) {
                  excluded = match[4].substring(balanced.length)
                  match[4] = balanced
                }

                url = (match[5] ? '' : protocol) + match[4]
              }
            } else { // IP address
              url = (match[5] ? '' : 'http://') + match[4]
            }

            if (url) {
              entities.push({
                _: 'messageEntityUrl',
                offset: matchIndex,
                length: match[4].length
              })
            }
          }
        }
        else if (match[7]) { // New line
          entities.push({
            _: 'messageEntityLinebreak',
            offset: matchIndex,
            length: 1
          })
        }
        else if (match[8]) { // Emoji
          if ((emojiCode = EmojiHelper.emojiMap[match[8]]) &&
              (emojiCoords = getEmojiSpritesheetCoords(emojiCode))) {
            entities.push({
              _: 'messageEntityEmoji',
              offset: matchIndex,
              length: match[0].length,
              coords: emojiCoords,
              title: emojiData[emojiCode][1][0]
            })
          }
        }
        else if (match[10]) { // Hashtag
          entities.push({
            _: 'messageEntityHashtag',
            offset: matchIndex + match[9].length,
            length: match[10].length
          })
        }
        else if (match[12]) { // Bot command
          entities.push({
            _: 'messageEntityBotCommand',
            offset: matchIndex + match[11].length,
            length: 1 + match[12].length + (match[13] ? 1 + match[13].length : 0)
          })
        }
        raw = raw.substr(match.index + match[0].length)
        rawOffset += match.index + match[0].length
      }

      // if (entities.length) {
      //   console.log('parse entities', text, entities.slice())
      // }

      return entities
    }

    function parseEmojis (text) {
      return text.replace(/:([a-z0-9\-\+\*_]+?):/gi, function (all, shortcut) {
        var emojiCode = EmojiHelper.shortcuts[shortcut]
        if (emojiCode !== undefined) {
          return EmojiHelper.emojis[emojiCode][0]
        }
        return all
      })
    }

    function parseMarkdown (text, entities, noTrim) {
      if (!markdownTestRegExp.test(text)) {
        return noTrim ? text : text.trim()
      }
      var raw = text
      var match
      var newText = []
      var rawOffset = 0
      var matchIndex
      while (match = raw.match(markdownRegExp)) {
        matchIndex = rawOffset + match.index
        newText.push(raw.substr(0, match.index))

        var text = (match[3] || match[8] || match[11])
        rawOffset -= text.length
        text = text.replace(/^\s+|\s+$/g, '')
        rawOffset += text.length

        if (text.match(/^`*$/)) {
          newText.push(match[0])
        }
        else if (match[3]) { // pre
          if (match[5] == '\n') {
            match[5] = ''
            rawOffset -= 1
          }
          newText.push(match[1] + text + match[5])
          entities.push({
            _: 'messageEntityPre',
            language: '',
            offset: matchIndex + match[1].length,
            length: text.length
          })
          rawOffset -= match[2].length + match[4].length
        } else if (match[7]) { // code|italic|bold
          newText.push(match[6] + text + match[9])
          entities.push({
            _: markdownEntities[match[7]],
            offset: matchIndex + match[6].length,
            length: text.length
          })
          rawOffset -= match[7].length * 2
        } else if (match[11]) { // custom mention
          newText.push(text)
          entities.push({
            _: 'messageEntityMentionName',
            user_id: match[10],
            offset: matchIndex,
            length: text.length
          })
          rawOffset -= match[0].length - text.length
        }
        raw = raw.substr(match.index + match[0].length)
        rawOffset += match.index + match[0].length
      }
      newText.push(raw)
      newText = newText.join('')

      if (!newText.replace(/\s+/g, '').length) {
        newText = text
        entities.splice(0, entities.length)
      }
      if (!entities.length && !noTrim) {
        newText = newText.trim()
      }
      return newText
    }

    function mergeEntities (currentEntities, newEntities, fromApi) {
      var totalEntities = newEntities.slice()

      var i
      var len = currentEntities.length
      var j
      var len2 = newEntities.length
      var startJ = 0
      var curEntity
      var newEntity
      var start, end
      var cStart, cEnd
      var bad
      for (i = 0; i < len; i++) {
        curEntity = currentEntities[i]
        if (fromApi &&
          curEntity._ != 'messageEntityLinebreak' &&
          curEntity._ != 'messageEntityEmoji') {
          continue
        }
        // console.log('s', curEntity, newEntities)
        start = curEntity.offset
        end = start + curEntity.length
        bad = false
        for (j = startJ; j < len2; j++) {
          newEntity = newEntities[j]
          cStart = newEntity.offset
          cEnd = cStart + newEntity.length
          if (cStart <= start) {
            startJ = j
          }
          if (start >= cStart && start < cEnd ||
            end > cStart && end <= cEnd) {
            // console.log('bad', curEntity, newEntity)
            if (fromApi &&
              start >= cStart && end <= cEnd) {
              if (newEntity.nested === undefined) {
                newEntity.nested = []
              }
              curEntity.offset -= cStart
              newEntity.nested.push(angular.copy(curEntity))
            }
            bad = true
            break
          }
          if (cStart >= end) {
            break
          }
        }
        if (bad) {
          continue
        }
        totalEntities.push(curEntity)
      }

      totalEntities.sort(function (a, b) {
        return a.offset - b.offset
      })

      // console.log('merge', currentEntities, newEntities, totalEntities)

      return totalEntities
    }

    function wrapRichNestedText (text, nested, options) {
      if (nested === undefined) {
        return encodeEntities(text)
      }
      options.hasNested = true

      return wrapRichText(text, {entities: nested, nested: true})
    }

    function wrapRichText (text, options) {
      if (!text || !text.length) {
        return ''
      }

      options = options || {}

      var entities = options.entities
      var contextSite = options.contextSite || 'Telegram'
      var contextExternal = contextSite != 'Telegram'
      var emojiFound = false

      if (entities === undefined) {
        entities = parseEntities(text, options)
      }

      var i = 0
      var len = entities.length
      var entity
      var entityText
      var skipEntity
      var url
      var html = []
      var lastOffset = 0
      var curEmojiSize = options.emojiIconSize || emojiIconSize
      for (i = 0; i < len; i++) {
        entity = entities[i]
        if (entity.offset > lastOffset) {
          html.push(
            encodeEntities(text.substr(lastOffset, entity.offset - lastOffset))
          )
        }
        else if (entity.offset < lastOffset) {
          continue
        }
        skipEntity = false
        entityText = text.substr(entity.offset, entity.length)
        switch (entity._) {
          case 'messageEntityMention':
            var contextUrl = !options.noLinks && siteMentions[contextSite]
            if (!contextUrl) {
              skipEntity = true
              break
            }
            var username = entityText.substr(1)
            var attr = ''
            if (options.highlightUsername &&
              options.highlightUsername.toLowerCase() == username.toLowerCase()) {
              attr = 'class="im_message_mymention"'
            }
            html.push(
              '<a ',
              attr,
              contextExternal ? ' target="_blank" rel="noopener noreferrer" ' : '',
              ' href="',
              contextUrl.replace('{1}', encodeURIComponent(username)),
              '">',
              encodeEntities(entityText),
              '</a>'
            )
            break

          case 'messageEntityMentionName':
            if (options.noLinks) {
              skipEntity = true
              break
            }
            html.push(
              '<a href="#/im?p=u',
              encodeURIComponent(entity.user_id),
              '">',
              encodeEntities(entityText),
              '</a>'
            )
            break

          case 'messageEntityHashtag':
            var contextUrl = !options.noLinks && siteHashtags[contextSite]
            if (!contextUrl) {
              skipEntity = true
              break
            }
            var hashtag = entityText.substr(1)
            html.push(
              '<a ',
              contextExternal ? ' target="_blank" rel="noopener noreferrer" ' : '',
              'href="',
              contextUrl.replace('{1}', encodeURIComponent(hashtag))
              ,
              '">',
              encodeEntities(entityText),
              '</a>'
            )
            break

          case 'messageEntityEmail':
            if (options.noLinks) {
              skipEntity = true
              break
            }
            html.push(
              '<a href="',
              encodeEntities('mailto:' + entityText),
              '" target="_blank" rel="noopener noreferrer">',
              encodeEntities(entityText),
              '</a>'
            )
            break

          case 'messageEntityUrl':
          case 'messageEntityTextUrl':
            var inner
            if (entity._ == 'messageEntityTextUrl') {
              url = entity.url
              url = wrapUrl(url, true)
              inner = wrapRichNestedText(entityText, entity.nested, options)
            } else {
              url = wrapUrl(entityText, false)
              inner = encodeEntities(replaceUrlEncodings(entityText))
            }
            if (options.noLinks) {
              html.push(inner);
            } else {
              html.push(
                '<a href="',
                encodeEntities(url),
                '" target="_blank" rel="noopener noreferrer">',
                inner,
                '</a>'
              )
            }
            break

          case 'messageEntityLinebreak':
            html.push(options.noLinebreaks ? ' ' : '<br/>')
            break

          case 'messageEntityEmoji':
            html.push(
              '<span class="emoji emoji-',
              entity.coords.category,
              '-',
              (curEmojiSize * entity.coords.column),
              '-',
              (curEmojiSize * entity.coords.row),
              '" ',
              'title="', entity.title, '">',
              ':', entity.title, ':</span>'
            )
            emojiFound = true
            break

          case 'messageEntityBotCommand':
            if (options.noLinks || options.noCommands || contextExternal) {
              skipEntity = true
              break
            }
            var command = entityText.substr(1)
            var bot
            var atPos
            if ((atPos = command.indexOf('@')) != -1) {
              bot = command.substr(atPos + 1)
              command = command.substr(0, atPos)
            } else {
              bot = options.fromBot
            }
            html.push(
              '<a href="',
              encodeEntities('tg://bot_command?command=' + encodeURIComponent(command) + (bot ? '&bot=' + encodeURIComponent(bot) : '')),
              '">',
              encodeEntities(entityText),
              '</a>'
            )
            break

          case 'messageEntityBold':
            html.push(
              '<strong>',
              wrapRichNestedText(entityText, entity.nested, options),
              '</strong>'
            )
            break

          case 'messageEntityItalic':
            html.push(
              '<em>',
              wrapRichNestedText(entityText, entity.nested, options),
              '</em>'
            )
            break

          case 'messageEntityCode':
            html.push(
              '<code>',
              encodeEntities(entityText),
              '</code>'
            )
            break

          case 'messageEntityPre':
            html.push(
              '<pre><code', (entity.language ? ' class="language-' + encodeEntities(entity.language) + '"' : ''), '>',
              encodeEntities(entityText),
              '</code></pre>'
            )
            break

          default:
            skipEntity = true
        }
        lastOffset = entity.offset + (skipEntity ? 0 : entity.length)
      }
      html.push(encodeEntities(text.substr(lastOffset)))

      text = $sanitize(html.join(''))

      if (!options.nested && (emojiFound || options.hasNested)) {
        text = text.replace(/\ufe0f|&#65039;|&#65533;|&#8205;/g, '', text)
        var emojiSizeClass = curEmojiSize == 18 ? '' : (' emoji-w' + curEmojiSize)
        text = text.replace(/<span((?: [^>]*)?) class="emoji emoji-(\d)-(\d+)-(\d+)"(.+?)<\/span>/g,
          '<span$1 class="emoji ' + emojiSizeClass + ' emoji-spritesheet-$2" style="background-position: -$3px -$4px;" $5</span>')
      }

      return $sce.trustAs('html', text)
    }

    function wrapDraftText (text, options) {
      if (!text || !text.length) {
        return ''
      }

      options = options || {}

      var entities = options.entities

      if (entities === undefined) {
        entities = parseEntities(text, options)
      }

      var i = 0
      var len = entities.length
      var entity
      var entityText
      var skipEntity
      var code = []
      var lastOffset = 0
      for (i = 0; i < len; i++) {
        entity = entities[i]
        if (entity.offset > lastOffset) {
          code.push(
            text.substr(lastOffset, entity.offset - lastOffset)
          )
        }
        else if (entity.offset < lastOffset) {
          continue
        }
        skipEntity = false
        entityText = text.substr(entity.offset, entity.length)
        switch (entity._) {
          case 'messageEntityEmoji':
            code.push(
              ':',
              entity.title,
              ':'
            )
            break

          case 'messageEntityCode':
            code.push(
              '`', entityText, '`'
            )
            break

          case 'messageEntityBold':
            code.push(
              '**', entityText, '**'
            )
            break

          case 'messageEntityItalic':
            code.push(
              '__', entityText, '__'
            )
            break

          case 'messageEntityPre':
            code.push(
              '```', entityText, '```'
            )
            break

          case 'messageEntityMentionName':
            code.push(
              '@', entity.user_id, ' (', entityText, ')'
            )
            break

          default:
            skipEntity = true
        }
        lastOffset = entity.offset + (skipEntity ? 0 : entity.length)
      }

      code.push(text.substr(lastOffset))

      return code.join('')
    }

    function checkBrackets (url) {
      var urlLength = url.length
      var urlOpenBrackets = url.split('(').length - 1
      var urlCloseBrackets = url.split(')').length - 1

      while (urlCloseBrackets > urlOpenBrackets &&
        url.charAt(urlLength - 1) === ')') {
        url = url.substr(0, urlLength - 1)
        urlCloseBrackets--
        urlLength--
      }
      if (urlOpenBrackets > urlCloseBrackets) {
        url = url.replace(/\)+$/, '')
      }
      return url
    }

    function replaceUrlEncodings(urlWithEncoded) {
      return urlWithEncoded.replace(/(%[A-Z\d]{2})+/g, function (str) {
        try {
          return decodeURIComponent(str)
        } catch (e) {
          return str
        }
      })
    }

    function wrapPlainText (text, options) {
      if (emojiSupported) {
        return text
      }
      if (!text || !text.length) {
        return ''
      }

      options = options || {}

      text = text.replace(/\ufe0f/g, '', text)

      var match
      var raw = text
      var text = [],
        emojiTitle

      while ((match = raw.match(fullRegExp))) {
        text.push(raw.substr(0, match.index))

        if (match[8]) {
          if ((emojiCode = EmojiHelper.emojiMap[match[8]]) &&
            (emojiTitle = emojiData[emojiCode][1][0])) {
            text.push(':' + emojiTitle + ':')
          } else {
            text.push(match[0])
          }
        } else {
          text.push(match[0])
        }
        raw = raw.substr(match.index + match[0].length)
      }
      text.push(raw)

      return text.join('')
    }

    function wrapUrl (url, unsafe) {
      if (!url.match(/^https?:\/\//i)) {
        url = 'http://' + url
      }
      var tgMeMatch
      var telescoPeMatch
      if (unsafe == 2) {
        url = 'tg://unsafe_url?url=' + encodeURIComponent(url)
      }
      else if ((tgMeMatch = url.match(/^https?:\/\/t(?:elegram)?\.me\/(.+)/))) {
        var fullPath = tgMeMatch[1]
        var path = fullPath.split('/')
        switch (path[0]) {
          case 'joinchat':
            url = 'tg://join?invite=' + path[1]
            break
          case 'addstickers':
            url = 'tg://addstickers?set=' + path[1]
            break
          default:
            if (path[1] && path[1].match(/^\d+$/)) {
              url = 'tg://resolve?domain=' + path[0] + '&post=' + path[1]
            }
            else if (path.length == 1) {
              var domainQuery = path[0].split('?')
              var domain = domainQuery[0]
              var query = domainQuery[1]
              if (domain == 'iv') {
                var match = (query || '').match(/url=([^&=]+)/)
                if (match) {
                  url = match[1]
                  try {
                    url = decodeURIComponent(url)
                  } catch (e) {}
                  return wrapUrl(url, unsafe)
                }
              }
              url = 'tg://resolve?domain=' + domain + (query ? '&' + query : '')
            }
        }
      }
      else if ((telescoPeMatch = url.match(/^https?:\/\/telesco\.pe\/([^/?]+)\/(\d+)/))) {
        url = 'tg://resolve?domain=' + telescoPeMatch[1] + '&post=' + telescoPeMatch[2]
      }
      else if (unsafe) {
        url = 'tg://unsafe_url?url=' + encodeURIComponent(url)
      }
      return url
    }
  })

  .service('ServerTimeManager', function (Storage) {
    var timestampNow = tsNow(true)
    var midnightNoOffset = timestampNow - (timestampNow % 86400)
    var midnightOffseted = new Date()
    midnightOffseted.setHours(0)
    midnightOffseted.setMinutes(0)
    midnightOffseted.setSeconds(0)

    var midnightOffset = midnightNoOffset - (Math.floor(+midnightOffseted / 1000))

    var serverTimeOffset = 0
    var timeParams = {
      midnightOffset: midnightOffset,
      serverTimeOffset: serverTimeOffset
    }

    Storage.get('server_time_offset').then(function (to) {
      if (to) {
        serverTimeOffset = to
        timeParams.serverTimeOffset = to
      }
    })

    return timeParams
  })

  .service('WebPushApiManager', function ($window, $timeout, $q, $rootScope, _, AppRuntimeManager) {

    var isAvailable = true
    var isPushEnabled = false
    var localNotificationsAvailable = true
    var started = false
    var settings = {}
    var isAliveTO
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    var userVisibleOnly = isFirefox ? false : true

    if (!('PushManager' in window) ||
        !('Notification' in window) ||
        !('serviceWorker' in navigator)) {
      console.warn('Push messaging is not supported.')
      isAvailable = false
      localNotificationsAvailable = false
    }

    if (isAvailable &&
        Notification.permission === 'denied') {
      console.warn('The user has blocked notifications.')
    }

    function start() {
      if (!started) {
        started = true
        getSubscription()
        setUpServiceWorkerChannel()
      }
    }

    function setLocalNotificationsDisabled() {
      localNotificationsAvailable = false
    }

    function getSubscription() {
      if (!isAvailable) {
        return
      }
      navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.getSubscription().then(function(subscription) {
          isPushEnabled = subscription ? true : false
          pushSubscriptionNotify('init', subscription)
        })
        .catch(function(err) {
          console.log('Error during getSubscription()', err)
        })
      })
    }

    function subscribe() {
      if (!isAvailable) {
        return
      }
      navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.subscribe({userVisibleOnly: userVisibleOnly}).then(function(subscription) {
          // The subscription was successful
          isPushEnabled = true
          pushSubscriptionNotify('subscribe', subscription)
        })
        .catch(function(e) {
          if (Notification.permission === 'denied') {
            console.log('Permission for Notifications was denied')
          } else {
            console.log('Unable to subscribe to push.', e)
            if (!userVisibleOnly) {
              userVisibleOnly = true
              setTimeout(subscribe, 0)
            }
          }
        })
      })
    }

    function unsubscribe() {
      if (!isAvailable) {
        return
      }
      navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.getSubscription().then(function (subscription) {
          isPushEnabled = false

          if (subscription) {
            pushSubscriptionNotify('unsubscribe', subscription)

            setTimeout(function() {
              subscription.unsubscribe().then(function(successful) {
                isPushEnabled = false
              }).catch(function(e) {
                console.error('Unsubscription error: ', e)
              })
            }, 3000)
          }

        }).catch(function(e) {
          console.error('Error thrown while unsubscribing from ' +
            'push messaging.', e)
        })
      })
    }

    function forceUnsubscribe() {
      if (!isAvailable) {
        return
      }
      navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.getSubscription().then(function (subscription) {
          console.warn('force unsubscribe', subscription)
          if (subscription) {
            subscription.unsubscribe().then(function(successful) {
              console.warn('force unsubscribe successful', successful)
              isPushEnabled = false
            }).catch(function(e) {
              console.error('Unsubscription error: ', e)
            })
          }

        }).catch(function(e) {
          console.error('Error thrown while unsubscribing from ' +
            'push messaging.', e)
        })
      })
    }

    function isAliveNotify() {
      if (!isAvailable ||
          $rootScope.idle && $rootScope.idle.deactivated) {
        return
      }
      settings.baseUrl = (location.href || '').replace(/#.*$/, '') + '#/im'

      var eventData = {
        type: 'ping',
        localNotifications: localNotificationsAvailable,
        lang: {
          push_action_mute1d: _(Config.Mobile
            ? 'push_action_mute1d_mobile_raw'
            : 'push_action_mute1d_raw'
          ),
          push_action_settings: _(Config.Mobile
            ? 'push_action_settings_mobile_raw'
            : 'push_action_settings_raw'
          ),
          push_message_nopreview: _('push_message_nopreview_raw'),
        },
        settings: settings
      }
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(eventData)
      }
      isAliveTO = setTimeout(isAliveNotify, 10000)
    }

    function setSettings(newSettings) {
      settings = angular.copy(newSettings)
      clearTimeout(isAliveTO)
      isAliveNotify()
    }

    function hidePushNotifications() {
      if (!isAvailable) {
        return
      }
      if (navigator.serviceWorker.controller) {
        var eventData = {type: 'notifications_clear'}
        navigator.serviceWorker.controller.postMessage(eventData)
      }
    }

    function setUpServiceWorkerChannel() {
      if (!isAvailable) {
        return
      }
      navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data &&
            event.data.type == 'push_click') {
          if ($rootScope.idle && $rootScope.idle.deactivated) {
            AppRuntimeManager.reload()
            return
          }
          $rootScope.$emit('push_notification_click', event.data.data)
        }
      })
      navigator.serviceWorker.ready.then(isAliveNotify)
    }


    function pushSubscriptionNotify(event, subscription) {
      if (subscription) {
        var subscriptionObj = subscription.toJSON()
        if (!subscriptionObj ||
            !subscriptionObj.endpoint ||
            !subscriptionObj.keys ||
            !subscriptionObj.keys.p256dh ||
            !subscriptionObj.keys.auth) {
          console.warn(dT(), 'Invalid push subscription', subscriptionObj)
          unsubscribe()
          isAvailable = false
          return pushSubscriptionNotify(event, false)
        }
        console.warn(dT(), 'Push', event, subscriptionObj)
        $rootScope.$emit('push_' + event, {
          tokenType: 10,
          tokenValue: JSON.stringify(subscriptionObj)
        })
      } else {
        console.warn(dT(), 'Push', event, false)
        $rootScope.$emit('push_' + event, false)
      }
    }

    return {
      isAvailable: isAvailable,
      start: start,
      isPushEnabled: isPushEnabled,
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      forceUnsubscribe: forceUnsubscribe,
      hidePushNotifications: hidePushNotifications,
      setLocalNotificationsDisabled: setLocalNotificationsDisabled,
      setSettings: setSettings
    }

  })
