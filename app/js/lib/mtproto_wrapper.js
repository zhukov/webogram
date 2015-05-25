/*!
 * Webogram v0.4.6 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

angular.module('izhukov.mtproto.wrapper', ['izhukov.utils', 'izhukov.mtproto'])

.factory('MtpApiManager', function (Storage, MtpAuthorizer, MtpNetworkerFactory, MtpSingleInstanceService, AppRuntimeManager, ErrorService, qSync, $q, TelegramMeWebService) {
  var cachedNetworkers = {},
      cachedUploadNetworkers = {},
      cachedExportPromise = {},
      baseDcID = false;

  var telegramMeNotified;

  MtpSingleInstanceService.start();

  Storage.get('dc').then(function (dcID) {
    if (dcID) {
      baseDcID = dcID;
    }
  });

  function telegramMeNotify (newValue) {
    if (telegramMeNotified !== newValue) {
      telegramMeNotified = newValue;
      TelegramMeWebService.setAuthorized(telegramMeNotified);
    }
  }

  function mtpSetUserAuth (dcID, userAuth) {
    Storage.set({
      dc: dcID,
      user_auth: angular.extend({dcID: dcID}, userAuth)
    });
    telegramMeNotify(true);

    baseDcID = dcID;
  }

  function mtpLogOut () {
    var storageKeys = [];
    for (var dcID = 1; dcID <= 5; dcID++) {
      storageKeys.push('dc' + dcID + '_auth_key');
    }
    return Storage.get.apply(Storage, storageKeys).then(function (storageResult) {
      var logoutPromises = [];
      for (var i = 0; i < storageResult.length; i++) {
        if (storageResult[i]) {
          logoutPromises.push(mtpInvokeApi('auth.logOut', {}, {dcID: i + 1}));
        }
      }
      return $q.all(logoutPromises).then(function () {
        Storage.remove('dc', 'user_auth');
        baseDcID = false;
        telegramMeNotify(false);
      }, function (error) {
        Storage.remove.apply(storageKeys);
        Storage.remove('dc', 'user_auth');
        baseDcID = false;
        error.handled = true;
        telegramMeNotify(false);
      });
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
      return qSync.when(cache[dcID]);
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
            error.stack = error.originalError && error.originalError.stack || error.stack || (new Error()).stack;
            setTimeout(function () {
              if (!error.handled) {
                if (error.code == 401) {
                  mtpLogOut()['finally'](function () {
                    if (location.protocol == 'http:' &&
                        !Config.Modes.http &&
                        Config.App.domains.indexOf(location.hostname) != -1) {
                      location.href = location.href.replace(/^http:/, 'https:');
                    } else {
                      location.hash = '/login';
                      AppRuntimeManager.reload();
                    }
                  });
                } else {
                  ErrorService.show({error: error});
                }
                error.handled = true;
              }
            }, 100);
          }
        },
        dcID,
        networkerPromise;

    var cachedNetworker;
    var stack = (new Error()).stack;
    if (!stack) {
      try {window.unexistingFunction();} catch (e) {
        stack = e.stack || '';
      }
    }
    var performRequest = function (networker) {
      return (cachedNetworker = networker).wrapApiCall(method, params, options).then(
        function (result) {
          deferred.resolve(result);
        },
        function (error) {
          console.error(dT(), 'Error', error.code, error.type, baseDcID, dcID);
          if (error.code == 401 && baseDcID == dcID) {
            Storage.remove('dc', 'user_auth');
            telegramMeNotify(false);
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
              }, rejectPromise);
            }, rejectPromise);
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
                }, rejectPromise);
              });
            }
          }
          else {
            rejectPromise(error);
          }
        });
    };

    if (dcID = (options.dcID || baseDcID)) {
      mtpGetNetworker(dcID, options).then(performRequest, rejectPromise);
    } else {
      Storage.get('dc').then(function (baseDcID) {
        mtpGetNetworker(dcID = baseDcID || 2, options).then(performRequest, rejectPromise);
      });
    }

    return deferred.promise;
  };

  function mtpGetUserID () {
    return Storage.get('user_auth').then(function (auth) {
      telegramMeNotify(auth && auth.id > 0 || false);
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
  var cachedSavePromises = {};
  var cachedDownloadPromises = {};
  var cachedDownloads = {};

  var downloadPulls = {};
  var downloadActives = {};

  function downloadRequest(dcID, cb, activeDelta) {
    if (downloadPulls[dcID] === undefined) {
      downloadPulls[dcID] = [];
      downloadActives[dcID] = 0
    }
    var downloadPull = downloadPulls[dcID];
    var deferred = $q.defer();
    downloadPull.push({cb: cb, deferred: deferred, activeDelta: activeDelta});
    setZeroTimeout(function () {
      downloadCheck(dcID);
    });

    return deferred.promise;
  };

  var index = 0;

  function downloadCheck(dcID) {
    var downloadPull = downloadPulls[dcID];
    var downloadLimit = dcID == 'upload' ? 11 : 5;

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
        return cachedDownloads[fileName] = blob;
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
      return cachedDownloads[fileName] = blob;
    }, function () {
      var downloadPromise = downloadRequest(location.dc_id, function () {
        var inputLocation = location;
        if (!inputLocation._ || inputLocation._ == 'fileLocation') {
          inputLocation = angular.extend({}, location, {_: 'inputFileLocation'});
        }
        // console.log('next small promise');
        return MtpApiManager.invokeApi('upload.getFile', {
          location: inputLocation,
          offset: 0,
          limit: 1024 * 1024
        }, {
          dcID: location.dc_id,
          fileDownload: true,
          createNetworker: true
        });
      });

      return fileStorage.getFileWriter(fileName, mimeType).then(function (fileWriter) {
        return downloadPromise.then(function (result) {
          return FileManager.write(fileWriter, result.bytes).then(function () {
            return cachedDownloads[fileName] = fileWriter.finalize();
          });
        });
      });
    });
  }

  function getDownloadedFile(location, size) {
    var fileStorage = getFileStorage(),
        fileName = getFileName(location);

    return fileStorage.getFile(fileName, size);
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
        return cachedPromise.then(function (blob) {
          return FileManager.copy(blob, toFileEntry);
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
          if (cacheFileWriter &&
              (!error || error.type != 'DOWNLOAD_CANCELED')) {
            cacheFileWriter.truncate(0);
          }
        };


    fileStorage.getFile(fileName, size).then(function (blob) {
      if (toFileEntry) {
        FileManager.copy(blob, toFileEntry).then(function () {
          deferred.resolve();
        }, errorHandler);
      } else {
        deferred.resolve(cachedDownloads[fileName] = blob);
      }
    }, function () {
      var fileWriterPromise = toFileEntry ? FileManager.getFileWriter(toFileEntry) : fileStorage.getFileWriter(fileName, mimeType);

      fileWriterPromise.then(function (fileWriter) {
        cacheFileWriter = fileWriter;
        var limit = 524288,
            offset,
            startOffset = 0,
            writeFilePromise = $q.when(),
            writeFileDeferred;
        if (fileWriter.length) {
          startOffset = fileWriter.length;
          if (startOffset >= size) {
            if (toFileEntry) {
              deferred.resolve();
            } else {
              deferred.resolve(cachedDownloads[fileName] = fileWriter.finalize());
            }
            return;
          }
          fileWriter.seek(startOffset);
          deferred.notify({done: startOffset, total: size});
        }
        for (offset = startOffset; offset < size; offset += limit) {
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
                singleInRequest: window.safari !== undefined,
                createNetworker: true
              });
            }, 2).then(function (result) {
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
                      deferred.resolve(cachedDownloads[fileName] = fileWriter.finalize());
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
    });

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
    var fileSize    = file.size,
        isBigFile   = fileSize >= 10485760,
        canceled    = false,
        resolved    = false,
        doneParts   = 0,
        partSize    = 262144, // 256 Kb
        activeDelta = 2;

    if (fileSize > 67108864) {
      partSize = 524288;
      activeDelta = 4;
    }
    else if (fileSize < 102400) {
      partSize = 32768;
      activeDelta = 1;
    }
    var totalParts = Math.ceil(fileSize / partSize);

    if (totalParts > 3000) {
      return $q.reject({type: 'FILE_TOO_BIG'});
    }

    var fileID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        deferred = $q.defer(),
        errorHandler = function (error) {
          // console.error('Up Error', error);
          deferred.reject(error);
          canceled = true;
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


    for (offset = 0; offset < fileSize; offset += partSize) {
      (function (offset, part) {
        downloadRequest('upload', function () {
          var uploadDeferred = $q.defer();

          var reader = new FileReader();
          var blob = file.slice(offset, offset + partSize);

          reader.onloadend = function (e) {
            if (canceled) {
              uploadDeferred.reject();
              return;
            }
            if (e.target.readyState != FileReader.DONE) {
              return;
            }
            MtpApiManager.invokeApi(isBigFile ? 'upload.saveBigFilePart' : 'upload.saveFilePart', {
              file_id: fileID,
              file_part: part,
              file_total_parts: totalParts,
              bytes: e.target.result
            }, {
              startMaxLength: partSize + 256,
              fileUpload: true,
              singleInRequest: true
            }).then(function (result) {
              doneParts++;
              uploadDeferred.resolve();
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

          return uploadDeferred.promise;
        }, activeDelta);
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
    getDownloadedFile: getDownloadedFile,
    downloadFile: downloadFile,
    downloadSmallFile: downloadSmallFile,
    saveSmallFile: saveSmallFile,
    uploadFile: uploadFile
  };
})

.service('MtpSingleInstanceService', function (_, $rootScope, $interval, Storage, AppRuntimeManager, IdleManager, ErrorService, MtpNetworkerFactory) {

  var instanceID = nextRandomInt(0xFFFFFFFF);
  var started = false;
  var masterInstance  = false;
  var startTime       = tsNow();
  var errorShowTime = 0;

  function start() {
    if (!started && !Config.Navigator.mobile && !Config.Modes.packed) {
      started = true;

      IdleManager.start();

      startTime = tsNow();
      $rootScope.$watch('idle.isIDLE', checkInstance);
      $interval(checkInstance, 5000);
      checkInstance();

      try {
        $($window).on('beforeunload', clearInstance);
      } catch (e) {};
    }
  }

  function clearInstance () {
    Storage.remove(masterInstance ? 'xt_instance' : 'xt_idle_instance');
  }

  function checkInstance() {
    var time = tsNow();
    var idle = $rootScope.idle && $rootScope.idle.isIDLE;
    var newInstance = {id: instanceID, idle: idle, time: time};

    Storage.get('xt_instance', 'xt_idle_instance').then(function (result) {
      var curInstance = result[0],
          idleInstance = result[1];

      if (!curInstance ||
          curInstance.time < time - 60000 ||
          curInstance.id == instanceID ||
          curInstance.idle ||
          !idle) {

        if (idleInstance) {
          if (idleInstance.id == instanceID) {
            Storage.remove('xt_idle_instance');
          }
          else if (idleInstance.time > time - 10000 &&
                   time > errorShowTime) {

            ErrorService.alert(
              _('error_modal_warning_title_raw'),
              _('error_modal_multiple_open_tabs_raw')
            );
            errorShowTime += tsNow() + 60000;
          }
        }
        Storage.set({xt_instance: newInstance});
        if (!masterInstance) {
          MtpNetworkerFactory.startAll();
        }
        masterInstance = true;
      } else {
        Storage.set({xt_idle_instance: newInstance});
        if (masterInstance) {
          MtpNetworkerFactory.stopAll();
        }
        masterInstance = false;

      }
    });
  }

  return {
    start: start
  }
})

