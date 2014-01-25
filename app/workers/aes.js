/*!
 * Webogram v0.1 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

onmessage = function (event) {
  // console.log('AES worker in', data);
  var data = event.data,
      taskID = data.taskID,
      result;

  if (data.task == 'encrypt') {
    result = aesEncrypt(data.bytes, data.keyBytes, data.ivBytes);
  } else {
    result = aesDecrypt(data.encryptedBytes, data.keyBytes, data.ivBytes);
  }
  postMessage({taskID: taskID, result: result});
}
