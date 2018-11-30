/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

var _logTimer = (new Date()).getTime()
function dT () {
  return '[' + (((new Date()).getTime() - _logTimer) / 1000).toFixed(3) + ']'
}

function checkClick (e, noprevent) {
  if (e.which == 1 && (e.ctrlKey || e.metaKey) || e.which == 2) {
    return true
  }

  if (!noprevent) {
    e.preventDefault()
  }

  return false
}

function isInDOM (element, parentNode) {
  if (!element) {
    return false
  }
  parentNode = parentNode || document.body
  if (element == parentNode) {
    return true
  }
  return isInDOM(element.parentNode, parentNode)
}

function checkDragEvent (e) {
  if (!e || e.target && (e.target.tagName == 'IMG' || e.target.tagName == 'A')) return false
  if (e.dataTransfer && e.dataTransfer.types) {
    for (var i = 0; i < e.dataTransfer.types.length; i++) {
      if (e.dataTransfer.types[i] == 'Files') {
        return true
      }
    }
  } else {
    return true
  }

  return false
}

function cancelEvent (event) {
  event = event || window.event
  if (event) {
    event = event.originalEvent || event

    if (event.stopPropagation) event.stopPropagation()
    if (event.preventDefault) event.preventDefault()
    event.returnValue = false
    event.cancelBubble = true
  }

  return false
}

function hasOnclick (element) {
  if (element.onclick ||
    element.getAttribute('ng-click')) {
    return true
  }
  var events = $._data(element, 'events')
  if (events && (events.click || events.mousedown)) {
    return true
  }
  return false
}

function getScrollWidth () {
  var outer = $('<div>').css({
    position: 'absolute',
    width: 100,
    height: 100,
    overflow: 'scroll',
    top: -9999
  }).appendTo($(document.body))

  var scrollbarWidth = outer[0].offsetWidth - outer[0].clientWidth
  outer.remove()

  return scrollbarWidth
}

function onCtrlEnter (textarea, cb) {
  $(textarea).on('keydown', function (e) {
    if (e.keyCode == 13 && (e.ctrlKey || e.metaKey)) {
      cb()
      return cancelEvent(e)
    }
  })
}

function setFieldSelection (field, from, to) {
  field = $(field)[0]
  try {
    field.focus()
    if (from === undefined || from === false) {
      from = field.value.length
    }
    if (to === undefined || to === false) {
      to = from
    }
    if (field.createTextRange) {
      var range = field.createTextRange()
      range.collapse(true)
      range.moveEnd('character', to)
      range.moveStart('character', from)
      range.select()
    }
    else if (field.setSelectionRange) {
      field.setSelectionRange(from, to)
    }
  } catch(e) {}
}

function getFieldSelection (field) {
  if (field.selectionStart) {
    return field.selectionStart
  }
  else if (!document.selection) {
    return 0
  }

  var c = '\x01'
  var sel = document.selection.createRange()
  var txt = sel.text
  var dup = sel.duplicate()
  var len = 0

  try {
    dup.moveToElementText(field)
  } catch(e) {
    return 0
  }

  sel.text = txt + c
  len = dup.text.indexOf(c)
  sel.moveStart('character', -1)
  sel.text = ''

  // if (browser.msie && len == -1) {
  //   return field.value.length
  // }
  return len
}

function getRichValue (field) {
  if (!field) {
    return ''
  }
  var lines = []
  var line = []

  getRichElementValue(field, lines, line)
  if (line.length) {
    lines.push(line.join(''))
  }

  var value = lines.join('\n')
  value = value.replace(/\u00A0/g, ' ')

  return value
}

function getRichValueWithCaret (field) {
  if (!field) {
    return []
  }
  var lines = []
  var line = []

  var sel = window.getSelection ? window.getSelection() : false
  var selNode
  var selOffset
  if (sel && sel.rangeCount) {
    var range = sel.getRangeAt(0)
    if (range.startContainer &&
      range.startContainer == range.endContainer &&
      range.startOffset == range.endOffset) {
      selNode = range.startContainer
      selOffset = range.startOffset
    }
  }

  getRichElementValue(field, lines, line, selNode, selOffset)

  if (line.length) {
    lines.push(line.join(''))
  }

  var value = lines.join('\n')
  var caretPos = value.indexOf('\x01')
  if (caretPos != -1) {
    value = value.substr(0, caretPos) + value.substr(caretPos + 1)
  }
  value = value.replace(/\u00A0/g, ' ')

  return [value, caretPos]
}

function getRichElementValue (node, lines, line, selNode, selOffset) {
  if (node.nodeType == 3) { // TEXT
    if (selNode === node) {
      var value = node.nodeValue
      line.push(value.substr(0, selOffset) + '\x01' + value.substr(selOffset))
    } else {
      line.push(node.nodeValue)
    }
    return
  }
  if (node.nodeType != 1) { // NON-ELEMENT
    return
  }
  var isSelected = (selNode === node)
  var isBlock = node.tagName == 'DIV' || node.tagName == 'P'
  var curChild
  if (isBlock && line.length || node.tagName == 'BR') {
    lines.push(line.join(''))
    line.splice(0, line.length)
  }
  else if (node.tagName == 'IMG') {
    if (node.alt) {
      line.push(node.alt)
    }
  }
  if (isSelected && !selOffset) {
    line.push('\x01')
  }
  var curChild = node.firstChild
  while (curChild) {
    getRichElementValue(curChild, lines, line, selNode, selOffset)
    curChild = curChild.nextSibling
  }
  if (isSelected && selOffset) {
    line.push('\x01')
  }
  if (isBlock && line.length) {
    lines.push(line.join(''))
    line.splice(0, line.length)
  }
}

function setRichFocus (field, selectNode, noCollapse) {
  field.focus()
  if (selectNode &&
    selectNode.parentNode == field &&
    !selectNode.nextSibling &&
    !noCollapse) {
    field.removeChild(selectNode)
    selectNode = null
  }
  if (window.getSelection && document.createRange) {
    var range = document.createRange()
    if (selectNode) {
      range.selectNode(selectNode)
    } else {
      range.selectNodeContents(field)
    }
    if (!noCollapse) {
      range.collapse(false)
    }

    var sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }
  else if (document.body.createTextRange !== undefined) {
    var textRange = document.body.createTextRange()
    textRange.moveToElementText(selectNode || field)
    if (!noCollapse) {
      textRange.collapse(false)
    }
    textRange.select()
  }
}

function getSelectedText () {
  var sel = (
  window.getSelection && window.getSelection() ||
  document.getSelection && document.getSelection() ||
  document.selection && document.selection.createRange().text || ''
    ).toString().replace(/^\s+|\s+$/g, '')

  return sel
}

function scrollToNode (scrollable, node, scroller) {
  var elTop = node.offsetTop - 15
  var elHeight = node.offsetHeight + 30
  var scrollTop = scrollable.scrollTop
  var viewportHeight = scrollable.clientHeight

  if (scrollTop > elTop) { // we are below the node to scroll
    scrollable.scrollTop = elTop
    $(scroller).nanoScroller({flash: true})
  }
  else if (scrollTop < elTop + elHeight - viewportHeight) { // we are over the node to scroll
    scrollable.scrollTop = elTop + elHeight - viewportHeight
    $(scroller).nanoScroller({flash: true})
  }
}

if (Config.Modes.animations &&
  typeof window.requestAnimationFrame == 'function') {
  window.onAnimationFrameCallback = function (cb) {
    return (function () {
      window.requestAnimationFrame(cb)
    })
  }
} else {
  window.onAnimationFrameCallback = function (cb) {
    return cb
  }
}

function onContentLoaded (cb) {
  cb = onAnimationFrameCallback(cb)
  setZeroTimeout(cb)
}

function tsNow (seconds) {
  var t = +new Date() + (window.tsOffset || 0)
  return seconds ? Math.floor(t / 1000) : t
}

function safeReplaceObject (wasObject, newObject) {
  for (var key in wasObject) {
    if (!newObject.hasOwnProperty(key) && key.charAt(0) != '$') {
      delete wasObject[key]
    }
  }
  for (var key in newObject) {
    if (newObject.hasOwnProperty(key)) {
      wasObject[key] = newObject[key]
    }
  }
}

function listMergeSorted (list1, list2) {
  list1 = list1 || []
  list2 = list2 || []

  var result = angular.copy(list1)

  var minID = list1.length ? list1[list1.length - 1] : 0xFFFFFFFF
  for (var i = 0; i < list2.length; i++) {
    if (list2[i] < minID) {
      result.push(list2[i])
    }
  }

  return result
}

function listUniqSorted (list) {
  list = list || []
  var resultList = []
  var prev = false
  for (var i = 0; i < list.length; i++) {
    if (list[i] !== prev) {
      resultList.push(list[i])
    }
    prev = list[i]
  }

  return resultList
}

function templateUrl (tplName) {
  var forceLayout = {
    confirm_modal: 'desktop',
    error_modal: 'desktop',
    media_modal_layout: 'desktop',
    slider: 'desktop',
    reply_message: 'desktop',
    full_round: 'desktop',
    message_body: 'desktop',
    message_media: 'desktop',
    message_attach_game: 'desktop',
    forwarded_messages: 'desktop',
    chat_invite_link_modal: 'desktop',
    reply_markup: 'desktop',
    short_message: 'desktop',
    pinned_message: 'desktop',
    channel_edit_modal: 'desktop',
    megagroup_edit_modal: 'desktop',
    inline_results: 'desktop',
    composer_dropdown: 'desktop',
    peer_pinned_message_bar: 'desktop',
    report_msgs_modal: 'desktop'
  }
  var layout = forceLayout[tplName] || (Config.Mobile ? 'mobile' : 'desktop')
  return 'partials/' + layout + '/' + tplName + '.html'
}

function encodeEntities (value) {
  return value.replace(/&/g, '&amp;').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (value) {
    var hi = value.charCodeAt(0)
    var low = value.charCodeAt(1)
    return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';'
  }).replace(/([^\#-~| |!])/g, function (value) { // non-alphanumeric
    return '&#' + value.charCodeAt(0) + ';'
  }).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function calcImageInBox (imageW, imageH, boxW, boxH, noZooom) {
  var boxedImageW = boxW
  var boxedImageH = boxH

  if ((imageW / imageH) > (boxW / boxH)) {
    boxedImageH = parseInt(imageH * boxW / imageW)
  }else {
    boxedImageW = parseInt(imageW * boxH / imageH)
    if (boxedImageW > boxW) {
      boxedImageH = parseInt(boxedImageH * boxW / boxedImageW)
      boxedImageW = boxW
    }
  }

  // if (Config.Navigator.retina) {
  //   imageW = Math.floor(imageW / 2)
  //   imageH = Math.floor(imageH / 2)
  // }

  if (noZooom && boxedImageW >= imageW && boxedImageH >= imageH) {
    boxedImageW = imageW
    boxedImageH = imageH
  }

  return {w: boxedImageW, h: boxedImageH}
}

function versionCompare (ver1, ver2) {
  if (typeof ver1 !== 'string') {
    ver1 = ''
  }
  if (typeof ver2 !== 'string') {
    ver2 = ''
  }
  ver1 = ver1.replace(/^\s+|\s+$/g, '').split('.')
  ver2 = ver2.replace(/^\s+|\s+$/g, '').split('.')

  var a = Math.max(ver1.length, ver2.length), i

  for (i = 0; i < a; i++) {
    if (ver1[i] == ver2[i]) {
      continue
    }
    if (ver1[i] > ver2[i]) {
      return 1
    } else {
      return -1
    }
  }

  return 0
}

(function (global) {
  var badCharsRe = /[`~!@#$%^&*()\-_=+\[\]\\|{}'";:\/?.>,<\s]+/g,
    trimRe = /^\s+|\s$/g

  function createIndex () {
    return {
      shortIndexes: {},
      fullTexts: {}
    }
  }

  function cleanSearchText (text) {
    var hasTag = text.charAt(0) == '%'
    text = text.replace(badCharsRe, ' ').replace(trimRe, '')
    text = text.replace(/[^A-Za-z0-9]/g, function (ch) {
      var latinizeCh = Config.LatinizeMap[ch]
      return latinizeCh !== undefined ? latinizeCh : ch
    })
    text = text.toLowerCase()
    if (hasTag) {
      text = '%' + text
    }

    return text
  }

  function cleanUsername (username) {
    return username && username.toLowerCase() || ''
  }

  function indexObject (id, searchText, searchIndex) {
    if (searchIndex.fullTexts[id] !== undefined) {
      return false
    }

    searchText = cleanSearchText(searchText)

    if (!searchText.length) {
      return false
    }

    var shortIndexes = searchIndex.shortIndexes

    searchIndex.fullTexts[id] = searchText

    angular.forEach(searchText.split(' '), function (searchWord) {
      var len = Math.min(searchWord.length, 3),
        wordPart, i
      for (i = 1; i <= len; i++) {
        wordPart = searchWord.substr(0, i)
        if (shortIndexes[wordPart] === undefined) {
          shortIndexes[wordPart] = [id]
        } else {
          shortIndexes[wordPart].push(id)
        }
      }
    })
  }

  function search (query, searchIndex) {
    var shortIndexes = searchIndex.shortIndexes
    var fullTexts = searchIndex.fullTexts

    query = cleanSearchText(query)

    var queryWords = query.split(' ')
    var foundObjs = false,
      newFoundObjs, i
    var j, searchText
    var found

    for (i = 0; i < queryWords.length; i++) {
      newFoundObjs = shortIndexes[queryWords[i].substr(0, 3)]
      if (!newFoundObjs) {
        foundObjs = []
        break
      }
      if (foundObjs === false || foundObjs.length > newFoundObjs.length) {
        foundObjs = newFoundObjs
      }
    }

    newFoundObjs = {}

    for (j = 0; j < foundObjs.length; j++) {
      found = true
      searchText = fullTexts[foundObjs[j]]
      for (i = 0; i < queryWords.length; i++) {
        if (searchText.indexOf(queryWords[i]) == -1) {
          found = false
          break
        }
      }
      if (found) {
        newFoundObjs[foundObjs[j]] = true
      }
    }

    return newFoundObjs
  }

  global.SearchIndexManager = {
    createIndex: createIndex,
    indexObject: indexObject,
    cleanSearchText: cleanSearchText,
    cleanUsername: cleanUsername,
    search: search
  }
})(window)
