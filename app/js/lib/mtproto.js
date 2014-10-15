/*!
 * Webogram v0.3.2 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

angular.module('izhukov.mtproto', ['izhukov.utils'])

.factory('MtpDcConfigurator', function () {
  var dcOptions = Config.Modes.test
    ? [
      {id: 1, host: '173.240.5.253', port: 80},
      {id: 2, host: '149.154.167.40', port: 80},
      {id: 3, host: '174.140.142.5', port: 80}
    ]
    : [
      {id: 1, host: '173.240.5.1',   port: 80},
      {id: 2, host: '149.154.167.51', port: 80},
      {id: 3, host: '174.140.142.6', port: 80},
      {id: 4, host: '149.154.167.91', port: 80},
      {id: 5, host: '149.154.171.5',   port: 80}
    ];

  var chosenServers = {};

  function chooseServer(dcID) {
    if (chosenServers[dcID] === undefined) {
      var chosenServer = false,
          i, dcOption;
      for (i = 0; i < dcOptions.length; i++) {
        dcOption = dcOptions[i];
        if (dcOption.id == dcID) {
          chosenServer = dcOption.host + ':' + dcOption.port;
        }
      }
      chosenServers[dcID] = chosenServer;
    }

    return chosenServers[dcID];
  }

  return {
    chooseServer: chooseServer
  };
})

.factory('MtpRsaKeysManager', function () {

/**
*  Server public key, obtained from here: https://core.telegram.org/api/obtaining_api_id
*
* -----BEGIN RSA PUBLIC KEY-----
* MIIBCgKCAQEAwVACPi9w23mF3tBkdZz+zwrzKOaaQdr01vAbU4E1pvkfj4sqDsm6
* lyDONS789sVoD/xCS9Y0hkkC3gtL1tSfTlgCMOOul9lcixlEKzwKENj1Yz/s7daS
* an9tqw3bfUV/nqgbhGX81v/+7RFAEd+RwFnK7a+XYl9sluzHRyVVaTTveB2GazTw
* Efzk2DWgkBluml8OREmvfraX3bkHZJTKX4EQSjBbbdJ2ZXIsRrYOXfaA+xayEGB+
* 8hdlLmAjbCVfaigxX0CDqWeR1yFL9kwd9P0NsZRPsmoqVwMbMu7mStFai6aIhc3n
* Slv8kg9qv1m6XHVQY3PnEw+QQtqSIXklHwIDAQAB
* -----END RSA PUBLIC KEY-----
*/

  var publisKeysHex = [{
    modulus: 'c150023e2f70db7985ded064759cfecf0af328e69a41daf4d6f01b538135a6f91f8f8b2a0ec9ba9720ce352efcf6c5680ffc424bd634864902de0b4bd6d49f4e580230e3ae97d95c8b19442b3c0a10d8f5633fecedd6926a7f6dab0ddb7d457f9ea81b8465fcd6fffeed114011df91c059caedaf97625f6c96ecc74725556934ef781d866b34f011fce4d835a090196e9a5f0e4449af7eb697ddb9076494ca5f81104a305b6dd27665722c46b60e5df680fb16b210607ef217652e60236c255f6a28315f4083a96791d7214bf64c1df4fd0db1944fb26a2a57031b32eee64ad15a8ba68885cde74a5bfc920f6abf59ba5c75506373e7130f9042da922179251f',
    exponent: '010001'
  }];

  var publicKeysParsed = {};
  var prepared = false;

  function prepareRsaKeys () {
    if (prepared) {
      return;
    }

    for (var i = 0; i < publisKeysHex.length; i++) {
      var keyParsed = publisKeysHex[i];

      var RSAPublicKey = new TLSerialization();
      RSAPublicKey.storeBytes(bytesFromHex(keyParsed.modulus), 'n');
      RSAPublicKey.storeBytes(bytesFromHex(keyParsed.exponent), 'e');

      var buffer = RSAPublicKey.getBuffer();

      var fingerprintBytes = sha1Hash(buffer).slice(-8);
      fingerprintBytes.reverse();

      publicKeysParsed[bytesToHex(fingerprintBytes)] = {
        modulus: keyParsed.modulus,
        exponent: keyParsed.exponent
      };
    }

    prepared = true;
  };

  function selectRsaKeyByFingerPrint (fingerprints) {
    prepareRsaKeys();

    var fingerprintHex, foundKey, i;
    for (i = 0; i < fingerprints.length; i++) {
      fingerprintHex = bigStringInt(fingerprints[i]).toString(16);
      if (foundKey = publicKeysParsed[fingerprintHex]) {
        return angular.extend({fingerprint: fingerprints[i]}, foundKey);
      }
    }

    return false;
  };

  return {
    prepare: prepareRsaKeys,
    select: selectRsaKeyByFingerPrint
  };
})

.service('MtpSecureRandom', function () {
  return new SecureRandom();
})

.factory('MtpTimeManager', function (Storage) {
  var lastMessageID = [0, 0],
      timeOffset = 0;

  Storage.get('server_time_offset').then(function (to) {
    if (to) {
      timeOffset = to;
    }
  });

  function generateMessageID () {
    var timeTicks = tsNow(),
        timeSec   = Math.floor(timeTicks / 1000) + timeOffset,
        timeMSec  = timeTicks % 1000,
        random    = nextRandomInt(0xFFFF);

    var messageID = [timeSec, (timeMSec << 21) | (random << 3) | 4];
    if (lastMessageID[0] > messageID[0] ||
        lastMessageID[0] == messageID[0] && lastMessageID[1] >= messageID[1]) {

      messageID = [lastMessageID[0], lastMessageID[1] + 4];
    }

    lastMessageID = messageID;

    // console.log('generated msg id', messageID);

    return longFromInts(messageID[0], messageID[1]);
  };

  function applyServerTime (serverTime, localTime) {
    var newTimeOffset = serverTime - Math.floor((localTime || tsNow()) / 1000),
        changed = Math.abs(timeOffset - newTimeOffset) > 10;
    Storage.set({server_time_offset: newTimeOffset});

    lastMessageID = [0, 0];
    timeOffset = newTimeOffset;
    console.log(dT(), 'Apply server time', serverTime, localTime, newTimeOffset, changed);

    return changed;
  };

  return {
    generateID: generateMessageID,
    applyServerTime: applyServerTime,
  };
})

.factory('MtpAuthorizer', function (MtpDcConfigurator, MtpRsaKeysManager, MtpSecureRandom, MtpTimeManager, CryptoWorker, $http, $q, $timeout) {

  var chromeMatches = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/),
      chromeVersion = chromeMatches && parseFloat(chromeMatches[1]) || false;

  function mtpSendPlainRequest (dcID, requestBuffer) {
    var requestLength = requestBuffer.byteLength,
        requestArray  = new Int32Array(requestBuffer);

    var header = new TLSerialization();
    header.storeLongP(0, 0, 'auth_key_id'); // Auth key
    header.storeLong(MtpTimeManager.generateID(), 'msg_id'); // Msg_id
    header.storeInt(requestLength, 'request_length');

    var headerBuffer = header.getBuffer(),
        headerArray  = new Int32Array(headerBuffer),
        headerLength = headerBuffer.byteLength;

    var resultBuffer = new ArrayBuffer(headerLength + requestLength),
        resultArray  = new Int32Array(resultBuffer);

    resultArray.set(headerArray);
    resultArray.set(requestArray, headerArray.length);

    delete $http.defaults.headers.post['Content-Type'];
    delete $http.defaults.headers.common['Accept'];

    if (!('ArrayBufferView' in window) && (!chromeVersion || chromeVersion < 30)) {
      resultArray = resultArray.buffer;
    }

    var requestPromise;
    try {
      requestPromise =  $http.post('http://' + MtpDcConfigurator.chooseServer(dcID) + '/apiw1', resultArray, {
        responseType: 'arraybuffer',
        transformRequest: null
      });
    } catch (e) {
      requestPromise = $q.reject(e);
    }
    return requestPromise.then(
      function (result) {
        if (!result.data || !result.data.byteLength) {
          return $q.reject({code: 406, type: 'NETWORK_BAD_RESPONSE'});
        }

        try {

          var deserializer = new TLDeserialization(result.data, {mtproto: true});
          var auth_key_id = deserializer.fetchLong('auth_key_id');
          var msg_id      = deserializer.fetchLong('msg_id');
          var msg_len     = deserializer.fetchInt('msg_len');

        } catch (e) {
          return $q.reject({code: 406, type: 'NETWORK_BAD_RESPONSE', originalError: e});
        }

        rng_seed_time();

        return deserializer;
      },
      function (error) {
        if (!error.message && !error.type) {
          error = {code: 406, type: 'NETWORK_BAD_REQUEST', originalError: error};
        }
        return $q.reject(error);
      }
    );
  };

  function mtpSendReqPQ (auth) {
    var deferred = auth.deferred;

    var request = new TLSerialization({mtproto: true});

    request.storeMethod('req_pq', {nonce: auth.nonce});

    console.log(dT(), 'Send req_pq', bytesToHex(auth.nonce));
    mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (deserializer) {
      var response = deserializer.fetchObject('ResPQ');

      if (response._ != 'resPQ') {
        throw new Error('resPQ response invalid: ' + response._);
      }

      if (!bytesCmp (auth.nonce, response.nonce)) {
        throw new Error('resPQ nonce mismatch');
      }

      auth.serverNonce = response.server_nonce;
      auth.pq = response.pq;
      auth.fingerprints = response.server_public_key_fingerprints;

      console.log(dT(), 'Got ResPQ', bytesToHex(auth.serverNonce), bytesToHex(auth.pq), auth.fingerprints);

      auth.publicKey = MtpRsaKeysManager.select(auth.fingerprints);

      if (!auth.publicKey) {
        throw new Error('No public key found');
      }

      console.log(dT(), 'PQ factorization start', auth.pq);
      CryptoWorker.factorize(auth.pq).then(function (pAndQ) {
        auth.p = pAndQ[0];
        auth.q = pAndQ[1];
        console.log(dT(), 'PQ factorization done', pAndQ[2]);
        mtpSendReqDhParams(auth);
      }, function (error) {
        console.log('Worker error', error, error.stack);
        deferred.reject(error);
      });
    }, function (error) {
      console.log(dT(), 'req_pq error', error.message);
      deferred.reject(error);
    });

    $timeout(function () {
      MtpRsaKeysManager.prepare();
    });
  };

  function mtpSendReqDhParams (auth) {

    var deferred = auth.deferred;

    auth.newNonce = new Array(32);
    MtpSecureRandom.nextBytes(auth.newNonce);

    var data = new TLSerialization({mtproto: true});
    data.storeObject({
      _: 'p_q_inner_data',
      pq: auth.pq,
      p: auth.p,
      q: auth.q,
      nonce: auth.nonce,
      server_nonce: auth.serverNonce,
      new_nonce: auth.newNonce
    }, 'P_Q_inner_data', 'DECRYPTED_DATA');

    var dataWithHash = sha1Hash(data.getBuffer()).concat(data.getBytes());

    var request = new TLSerialization({mtproto: true});
    request.storeMethod('req_DH_params', {
      nonce: auth.nonce,
      server_nonce: auth.serverNonce,
      p: auth.p,
      q: auth.q,
      public_key_fingerprint: auth.publicKey.fingerprint,
      encrypted_data: rsaEncrypt(auth.publicKey, dataWithHash)
    });

    console.log(dT(), 'Send req_DH_params');
    mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (deserializer) {
      var response = deserializer.fetchObject('Server_DH_Params', 'RESPONSE');

      if (response._ != 'server_DH_params_fail' && response._ != 'server_DH_params_ok') {
        deferred.reject(new Error('Server_DH_Params response invalid: ' + response._));
        return false;
      }

      if (!bytesCmp (auth.nonce, response.nonce)) {
        deferred.reject(new Error('Server_DH_Params nonce mismatch'));
        return false;
      }

      if (!bytesCmp (auth.serverNonce, response.server_nonce)) {
        deferred.reject(new Error('Server_DH_Params server_nonce mismatch'));
        return false;
      }

      if (response._ == 'server_DH_params_fail') {
        var newNonceHash = sha1Hash(auth.newNonce).slice(-16)
        if (!bytesCmp (newNonceHash, response.new_nonce_hash)) {
          deferred.reject(new Error('server_DH_params_fail new_nonce_hash mismatch'));
          return false;
        }
        deferred.reject(new Error('server_DH_params_fail'));
        return false;
      }

      try {
        mtpDecryptServerDhDataAnswer(auth, response.encrypted_answer);
      } catch (e) {
        deferred.reject(e);
        return false;
      }

      mtpSendSetClientDhParams(auth);
    }, function (error) {
      deferred.reject(error);
    });
  };

  function mtpDecryptServerDhDataAnswer (auth, encryptedAnswer) {
    auth.localTime = tsNow();

    auth.tmpAesKey = sha1Hash(auth.newNonce.concat(auth.serverNonce)).concat(sha1Hash(auth.serverNonce.concat(auth.newNonce)).slice(0, 12));
    auth.tmpAesIv = sha1Hash(auth.serverNonce.concat(auth.newNonce)).slice(12).concat(sha1Hash([].concat(auth.newNonce, auth.newNonce)), auth.newNonce.slice(0, 4));

    var answerWithHash = aesDecrypt(encryptedAnswer, auth.tmpAesKey, auth.tmpAesIv);

    var hash = answerWithHash.slice(0, 20);
    var answerWithPadding = answerWithHash.slice(20);
    var buffer = bytesToArrayBuffer(answerWithPadding);

    var deserializer = new TLDeserialization(buffer, {mtproto: true});
    var response = deserializer.fetchObject('Server_DH_inner_data');

    if (response._ != 'server_DH_inner_data') {
      throw new Error('server_DH_inner_data response invalid: ' + constructor);
    }

    if (!bytesCmp (auth.nonce, response.nonce)) {
      throw new Error('server_DH_inner_data nonce mismatch');
    }

    if (!bytesCmp (auth.serverNonce, response.server_nonce)) {
      throw new Error('server_DH_inner_data serverNonce mismatch');
    }

    console.log(dT(), 'Done decrypting answer');
    auth.g          = response.g;
    auth.dhPrime    = response.dh_prime;
    auth.gA         = response.g_a;
    auth.serverTime = response.server_time;
    auth.retry      = 0;

    var offset = deserializer.getOffset();

    if (!bytesCmp(hash, sha1Hash(answerWithPadding.slice(0, offset)))) {
      throw new Error('server_DH_inner_data SHA1-hash mismatch');
    }

    MtpTimeManager.applyServerTime(auth.serverTime, auth.localTime);
  };

  function mtpSendSetClientDhParams(auth) {
    var deferred = auth.deferred,
        gBytes = bytesFromHex(auth.g.toString(16));

    auth.b = new Array(256);
    MtpSecureRandom.nextBytes(auth.b);

    CryptoWorker.modPow(gBytes, auth.b, auth.dhPrime).then(function (gB) {

      var data = new TLSerialization({mtproto: true});
      data.storeObject({
        _: 'client_DH_inner_data',
        nonce: auth.nonce,
        server_nonce: auth.serverNonce,
        retry_id: [0, auth.retry++],
        g_b: gB,
      }, 'Client_DH_Inner_Data');

      var dataWithHash = sha1Hash(data.getBuffer()).concat(data.getBytes());

      var encryptedData = aesEncrypt(dataWithHash, auth.tmpAesKey, auth.tmpAesIv);

      var request = new TLSerialization({mtproto: true});
      request.storeMethod('set_client_DH_params', {
        nonce: auth.nonce,
        server_nonce: auth.serverNonce,
        encrypted_data: encryptedData
      });

      console.log(dT(), 'Send set_client_DH_params');
      mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (deserializer) {
        var response = deserializer.fetchObject('Set_client_DH_params_answer');

        if (response._ != 'dh_gen_ok' && response._ != 'dh_gen_retry' && response._ != 'dh_gen_fail') {
          deferred.reject(new Error('Set_client_DH_params_answer response invalid: ' + response._));
          return false;
        }

        if (!bytesCmp (auth.nonce, response.nonce)) {
          deferred.reject(new Error('Set_client_DH_params_answer nonce mismatch'));
          return false
        }

        if (!bytesCmp (auth.serverNonce, response.server_nonce)) {
          deferred.reject(new Error('Set_client_DH_params_answer server_nonce mismatch'));
          return false;
        }

        CryptoWorker.modPow(auth.gA, auth.b, auth.dhPrime).then(function (authKey) {
          var authKeyHash = sha1Hash(authKey),
              authKeyAux  = authKeyHash.slice(0, 8),
              authKeyID   = authKeyHash.slice(-8);

          console.log(dT(), 'Got Set_client_DH_params_answer', response._);
          switch (response._) {
            case 'dh_gen_ok':
              var newNonceHash1 = sha1Hash(auth.newNonce.concat([1], authKeyAux)).slice(-16);

              if (!bytesCmp(newNonceHash1, response.new_nonce_hash1)) {
                deferred.reject(new Error('Set_client_DH_params_answer new_nonce_hash1 mismatch'));
                return false;
              }

              var serverSalt = bytesXor(auth.newNonce.slice(0, 8), auth.serverNonce.slice(0, 8));
              // console.log('Auth successfull!', authKeyID, authKey, serverSalt);

              auth.authKeyID = authKeyID;
              auth.authKey = authKey;
              auth.serverSalt = serverSalt;

              deferred.resolve(auth);
              break;

            case 'dh_gen_retry':
              var newNonceHash2 = sha1Hash(auth.newNonce.concat([2], authKeyAux)).slice(-16);
              if (!bytesCmp(newNonceHash2, response.new_nonce_hash2)) {
                deferred.reject(new Error('Set_client_DH_params_answer new_nonce_hash2 mismatch'));
                return false;
              }

              return mtpSendSetClientDhParams(auth);

            case 'dh_gen_fail':
              var newNonceHash3 = sha1Hash(auth.newNonce.concat([3], authKeyAux)).slice(-16);
              if (!bytesCmp(newNonceHash3, response.new_nonce_hash3)) {
                deferred.reject(new Error('Set_client_DH_params_answer new_nonce_hash3 mismatch'));
                return false;
              }

              deferred.reject(new Error('Set_client_DH_params_answer fail'));
              return false;
          }
        }, function (error) {
          deferred.reject(error);
        })
      }, function (error) {
        deferred.reject(error);
      });
    }, function (error) {
      deferred.reject(error);
    })
  };

  var cached = {};

  function mtpAuth (dcID) {
    if (cached[dcID] !== undefined) {
      return cached[dcID];
    }

    var nonce = [];
    for (var i = 0; i < 16; i++) {
      nonce.push(nextRandomInt(0xFF));
    }

    if (!MtpDcConfigurator.chooseServer(dcID)) {
      return $q.reject(new Error('No server found for dc ' + dcID));
    }

    var auth = {
      dcID: dcID,
      nonce: nonce,
      deferred: $q.defer()
    };

    $timeout(function () {
      mtpSendReqPQ(auth);
    });

    cached[dcID] = auth.deferred.promise;

    cached[dcID]['catch'](function () {
      delete cached[dcID];
    })

    return cached[dcID];
  };

  return {
    auth: mtpAuth
  };

})

.factory('MtpNetworkerFactory', function (MtpDcConfigurator, MtpTimeManager, MtpSecureRandom, Storage, CryptoWorker, $http, $q, $timeout, $interval, $rootScope) {

  var updatesProcessor,
      iii = 0,
      offline,
      offlineInited = false,
      chromeMatches = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/),
      chromeVersion = chromeMatches && parseFloat(chromeMatches[1]) || false;

  $rootScope.retryOnline = function () {
    $(document.body).trigger('online');
  }

  function MtpNetworker(dcID, authKey, serverSalt, options) {
    options = options || {};

    this.dcID = dcID;
    this.iii = iii++;

    this.authKey = authKey;
    this.authKeyID = sha1Hash(authKey).slice(-8);

    this.serverSalt = serverSalt;

    this.upload = options.fileUpload || options.fileDownload || false;

    this.updateSession();

    this.currentRequests = 0;
    this.checkConnectionPeriod = 0;

    this.sentMessages = {};
    this.serverMessages = [];
    this.clientMessages = [];

    this.pendingMessages = {};
    this.pendingAcks = [];
    this.pendingResends = [];
    this.connectionInited = false;

    this.pendingTimeouts = [];

    this.longPollInt = $interval(this.checkLongPoll.bind(this), 10000);
    this.checkLongPoll();

    if (!offlineInited) {
      offlineInited = true;
      $rootScope.offline = true;
      $rootScope.offlineConnecting = true;
    }

    if (Config.Navigator.mobile) {
      this.setupMobileSleep();
    }
  };

  MtpNetworker.prototype.updateSession = function () {
    this.seqNo = 0;
    this.sessionID = new Array(8);
    MtpSecureRandom.nextBytes(this.sessionID);

    if (false) {
      this.sessionID[0] = 0xAB;
      this.sessionID[1] = 0xCD;
    }
  };

  MtpNetworker.prototype.setupMobileSleep = function () {
    var self = this;
    $rootScope.$watch('idle.isIDLE', function (isIDLE) {
      if (isIDLE) {
        self.sleepAfter = tsNow() + 30000;
      } else {
        delete self.sleepAfter;
        self.checkLongPoll();
      }
    });

    $rootScope.$on('push_received', function () {
      // console.log(dT(), 'push recieved', self.sleepAfter);
      if (self.sleepAfter) {
        self.sleepAfter = tsNow() + 30000;
        self.checkLongPoll();
      }
    });
  };

  MtpNetworker.prototype.updateSentMessage = function (sentMessageID) {
    var sentMessage = this.sentMessages[sentMessageID];
    if (!sentMessage) {
      return false;
    }
    var self = this;
    if (sentMessage.container) {
      var newInner = [];
      angular.forEach(sentMessage.inner, function(innerSentMessageID){
        var innerSentMessage = self.updateSentMessage(innerSentMessageID);
        if (innerSentMessage) {
          newInner.push(innerSentMessage.msg_id);
        }
      });
      sentMessage.inner = newInner;
    }

    sentMessage.msg_id = MtpTimeManager.generateID();
    sentMessage.seq_no = this.generateSeqNo(
      sentMessage.notContentRelated ||
      sentMessage.container
    );
    this.sentMessages[sentMessage.msg_id] = sentMessage;
    delete self.sentMessages[sentMessageID];

    return sentMessage;
  };

  MtpNetworker.prototype.generateSeqNo = function (notContentRelated) {
    var seqNo = this.seqNo * 2;

    if (!notContentRelated) {
      seqNo++;
      this.seqNo++;
    }

    return seqNo;
  }

  MtpNetworker.prototype.wrapMtpCall = function (method, params, options) {
    var serializer = new TLSerialization({mtproto: true});

    serializer.storeMethod(method, params);

    var messageID = MtpTimeManager.generateID(),
        seqNo = this.generateSeqNo(),
        message = {
      msg_id: messageID,
      seq_no: seqNo,
      body: serializer.getBytes()
    };

    if (Config.Modes.debug) {
      console.log(dT(), 'MT call', method, params, messageID, seqNo);
    }

    return this.pushMessage(message, options);
  };

  MtpNetworker.prototype.wrapMtpMessage = function (object, options) {
    options = options || {};

    var serializer = new TLSerialization({mtproto: true});
    serializer.storeObject(object, 'Object');

    var messageID = MtpTimeManager.generateID(),
        seqNo = this.generateSeqNo(options.notContentRelated),
        message = {
      msg_id: messageID,
      seq_no: seqNo,
      body: serializer.getBytes()
    };

    if (Config.Modes.debug) {
      console.log(dT(), 'MT message', object, messageID, seqNo);
    }

    return this.pushMessage(message, options);
  };

  MtpNetworker.prototype.wrapApiCall = function (method, params, options) {
    var serializer = new TLSerialization(options);

    if (!this.connectionInited) {
      serializer.storeInt(0x1c900537, 'invokeWithLayer18');
      serializer.storeInt(0x69796de9, 'initConnection');
      serializer.storeInt(Config.App.id, 'api_id');
      serializer.storeString(navigator.userAgent || 'Unknown UserAgent', 'device_model');
      serializer.storeString(navigator.platform  || 'Unknown Platform', 'system_version');
      serializer.storeString(Config.App.version, 'app_version');
      serializer.storeString(navigator.language || 'en', 'lang_code');
    }

    if (options.afterMessageID) {
      serializer.storeInt(0xcb9f372d, 'invokeAfterMsg');
      serializer.storeLong(options.afterMessageID, 'msg_id');
    }

    options.resultType = serializer.storeMethod(method, params);

    var messageID = MtpTimeManager.generateID(),
        seqNo = this.generateSeqNo(),
        message = {
      msg_id: messageID,
      seq_no: seqNo,
      body: serializer.getBytes(),
      isAPI: true
    };

    if (Config.Modes.debug) {
      console.log(dT(), 'Api call', method, params, messageID, seqNo, options);
    } else {
      console.log(dT(), 'Api call', method);
    }

    return this.pushMessage(message, options);
  };

  MtpNetworker.prototype.checkLongPoll = function(force) {
    var isClean = this.cleanupSent();
    // console.log('Check lp', this.longPollPending, tsNow(), this.dcID, isClean);
    if (this.longPollPending && tsNow() < this.longPollPending || this.offline) {
      return false;
    }
    var self = this;
    Storage.get('dc').then(function (baseDcID) {
      if (isClean && (
                      baseDcID != self.dcID ||
                      self.upload ||
                      self.sleepAfter && tsNow() > self.sleepAfter
      )) {
        // console.warn(dT(), 'Send long-poll for DC is delayed', self.dcID, self.sleepAfter);
        return;
      }
      self.sendLongPoll();
    });
  };

  MtpNetworker.prototype.sendLongPoll = function() {
    var maxWait = 25000,
        self = this;

    this.longPollPending = tsNow() + maxWait;
    // console.log('Set lp', this.longPollPending, tsNow());

    this.wrapMtpCall('http_wait', {
      max_delay: 0,
      wait_after: 0,
      max_wait: maxWait
    }, {
      noResponse: true,
      longPoll: true
    }).then(function () {
      delete self.longPollPending;
      $timeout(self.checkLongPoll.bind(self), 0);
    }, function () {
      console.log('Long-poll failed');
    });

  };

  MtpNetworker.prototype.pushMessage = function(message, options) {
    var deferred = $q.defer();

    this.sentMessages[message.msg_id] = angular.extend(message, options || {}, {deferred: deferred});
    this.pendingMessages[message.msg_id] = 0;

    if (!options || !options.noShedule) {
      this.sheduleRequest();
    }
    if (angular.isObject(options)) {
      options.messageID = message.msg_id;
    }

    return deferred.promise;
  };

  MtpNetworker.prototype.pushResend = function(messageID, delay) {
    var value = delay ? tsNow() + delay : 0;
    var sentMessage = this.sentMessages[messageID];
    if (sentMessage.container) {
      for (var i = 0; i < sentMessage.inner.length; i++) {
        this.pendingMessages[sentMessage.inner[i]] = value;
      }
    } else {
      this.pendingMessages[messageID] = value;
    }

    // console.log('Resend due', messageID, this.pendingMessages);

    this.sheduleRequest(delay);
  };

  MtpNetworker.prototype.getMsgKeyIv = function (msgKey, isOut) {
    var authKey = this.authKey,
        x = isOut ? 0 : 8;

    var promises = {
      sha1a: CryptoWorker.sha1Hash(msgKey.concat(authKey.slice(x, x + 32))),
      sha1b: CryptoWorker.sha1Hash(authKey.slice(32 + x, 48 + x).concat(msgKey, authKey.slice(48 + x, 64 + x))),
      sha1c: CryptoWorker.sha1Hash(authKey.slice(64 + x, 96 + x).concat(msgKey)),
      sha1d: CryptoWorker.sha1Hash(msgKey.concat(authKey.slice(96 + x, 128 + x)))
    };

    return $q.all(promises).then(function (result) {
      var aesKey = result.sha1a.slice(0, 8).concat(result.sha1b.slice(8, 20), result.sha1c.slice(4, 16));
      var aesIv  = result.sha1a.slice(8, 20).concat(result.sha1b.slice(0, 8), result.sha1c.slice(16, 20), result.sha1d.slice(0, 8));

      return [aesKey, aesIv];
    });
  };

  MtpNetworker.prototype.checkConnection = function(event) {
    $rootScope.offlineConnecting = true;

    console.log(dT(), 'Check connection', event);
    $timeout.cancel(this.checkConnectionPromise);

    var serializer = new TLSerialization({mtproto: true}),
        pingID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)];

    serializer.storeMethod('ping', {ping_id: pingID});

    var pingMessage = {
      msg_id: MtpTimeManager.generateID(),
      seq_no: this.generateSeqNo(true),
      body: serializer.getBytes()
    };

    var self = this;
    this.sendEncryptedRequest(pingMessage).then(function (result) {
      delete $rootScope.offlineConnecting;
      self.toggleOffline(false);
    }, function () {
      console.log(dT(), 'Delay ', self.checkConnectionPeriod * 1000);
      self.checkConnectionPromise = $timeout(self.checkConnection.bind(self), parseInt(self.checkConnectionPeriod * 1000));
      self.checkConnectionPeriod = Math.min(60, self.checkConnectionPeriod * 1.5);
      $timeout(function () {
        delete $rootScope.offlineConnecting;
      }, 1000);
    })
  };

  MtpNetworker.prototype.toggleOffline = function(enabled) {
    // console.log('toggle ', enabled, this.dcID, this.iii);
    if (this.offline !== undefined && this.offline == enabled) {
      return false;
    }

    this.offline = enabled;
    $rootScope.offline = enabled;
    $rootScope.offlineConnecting = false;

    if (this.offline) {
      $timeout.cancel(this.nextReqPromise);
      delete this.nextReq;

      if (this.checkConnectionPeriod < 1.5) {
        this.checkConnectionPeriod = 0;
      }

      this.checkConnectionPromise = $timeout(this.checkConnection.bind(this), parseInt(this.checkConnectionPeriod * 1000));
      this.checkConnectionPeriod = Math.min(60, (1 + this.checkConnectionPeriod) * 1.5);

      this.onOnlineCb = this.checkConnection.bind(this);

      $(document.body).on('online', this.onOnlineCb);
    } else {
      delete this.longPollPending;
      this.checkLongPoll();
      this.sheduleRequest();

      if (this.onOnlineCb) {
        $(document.body).off('online', this.onOnlineCb);
      }
      $timeout.cancel(this.checkConnectionPromise);
    }

  };



  MtpNetworker.prototype.performSheduledRequest = function() {
    // console.trace('sheduled', this.dcID, this.iii);
    if (this.offline) {
      console.log(dT(), 'Cancel sheduled');
      return false;
    }
    delete this.nextReq;
    if (this.pendingAcks.length) {
      var ackMsgIDs = [];
      for (var i = 0; i < this.pendingAcks.length; i++) {
        ackMsgIDs.push(this.pendingAcks[i]);
      }
      // console.log('acking messages', ackMsgIDs);
      this.wrapMtpMessage({_: 'msgs_ack', msg_ids: ackMsgIDs}, {notContentRelated: true, noShedule: true});
    }

    if (this.pendingResends.length) {
      var resendMsgIDs = [],
          resendOpts = {noShedule: true, notContentRelated: true};
      for (var i = 0; i < this.pendingResends.length; i++) {
        resendMsgIDs.push(this.pendingResends[i]);
      }
      // console.log('resendReq messages', resendMsgIDs);
      this.wrapMtpMessage({_: 'msg_resend_req', msg_ids: resendMsgIDs}, resendOpts);
      this.lastResendReq = {req_msg_id: resendOpts.messageID, resend_msg_ids: resendMsgIDs};
    }

    var messages = [],
        message,
        messagesByteLen = 0,
        currentTime = tsNow(),
        hasApiCall = false,
        hasHttpWait = false,
        self = this;

    angular.forEach(this.pendingMessages, function (value, messageID) {
      if (!value || value >= currentTime) {
        if (message = self.sentMessages[messageID]) {
          messages.push(message);
          messagesByteLen += message.body.length + 32;
          if (message.isAPI) {
            hasApiCall = true;
          }
          else if (message.longPoll) {
            hasHttpWait = true;
          }
        } else {
          // console.log(message, messageID);
        }
        delete self.pendingMessages[messageID];
      }
    });

    if (hasApiCall && !hasHttpWait) {
      var serializer = new TLSerialization({mtproto: true});
      serializer.storeMethod('http_wait', {max_delay: 0, wait_after: 0, max_wait: 1000});
      messages.push({
        msg_id: MtpTimeManager.generateID(),
        seq_no: this.generateSeqNo(),
        body: serializer.getBytes()
      });
    }

    if (!messages.length) {
      // console.log('no sheduled messages');
      return;
    }

    var noResponseMsgs = [];

    if (messages.length > 1) {
      var container = new TLSerialization({mtproto: true, startMaxLength: messagesByteLen + 64});
      container.storeInt(0x73f1f8dc, 'CONTAINER[id]');
      container.storeInt(messages.length, 'CONTAINER[count]');
      var onloads = [];
      var innerMessages = [];
      for (var i = 0; i < messages.length; i++) {
        container.storeLong(messages[i].msg_id, 'CONTAINER[' + i + '][msg_id]');
        innerMessages.push(messages[i].msg_id);
        container.storeInt(messages[i].seq_no, 'CONTAINER[' + i + '][seq_no]');
        container.storeInt(messages[i].body.length, 'CONTAINER[' + i + '][bytes]');
        container.storeRawBytes(messages[i].body, 'CONTAINER[' + i + '][body]');
        if (messages[i].noResponse) {
          noResponseMsgs.push(messages[i].msg_id);
        }
      }

      var containerSentMessage = {
        msg_id: MtpTimeManager.generateID(),
        seq_no: this.generateSeqNo(true),
        container: true,
        inner: innerMessages
      }

      message = angular.extend({body: container.getBytes()}, containerSentMessage);

      this.sentMessages[message.msg_id] = containerSentMessage;

      if (Config.Modes.debug) {
        console.log(dT(), 'Container', innerMessages, message.msg_id, message.seq_no);
      }
    } else {
      if (message.noResponse) {
        noResponseMsgs.push(message.msg_id);
      }
      this.sentMessages[message.msg_id] = message;
    }

    this.pendingAcks = [];

    var self = this;
    this.sendEncryptedRequest(message).then(function (result) {
      self.toggleOffline(false);
      self.parseResponse(result.data).then(function (response) {
        if (Config.Modes.debug) {
          console.log(dT(), 'Server response', self.dcID, response);
        }

        self.processMessage(response.response, response.messageID, response.sessionID);

        angular.forEach(noResponseMsgs, function (msgID) {
          if (self.sentMessages[msgID]) {
            var deferred = self.sentMessages[msgID].deferred;
            delete self.sentMessages[msgID];
            deferred.resolve();
          }
        });

        self.checkLongPoll();

        this.checkConnectionPeriod = Math.max(1.1, Math.sqrt(this.checkConnectionPeriod));

      });
    }, function (error) {
      console.log('Encrypted request failed', error);

      if (message.container) {
        angular.forEach(message.inner, function (msgID) {
          self.pendingMessages[msgID] = 0;
        });
        delete self.sentMessages[message.msg_id];
      } else {
        self.pendingMessages[message.msg_id] = 0;
      }

      angular.forEach(noResponseMsgs, function (msgID) {
        if (self.sentMessages[msgID]) {
          var deferred = self.sentMessages[msgID].deferred;
          delete self.sentMessages[msgID];
          delete self.pendingMessages[msgID];
          deferred.reject();
        }
      });

      self.toggleOffline(true);
    });
  };

  MtpNetworker.prototype.getEncryptedMessage = function (bytes) {
    var self = this;

    return CryptoWorker.sha1Hash(bytes).then(function (bytesHash) {
      var msgKey = bytesHash.slice(-16);
      return self.getMsgKeyIv(msgKey, true).then(function (keyIv) {
        return CryptoWorker.aesEncrypt(bytes, keyIv[0], keyIv[1]).then(function (encryptedBytes) {
          return {
            bytes: encryptedBytes,
            msgKey: msgKey
          };
        })
      })
    })
  };

  MtpNetworker.prototype.getDecryptedMessage = function (msgKey, encryptedData) {
    return this.getMsgKeyIv(msgKey, false).then(function (keyIv) {
      return CryptoWorker.aesDecrypt(encryptedData, keyIv[0], keyIv[1]);
    });
  };

  MtpNetworker.prototype.sendEncryptedRequest = function (message) {
    var self = this;
    // console.log(dT(), 'Send encrypted'/*, message*/);
    // console.trace();
    var data = new TLSerialization({startMaxLength: message.body.length + 64});

    data.storeIntBytes(this.serverSalt, 64, 'salt');
    data.storeIntBytes(this.sessionID, 64, 'session_id');

    data.storeLong(message.msg_id, 'message_id');
    data.storeInt(message.seq_no, 'seq_no');

    data.storeInt(message.body.length, 'message_data_length');
    data.storeRawBytes(message.body, 'message_data');

    return this.getEncryptedMessage(data.getBytes()).then(function (encryptedResult) {
      // console.log(dT(), 'Got encrypted out message'/*, encryptedResult*/);
      var request = new TLSerialization({startMaxLength: encryptedResult.bytes.length + 256});
      request.storeIntBytes(self.authKeyID, 64, 'auth_key_id');
      request.storeIntBytes(encryptedResult.msgKey, 128, 'msg_key');
      request.storeRawBytes(encryptedResult.bytes, 'encrypted_data');

      delete $http.defaults.headers.post['Content-Type'];
      delete $http.defaults.headers.common['Accept'];

      var resultArray = request.getArray();
      if (!('ArrayBufferView' in window) && (!chromeVersion || chromeVersion < 30)) {
        resultArray = resultArray.buffer;
      }

      var requestPromise;
      try {
        requestPromise =  $http.post('http://' + MtpDcConfigurator.chooseServer(self.dcID) + '/apiw1', resultArray, {
          responseType: 'arraybuffer',
          transformRequest: null
        });
      } catch (e) {
        requestPromise = $q.reject(e);
      }
      return requestPromise.then(
        function (result) {
          if (!result.data || !result.data.byteLength) {
            return $q.reject({code: 406, type: 'NETWORK_BAD_RESPONSE'});
          }
          return result;
        },
        function (error) {
          if (!error.message && !error.type) {
            error = {code: 406, type: 'NETWORK_BAD_REQUEST'};
          }
          return $q.reject(error);
        }
      );
    });
  };

  MtpNetworker.prototype.parseResponse = function (responseBuffer) {
    // console.log(dT(), 'Start parsing response');
    var self = this;

    var deserializer = new TLDeserialization(responseBuffer);

    var authKeyID = deserializer.fetchIntBytes(64, 'auth_key_id');
    if (!bytesCmp(authKeyID, this.authKeyID)) {
      throw new Error('Invalid server auth_key_id: ' + bytesToHex(authKeyID));
    }
    var msgKey = deserializer.fetchIntBytes(128, 'msg_key');

    var dataLength = responseBuffer.byteLength - deserializer.getOffset();
    var encryptedData = deserializer.fetchRawBytes(dataLength, 'encrypted_data');

    return this.getDecryptedMessage(msgKey, encryptedData).then(function (dataWithPadding) {
      var buffer = bytesToArrayBuffer(dataWithPadding);

      var deserializer = new TLDeserialization(buffer, {mtproto: true});

      var salt = deserializer.fetchIntBytes(64, 'salt');
      var sessionID = deserializer.fetchIntBytes(64, 'session_id');
      var messageID = deserializer.fetchLong('message_id');

      var seqNo = deserializer.fetchInt('seq_no');

      var messageBody = deserializer.fetchRawBytes(false, 'message_data');

      var offset = deserializer.getOffset();

      return CryptoWorker.sha1Hash(dataWithPadding.slice(0, offset)).then(function (dataHashed) {
        if (!bytesCmp(msgKey, dataHashed.slice(-16))) {
          throw new Error('server msgKey mismatch');
        }

        var buffer = bytesToArrayBuffer(messageBody);
        var deserializerOptions = {
          mtproto: true,
          override: {
            mt_message: function (result, field) {
              result.msg_id = this.fetchLong(field + '[msg_id]');
              result.seqno = this.fetchInt(field + '[seqno]');
              result.bytes = this.fetchInt(field + '[bytes]');

              var offset = this.getOffset();

              try {
                result.body = this.fetchObject('Object', field + '[body]');
              } catch (e) {
                console.error(dT(), 'parse error', e.message, e.stack);
                result.body = {_: 'parse_error', error: e};
              }
              if (this.offset != offset + result.bytes) {
                console.warn(dT(), 'set offset', this.offset, offset, result.bytes);
                console.log(dT(), result);
                this.offset = offset + result.bytes;
              }
              // console.log(dT(), 'override message', result);
            },
            mt_rpc_result: function (result, field) {
              result.req_msg_id = this.fetchLong(field + '[req_msg_id]');

              var sentMessage = self.sentMessages[result.req_msg_id],
                  type = sentMessage && sentMessage.resultType || 'Object';

              result.result = this.fetchObject(type, field + '[result]');
              // console.log(dT(), 'override rpc_result', type, result);
            }
          }
        };
        var deserializer = new TLDeserialization(buffer, deserializerOptions);

        var response = deserializer.fetchObject('', 'INPUT');

        return {
          response: response,
          messageID: messageID,
          sessionID: sessionID,
          seqNo: seqNo
        };
      });
    });
  };

  MtpNetworker.prototype.applyServerSalt = function (newServerSalt) {
    var serverSalt = longToBytes(newServerSalt);

    var storeObj  = {};
    storeObj['dc' + this.dcID + '_server_salt'] = bytesToHex(serverSalt);
    Storage.set(storeObj);

    this.serverSalt = serverSalt;
    return true;
  };

  MtpNetworker.prototype.sheduleRequest = function (delay) {
    if (this.offline) {
      this.checkConnection('forced shedule');
    }
    var nextReq = tsNow() + delay;

    if (delay && this.nextReq && this.nextReq <= nextReq) {
      return false;
    }

    // console.log('shedule req', delay);
    // console.trace();

    $timeout.cancel(this.nextReqPromise);

    this.nextReqPromise = $timeout(this.performSheduledRequest.bind(this), delay || 0);
    this.nextReq = nextReq;
  };

  MtpNetworker.prototype.onSessionCreate = function (sessionID, messageID) {
    // console.log(dT(), 'New session created', bytesToHex(sessionID));
  };

  MtpNetworker.prototype.ackMessage = function (msgID) {
    // console.log('ack message', msgID);
    this.pendingAcks.push(msgID);
    this.sheduleRequest(30000);
  };

  MtpNetworker.prototype.reqResendMessage = function (msgID) {
    console.log(dT(), 'Req resend', msgID);
    this.pendingResends.push(msgID);
    this.sheduleRequest(100);
  };

  MtpNetworker.prototype.cleanupSent = function () {
    var self = this;
    var notEmpty = false;
    // console.log('clean start', this.dcID/*, this.sentMessages*/);
    angular.forEach(this.sentMessages, function(message, msgID) {
      // console.log('clean iter', msgID, message);
      if (message.notContentRelated && self.pendingMessages[msgID] === undefined) {
        // console.log('clean notContentRelated', msgID);
        delete self.sentMessages[msgID];
      }
      else if (message.container) {
        for (var i = 0; i < message.inner.length; i++) {
          if (self.sentMessages[message.inner[i]] !== undefined) {
            // console.log('clean failed, found', msgID, message.inner[i], self.sentMessages[message.inner[i]].seq_no);
            notEmpty = true;
            return;
          }
        }
        // console.log('clean container', msgID);
        delete self.sentMessages[msgID];
      } else {
        notEmpty = true;
      }
    });

    return !notEmpty;
  };


  MtpNetworker.prototype.processMessageAck = function (messageID) {
    var sentMessage = this.sentMessages[messageID];
    if (sentMessage && !sentMessage.acked) {
      delete sentMessage.body;
      sentMessage.acked = true;

      return true;
    }

    return false;
  };

  MtpNetworker.prototype.processError = function (rawError) {
    var matches = (rawError.error_message || '').match(/^([A-Z_0-9]+\b)(: (.+))?/) || [];
    rawError.error_code = uintToInt(rawError.error_code);

    return  {
      code: !rawError.error_code || rawError.error_code <= 0 ? 500 : rawError.error_code,
      type: matches[1] || 'UNKNOWN',
      description: matches[3] || ('CODE#' + rawError.error_code + ' ' + rawError.error_message),
      originalError: rawError
    };
  };


  MtpNetworker.prototype.processMessage = function (message, messageID, sessionID) {
    // console.log('process message', message, messageID, sessionID);
    switch (message._) {
      case 'msg_container':
        var len = message.messages.length;
        for (var i = 0; i < len; i++) {
          this.processMessage(message.messages[i], messageID, sessionID);
        }
        break;

      case 'bad_server_salt':
        console.log(dT(), 'Bad server salt', message);
        var sentMessage = this.sentMessages[message.bad_msg_id];
        if (!sentMessage || sentMessage.seq_no != message.bad_msg_seqno) {
          console.log(message.bad_msg_id, message.bad_msg_seqno);
          throw new Error('Bad server salt for invalid message');
        }

        this.applyServerSalt(message.new_server_salt);
        this.pushResend(message.bad_msg_id);
        this.ackMessage(messageID);
        break;

      case 'bad_msg_notification':
        console.log(dT(), 'Bad msg notification', message);
        var sentMessage = this.sentMessages[message.bad_msg_id];
        if (!sentMessage || sentMessage.seq_no != message.bad_msg_seqno) {
          console.log(message.bad_msg_id, message.bad_msg_seqno);
          throw new Error('Bad msg notification for invalid message');
        }

        if (message.error_code == 16 || message.error_code == 17) {
          if (MtpTimeManager.applyServerTime(
            bigStringInt(messageID).shiftRight(32).toString(10)
          )) {
            console.log(dT(), 'Update session');
            this.updateSession();
          }
          var badMessage = this.updateSentMessage(message.bad_msg_id);
          this.pushResend(badMessage.msg_id);
          this.ackMessage(messageID);
        }
        break;

      case 'message':
        this.serverMessages.push(message.msg_id);
        this.processMessage(message.body, message.msg_id, sessionID);
        break;

      case 'new_session_created':
        this.ackMessage(messageID);

        this.processMessageAck(message.first_msg_id);
        this.applyServerSalt(message.server_salt);
        this.onSessionCreate(sessionID, messageID);
        break;

      case 'msgs_ack':
        for (var i = 0; i < message.msg_ids.length; i++) {
          this.processMessageAck(message.msg_ids[i]);
        }
        break;

      case 'msg_detailed_info':
        if (!this.sentMessages[message.msg_id]) {
          this.ackMessage(message.answer_msg_id);
          break;
        }
      case 'msg_new_detailed_info':
        // this.ackMessage(message.answer_msg_id);
        this.reqResendMessage(message.answer_msg_id);
        break;

      case 'msgs_state_info':
        this.ackMessage(message.answer_msg_id);
        if (this.lastResendReq && this.lastResendReq.req_msg_id == message.req_msg_id && this.pendingResends.length) {
          var i, badMsgID, pos;
          for (i = 0; i < this.lastResendReq.resend_msg_ids.length; i++) {
            badMsgID = this.lastResendReq.resend_msg_ids[i];
            pos = this.pendingResends.indexOf(badMsgID);
            if (pos != -1) {
              this.pendingResends.splice(pos, 1);
            }
          }
        }
        break;

      case 'rpc_result':
        this.ackMessage(messageID);

        var sentMessageID = message.req_msg_id,
            sentMessage = this.sentMessages[sentMessageID];

        this.processMessageAck(sentMessageID);
        if (sentMessage) {
          var deferred = sentMessage.deferred;
          if (message.result._ == 'rpc_error') {
            var error = this.processError(message.result);
            console.log(dT(), 'Rpc error', error)
            if (deferred) {
              deferred.reject(error)
            }
          } else {
            if (deferred) {
              if (Config.Modes.debug) {
                console.log(dT(), 'Rpc response', message.result);
              } else {
                var dRes = message.result._;
                if (!dRes) {
                  if (message.result.length > 5) {
                    dRes = '[..' + message.result.length + '..]';
                  } else {
                    dRes = message.result;
                  }
                }
                console.log(dT(), 'Rpc response', dRes);
              }
              sentMessage.deferred.resolve(message.result);
            }
            if (sentMessage.isAPI) {
              this.connectionInited = true;
            }
          }

          delete this.sentMessages[sentMessageID];
        }
        break;

      default:
        this.ackMessage(messageID);

        // console.log('Update', message);
        if (updatesProcessor) {
          updatesProcessor(message);
        }
        break;

    }
  };

  return {
    getNetworker: function (dcID, authKey, serverSalt, options) {
      return new MtpNetworker(dcID, authKey, serverSalt, options);
    },
    setUpdatesProcessor: function (callback) {
      updatesProcessor = callback;
    }
  };

})
