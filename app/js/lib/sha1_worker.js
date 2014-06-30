/*!
 * Webogram v0.1.8 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

importScripts(
  '../../vendor/console-polyfill/console-polyfill.js',
  'bin_utils.js',
  '../../vendor/cryptoJS/crypto.js'
);

onmessage = function (e) {
  var taskID = e.data.taskID;

  postMessage({taskID: taskID, result: sha1Hash(e.data.bytes)});
}
