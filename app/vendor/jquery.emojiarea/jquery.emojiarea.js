/**
 * emojiarea - A rich textarea control that supports emojis, WYSIWYG-style.
 * Copyright (c) 2012 DIY Co
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@diy.org>
 */

 /**
 * This file also contains some modifications by Igor Zhukov in order to add custom scrollbars to EmojiMenu
 * See keyword `MODIFICATION` in source code.
 */

(function($, window, document) {

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;
	var TAGS_BLOCK = ['p', 'div', 'pre', 'form'];
	var KEY_ESC = 27;
	var KEY_TAB = 9;

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	/*! MODIFICATION START
	 Options 'spritesheetPath', 'spritesheetDimens', 'iconSize' added by Andre Staltz.
	 */
	$.emojiarea = {
		path: '',
		spritesheetPath: '',
		spritesheetDimens: [],
		iconSize: 20,
		icons: {},
		defaults: {
			button: null,
			buttonLabel: 'Emojis',
			buttonPosition: 'after'
		}
	};
	var defaultRecentEmojis = ':joy:,:kissing_heart:,:heart:,:heart_eyes:,:blush:,:grin:,:+1:,:relaxed:,:pensive:,:smile:,:sob:,:kiss:,:unamused:,:flushed:,:stuck_out_tongue_winking_eye:,:see_no_evil:,:wink:,:smiley:,:cry:,:stuck_out_tongue_closed_eyes:,:scream:,:rage:,:smirk:,:disappointed:,:sweat_smile:,:kissing_closed_eyes:,:speak_no_evil:,:relieved:,:grinning:,:yum:,:laughing:,:ok_hand:,:neutral_face:,:confused:'.split(',');
	/*! MODIFICATION END */

	$.fn.emojiarea = function(options) {
		options = $.extend({}, $.emojiarea.defaults, options);
		return this.each(function() {
			var $textarea = $(this);
			if ('contentEditable' in document.body && options.wysiwyg !== false) {
				new EmojiArea_WYSIWYG($textarea, options);
			} else {
				new EmojiArea_Plain($textarea, options);
			}
		});
	};

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	var util = {};

	util.restoreSelection = (function() {
		if (window.getSelection) {
			return function(savedSelection) {
				var sel = window.getSelection();
				sel.removeAllRanges();
				for (var i = 0, len = savedSelection.length; i < len; ++i) {
					sel.addRange(savedSelection[i]);
				}
			};
		} else if (document.selection && document.selection.createRange) {
			return function(savedSelection) {
				if (savedSelection) {
					savedSelection.select();
				}
			};
		}
	})();

	util.saveSelection = (function() {
		if (window.getSelection) {
			return function() {
				var sel = window.getSelection(), ranges = [];
				if (sel.rangeCount) {
					for (var i = 0, len = sel.rangeCount; i < len; ++i) {
						ranges.push(sel.getRangeAt(i));
					}
				}
				return ranges;
			};
		} else if (document.selection && document.selection.createRange) {
			return function() {
				var sel = document.selection;
				return (sel.type.toLowerCase() !== 'none') ? sel.createRange() : null;
			};
		}
	})();

	util.replaceSelection = (function() {
		if (window.getSelection) {
			return function(content) {
				var range, sel = window.getSelection();
				var node = typeof content === 'string' ? document.createTextNode(content) : content;
				if (sel.getRangeAt && sel.rangeCount) {
					range = sel.getRangeAt(0);
					range.deleteContents();
					range.insertNode(document.createTextNode(' '));
					range.insertNode(node);
					range.setStart(node, 0);

					window.setTimeout(function() {
						range = document.createRange();
						range.setStartAfter(node);
						range.collapse(true);
						sel.removeAllRanges();
						sel.addRange(range);
					}, 0);
				}
			}
		} else if (document.selection && document.selection.createRange) {
			return function(content) {
				var range = document.selection.createRange();
				if (typeof content === 'string') {
					range.text = content;
				} else {
					range.pasteHTML(content.outerHTML);
				}
			}
		}
	})();

	util.insertAtCursor = function(text, el) {
		text = ' ' + text;
		var val = el.value, endIndex, startIndex, range;
		if (typeof el.selectionStart != 'undefined' && typeof el.selectionEnd != 'undefined') {
			startIndex = el.selectionStart;
			endIndex = el.selectionEnd;
			el.value = val.substring(0, startIndex) + text + val.substring(el.selectionEnd);
			el.selectionStart = el.selectionEnd = startIndex + text.length;
		} else if (typeof document.selection != 'undefined' && typeof document.selection.createRange != 'undefined') {
			el.focus();
			range = document.selection.createRange();
			range.text = text;
			range.select();
		}
	};

	util.extend = function(a, b) {
		if (typeof a === 'undefined' || !a) { a = {}; }
		if (typeof b === 'object') {
			for (var key in b) {
				if (b.hasOwnProperty(key)) {
					a[key] = b[key];
				}
			}
		}
		return a;
	};

	util.escapeRegex = function(str) {
		return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
	};

	util.htmlEntities = function(str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	};

	/*! MODIFICATION START
		 This function was added by Igor Zhukov to save recent used emojis.
		 */
	util.emojiInserted = function (emojiKey, menu, quickSelect) {
		ConfigStorage.get('emojis_recent', function (curEmojis) {
			curEmojis = curEmojis || defaultRecentEmojis || [];
			if (curEmojis.length && typeof curEmojis[0] === 'string') {
				var newCurEmojis = [];
				for (var i = 0, l = curEmojis.length; i < l; i++) {
					newCurEmojis.push([curEmojis[i], 1]);
				}
				curEmojis = newCurEmojis;
			}

			var exists = false;
			for (var i = 0, l = curEmojis.length; i < l; i++) {
				if (curEmojis[i][0] == emojiKey) {
					exists = true;
					curEmojis[i][1]++;
					break;
				}
			}
			if (exists) {
				curEmojis.sort(function (a, b) {
					if (a[1] == b[1]) return 0;
					return a[1] > b[1] ? -1 : 1;
				});
			} else {
				if (curEmojis.length > 41) {
					curEmojis = curEmojis.slice(0, 41);
				}
				curEmojis.push([emojiKey, 1]);
			}

			ConfigStorage.set({emojis_recent: curEmojis});

			if (quickSelect) {
				quickSelect.changed = true;
			}
		})
	};
	/*! MODIFICATION END */

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	var EmojiArea = function() {};

	EmojiArea.prototype.setup = function() {
		var self = this;

		this.$editor.on('focus', function() { self.hasFocus = true; });
		this.$editor.on('blur', function() { self.hasFocus = false; });

		this.setupButton();

		if (this.options.quickSelect) {
			var $items = $(this.options.quickSelect);
			this.quickSelect = new EmojiQuickSelectArea(self, $items);
		}
	};

	EmojiArea.prototype.setupButton = function() {
		var self = this;
		var $button;

		if (this.options.button) {
			$button = $(this.options.button);
		} else if (this.options.button !== false) {
			$button = $('<a href="javascript:void(0)">');
			$button.html(this.options.buttonLabel);
			$button.addClass('emoji-button');
			$button.attr({title: this.options.buttonLabel});
			this.$editor[this.options.buttonPosition]($button);
		} else {
			$button = $('');
		}

		$button.on('click', function(e) {
			EmojiMenu.show(self);
			e.stopPropagation();
		});

		this.$button = $button;
	};

	/*! MODIFICATION START
	 This function was modified by Andre Staltz so that the icon is created from a spritesheet.
	 */
	EmojiArea.createIcon = function(emoji, menu) {
		var category = emoji[0];
		var row = emoji[1];
		var column = emoji[2];
		var name = emoji[3];
		var filename = $.emojiarea.spritesheetPath;
		var iconSize = menu && Config.Mobile ? 26 : $.emojiarea.iconSize
		var xoffset = -(iconSize * column);
		var yoffset = -(iconSize * row);
		var scaledWidth = ($.emojiarea.spritesheetDimens[category][1] * iconSize);
		var scaledHeight = ($.emojiarea.spritesheetDimens[category][0] * iconSize);

		var style = 'display:inline-block;';
		style += 'width:' + iconSize + 'px;';
		style += 'height:' + iconSize + 'px;';
		style += 'background:url(\'' + filename.replace('!',category) + '\') ' + xoffset + 'px ' + yoffset + 'px no-repeat;';
		style += 'background-size:' + scaledWidth + 'px ' + scaledHeight + 'px;';
		return '<img src="img/blank.gif" class="img" style="'+ style +'" alt="' + util.htmlEntities(name) + '">';
	};
	/*! MODIFICATION END */

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	/**
	 * Editor (plain-text)
	 *
	 * @constructor
	 * @param {object} $textarea
	 * @param {object} options
	 */

	var EmojiArea_Plain = function($textarea, options) {
		this.options = options;
		this.$textarea = $textarea;
		this.$editor = $textarea;
		this.setup();
	};

	EmojiArea_Plain.prototype.insert = function(emoji) {
		if (!$.emojiarea.icons.hasOwnProperty(emoji)) return;
		util.insertAtCursor(emoji, this.$textarea[0]);
		/* MODIFICATION: Following line was added by Igor Zhukov, in order to save recent emojis */
		util.emojiInserted(emoji, this.menu, this.quickSelect);
		this.$textarea.trigger('change');
	};

	EmojiArea_Plain.prototype.val = function() {
		return this.$textarea.val();
	};

	util.extend(EmojiArea_Plain.prototype, EmojiArea.prototype);

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	/**
	 * Editor (rich)
	 *
	 * @constructor
	 * @param {object} $textarea
	 * @param {object} options
	 */

	var EmojiArea_WYSIWYG = function($textarea, options) {
		var self = this;

		this.options = options || {};
		this.$textarea = $textarea;
		this.$editor = $('<div>').addClass('emoji-wysiwyg-editor');
		this.$editor.text($textarea.val());
		this.$editor.attr({contenteditable: 'true'});
		/*! MODIFICATION START
			Following code was modified by Igor Zhukov, in order to improve rich text paste
		*/
		var changeEvents = 'blur change';
		if (!this.options.norealTime) {
			changeEvents += ' keyup';
		}
		this.$editor.on(changeEvents, function(e) { return self.onChange.apply(self, [e]); });
		this.$editor.on('paste', function(e) { return self.onPaste.apply(self, [e]); });
		/*! MODIFICATION END */

		this.$editor.on('mousedown focus', function() { document.execCommand('enableObjectResizing', false, false); });
		this.$editor.on('blur', function() { document.execCommand('enableObjectResizing', true, true); });

		var html = this.$editor.text();
		var emojis = $.emojiarea.icons;
		for (var key in emojis) {
			if (emojis.hasOwnProperty(key)) {
				/* MODIFICATION: Following line was modified by Andre Staltz, to use new implementation of createIcon function.*/
				html = html.replace(new RegExp(util.escapeRegex(key), 'g'), EmojiArea.createIcon(emojis[key]));
			}
		}
		this.$editor.html(html);

		$textarea.hide().after(this.$editor);

		this.setup();

		/* MODIFICATION: Following line was modified by Igor Zhukov, in order to improve emoji insert behaviour */
		$(document.body).on('mousedown', function() {
			if (self.hasFocus) {
				self.selection = util.saveSelection();
			}
		});
	};

	/*! MODIFICATION START
			Following code was modified by Igor Zhukov, in order to improve rich text paste
		*/
	EmojiArea_WYSIWYG.prototype.onPaste = function(e) {
		var cData = (e.originalEvent || e).clipboardData,
				items = cData && cData.items || [],
				i;
		for (i = 0; i < items.length; i++) {
			if (items[i].kind == 'file') {
				e.preventDefault();
				return true;
			}
		}

		var text = (e.originalEvent || e).clipboardData.getData('text/plain'),
				self = this;
		setTimeout(function () {
			self.onChange();
		}, 0);
		if (text.length) {
			document.execCommand('insertText', false, text);
			return cancelEvent(e);
		}
		return true;
	};
	/*! MODIFICATION END */

	EmojiArea_WYSIWYG.prototype.onChange = function(e) {
		this.$textarea.val(this.val()).trigger('change');
	};

	EmojiArea_WYSIWYG.prototype.insert = function(emoji) {
		var content;
		/* MODIFICATION: Following line was modified by Andre Staltz, to use new implementation of createIcon function.*/
		var $img = $(EmojiArea.createIcon($.emojiarea.icons[emoji]));
		if ($img[0].attachEvent) {
			$img[0].attachEvent('onresizestart', function(e) { e.returnValue = false; }, false);
		}

		if (!this.hasFocus) {
			this.$editor.trigger('focus');
			if (this.selection) {
				util.restoreSelection(this.selection);
			}
		}
		try { util.replaceSelection($img[0]); } catch (e) {}

		/*! MODIFICATION START
			Following code was modified by Igor Zhukov, in order to improve selection handling
		*/
		var self = this;
		setTimeout(function () {
			self.selection = util.saveSelection();
		}, 100);
		/*! MODIFICATION END */

		/* MODIFICATION: Following line was added by Igor Zhukov, in order to save recent emojis */
		util.emojiInserted(emoji, this.menu, this.quickSelect);


		this.onChange();
	};

	EmojiArea_WYSIWYG.prototype.val = function() {
		var lines = [];
		var line  = [];

		var flush = function() {
			lines.push(line.join(''));
			line = [];
		};

		var sanitizeNode = function(node) {
			if (node.nodeType === TEXT_NODE) {
				line.push(node.nodeValue);
			} else if (node.nodeType === ELEMENT_NODE) {
				var tagName = node.tagName.toLowerCase();
				var isBlock = TAGS_BLOCK.indexOf(tagName) !== -1;

				if (isBlock && line.length) flush();

				if (tagName === 'img') {
					var alt = node.getAttribute('alt') || '';
					if (alt) line.push(alt);
					return;
				} else if (tagName === 'br') {
					flush();
				}

				var children = node.childNodes;
				for (var i = 0; i < children.length; i++) {
					sanitizeNode(children[i]);
				}

				if (isBlock && line.length) flush();
			}
		};

		var children = this.$editor[0].childNodes;
		for (var i = 0; i < children.length; i++) {
			sanitizeNode(children[i]);
		}

		if (line.length) flush();

		return lines.join('\n');
	};

	util.extend(EmojiArea_WYSIWYG.prototype, EmojiArea.prototype);

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	/**
	 * Emoji Dropdown Menu
	 *
	 * @constructor
	 * @param {object} emojiarea
	 */
	var EmojiMenu = function() {
		var self = this;
		var $body = $(document.body);
		var $window = $(window);

		this.visible = false;
		this.emojiarea = null;
		this.$menu = $('<div>');
		this.$menu.addClass('emoji-menu');
		this.$menu.hide();

		/*! MODIFICATION START
			Following code was modified by Igor Zhukov, in order to add scrollbars and tail to EmojiMenu
			Also modified by Andre Staltz, to include tabs for categories, on the menu header.
		*/
		this.$itemsTailWrap = $('<div class="emoji-items-wrap1"></div>').appendTo(this.$menu);
		this.$categoryTabs = $('<table class="emoji-menu-tabs"><tr>' +
		'<td><a class="emoji-menu-tab icon-recent" ></a></td>' +
		'<td><a class="emoji-menu-tab icon-smile" ></a></td>' +
		'<td><a class="emoji-menu-tab icon-flower"></a></td>' +
		'<td><a class="emoji-menu-tab icon-bell"></a></td>' +
		'<td><a class="emoji-menu-tab icon-car"></a></td>' +
		'<td><a class="emoji-menu-tab icon-grid"></a></td>' +
		'</tr></table>').appendTo(this.$itemsTailWrap);
		this.$itemsWrap = $('<div class="emoji-items-wrap nano mobile_scrollable_wrap"></div>').appendTo(this.$itemsTailWrap);
		this.$items = $('<div class="emoji-items nano-content">').appendTo(this.$itemsWrap);
		/*! MODIFICATION END */

		$body.append(this.$menu);

		/*! MODIFICATION: Following 3 lines were added by Igor Zhukov, in order to add scrollbars to EmojiMenu  */
		if (!Config.Mobile) {
			this.$itemsWrap.nanoScroller({preventPageScrolling: true, tabIndex: -1});
		}

		$body.on('keydown', function(e) {
			if (e.keyCode === KEY_ESC || e.keyCode === KEY_TAB) {
				self.hide();
			}
		});

		/*! MODIFICATION: Following 3 lines were added by Igor Zhukov, in order to hide menu on message submit with keyboard */
		$body.on('message_send', function(e) {
			self.hide();
		});

		$body.on('mouseup', function(e) {
			/*! MODIFICATION START
				Following code was added by Igor Zhukov, in order to prevent close on click on EmojiMenu scrollbar
			*/
			e = e.originalEvent || e;
			var target = e.originalTarget || e.target || window;
			while (target && target != window) {
				target = target.parentNode;
				if (target == self.$menu[0] || self.emojiarea && target == self.emojiarea.$button[0]) {
					return;
				}
			}
			/*! MODIFICATION END */
			self.hide();
		});

		$window.on('resize', function() {
			if (self.visible) self.reposition();
		});

		this.$menu.on('mouseup', 'a', function(e) {
			e.stopPropagation();
			return false;
		});

		this.$menu.on('click', 'a', function(e) {
			/*! MODIFICATION START
			 Following code was modified by Andre Staltz, to capture clicks on category tabs and change the category selection.
			 */
			if ($(this).hasClass('emoji-menu-tab')) {
				if (self.getTabIndex(this) !== self.currentCategory) {
					self.selectCategory(self.getTabIndex(this));
				}
				return false;
			}
			/*! MODIFICATION END */
			var emoji = $('.label', $(this)).text();
			window.setTimeout(function() {
				self.onItemSelected(emoji);
				/*! MODIFICATION START
					Following code was modified by Igor Zhukov, in order to close only on ctrl-, alt- emoji select
				*/
				if (e.ctrlKey || e.metaKey) {
					self.hide();
				}
				/*! MODIFICATION END */
			}, 0);
			e.stopPropagation();
			return false;
		});

		/* MODIFICATION: Following line was modified by Andre Staltz, in order to select a default category. */
		this.selectCategory(0);
	};

	/*! MODIFICATION START
	 Following code was added by Andre Staltz, to implement category selection.
	 */
	EmojiMenu.prototype.getTabIndex = function(tab) {
		return this.$categoryTabs.find('.emoji-menu-tab').index(tab);
	};

	EmojiMenu.prototype.selectCategory = function(category) {
		var self = this;
		this.$categoryTabs.find('.emoji-menu-tab').each(function(index) {
			if (index === category) {
				this.className += '-selected';
			}
			else {
				this.className = this.className.replace('-selected', '');
			}
		});
		this.currentCategory = category;
		this.load(category);
		if (!Config.Mobile) {
	    this.$itemsWrap.nanoScroller({ scroll: 'top' });
		}
	};
	/*! MODIFICATION END */

	EmojiMenu.prototype.onItemSelected = function(emoji) {
		this.emojiarea.insert(emoji);
	};

	/* MODIFICATION:
		The following function argument was modified by Andre Staltz, in order to load only icons from a category.
		Also function was modified by Igor Zhukov in order to display recent emojis from localStorage
	*/
	EmojiMenu.prototype.load = function(category) {
		var html = [];
		var options = $.emojiarea.icons;
		var path = $.emojiarea.path;
		var self = this;
		if (path.length && path.charAt(path.length - 1) !== '/') {
			path += '/';
		}

		/*! MODIFICATION: Following function was added by Igor Zhukov, in order to add scrollbars to EmojiMenu */
		var updateItems = function () {
			self.$items.html(html.join(''));

			if (!Config.Mobile && self.$itemsWrap) {
				setTimeout(function () {
					self.$itemsWrap.nanoScroller();
				}, 100);
			}
		}

		if (category > 0) {
			for (var key in options) {
				/* MODIFICATION: The following 2 lines were modified by Andre Staltz, in order to load only icons from the specified category. */
				if (options.hasOwnProperty(key) && options[key][0] === (category - 1)) {
					html.push('<a href="javascript:void(0)" title="' + util.htmlEntities(key) + '">' + EmojiArea.createIcon(options[key], true) + '<span class="label">' + util.htmlEntities(key) + '</span></a>');
				}
			}
			updateItems();
		} else {
			ConfigStorage.get('emojis_recent', function (curEmojis) {
				curEmojis = curEmojis || defaultRecentEmojis || [];
				var key, i;
				for (i = 0; i < curEmojis.length; i++) {
					key = curEmojis[i];
					if (Array.isArray(key)) {
						key = key[0];
					}
					if (options[key]) {
						html.push('<a href="javascript:void(0)" title="' + util.htmlEntities(key) + '">' + EmojiArea.createIcon(options[key], true) + '<span class="label">' + util.htmlEntities(key) + '</span></a>');
					}
				}
				updateItems();
			});
		}
	};

	EmojiMenu.prototype.reposition = function() {
		var $button = this.emojiarea.$button;
		var offset = $button.offset();
		offset.top += $button.outerHeight();
		offset.left += Math.round($button.outerWidth() / 2);

		this.$menu.css({
			top: offset.top,
			left: offset.left
		});
	};

	EmojiMenu.prototype.hide = function(callback) {
		if (this.emojiarea) {
			this.emojiarea.menu = null;
			this.emojiarea.$button.removeClass('on');
			this.emojiarea = null;
		}


		this.visible = false;
		this.$menu.hide();
	};

	EmojiMenu.prototype.show = function(emojiarea) {
		/* MODIFICATION: Following line was modified by Igor Zhukov, in order to improve EmojiMenu behaviour */
		if (this.emojiarea && this.emojiarea === emojiarea) return this.hide();
		emojiarea.$button.addClass('on');
		this.emojiarea = emojiarea;
		this.emojiarea.menu = this;

		this.reposition();
		this.$menu.show();
		/* MODIFICATION: Following 3 lines were added by Igor Zhukov, in order to update EmojiMenu contents */
		if (!this.currentCategory) {
			this.load(0);
		}
		this.visible = true;
	};

	EmojiMenu.show = (function() {
		var menu = null;
		return function(emojiarea) {
			menu = menu || new EmojiMenu();
			menu.show(emojiarea);
		};
	})();

	var EmojiQuickSelectArea = function(emojiarea, $items) {
		var self = this;
		var $body = $(document.body);

		this.emojiarea = emojiarea;
		this.changed = false;
		this.$items = $items;

		this.load(0);
		this.$items.on('mousedown', 'a', function(e) {
			var emoji = $('.label', $(this)).text();
			self.onItemSelected(emoji);
			self.changed = true;
			e.stopPropagation();
			return false;
		});
		$body.on('message_send', function(e) {
			if (self.changed) {
				self.load(0);
				self.changed = false;
			}
		});
	};

	util.extend(EmojiQuickSelectArea.prototype, EmojiMenu.prototype);

})(jQuery, window, document);
