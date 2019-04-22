/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

importScripts(
  'polyfill.js',
  'bin_utils.js',
  '../../vendor/jsbn/jsbn_combined.js',
  '../../vendor/leemon_bigint/bigint.js',
  '../../vendor/closure/long.js',
  '../../vendor/cryptoJS/crypto.js',
  '../../vendor/rusha/rusha.js'
)

onmessage = function (e) {
  var taskID = e.data.taskID,
    result

  switch (e.data.task) {
    case 'factorize':
      result = pqPrimeFactorization(e.data.bytes)
      break

    case 'mod-pow':
      result = bytesModPow(e.data.x, e.data.y, e.data.m)
      break

    case 'sha1-hash':
      result = sha1HashSync(e.data.bytes)
      break

    case 'aes-encrypt':
      result = aesEncryptSync(e.data.bytes, e.data.keyBytes, e.data.ivBytes)
      break

    case 'aes-decrypt':
      result = aesDecryptSync(e.data.encryptedBytes, e.data.keyBytes, e.data.ivBytes)
      break

    default:
      throw new Error('Unknown task: ' + e.data.task)
  }

  postMessage({taskID: taskID, result: result})
}

postMessage('ready')
