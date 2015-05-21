/*!
 * Webogram v0.4.6 - messaging web application for MTProto
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
  if (event) {
    event = event.originalEvent || event;

    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
  }

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

function setFieldSelection(field, from, to) {
  field = $(field)[0];
  try {
    field.focus();
    if (from === undefined || from === false) {
      from = field.value.length;
    }
    if (to === undefined || to === false) {
      to = from;
    }
    if (field.createTextRange) {
      var range = field.createTextRange();
      range.collapse(true);
      range.moveEnd('character', to);
      range.moveStart('character', from);
      range.select();
    }
    else if (field.setSelectionRange) {
      field.setSelectionRange(from, to);
    }
  } catch(e) {}
}

function getFieldSelection (field) {
  if (field.selectionStart) {
    return field.selectionStart;
  }
  else if (!document.selection) {
    return 0;
  }

  var c = "\001",
      sel = document.selection.createRange(),
      txt = sel.text,
      dup = sel.duplicate(),
      len = 0;

  try {
    dup.moveToElementText(field);
  } catch(e) {
    return 0;
  }

  sel.text = txt + c;
  len = dup.text.indexOf(c);
  sel.moveStart('character', -1);
  sel.text  = '';

  // if (browser.msie && len == -1) {
  //   return field.value.length;
  // }
  return len;
}

function getRichValue(field) {
  if (!field) {
    return '';
  }
  var lines = [];
  var line = [];

  getRichElementValue(field, lines, line);
  if (line.length) {
    lines.push(line.join(''));
  }

  return lines.join('\n');
}

function getRichValueWithCaret(field) {
  if (!field) {
    return [];
  }
  var lines = [];
  var line = [];

  var sel = window.getSelection ? window.getSelection() : false;
  var selNode, selOffset;
  if (sel && sel.rangeCount) {
    var range = sel.getRangeAt(0);
    if (range.startContainer &&
        range.startContainer == range.endContainer &&
        range.startOffset == range.endOffset) {
      selNode = range.startContainer;
      selOffset = range.startOffset;
    }
  }

  getRichElementValue(field, lines, line, selNode, selOffset);

  if (line.length) {
    lines.push(line.join(''));
  }

  var value = lines.join('\n');
  var caretPos = value.indexOf('\001');
  if (caretPos != -1) {
    value = value.substr(0, caretPos) + value.substr(caretPos + 1);
  }

  return [value, caretPos];
}

function getRichElementValue(node, lines, line, selNode, selOffset) {
  if (node.nodeType == 3) { // TEXT
    if (selNode === node) {
      var value = node.nodeValue;
      line.push(value.substr(0, selOffset) + '\001' + value.substr(selOffset));
    } else {
      line.push(node.nodeValue);
    }
    return;
  }
  if (node.nodeType != 1) { // NON-ELEMENT
    return;
  }
  var isBlock = node.tagName == 'DIV' || node.tagName == 'P';
  var curChild;
  if (isBlock && line.length || node.tagName == 'BR') {
    lines.push(line.join(''));
    line.splice(0, line.length);
  }
  else if (node.tagName == 'IMG') {
    if (node.alt) {
      line.push(node.alt);
    }
  }
  if (selNode === node) {
    line.push('\001');
  }
  var curChild = node.firstChild;
  while (curChild) {
    getRichElementValue(curChild, lines, line, selNode, selOffset);
    curChild = curChild.nextSibling;
  }
  if (isBlock && line.length) {
    lines.push(line.join(''));
    line.splice(0, line.length);
  }
}

function setRichFocus(field, selectNode) {
  field.focus();
  if (window.getSelection && document.createRange) {
    var range = document.createRange();
    if (selectNode) {
      range.selectNode(selectNode);
    } else {
      range.selectNodeContents(field);
    }
    range.collapse(false);

    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  else if (document.body.createTextRange !== undefined) {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(selectNode || field);
    textRange.collapse(false);
    textRange.select();
  }
}

function onContentLoaded (cb) {
  setZeroTimeout(cb);
}

function tsNow (seconds) {
  var t = +new Date() + (window.tsOffset || 0);
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

function listMergeSorted (list1, list2) {
  list1 = list1 || [];
  list2 = list2 || [];

  var result = angular.copy(list1);

  var minID = list1.length ? list1[list1.length - 1] : 0xFFFFFFFF;
  for (var i = 0; i < list2.length; i++) {
    if (list2[i] < minID) {
      result.push(list2[i]);
    }
  }

  return result;
}

function listUniqSorted (list) {
  list = list || [];
  var resultList = [],
      prev = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i] !== prev) {
      resultList.push(list[i])
    }
    prev = list[i];
  }

  return resultList;
}

function templateUrl (tplName) {
  var forceLayout = {
    confirm_modal: 'desktop',
    error_modal: 'desktop',
    media_modal_layout: 'desktop',
    slider: 'desktop',
    reply_message: 'desktop',
    chat_invite_link_modal: 'desktop'
  };
  var layout = forceLayout[tplName] || (Config.Mobile ? 'mobile' : 'desktop');
  return 'partials/' + layout + '/' + tplName + '.html';
}

function encodeEntities(value) {
  return value.
    replace(/&/g, '&amp;').
    replace(/([^\#-~| |!])/g, function (value) { // non-alphanumeric
      return '&#' + value.charCodeAt(0) + ';';
    }).
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;');
}

function calcImageInBox(imageW, imageH, boxW, boxH, noZooom) {
  var boxedImageW = boxW;
  var boxedImageH = boxH;

  if ((imageW / imageH) > (boxW / boxH)) {
    boxedImageH = parseInt(imageH * boxW / imageW);
  }
  else {
    boxedImageW = parseInt(imageW * boxH / imageH);
    if (boxedImageW > boxW) {
      boxedImageH = parseInt(boxedImageH * boxW / boxedImageW);
      boxedImageW = boxW;
    }
  }

  // if (Config.Navigator.retina) {
  //   imageW = Math.floor(imageW / 2);
  //   imageH = Math.floor(imageH / 2);
  // }

  if (noZooom && boxedImageW >= imageW && boxedImageH >= imageH) {
    boxedImageW = imageW;
    boxedImageH = imageH;
  }

  return {w: boxedImageW, h: boxedImageH};
}

function versionCompare (ver1, ver2) {
  if (typeof ver1 !== 'string') {
    ver1 = '';
  }
  if (typeof ver2 !== 'string') {
    ver2 = '';
  }
  ver1 = ver1.replace(/^\s+|\s+$/g, '').split('.');
  ver2 = ver2.replace(/^\s+|\s+$/g, '').split('.');

  var a = Math.max(ver1.length, ver2.length), i;

  for (i = 0; i < a; i++) {
    if (ver1[i] == ver2[i]) {
      continue;
    }
    if (ver1[i] > ver2[i]) {
      return 1;
    } else {
      return -1;
    }
  }

  return 0;
}


(function (global) {

  var badCharsRe = /[`~!@#$%^&*()\-_=+\[\]\\|{}'";:\/?.>,<\s]+/g,
        trimRe = /^\s+|\s$/g;

  function createIndex () {
    return {
      shortIndexes: {},
      fullTexts: {}
    }
  }

  function cleanSearchText (text) {
    text = text.replace(badCharsRe, ' ').replace(trimRe, '');
    text = text.replace(/[^A-Za-z0-9]/g, function (ch) {
      return Config.LatinizeMap[ch] || ch;
    });
    text = text.toLowerCase();

    return text;
  }

  function indexObject (id, searchText, searchIndex) {
    if (searchIndex.fullTexts[id] !== undefined) {
      return false;
    }

    searchText = cleanSearchText(searchText);

    if (!searchText.length) {
      return false;
    }

    var shortIndexes = searchIndex.shortIndexes;

    searchIndex.fullTexts[id] = searchText;

    angular.forEach(searchText.split(' '), function(searchWord) {
      var len = Math.min(searchWord.length, 3),
          wordPart, i;
      for (i = 1; i <= len; i++) {
        wordPart = searchWord.substr(0, i);
        if (shortIndexes[wordPart] === undefined) {
          shortIndexes[wordPart] = [id];
        } else {
          shortIndexes[wordPart].push(id);
        }
      }
    });
  }

  function search (query, searchIndex) {
    var shortIndexes = searchIndex.shortIndexes,
        fullTexts = searchIndex.fullTexts;

    query = cleanSearchText(query);

    var queryWords = query.split(' '),
        foundObjs = false,
        newFoundObjs, i, j, searchText, found;

    for (i = 0; i < queryWords.length; i++) {
      newFoundObjs = shortIndexes[queryWords[i].substr(0, 3)];
      if (!newFoundObjs) {
        foundObjs = [];
        break;
      }
      if (foundObjs === false || foundObjs.length > newFoundObjs.length) {
        foundObjs = newFoundObjs;
      }
    }

    newFoundObjs = {};

    for (j = 0; j < foundObjs.length; j++) {
      found = true;
      searchText = fullTexts[foundObjs[j]];
      for (i = 0; i < queryWords.length; i++) {
        if (searchText.indexOf(queryWords[i]) == -1) {
          found = false;
          break;
        }
      }
      if (found) {
        newFoundObjs[foundObjs[j]] = true;
      }
    }

    return newFoundObjs;
  }

  global.SearchIndexManager = {
    createIndex: createIndex,
    indexObject: indexObject,
    cleanSearchText: cleanSearchText,
    search: search
  };

})(window);


(function (global) {
  var nativeWebpSupport = false;

  var image = new Image();
  image.onload = function () {
    nativeWebpSupport = this.width === 2 && this.height === 1;
  };
  image.onerror = function () {
    nativeWebpSupport = false;
  };
  image.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';

  var canvas, context;


  function getPngUrlFromData(data) {
    var start = tsNow();

    var decoder = new WebPDecoder();

    var config = decoder.WebPDecoderConfig;
    var buffer = config.j;
    var bitstream = config.input;

    if (!decoder.WebPInitDecoderConfig(config)) {
      console.error('[webpjs] Library version mismatch!');
      return false;
    }

    // console.log('[webpjs] status code', decoder.VP8StatusCode);

    status = decoder.WebPGetFeatures(data, data.length, bitstream);
    if (status != 0) {
      console.error('[webpjs] status error', status);
    }

    var mode = decoder.WEBP_CSP_MODE;
    buffer.J = 4;

    try {
      status = decoder.WebPDecode(data, data.length, config);
    } catch (e) {
      status = e;
    }

    ok = (status == 0);
    if (!ok) {
      console.error('[webpjs] decoding failed', status);
      return false;
    }

    // console.log('[webpjs] decoded: ', buffer.width, buffer.height, bitstream.has_alpha, 'Now saving...');
    var bitmap = buffer.c.RGBA.ma;

    // console.log('[webpjs] done in ', tsNow() - start);

    if (!bitmap) {
      return false;
    }
    var biHeight = buffer.height;
    var biWidth = buffer.width;

    if (!canvas || !context) {
      canvas = document.createElement('canvas');
      context = canvas.getContext('2d');
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.height = biHeight;
    canvas.width = biWidth;

    var output = context.createImageData(canvas.width, canvas.height);
    var outputData = output.data;

    for (var h = 0; h < biHeight; h++) {
      for (var w = 0; w < biWidth; w++) {
        outputData[0+w*4+(biWidth*4)*h] = bitmap[1+w*4+(biWidth*4)*h];
        outputData[1+w*4+(biWidth*4)*h] = bitmap[2+w*4+(biWidth*4)*h];
        outputData[2+w*4+(biWidth*4)*h] = bitmap[3+w*4+(biWidth*4)*h];
        outputData[3+w*4+(biWidth*4)*h] = bitmap[0+w*4+(biWidth*4)*h];

      };
    }

    context.putImageData(output, 0, 0);

    return canvas.toDataURL('image/png');
  }


  global.WebpManager = {
    isWebpSupported: function () {
      return nativeWebpSupport;
    },
    getPngUrlFromData: getPngUrlFromData
  }
})(window);
