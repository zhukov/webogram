/*!
 * Webogram v0.1.4 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

importScripts(
  '../../vendor/console-polyfill/console-polyfill.js',
  'mtproto.js',
  '../../vendor/closure/long.js',
  '../../vendor/jsbn/jsbn_combined.js'
);

onmessage = function (e) {
  postMessage(pqPrimeFactorization(e.data));
}
