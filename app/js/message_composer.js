/*!
 * Webogram v0.4.6 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* EmojiHelper */

(function (global, emojis, categories, spritesheets) {


  var emojis = {};
  var shortcuts = {};
  var spritesheetPositions = {};
  var index = false;

  var popular = 'joy,kissing_heart,heart,heart_eyes,blush,grin,+1,relaxed,pensive,smile,sob,kiss,unamused,flushed,stuck_out_tongue_winking_eye,see_no_evil,wink,smiley,cry,stuck_out_tongue_closed_eyes,scream,rage,smirk,disappointed,sweat_smile,kissing_closed_eyes,speak_no_evil,relieved,grinning,yum,laughing,ok_hand,neutral_face,confused'.split(',');

  var i, j, code, shortcut, emoji, row, column, totalColumns;
  var len1, len2;

  for (i = 0, len1 = categories.length; i < len1; i++) {
    totalColumns = spritesheets[i][1];
    for (j = 0, len2 = categories[i].length; j < len2; j++) {
      code = categories[i][j];
      emoji = Config.Emoji[code];
      shortcut = emoji[1][0];
      emojis[code] = [emoji[0], shortcut];
      shortcuts[shortcut] = code;
      spritesheetPositions[code] = [i, j, Math.floor(j / totalColumns), j % totalColumns];
    }
  }

  function getPopularEmoji (callback) {
    ConfigStorage.get('emojis_popular', function (popEmojis) {
      var result = [];
      if (popEmojis && popEmojis.length) {
        for (var i = 0, len = popEmojis.length; i < len; i++) {
          result.push({code: popEmojis[i][0], rate: popEmojis[i][1]});
        }
        callback(result);
        return;
      };
      ConfigStorage.get('emojis_recent', function (recentEmojis) {
        recentEmojis = recentEmojis || popular || [];
        var shortcut, code;
        for (var i = 0, len = recentEmojis.length; i < len; i++) {
          shortcut = recentEmojis[i];
          if (Array.isArray(shortcut)) {
            shortcut = shortcut[0];
          }
          if (shortcut && typeof shortcut === 'string') {
            if (shortcut.charAt(0) == ':') {
              shortcut = shortcut.substr(1, shortcut.length - 2);
            }
            if (code = shortcuts[shortcut]) {
              result.push({code: code, rate: 1});
            }
          }
        }
        callback(result);
      });
    });
  }

  function pushPopularEmoji (code) {
    getPopularEmoji(function (popularEmoji) {
      var exists = false;
      var count = popularEmoji.length;
      var result = [];
      for (var i = 0; i < count; i++) {
        if (popularEmoji[i].code == code) {
          exists = true;
          popularEmoji[i].rate++;
        }
        result.push([popularEmoji[i].code, popularEmoji[i].rate]);
      }
      if (exists) {
        result.sort(function (a, b) {
          return b[1] - a[1];
        });
      } else {
        if (result.length > 41) {
          result = result.slice(0, 41);
        }
        result.push([code, 1]);
      }
      ConfigStorage.set({emojis_popular: result});
    });
  }

  function indexEmojis () {
    if (index === false) {
      index = SearchIndexManager.createIndex();
      var shortcut;
      for (shortcut in shortcuts) {
        if (shortcuts.hasOwnProperty(shortcut)) {
          SearchIndexManager.indexObject(shortcuts[shortcut], shortcut, index);
        }
      }
    }
  }

  function searchEmojis (q) {
    indexEmojis();
    var foundObject = SearchIndexManager.search(q, index);
    var foundCodes = [];
    var code;
    for (code in foundObject) {
      if (foundObject.hasOwnProperty(code)) {
        foundCodes.push(code);
      }
    }
    return foundCodes;
  }

  global.EmojiHelper = {
    emojis: emojis,
    shortcuts: shortcuts,
    spritesheetPositions: spritesheetPositions,
    getPopularEmoji: getPopularEmoji,
    pushPopularEmoji: pushPopularEmoji,
    indexEmojis: indexEmojis,
    searchEmojis: searchEmojis
  };

})(window, Config.Emoji, Config.EmojiCategories, Config.EmojiCategorySpritesheetDimens);


function EmojiTooltip (btnEl, options) {
  options = options || {};
  var self = this;

  this.btnEl = $(btnEl);
  this.onEmojiSelected = options.onEmojiSelected;
  this.onStickerSelected = options.onStickerSelected;
  this.getStickers = options.getStickers;
  this.getStickerImage = options.getStickerImage;
  this.onStickersetSelected = options.onStickersetSelected;

  if (!Config.Navigator.touch) {
    $(this.btnEl).on('mouseenter mouseleave', function (e) {
      self.isOverBtn = e.type == 'mouseenter';
      self.createTooltip();

      if (self.isOverBtn) {
        self.onMouseEnter(true);
      } else {
        self.onMouseLeave(true);
      }
    });
  }
  $(this.btnEl).on('mousedown', function (e) {
    if (!self.shown) {
      clearTimeout(self.showTimeout);
      delete self.showTimeout;
      self.createTooltip();
      self.show();
    } else {
      clearTimeout(self.hideTimeout);
      delete self.hideTimeout;
      self.hide();
    }
    return cancelEvent(e);
  });
  $(document).on('mousedown', function (e) {
    if (self.shown) {
      self.hide();
    }
  });
}

EmojiTooltip.prototype.onMouseEnter = function (triggerShow) {
  if (this.hideTimeout) {
    clearTimeout(this.hideTimeout);
    delete this.hideTimeout;
  }
  else if (triggerShow && !this.showTimeout) {
    this.showTimeout = setTimeout(this.show.bind(this), 200);
  }
};

EmojiTooltip.prototype.onMouseLeave = function (triggerUnshow) {
  if (!this.hideTimeout) {
    var self = this;
    this.hideTimeout = setTimeout(function () {
      self.hide();
    }, 400);
  }
  else if (triggerUnshow && this.showTimeout) {
    clearTimeout(this.showTimeout);
    delete this.showTimeout;
  }
};

EmojiTooltip.prototype.getScrollWidth = function() {
  var outer = $('<div>').css({
    position: 'absolute',
    width: 100,
    height: 100,
    overflow: 'scroll',
    top: -9999
  }).appendTo($(document.body));

  var scrollbarWidth = outer[0].offsetWidth - outer[0].clientWidth;
  outer.remove();

  return scrollbarWidth;
};



EmojiTooltip.prototype.createTooltip = function () {
  if (this.tooltipEl) {
    return false;
  }

  var self = this;
  this.tooltipEl = $('<div class="composer_emoji_tooltip noselect"><div class="composer_emoji_tooltip_tabs"></div><div class="composer_emoji_tooltip_content_wrap nano mobile_scrollable_wrap"><div class="composer_emoji_tooltip_content nano-content clearfix"></div></div><div class="composer_emoji_tooltip_footer"><a class="composer_emoji_tooltip_settings"></a></div><div class="composer_emoji_tooltip_tail"><i class="icon icon-tooltip-tail"></i></div></div>').appendTo(document.body);

  this.tabsEl = $('.composer_emoji_tooltip_tabs', this.tooltip);
  this.contentWrapEl = $('.composer_emoji_tooltip_content_wrap', this.tooltip);
  this.contentEl = $('.composer_emoji_tooltip_content', this.tooltip);
  this.footerEl = $('.composer_emoji_tooltip_footer', this.tooltip);
  this.settingsEl = $('.composer_emoji_tooltip_settings', this.tooltip);

  var scrollWidth = this.getScrollWidth();
  if (scrollWidth > 0) {
    this.tooltipEl.css({
      width: parseInt(this.tooltipEl.css('width')) + scrollWidth
    });
  }

  angular.forEach(['recent', 'smile', 'flower', 'bell', 'car', 'grid', 'stickers'], function (tabName, tabIndex) {
    var tab = $('<a class="composer_emoji_tooltip_tab composer_emoji_tooltip_tab_' + tabName + '"></a>')
      .on('mousedown', function (e) {
        self.selectTab(tabIndex);
        return cancelEvent(e);
      })
      .appendTo(self.tabsEl);

    if (!Config.Navigator.touch) {
      tab.on('mouseenter mouseleave', function (e) {
        clearTimeout(self.selectTabTimeout);
        if (e.type == 'mouseenter') {
          self.selectTabTimeout = setTimeout(function () {
            self.selectTab(tabIndex);
          }, 300);
        }
      });
    }
  });

  if (!Config.Mobile) {
    this.contentWrapEl.nanoScroller({preventPageScrolling: true, tabIndex: -1});
  }

  this.contentEl.on('mousedown', function (e) {
    e = e.originalEvent || e;
    var target = $(e.target), code, sticker, stickerset;
    if (target[0].tagName != 'A') {
      target = $(target[0].parentNode);
    }
    if (code = target.attr('data-code')) {
      if (self.onEmojiSelected) {
        self.onEmojiSelected(code);
      }
      EmojiHelper.pushPopularEmoji(code);
    }
    if (sticker = target.attr('data-sticker')) {
      if (self.onStickerSelected) {
        self.onStickerSelected(sticker);
      }
      if (Config.Mobile) {
        self.hide();
      }
    }
    if (stickerset = target.attr('data-stickerset')) {
      if (self.onStickersetSelected) {
        self.onStickersetSelected(stickerset);
      }
      self.hide();
    }
    return cancelEvent(e);
  });

  if (!Config.Navigator.touch) {
    this.tooltipEl.on('mouseenter mouseleave', function (e) {
      if (e.type == 'mouseenter') {
        self.onMouseEnter();
      } else {
        self.onMouseLeave();
      }
    });
  }

  this.selectTab(0);

  $(window).on('resize', this.updatePosition.bind(this));

  return true;
}


EmojiTooltip.prototype.selectTab = function (tab) {
  if (this.tab === tab && tab != 6) {
    return false;
  }
  $('.active', this.tabsEl).removeClass('active');
  this.tab = tab;
  $(this.tabsEl[0].childNodes[tab]).addClass('active');

  this.updateTabContents();
};

EmojiTooltip.prototype.updateTabContents = function () {
  var html = [];
  var self = this;
  var iconSize = Config.Mobile ? 26 : 20;

  var renderContent = function () {
    self.contentEl.html(html.join(''));

    if (!Config.Mobile) {
      self.contentWrapEl.nanoScroller({scroll: 'top'});
      setTimeout(function () {
        self.contentWrapEl.nanoScroller();
      }, 100);
    }
  }

  if (this.tab == 6) { // Stickers
    var renderStickers = function (stickersets) {
      var set, docID, i, j, len1, len2;
      for (i = 0, len1 = stickersets.length; i < len1; i++) {
        set = stickersets[i];
        if (!set.docIDs.length) {
          continue;
        }
        html.push('<div class="composer_stickerset_wrap clearfix">');
        if (set.id && set.title) {
          html.push(
            '<a class="composer_stickerset_title" data-stickerset="',
            encodeEntities(set.short_name),
            '">',
            encodeEntities(set.title),
            '</a>'
          );
        }
        for (j = 0, len2 = set.docIDs.length; j < len2; j++) {
          docID = set.docIDs[j];
          html.push('<a class="composer_sticker_btn" data-sticker="' + docID + '"></a>');
        }
        html.push('</div>');
      }
      renderContent();

      self.contentEl.find('.composer_sticker_btn').each(function (k, element) {
        self.getStickerImage($(element), element.getAttribute('data-sticker'));
      });
    };
    this.getStickers(renderStickers);
  }
  else if (this.tab > 0) {
    var categoryIndex = this.tab - 1;
    var emoticonCodes = Config.EmojiCategories[categoryIndex];
    var totalColumns = Config.EmojiCategorySpritesheetDimens[categoryIndex][1];
    var count = emoticonCodes.length;
    var emoticonCode, emoticonData, i, x, y;

    for (i = 0; i < count; i++) {
      emoticonCode = emoticonCodes[i];
      emoticonData = Config.Emoji[emoticonCode];
      x = iconSize * (i % totalColumns);
      y = iconSize * Math.floor(i / totalColumns);
      html.push('<a class="composer_emoji_btn" title=":' + encodeEntities(emoticonData[1][0]) + ':" data-code="' + encodeEntities(emoticonCode) + '"><i class="emoji emoji-w' + iconSize + ' emoji-spritesheet-' + categoryIndex + '" style="background-position: -' + x + 'px -' + y + 'px;"></i></a>');
    }
    renderContent();
  }
  else {
    EmojiHelper.getPopularEmoji(function (popularEmoji) {
      var emoticonCode, emoticonData, spritesheet, pos, categoryIndex;
      var count = popularEmoji.length;
      var i, x, y;

      for (i = 0; i < count; i++) {
        emoticonCode = popularEmoji[i].code;
        if (emoticonData = Config.Emoji[emoticonCode]) {
          spritesheet = EmojiHelper.spritesheetPositions[emoticonCode];
          categoryIndex = spritesheet[0];
          pos = spritesheet[1];
          x = iconSize * spritesheet[3];
          y = iconSize * spritesheet[2];
          html.push('<a class="composer_emoji_btn" title=":' + encodeEntities(emoticonData[1][0]) + ':" data-code="' + encodeEntities(emoticonCode) + '"><i class="emoji emoji-w' + iconSize + ' emoji-spritesheet-' + categoryIndex + '" style="background-position: -' + x + 'px -' + y + 'px;"></i></a>');
        }
      }
      renderContent();
    });
  }
};

EmojiTooltip.prototype.updatePosition = function () {
  var offset = this.btnEl.offset();
  this.tooltipEl.css({top: offset.top, left: offset.left});
};

EmojiTooltip.prototype.show = function () {
  this.updatePosition();
  this.updateTabContents();
  this.tooltipEl.addClass('composer_emoji_tooltip_shown');
  this.btnEl.addClass('composer_emoji_insert_btn_on');
  delete this.showTimeout;
  this.shown = true;
};

EmojiTooltip.prototype.hide = function () {
  if (this.tooltipEl) {
    this.tooltipEl.removeClass('composer_emoji_tooltip_shown');
    this.btnEl.removeClass('composer_emoji_insert_btn_on');
  }
  delete this.hideTimeout;
  delete this.shown;
};




function EmojiPanel (containerEl, options) {
  options = options || {};
  var self = this;

  this.containerEl = $(containerEl);
  this.onEmojiSelected = options.onEmojiSelected;

  this.containerEl.on('mousedown', function (e) {
    e = e.originalEvent || e;
    var target = $(e.target), code;
    if (target[0].tagName != 'A') {
      target = $(target[0].parentNode);
    }
    if (code = target.attr('data-code')) {
      if (self.onEmojiSelected) {
        self.onEmojiSelected(code);
      }
      EmojiHelper.pushPopularEmoji(code);
    }
    return cancelEvent(e);
  });

  this.update();
}

EmojiPanel.prototype.update = function () {
  var html = [];
  var self = this;
  var iconSize = Config.Mobile ? 26 : 20;

  EmojiHelper.getPopularEmoji(function (popularEmoji) {
    var emoticonCode, emoticonData, spritesheet, pos, categoryIndex;
    var count = popularEmoji.length;
    var i, x, y;

    for (i = 0; i < count; i++) {
      emoticonCode = popularEmoji[i].code;
      if (emoticonData = Config.Emoji[emoticonCode]) {
        spritesheet = EmojiHelper.spritesheetPositions[emoticonCode];
        categoryIndex = spritesheet[0];
        pos = spritesheet[1];
        x = iconSize * spritesheet[3];
        y = iconSize * spritesheet[2];
        html.push('<a class="composer_emoji_btn" title=":' + encodeEntities(emoticonData[1][0]) + ':" data-code="' + encodeEntities(emoticonCode) + '"><i class="emoji emoji-w20 emoji-spritesheet-' + categoryIndex + '" style="background-position: -' + x + 'px -' + y + 'px;"></i></a>');
      }
    }
    self.containerEl.html(html.join(''));
  });
}





function MessageComposer (textarea, options) {
  this.textareaEl = $(textarea);

  this.setUpInput();

  this.autoCompleteEl = $('<ul class="composer_dropdown dropdown-menu"></ul>').appendTo(document.body);

  var self = this;
  this.autoCompleteEl.on('mousedown', function (e) {
    e = e.originalEvent || e;
    var target = $(e.target), mention, code;
    if (target[0].tagName != 'A') {
      target = $(target[0].parentNode);
    }
    if (code = target.attr('data-code')) {
      if (self.onEmojiSelected) {
        self.onEmojiSelected(code, true);
      }
      EmojiHelper.pushPopularEmoji(code);
    }
    if (mention = target.attr('data-mention')) {
      if (self.onMentionSelected) {
        self.onMentionSelected(mention);
      }
    }
    return cancelEvent(e);
  });

  this.isActive = false;

  this.onTyping = options.onTyping;
  this.onMessageSubmit = options.onMessageSubmit;
  this.getSendOnEnter = options.getSendOnEnter;
  this.onFilePaste = options.onFilePaste;
  this.mentions = options.mentions;
  this.getPeerImage = options.getPeerImage;
}

MessageComposer.prototype.setUpInput = function () {
  if ('contentEditable' in document.body) {
    this.setUpRich();
  } else {
    this.setUpPlaintext();
  }
  this.autoCompleteRegEx = /(?:\s|^)(:|@)([A-Za-z0-9\-\+\*_]*)$/;
}

MessageComposer.prototype.setUpRich = function () {
  this.textareaEl.hide();
  this.richTextareaEl = $('<div class="composer_rich_textarea" contenteditable="true" dir="auto"></div>');

  this.textareaEl[0].parentNode.insertBefore(this.richTextareaEl[0], this.textareaEl[0]);

  this.richTextareaEl.on('keyup keydown', this.onKeyEvent.bind(this));
  this.richTextareaEl.on('focus blur', this.onFocusBlur.bind(this));
  this.richTextareaEl.on('paste', this.onRichPaste.bind(this));
  this.richTextareaEl.on('DOMNodeInserted', this.onRichPasteNode.bind(this));

  $(document.body).on('keydown', this.backupSelection.bind(this));
}

MessageComposer.prototype.setUpPlaintext = function () {
  this.textareaEl.on('keyup keydown', this.onKeyEvent.bind(this));
  this.textareaEl.on('focus blur', this.onFocusBlur.bind(this));
}

MessageComposer.prototype.onKeyEvent = function (e) {
  var self = this;
  if (e.type == 'keyup') {
    this.checkAutocomplete();

    var length = false;
    if (this.richTextareaEl) {
      clearTimeout(this.updateValueTO);
      var now = tsNow();
      if (this.keyupStarted === undefined) {
        this.keyupStarted = now;
      }
      if (now - this.keyupStarted > 10000) {
        this.onChange();
      }
      else {
        length = this.richTextareaEl[0].textContent.length;
        if (this.wasEmpty != !length) {
          this.wasEmpty = !this.wasEmpty;
          this.onChange();
        } else {
          this.updateValueTO = setTimeout(this.onChange.bind(this), 1000);
        }
      }
    }

    if (this.onTyping) {
      var now = tsNow();
      if (now - this.lastTyping > 5000) {
        if (length === false) {
          length = (this.richTextareaEl ? this.richTextareaEl[0].textContent : this.textareaEl[0].value).length;
        }

        if (length != this.lastLength) {
          this.lastTyping = now;
          this.lastLength = length;
          this.onTyping();
        }
      }
    }
  }
  if (e.type == 'keydown') {
    var checkSubmit = !this.autocompleteShown;
    if (this.autocompleteShown) {
      if (e.keyCode == 38 || e.keyCode == 40) { // UP / DOWN
        var next = e.keyCode == 40;
        var currentSelected = $(this.autoCompleteEl).find('.composer_autocomplete_option_active');

        if (currentSelected.length) {
          var currentSelectedWrap = currentSelected[0].parentNode;
          var nextWrap = currentSelectedWrap[next ? 'nextSibling' : 'previousSibling'];
          currentSelected.removeClass('composer_autocomplete_option_active');
          if (nextWrap) {
            $(nextWrap).find('a').addClass('composer_autocomplete_option_active');
            return cancelEvent(e);
          }
        }

        var childNodes = this.autoCompleteEl[0].childNodes;
        var nextWrap = childNodes[next ? 0 : childNodes.length - 1];
        $(nextWrap).find('a').addClass('composer_autocomplete_option_active');

        return cancelEvent(e);
      }

      if (e.keyCode == 13 || e.keyCode == 9) { // Enter or Tab
        var currentSelected = $(this.autoCompleteEl).find('.composer_autocomplete_option_active');
        if (!currentSelected.length && e.keyCode == 9) {
          currentSelected = $(this.autoCompleteEl[0].childNodes[0]).find('a');
        }
        var code, mention;
        if (code = currentSelected.attr('data-code')) {
          this.onEmojiSelected(code, true);
          EmojiHelper.pushPopularEmoji(code);
          return cancelEvent(e);
        }
        if (mention = currentSelected.attr('data-mention')) {
          if (this.onMentionSelected) {
            this.onMentionSelected(mention);
            return cancelEvent(e);
          }
        }
        checkSubmit = true;
      }
    }

    if (checkSubmit && e.keyCode == 13) {
      var submit = false;
      var sendOnEnter = true;
      if (this.getSendOnEnter && !this.getSendOnEnter()) {
        sendOnEnter = false;
      }
      if (sendOnEnter && !e.shiftKey) {
        submit = true;
      } else if (!sendOnEnter && (e.ctrlKey || e.metaKey)) {
        submit = true;
      }

      if (submit) {
        this.onMessageSubmit(e);
        return cancelEvent(e);
      }
    }
  }
}

MessageComposer.prototype.backupSelection = function () {
  delete this.selection;

  if (!this.isActive) {
    return;
  }
  if (window.getSelection) {
    var sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      this.selection = sel.getRangeAt(0);
    }
  } else if (document.selection && document.selection.createRange) {
    this.selection = document.selection.createRange();
  }
}

MessageComposer.prototype.restoreSelection = function () {
  if (!this.selection) {
    return false;
  }
  var result = false;
  if (window.getSelection) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(this.selection);
    result = true;
  }
  else if (document.selection && this.selection.select) {
    this.selection.select();
    result = true;
  }
  delete this.selection;

  return result;
}



MessageComposer.prototype.checkAutocomplete = function () {
  if (Config.Mobile) {
    return false;
  }
  var pos, value;
  if (this.richTextareaEl) {
    var textarea = this.richTextareaEl[0];
    var valueCaret = getRichValueWithCaret(textarea);
    var value = valueCaret[0];
    var pos = valueCaret[1] >= 0 ? valueCaret[1] : value.length;
  } else {
    var textarea = this.textareaEl[0];
    var pos = getFieldSelection(textarea);
    var value = textarea.value;
  }

  value = value.substr(0, pos);

  var matches = value.match(this.autoCompleteRegEx);
  if (matches) {
    if (this.previousQuery == matches[0]) {
      return;
    }
    this.previousQuery = matches[0];
    var query = SearchIndexManager.cleanSearchText(matches[2]);

    if (matches[1] == '@') { // mentions
      if (this.mentions && this.mentions.index) {
        if (query.length) {
          var foundObject = SearchIndexManager.search(query, this.mentions.index);
          var foundUsers = [];
          var user;
          for (var i = 0, length = this.mentions.users.length; i < length; i++) {
            user = this.mentions.users[i];
            if (foundObject[user.id]) {
              foundUsers.push(user);
            }
          }
        } else {
          var foundUsers = this.mentions.users;
        }
        if (foundUsers.length) {
          this.showMentionSuggestions(foundUsers);
        } else {
          this.hideSuggestions();
        }
      } else {
        this.hideSuggestions();
      }
    }
    else { // emoji
      EmojiHelper.getPopularEmoji((function (popular) {
        if (query.length) {
          var found = EmojiHelper.searchEmojis(query);
          if (found.length) {
            var popularFound = [],
                code, pos;
            for (var i = 0, len = popular.length; i < len; i++) {
              code = popular[i].code;
              pos = found.indexOf(code);
              if (pos >= 0) {
                popularFound.push(code);
                found.splice(pos, 1);
                if (!found.length) {
                  break;
                }
              }
            }
            this.showEmojiSuggestions(popularFound.concat(found));
          } else {
            this.hideSuggestions();
          }
        } else {
          this.showEmojiSuggestions(popular);
        }
      }).bind(this));
    }
  }
  else {
    delete this.previousQuery;
    this.hideSuggestions();
  }
}

MessageComposer.prototype.onFocusBlur = function (e) {
  this.isActive = e.type == 'focus';

  if (!this.isActive) {
    this.hideSuggestions();
  } else {
    setTimeout(this.checkAutocomplete.bind(this), 100);
  }
  if (this.richTextareaEl) {
    document.execCommand('enableObjectResizing', !this.isActive, !this.isActive);
  }
}

MessageComposer.prototype.onRichPaste = function (e) {
  var cData = (e.originalEvent || e).clipboardData,
      items = cData && cData.items || [],
      i;
  for (i = 0; i < items.length; i++) {
    if (items[i].kind == 'file') {
      e.preventDefault();
      return true;
    }
  }

  try {
    var text = cData.getData('text/plain');
  } catch (e) {
    return true;
  }
  setZeroTimeout(this.onChange.bind(this), 0);
  if (text.length) {
    document.execCommand('insertText', false, text);
    return cancelEvent(e);
  }
  return true;
}

MessageComposer.prototype.onRichPasteNode = function (e) {
  var element = (e.originalEvent || e).target,
      src = (element || {}).src || '',
      remove = false;

  if (src.substr(0, 5) == 'data:') {
    remove = true;
    var blob = dataUrlToBlob(src);
    this.onFilePaste(blob);
    setZeroTimeout(function () {
      element.parentNode.replaceChild(document.createTextNode('   '), element);
    })
  }
  else if (src && !src.match(/img\/blank\.gif/)) {
    var replacementNode = document.createTextNode(' ' + src + ' ');
    setTimeout(function () {
      element.parentNode.replaceChild(replacementNode, element);
    }, 100);
  }
}



MessageComposer.prototype.onEmojiSelected = function (code, autocomplete) {
  if (this.richTextareaEl) {
    var textarea = this.richTextareaEl[0];
    if (!this.isActive) {
      if (!this.restoreSelection()) {
        setRichFocus(textarea);
      }
    }
    if (autocomplete) {
      var valueCaret = getRichValueWithCaret(textarea);
      var fullValue = valueCaret[0];
      var pos = valueCaret[1] >= 0 ? valueCaret[1] : fullValue.length;
      var suffix = fullValue.substr(pos);
      var prefix = fullValue.substr(0, pos);
      var matches = prefix.match(/:([A-Za-z0-9\-\+\*_]*)$/);
      var emoji = EmojiHelper.emojis[code];

      var newValuePrefix;
      if (matches && matches[0]) {
        newValuePrefix = prefix.substr(0, matches.index) + ':' + emoji[1] + ':';
      } else {
        newValuePrefix = prefix + ':' + emoji[1] + ':';
      }
      textarea.value = newValue;

      this.selId = (this.selId || 0) + 1;
      var html = this.getRichHtml(newValuePrefix) + '&nbsp;<span id="composer_sel' + this.selId + '"></span>' + this.getRichHtml(suffix);

      this.richTextareaEl.html(html);
      setRichFocus(textarea, $('#composer_sel' + this.selId)[0]);
    } else {
      var html = this.getEmojiHtml(code);
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {

          var el = document.createElement('div');
          el.innerHTML = html;
          var node = el.firstChild;
          var range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(' '));
          range.insertNode(node);
          range.setStart(node, 0);

          setTimeout(function() {
            range = document.createRange();
            range.setStartAfter(node);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }, 0);
        }
      } else if (document.selection && document.selection.type != 'Control') {
        document.selection.createRange().pasteHTML(html);
      }
    }
  }
  else {
    var textarea = this.textareaEl[0];
    var fullValue = textarea.value;
    var pos = this.isActive ? getFieldSelection(textarea) : fullValue.length;
    var suffix = fullValue.substr(pos);
    var prefix = fullValue.substr(0, pos);
    var matches = autocomplete && prefix.match(/:([A-Za-z0-9\-\+\*_]*)$/);
    var emoji = EmojiHelper.emojis[code];

    if (matches && matches[0]) {
      var newValue = prefix.substr(0, matches.index) + ':' + emoji[1] + ': ' + suffix;
      var newPos = matches.index + emoji[1].length + 3;
    } else {
      var newValue = prefix + ':' + emoji[1] + ': ' + suffix;
      var newPos = prefix.length + emoji[1].length + 3;
    }
    textarea.value = newValue;
    setFieldSelection(textarea, newPos);
  }

  this.hideSuggestions();
  this.onChange();
}

MessageComposer.prototype.onMentionsUpdated = function (username) {
  delete this.previousQuery;
  if (this.isActive) {
    this.checkAutocomplete();
  }
}

MessageComposer.prototype.onMentionSelected = function (username) {
  if (this.richTextareaEl) {
    var textarea = this.richTextareaEl[0];
    if (!this.isActive) {
      if (!this.restoreSelection()) {
        setRichFocus(textarea);
      }
    }
    var valueCaret = getRichValueWithCaret(textarea);
    var fullValue = valueCaret[0];
    var pos = valueCaret[1] >= 0 ? valueCaret[1] : fullValue.length;
    var suffix = fullValue.substr(pos);
    var prefix = fullValue.substr(0, pos);
    var matches = prefix.match(/@([A-Za-z0-9\-\+\*_]*)$/);

    var newValuePrefix;
    if (matches && matches[0]) {
      newValuePrefix = prefix.substr(0, matches.index) + '@' + username;
    } else {
      newValuePrefix = prefix + '@' + username;
    }
    textarea.value = newValue;

    this.selId = (this.selId || 0) + 1;
    var html = this.getRichHtml(newValuePrefix) + '&nbsp;<span id="composer_sel' + this.selId + '"></span>' + this.getRichHtml(suffix);

    this.richTextareaEl.html(html);
    setRichFocus(textarea, $('#composer_sel' + this.selId)[0]);
  }
  else {
    var textarea = this.textareaEl[0];
    var fullValue = textarea.value;
    var pos = this.isActive ? getFieldSelection(textarea) : fullValue.length;
    var suffix = fullValue.substr(pos);
    var prefix = fullValue.substr(0, pos);
    var matches = prefix.match(/@([A-Za-z0-9\-\+\*_]*)$/);

    if (matches && matches[0]) {
      var newValue = prefix.substr(0, matches.index) + '@' + username + ' ' + suffix;
      var newPos = matches.index + username.length + 2;
    } else {
      var newValue = prefix + ':' + username + ': ' + suffix;
      var newPos = prefix.length + username.length + 2;
    }
    textarea.value = newValue;
    setFieldSelection(textarea, newPos);
  }

  this.hideSuggestions();
  this.onChange();
}

MessageComposer.prototype.onChange = function (e) {
  if (this.richTextareaEl) {
    delete this.keyupStarted;
    this.textareaEl.val(getRichValue(this.richTextareaEl[0])).trigger('change');
  }
}

MessageComposer.prototype.getEmojiHtml = function (code, emoji) {
  emoji = emoji || EmojiHelper.emojis[code];
  var iconSize = 20;
  var spritesheet = EmojiHelper.spritesheetPositions[code];
  var categoryIndex = spritesheet[0];
  var pos = spritesheet[1];
  var x = iconSize * spritesheet[3];
  var y = iconSize * spritesheet[2];

  return '<img src="img/blank.gif" alt=":' + encodeEntities(emoji[1]) + ':" data-code="' + encodeEntities(code) + '" class="emoji emoji-w20 emoji-spritesheet-' + categoryIndex + '" style="background-position: -' + x + 'px -' + y + 'px;" onresizestart="return false" />';
}

MessageComposer.prototype.setValue = function (text) {
  if (this.richTextareaEl) {
    this.richTextareaEl.html(this.getRichHtml(text));
    this.lastLength = text.length;
    this.wasEmpty = !text.length;
    this.onKeyEvent({type: 'keyup'});
  } else {
    this.textareaEl.val(text);
  }
}

MessageComposer.prototype.getRichHtml = function (text) {
  return $('<div>').text(text).html().replace(/\n/g, '<br/>').replace(/:([A-Za-z0-9\-\+\*_]+?):/gi, (function (all, shortcut) {
    var code = EmojiHelper.shortcuts[shortcut];
    if (code !== undefined) {
      return this.getEmojiHtml(code);
    }
    return all;
  }).bind(this));
}


MessageComposer.prototype.focus = function () {
  if (this.richTextareaEl) {
    setZeroTimeout((function () {
      setRichFocus(this.richTextareaEl[0]);
    }).bind(this));
  } else {
    setFieldSelection(this.textareaEl[0]);
  }
}


MessageComposer.prototype.showEmojiSuggestions = function (codes) {
  var html = [];
  var iconSize = Config.Mobile ? 26 : 20;

  var emoticonCode, emoticonData, spritesheet, pos, categoryIndex;
  var count = Math.min(5, codes.length);
  var i, x, y;

  for (i = 0; i < count; i++) {
    emoticonCode = codes[i];
    if (emoticonCode.code) {
      emoticonCode = emoticonCode.code;
    }
    if (emoticonData = Config.Emoji[emoticonCode]) {
      spritesheet = EmojiHelper.spritesheetPositions[emoticonCode];
      categoryIndex = spritesheet[0];
      pos = spritesheet[1];
      x = iconSize * spritesheet[3];
      y = iconSize * spritesheet[2];
      html.push('<li><a class="composer_emoji_option" data-code="' + encodeEntities(emoticonCode) + '"><i class="emoji emoji-w20 emoji-spritesheet-' + categoryIndex + '" style="background-position: -' + x + 'px -' + y + 'px;"></i><span class="composer_emoji_shortcut">:' + encodeEntities(emoticonData[1][0]) + ':</span></a></li>');
    }
  }

  this.autoCompleteEl.html(html.join(''));
  this.autoCompleteEl.show();
  this.updatePosition();
  this.autocompleteShown = true;
}

MessageComposer.prototype.showMentionSuggestions = function (users) {
  var html = [];
  var user;
  var count = Math.min(5, users.length);
  var i;

  for (i = 0; i < count; i++) {
    user = users[i];
    html.push('<li><a class="composer_mention_option" data-mention="' + user.username + '"><span class="composer_user_photo" data-user-id="' + user.id + '"></span><span class="composer_user_name">' + user.rFullName + '</span><span class="composer_user_mention">@' + user.username + '</span></a></li>');
  }

  this.autoCompleteEl.html(html.join(''));

  var self = this;
  this.autoCompleteEl.find('.composer_user_photo').each(function (k, element) {
    self.getPeerImage($(element), element.getAttribute('data-user-id'));
  });

  this.autoCompleteEl.show();
  this.updatePosition();
  this.autocompleteShown = true;
}

MessageComposer.prototype.updatePosition = function () {
  var offset = (this.richTextareaEl || this.textareaEl).offset();
  var height = this.autoCompleteEl.outerHeight();
  var width = (this.richTextareaEl || this.textareaEl).outerWidth();
  this.autoCompleteEl.css({top: offset.top - height, left: offset.left, width: width - 2});
}

MessageComposer.prototype.hideSuggestions = function () {
  this.autoCompleteEl.hide();
  delete this.autocompleteShown;
}

MessageComposer.prototype.resetTyping = function () {
  this.lastTyping = 0;
  this.lastLength = 0;
}

