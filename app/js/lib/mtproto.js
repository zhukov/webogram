/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

angular.module('izhukov.mtproto', ['izhukov.utils'])

  .factory('MtpDcConfigurator', function () {
    var sslSubdomains = ['pluto', 'venus', 'aurora', 'vesta', 'flora']

    var dcOptions = Config.Modes.test
      ? [
        {id: 1, host: '149.154.175.10',  port: 80},
        {id: 2, host: '149.154.167.40',  port: 80},
        {id: 3, host: '149.154.175.117', port: 80}
      ]
      : [
        {id: 1, host: '149.154.175.50',  port: 80},
        {id: 2, host: '149.154.167.51',  port: 80},
        {id: 3, host: '149.154.175.100', port: 80},
        {id: 4, host: '149.154.167.91',  port: 80},
        {id: 5, host: '149.154.171.5',   port: 80}
      ]

    var chosenServers = {}

    function chooseServer (dcID, upload) {
      if (chosenServers[dcID] === undefined) {
        var chosenServer = false,
          i, dcOption

        if (Config.Modes.ssl || !Config.Modes.http) {
          var subdomain = sslSubdomains[dcID - 1] + (upload ? '-1' : '')
          var path = Config.Modes.test ? 'apiw_test1' : 'apiw1'
          chosenServer = 'https://' + subdomain + '.web.telegram.org/' + path
          return chosenServer
        }

        for (i = 0; i < dcOptions.length; i++) {
          dcOption = dcOptions[i]
          if (dcOption.id == dcID) {
            chosenServer = 'http://' + dcOption.host + (dcOption.port != 80 ? ':' + dcOption.port : '') + '/apiw1'
            break
          }
        }
        chosenServers[dcID] = chosenServer
      }

      return chosenServers[dcID]
    }

    return {
      chooseServer: chooseServer
    }
  })

  .factory('MtpRsaKeysManager', function () {

    /**
    *  Server public key, obtained from here: https://core.telegram.org/api/obtaining_api_id
    * 
    * 
    *  -----BEGIN RSA PUBLIC KEY-----
    *  MIIBCgKCAQEAwVACPi9w23mF3tBkdZz+zwrzKOaaQdr01vAbU4E1pvkfj4sqDsm6
    *  lyDONS789sVoD/xCS9Y0hkkC3gtL1tSfTlgCMOOul9lcixlEKzwKENj1Yz/s7daS
    *  an9tqw3bfUV/nqgbhGX81v/+7RFAEd+RwFnK7a+XYl9sluzHRyVVaTTveB2GazTw
    *  Efzk2DWgkBluml8OREmvfraX3bkHZJTKX4EQSjBbbdJ2ZXIsRrYOXfaA+xayEGB+
    *  8hdlLmAjbCVfaigxX0CDqWeR1yFL9kwd9P0NsZRPsmoqVwMbMu7mStFai6aIhc3n
    *  Slv8kg9qv1m6XHVQY3PnEw+QQtqSIXklHwIDAQAB
    *  -----END RSA PUBLIC KEY-----
    *  
    *  -----BEGIN PUBLIC KEY-----
    *  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAruw2yP/BCcsJliRoW5eB
    *  VBVle9dtjJw+OYED160Wybum9SXtBBLXriwt4rROd9csv0t0OHCaTmRqBcQ0J8fx
    *  hN6/cpR1GWgOZRUAiQxoMnlt0R93LCX/j1dnVa/gVbCjdSxpbrfY2g2L4frzjJvd
    *  l84Kd9ORYjDEAyFnEA7dD556OptgLQQ2e2iVNq8NZLYTzLp5YpOdO1doK+ttrltg
    *  gTCy5SrKeLoCPPbOgGsdxJxyz5KKcZnSLj16yE5HvJQn0CNpRdENvRUXe6tBP78O
    *  39oJ8BTHp9oIjd6XWXAsp2CvK45Ol8wFXGF710w9lwCGNbmNxNYhtIkdqfsEcwR5
    *  JwIDAQAB
    *  -----END PUBLIC KEY-----
    *  
    *  -----BEGIN PUBLIC KEY-----
    *  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvfLHfYH2r9R70w8prHbl
    *  Wt/nDkh+XkgpflqQVcnAfSuTtO05lNPspQmL8Y2XjVT4t8cT6xAkdgfmmvnvRPOO
    *  KPi0OfJXoRVylFzAQG/j83u5K3kRLbae7fLccVhKZhY46lvsueI1hQdLgNV9n1cQ
    *  3TDS2pQOCtovG4eDl9wacrXOJTG2990VjgnIKNA0UMoP+KF03qzryqIt3oTvZq03
    *  DyWdGK+AZjgBLaDKSnC6qD2cFY81UryRWOab8zKkWAnhw2kFpcqhI0jdV5QaSCEx
    *  vnsjVaX0Y1N0870931/5Jb9ICe4nweZ9kSDF/gip3kWLG0o8XQpChDfyvsqB9OLV
    *  /wIDAQAB
    *  -----END PUBLIC KEY-----
    *  
    *  -----BEGIN PUBLIC KEY-----
    *  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs/ditzm+mPND6xkhzwFI
    *  z6J/968CtkcSE/7Z2qAJiXbmZ3UDJPGrzqTDHkO30R8VeRM/Kz2f4nR05GIFiITl
    *  4bEjvpy7xqRDspJcCFIOcyXm8abVDhF+th6knSU0yLtNKuQVP6voMrnt9MV1X92L
    *  GZQLgdHZbPQz0Z5qIpaKhdyA8DEvWWvSUwwc+yi1/gGaybwlzZwqXYoPOhwMebzK
    *  Uk0xW14htcJrRrq+PXXQbRzTMynseCoPIoke0dtCodbA3qQxQovE16q9zz4Otv2k
    *  4j63cz53J+mhkVWAeWxVGI0lltJmWtEYK6er8VqqWot3nqmWMXogrgRLggv/Nbbo
    *  oQIDAQAB
    *  -----END PUBLIC KEY-----
    *  
    *  -----BEGIN PUBLIC KEY-----
    *  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvmpxVY7ld/8DAjz6F6q0
    *  5shjg8/4p6047bn6/m8yPy1RBsvIyvuDuGnP/RzPEhzXQ9UJ5Ynmh2XJZgHoE9xb
    *  nfxL5BXHplJhMtADXKM9bWB11PU1Eioc3+AXBB8QiNFBn2XI5UkO5hPhbb9mJpjA
    *  9Uhw8EdfqJP8QetVsI/xrCEbwEXe0xvifRLJbY08/Gp66KpQvy7g8w7VB8wlgePe
    *  xW3pT13Ap6vuC+mQuJPyiHvSxjEKHgqePji9NP3tJUFQjcECqcm0yV7/2d0t/pbC
    *  m+ZH1sadZspQCEPPrtbkQBlvHb4OLiIWPGHKSMeRFvp3IWcmdJqXahxLCUS1Eh6M
    *  AQIDAQAB
    *  -----END PUBLIC KEY-----
    *
    * Bytes can be got via 
    * $ openssl rsa -pubin -in key.pub -text -noout
    */

    var publisKeysHex = [
      {
        modulus: 'c150023e2f70db7985ded064759cfecf0af328e69a41daf4d6f01b538135a6f91f8f8b2a0ec9ba9720ce352efcf6c5680ffc424bd634864902de0b4bd6d49f4e580230e3ae97d95c8b19442b3c0a10d8f5633fecedd6926a7f6dab0ddb7d457f9ea81b8465fcd6fffeed114011df91c059caedaf97625f6c96ecc74725556934ef781d866b34f011fce4d835a090196e9a5f0e4449af7eb697ddb9076494ca5f81104a305b6dd27665722c46b60e5df680fb16b210607ef217652e60236c255f6a28315f4083a96791d7214bf64c1df4fd0db1944fb26a2a57031b32eee64ad15a8ba68885cde74a5bfc920f6abf59ba5c75506373e7130f9042da922179251f',
        exponent: '010001'
      },
      {
        modulus: 'aeec36c8ffc109cb099624685b97815415657bd76d8c9c3e398103d7ad16c9bba6f525ed0412d7ae2c2de2b44e77d72cbf4b7438709a4e646a05c43427c7f184debf72947519680e651500890c6832796dd11f772c25ff8f576755afe055b0a3752c696eb7d8da0d8be1faf38c9bdd97ce0a77d3916230c4032167100edd0f9e7a3a9b602d04367b689536af0d64b613ccba7962939d3b57682beb6dae5b608130b2e52aca78ba023cf6ce806b1dc49c72cf928a7199d22e3d7ac84e47bc9427d0236945d10dbd15177bab413fbf0edfda09f014c7a7da088dde9759702ca760af2b8e4e97cc055c617bd74c3d97008635b98dc4d621b4891da9fb0473047927',
        exponent: '010001'
      },
      {
        modulus: 'bdf2c77d81f6afd47bd30f29ac76e55adfe70e487e5e48297e5a9055c9c07d2b93b4ed3994d3eca5098bf18d978d54f8b7c713eb10247607e69af9ef44f38e28f8b439f257a11572945cc0406fe3f37bb92b79112db69eedf2dc71584a661638ea5becb9e23585074b80d57d9f5710dd30d2da940e0ada2f1b878397dc1a72b5ce2531b6f7dd158e09c828d03450ca0ff8a174deacebcaa22dde84ef66ad370f259d18af806638012da0ca4a70baa83d9c158f3552bc9158e69bf332a45809e1c36905a5caa12348dd57941a482131be7b2355a5f4635374f3bd3ddf5ff925bf4809ee27c1e67d9120c5fe08a9de458b1b4a3c5d0a428437f2beca81f4e2d5ff',
        exponent: '010001'
      },
      {
        modulus: 'b3f762b739be98f343eb1921cf0148cfa27ff7af02b6471213fed9daa0098976e667750324f1abcea4c31e43b7d11f1579133f2b3d9fe27474e462058884e5e1b123be9cbbc6a443b2925c08520e7325e6f1a6d50e117eb61ea49d2534c8bb4d2ae4153fabe832b9edf4c5755fdd8b19940b81d1d96cf433d19e6a22968a85dc80f0312f596bd2530c1cfb28b5fe019ac9bc25cd9c2a5d8a0f3a1c0c79bcca524d315b5e21b5c26b46babe3d75d06d1cd33329ec782a0f22891ed1db42a1d6c0dea431428bc4d7aabdcf3e0eb6fda4e23eb7733e7727e9a1915580796c55188d2596d2665ad1182ba7abf15aaa5a8b779ea996317a20ae044b820bff35b6e8a1',
        exponent: '010001'
      },
      {
        modulus: 'be6a71558ee577ff03023cfa17aab4e6c86383cff8a7ad38edb9fafe6f323f2d5106cbc8cafb83b869cffd1ccf121cd743d509e589e68765c96601e813dc5b9dfc4be415c7a6526132d0035ca33d6d6075d4f535122a1cdfe017041f1088d1419f65c8e5490ee613e16dbf662698c0f54870f0475fa893fc41eb55b08ff1ac211bc045ded31be27d12c96d8d3cfc6a7ae8aa50bf2ee0f30ed507cc2581e3dec56de94f5dc0a7abee0be990b893f2887bd2c6310a1e0a9e3e38bd34fded2541508dc102a9c9b4c95effd9dd2dfe96c29be647d6c69d66ca500843cfaed6e440196f1dbe0e2e22163c61ca48c79116fa77216726749a976a1c4b0944b5121e8c01',
        exponent: '010001'
      }
    ]

    var publicKeysParsed = {}
    var prepared = false

    function prepareRsaKeys () {
      if (prepared) {
        return
      }

      for (var i = 0; i < publisKeysHex.length; i++) {
        var keyParsed = publisKeysHex[i]

        var RSAPublicKey = new TLSerialization()
        RSAPublicKey.storeBytes(bytesFromHex(keyParsed.modulus), 'n')
        RSAPublicKey.storeBytes(bytesFromHex(keyParsed.exponent), 'e')

        var buffer = RSAPublicKey.getBuffer()

        var fingerprintBytes = sha1BytesSync(buffer).slice(-8)
        fingerprintBytes.reverse()

        publicKeysParsed[bytesToHex(fingerprintBytes)] = {
          modulus: keyParsed.modulus,
          exponent: keyParsed.exponent
        }
      }

      prepared = true
    }

    function selectRsaKeyByFingerPrint (fingerprints) {
      prepareRsaKeys()

      var fingerprintHex, foundKey, i
      for (i = 0; i < fingerprints.length; i++) {
        fingerprintHex = bigStringInt(fingerprints[i]).toString(16)
        if (foundKey = publicKeysParsed[fingerprintHex]) {
          return angular.extend({fingerprint: fingerprints[i]}, foundKey)
        }
      }

      return false
    }

    return {
      prepare: prepareRsaKeys,
      select: selectRsaKeyByFingerPrint
    }
  })

  .service('MtpSecureRandom', function ($window) {
    $($window).on('click keydown', rng_seed_time)
    return new SecureRandom()
  })

  .factory('MtpTimeManager', function (Storage) {
    var lastMessageID = [0, 0]
    var timeOffset = 0

    Storage.get('server_time_offset').then(function (to) {
      if (to) {
        timeOffset = to
      }
    })

    function generateMessageID () {
      var timeTicks = tsNow(),
        timeSec = Math.floor(timeTicks / 1000) + timeOffset,
        timeMSec = timeTicks % 1000,
        random = nextRandomInt(0xFFFF)

      var messageID = [timeSec, (timeMSec << 21) | (random << 3) | 4]
      if (lastMessageID[0] > messageID[0] ||
        lastMessageID[0] == messageID[0] && lastMessageID[1] >= messageID[1]) {
        messageID = [lastMessageID[0], lastMessageID[1] + 4]
      }

      lastMessageID = messageID

      // console.log('generated msg id', messageID, timeOffset)

      return longFromInts(messageID[0], messageID[1])
    }

    function applyServerTime (serverTime, localTime) {
      var newTimeOffset = serverTime - Math.floor((localTime || tsNow()) / 1000)
      var changed = Math.abs(timeOffset - newTimeOffset) > 10
      Storage.set({server_time_offset: newTimeOffset})

      lastMessageID = [0, 0]
      timeOffset = newTimeOffset
      console.log(dT(), 'Apply server time', serverTime, localTime, newTimeOffset, changed)

      return changed
    }

    return {
      generateID: generateMessageID,
      applyServerTime: applyServerTime
    }
  })

  .factory('MtpAuthorizer', function (MtpDcConfigurator, MtpRsaKeysManager, MtpSecureRandom, MtpTimeManager, CryptoWorker, $http, $q, $timeout) {
    var chromeMatches = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/)
    var chromeVersion = chromeMatches && parseFloat(chromeMatches[1]) || false
    var xhrSendBuffer = !('ArrayBufferView' in window) && (chromeVersion > 0 && chromeVersion < 30)

    delete $http.defaults.headers.post['Content-Type']
    delete $http.defaults.headers.common['Accept']

    function mtpSendPlainRequest (dcID, requestBuffer) {
      var requestLength = requestBuffer.byteLength,
        requestArray = new Int32Array(requestBuffer)

      var header = new TLSerialization()
      header.storeLongP(0, 0, 'auth_key_id') // Auth key
      header.storeLong(MtpTimeManager.generateID(), 'msg_id') // Msg_id
      header.storeInt(requestLength, 'request_length')

      var headerBuffer = header.getBuffer(),
        headerArray = new Int32Array(headerBuffer)
      var headerLength = headerBuffer.byteLength

      var resultBuffer = new ArrayBuffer(headerLength + requestLength),
        resultArray = new Int32Array(resultBuffer)

      resultArray.set(headerArray)
      resultArray.set(requestArray, headerArray.length)

      var requestData = xhrSendBuffer ? resultBuffer : resultArray,
        requestPromise
      var url = MtpDcConfigurator.chooseServer(dcID)
      var baseError = {code: 406, type: 'NETWORK_BAD_RESPONSE', url: url}
      try {
        requestPromise = $http.post(url, requestData, {
          responseType: 'arraybuffer',
          transformRequest: null
        })
      } catch (e) {
        requestPromise = $q.reject(angular.extend(baseError, {originalError: e}))
      }
      return requestPromise.then(
        function (result) {
          if (!result.data || !result.data.byteLength) {
            return $q.reject(baseError)
          }

          try {
            var deserializer = new TLDeserialization(result.data, {mtproto: true})
            var auth_key_id = deserializer.fetchLong('auth_key_id')
            var msg_id = deserializer.fetchLong('msg_id')
            var msg_len = deserializer.fetchInt('msg_len')
          } catch (e) {
            return $q.reject(angular.extend(baseError, {originalError: e}))
          }

          return deserializer
        },
        function (error) {
          if (!error.message && !error.type) {
            error = angular.extend(baseError, {originalError: error})
          }
          return $q.reject(error)
        }
      )
    }

    function mtpSendReqPQ (auth) {
      var deferred = auth.deferred

      var request = new TLSerialization({mtproto: true})

      request.storeMethod('req_pq', {nonce: auth.nonce})

      console.log(dT(), 'Send req_pq', bytesToHex(auth.nonce))
      mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (deserializer) {
        var response = deserializer.fetchObject('ResPQ')

        if (response._ != 'resPQ') {
          throw new Error('[MT] resPQ response invalid: ' + response._)
        }

        if (!bytesCmp(auth.nonce, response.nonce)) {
          throw new Error('[MT] resPQ nonce mismatch')
        }

        auth.serverNonce = response.server_nonce
        auth.pq = response.pq
        auth.fingerprints = response.server_public_key_fingerprints

        console.log(dT(), 'Got ResPQ', bytesToHex(auth.serverNonce), bytesToHex(auth.pq), auth.fingerprints)

        auth.publicKey = MtpRsaKeysManager.select(auth.fingerprints)

        if (!auth.publicKey) {
          throw new Error('[MT] No public key found')
        }

        console.log(dT(), 'PQ factorization start', auth.pq)
        CryptoWorker.factorize(auth.pq).then(function (pAndQ) {
          auth.p = pAndQ[0]
          auth.q = pAndQ[1]
          console.log(dT(), 'PQ factorization done', pAndQ[2])
          mtpSendReqDhParams(auth)
        }, function (error) {
          console.log('Worker error', error, error.stack)
          deferred.reject(error)
        })
      }, function (error) {
        console.error(dT(), 'req_pq error', error.message)
        deferred.reject(error)
      })

      $timeout(function () {
        MtpRsaKeysManager.prepare()
      })
    }

    function mtpSendReqDhParams (auth) {
      var deferred = auth.deferred

      auth.newNonce = new Array(32)
      MtpSecureRandom.nextBytes(auth.newNonce)

      var data = new TLSerialization({mtproto: true})
      data.storeObject({
        _: 'p_q_inner_data',
        pq: auth.pq,
        p: auth.p,
        q: auth.q,
        nonce: auth.nonce,
        server_nonce: auth.serverNonce,
        new_nonce: auth.newNonce
      }, 'P_Q_inner_data', 'DECRYPTED_DATA')

      var dataWithHash = sha1BytesSync(data.getBuffer()).concat(data.getBytes())

      var request = new TLSerialization({mtproto: true})
      request.storeMethod('req_DH_params', {
        nonce: auth.nonce,
        server_nonce: auth.serverNonce,
        p: auth.p,
        q: auth.q,
        public_key_fingerprint: auth.publicKey.fingerprint,
        encrypted_data: rsaEncrypt(auth.publicKey, dataWithHash)
      })

      console.log(dT(), 'Send req_DH_params')
      mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (deserializer) {
        var response = deserializer.fetchObject('Server_DH_Params', 'RESPONSE')

        if (response._ != 'server_DH_params_fail' && response._ != 'server_DH_params_ok') {
          deferred.reject(new Error('[MT] Server_DH_Params response invalid: ' + response._))
          return false
        }

        if (!bytesCmp(auth.nonce, response.nonce)) {
          deferred.reject(new Error('[MT] Server_DH_Params nonce mismatch'))
          return false
        }

        if (!bytesCmp(auth.serverNonce, response.server_nonce)) {
          deferred.reject(new Error('[MT] Server_DH_Params server_nonce mismatch'))
          return false
        }

        if (response._ == 'server_DH_params_fail') {
          var newNonceHash = sha1BytesSync(auth.newNonce).slice(-16)
          if (!bytesCmp(newNonceHash, response.new_nonce_hash)) {
            deferred.reject(new Error('[MT] server_DH_params_fail new_nonce_hash mismatch'))
            return false
          }
          deferred.reject(new Error('[MT] server_DH_params_fail'))
          return false
        }

        try {
          mtpDecryptServerDhDataAnswer(auth, response.encrypted_answer)
        } catch (e) {
          deferred.reject(e)
          return false
        }

        mtpSendSetClientDhParams(auth)
      }, function (error) {
        deferred.reject(error)
      })
    }

    function mtpDecryptServerDhDataAnswer (auth, encryptedAnswer) {
      auth.localTime = tsNow()

      auth.tmpAesKey = sha1BytesSync(auth.newNonce.concat(auth.serverNonce)).concat(sha1BytesSync(auth.serverNonce.concat(auth.newNonce)).slice(0, 12))
      auth.tmpAesIv = sha1BytesSync(auth.serverNonce.concat(auth.newNonce)).slice(12).concat(sha1BytesSync([].concat(auth.newNonce, auth.newNonce)), auth.newNonce.slice(0, 4))

      var answerWithHash = aesDecryptSync(encryptedAnswer, auth.tmpAesKey, auth.tmpAesIv)

      var hash = answerWithHash.slice(0, 20)
      var answerWithPadding = answerWithHash.slice(20)
      var buffer = bytesToArrayBuffer(answerWithPadding)

      var deserializer = new TLDeserialization(buffer, {mtproto: true})
      var response = deserializer.fetchObject('Server_DH_inner_data')

      if (response._ != 'server_DH_inner_data') {
        throw new Error('[MT] server_DH_inner_data response invalid: ' + constructor)
      }

      if (!bytesCmp(auth.nonce, response.nonce)) {
        throw new Error('[MT] server_DH_inner_data nonce mismatch')
      }

      if (!bytesCmp(auth.serverNonce, response.server_nonce)) {
        throw new Error('[MT] server_DH_inner_data serverNonce mismatch')
      }

      console.log(dT(), 'Done decrypting answer')
      auth.g = response.g
      auth.dhPrime = response.dh_prime
      auth.gA = response.g_a
      auth.serverTime = response.server_time
      auth.retry = 0

      mtpVerifyDhParams(auth.g, auth.dhPrime, auth.gA)

      var offset = deserializer.getOffset()

      if (!bytesCmp(hash, sha1BytesSync(answerWithPadding.slice(0, offset)))) {
        throw new Error('[MT] server_DH_inner_data SHA1-hash mismatch')
      }

      MtpTimeManager.applyServerTime(auth.serverTime, auth.localTime)
    }

    function mtpVerifyDhParams(g, dhPrime, gA) {
      console.log(dT(), 'Verifying DH params')
      var dhPrimeHex = bytesToHex(dhPrime)
      if (g != 3 ||
          dhPrimeHex !== 'c71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c3720fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f642477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5b') {
        // The verified value is from https://core.telegram.org/mtproto/security_guidelines
        throw new Error('[MT] DH params are not verified: unknown dhPrime')
      }
      console.log(dT(), 'dhPrime cmp OK')

      var gABigInt = new BigInteger(bytesToHex(gA), 16)
      var dhPrimeBigInt = new BigInteger(dhPrimeHex, 16)

      if (gABigInt.compareTo(BigInteger.ONE) <= 0) {
        throw new Error('[MT] DH params are not verified: gA <= 1')
      }

      if (gABigInt.compareTo(dhPrimeBigInt.subtract(BigInteger.ONE)) >= 0) {
        throw new Error('[MT] DH params are not verified: gA >= dhPrime - 1')
      }
      console.log(dT(), '1 < gA < dhPrime-1 OK')


      var two = new BigInteger(null)
      two.fromInt(2)
      var twoPow = two.pow(2048 - 64)

      if (gABigInt.compareTo(twoPow) < 0) {
        throw new Error('[MT] DH params are not verified: gA < 2^{2048-64}')
      }
      if (gABigInt.compareTo(dhPrimeBigInt.subtract(twoPow)) >= 0) {
        throw new Error('[MT] DH params are not verified: gA > dhPrime - 2^{2048-64}')
      }
      console.log(dT(), '2^{2048-64} < gA < dhPrime-2^{2048-64} OK')

      return true
    }

    function mtpSendSetClientDhParams (auth) {
      var deferred = auth.deferred
      var gBytes = bytesFromHex(auth.g.toString(16))

      auth.b = new Array(256)
      MtpSecureRandom.nextBytes(auth.b)

      CryptoWorker.modPow(gBytes, auth.b, auth.dhPrime).then(function (gB) {
        var data = new TLSerialization({mtproto: true})
        data.storeObject({
          _: 'client_DH_inner_data',
          nonce: auth.nonce,
          server_nonce: auth.serverNonce,
          retry_id: [0, auth.retry++],
          g_b: gB
        }, 'Client_DH_Inner_Data')

        var dataWithHash = sha1BytesSync(data.getBuffer()).concat(data.getBytes())

        var encryptedData = aesEncryptSync(dataWithHash, auth.tmpAesKey, auth.tmpAesIv)

        var request = new TLSerialization({mtproto: true})
        request.storeMethod('set_client_DH_params', {
          nonce: auth.nonce,
          server_nonce: auth.serverNonce,
          encrypted_data: encryptedData
        })

        console.log(dT(), 'Send set_client_DH_params')
        mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (deserializer) {
          var response = deserializer.fetchObject('Set_client_DH_params_answer')

          if (response._ != 'dh_gen_ok' && response._ != 'dh_gen_retry' && response._ != 'dh_gen_fail') {
            deferred.reject(new Error('[MT] Set_client_DH_params_answer response invalid: ' + response._))
            return false
          }

          if (!bytesCmp(auth.nonce, response.nonce)) {
            deferred.reject(new Error('[MT] Set_client_DH_params_answer nonce mismatch'))
            return false
          }

          if (!bytesCmp(auth.serverNonce, response.server_nonce)) {
            deferred.reject(new Error('[MT] Set_client_DH_params_answer server_nonce mismatch'))
            return false
          }

          CryptoWorker.modPow(auth.gA, auth.b, auth.dhPrime).then(function (authKey) {
            var authKeyHash = sha1BytesSync(authKey),
              authKeyAux = authKeyHash.slice(0, 8),
              authKeyID = authKeyHash.slice(-8)

            console.log(dT(), 'Got Set_client_DH_params_answer', response._)
            switch (response._) {
              case 'dh_gen_ok':
                var newNonceHash1 = sha1BytesSync(auth.newNonce.concat([1], authKeyAux)).slice(-16)

                if (!bytesCmp(newNonceHash1, response.new_nonce_hash1)) {
                  deferred.reject(new Error('[MT] Set_client_DH_params_answer new_nonce_hash1 mismatch'))
                  return false
                }

                var serverSalt = bytesXor(auth.newNonce.slice(0, 8), auth.serverNonce.slice(0, 8))
                // console.log('Auth successfull!', authKeyID, authKey, serverSalt)

                auth.authKeyID = authKeyID
                auth.authKey = authKey
                auth.serverSalt = serverSalt

                deferred.resolve(auth)
                break

              case 'dh_gen_retry':
                var newNonceHash2 = sha1BytesSync(auth.newNonce.concat([2], authKeyAux)).slice(-16)
                if (!bytesCmp(newNonceHash2, response.new_nonce_hash2)) {
                  deferred.reject(new Error('[MT] Set_client_DH_params_answer new_nonce_hash2 mismatch'))
                  return false
                }

                return mtpSendSetClientDhParams(auth)

              case 'dh_gen_fail':
                var newNonceHash3 = sha1BytesSync(auth.newNonce.concat([3], authKeyAux)).slice(-16)
                if (!bytesCmp(newNonceHash3, response.new_nonce_hash3)) {
                  deferred.reject(new Error('[MT] Set_client_DH_params_answer new_nonce_hash3 mismatch'))
                  return false
                }

                deferred.reject(new Error('[MT] Set_client_DH_params_answer fail'))
                return false
            }
          }, function (error) {
            deferred.reject(error)
          })
        }, function (error) {
          deferred.reject(error)
        })
      }, function (error) {
        deferred.reject(error)
      })
    }

    var cached = {}

    function mtpAuth (dcID) {
      if (cached[dcID] !== undefined) {
        return cached[dcID]
      }

      var nonce = []
      for (var i = 0; i < 16; i++) {
        nonce.push(nextRandomInt(0xFF))
      }

      if (!MtpDcConfigurator.chooseServer(dcID)) {
        return $q.reject(new Error('[MT] No server found for dc ' + dcID))
      }

      var auth = {
        dcID: dcID,
        nonce: nonce,
        deferred: $q.defer()
      }

      $timeout(function () {
        mtpSendReqPQ(auth)
      })

      cached[dcID] = auth.deferred.promise

      cached[dcID]['catch'](function () {
        delete cached[dcID]
      })

      return cached[dcID]
    }

    return {
      auth: mtpAuth
    }
  })

  .factory('MtpNetworkerFactory', function (MtpDcConfigurator, MtpTimeManager, MtpSecureRandom, Storage, CryptoWorker, AppRuntimeManager, $http, $q, $timeout, $interval, $rootScope) {
    var updatesProcessor
    var iii = 0,
      offline
    var offlineInited = false
    var akStopped = false
    var chromeMatches = navigator.userAgent.match(/Chrome\/(\d+(\.\d+)?)/)
    var chromeVersion = chromeMatches && parseFloat(chromeMatches[1]) || false
    var xhrSendBuffer = !('ArrayBufferView' in window) && (chromeVersion > 0 && chromeVersion < 30)

    delete $http.defaults.headers.post['Content-Type']
    delete $http.defaults.headers.common['Accept']

    $rootScope.retryOnline = function () {
      $(document.body).trigger('online')
    }

    function MtpNetworker (dcID, authKey, serverSalt, options) {
      options = options || {}

      this.dcID = dcID

      this.authKey = authKey
      this.authKeyUint8 = convertToUint8Array(authKey)
      this.authKeyID = sha1BytesSync(authKey).slice(-8)

      this.serverSalt = serverSalt

      this.upload = options.fileUpload || options.fileDownload || false

      this.updateSession()

      this.lastServerMessages = []

      this.checkConnectionPeriod = 0

      this.sentMessages = {}

      this.pendingMessages = {}
      this.pendingAcks = []
      this.pendingResends = []
      this.connectionInited = false


      this.longPollInt = $interval(this.checkLongPoll.bind(this), 10000)
      this.checkLongPoll()

      if (!offlineInited) {
        offlineInited = true
        $rootScope.offline = true
        $rootScope.offlineConnecting = true
      }

      if (Config.Navigator.mobile) {
        this.setupMobileSleep()
      }
    }

    MtpNetworker.prototype.updateSession = function () {
      this.seqNo = 0
      this.prevSessionID = this.sessionID
      this.sessionID = new Array(8)
      MtpSecureRandom.nextBytes(this.sessionID)
    }

    MtpNetworker.prototype.setupMobileSleep = function () {
      var self = this
      $rootScope.$watch('idle.isIDLE', function (isIDLE) {
        if (isIDLE) {
          self.sleepAfter = tsNow() + 30000
        } else {
          delete self.sleepAfter
          self.checkLongPoll()
        }
      })

      $rootScope.$on('push_received', function () {
        // console.log(dT(), 'push recieved', self.sleepAfter)
        if (self.sleepAfter) {
          self.sleepAfter = tsNow() + 30000
          self.checkLongPoll()
        }
      })
    }

    MtpNetworker.prototype.updateSentMessage = function (sentMessageID) {
      var sentMessage = this.sentMessages[sentMessageID]
      if (!sentMessage) {
        return false
      }
      var self = this
      if (sentMessage.container) {
        var newInner = []
        angular.forEach(sentMessage.inner, function (innerSentMessageID) {
          var innerSentMessage = self.updateSentMessage(innerSentMessageID)
          if (innerSentMessage) {
            newInner.push(innerSentMessage.msg_id)
          }
        })
        sentMessage.inner = newInner
      }

      sentMessage.msg_id = MtpTimeManager.generateID()
      sentMessage.seq_no = this.generateSeqNo(
        sentMessage.notContentRelated ||
        sentMessage.container
      )
      this.sentMessages[sentMessage.msg_id] = sentMessage
      delete self.sentMessages[sentMessageID]

      return sentMessage
    }

    MtpNetworker.prototype.generateSeqNo = function (notContentRelated) {
      var seqNo = this.seqNo * 2

      if (!notContentRelated) {
        seqNo++
        this.seqNo++
      }

      return seqNo
    }

    MtpNetworker.prototype.wrapMtpCall = function (method, params, options) {
      var serializer = new TLSerialization({mtproto: true})

      serializer.storeMethod(method, params)

      var messageID = MtpTimeManager.generateID()
      var seqNo = this.generateSeqNo()
      var message = {
        msg_id: messageID,
        seq_no: seqNo,
        body: serializer.getBytes()
      }

      if (Config.Modes.debug) {
        console.log(dT(), 'MT call', method, params, messageID, seqNo)
      }

      return this.pushMessage(message, options)
    }

    MtpNetworker.prototype.wrapMtpMessage = function (object, options) {
      options = options || {}

      var serializer = new TLSerialization({mtproto: true})
      serializer.storeObject(object, 'Object')

      var messageID = MtpTimeManager.generateID()
      var seqNo = this.generateSeqNo(options.notContentRelated)
      var message = {
        msg_id: messageID,
        seq_no: seqNo,
        body: serializer.getBytes()
      }

      if (Config.Modes.debug) {
        console.log(dT(), 'MT message', object, messageID, seqNo)
      }

      return this.pushMessage(message, options)
    }

    MtpNetworker.prototype.wrapApiCall = function (method, params, options) {
      var serializer = new TLSerialization(options)

      if (!this.connectionInited) {
        serializer.storeInt(0xda9b0d0d, 'invokeWithLayer')
        serializer.storeInt(Config.Schema.API.layer, 'layer')
        serializer.storeInt(0xc7481da6, 'initConnection')
        serializer.storeInt(Config.App.id, 'api_id')
        serializer.storeString(navigator.userAgent || 'Unknown UserAgent', 'device_model')
        serializer.storeString(navigator.platform || 'Unknown Platform', 'system_version')
        serializer.storeString(Config.App.version, 'app_version')
        serializer.storeString(navigator.language || 'en', 'system_lang_code')
        serializer.storeString('', 'lang_pack')
        serializer.storeString(navigator.language || 'en', 'lang_code')
      }

      if (options.afterMessageID) {
        serializer.storeInt(0xcb9f372d, 'invokeAfterMsg')
        serializer.storeLong(options.afterMessageID, 'msg_id')
      }

      options.resultType = serializer.storeMethod(method, params)

      var messageID = MtpTimeManager.generateID()
      var seqNo = this.generateSeqNo()
      var message = {
        msg_id: messageID,
        seq_no: seqNo,
        body: serializer.getBytes(true),
        isAPI: true
      }

      if (Config.Modes.debug) {
        console.log(dT(), 'Api call', method, params, messageID, seqNo, options)
      } else {
        console.log(dT(), 'Api call', method)
      }

      return this.pushMessage(message, options)
    }

    MtpNetworker.prototype.checkLongPoll = function (force) {
      var isClean = this.cleanupSent()
      // console.log('Check lp', this.longPollPending, tsNow(), this.dcID, isClean)
      if (this.longPollPending && tsNow() < this.longPollPending ||
          this.offline ||
          akStopped) {
        return false
      }
      var self = this
      Storage.get('dc').then(function (baseDcID) {
        if (isClean && (
          baseDcID != self.dcID ||
          self.upload ||
          self.sleepAfter && tsNow() > self.sleepAfter
          )) {
          // console.warn(dT(), 'Send long-poll for DC is delayed', self.dcID, self.sleepAfter)
          return
        }
        self.sendLongPoll()
      })
    }

    MtpNetworker.prototype.sendLongPoll = function () {
      var maxWait = 25000
      var self = this

      this.longPollPending = tsNow() + maxWait
      // console.log('Set lp', this.longPollPending, tsNow())

      this.wrapMtpCall('http_wait', {
        max_delay: 500,
        wait_after: 150,
        max_wait: maxWait
      }, {
        noResponse: true,
        longPoll: true
      }).then(function () {
        delete self.longPollPending
        setZeroTimeout(self.checkLongPoll.bind(self))
      }, function (error) {
        console.log('Long-poll failed', error)
      })
    }

    MtpNetworker.prototype.pushMessage = function (message, options) {
      var deferred = $q.defer()

      this.sentMessages[message.msg_id] = angular.extend(message, options || {}, {deferred: deferred})
      this.pendingMessages[message.msg_id] = 0

      if (!options || !options.noShedule) {
        this.sheduleRequest()
      }
      if (angular.isObject(options)) {
        options.messageID = message.msg_id
      }

      return deferred.promise
    }

    MtpNetworker.prototype.pushResend = function (messageID, delay) {
      var value = delay ? tsNow() + delay : 0
      var sentMessage = this.sentMessages[messageID]
      if (sentMessage.container) {
        for (var i = 0; i < sentMessage.inner.length; i++) {
          this.pendingMessages[sentMessage.inner[i]] = value
        }
      } else {
        this.pendingMessages[messageID] = value
      }

      // console.log('Resend due', messageID, this.pendingMessages)

      this.sheduleRequest(delay)
    }

    MtpNetworker.prototype.getMsgKey = function (dataWithPadding, isOut) {
      var authKey = this.authKeyUint8
      var x = isOut ? 0 : 8
      var msgKeyLargePlain = bufferConcat(authKey.subarray(88 + x, 88 + x + 32), dataWithPadding)
      return CryptoWorker.sha256Hash(msgKeyLargePlain).then(function (msgKeyLarge) {
        var msgKey = new Uint8Array(msgKeyLarge).subarray(8, 24)
        return msgKey
      })
    }

    MtpNetworker.prototype.getAesKeyIv = function (msgKey, isOut) {
      var authKey = this.authKeyUint8
      var x = isOut ? 0 : 8
      var sha2aText = new Uint8Array(52)
      var sha2bText = new Uint8Array(52)
      var promises = {}

      sha2aText.set(msgKey, 0)
      sha2aText.set(authKey.subarray(x, x + 36), 16)
      promises.sha2a = CryptoWorker.sha256Hash(sha2aText)

      sha2bText.set(authKey.subarray(40 + x, 40 + x + 36), 0)
      sha2bText.set(msgKey, 36)
      promises.sha2b = CryptoWorker.sha256Hash(sha2bText)

      return $q.all(promises).then(function (result) {
        var aesKey = new Uint8Array(32)
        var aesIv = new Uint8Array(32)
        var sha2a = new Uint8Array(result.sha2a)
        var sha2b = new Uint8Array(result.sha2b)

        aesKey.set(sha2a.subarray(0, 8))
        aesKey.set(sha2b.subarray(8, 24), 8)
        aesKey.set(sha2a.subarray(24, 32), 24)

        aesIv.set(sha2b.subarray(0, 8))
        aesIv.set(sha2a.subarray(8, 24), 8)
        aesIv.set(sha2b.subarray(24, 32), 24)

        return [aesKey, aesIv]
      })
    }

    MtpNetworker.prototype.checkConnection = function (event) {
      $rootScope.offlineConnecting = true

      console.log(dT(), 'Check connection', event)
      $timeout.cancel(this.checkConnectionPromise)

      var serializer = new TLSerialization({mtproto: true})
      var pingID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)]

      serializer.storeMethod('ping', {ping_id: pingID})

      var pingMessage = {
        msg_id: MtpTimeManager.generateID(),
        seq_no: this.generateSeqNo(true),
        body: serializer.getBytes()
      }

      var self = this
      this.sendEncryptedRequest(pingMessage, {timeout: 15000}).then(function (result) {
        delete $rootScope.offlineConnecting
        self.toggleOffline(false)
      }, function () {
        console.log(dT(), 'Delay ', self.checkConnectionPeriod * 1000)
        self.checkConnectionPromise = $timeout(self.checkConnection.bind(self), parseInt(self.checkConnectionPeriod * 1000))
        self.checkConnectionPeriod = Math.min(60, self.checkConnectionPeriod * 1.5)
        $timeout(function () {
          delete $rootScope.offlineConnecting
        }, 1000)
      })
    }

    MtpNetworker.prototype.toggleOffline = function (enabled) {
      // console.log('toggle ', enabled, this.dcID, this.iii)
      if (this.offline !== undefined && this.offline == enabled) {
        return false
      }

      this.offline = enabled
      $rootScope.offline = enabled
      $rootScope.offlineConnecting = false

      if (this.offline) {
        $timeout.cancel(this.nextReqPromise)
        delete this.nextReq

        if (this.checkConnectionPeriod < 1.5) {
          this.checkConnectionPeriod = 0
        }

        this.checkConnectionPromise = $timeout(this.checkConnection.bind(this), parseInt(this.checkConnectionPeriod * 1000))
        this.checkConnectionPeriod = Math.min(30, (1 + this.checkConnectionPeriod) * 1.5)

        this.onOnlineCb = this.checkConnection.bind(this)

        $(document.body).on('online focus', this.onOnlineCb)
      } else {
        delete this.longPollPending
        this.checkLongPoll()
        this.sheduleRequest()

        if (this.onOnlineCb) {
          $(document.body).off('online focus', this.onOnlineCb)
        }
        $timeout.cancel(this.checkConnectionPromise)
      }
    }

    MtpNetworker.prototype.performSheduledRequest = function () {
      // console.log(dT(), 'sheduled', this.dcID, this.iii)
      if (this.offline || akStopped) {
        console.log(dT(), 'Cancel sheduled')
        return false
      }
      delete this.nextReq
      if (this.pendingAcks.length) {
        var ackMsgIDs = []
        for (var i = 0; i < this.pendingAcks.length; i++) {
          ackMsgIDs.push(this.pendingAcks[i])
        }
        // console.log('acking messages', ackMsgIDs)
        this.wrapMtpMessage({_: 'msgs_ack', msg_ids: ackMsgIDs}, {notContentRelated: true, noShedule: true})
      }

      if (this.pendingResends.length) {
        var resendMsgIDs = []
        var resendOpts = {noShedule: true, notContentRelated: true}
        for (var i = 0; i < this.pendingResends.length; i++) {
          resendMsgIDs.push(this.pendingResends[i])
        }
        // console.log('resendReq messages', resendMsgIDs)
        this.wrapMtpMessage({_: 'msg_resend_req', msg_ids: resendMsgIDs}, resendOpts)
        this.lastResendReq = {req_msg_id: resendOpts.messageID, resend_msg_ids: resendMsgIDs}
      }

      var messages = [],
        message
      var messagesByteLen = 0
      var currentTime = tsNow()
      var hasApiCall = false
      var hasHttpWait = false
      var lengthOverflow = false
      var singlesCount = 0
      var self = this

      angular.forEach(this.pendingMessages, function (value, messageID) {
        if (!value || value >= currentTime) {
          if (message = self.sentMessages[messageID]) {
            var messageByteLength = (message.body.byteLength || message.body.length) + 32
            if (!message.notContentRelated &&
              lengthOverflow) {
              return
            }
            if (!message.notContentRelated &&
              messagesByteLen &&
              messagesByteLen + messageByteLength > 655360) { // 640 Kb
              lengthOverflow = true
              return
            }
            if (message.singleInRequest) {
              singlesCount++
              if (singlesCount > 1) {
                return
              }
            }
            messages.push(message)
            messagesByteLen += messageByteLength
            if (message.isAPI) {
              hasApiCall = true
            }
            else if (message.longPoll) {
              hasHttpWait = true
            }
          } else {
            // console.log(message, messageID)
          }
          delete self.pendingMessages[messageID]
        }
      })

      if (hasApiCall && !hasHttpWait) {
        var serializer = new TLSerialization({mtproto: true})
        serializer.storeMethod('http_wait', {
          max_delay: 500,
          wait_after: 150,
          max_wait: 3000
        })
        messages.push({
          msg_id: MtpTimeManager.generateID(),
          seq_no: this.generateSeqNo(),
          body: serializer.getBytes()
        })
      }

      if (!messages.length) {
        // console.log('no sheduled messages')
        return
      }

      var noResponseMsgs = []

      if (messages.length > 1) {
        var container = new TLSerialization({mtproto: true, startMaxLength: messagesByteLen + 64})
        container.storeInt(0x73f1f8dc, 'CONTAINER[id]')
        container.storeInt(messages.length, 'CONTAINER[count]')
        var onloads = []
        var innerMessages = []
        for (var i = 0; i < messages.length; i++) {
          container.storeLong(messages[i].msg_id, 'CONTAINER[' + i + '][msg_id]')
          innerMessages.push(messages[i].msg_id)
          container.storeInt(messages[i].seq_no, 'CONTAINER[' + i + '][seq_no]')
          container.storeInt(messages[i].body.length, 'CONTAINER[' + i + '][bytes]')
          container.storeRawBytes(messages[i].body, 'CONTAINER[' + i + '][body]')
          if (messages[i].noResponse) {
            noResponseMsgs.push(messages[i].msg_id)
          }
        }

        var containerSentMessage = {
          msg_id: MtpTimeManager.generateID(),
          seq_no: this.generateSeqNo(true),
          container: true,
          inner: innerMessages
        }

        message = angular.extend({body: container.getBytes(true)}, containerSentMessage)

        this.sentMessages[message.msg_id] = containerSentMessage

        if (Config.Modes.debug) {
          console.log(dT(), 'Container', innerMessages, message.msg_id, message.seq_no)
        }
      } else {
        if (message.noResponse) {
          noResponseMsgs.push(message.msg_id)
        }
        this.sentMessages[message.msg_id] = message
      }

      this.pendingAcks = []

      this.sendEncryptedRequest(message).then(function (result) {
        self.toggleOffline(false)
        // console.log('parse for', message)
        self.parseResponse(result.data).then(function (response) {
          if (Config.Modes.debug) {
            console.log(dT(), 'Server response', self.dcID, response)
          }

          self.processMessage(response.response, response.messageID, response.sessionID)

          angular.forEach(noResponseMsgs, function (msgID) {
            if (self.sentMessages[msgID]) {
              var deferred = self.sentMessages[msgID].deferred
              delete self.sentMessages[msgID]
              deferred.resolve()
            }
          })

          self.checkLongPoll()

          this.checkConnectionPeriod = Math.max(1.1, Math.sqrt(this.checkConnectionPeriod))
        })
      }, function (error) {
        console.error('Encrypted request failed', error)

        if (message.container) {
          angular.forEach(message.inner, function (msgID) {
            self.pendingMessages[msgID] = 0
          })
          delete self.sentMessages[message.msg_id]
        } else {
          self.pendingMessages[message.msg_id] = 0
        }

        angular.forEach(noResponseMsgs, function (msgID) {
          if (self.sentMessages[msgID]) {
            var deferred = self.sentMessages[msgID].deferred
            delete self.sentMessages[msgID]
            delete self.pendingMessages[msgID]
            deferred.reject()
          }
        })

        self.toggleOffline(true)
      })

      if (lengthOverflow || singlesCount > 1) {
        this.sheduleRequest()
      }
    }

    MtpNetworker.prototype.getEncryptedMessage = function (dataWithPadding) {
      var self = this
      return self.getMsgKey(dataWithPadding, true).then(function (msgKey) {
        return self.getAesKeyIv(msgKey, true).then(function (keyIv) {
          // console.log(dT(), 'after msg key iv')
          return CryptoWorker.aesEncrypt(dataWithPadding, keyIv[0], keyIv[1]).then(function (encryptedBytes) {
            // console.log(dT(), 'Finish encrypt')
            return {
              bytes: encryptedBytes,
              msgKey: msgKey
            }
          })
        })
      })
    }

    MtpNetworker.prototype.getDecryptedMessage = function (msgKey, encryptedData) {
      // console.log(dT(), 'get decrypted start')
      return this.getAesKeyIv(msgKey, false).then(function (keyIv) {
        // console.log(dT(), 'after msg key iv')
        return CryptoWorker.aesDecrypt(encryptedData, keyIv[0], keyIv[1])
      })
    }

    MtpNetworker.prototype.sendEncryptedRequest = function (message, options) {
      var self = this
      options = options || {}
      // console.log(dT(), 'Send encrypted'/*, message*/)
      // console.trace()
      var data = new TLSerialization({startMaxLength: message.body.length + 2048})

      data.storeIntBytes(this.serverSalt, 64, 'salt')
      data.storeIntBytes(this.sessionID, 64, 'session_id')

      data.storeLong(message.msg_id, 'message_id')
      data.storeInt(message.seq_no, 'seq_no')

      data.storeInt(message.body.length, 'message_data_length')
      data.storeRawBytes(message.body, 'message_data')

      var dataBuffer = data.getBuffer()

      var paddingLength = (16 - (data.offset % 16)) + 16 * (1 + nextRandomInt(5))
      var padding = new Array(paddingLength)
      MtpSecureRandom.nextBytes(padding)

      var dataWithPadding = bufferConcat(dataBuffer, padding)
      // console.log(dT(), 'Adding padding', dataBuffer, padding, dataWithPadding)
      // console.log(dT(), 'auth_key_id', bytesToHex(self.authKeyID))

      return this.getEncryptedMessage(dataWithPadding).then(function (encryptedResult) {
        // console.log(dT(), 'Got encrypted out message'/*, encryptedResult*/)
        var request = new TLSerialization({startMaxLength: encryptedResult.bytes.byteLength + 256})
        request.storeIntBytes(self.authKeyID, 64, 'auth_key_id')
        request.storeIntBytes(encryptedResult.msgKey, 128, 'msg_key')
        request.storeRawBytes(encryptedResult.bytes, 'encrypted_data')

        var requestData = xhrSendBuffer ? request.getBuffer() : request.getArray()

        var requestPromise
        var url = MtpDcConfigurator.chooseServer(self.dcID, self.upload)
        var baseError = {code: 406, type: 'NETWORK_BAD_RESPONSE', url: url}

        try {
          options = angular.extend(options || {}, {
            responseType: 'arraybuffer',
            transformRequest: null
          })
          requestPromise = $http.post(url, requestData, options)
        } catch (e) {
          requestPromise = $q.reject(e)
        }
        return requestPromise.then(
          function (result) {
            if (!result.data || !result.data.byteLength) {
              return $q.reject(baseError)
            }
            return result
          },
          function (error) {
            if (!error.message && !error.type) {
              error = angular.extend(baseError, {type: 'NETWORK_BAD_REQUEST', originalError: error})
            }
            return $q.reject(error)
          }
        )
      })
    }

    MtpNetworker.prototype.parseResponse = function (responseBuffer) {
      // console.log(dT(), 'Start parsing response')
      var self = this
      var deserializer = new TLDeserialization(responseBuffer)

      var authKeyID = deserializer.fetchIntBytes(64, false, 'auth_key_id')
      if (!bytesCmp(authKeyID, this.authKeyID)) {
        throw new Error('[MT] Invalid server auth_key_id: ' + bytesToHex(authKeyID))
      }
      var msgKey = deserializer.fetchIntBytes(128, true, 'msg_key')
      var encryptedData = deserializer.fetchRawBytes(responseBuffer.byteLength - deserializer.getOffset(), true, 'encrypted_data')

      return self.getDecryptedMessage(msgKey, encryptedData).then(function (dataWithPadding) {
        // console.log(dT(), 'after decrypt')
        return self.getMsgKey(dataWithPadding, false).then(function (calcMsgKey) {
          if (!bytesCmp(msgKey, calcMsgKey)) {
            console.warn('[MT] msg_keys', msgKey, bytesFromArrayBuffer(calcMsgKey))
            throw new Error('[MT] server msgKey mismatch')
          }
          // console.log(dT(), 'after msgKey check')

          var deserializer = new TLDeserialization(dataWithPadding, {mtproto: true})

          var salt = deserializer.fetchIntBytes(64, false, 'salt')
          var sessionID = deserializer.fetchIntBytes(64, false, 'session_id')
          var messageID = deserializer.fetchLong('message_id')

          if (!bytesCmp(sessionID, self.sessionID) &&
              (!self.prevSessionID || !bytesCmp(sessionID, self.prevSessionID))) {
            console.warn('Sessions', sessionID, self.sessionID, self.prevSessionID)
            throw new Error('[MT] Invalid server session_id: ' + bytesToHex(sessionID))
          }

          var seqNo = deserializer.fetchInt('seq_no')

          var totalLength = dataWithPadding.byteLength

          var messageBodyLength = deserializer.fetchInt('message_data[length]')
          var offset = deserializer.getOffset()

          if ((messageBodyLength % 4) ||
              messageBodyLength > totalLength - offset) {
            throw new Error('[MT] Invalid body length: ' + messageBodyLength)
          }
          var messageBody = deserializer.fetchRawBytes(messageBodyLength, true, 'message_data')

          var offset = deserializer.getOffset()
          var paddingLength = totalLength - offset
          if (paddingLength < 12 || paddingLength > 1024) {
            throw new Error('[MT] Invalid padding length: ' + paddingLength)
          }

          var buffer = bytesToArrayBuffer(messageBody)
          var deserializerOptions = {
            mtproto: true,
            override: {
              mt_message: function (result, field) {
                result.msg_id = this.fetchLong(field + '[msg_id]')
                result.seqno = this.fetchInt(field + '[seqno]')
                result.bytes = this.fetchInt(field + '[bytes]')

                var offset = this.getOffset()

                try {
                  result.body = this.fetchObject('Object', field + '[body]')
                } catch (e) {
                  console.error(dT(), 'parse error', e.message, e.stack)
                  result.body = {_: 'parse_error', error: e}
                }
                if (this.offset != offset + result.bytes) {
                  // console.warn(dT(), 'set offset', this.offset, offset, result.bytes)
                  // console.log(dT(), result)
                  this.offset = offset + result.bytes
                }
              // console.log(dT(), 'override message', result)
              },
              mt_rpc_result: function (result, field) {
                result.req_msg_id = this.fetchLong(field + '[req_msg_id]')

                var sentMessage = self.sentMessages[result.req_msg_id]
                var type = sentMessage && sentMessage.resultType || 'Object'

                if (result.req_msg_id && !sentMessage) {
                  // console.warn(dT(), 'Result for unknown message', result)
                  return
                }
                result.result = this.fetchObject(type, field + '[result]')
              // console.log(dT(), 'override rpc_result', sentMessage, type, result)
              }
            }
          }
          var deserializer = new TLDeserialization(buffer, deserializerOptions)
          var response = deserializer.fetchObject('', 'INPUT')

          return {
            response: response,
            messageID: messageID,
            sessionID: sessionID,
            seqNo: seqNo
          }
        })
      })
    }

    MtpNetworker.prototype.applyServerSalt = function (newServerSalt) {
      var serverSalt = longToBytes(newServerSalt)

      var storeObj = {}
      storeObj['dc' + this.dcID + '_server_salt'] = bytesToHex(serverSalt)
      Storage.set(storeObj)

      this.serverSalt = serverSalt
      return true
    }

    MtpNetworker.prototype.sheduleRequest = function (delay) {
      if (this.offline) {
        this.checkConnection('forced shedule')
      }
      var nextReq = tsNow() + delay

      if (delay && this.nextReq && this.nextReq <= nextReq) {
        return false
      }

      // console.log(dT(), 'shedule req', delay)
      // console.trace()

      $timeout.cancel(this.nextReqPromise)
      if (delay > 0) {
        this.nextReqPromise = $timeout(this.performSheduledRequest.bind(this), delay || 0)
      } else {
        setZeroTimeout(this.performSheduledRequest.bind(this))
      }

      this.nextReq = nextReq
    }

    MtpNetworker.prototype.ackMessage = function (msgID) {
      // console.log('ack message', msgID)
      this.pendingAcks.push(msgID)
      this.sheduleRequest(30000)
    }

    MtpNetworker.prototype.reqResendMessage = function (msgID) {
      console.log(dT(), 'Req resend', msgID)
      this.pendingResends.push(msgID)
      this.sheduleRequest(100)
    }

    MtpNetworker.prototype.cleanupSent = function () {
      var self = this
      var notEmpty = false
      // console.log('clean start', this.dcID/*, this.sentMessages*/)
      angular.forEach(this.sentMessages, function (message, msgID) {
        // console.log('clean iter', msgID, message)
        if (message.notContentRelated && self.pendingMessages[msgID] === undefined) {
          // console.log('clean notContentRelated', msgID)
          delete self.sentMessages[msgID]
        }
        else if (message.container) {
          for (var i = 0; i < message.inner.length; i++) {
            if (self.sentMessages[message.inner[i]] !== undefined) {
              // console.log('clean failed, found', msgID, message.inner[i], self.sentMessages[message.inner[i]].seq_no)
              notEmpty = true
              return
            }
          }
          // console.log('clean container', msgID)
          delete self.sentMessages[msgID]
        } else {
          notEmpty = true
        }
      })

      return !notEmpty
    }

    MtpNetworker.prototype.processMessageAck = function (messageID) {
      var sentMessage = this.sentMessages[messageID]
      if (sentMessage && !sentMessage.acked) {
        delete sentMessage.body
        sentMessage.acked = true

        return true
      }

      return false
    }

    MtpNetworker.prototype.processError = function (rawError) {
      var matches = (rawError.error_message || '').match(/^([A-Z_0-9]+\b)(: (.+))?/) || []
      rawError.error_code = uintToInt(rawError.error_code)

      return {
        code: !rawError.error_code || rawError.error_code <= 0 ? 500 : rawError.error_code,
        type: matches[1] || 'UNKNOWN',
        description: matches[3] || ('CODE#' + rawError.error_code + ' ' + rawError.error_message),
        originalError: rawError
      }
    }

    MtpNetworker.prototype.processMessage = function (message, messageID, sessionID) {
      var msgidInt = parseInt(messageID.toString(10).substr(0, -10), 10)
      if (msgidInt % 2) {
        console.warn('[MT] Server even message id: ', messageID, message)
        return
      }
      // console.log('process message', message, messageID, sessionID)
      switch (message._) {
        case 'msg_container':
          var len = message.messages.length
          for (var i = 0; i < len; i++) {
            this.processMessage(message.messages[i], message.messages[i].msg_id, sessionID)
          }
          break

        case 'bad_server_salt':
          console.log(dT(), 'Bad server salt', message)
          var sentMessage = this.sentMessages[message.bad_msg_id]
          if (!sentMessage || sentMessage.seq_no != message.bad_msg_seqno) {
            console.log(message.bad_msg_id, message.bad_msg_seqno)
            throw new Error('[MT] Bad server salt for invalid message')
          }

          this.applyServerSalt(message.new_server_salt)
          this.pushResend(message.bad_msg_id)
          this.ackMessage(messageID)
          break

        case 'bad_msg_notification':
          console.log(dT(), 'Bad msg notification', message)
          var sentMessage = this.sentMessages[message.bad_msg_id]
          if (!sentMessage || sentMessage.seq_no != message.bad_msg_seqno) {
            console.log(message.bad_msg_id, message.bad_msg_seqno)
            throw new Error('[MT] Bad msg notification for invalid message')
          }

          if (message.error_code == 16 || message.error_code == 17) {
            if (MtpTimeManager.applyServerTime(
                bigStringInt(messageID).shiftRight(32).toString(10)
              )) {
              console.log(dT(), 'Update session')
              this.updateSession()
            }
            var badMessage = this.updateSentMessage(message.bad_msg_id)
            this.pushResend(badMessage.msg_id)
            this.ackMessage(messageID)
          }
          break

        case 'message':
          if (this.lastServerMessages.indexOf(messageID) != -1) {
            // console.warn('[MT] Server same messageID: ', messageID)
            this.ackMessage(messageID)
            return
          }
          this.lastServerMessages.push(messageID)
          if (this.lastServerMessages.length > 100) {
            this.lastServerMessages.shift()
          }
          this.processMessage(message.body, message.msg_id, sessionID)
          break

        case 'new_session_created':
          this.ackMessage(messageID)

          this.processMessageAck(message.first_msg_id)
          this.applyServerSalt(message.server_salt)

          var self = this
          Storage.get('dc').then(function (baseDcID) {
            if (baseDcID == self.dcID && !self.upload && updatesProcessor) {
              updatesProcessor(message, true)
            }
          })
          break

        case 'msgs_ack':
          for (var i = 0; i < message.msg_ids.length; i++) {
            this.processMessageAck(message.msg_ids[i])
          }
          break

        case 'msg_detailed_info':
          if (!this.sentMessages[message.msg_id]) {
            this.ackMessage(message.answer_msg_id)
            break
          }
        case 'msg_new_detailed_info':
          if (this.pendingAcks.indexOf(message.answer_msg_id)) {
            break
          }
          this.reqResendMessage(message.answer_msg_id)
          break

        case 'msgs_state_info':
          this.ackMessage(message.answer_msg_id)
          if (this.lastResendReq && this.lastResendReq.req_msg_id == message.req_msg_id && this.pendingResends.length) {
            var i, badMsgID, pos
            for (i = 0; i < this.lastResendReq.resend_msg_ids.length; i++) {
              badMsgID = this.lastResendReq.resend_msg_ids[i]
              pos = this.pendingResends.indexOf(badMsgID)
              if (pos != -1) {
                this.pendingResends.splice(pos, 1)
              }
            }
          }
          break

        case 'rpc_result':
          this.ackMessage(messageID)

          var sentMessageID = message.req_msg_id
          var sentMessage = this.sentMessages[sentMessageID]

          this.processMessageAck(sentMessageID)
          if (sentMessage) {
            var deferred = sentMessage.deferred
            if (message.result._ == 'rpc_error') {
              var error = this.processError(message.result)
              console.log(dT(), 'Rpc error', error)
              if (deferred) {
                deferred.reject(error)
              }
            } else {
              if (deferred) {
                if (Config.Modes.debug) {
                  console.log(dT(), 'Rpc response', message.result)
                } else {
                  var dRes = message.result._
                  if (!dRes) {
                    if (message.result.length > 5) {
                      dRes = '[..' + message.result.length + '..]'
                    } else {
                      dRes = message.result
                    }
                  }
                  console.log(dT(), 'Rpc response', dRes)
                }
                sentMessage.deferred.resolve(message.result)
              }
              if (sentMessage.isAPI) {
                this.connectionInited = true
              }
            }

            delete this.sentMessages[sentMessageID]
          }
          break

        default:
          this.ackMessage(messageID)

          // console.log('Update', message)
          if (updatesProcessor) {
            updatesProcessor(message, true)
          }
          break

      }
    }

    function startAll () {
      if (akStopped) {
        akStopped = false
        updatesProcessor({_: 'new_session_created'}, true)
      }
    }

    function stopAll () {
      akStopped = true
    }

    return {
      getNetworker: function (dcID, authKey, serverSalt, options) {
        return new MtpNetworker(dcID, authKey, serverSalt, options)
      },
      setUpdatesProcessor: function (callback) {
        updatesProcessor = callback
      },
      stopAll: stopAll,
      startAll: startAll
    }
  })
