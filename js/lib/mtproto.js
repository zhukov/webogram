/*!
 * Webogram v0.1 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

var _logTimer = (new Date()).getTime();
function dLog () {
  try {
    var t = '[' + (((new Date()).getTime() - _logTimer) / 1000).toFixed(3) + '] ';
    if (window.console && console.log) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(t);
      console.log.apply(console, args);
    }
  } catch (e) {}

  return true;
}

function bigint (num) {
  return new BigInteger(num.toString(16), 16);
}

function dHexDump (bytes) {
  var arr = [];
  for (var i = 0; i < bytes.length; i++) {
    if (i && !(i % 2)) {
      if (!(i % 16)) {
        arr.push("\n");
      } else if (!(i % 4)) {
        arr.push('  ');
      } else {
        arr.push(' ');
      }
    }
    arr.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16));
  }

  console.log(arr.join(''));
}

function bytesToHex (bytes) {
  var arr = [];
  for (var i = 0; i < bytes.length; i++) {
    arr.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16));
  }
  return arr.join('');
}

function bytesFromHex (hexString) {
  var len = hexString.length,
      i,
      bytes = [];

  for (i = 0; i < len; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }

  return bytes;
}

function bytesToBase64 (bytes) {
  var mod3, result = '';

  for (var nLen = bytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    mod3 = nIdx % 3;
    nUint24 |= bytes[nIdx] << (16 >>> mod3 & 24);
    if (mod3 === 2 || nLen - nIdx === 1) {
      result += String.fromCharCode(
        uint6ToBase64(nUint24 >>> 18 & 63),
        uint6ToBase64(nUint24 >>> 12 & 63),
        uint6ToBase64(nUint24 >>> 6 & 63),
        uint6ToBase64(nUint24 & 63)
      );
      nUint24 = 0;
    }
  }

  return result.replace(/A(?=A$|$)/g, '=');
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
            : 65;
}

function bytesCmp (bytes1, bytes2) {
  var len = bytes1.length;
  if (len != bytes2.length) {
    return false;
  }

  for (var i = 0; i < len; i++) {
    if (bytes1[i] != bytes2[i]) {
      return false;
    }
  }
  return true;
}

function bytesXor (bytes1, bytes2) {
  var len = bytes1.length,
      bytes = [];

  for (var i = 0; i < len; ++i) {
      bytes[i] = bytes1[i] ^ bytes2[i];
  }

  return bytes;
}

function bytesToWords (bytes) {
  var len = bytes.length,
      words = [];

  for (var i = 0; i < len; i++) {
      words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }

  return new CryptoJS.lib.WordArray.init(words, len);
}

function bytesFromWords (wordArray) {
  var words = wordArray.words,
      sigBytes = wordArray.sigBytes,
      bytes = [];

  for (var i = 0; i < sigBytes; i++) {
      bytes.push((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
  }

  return bytes;
}

function bytesFromBigInt (bigInt, len) {
  var bytes = bigInt.toByteArray();

  while (!bytes[0] && (!len || bytes.length > len)) {
    bytes = bytes.slice(1);
  }

  return bytes;
}

function bytesToArrayBuffer (b) {
  return (new Uint8Array(b)).buffer;
}

function bytesFromArrayBuffer (buffer) {
  var len = buffer.byteLength,
      byteView = new Uint8Array(buffer),
      bytes = [];

  for (var i = 0; i < len; ++i) {
      bytes[i] = byteView[i];
  }

  return bytes;
}

function longToInts (sLong) {
  var divRem = new BigInteger(sLong, 10).divideAndRemainder(bigint(0x100000000));

  return [divRem[0].intValue(), divRem[1].intValue()];
}

function longToBytes (sLong) {
  return bytesFromWords({words: longToInts(sLong), sigBytes: 8}).reverse();
}

function longFromInts (high, low) {
  return bigint(high).shiftLeft(32).add(bigint(low)).toString(10);
}

function intToUint (val) {
  val = parseInt(val);
  if (val < 0) {
    val = val + 4294967296;
  }
  return val;
}

function uintToInt (val) {
  if (val > 2147483647) {
    val = val - 4294967296;
  }
  return val;
}

function sha1Hash (bytes) {
  // dLog('SHA-1 hash start');
  var hashBytes = sha1.hash(bytes, true);
  // dLog('SHA-1 hash finish');

  return hashBytes;
}



function rsaEncrypt (publicKey, bytes) {
  var needPadding = 255 - bytes.length;
  if (needPadding > 0) {
    var padding = new Array(needPadding);
    (new SecureRandom()).nextBytes(padding);

    bytes = bytes.concat(padding);
  }

  // dLog('RSA encrypt start');
  var N = new BigInteger(publicKey.modulus, 16),
      E = new BigInteger(publicKey.exponent, 16),
      X = new BigInteger(bytes),
      encryptedBigInt = X.modPowInt(E, N),
      encryptedBytes  = bytesFromBigInt(encryptedBigInt, 256);

  // dLog('RSA encrypt finish');

  return encryptedBytes;
}

function aesEncrypt (bytes, keyBytes, ivBytes) {
  // dLog('AES encrypt start', bytes.length/*, bytesToHex(keyBytes), bytesToHex(ivBytes)*/);

  var needPadding = 16 - (bytes.length % 16);
  if (needPadding > 0 && needPadding < 16) {
    var padding = new Array(needPadding);
    (new SecureRandom()).nextBytes(padding);

    bytes = bytes.concat(padding);
  }

  var encryptedWords = CryptoJS.AES.encrypt(bytesToWords(bytes), bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  }).ciphertext;

  var encryptedBytes = bytesFromWords(encryptedWords);

  // dLog('AES encrypt finish');

  return encryptedBytes;
}

function aesDecrypt (encryptedBytes, keyBytes, ivBytes) {
  // dLog('AES decrypt start', encryptedBytes.length/*, bytesToHex(keyBytes), bytesToHex(ivBytes)*/);

  var decryptedWords = CryptoJS.AES.decrypt({ciphertext: bytesToWords(encryptedBytes)}, bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  });

  var bytes = bytesFromWords(decryptedWords);

  // dLog('AES decrypt finish');

  return bytes;
}

function gzipUncompress (bytes) {
  // dLog('Gzip uncompress start');
  var result = (new Zlib.Gunzip(bytes)).decompress();
  // dLog('Gzip uncompress finish');
  return result;
}

function nextRandomInt (maxValue) {
  return Math.floor(Math.random() * maxValue);
};

function pqPrimeFactorization (pqBytes) {
  dLog('PQ start');

  var what = new BigInteger(pqBytes),
      g;

  var it = 0;
  for (var i = 0; i < 3; i++) {
    var q = (nextRandomInt(128) & 15) + 17,
        x = bigint(nextRandomInt(1000000000) + 1),
        y = x.clone(),
        lim = 1 << (i + 18);

    for (var j = 1; j < lim; j++) {
      ++it;
      var a = x.clone(),
          b = x.clone(),
          c = bigint(q);

      while (!b.equals(BigInteger.ZERO)) {
        if (!b.and(BigInteger.ONE).equals(BigInteger.ZERO)) {
          c = c.add(a);
          if (c.compareTo(what) > 0) {
            c = c.subtract(what);
          }
        }
        a = a.add(a);
        if (a.compareTo(what) > 0) {
          a = a.subtract(what);
        }
        b = b.shiftRight(1);
      }

      x = c.clone();
      var z = x.compareTo(y) < 0 ? y.subtract(x) : x.subtract(y);
      g = z.gcd(what);
      if (!g.equals(BigInteger.ONE)) {
        break;
      }
      if ((j & (j - 1)) == 0) {
        y = x.clone();
      }
    }
    if (g.compareTo(BigInteger.ONE) > 0) {
      break;
    }
  }

  var f = what.divide(g), P, Q;

  if (g.compareTo(f) > 0) {
    P = f;
    Q = g;
  } else {
    P = g;
    Q = f;
  }

  dLog('PQ finish', it + ' iterations');

  return [bytesFromBigInt(P), bytesFromBigInt(Q)];
}


function TLSerialization (options) {
  options = options || {};
  this.maxLength = options.startMaxLength || 2048; // 2Kb
  this.offset = 0; // in bytes

  this.createBuffer();

  // this.debug = options.debug !== undefined ? options.debug : true;
  this.mtproto = options.mtproto || false;
  return this;
}

TLSerialization.prototype.createBuffer = function () {
  this.buffer   = new ArrayBuffer(this.maxLength);
  this.intView  = new Int32Array(this.buffer);
  this.byteView = new Uint8Array(this.buffer);
};

TLSerialization.prototype.getArray = function () {
  var resultBuffer = new ArrayBuffer(this.offset);
  var resultArray  = new Int32Array(resultBuffer);

  resultArray.set(this.intView.subarray(0, this.offset / 4));

  return resultArray;
};

TLSerialization.prototype.getBuffer = function () {
  return this.getArray().buffer;
};

TLSerialization.prototype.getBytes = function () {
  var bytes = [];
  for (var i = 0; i < this.offset; i++) {
    bytes.push(this.byteView[i]);
  }
  return bytes;
};

TLSerialization.prototype.checkLength = function (needBytes) {
  if (this.offset + needBytes < this.maxLength) {
    return;
  }

  dLog('Increase buffer', this.offset, needBytes, this.maxLength);
  console.trace();
  this.maxLength = Math.max(this.maxLength * 2, this.offset + needBytes + 16);
  var previousBuffer = this.buffer,
      previousArray = new Int32Array(previousBuffer);

  this.createBuffer();

  new Int32Array(this.buffer).set(previousArray);
};

TLSerialization.prototype.writeInt = function (i, field) {
  this.debug && dLog('>>>', i.toString(16), i, field);

  this.checkLength(4);
  this.intView[this.offset / 4] = i;
  this.offset += 4;
};

TLSerialization.prototype.storeInt = function (i, field) {
  this.writeInt(i, (field || '') + ':int');
};

TLSerialization.prototype.storeBool = function (i, field) {
  if (i) {
    this.writeInt(0x997275b5, (field || '') + ':bool');
  } else {
    this.writeInt(0xbc799737, (field || '') + ':bool');
  }
};

TLSerialization.prototype.storeLongP = function (iHigh, iLow, field) {
  this.writeInt(iLow, (field || '') + ':long[low]');
  this.writeInt(iHigh, (field || '') + ':long[high]');
};

TLSerialization.prototype.storeLong = function (sLong, field) {
  if (angular.isArray(sLong)) {
    if (sLong.length == 2) {
      return this.storeLongP(sLong[0], sLong[1], field);
    } else {
      return this.storeIntBytes(sLong, 64, field);
    }
  }

  var divRem = new BigInteger(sLong, 10).divideAndRemainder(bigint(0x100000000));

  this.writeInt(intToUint(divRem[1].intValue()), (field || '') + ':long[low]');
  this.writeInt(intToUint(divRem[0].intValue()), (field || '') + ':long[high]');
};

TLSerialization.prototype.storeDouble = function (f) {
  var buffer     = new ArrayBuffer(8);
  var intView    = new Int32Array(buffer);
  var doubleView = new Float64Array(buffer);

  doubleView[0] = f;

  this.writeInt(intView[0], (field || '') + ':double[low]');
  this.writeInt(intView[1], (field || '') + ':double[high]');
};

TLSerialization.prototype.storeString = function (s, field) {
  this.debug && dLog('>>>', s, (field || '') + ':string');

  var sUTF8 = unescape(encodeURIComponent(s));

  this.checkLength(sUTF8.length + 8);


  var len = sUTF8.length;
  if (len <= 253) {
    this.byteView[this.offset++] = len;
  } else {
    this.byteView[this.offset++] = 254;
    this.byteView[this.offset++] = len & 0xFF;
    this.byteView[this.offset++] = (len & 0xFF00) >> 8;
    this.byteView[this.offset++] = (len & 0xFF0000) >> 16;
  }
  for (var i = 0; i < len; i++) {
    this.byteView[this.offset++] = sUTF8.charCodeAt(i);
  }

  // Padding
  while (this.offset % 4) {
    this.byteView[this.offset++] = 0;
  }
}


TLSerialization.prototype.storeBytes = function (bytes, field) {
  this.debug && dLog('>>>', bytesToHex(bytes), (field || '') + ':bytes');

  this.checkLength(bytes.length + 8);

  var len = bytes.length;
  if (len <= 253) {
    this.byteView[this.offset++] = len;
  } else {
    this.byteView[this.offset++] = 254;
    this.byteView[this.offset++] = len & 0xFF;
    this.byteView[this.offset++] = (len & 0xFF00) >> 8;
    this.byteView[this.offset++] = (len & 0xFF0000) >> 16;
  }
  for (var i = 0; i < len; i++) {
    this.byteView[this.offset++] = bytes[i];
  }

  // Padding
  while (this.offset % 4) {
    this.byteView[this.offset++] = 0;
  }
}

TLSerialization.prototype.storeIntBytes = function (bytes, bits, field) {
  var len = bytes.length;
  if ((bits % 32) || (len * 8) != bits) {
    throw new Error('Invalid bits: ' + bits + ', ' + bytes.length);
  }

  this.debug && dLog('>>>', bytesToHex(bytes), (field || '') + ':int' + bits);
  this.checkLength(len);

  for (var i = 0; i < len; i++) {
    this.byteView[this.offset++] = bytes[i];
  }
};

TLSerialization.prototype.storeRawBytes = function (bytes, field) {
  var len = bytes.length;

  this.debug && dLog('>>>', bytesToHex(bytes), (field || ''));
  this.checkLength(len);

  for (var i = 0; i < len; i++) {
    this.byteView[this.offset++] = bytes[i];
  }
};


TLSerialization.prototype.storeMethod = function (methodName, params) {
  var schema = this.mtproto ? Config.Schema.MTProto : Config.Schema.API,
      methodData = false,
      i;

  for (i = 0; i < schema.methods.length; i++) {
    if (schema.methods[i].method == methodName) {
      methodData = schema.methods[i];
      break
    }
  }
  if (!methodData) {
    throw new Error('No method ' + methodName + ' found');
  }

  this.storeInt(intToUint(methodData.id), methodName + '[id]');

  var self = this;
  angular.forEach(methodData.params, function (param) {
    self.storeObject(params[param.name], param.type, methodName + '[' + param.name + ']');
  });
};

TLSerialization.prototype.storeObject = function (obj, type, field) {
  switch (type) {
    case 'int':    return this.storeInt(obj,  field);
    case 'long':   return this.storeLong(obj,  field);
    case 'int128': return this.storeIntBytes(obj, 128, field);
    case 'int256': return this.storeIntBytes(obj, 256, field);
    case 'int512': return this.storeIntBytes(obj, 512, field);
    case 'string': return this.storeString(obj,   field);
    case 'bytes':  return this.storeBytes(obj,  field);
    case 'double': return this.storeDouble(obj,   field);
    case 'Bool':   return this.storeBool(obj,   field);
  }

  if (angular.isArray(obj)) {
    if (type.substr(0, 6) == 'Vector') {
      this.writeInt(0x1cb5c415, field + '[id]');
    }
    else if (type.substr(0, 6) != 'vector') {
      throw new Error('Invalid vector type ' + type);
    }
    var itemType = type.substr(7, type.length - 8); // for "Vector<itemType>"
    this.writeInt(obj.length, field + '[count]');
    for (var i = 0; i < obj.length; i++) {
      this.storeObject(obj[i], itemType, field + '[' + i + ']');
    }
    return true;
  }
  else if (type.substr(0, 6).toLowerCase() == 'vector') {
    throw new Error('Invalid vector object');
  }

  if (!angular.isObject(obj)) {
    throw new Error('Invalid object for type ' + type);
  }

  var schema = this.mtproto ? Config.Schema.MTProto : Config.Schema.API,
      predicate = obj['_'],
      isBare = false,
      constructorData = false,
      i;

  if (isBare = (type.charAt(0) == '%')) {
    type = type.substr(1);
  }

  for (i = 0; i < schema.constructors.length; i++) {
    if (schema.constructors[i].predicate == predicate) {
      constructorData = schema.constructors[i];
      break
    }
  }
  if (!constructorData) {
    throw new Error('No predicate ' + predicate + ' found');
  }

  if (predicate == type) {
    isBare = true;
  }

  if (!isBare) {
    this.writeInt(intToUint(constructorData.id), field + '[' + predicate + '][id]');
  }

  var self = this;
  angular.forEach(constructorData.params, function (param) {
    self.storeObject(obj[param.name], param.type, field + '[' + predicate + '][' + param.name + ']');
  });
};



function TLDeserialization (buffer, options) {
  options = options || {};

  this.offset = 0; // in bytes

  this.buffer = buffer;
  this.intView  = new Uint32Array(this.buffer);
  this.byteView = new Uint8Array(this.buffer);

  // this.debug = options.debug !== undefined ? options.debug : true;
  this.mtproto = options.mtproto || false;
  return this;
}

TLDeserialization.prototype.readInt = function (field) {
  if (this.offset >= this.intView.length * 4) {
    throw new Error('Nothing to fetch');
  }

  var i = this.intView[this.offset / 4];

  this.debug && dLog('<<<', i.toString(16), i, field);

  this.offset += 4;

  return i;
};

TLDeserialization.prototype.fetchInt = function (field) {
  return this.readInt((field || '') + ':int');
}

TLDeserialization.prototype.fetchDouble = function (field) {
  var buffer     = new ArrayBuffer(8);
  var intView    = new Int32Array(buffer);
  var doubleView = new Float64Array(buffer);

  intView[0] = this.readInt((field || '') + ':double[low]'),
  intView[1] = this.readInt((field || '') + ':double[high]');

  return doubleView[0];
};

TLDeserialization.prototype.fetchLong = function (field) {
  var iLow = this.readInt((field || '') + ':long[low]'),
      iHigh = this.readInt((field || '') + ':long[high]');

  var longDec = bigint(iHigh).shiftLeft(32).add(bigint(iLow)).toString();

  return longDec;
}

TLDeserialization.prototype.fetchBool = function (field) {
  var i = this.readInt((field || '') + ':bool');
  if (i == 0x997275b5) {
    return true;
  } else if (i == 0xbc799737) {
    return false
  }
  throw new Error('Unknown Bool constructor ' + i);
}

TLDeserialization.prototype.fetchString = function (field) {
  var len = this.byteView[this.offset++];

  if (len == 254) {
    var len = this.byteView[this.offset++] |
              (this.byteView[this.offset++] << 8) |
              (this.byteView[this.offset++] << 16);
  }

  var sUTF8 = '';
  for (var i = 0; i < len; i++) {
    sUTF8 += String.fromCharCode(this.byteView[this.offset++]);
  }

  // Padding
  while (this.offset % 4) {
    this.offset++;
  }

  try {
    var s = decodeURIComponent(escape(sUTF8));
  } catch (e) {
    var s = sUTF8;
  }

  this.debug && dLog('<<<', s, (field || '') + ':string');

  return s;
}


TLDeserialization.prototype.fetchBytes = function (field) {
  var len = this.byteView[this.offset++];

  if (len == 254) {
    var len = this.byteView[this.offset++] |
              (this.byteView[this.offset++] << 8) |
              (this.byteView[this.offset++] << 16);
  }

  var bytes = [];
  for (var i = 0; i < len; i++) {
    bytes.push(this.byteView[this.offset++]);
  }

  // Padding
  while (this.offset % 4) {
    this.offset++;
  }

  this.debug && dLog('<<<', bytesToHex(bytes), (field || '') + ':bytes');

  return bytes;
}

TLDeserialization.prototype.fetchIntBytes = function (bits, field) {
  if (bits % 32) {
    throw new Error('Invalid bits: ' + bits);
  }

  var len = bits / 8;
  var bytes = [];
  for (var i = 0; i < len; i++) {
    bytes.push(this.byteView[this.offset++]);
  }

  this.debug && dLog('<<<', bytesToHex(bytes), (field || '') + ':int' + bits);

  return bytes;
};


TLDeserialization.prototype.fetchRawBytes = function (len, field) {
  if (len === false) {
    len = this.readInt((field || '') + '_length');
  }

  var bytes = [];
  for (var i = 0; i < len; i++) {
    bytes.push(this.byteView[this.offset++]);
  }

  this.debug && dLog('<<<', bytesToHex(bytes), (field || ''));

  return bytes;
};

TLDeserialization.prototype.fetchObject = function (type, field) {
  switch (type) {
    case 'int':    return this.fetchInt(field);
    case 'long':   return this.fetchLong(field);
    case 'int128': return this.fetchIntBytes(128, field);
    case 'int256': return this.fetchIntBytes(256, field);
    case 'int512': return this.fetchIntBytes(512, field);
    case 'string': return this.fetchString(field);
    case 'bytes':  return this.fetchBytes(field);
    case 'double': return this.fetchDouble(field);
    case 'Bool':   return this.fetchBool(field);
  }

  field = field || type || 'Object';

  if (type.substr(0, 6) == 'Vector' || type.substr(0, 6) == 'vector') {
    if (type.charAt(0) == 'V') {
      var constructor = this.readInt(field + '[id]');
      if (constructor != 0x1cb5c415) {
        throw new Error('Invalid vector constructor ' + constructor);
      }
    }
    var len = this.readInt(field + '[count]');
    var result = [];
    if (len > 0) {
      var itemType = type.substr(7, type.length - 8); // for "Vector<itemType>"
      for (var i = 0; i < len; i++) {
        result.push(this.fetchObject(itemType, field + '[' + i + ']'))
      }
    }

    return result;
  }

  var schema = this.mtproto ? Config.Schema.MTProto : Config.Schema.API,
      predicate = false,
      constructorData = false;

  if (type.charAt(0) == '%') {
    var checkType = type.substr(1);
    for (i = 0; i < schema.constructors.length; i++) {
      if (schema.constructors[i].type == checkType) {
        constructorData = schema.constructors[i];
        break
      }
    }
    if (!constructorData) {
      throw new Error('Constructor not found for type: ' + type);
    }
  }
  else if (type.charAt(0) >= 97 && type.charAt(0) <= 122) {
    for (i = 0; i < schema.constructors.length; i++) {
      if (schema.constructors[i].predicate == type) {
        constructorData = schema.constructors[i];
        break
      }
    }
    if (!constructorData) {
      throw new Error('Constructor not found for predicate: ' + type);
    }
  }
  else {
    var constructor = this.readInt(field + '[id]'),
        constructorCmp = uintToInt(constructor);

    if (constructorCmp == 0x3072cfa1) { // Gzip packed
      var compressed = this.fetchBytes(field + '[packed_string]'),
          uncompressed = gzipUncompress(compressed),
          buffer = bytesToArrayBuffer(uncompressed),
          newDeserializer = (new TLDeserialization(buffer));

      return newDeserializer.fetchObject(type, field);
    }

    for (i = 0; i < schema.constructors.length; i++) {
      if (schema.constructors[i].id == constructorCmp) {
        constructorData = schema.constructors[i];
        break;
      }
    }

    var fallback = false;
    if (!constructorData && this.mtproto) {
      var schemaFallback = Config.Schema.API;
      for (i = 0; i < schemaFallback.constructors.length; i++) {
        if (schemaFallback.constructors[i].id == constructorCmp) {
          constructorData = schemaFallback.constructors[i];

          delete this.mtproto;
          fallback = true;
          break;
        }
      }
    }
    if (!constructorData) {
      throw new Error('Constructor not found: ' + constructor);
    }
  }

  predicate = constructorData.predicate;

  var result = {'_': predicate};

  var self = this;
  angular.forEach(constructorData.params, function (param) {
    result[param.name] = self.fetchObject(param.type, field + '[' + predicate + '][' + param.name + ']');
  });

  if (fallback) {
    this.mtproto = true;
  }

  return result;
};

TLDeserialization.prototype.getOffset = function () {
  return this.offset;
};

TLDeserialization.prototype.fetchEnd = function () {
  if (this.offset != this.byteView.length) {
    throw new Error('Fetch end with non-empty buffer');
  }
  return true;
};

if (typeof angular != 'undefined') angular.module('mtproto.services', ['myApp.services']).

factory('MtpDcConfigurator', function () {
  var dcOptions = window._testMode
    ? [
      {id: 1, host: '173.240.5.253', port: 80},
      {id: 2, host: '95.142.192.65', port: 80},
      {id: 3, host: '174.140.142.5', port: 80}
    ]
    : [
      {id: 1, host: '173.240.5.1',   port: 80},
      {id: 2, host: '95.142.192.66', port: 80},
      {id: 3, host: '174.140.142.6', port: 80},
      {id: 4, host: '31.210.235.12', port: 80},
      {id: 5, host: '116.51.22.2',   port: 80},
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
}).

factory('MtpRsaKeysManager', function () {

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

      var fingerprint = new BigInteger(fingerprintBytes).toString(16);

      publicKeysParsed[fingerprint] = {
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
      fingerprintHex = new BigInteger(fingerprints[i], 10).toString(16);
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
}).

service('MtpSecureRandom', SecureRandom).

factory('MtpMessageIdGenerator', function (AppConfigManager) {
  var lastMessageID = [0, 0],
      timeOffset = 0;

  AppConfigManager.get('server_time_offset').then(function (to) {
    if (to) {
      timeOffset = to;
    }
  });

  function generateMessageID () {
    var timeTicks = +new Date() + timeOffset,
        timeSec   = Math.floor(timeTicks / 1000),
        timeMSec  = timeTicks % 1000,
        random    = nextRandomInt(0xFFFF);

    var messageID = [timeSec, (timeMSec << 21) | (random << 3) | 4];
    if (lastMessageID[0] > messageID[0] ||
        lastMessageID[0] == messageID[0] && lastMessageID[1] >= messageID[1]) {

      messageID = [lastMessageID[0], lastMessageID[1] + 4];
    }

    lastMessageID = messageID;

    // dLog('generated msg id', messageID);

    return longFromInts(messageID[0], messageID[1]);
  };

  function applyServerTime (serverTime, localTime) {
    timeOffset = serverTime - Math.floor((localTime || +new Date()) / 1000);
    AppConfigManager.set({server_time_offset: timeOffset});
  };

  return {
    generateID: generateMessageID,
    applyServerTime: applyServerTime
  };
}).

factory('MtpAuthorizer', function (MtpDcConfigurator, MtpRsaKeysManager, MtpSecureRandom, MtpMessageIdGenerator, $http, $q, $timeout) {

  function mtpSendPlainRequest (dcID, requestBuffer) {
    var requestLength = requestBuffer.byteLength,
        requestArray  = new Int32Array(requestBuffer);

    var header = new TLSerialization();
    header.storeLongP(0, 0, 'auth_key_id'); // Auth key
    header.storeLong(MtpMessageIdGenerator.generateID(), 'msg_id'); // Msg_id
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

    return $http.post('http://' + MtpDcConfigurator.chooseServer(dcID) + '/apiw1', resultArray, {
      responseType: 'arraybuffer',
      transformRequest: null,
      transformResponse: function (responseBuffer) {
        var deserializer = new TLDeserialization(responseBuffer, {mtproto: true});

        var auth_key_id = deserializer.fetchLong('auth_key_id');
        var msg_id      = deserializer.fetchLong('msg_id');
        var msg_len     = deserializer.fetchInt('msg_len');

        rng_seed_time();

        return deserializer;
      }
    });
  };

  function mtpSendReqPQ (auth) {
    var deferred = auth.deferred;

    var request = new TLSerialization({mtproto: true});

    request.storeMethod('req_pq', {nonce: auth.nonce});

    mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (result) {
      var deserializer = result.data;
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

      // dLog('ResPQ', bytesToHex(auth.serverNonce), bytesToHex(auth.pq), auth.fingerprints);

      auth.publicKey = MtpRsaKeysManager.select(auth.fingerprints);

      if (!auth.publicKey) {
        throw new Error('No public key found');
      }

      if (!!window.Worker) {
        var worker = new Worker('js/lib/pq_worker.js');

        worker.onmessage = function (e) {
          auth.p = e.data[0];
          auth.q = e.data[1];
          mtpSendReqDhParams(auth);
        };
        worker.onerror = function(error) {
          dLog('Worker error', error);
          deferred.reject(error);
        };
        worker.postMessage(auth.pq)
      } else {
        var pAndQ = pqPrimeFactorization(auth.pq);
        auth.p = pAndQ[0];
        auth.q = pAndQ[1];

        mtpSendReqDhParams(auth);
      }
    }, function (error) {
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

    mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (result) {
      var deserializer = result.data;
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
    auth.localTime = +new Date();

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

    auth.g          = response.g;
    auth.dhPrime    = response.dh_prime;
    auth.gA         = response.g_a;
    auth.serverTime = response.server_time;
    auth.retry      = 0;

    var offset = deserializer.getOffset();

    if (!bytesCmp(hash, sha1Hash(answerWithPadding.slice(0, offset)))) {
      throw new Error('server_DH_inner_data SHA1-hash mismatch');
    }

    MtpMessageIdGenerator.applyServerTime(auth.serverTime, auth.localTime);
  };

  function mtpSendSetClientDhParams(auth) {
    var deferred = auth.deferred;

    auth.b = new Array(256);
    MtpSecureRandom.nextBytes(auth.b);

    var bBigInt = new BigInteger(auth.b);
    var dhPrimeBigInt = new BigInteger(auth.dhPrime);

    var gB = bytesFromBigInt(bigint(auth.g).modPow(bBigInt, dhPrimeBigInt));

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

    mtpSendPlainRequest(auth.dcID, request.getBuffer()).then(function (result) {
      var deserializer = result.data;
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

      var bBigInt = new BigInteger(auth.b);
      var dhPrimeBigInt = new BigInteger(auth.dhPrime);

      var authKey =  bytesFromBigInt((new BigInteger(auth.gA)).modPow(bBigInt, dhPrimeBigInt)),
          authKeyHash = sha1Hash(authKey),
          authKeyAux  = authKeyHash.slice(0, 8),
          authKeyID   = authKeyHash.slice(-8);

      switch (response._) {
        case 'dh_gen_ok':
          var newNonceHash1 = sha1Hash(auth.newNonce.concat([1], authKeyAux)).slice(-16);

          if (!bytesCmp(newNonceHash1, response.new_nonce_hash1)) {
            deferred.reject(new Error('Set_client_DH_params_answer new_nonce_hash1 mismatch'));
            return false;
          }

          var serverSalt = bytesXor(auth.newNonce.slice(0, 8), auth.serverNonce.slice(0, 8));
          // dLog('Auth successfull!', authKeyID, authKey, serverSalt);

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
    });
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

    return cached[dcID] = auth.deferred.promise;
  };

  return {
    auth: mtpAuth
  };

}).

factory('MtpAesService', function ($q) {
  if (!window.Worker/* || true*/) {
    return {
      encrypt: function (bytes, keyBytes, ivBytes) {
        return $q.when(aesEncrypt(bytes, keyBytes, ivBytes));
      },
      decrypt: function (encryptedBytes, keyBytes, ivBytes) {
        return $q.when(aesDecrypt(encryptedBytes, keyBytes, ivBytes));
      }
    };
  }

  var worker = new Worker('js/lib/aes_worker.js'),
      taskID = 0,
      awaiting = {};

  worker.onmessage = function (e) {
    var deferred = awaiting[e.data.taskID];
    if (deferred !== undefined) {
      deferred.resolve(e.data.result);
      delete awaiting[e.data.taskID];
    }
    // dLog('AES worker message', e.data, deferred);
  };
  worker.onerror = function(error) {
    dLog('AES Worker error', error);
  };

  return {
    encrypt: function (bytes, keyBytes, ivBytes) {
      var deferred = $q.defer();

      awaiting[taskID] = deferred;

      // dLog('AES post message', {taskID: taskID, task: 'encrypt', bytes: bytes, keyBytes: keyBytes, ivBytes: ivBytes})
      worker.postMessage({taskID: taskID, task: 'encrypt', bytes: bytes, keyBytes: keyBytes, ivBytes: ivBytes});

      taskID++

      return deferred.promise;
    },
    decrypt: function (encryptedBytes, keyBytes, ivBytes) {
      var deferred = $q.defer();

      awaiting[taskID] = deferred;
      worker.postMessage({taskID: taskID, task: 'decrypt', encryptedBytes: encryptedBytes, keyBytes: keyBytes, ivBytes: ivBytes});

      taskID++;

      return deferred.promise;
    }
  }
}).


factory('MtpSha1Service', function ($q) {
  if (!window.Worker/* || true*/) {
    return {
      hash: function (bytes) {
        return $q.when(sha1Hash(bytes));
      }
    };
  }

  var worker = new Worker('js/lib/sha1_worker.js'),
      taskID = 0,
      awaiting = {};

  worker.onmessage = function (e) {
    var deferred = awaiting[e.data.taskID];
    if (deferred !== undefined) {
      deferred.resolve(e.data.result);
      delete awaiting[e.data.taskID];
    }
    // dLog('sha1 got message', e.data, deferred);
  };
  worker.onerror = function(error) {
    dLog('SHA-1 Worker error', error);
  };

  return {
    hash: function (bytes) {
      var deferred = $q.defer();

      awaiting[taskID] = deferred;
      // dLog(11, taskID, bytes);
      worker.postMessage({taskID: taskID, bytes: bytes});

      taskID++;

      return deferred.promise;
    }
  }
}).

factory('MtpNetworkerFactory', function (MtpDcConfigurator, MtpMessageIdGenerator, MtpSecureRandom, MtpSha1Service, MtpAesService, AppConfigManager, $http, $q, $timeout) {

  var updatesProcessor;

  function MtpNetworker(dcID, authKey, serverSalt) {
    this.dcID = dcID;

    this.authKey = authKey;
    this.authKeyID = sha1Hash(authKey).slice(-8);

    this.serverSalt = serverSalt;

    // if (1 == dcID) {
    //   var self = this;
    //   (function () {
    //     dLog('update server salt');
    //     self.serverSalt = [0,0,0,0,0,0,0,0];
    //     setTimeout(arguments.callee, nextRandomInt(2000, 12345));
    //   })();
    // }

    this.sessionID = new Array(8);
    MtpSecureRandom.nextBytes(this.sessionID);

    if (false) {
      this.sessionID[0] = 0xAB;
      this.sessionID[1] = 0xCD;
    }

    this.seqNo = 0;
    this.currentRequests = 0;

    this.sentMessages = {};
    this.serverMessages = [];
    this.clientMessages = [];

    this.pendingMessages = {};
    this.pendingAcks = [];
    this.pendingResends = [];
    this.connectionInited = false;

    this.pendingTimeouts = [];

    this.longPollInt = setInterval(this.checkLongPoll.bind(this), 10000);
    this.checkLongPoll();
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

    var messageID = MtpMessageIdGenerator.generateID(),
        seqNo = this.generateSeqNo(),
        message = {
      msg_id: messageID,
      seq_no: seqNo,
      body: serializer.getBytes()
    };

    // dLog('MT call', method, params, messageID, seqNo);

    return this.pushMessage(message, options);
  };

  MtpNetworker.prototype.wrapMtpMessage = function (object, options) {
    options = options || {};

    var serializer = new TLSerialization({mtproto: true});
    serializer.storeObject(object, 'Object');

    var messageID = MtpMessageIdGenerator.generateID(),
        seqNo = this.generateSeqNo(options.notContentRelated),
        message = {
      msg_id: messageID,
      seq_no: seqNo,
      body: serializer.getBytes()
    };

    // dLog('MT message', object, messageID, seqNo);

    return this.pushMessage(message, options);
  };

  MtpNetworker.prototype.wrapApiCall = function (method, params, options) {
    var serializer = new TLSerialization(options);

    if (!this.connectionInited) {
      serializer.storeInt(962726977, 'InokeWithLayer10');
      serializer.storeInt(0x69796de9, 'initConnection');
      serializer.storeInt(777, 'api_id');
      serializer.storeString(navigator.userAgent || 'Unknown UserAgent', 'device_model');
      serializer.storeString(navigator.platform  || 'Unknown Platform', 'system_version');
      serializer.storeString('0.1', 'app_version');
      serializer.storeString(navigator.language || 'en', 'lang_code');
    }

    serializer.storeMethod(method, params);

    var messageID = MtpMessageIdGenerator.generateID(),
        seqNo = this.generateSeqNo(),
        message = {
      msg_id: messageID,
      seq_no: seqNo,
      body: serializer.getBytes(),
      isAPI: true
    };

    dLog('Api call', method, messageID, seqNo);
    // dLog('Api call', method, params, messageID, seqNo);

    return this.pushMessage(message, options);
  };

  MtpNetworker.prototype.checkLongPoll = function(force) {
    var isClean = this.cleanupSent();
    // dLog('Check lp', this.longPollPending, (new Date().getTime()));
    if (this.longPollPending && (new Date().getTime()) < this.longPollPending) {
      return false;
    }
    var self = this;
    AppConfigManager.get('dc').then(function (baseDcID) {
      if (baseDcID != self.dcID && isClean) {
        // console.warn('send long-poll for guest DC is delayed', self.dcID);
        return;
      }
      self.sendLongPoll();
    });
  };

  MtpNetworker.prototype.sendLongPoll = function() {
    var maxWait = 25000;
    this.longPollPending = (new Date().getTime()) + maxWait;
    // dLog('Set lp', this.longPollPending, (new Date().getTime()));

    this.wrapMtpCall('http_wait', {max_delay: 0, wait_after: 0, max_wait: maxWait}, {noResponse: true}).
      then((function () {
        delete this.longPollPending;
        setTimeout(this.checkLongPoll.bind(this), 0);
      }).bind(this));
  };

  MtpNetworker.prototype.pushMessage = function(message, options) {
    var deferred = $q.defer();

    this.sentMessages[message.msg_id] = angular.extend(message, options || {}, {deferred: deferred});
    this.pendingMessages[message.msg_id] = 0;

    if (!options || !options.noShedule) {
      this.sheduleRequest();
    }

    return deferred.promise;
  };

  MtpNetworker.prototype.pushResend = function(messageID, delay) {
    var value = delay ? (new Date()).getTime() + delay : 0;
    var sentMessage = this.sentMessages[messageID];
    if (sentMessage.container) {
      for (var i = 0; i < sentMessage.inner.length; i++) {
        this.pendingMessages[sentMessage.inner[i]] = value;
      }
    } else {
      this.pendingMessages[messageID] = value;
    }

    // dLog('Resend due', messageID, this.pendingMessages);

    this.sheduleRequest(delay);
  };

  MtpNetworker.prototype.getMsgKeyIv = function (msgKey, isOut) {
    var authKey = this.authKey,
        x = isOut ? 0 : 8;

    var promises = {
      sha1a: MtpSha1Service.hash(msgKey.concat(authKey.slice(x, x + 32))),
      sha1b: MtpSha1Service.hash(authKey.slice(32 + x, 48 + x).concat(msgKey, authKey.slice(48 + x, 64 + x))),
      sha1c: MtpSha1Service.hash(authKey.slice(64 + x, 96 + x).concat(msgKey)),
      sha1d: MtpSha1Service.hash(msgKey.concat(authKey.slice(96 + x, 128 + x)))
    };

    return $q.all(promises).then(function (result) {
      var aesKey = result.sha1a.slice(0, 8).concat(result.sha1b.slice(8, 20), result.sha1c.slice(4, 16));
      var aesIv  = result.sha1a.slice(8, 20).concat(result.sha1b.slice(0, 8), result.sha1c.slice(16, 20), result.sha1d.slice(0, 8));

      return [aesKey, aesIv];
    });
  };


  MtpNetworker.prototype.performSheduledRequest = function() {
    // dLog('start sheduled');
    delete this.nextReq;
    if (this.pendingAcks.length) {
      var ackMsgIDs = [];
      for (var i = 0; i < this.pendingAcks.length; i++) {
        ackMsgIDs.push(this.pendingAcks[i]);
      }
      // dLog('acking messages', ackMsgIDs);
      this.wrapMtpMessage({_: 'msgs_ack', msg_ids: ackMsgIDs}, {notContentRelated: true, noShedule: true});
    }

    if (this.pendingResends.length) {
      var resendMsgIDs = [];
      for (var i = 0; i < this.pendingResends.length; i++) {
        resendMsgIDs.push(this.pendingResends[i]);
      }
      // dLog('resendReq messages', resendMsgIDs);
      this.wrapMtpMessage({_: 'msg_resend_req', msg_ids: resendMsgIDs}, {noShedule: true});
    }

    var messages = [],
        message,
        messagesByteLen = 0,
        currentTime = (new Date()).getTime(),
        self = this;

    angular.forEach(this.pendingMessages, function (value, messageID) {
      if (!value || value >= currentTime) {
        if (message = self.sentMessages[messageID]) {
          messages.push(message);
          messagesByteLen += message.body.length + 32;
        } else {
          // dLog(message, messageID);
        }
        delete self.pendingMessages[messageID];
      }
    });

    if (!messages.length) {
      // dLog('no sheduled messages');
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
        msg_id: MtpMessageIdGenerator.generateID(),
        seq_no: this.generateSeqNo(true),
        container: true,
        inner: innerMessages
      }

      message = angular.extend({body: container.getBytes()}, containerSentMessage);

      this.sentMessages[message.msg_id] = containerSentMessage;

      // dLog('Container', innerMessages, message.msg_id, message.seq_no);
    } else {
      if (message.noResponse) {
        noResponseMsgs.push(message.msg_id);
      }
      this.sentMessages[message.msg_id] = message;
    }

    this.pendingAcks = [];

    var self = this;
    this.sendEncryptedRequest(message).then(function (result) {
      self.parseResponse(result.data).then(function (response) {
        // dLog('Server response', self.dcID, response);

        self.processMessage(response.response, response.messageID, response.sessionID);

        angular.forEach(noResponseMsgs, function (msgID) {
          if (self.sentMessages[msgID]) {
            var deferred = self.sentMessages[msgID].deferred;
            delete self.sentMessages[msgID];
            deferred.resolve();
          }
        });

        self.checkLongPoll();
      });
    });
  };

  MtpNetworker.prototype.getEncryptedMessage = function (bytes) {
    var self = this;

    // dLog('enc', bytes);

    return MtpSha1Service.hash(bytes).then(function (bytesHash) {
      // dLog('bytesHash', bytesHash);
      var msgKey = bytesHash.slice(-16);
      return self.getMsgKeyIv(msgKey, true).then(function (keyIv) {
        // dLog('keyIv', keyIv);
        return MtpAesService.encrypt(bytes, keyIv[0], keyIv[1]).then(function (encryptedBytes) {
          // dLog('encryptedBytes', encryptedBytes);
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
      return MtpAesService.decrypt(encryptedData, keyIv[0], keyIv[1]);
    });
  };

  MtpNetworker.prototype.sendEncryptedRequest = function (message) {
    var self = this;
    // dLog('send encrypted', message);
    // console.trace();
    var data = new TLSerialization({startMaxLength: message.body.length + 64});

    data.storeIntBytes(this.serverSalt, 64, 'salt');
    data.storeIntBytes(this.sessionID, 64, 'session_id');

    data.storeLong(message.msg_id, 'message_id');
    data.storeInt(message.seq_no, 'seq_no');

    data.storeInt(message.body.length, 'message_data_length');
    data.storeRawBytes(message.body, 'message_data');

    return this.getEncryptedMessage(data.getBytes()).then(function (encryptedResult) {
      // dLog('got enc result', encryptedResult);
      var request = new TLSerialization({startMaxLength: encryptedResult.bytes.length + 256});
      request.storeIntBytes(self.authKeyID, 64, 'auth_key_id');
      request.storeIntBytes(encryptedResult.msgKey, 128, 'msg_key');
      request.storeRawBytes(encryptedResult.bytes, 'encrypted_data');

      delete $http.defaults.headers.post['Content-Type'];
      delete $http.defaults.headers.common['Accept'];

      return $http.post('http://' + MtpDcConfigurator.chooseServer(self.dcID) + '/apiw1', request.getArray(), {
        responseType: 'arraybuffer',
        transformRequest: null
      });
    });
  };

  MtpNetworker.prototype.parseResponse = function (responseBuffer) {
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

      return MtpSha1Service.hash(dataWithPadding.slice(0, offset)).then(function (dataHashed) {
        if (!bytesCmp(msgKey, dataHashed.slice(-16))) {
          throw new Error('server msgKey mismatch');
        }

        var buffer = bytesToArrayBuffer(messageBody);
        var deserializer = new TLDeserialization(buffer, {mtproto: true});

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
    AppConfigManager.set(storeObj);

    this.serverSalt = serverSalt;
    return true;
  };

  MtpNetworker.prototype.sheduleRequest = function (delay) {
    var nextReq = new Date() + delay;

    if (delay && this.nextReq && this.nextReq <= nextReq) {
      return false;
    }

    // dLog('shedule req', delay);
    // console.trace();

    clearTimeout(this.nextReqTO);

    this.nextReqTO = setTimeout(this.performSheduledRequest.bind(this), delay || 0);
    this.nextReq = nextReq;
  };

  MtpNetworker.prototype.onSessionCreate = function (sessionID, messageID) {
    dLog('New session created', bytesToHex(sessionID));
  };

  MtpNetworker.prototype.ackMessage = function (msgID) {
    // dLog('ack message', msgID);
    this.pendingAcks.push(msgID);
    this.sheduleRequest(30000);
  };

  MtpNetworker.prototype.reqResendMessage = function (msgID) {
    dLog('req resend', msgID);
    this.pendingResends.push(msgID);
    this.sheduleRequest(100);
  };

  MtpNetworker.prototype.cleanupSent = function () {
    var self = this;
    var notEmpty = false;
    // dLog('clean start', this.dcID/*, this.sentMessages*/);
    angular.forEach(this.sentMessages, function(message, msgID) {
      // dLog('clean iter', msgID, message);
      if (message.notContentRelated && self.pendingMessages[msgID] === undefined) {
        // dLog('clean notContentRelated', msgID);
        delete self.sentMessages[msgID];
      }
      else if (message.container) {
        for (var i = 0; i < message.inner.length; i++) {
          if (self.sentMessages[message.inner[i]] !== undefined) {
            // dLog('clean failed, found', msgID, message.inner[i], self.sentMessages[message.inner[i]].seq_no);
            notEmpty = true;
            return;
          }
        }
        // dLog('clean container', msgID);
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
    // dLog('process message', message, messageID, sessionID);
    switch (message._) {
      case 'msg_container':
        var len = message.messages.length;
        for (var i = 0; i < len; i++) {
          this.processMessage(message.messages[i], messageID, sessionID);
        }
        break;

      case 'bad_server_salt':
        dLog('bad server salt', message);
        var sentMsg = this.sentMessages[message.bad_msg_id];
        if (!sentMsg || sentMsg.seq_no != message.bad_msg_seqno) {
          dLog(message.bad_msg_id, message.bad_msg_seqno);
          throw new Error('Bad server salt for invalid message');
        }

        this.applyServerSalt(message.new_server_salt);
        this.pushResend(message.bad_msg_id);
        this.ackMessage(messageID);
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

      case 'rpc_result':
        this.ackMessage(messageID);

        var sentMessageID = message.req_msg_id,
            sentMessage = this.sentMessages[sentMessageID];

        this.processMessageAck(sentMessageID);
        if (sentMessage) {
          var deferred = sentMessage.deferred;
          if (message.result._ == 'rpc_error') {
            var error = this.processError(message.result);
            dLog('rpc error', error)
            if (deferred) {
              deferred.reject(error)
            }
          } else {
            if (deferred) {
              dLog('rpc response', message.result._);
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

        // dLog('Update', message);
        if (updatesProcessor) {
          updatesProcessor(message);
        }
        break;

    }
  };

  return {
    getNetworker: function (dcID, authKey, serverSalt) {
      return new MtpNetworker(dcID, authKey, serverSalt);
    },
    setUpdatesProcessor: function (callback) {
      updatesProcessor = callback;
    }
  };

}).

factory('MtpApiManager', function (AppConfigManager, MtpAuthorizer, MtpNetworkerFactory, $q) {
  var cachedNetworkers = {},
      cachedExportPromise = {},
      baseDcID = false;

  AppConfigManager.get('dc').then(function (dcID) {
    if (dcID) {
      baseDcID = dcID;
    }
  });

  function mtpSetUserAuth (dcID, userAuth) {
    AppConfigManager.set({
      dc: dcID,
      user_auth: angular.extend({dcID: dcID}, userAuth)
    });

    baseDcID = dcID;
  }

  function mtpLogOut () {
    return mtpInvokeApi('auth.logOut').then(function () {
      AppConfigManager.remove('dc', 'user_auth');

      baseDcID = false;
    });
  }

  function mtpGetNetworker (dcID) {
    if (!dcID) {
      throw new Exception('get Networker without dcID');
    }

    if (cachedNetworkers[dcID] !== undefined) {
      return $q.when(cachedNetworkers[dcID]);
    }

    var akk = 'dc' + dcID + '_auth_key',
        ssk = 'dc' + dcID + '_server_salt';

    return AppConfigManager.get(akk, ssk).then(function (result) {

      if (cachedNetworkers[dcID] !== undefined) {
        return cachedNetworkers[dcID];
      }

      var authKeyHex = result[0],
          serverSaltHex = result[1];
      // dLog('ass', dcID, authKeyHex, serverSaltHex);
      if (authKeyHex && authKeyHex.length == 512) {
        var authKey    = bytesFromHex(authKeyHex);
        var serverSalt = bytesFromHex(serverSaltHex);

        return cachedNetworkers[dcID] = MtpNetworkerFactory.getNetworker(dcID, authKey, serverSalt);
      }

      return MtpAuthorizer.auth(dcID).then(function (auth) {
        var storeObj = {};
        storeObj[akk] = bytesToHex(auth.authKey);
        storeObj[ssk] = bytesToHex(auth.serverSalt);
        AppConfigManager.set(storeObj);

        return cachedNetworkers[dcID] = MtpNetworkerFactory.getNetworker(dcID, auth.authKey, auth.serverSalt);
      }, function (error) {
        dLog('Get networker error', error, error.stack);
        return $q.reject(error);
      });
    });
  };

  function mtpInvokeApi (method, params, options) {
    options = options || {};

    var deferred = $q.defer(),
        dcID,
        networkerPromise;

    if (dcID = options.dcID) {
      networkerPromise = mtpGetNetworker(dcID);
    } else {
      networkerPromise = AppConfigManager.get('dc').then(function (baseDcID) {
        return mtpGetNetworker(dcID = baseDcID || 1);
      });
    }

    var cachedNetworker;

    networkerPromise.then(function (networker) {
      return (cachedNetworker = networker).wrapApiCall(method, params, options).then(
        function (result) {
          deferred.resolve(result);
          // setTimeout(function () {
          //   deferred.resolve(result);
          // }, 1000);
        },
        function (error) {
          dLog('error', error.code, error.type, baseDcID, dcID);
          if (error.code == 401 && error.type == 'AUTH_KEY_UNREGISTERED' && baseDcID && dcID != baseDcID) {
            if (cachedExportPromise[dcID] === undefined) {
              var exportDeferred = $q.defer();

              mtpInvokeApi('auth.exportAuthorization', {dc_id: dcID}).then(function (exportedAuth) {
                mtpInvokeApi('auth.importAuthorization', {
                  id: exportedAuth.id,
                  bytes: exportedAuth.bytes
                }, {dcID: dcID}).then(function () {
                  exportDeferred.resolve();
                }, function (e) {
                  exportDeferred.reject(e);
                })
              }, function (e) {
                exportDeferred.reject(e)
              });

              cachedExportPromise[dcID] = exportDeferred.promise;
            }

            // dLog('promise', cachedExportPromise[dcID]);

            cachedExportPromise[dcID] = cachedExportPromise[dcID].then(function () {
              (cachedNetworker = networker).wrapApiCall(method, params, options).then(function (result) {
                deferred.resolve(result);
              }, function (error) {
                deferred.reject(error);
              });
            }, function (error) {
              deferred.reject(error);
            });
          }
          else if (error.code == 303) {
            var newDcID = error.type.match(/^(PHONE_MIGRATE_|NETWORK_MIGRATE_)(\d+)/)[2];
            if (newDcID != dcID) {
              if (options.dcID) {
                options.dcID = newDcID;
              } else {
                AppConfigManager.set({dc: baseDcID = newDcID});
              }

              mtpGetNetworker(newDcID).then(function (networker) {
                networker.wrapApiCall(method, params, options).then(function (result) {
                  deferred.resolve(result);
                }, function (error) {
                  deferred.reject(error);
                });
              });
            }
          }
          else {
            deferred.reject(error);
          }
        });
    }, function (error) {
      deferred.reject(error);
    });

    return deferred.promise;
  };

  function mtpGetUserID () {
    return AppConfigManager.get('user_auth').then(function (auth) {
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
    setUserAuth: mtpSetUserAuth,
    logOut: mtpLogOut
  }
}).


factory('MtpApiFileManager', function (MtpApiManager, $q, $window) {

  var cachedFS = false;
  var apiUploadPromise = $q.when();
  var cachedSavePromises = {};
  var cachedDownloadPromises = {};

  var downloadPulls = {};
  var downloadActive = 0;
  var downloadLimit = 5;

  function downloadRequest(dcID, cb, activeDelta) {
    if (downloadPulls[dcID] === undefined) {
      downloadPulls[dcID] = [];
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

    if (downloadActive >= downloadLimit || !downloadPull || !downloadPull.length) {
      return false;
    }

    var data = downloadPull.shift(),
        activeDelta = data.activeDelta || 1;

    downloadActive += activeDelta;

    var a = index++;
    data.cb()
      .then(function (result) {
        downloadActive -= activeDelta;
        downloadCheck(dcID);

        data.deferred.resolve(result);

      }, function (error) {
        downloadActive -= activeDelta;
        downloadCheck(dcID);

        data.deferred.reject(error);
      })
  };

  function requestFS (argument) {
    if (cachedFS) {
      return $q.when(cachedFS);
    }

    $window.requestFileSystem = $window.requestFileSystem || $window.webkitRequestFileSystem;

    if (!$window.requestFileSystem) {
      return $q.reject({type: 'FS_BROWSER_UNSUPPORTED', description: 'requestFileSystem not present'});
    }

    var deferred = $q.defer();

    $window.requestFileSystem($window.TEMPORARY, 5*1024*1024, function (fs) {
      cachedFS = fs;
      deferred.resolve();
    }, function (e) {
      deferred.reject(e);
    });

    return deferred.promise;
  };

  function fileWriteBytes(fileWriter, bytes) {
    var deferred = $q.defer();

    fileWriter.onwriteend = function(e) {
      deferred.resolve();
    };
    fileWriter.onerror = function (e) {
      deferred.reject();
    };

    if (false) { // is file bytes
      fileWriter.write(bytes);
    } else {
      fileWriter.write(new Blob([bytesToArrayBuffer(bytes)]));
    }

    return deferred.promise;
  }

  function getFileName(location) {
    switch (location._) {
      case 'inputVideoFileLocation':
        return 'video' + location.id + '.mp4';

      case 'inputDocumentFileLocation':
        return 'doc' + location.id;
    }
    return location.volume_id + '_' + location.local_id + '_' + location.secret + '.jpg';
  };

  function getTempFileName(file) {
    var size = file.size || -1;
    var random = nextRandomInt(0xFFFFFFFF);
    return '_temp' + random + '_' + size;
  };

  function getCachedFile (location) {
    var fileName = getFileName(location);

    if (cachedSavePromises[fileName]) {
      return cachedSavePromises[fileName];
    }
    var deferred = $q.defer(),
        errorHandler = function (error) {
          deferred.reject();
        };

    requestFS().then(function () {
      cachedFS.root.getFile(fileName, {create: false}, function(fileEntry) {
        deferred.resolve(fileEntry.toURL());
      }, errorHandler);
    }, errorHandler);

    return deferred.promise;
  }

  function saveSmallFile (location, bytes) {
    var fileName = getFileName(location);

    if (cachedSavePromises[fileName]) {
      return cachedSavePromises[fileName];
    }
    var deferred = $q.defer(),
        cacheFileWriter,
        errorHandler = function (error) {
          deferred.reject(error);
          if (cacheFileWriter) cacheFileWriter.truncate();
        };

    requestFS().then(function () {
      cachedFS.root.getFile(fileName, {create: false}, function(fileEntry) {
        deferred.resolve(fileEntry.toURL());
      }, function () {
        cachedFS.root.getFile(fileName, {create: true}, function(fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            cacheFileWriter = fileWriter;
            fileWriteBytes(fileWriter, bytes).then(function () {
              deferred.resolve(fileEntry.toURL());
            }, errorHandler);
          }, errorHandler);
        }, errorHandler);
      });
    }, errorHandler);

    return cachedSavePromises[fileName] = deferred.promise;
  }

  function downloadSmallFile(location) {
    // dLog('dload small', location);
    var fileName = getFileName(location),
        cachedPromise = cachedSavePromises[fileName] || cachedDownloadPromises[fileName];

    if (cachedPromise) {
      return cachedPromise;
    }

    var deferred = $q.defer(),
        cacheFileWriter,
        errorHandler = function (error) {
          deferred.reject(error);
          if (cacheFileWriter) cacheFileWriter.truncate();
        },
        doDownload = function () {
          cachedFS.root.getFile(fileName, {create: true}, function(fileEntry) {
            var downloadPromise = downloadRequest(location.dc_id, function () {
              // dLog('next small promise');
              return MtpApiManager.invokeApi('upload.getFile', {
                location: angular.extend({}, location, {_: 'inputFileLocation'}),
                offset: 0,
                limit: 0
              }, {dcID: location.dc_id});
            });

            fileEntry.createWriter(function (fileWriter) {
              cacheFileWriter = fileWriter;
              downloadPromise.then(function (result) {
                fileWriteBytes(fileWriter, result.bytes).then(function () {
                  // dLog('Success', location, fileEntry.toURL());
                  deferred.resolve(fileEntry.toURL());
                }, errorHandler);
              }, errorHandler);
            }, errorHandler);
          }, errorHandler);
        };

    requestFS().then(function () {
      cachedFS.root.getFile(fileName, {create: false}, function(fileEntry) {
        fileEntry.file(function(file) {
          if (file.size) {
            deferred.resolve(fileEntry.toURL());
          } else {
            dLog('Small file empty', file);
            doDownload();
          }
        }, errorHandler);
      }, doDownload);
    }, function (error) {

      downloadRequest(location.dc_id, function () {
        // dLog('next small promise');
        return MtpApiManager.invokeApi('upload.getFile', {
          location: angular.extend({}, location, {_: 'inputFileLocation'}),
          offset: 0,
          limit: 0
        }, {dcID: location.dc_id});
      }).then(function (result) {
        deferred.resolve('data:image/jpeg;base64,' + bytesToBase64(result.bytes))
      }, errorHandler);
    });

    return cachedDownloadPromises[fileName] = deferred.promise;
  }

  function downloadFile (dcID, location, size, fileEntry) {
    dLog('dload file', dcID, location, size);
    var fileName = getFileName(location),
        cachedPromise = cachedSavePromises[fileName] || cachedDownloadPromises[fileName];

    if (cachedPromise) {
      return cachedPromise;
    }

    var deferred = $q.defer(),
        cacheFileWriter,
        errorHandler = function (error) {
          console.error(error);
          // dLog('fail');
          deferred.reject(error);
          if (cacheFileWriter) cacheFileWriter.truncate();
        },
        saveToFileEntry = function (fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            cacheFileWriter = fileWriter;

            // var limit = size > 102400 ? 65536 : 4096;
            var limit = size > 30400 ? 524288 : 4096;
            // var limit = size > 30400 ? 20480 : 4096;
            var writeFilePromise = $q.when(),
                writeFileDeferred;
            for (var offset = 0; offset < size; offset += limit) {
              writeFileDeferred = $q.defer();
              (function (isFinal, offset, writeFileDeferred, writeFilePromise) {
                return downloadRequest(dcID, function () {
                // dLog('next big promise');
                  return MtpApiManager.invokeApi('upload.getFile', {
                    location: location,
                    offset: offset,
                    limit: limit
                  }, {dcID: dcID});

                }, 6).then(function (result) {

                  // dLog('waiting for file promise', offset);
                  writeFilePromise.then(function () {
                    // dLog('resolved file promise', offset);

                    return fileWriteBytes(fileWriter, result.bytes).then(function () {

                      // dLog('resolve file promise', offset);
                      writeFileDeferred.resolve();

                    }, errorHandler).then(function () {

                      if (isFinal) {
                        deferred.resolve(fileEntry.toURL('image/jpeg'));
                      } else {
                        // dLog('notify', {done: offset + limit, total: size});
                        deferred.notify({done: offset + limit, total: size});
                      };

                    });

                  });

                });

              })(offset + limit >= size, offset, writeFileDeferred, writeFilePromise);

              writeFilePromise = writeFileDeferred.promise;

            }
          }, errorHandler);

        },
        doDownload = function () {
          cachedFS.root.getFile(fileName, {create: true}, saveToFileEntry, errorHandler);
        };

    if (fileEntry) {
      saveToFileEntry(fileEntry);
    } else {
      requestFS().then(function () {
        cachedFS.root.getFile(fileName, {create: false}, function(fileEntry) {
          fileEntry.file(function(file) {
            dLog('check size', file.size, size);
            if (file.size >= size) {
              deferred.resolve(fileEntry.toURL());
            } else {
              dLog('File bad size', file, size);
              doDownload();
            }
          }, errorHandler);
        }, doDownload);
      }, errorHandler);
    }

    return cachedDownloadPromises[fileName] = deferred.promise;
  }

  function writeFile (file) {
    dLog('write file', file);
    var fileName = getTempFileName(file);

    var deferred = $q.defer(),
        cacheFileWriter,
        errorHandler = function (error) {
          dLog('fail');
          deferred.reject(error);
          if (cacheFileWriter) cacheFileWriter.truncate();
        };

    requestFS().then(function () {
      cachedFS.root.getFile(fileName, {create: false}, function(fileEntry) {
        deferred.resolve(fileEntry);
      }, function () {
        cachedFS.root.getFile(fileName, {create: true}, function(fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            cacheFileWriter = fileWriter;
            fileWriteBytes(fileWriter, file).then(function () {
              deferred.resolve(fileEntry);
            }, errorHandler);
          }, errorHandler);
        });
      });
    });
  };

  function uploadFile (file) {
    var fileSize = file.size,
        // partSize = fileSize > 102400 ? 65536 : 4096,
        partSize = fileSize > 102400 ? 524288 : 4096,
        totalParts = Math.ceil(fileSize / partSize),
        doneParts = 0;

    if (totalParts > 1500) {
      return $q.reject({type: 'FILE_TOO_BIG'});
    }

    var fileID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        deferred = $q.defer(),
        errorHandler = function (error) {
          dLog('error', error);
          deferred.reject(error);
        },
        part = 0,
        offset,
        resultInputFile = {
          _: 'inputFile',
          id:fileID,
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
            if (e.target.readyState != FileReader.DONE) {
              return;
            }
            var apiCurPromise = apiUploadPromise = apiUploadPromise.then(function () {
              return MtpApiManager.invokeApi('upload.saveFilePart', {
                file_id: fileID,
                file_part: part,
                bytes: bytesFromArrayBuffer(e.target.result)
              }, {startMaxLength: partSize + 256});
            }, errorHandler);

            apiCurPromise.then(function (result) {
              doneParts++;
              fileReadDeferred.resolve();
              if (doneParts >= totalParts) {
                deferred.resolve(resultInputFile);
              } else {
                dLog('Progress', doneParts * partSize / fileSize);
                deferred.notify({done: doneParts * partSize, total: fileSize});
              }
            }, errorHandler);
          };

          reader.readAsArrayBuffer(blob);

          return fileReadDeferred.promise;
        });
      })(offset, part++);
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





