/*!
 * Webogram v0.1 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

importScripts('mtproto.js', 'jsbn.js');

onmessage = function (e) {
  postMessage(pqPrimeFactorization(e.data));
}