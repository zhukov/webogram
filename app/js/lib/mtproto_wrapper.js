/*!
 * Webogram v0.3.2 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

angular.module('izhukov.mtproto.wrapper', ['izhukov.utils', 'izhukov.mtproto'])

.factory('MtpApiManager', function (Storage, MtpAuthorizer, MtpNetworkerFactory, ErrorService, $q) {
  var cachedNetworkers = {},
      cachedUploadNetworkers = {},
      cachedExportPromise = {},
      baseDcID = false;

  Storage.get('dc').then(function (dcID) {
    if (dcID) {
      baseDcID = dcID;
    }
  });

  function mtpSetUserAuth (dcID, userAuth) {
    Storage.set({
      dc: dcID,
      user_auth: angular.extend({dcID: dcID}, userAuth)
    });

    baseDcID = dcID;
  }

  function mtpLogOut () {
    return mtpInvokeApi('auth.logOut').then(function () {
      Storage.remove('dc', 'user_auth');

      baseDcID = false;
    }, function (error) {
      Storage.remove('dc', 'user_auth');
      if (error && error.code != 401) {
        Storage.remove('dc' + baseDcID + '_auth_key');
      }
      baseDcID = false;
      error.handled = true;
    });
  }

  function mtpGetNetworker (dcID, options) {
    options = options || {};

    var cache = (options.fileUpload || options.fileDownload)
                  ? cachedUploadNetworkers
                  : cachedNetworkers;
    if (!dcID) {
      throw new Exception('get Networker without dcID');
    }

    if (cache[dcID] !== undefined) {
      return $q.when(cache[dcID]);
    }

    var akk = 'dc' + dcID + '_auth_key',
        ssk = 'dc' + dcID + '_server_salt';

    return Storage.get(akk, ssk).then(function (result) {

      if (cache[dcID] !== undefined) {
        return cache[dcID];
      }

      var authKeyHex = result[0],
          serverSaltHex = result[1];
      // console.log('ass', dcID, authKeyHex, serverSaltHex);
      if (authKeyHex && authKeyHex.length == 512) {
        var authKey    = bytesFromHex(authKeyHex);
        var serverSalt = bytesFromHex(serverSaltHex);

        return cache[dcID] = MtpNetworkerFactory.getNetworker(dcID, authKey, serverSalt, options);
      }

      if (!options.createNetworker) {
        return $q.reject({type: 'AUTH_KEY_EMPTY', code: 401});
      }

      return MtpAuthorizer.auth(dcID).then(function (auth) {
        var storeObj = {};
        storeObj[akk] = bytesToHex(auth.authKey);
        storeObj[ssk] = bytesToHex(auth.serverSalt);
        Storage.set(storeObj);

        return cache[dcID] = MtpNetworkerFactory.getNetworker(dcID, auth.authKey, auth.serverSalt, options);
      }, function (error) {
        console.log('Get networker error', error, error.stack);
        return $q.reject(error);
      });
    });
  };

  function mtpInvokeApi (method, params, options) {
    options = options || {};

    var deferred = $q.defer(),
        rejectPromise = function (error) {
          if (!error) {
            error = {type: 'ERROR_EMPTY'};
          } else if (!angular.isObject(error)) {
            error = {message: error};
          }
          deferred.reject(error);

          if (!options.noErrorBox) {
            error.input = method;
            error.stack = error.stack || (new Error()).stack;
            setTimeout(function () {
              if (!error.handled) {
                ErrorService.show({error: error});
                error.handled = true;
              }
            }, 100);
          }
        },
        dcID,
        networkerPromise;

    if (dcID = options.dcID) {
      networkerPromise = mtpGetNetworker(dcID, options);
    } else {
      networkerPromise = Storage.get('dc').then(function (baseDcID) {
        return mtpGetNetworker(dcID = baseDcID || 2, options);
      });
    }

    var cachedNetworker,
        stack = false;

    networkerPromise.then(function (networker) {
      return (cachedNetworker = networker).wrapApiCall(method, params, options).then(
        function (result) {
          deferred.resolve(result);
          // $timeout(function () {
          //   deferred.resolve(result);
          // }, 1000);
        },
        function (error) {
          console.error(dT(), 'Error', error.code, error.type, baseDcID, dcID);
          if (error.code == 401 && baseDcID == dcID) {
            Storage.remove('dc', 'user_auth');
            rejectPromise(error);
          }
          else if (error.code == 401 && baseDcID && dcID != baseDcID) {
            if (cachedExportPromise[dcID] === undefined) {
              var exportDeferred = $q.defer();

              mtpInvokeApi('auth.exportAuthorization', {dc_id: dcID}, {noErrorBox: true}).then(function (exportedAuth) {
                mtpInvokeApi('auth.importAuthorization', {
                  id: exportedAuth.id,
                  bytes: exportedAuth.bytes
                }, {dcID: dcID, noErrorBox: true}).then(function () {
                  exportDeferred.resolve();
                }, function (e) {
                  exportDeferred.reject(e);
                })
              }, function (e) {
                exportDeferred.reject(e)
              });

              cachedExportPromise[dcID] = exportDeferred.promise;
            }

            cachedExportPromise[dcID].then(function () {
              (cachedNetworker = networker).wrapApiCall(method, params, options).then(function (result) {
                deferred.resolve(result);
              }, function (error) {
                rejectPromise(error);
              });
            }, function (error) {
              rejectPromise(error);
            });
          }
          else if (error.code == 303) {
            var newDcID = error.type.match(/^(PHONE_MIGRATE_|NETWORK_MIGRATE_|USER_MIGRATE_)(\d+)/)[2];
            if (newDcID != dcID) {
              if (options.dcID) {
                options.dcID = newDcID;
              } else {
                Storage.set({dc: baseDcID = newDcID});
              }

              mtpGetNetworker(newDcID, options).then(function (networker) {
                networker.wrapApiCall(method, params, options).then(function (result) {
                  deferred.resolve(result);
                }, function (error) {
                  rejectPromise(error);
                });
              });
            }
          }
          else {
            rejectPromise(error);
          }
        });
    }, function (error) {
      rejectPromise(error);
    });

    if (!(stack = (stack || (new Error()).stack))) {
      try {window.unexistingFunction();} catch (e) {
        stack = e.stack || '';
      }
    }

    return deferred.promise;
  };

  function mtpGetUserID () {
    return Storage.get('user_auth').then(function (auth) {
      return auth.id || 0;
    });
  }

  function getBaseDcID () {
    return baseDcID || false;
  }

  return {
    getBaseDcID: getBaseDcID,
    getUserID: mtpGetUserID,
    invokeApi: mtpInvokeApi,
    getNetworker: mtpGetNetworker,
    setUserAuth: mtpSetUserAuth,
    logOut: mtpLogOut
  }
})

.factory('MtpApiFileManager', function (MtpApiManager, $q, FileManager, IdbFileStorage, TmpfsFileStorage, MemoryFileStorage) {

  var cachedFs = false;
  var cachedFsPromise = false;
  var apiUploadPromise = $q.when();
  var cachedSavePromises = {};
  var cachedDownloadPromises = {};
  var cachedDownloads = {};

  var downloadPulls = {};
  var downloadActives = {};
  var downloadLimit = 5;

  function downloadRequest(dcID, cb, activeDelta) {
    if (downloadPulls[dcID] === undefined) {
      downloadPulls[dcID] = [];
      downloadActives[dcID] = 0
    }
    var downloadPull = downloadPulls[dcID];
    var deferred = $q.defer();
    downloadPull.push({cb: cb, deferred: deferred, activeDelta: activeDelta});
    downloadCheck(dcID);

    return deferred.promise;
  };

  var index = 0;

  function downloadCheck(dcID) {
    var downloadPull = downloadPulls[dcID];

    if (downloadActives[dcID] >= downloadLimit || !downloadPull || !downloadPull.length) {
      return false;
    }

    var data = downloadPull.shift(),
        activeDelta = data.activeDelta || 1;

    downloadActives[dcID] += activeDelta;

    var a = index++;
    data.cb()
      .then(function (result) {
        downloadActives[dcID] -= activeDelta;
        downloadCheck(dcID);

        data.deferred.resolve(result);

      }, function (error) {
        downloadActives[dcID] -= activeDelta;
        downloadCheck(dcID);

        data.deferred.reject(error);
      })
  };

  function getFileName(location) {
    switch (location._) {
      case 'inputVideoFileLocation':
        return 'video' + location.id + '.mp4';

      case 'inputDocumentFileLocation':
        return 'doc' + location.id;

      case 'inputAudioFileLocation':
        return 'audio' + location.id;
    }

    if (!location.volume_id) {
      console.trace('Empty location', location);
    }

    return location.volume_id + '_' + location.local_id + '_' + location.secret + '.jpg';
  };

  function getTempFileName(file) {
    var size = file.size || -1;
    var random = nextRandomInt(0xFFFFFFFF);
    return '_temp' + random + '_' + size;
  };

  function getCachedFile (location) {
    if (!location) {
      return false;
    }
    var fileName = getFileName(location);

    return cachedDownloads[fileName] || false;
  }

  function getFileStorage () {
    if (TmpfsFileStorage.isAvailable()) {
      return TmpfsFileStorage;
    }
    if (IdbFileStorage.isAvailable()) {
      return IdbFileStorage;
    }
    return MemoryFileStorage;
  }

  function saveSmallFile (location, bytes) {
    var fileName = getFileName(location),
        mimeType = 'image/jpeg';

    if (!cachedSavePromises[fileName]) {
      cachedSavePromises[fileName] = getFileStorage().saveFile(fileName, bytes).then(function (blob) {
        return cachedDownloads[fileName] = FileManager.getUrl(blob, mimeType);
      });
    }
    return cachedSavePromises[fileName];
  }

  function downloadSmallFile(location) {
    if (!FileManager.isAvailable()) {
      return $q.reject({type: 'BROWSER_BLOB_NOT_SUPPORTED'});
    }
    // console.log('dload small', location);
    var fileName = getFileName(location),
        mimeType = 'image/jpeg',
        cachedPromise = cachedSavePromises[fileName] || cachedDownloadPromises[fileName];

    if (cachedPromise) {
      return cachedPromise;
    }

    var fileStorage = getFileStorage();

    return cachedDownloadPromises[fileName] = fileStorage.getFile(fileName).then(function (blob) {
      return cachedDownloads[fileName] = FileManager.getUrl(blob, mimeType);
    }, function () {
      var downloadPromise = downloadRequest(location.dc_id, function () {
        // console.log('next small promise');
        return MtpApiManager.invokeApi('upload.getFile', {
          location: angular.extend({}, location, {_: 'inputFileLocation'}),
          offset: 0,
          limit: 0
        }, {
          dcID: location.dc_id,
          fileDownload: true,
          createNetworker: true
        });
      });

      return fileStorage.getFileWriter(fileName, mimeType).then(function (fileWriter) {
        return downloadPromise.then(function (result) {
          return FileManager.write(fileWriter, result.bytes).then(function () {
            return cachedDownloads[fileName] = FileManager.getUrl(fileWriter.finalize(), mimeType);
          });
        });
      });
    });
  }

  function downloadFile (dcID, location, size, options) {
    if (!FileManager.isAvailable()) {
      return $q.reject({type: 'BROWSER_BLOB_NOT_SUPPORTED'});
    }

    options = options || {};

    // console.log(dT(), 'Dload file', dcID, location, size);
    var fileName = getFileName(location),
        toFileEntry = options.toFileEntry || null,
        cachedPromise = cachedSavePromises[fileName] || cachedDownloadPromises[fileName];

    var fileStorage = getFileStorage();

    // console.log(dT(), 'fs', fileStorage, fileName, cachedPromise);

    if (cachedPromise) {
      if (toFileEntry) {
        return cachedPromise.then(function (url) {
          return fileStorage.getFile(fileName).then(function (blob) {
            return FileManager.copy(blob, toFileEntry);
          });
        })
      }
      return cachedPromise;
    }

    var deferred = $q.defer(),
        canceled = false,
        resolved = false,
        mimeType = options.mime || 'image/jpeg',
        cacheFileWriter,
        errorHandler = function (error) {
          deferred.reject(error);
          errorHandler = angular.noop;
          if (cacheFileWriter) cacheFileWriter.truncate(0);
        };


    fileStorage.getFile(fileName).then(function (blob) {
      if (toFileEntry) {
        FileManager.copy(blob, toFileEntry).then(function () {
          deferred.resolve();
        }, errorHandler);
      } else {
        deferred.resolve(cachedDownloads[fileName] = FileManager.getUrl(blob, mimeType));
      }
    }, function () {
      var fileWriterPromise = toFileEntry ? FileManager.getFileWriter(toFileEntry) : fileStorage.getFileWriter(fileName, mimeType);

      fileWriterPromise.then(function (fileWriter) {
        cacheFileWriter = fileWriter;
        var limit = 524288,
            writeFilePromise = $q.when(),
            writeFileDeferred;
        for (var offset = 0; offset < size; offset += limit) {
          writeFileDeferred = $q.defer();
          (function (isFinal, offset, writeFileDeferred, writeFilePromise) {
            return downloadRequest(dcID, function () {
              if (canceled) {
                return $q.when();
              }
              return MtpApiManager.invokeApi('upload.getFile', {
                location: location,
                offset: offset,
                limit: limit
              }, {
                dcID: dcID,
                fileDownload: true,
                createNetworker: true
              });
            }, 6).then(function (result) {
              writeFilePromise.then(function () {
                if (canceled) {
                  return $q.when();
                }
                return FileManager.write(fileWriter, result.bytes).then(function () {
                  writeFileDeferred.resolve();
                }, errorHandler).then(function () {
                  if (isFinal) {
                    resolved = true;
                    if (toFileEntry) {
                      deferred.resolve();
                    } else {
                      deferred.resolve(cachedDownloads[fileName] = FileManager.getUrl(fileWriter.finalize(), mimeType));
                    }
                  } else {
                    deferred.notify({done: offset + limit, total: size});
                  };
                });
              });
            });
          })(offset + limit >= size, offset, writeFileDeferred, writeFilePromise);
          writeFilePromise = writeFileDeferred.promise;
        }
      });
    })

    deferred.promise.cancel = function () {
      if (!canceled && !resolved) {
        canceled = true;
        delete cachedDownloadPromises[fileName];
        errorHandler({type: 'DOWNLOAD_CANCELED'});
      }
    }

    if (!toFileEntry) {
      cachedDownloadPromises[fileName] = deferred.promise;
    }

    return deferred.promise;
  }

  function uploadFile (file) {
    var fileSize = file.size,
        // partSize = fileSize > 102400 ? 65536 : 4096,
        // partSize = fileSize > 102400 ? 524288 : 4096,
        partSize = fileSize > 102400 ? 524288 : 32768,
        isBigFile = fileSize >= 10485760,
        totalParts = Math.ceil(fileSize / partSize),
        canceled = false,
        resolved = false,
        doneParts = 0;

    if (totalParts > 1500) {
      return $q.reject({type: 'FILE_TOO_BIG'});
    }

    var fileID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        deferred = $q.defer(),
        errorHandler = function (error) {
          // console.error('Up Error', error);
          deferred.reject(error);
          errorHandler = angular.noop;
        },
        part = 0,
        offset,
        resultInputFile = {
          _: isBigFile ? 'inputFileBig' : 'inputFile',
          id: fileID,
          parts: totalParts,
          name: file.name,
          md5_checksum: ''
        };


    var fileReadPromise = $q.when();

    for (offset = 0; offset < fileSize; offset += partSize) {
      (function (offset, part) {
        fileReadPromise = fileReadPromise.then(function () {
          var fileReadDeferred = $q.defer();

          var reader = new FileReader();
          var blob = file.slice(offset, offset + partSize);

          reader.onloadend = function (e) {
            if (canceled || e.target.readyState != FileReader.DONE) {
              return;
            }
            var apiCurPromise = apiUploadPromise = apiUploadPromise.then(function () {
              return MtpApiManager.invokeApi(isBigFile ? 'upload.saveBigFilePart' : 'upload.saveFilePart', {
                file_id: fileID,
                file_part: part,
                file_total_parts: totalParts,
                bytes: bytesFromArrayBuffer(e.target.result)
              }, {
                startMaxLength: partSize + 256,
                fileUpload: true
              });
            }, errorHandler);

            apiCurPromise.then(function (result) {
              doneParts++;
              fileReadDeferred.resolve();
              if (doneParts >= totalParts) {
                deferred.resolve(resultInputFile);
                resolved = true;
              } else {
                console.log(dT(), 'Progress', doneParts * partSize / fileSize);
                deferred.notify({done: doneParts * partSize, total: fileSize});
              }
            }, errorHandler);
          };

          reader.readAsArrayBuffer(blob);

          return fileReadDeferred.promise;
        });
      })(offset, part++);
    }

    deferred.promise.cancel = function () {
      console.log('cancel upload', canceled, resolved);
      if (!canceled && !resolved) {
        canceled = true;
        errorHandler({type: 'UPLOAD_CANCELED'});
      }
    }

    return deferred.promise;
  }

  return {
    getCachedFile: getCachedFile,
    downloadFile: downloadFile,
    downloadSmallFile: downloadSmallFile,
    saveSmallFile: saveSmallFile,
    uploadFile: uploadFile
  };
})
