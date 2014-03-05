/*!
 * Webogram v0.0.19 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

var _logTimer = (new Date()).getTime();
function dT () {
  return '[' + (((new Date()).getTime() - _logTimer) / 1000).toFixed(3) + ']';
}

function checkClick (e, noprevent) {
  if (e.which == 1 && (e.ctrlKey || e.metaKey) || e.which == 2) {
    return true;
  }

  if (!noprevent) {
    e.preventDefault();
  }

  return false;
}

function checkDragEvent(e) {
  if (!e || e.target && (e.target.tagName == 'IMG' || e.target.tagName == 'A')) return false;
  if (e.dataTransfer && e.dataTransfer.types) {
    for (var i = 0; i < e.dataTransfer.types.length; i++) {
      if (e.dataTransfer.types[i] == 'Files') {
        return true;
      }
    }
  } else {
    return true;
  }

  return false;
}

function cancelEvent (event) {
  event = event || window.event;

  event.stopPropagation && event.stopPropagation();
  event.preventDefault && event.preventDefault();

  return false;
}

function onCtrlEnter (textarea, cb) {
  $(textarea).on('keydown', function (e) {
    if (e.keyCode == 13 && (e.ctrlKey || e.metaKey)) {
      cb();
      return cancelEvent(e);
    }
  });
}

function onContentLoaded (cb) {
  setTimeout(cb, 0);
};

function tsNow (seconds) {
  var t = +new Date();
  return seconds ? Math.floor(t / 1000) : t;
}

function safeReplaceObject (wasObject, newObject) {
  for (var key in wasObject) {
    if (!newObject.hasOwnProperty(key) && key.charAt(0) != '$') {
      delete wasObject[key];
    }
  }
  for (var key in newObject) {
    if (newObject.hasOwnProperty(key)) {
      wasObject[key] = newObject[key];
    }
  }
}
