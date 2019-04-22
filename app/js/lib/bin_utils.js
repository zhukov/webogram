/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

function bigint (num) {
  return new BigInteger(num.toString(16), 16)
}

function bigStringInt (strNum) {
  return new BigInteger(strNum, 10)
}

function dHexDump (bytes) {
  var arr = []
  for (var i = 0; i < bytes.length; i++) {
    if (i && !(i % 2)) {
      if (!(i % 16)) {
        arr.push('\n')
      } else if (!(i % 4)) {
        arr.push('  ')
      } else {
        arr.push(' ')
      }
    }
    arr.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16))
  }

  console.log(arr.join(''))
}

function bytesToHex (bytes) {
  bytes = bytes || []
  var arr = []
  for (var i = 0; i < bytes.length; i++) {
    arr.push((bytes[i] < 16 ? '0' : '') + (bytes[i] || 0).toString(16))
  }
  return arr.join('')
}

function bytesFromHex (hexString) {
  var len = hexString.length,
    i
  var start = 0
  var bytes = []

  if (hexString.length % 2) {
    bytes.push(parseInt(hexString.charAt(0), 16))
    start++
  }

  for (i = start; i < len; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16))
  }

  return bytes
}

function bytesToBase64 (bytes) {
  var mod3
  var result = ''

  for (var nLen = bytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    mod3 = nIdx % 3
    nUint24 |= bytes[nIdx] << (16 >>> mod3 & 24)
    if (mod3 === 2 || nLen - nIdx === 1) {
      result += String.fromCharCode(
        uint6ToBase64(nUint24 >>> 18 & 63),
        uint6ToBase64(nUint24 >>> 12 & 63),
        uint6ToBase64(nUint24 >>> 6 & 63),
        uint6ToBase64(nUint24 & 63)
      )
      nUint24 = 0
    }
  }

  return result.replace(/A(?=A$|$)/g, '=')
}

function uint6ToBase64 (nUint6) {
  return nUint6 < 26
    ? nUint6 + 65
    : nUint6 < 52
      ? nUint6 + 71
      : nUint6 < 62
        ? nUint6 - 4
        : nUint6 === 62
          ? 43
          : nUint6 === 63
            ? 47
            : 65
}

function base64ToBlob (base64str, mimeType) {
  var sliceSize = 1024
  var byteCharacters = atob(base64str)
  var bytesLength = byteCharacters.length
  var slicesCount = Math.ceil(bytesLength / sliceSize)
  var byteArrays = new Array(slicesCount)

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    var begin = sliceIndex * sliceSize
    var end = Math.min(begin + sliceSize, bytesLength)

    var bytes = new Array(end - begin)
    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0)
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes)
  }

  return blobConstruct(byteArrays, mimeType)
}

function dataUrlToBlob (url) {
  // var name = 'b64blob ' + url.length
  // console.time(name)
  var urlParts = url.split(',')
  var base64str = urlParts[1]
  var mimeType = urlParts[0].split(':')[1].split(';')[0]
  var blob = base64ToBlob(base64str, mimeType)
  // console.timeEnd(name)
  return blob
}

function blobConstruct (blobParts, mimeType) {
  var blob
  var safeMimeType = blobSafeMimeType(mimeType)
  try {
    blob = new Blob(blobParts, {type: safeMimeType})
  } catch (e) {
    var bb = new BlobBuilder
    angular.forEach(blobParts, function (blobPart) {
      bb.append(blobPart)
    })
    blob = bb.getBlob(safeMimeType)
  }
  return blob
}

function blobSafeMimeType(mimeType) {
  if ([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
  ].indexOf(mimeType) == -1) {
    return 'application/octet-stream'
  }
  return mimeType
}

function bytesCmp (bytes1, bytes2) {
  var len = bytes1.length
  if (len != bytes2.length) {
    return false
  }

  for (var i = 0; i < len; i++) {
    if (bytes1[i] != bytes2[i]) {
      return false
    }
  }
  return true
}

function bytesXor (bytes1, bytes2) {
  var len = bytes1.length
  var bytes = []

  for (var i = 0; i < len; ++i) {
    bytes[i] = bytes1[i] ^ bytes2[i]
  }

  return bytes
}

function bytesToWords (bytes) {
  if (bytes instanceof ArrayBuffer) {
    bytes = new Uint8Array(bytes)
  }
  var len = bytes.length
  var words = []
  var i
  for (i = 0; i < len; i++) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8)
  }

  return new CryptoJS.lib.WordArray.init(words, len)
}

function bytesFromWords (wordArray) {
  var words = wordArray.words
  var sigBytes = wordArray.sigBytes
  var bytes = []

  for (var i = 0; i < sigBytes; i++) {
    bytes.push((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)
  }

  return bytes
}

function bytesFromBigInt (bigInt, len) {
  var bytes = bigInt.toByteArray()

  if (len && bytes.length < len) {
    var padding = []
    for (var i = 0, needPadding = len - bytes.length; i < needPadding; i++) {
      padding[i] = 0
    }
    if (bytes instanceof ArrayBuffer) {
      bytes = bufferConcat(padding, bytes)
    } else {
      bytes = padding.concat(bytes)
    }
  }else {
    while (!bytes[0] && (!len || bytes.length > len)) {
      bytes = bytes.slice(1)
    }
  }

  return bytes
}

function bytesFromLeemonBigInt (bigInt, len) {
  var str = bigInt2str(bigInt, 16)
  return bytesFromHex(str)
}

function bytesToArrayBuffer (b) {
  return (new Uint8Array(b)).buffer
}

function convertToArrayBuffer (bytes) {
  // Be careful with converting subarrays!!
  if (bytes instanceof ArrayBuffer) {
    return bytes
  }
  if (bytes.buffer !== undefined &&
    bytes.buffer.byteLength == bytes.length * bytes.BYTES_PER_ELEMENT) {
    return bytes.buffer
  }
  return bytesToArrayBuffer(bytes)
}

function convertToUint8Array (bytes) {
  if (bytes.buffer !== undefined) {
    return bytes
  }
  return new Uint8Array(bytes)
}

function convertToByteArray (bytes) {
  if (Array.isArray(bytes)) {
    return bytes
  }
  bytes = convertToUint8Array(bytes)
  var newBytes = []
  for (var i = 0, len = bytes.length; i < len; i++) {
    newBytes.push(bytes[i])
  }
  return newBytes
}

function bytesFromArrayBuffer (buffer) {
  var len = buffer.byteLength
  var byteView = new Uint8Array(buffer)
  var bytes = []

  for (var i = 0; i < len; ++i) {
    bytes[i] = byteView[i]
  }

  return bytes
}

function bufferConcat (buffer1, buffer2) {
  var l1 = buffer1.byteLength || buffer1.length
  var l2 = buffer2.byteLength || buffer2.length
  var tmp = new Uint8Array(l1 + l2)
  tmp.set(buffer1 instanceof ArrayBuffer ? new Uint8Array(buffer1) : buffer1, 0)
  tmp.set(buffer2 instanceof ArrayBuffer ? new Uint8Array(buffer2) : buffer2, l1)

  return tmp.buffer
}

function longToInts (sLong) {
  var divRem = bigStringInt(sLong).divideAndRemainder(bigint(0x100000000))

  return [divRem[0].intValue(), divRem[1].intValue()]
}

function longToBytes (sLong) {
  return bytesFromWords({words: longToInts(sLong), sigBytes: 8}).reverse()
}

function longFromInts (high, low) {
  return bigint(high).shiftLeft(32).add(bigint(low)).toString(10)
}

function intToUint (val) {
  val = parseInt(val)
  if (val < 0) {
    val = val + 4294967296
  }
  return val
}

function uintToInt (val) {
  if (val > 2147483647) {
    val = val - 4294967296
  }
  return val
}

function sha1HashSync (bytes) {
  this.rushaInstance = this.rushaInstance || new Rusha(1024 * 1024)

  // console.log(dT(), 'SHA-1 hash start', bytes.byteLength || bytes.length)
  var hashBytes = rushaInstance.rawDigest(bytes).buffer
  // console.log(dT(), 'SHA-1 hash finish')

  return hashBytes
}

function sha1BytesSync (bytes) {
  return bytesFromArrayBuffer(sha1HashSync(bytes))
}

function sha256HashSync (bytes) {
  // console.log(dT(), 'SHA-2 hash start', bytes.byteLength || bytes.length)
  var hashWords = CryptoJS.SHA256(bytesToWords(bytes))
  // console.log(dT(), 'SHA-2 hash finish')

  var hashBytes = bytesFromWords(hashWords)

  return hashBytes
}

function rsaEncrypt (publicKey, bytes) {
  bytes = addPadding(bytes, 255)

  // console.log('RSA encrypt start')
  var N = new BigInteger(publicKey.modulus, 16)
  var E = new BigInteger(publicKey.exponent, 16)
  var X = new BigInteger(bytes)
  var encryptedBigInt = X.modPowInt(E, N),
    encryptedBytes = bytesFromBigInt(encryptedBigInt, 256)
    // console.log('RSA encrypt finish')

  return encryptedBytes
}

function addPadding (bytes, blockSize, zeroes) {
  blockSize = blockSize || 16
  var len = bytes.byteLength || bytes.length
  var needPadding = blockSize - (len % blockSize)
  if (needPadding > 0 && needPadding < blockSize) {
    var padding = new Array(needPadding)
    if (zeroes) {
      for (var i = 0; i < needPadding; i++) {
        padding[i] = 0
      }
    } else {
      (new SecureRandom()).nextBytes(padding)
    }

    if (bytes instanceof ArrayBuffer) {
      bytes = bufferConcat(bytes, padding)
    } else {
      bytes = bytes.concat(padding)
    }
  }

  return bytes
}

function aesEncryptSync (bytes, keyBytes, ivBytes) {
  var len = bytes.byteLength || bytes.length

  // console.log(dT(), 'AES encrypt start', len/*, bytesToHex(keyBytes), bytesToHex(ivBytes)*/)
  bytes = addPadding(bytes)

  var encryptedWords = CryptoJS.AES.encrypt(bytesToWords(bytes), bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  }).ciphertext

  var encryptedBytes = bytesFromWords(encryptedWords)
  // console.log(dT(), 'AES encrypt finish')

  return encryptedBytes
}

function aesDecryptSync (encryptedBytes, keyBytes, ivBytes) {

  // console.log(dT(), 'AES decrypt start', encryptedBytes.length)
  var decryptedWords = CryptoJS.AES.decrypt({ciphertext: bytesToWords(encryptedBytes)}, bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  })

  var bytes = bytesFromWords(decryptedWords)
  // console.log(dT(), 'AES decrypt finish')

  return bytes
}

function gzipUncompress (bytes) {
  // console.log('Gzip uncompress start')
  var result = (new Zlib.Gunzip(bytes)).decompress()
  // console.log('Gzip uncompress finish')
  return result
}

function nextRandomInt (maxValue) {
  return Math.floor(Math.random() * maxValue)
}

function pqPrimeFactorization (pqBytes) {
  var what = new BigInteger(pqBytes)
  var result = false

  // console.log(dT(), 'PQ start', pqBytes, what.toString(16), what.bitLength())

  try {
    result = pqPrimeLeemon(str2bigInt(what.toString(16), 16, Math.ceil(64 / bpe) + 1))
  } catch (e) {
    console.error('Pq leemon Exception', e)
  }

  if (result === false && what.bitLength() <= 64) {
    // console.time('PQ long')
    try {
      result = pqPrimeLong(goog.math.Long.fromString(what.toString(16), 16))
    } catch (e) {
      console.error('Pq long Exception', e)
    }
  // console.timeEnd('PQ long')
  }
  // console.log(result)

  if (result === false) {
    // console.time('pq BigInt')
    result = pqPrimeBigInteger(what)
  // console.timeEnd('pq BigInt')
  }

  // console.log(dT(), 'PQ finish')

  return result
}

function pqPrimeBigInteger (what) {
  var it = 0,
    g
  for (var i = 0; i < 3; i++) {
    var q = (nextRandomInt(128) & 15) + 17
    var x = bigint(nextRandomInt(1000000000) + 1)
    var y = x.clone()
    var lim = 1 << (i + 18)

    for (var j = 1; j < lim; j++) {
      ++it
      var a = x.clone()
      var b = x.clone()
      var c = bigint(q)

      while (!b.equals(BigInteger.ZERO)) {
        if (!b.and(BigInteger.ONE).equals(BigInteger.ZERO)) {
          c = c.add(a)
          if (c.compareTo(what) > 0) {
            c = c.subtract(what)
          }
        }
        a = a.add(a)
        if (a.compareTo(what) > 0) {
          a = a.subtract(what)
        }
        b = b.shiftRight(1)
      }

      x = c.clone()
      var z = x.compareTo(y) < 0 ? y.subtract(x) : x.subtract(y)
      g = z.gcd(what)
      if (!g.equals(BigInteger.ONE)) {
        break
      }
      if ((j & (j - 1)) == 0) {
        y = x.clone()
      }
    }
    if (g.compareTo(BigInteger.ONE) > 0) {
      break
    }
  }

  var f = what.divide(g), P, Q

  if (g.compareTo(f) > 0) {
    P = f
    Q = g
  } else {
    P = g
    Q = f
  }

  return [bytesFromBigInt(P), bytesFromBigInt(Q), it]
}

function gcdLong (a, b) {
  while (a.notEquals(goog.math.Long.ZERO) && b.notEquals(goog.math.Long.ZERO)) {
    while (b.and(goog.math.Long.ONE).equals(goog.math.Long.ZERO)) {
      b = b.shiftRight(1)
    }
    while (a.and(goog.math.Long.ONE).equals(goog.math.Long.ZERO)) {
      a = a.shiftRight(1)
    }
    if (a.compare(b) > 0) {
      a = a.subtract(b)
    } else {
      b = b.subtract(a)
    }
  }
  return b.equals(goog.math.Long.ZERO) ? a : b
}

function pqPrimeLong (what) {
  var it = 0,
    g
  for (var i = 0; i < 3; i++) {
    var q = goog.math.Long.fromInt((nextRandomInt(128) & 15) + 17)
    var x = goog.math.Long.fromInt(nextRandomInt(1000000000) + 1)
    var y = x
    var lim = 1 << (i + 18)

    for (var j = 1; j < lim; j++) {
      ++it
      var a = x
      var b = x
      var c = q

      while (b.notEquals(goog.math.Long.ZERO)) {
        if (b.and(goog.math.Long.ONE).notEquals(goog.math.Long.ZERO)) {
          c = c.add(a)
          if (c.compare(what) > 0) {
            c = c.subtract(what)
          }
        }
        a = a.add(a)
        if (a.compare(what) > 0) {
          a = a.subtract(what)
        }
        b = b.shiftRight(1)
      }

      x = c
      var z = x.compare(y) < 0 ? y.subtract(x) : x.subtract(y)
      g = gcdLong(z, what)
      if (g.notEquals(goog.math.Long.ONE)) {
        break
      }
      if ((j & (j - 1)) == 0) {
        y = x
      }
    }
    if (g.compare(goog.math.Long.ONE) > 0) {
      break
    }
  }

  var f = what.div(g), P, Q

  if (g.compare(f) > 0) {
    P = f
    Q = g
  } else {
    P = g
    Q = f
  }

  return [bytesFromHex(P.toString(16)), bytesFromHex(Q.toString(16)), it]
}

function pqPrimeLeemon (what) {
  var minBits = 64
  var minLen = Math.ceil(minBits / bpe) + 1
  var it = 0
  var i, q
  var j, lim
  var g, P
  var Q
  var a = new Array(minLen)
  var b = new Array(minLen)
  var c = new Array(minLen)
  var g = new Array(minLen)
  var z = new Array(minLen)
  var x = new Array(minLen)
  var y = new Array(minLen)

  for (i = 0; i < 3; i++) {
    q = (nextRandomInt(128) & 15) + 17
    copyInt_(x, nextRandomInt(1000000000) + 1)
    copy_(y, x)
    lim = 1 << (i + 18)

    for (j = 1; j < lim; j++) {
      ++it
      copy_(a, x)
      copy_(b, x)
      copyInt_(c, q)

      while (!isZero(b)) {
        if (b[0] & 1) {
          add_(c, a)
          if (greater(c, what)) {
            sub_(c, what)
          }
        }
        add_(a, a)
        if (greater(a, what)) {
          sub_(a, what)
        }
        rightShift_(b, 1)
      }

      copy_(x, c)
      if (greater(x, y)) {
        copy_(z, x)
        sub_(z, y)
      } else {
        copy_(z, y)
        sub_(z, x)
      }
      eGCD_(z, what, g, a, b)
      if (!equalsInt(g, 1)) {
        break
      }
      if ((j & (j - 1)) == 0) {
        copy_(y, x)
      }
    }
    if (greater(g, one)) {
      break
    }
  }

  divide_(what, g, x, y)

  if (greater(g, x)) {
    P = x
    Q = g
  } else {
    P = g
    Q = x
  }

  // console.log(dT(), 'done', bigInt2str(what, 10), bigInt2str(P, 10), bigInt2str(Q, 10))

  return [bytesFromLeemonBigInt(P), bytesFromLeemonBigInt(Q), it]
}

function bytesModPow (x, y, m) {
  try {
    var xBigInt = str2bigInt(bytesToHex(x), 16)
    var yBigInt = str2bigInt(bytesToHex(y), 16)
    var mBigInt = str2bigInt(bytesToHex(m), 16)
    var resBigInt = powMod(xBigInt, yBigInt, mBigInt)

    return bytesFromHex(bigInt2str(resBigInt, 16))
  } catch (e) {
    console.error('mod pow error', e)
  }

  return bytesFromBigInt(new BigInteger(x).modPow(new BigInteger(y), new BigInteger(m)), 256)
}
