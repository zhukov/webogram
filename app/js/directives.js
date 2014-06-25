/*!
 * Webogram v0.1.7 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Directives */


angular.module('myApp.directives', ['myApp.filters'])

  .directive('myHead', function() {
    return {
      restrict: 'AE',
      scope: true,
      templateUrl: 'partials/head.html'
    };
  })

  .directive('myDialog', function() {
    return {
      restrict: 'AE',
      scope: true,
      translude: false,
      templateUrl: 'partials/dialog.html'
    };
  })

  .directive('myMessage', function() {
    return {
      restrict: 'AE',
      scope: true,
      translude: false,
      templateUrl: 'partials/message.html'
    };
  })

  .directive('myDialogs', function ($modalStack, $transition) {

    return {
      link: link
    };


    function link ($scope, element, attrs) {
      var dialogsWrap = $('.im_dialogs_wrap', element)[0],
          scrollableWrap = $('.im_dialogs_scrollable_wrap', element)[0],
          searchField = $('.im_dialogs_search_field', element)[0],
          tabsWrap = $('.im_dialogs_tabs_wrap', element)[0],
          searchFocused = false;


      $(searchField).on('focus blur', function (e) {
        searchFocused = e.type == 'focus';

        if (!searchFocused) {
          $(scrollableWrap).find('.im_dialog_selected').removeClass('im_dialog_selected');
        }
      });

      attrs.$observe('hasTabs', function (newValue) {
        newValue = newValue == 'true';
        $(tabsWrap).toggle(newValue);
        $scope.$broadcast('ui_dialogs_tabs', newValue);
      });

      $(document).on('keydown', onKeyDown);

      $scope.$on('$destroy', function () {
        $(document).off('keydown', onKeyDown);
      });


      function onKeyDown(e) {
        if (!searchFocused && $modalStack.getTop()) {
          return true;
        }

        if (e.keyCode == 36 &&  !e.shiftKey && !e.ctrlKey && e.altKey) { // Alt + Home
          var currentSelected = $(scrollableWrap).find('.im_dialog_wrap a')[0];
          if (currentSelected) {
            currentSelected.click();
            scrollableWrap.scrollTop = 0;
            $(dialogsWrap).nanoScroller({flash: true});
          }
          return cancelEvent(e);
        }

        if (e.keyCode == 27 || e.keyCode == 9 && e.shiftKey && !e.ctrlKey && !e.metaKey) { // ESC or Shift + Tab
          if (!searchFocused) {
            searchField.focus();
            if (searchField.value) {
              searchField.select();
            }
          }
          return cancelEvent(e);
        }

        if (searchFocused && e.keyCode == 13) { // Enter
          var currentSelected = $(scrollableWrap).find('.im_dialog_selected')[0] || $(scrollableWrap).find('.im_dialog_wrap a')[0];
          if (currentSelected) {
            currentSelected.click();
          }
          return cancelEvent(e);
        }

        if (e.keyCode == 38 || e.keyCode == 40) { // UP, DOWN
          var skip = !e.shiftKey && e.altKey;
          if (!skip && (!searchFocused || e.metaKey)) {
            return true;
          }

          var next = e.keyCode == 40,
              currentSelected = !skip && $(scrollableWrap).find('.im_dialog_selected')[0] || $(scrollableWrap).find('.active a.im_dialog')[0],
              currentSelectedWrap = currentSelected && currentSelected.parentNode,
              nextDialogWrap;

          if (currentSelectedWrap) {
            var nextDialogWrap = currentSelected[next ? 'nextSibling' : 'previousSibling'];

            if (!nextDialogWrap || !nextDialogWrap.className || nextDialogWrap.className.indexOf('im_dialog_wrap') == -1) {
              var dialogWraps = $(scrollableWrap).find('.im_dialog_wrap'),
                  pos = dialogWraps.index(currentSelected.parentNode),
                  nextPos = pos + (next ? 1 : -1);

              nextDialogWrap = dialogWraps[nextPos];
            }
          } else {
            var dialogWraps = $(scrollableWrap).find('.im_dialog_wrap');
            if (next) {
              nextDialogWrap = dialogWraps[0];
            } else {
              nextDialogWrap = dialogWraps[dialogWraps.length - 1];
            }
          }

          if (skip) {
            if (nextDialogWrap) {
              $(nextDialogWrap).find('a')[0].click();
            }
          } else {
            if (currentSelectedWrap && nextDialogWrap) {
              $(currentSelectedWrap).find('a').removeClass('im_dialog_selected');
            }
            if (nextDialogWrap) {
              $(nextDialogWrap).find('a').addClass('im_dialog_selected');
            }
          }

          if (nextDialogWrap) {
            var elTop = nextDialogWrap.offsetTop,
                elHeight = nextDialogWrap.offsetHeight,
                scrollTop = scrollableWrap.scrollTop,
                viewportHeight = scrollableWrap.clientHeight;


            if (scrollTop > elTop) {
              scrollableWrap.scrollTop = elTop;
              $(dialogsWrap).nanoScroller({flash: true});
            }
            else if (scrollTop < elTop + elHeight - viewportHeight) {
              scrollableWrap.scrollTop = elTop + elHeight - viewportHeight;
              $(dialogsWrap).nanoScroller({flash: true});
            }

          }

          return cancelEvent(e);
        }
      }

    }


  })

  .directive('myDialogsList', function($window, $timeout) {

    return {
      link: link
    };


    function link ($scope, element, attrs) {
      var dialogsWrap = $('.im_dialogs_wrap', element)[0],
          scrollableWrap = $('.im_dialogs_scrollable_wrap', element)[0],
          headWrap = $('.tg_page_head')[0],
          footer = $('.im_page_footer')[0],
          hasTabs = false,
          moreNotified = false;

      onContentLoaded(function () {
        $(dialogsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
      });

      var updateScroller = function () {
        onContentLoaded(function () {
          $(dialogsWrap).nanoScroller();
        });
      }

      $scope.$on('ui_dialogs_prepend', updateScroller);

      $scope.$on('ui_dialogs_tabs', function (e, newHasTabs) {
        hasTabs = newHasTabs;
        updateSizes();
      })


      $scope.$on('ui_dialogs_append', function () {
        onContentLoaded(function () {
          updateScroller();
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          updateScroller();
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $(scrollableWrap).on('scroll', function (e) {
        // console.log('scroll', moreNotified);
        if (!moreNotified && scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          // console.log('emit need more');
          $scope.$emit('dialogs_need_more');
          moreNotified = true;
        }
      });


      function updateSizes () {
        if (attrs.modal) {
          $(element).css({
            height: $($window).height() -
                    (Config.Navigator.mobile ? 100 : 200)
          });
          updateScroller();
          return;
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0];
        }
        if (!footer || !footer.offsetHeight) {
          footer = $('.im_page_footer')[0];
        }
        $(element).css({
          height: $($window).height() - footer.offsetHeight - (headWrap ? headWrap.offsetHeight : 44) - (hasTabs ? 38 : 0) - 68
        });

        updateScroller();
      }

      $($window).on('resize', updateSizes);

      updateSizes();
      setTimeout(updateSizes, 1000);
    };

  })

  .directive('myContactsList', function($window, $timeout) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var searchWrap = $('.contacts_modal_search')[0],
          panelWrap = $('.contacts_modal_panel')[0],
          contactsWrap = $('.contacts_wrap', element)[0];

      onContentLoaded(function () {
        $(contactsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
        updateSizes();
      });

      function updateSizes () {
        $(element).css({
          height: $($window).height() -
                  (panelWrap && panelWrap.offsetHeight || 0) -
                  (searchWrap && searchWrap.offsetHeight || 0) -
                  (Config.Navigator.mobile ? 100 : 200)
        });
        $(contactsWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);
      $scope.$on('contacts_change', function () {
        onContentLoaded(updateSizes)
      });
    };

  })

  .directive('myCountriesList', function($window, $timeout) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var searchWrap = $('.countries_modal_search')[0],
          panelWrap = $('.countries_modal_panel')[0],
          countriesWrap = $('.countries_wrap', element)[0];

      onContentLoaded(function () {
        $(countriesWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
        updateSizes();
      });

      function updateSizes () {
        $(element).css({
          height: $($window).height() - (panelWrap && panelWrap.offsetHeight || 0) - (searchWrap && searchWrap.offsetHeight || 0) - 200
        });
        $(countriesWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);
      $scope.$on('contacts_change', function () {
        onContentLoaded(updateSizes)
      });
    };

  })

  .directive('myHistory', function ($window, $timeout, $rootScope, $transition) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var historyWrap = $('.im_history_wrap', element)[0],
          historyMessagesEl = $('.im_history_messages', element)[0],
          historyEl = $('.im_history', element)[0],
          scrollableWrap = $('.im_history_scrollable_wrap', element)[0],
          scrollable = $('.im_history_scrollable', element)[0],
          panelWrap = $('.im_history_panel_wrap', element)[0],
          bottomPanelWrap = $('.im_bottom_panel_wrap', element)[0],
          sendFormWrap = $('.im_send_form_wrap', element)[0],
          headWrap = $('.tg_page_head')[0],
          footer = $('.im_page_footer')[0],
          sendForm = $('.im_send_form', element)[0],
          moreNotified = false,
          lessNotified = false;

      onContentLoaded(function () {
        scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
        $(historyWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
      });

      var updateScroller = function (delay) {
        // console.trace('scroller update', delay);
        $timeout(function () {
          if (!$(scrollableWrap).hasClass('im_history_to_bottom')) {
            $(historyWrap).nanoScroller();
          }
        }, delay || 0);
      }

      var transform = false,
          trs = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'OTransform'],
          i;
      for (i = 0; i < trs.length; i++) {
        if (trs[i] in historyMessagesEl.style) {
          transform = trs[i];
          break;
        }
      }

      var animated = transform ? true : false,
          curAnimation = false;

      $scope.$on('ui_history_append_new', function (e, options) {
        if (!atBottom && !options.my) {
          return;
        }
        var curAnimated = animated && !$rootScope.idle.isIDLE,
            wasH;
        if (!curAnimated) {
          $(scrollable).css({bottom: 0});
          $(scrollableWrap).addClass('im_history_to_bottom');
        } else {
          wasH = scrollableWrap.scrollHeight;
        }

        onContentLoaded(function () {
          if (curAnimated) {
            curAnimation = true;
            $(historyMessagesEl).removeClass('im_history_appending');
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
            $(historyMessagesEl).css(transform, 'translate(0px, ' + (scrollableWrap.scrollHeight - wasH) + 'px)');
            $(historyWrap).nanoScroller();
            var styles = {};
            styles[transform] = 'translate(0px, 0px)';
            $(historyMessagesEl).addClass('im_history_appending');
            $transition($(historyMessagesEl), styles).then(function () {
              curAnimation = false;
              $(historyMessagesEl).removeClass('im_history_appending');
              updateBottomizer();
            });
          } else {
            $(scrollableWrap).removeClass('im_history_to_bottom');
            $(scrollable).css({bottom: ''});
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
            updateBottomizer();
            $(historyWrap).nanoScroller();
          }
        });
      });

      function changeScroll () {
        var unreadSplit, focusMessage;

        if (focusMessage = $('.im_message_focus', scrollableWrap)[0]) {
          scrollableWrap.scrollTop = Math.max(0, focusMessage.offsetTop - Math.floor(scrollableWrap.clientHeight / 2) + 26);
          atBottom = false;
        } else if (unreadSplit = $('.im_message_unread_split', scrollableWrap)[0]) {
          scrollableWrap.scrollTop = Math.max(0, unreadSplit.offsetTop - 52);
          atBottom = false;
        } else {
          scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
        }
        updateScroller();
        $timeout(function () {
          $(scrollableWrap).trigger('scroll');
        });
      };

      $scope.$on('ui_history_change', function () {
        $(scrollableWrap).addClass('im_history_to_bottom');
        $(scrollable).css({bottom: 0});
        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: ''});
          updateSizes(true);
          moreNotified = false;
          lessNotified = false;
          changeScroll();
        });
      });

      $scope.$on('ui_history_change_scroll', function () {
        onContentLoaded(changeScroll)
      });

      $scope.$on('ui_history_focus', function () {
        if (!atBottom) {
          scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
          updateScroller();
          atBottom = true;
        }
      });

      $scope.$on('ui_history_prepend', function () {
        var sh = scrollableWrap.scrollHeight,
            st = scrollableWrap.scrollTop,
            ch = scrollableWrap.clientHeight;

        $(scrollableWrap).addClass('im_history_to_bottom');
        scrollableWrap.scrollHeight; // Some strange Chrome bug workaround
        $(scrollable).css({bottom: -(sh - st - ch)});

        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: ''});
          scrollableWrap.scrollTop = st + scrollableWrap.scrollHeight - sh;

          updateBottomizer();
          moreNotified = false;

          $timeout(function () {
            if (scrollableWrap.scrollHeight != sh) {
              $(scrollableWrap).trigger('scroll');
            }
          });
        });
      });

      $scope.$on('ui_history_append', function () {
        var sh = scrollableWrap.scrollHeight;
        onContentLoaded(function () {
          atBottom = false;
          updateBottomizer();
          lessNotified = false;

          $timeout(function () {
            if (scrollableWrap.scrollHeight != sh) {
              $(scrollableWrap).trigger('scroll');
            }
          });
        });
      });

      $scope.$on('ui_panel_update', function () {
        onContentLoaded(function () {
          updateSizes();
          $scope.$broadcast('ui_message_send');

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $scope.$on('ui_selection_clear', function () {
        if (window.getSelection) {
          if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
          } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
          }
        } else if (document.selection) {  // IE?
          document.selection.empty();
        }
      });

      $scope.$on('ui_editor_resize', updateSizes);
      $scope.$on('ui_height', function () {
        onContentLoaded(updateSizes);
        // updateSizes();
      });

      var atBottom = true;
      $(scrollableWrap).on('scroll', function (e) {
        if ($(scrollableWrap).hasClass('im_history_to_bottom')) {
          return cancelEvent(e);
        }
        if (curAnimation) {
          return;
        }
        atBottom = scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight;

        if (!moreNotified && scrollableWrap.scrollTop <= 300) {
          moreNotified = true;
          $scope.$emit('history_need_more');
        }
        else if (!lessNotified && scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          lessNotified = true;
          $scope.$emit('history_need_less');
        }
      });

      function updateSizes (heightOnly) {
        if (!element.is(':visible') || !$(element[0].parentNode).is(':visible')) {
          return;
        }
        if ($(sendFormWrap).is(':visible')) {
          $(sendFormWrap).css({
            height: $(sendForm).height()
          });
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0];
        }
        if (!footer || !footer.offsetHeight) {
          footer = $('.im_page_footer')[0];
        }
        var historyH = $($window).height() - panelWrap.offsetHeight - bottomPanelWrap.offsetHeight - (headWrap ? headWrap.offsetHeight : 44) - footer.offsetHeight;
        $(historyWrap).css({
          height: historyH
        });
        $(historyEl).css({
          minHeight: historyH - 44
        });

        updateBottomizer();


        if (heightOnly === true) return;
        if (atBottom) {
          onContentLoaded(function () {
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
            updateScroller();
          });
        }
        updateScroller(100);
      }

      function updateBottomizer () {
        $(historyMessagesEl).css({marginTop: 0});
        if (historyMessagesEl.offsetHeight > 0 && historyMessagesEl.offsetHeight <= scrollableWrap.offsetHeight) {
          $(historyMessagesEl).css({marginTop: (scrollableWrap.offsetHeight - historyMessagesEl.offsetHeight - 20 - 44) + 'px'});
        }
        $(historyWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);

      updateSizes();
      onContentLoaded(updateSizes);
    }

  })

  .directive('mySendForm', function ($timeout, $modalStack, Storage, ErrorService) {

    return {
      link: link,
      scope: {
        draftMessage: '='
      }
    };

    function link ($scope, element, attrs) {
      var messageField = $('textarea', element)[0],
          fileSelects = $('input', element),
          dropbox = $('.im_send_dropbox_wrap', element)[0],
          emojiButton = $('.im_emoji_btn', element)[0],
          editorElement = messageField,
          dragStarted, dragTimeout,
          emojiArea = $(messageField).emojiarea({button: emojiButton, norealTime: true}),
          emojiMenu = $('.emoji-menu', element)[0],
          submitBtn = $('.im_submit', element)[0],
          richTextarea = $('.emoji-wysiwyg-editor', element)[0];

      if (richTextarea) {
        editorElement = richTextarea;
        $(richTextarea).addClass('form-control');
        $(richTextarea).attr('placeholder', $(messageField).attr('placeholder'));

        var updatePromise;
        $(richTextarea)
          .on('DOMNodeInserted', onPastedImageEvent)
          .on('keyup', function (e) {
            updateHeight();

            $scope.draftMessage.text = richTextarea.innerText;

            $timeout.cancel(updatePromise);
            updatePromise = $timeout(updateValue, 1000);
          });
      }

      // Head is sometimes slower
      $timeout(function () {
        fileSelects
          .add('.im_head_attach input')
          .on('change', function () {
            var self = this;
            $scope.$apply(function () {
              $scope.draftMessage.files = Array.prototype.slice.call(self.files);
              $scope.draftMessage.isMedia = $(self).hasClass('im_media_attach_input');
              setTimeout(function () {
                try {
                  self.value = '';
                } catch (e) {};
              }, 1000);
            });
          });
      }, 1000);

      var sendOnEnter = true,
          updateSendSettings = function () {
            Storage.get('send_ctrlenter').then(function (sendOnCtrl) {
              sendOnEnter = !sendOnCtrl;
            });
          };

      $scope.$on('settings_changed', updateSendSettings);
      updateSendSettings();

      $(editorElement).on('keydown', function (e) {
        if (richTextarea) {
          updateHeight();
        }

        if (e.keyCode == 13) {
          var submit = false;
          if (sendOnEnter && !e.shiftKey) {
            submit = true;
          } else if (!sendOnEnter && (e.ctrlKey || e.metaKey)) {
            submit = true;
          }

          if (submit) {
            $(element).trigger('submit');
            $(element).trigger('message_send');
            resetAfterSubmit();
            return cancelEvent(e);
          }
        }

      });

      $(submitBtn).on('mousedown', function (e) {
        $(element).trigger('submit');
        $(element).trigger('message_send');
        resetAfterSubmit();
        return cancelEvent(e);
      });

      var lastTyping = 0,
          lastLength;
      $(editorElement).on('keyup', function (e) {
        var now = tsNow(),
            length = (editorElement[richTextarea ? 'innerText' : 'value']).length;

        if (now - lastTyping > 5000 && length != lastLength) {
          lastTyping = now;
          lastLength = length;
          $scope.$emit('ui_typing');
        }
      });

      function resetAfterSubmit () {
        lastTyping = 0;
        lastLength = 0;
      };

      function updateField () {
        if (richTextarea) {
          $timeout.cancel(updatePromise);
          var html = $('<div>').text($scope.draftMessage.text || '').html();
          html = html.replace(/\n/g, '<br/>');
          $(richTextarea).html(html);
          updateHeight();
        }
      }

      function updateValue () {
        if (richTextarea) {
          $(richTextarea).trigger('change');
          updateHeight();
        }
      }

      var height = richTextarea.offsetHeight;
      function updateHeight () {
        var newHeight = richTextarea.offsetHeight;
        if (height != newHeight) {
          height = newHeight;
          $scope.$emit('ui_editor_resize');
        }
      };

      function onKeyDown(e) {
        if (e.keyCode == 9 && !e.shiftKey && !e.ctrlKey && !e.metaKey && !$modalStack.getTop()) { // TAB
          editorElement.focus();
          return cancelEvent(e);
        }
      }
      $(document).on('keydown', onKeyDown);

      $('body').on('dragenter dragleave dragover drop', onDragDropEvent);
      $(document).on('paste', onPasteEvent);

      if (!Config.Navigator.touch) {
        $scope.$on('ui_peer_change', focusField);
        $scope.$on('ui_history_focus', focusField);
        $scope.$on('ui_history_change', focusField);
      }

      $scope.$on('ui_message_send', focusField);

      $scope.$on('ui_peer_draft', updateField);
      $scope.$on('ui_message_before_send', updateValue);

      function focusField () {
        onContentLoaded(function () {
          editorElement.focus();
        });
      }

      function onPastedImageEvent (e) {
        var element = e && e.target;
        var src;
        if (element && (src = element.src) && src.indexOf('data') === 0) {
          element.parentNode.removeChild(element);
          src = src.substr(5).split(';');
          var contentType = src[0];
          var base64 = atob(src[1].split(',')[1]);
          var array = new Uint8Array(base64.length);

          for (var i = 0; i < base64.length; i++) {
            array[i] = base64.charCodeAt(i);
          }

          var blob = new Blob([array], {type: contentType});

          ErrorService.confirm({type: 'FILE_CLIPBOARD_PASTE'}).then(function () {
            $scope.draftMessage.files = [blob];
            $scope.draftMessage.isMedia = true;
          });
        }
      };

      function onPasteEvent (e) {
        var cData = (e.originalEvent || e).clipboardData,
            items = cData && cData.items || [],
            files = [],
            i;

        for (i = 0; i < items.length; i++) {
          if (items[i].kind == 'file') {
            files.push(items[i].getAsFile());
          }
        }

        if (files.length > 0) {
          ErrorService.confirm({type: 'FILES_CLIPBOARD_PASTE', files: files}).then(function () {
            $scope.draftMessage.files = files;
            $scope.draftMessage.isMedia = true;
          });
        }
      }

      function onDragDropEvent(e) {
        var dragStateChanged = false;
        if (!dragStarted || dragStarted == 1) {
          dragStarted = checkDragEvent(e) ? 2 : 1;
          dragStateChanged = true;
        }
        if (dragStarted == 2) {
          if (dragTimeout) {
            setTimeout(function () {
              clearTimeout(dragTimeout);
              dragTimeout = false;
            }, 0);
          }

          if (e.type == 'dragenter' || e.type == 'dragover') {
            if (dragStateChanged) {
              $(dropbox)
                .css({height: $(editorElement).height() + 12, width: $(editorElement).width() + 12})
                .show();
            }
          } else {
            if (e.type == 'drop') {
              $scope.$apply(function () {
                $scope.draftMessage.files = Array.prototype.slice.call(e.originalEvent.dataTransfer.files);
                $scope.draftMessage.isMedia = true;
              });
            }
            dragTimeout = setTimeout(function () {
              $(dropbox).hide();
              dragStarted = false;
              dragTimeout = false;
            }, 300);
          }
        }

        return cancelEvent(e);
      };


      $scope.$on('$destroy', function cleanup() {
        $('body').off('dragenter dragleave dragover drop', onDragDropEvent);
        $(document).off('paste', onPasteEvent);
        $(document).off('keydown', onKeyDown);
        $(submitBtn).off('mousedown')
        fileSelects.off('change');
        if (richTextarea) {
          $(richTextarea).off('DOMNodeInserted keyup', onPastedImageEvent);
        }
        $(editorElement).off('keydown');
      });

      if (!Config.Navigator.touch) {
        focusField();
      }

    }
  })

  .directive('myLoadThumb', function(MtpApiFileManager) {

    return {
      link: link,
      scope: {
        thumb: '='
      }
    };

    function link ($scope, element, attrs) {
      var counter = 0;

      var cachedSrc = MtpApiFileManager.getCachedFile(
        $scope.thumb &&
        $scope.thumb.location &&
        !$scope.thumb.location.empty &&
        $scope.thumb.location
      );

      if (cachedSrc) {
        element.attr('src', cachedSrc);
      }
      if ($scope.thumb && $scope.thumb.width && $scope.thumb.height) {
        element.attr('width', $scope.thumb.width);
        element.attr('height', $scope.thumb.height);
      }

      var stopWatching = $scope.$watchCollection('thumb.location', function (newLocation) {
        if ($scope.thumb && $scope.thumb.width && $scope.thumb.height) {
          element.attr('width', $scope.thumb.width);
          element.attr('height', $scope.thumb.height);
          $scope.$emit('ui_height');
        }
        // console.log('new loc', newLocation, arguments);
        var counterSaved = ++counter;
        if (!newLocation || newLocation.empty) {
          element.attr('src', $scope.thumb && $scope.thumb.placeholder || 'img/blank.gif');
          cleanup();
          return;
        }

        var cachedSrc = MtpApiFileManager.getCachedFile(newLocation);
        if (cachedSrc) {
          element.attr('src', cachedSrc);
          cleanup();
          return;
        }

        if (!element.attr('src')) {
          element.attr('src', $scope.thumb.placeholder || 'img/blank.gif');
        }

        MtpApiFileManager.downloadSmallFile($scope.thumb.location).then(function (url) {
          if (counterSaved == counter) {
            element.attr('src', url);
            cleanup();
          }
        }, function (e) {
          console.log('Download image failed', e, $scope.thumb.location, element[0]);
          if (counterSaved == counter) {
            element.attr('src', $scope.thumb.placeholder || 'img/blank.gif');
            cleanup();
          }
        });
      })

      var cleanup = angular.noop;
      // function () {
      //   setTimeout(function () {
      //     $scope.$destroy()
      //     stopWatching();
      //   }, 0);
      // };
    }

  })

  .directive('myLoadFullPhoto', function(MtpApiFileManager) {

    return {
      link: link,
      transclude: true,
      templateUrl: 'partials/full_photo.html',
      scope: {
        fullPhoto: '=',
        thumbLocation: '='
      }
    };

    function link ($scope, element, attrs) {

      var imgElement = $('img', element)[0],
          resizeElements = $('.img_fullsize_with_progress_wrap', element)
                            .add('.img_fullsize_progress_wrap', element)
                            .add($(imgElement)),
          resize = function () {
            resizeElements.css({width: $scope.fullPhoto.width, height: $scope.fullPhoto.height});
            $scope.$emit('ui_height');
          };

      var jump = 0;
      $scope.$watchCollection('fullPhoto.location', function () {
        var cachedSrc = MtpApiFileManager.getCachedFile($scope.thumbLocation),
            curJump = ++jump;

        if (cachedSrc) {
          imgElement.src = cachedSrc;
          resize();
        } else {
          imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }

        if (!$scope.fullPhoto.location) {
          return;
        }

        var apiPromise;
        if ($scope.fullPhoto.size) {
          var inputLocation = {
            _: 'inputFileLocation',
            volume_id: $scope.fullPhoto.location.volume_id,
            local_id: $scope.fullPhoto.location.local_id,
            secret: $scope.fullPhoto.location.secret
          };
          apiPromise = MtpApiFileManager.downloadFile($scope.fullPhoto.location.dc_id, inputLocation, $scope.fullPhoto.size);
        } else {
          apiPromise = MtpApiFileManager.downloadSmallFile($scope.fullPhoto.location);
        }

        $scope.progress = {enabled: true, percent: 0};

        apiPromise.then(function (url) {
          if (curJump == jump) {
            $scope.progress.enabled = false;
            imgElement.src = url;
            resize();
          }
        }, function (e) {
          console.log('Download image failed', e, $scope.fullPhoto.location);
          $scope.progress.enabled = false;

          if (e && e.type == 'FS_BROWSER_UNSUPPORTED') {
            $scope.error = {html: 'Your browser doesn\'t support <a href="https://developer.mozilla.org/en-US/docs/Web/API/LocalFileSystem" target="_blank">LocalFileSystem</a> feature which is needed to display this image.<br/>Please, install <a href="http://google.com/chrome" target="_blank">Google Chrome</a> or use <a href="https://telegram.org/" target="_blank">mobile app</a> instead.'};
          } else {
            $scope.error = {text: 'Download failed', error: e};
          }
        }, function (progress) {
          $scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
        });
      })

      resize();
    }
  })


  .directive('myLoadVideo', function($sce, MtpApiFileManager) {

    return {
      link: link,
      transclude: true,
      templateUrl: 'partials/full_video.html',
      scope: {
        video: '='
      }
    };

    function link ($scope, element, attrs) {

      $scope.progress = {enabled: true, percent: 1};
      $scope.player = {};

      var inputLocation = {
        _: 'inputVideoFileLocation',
        id: $scope.video.id,
        access_hash: $scope.video.access_hash
      };

      var hasQt = false, i;
      if (navigator.plugins) {
        for (i = 0; i < navigator.plugins.length; i++) {
          if (navigator.plugins[i].name.indexOf('QuickTime') >= 0) {
            hasQt = true;
          }
        }
      }

      var downloadPromise = MtpApiFileManager.downloadFile($scope.video.dc_id, inputLocation, $scope.video.size, {mime: 'video/mp4'});

      downloadPromise.then(function (url) {
        $scope.progress.enabled = false;
        // $scope.progress = {enabled: true, percent: 50};
        $scope.player.hasQuicktime = hasQt;
        $scope.player.quicktime = false;
        $scope.player.src = $sce.trustAsResourceUrl(url);
        $scope.$emit('ui_height');
      }, function (e) {
        console.log('Download video failed', e, $scope.video);
        $scope.progress.enabled = false;
        $scope.player.src = '';

        if (e && e.type == 'FS_BROWSER_UNSUPPORTED') {
          $scope.error = {html: 'Your browser doesn\'t support <a href="https://developer.mozilla.org/en-US/docs/Web/API/LocalFileSystem" target="_blank">LocalFileSystem</a> feature which is needed to play this video.<br/>Please, install <a href="http://google.com/chrome" target="_blank">Google Chrome</a> or use <a href="https://telegram.org/" target="_blank">mobile app</a> instead.'};
        } else {
          $scope.error = {text: 'Video download failed', error: e};
        }

      }, function (progress) {
        $scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      });

      $scope.$emit('ui_height');

      $scope.$on('$destroy', function () {
        downloadPromise.cancel();
      });
    }

  })

  .directive('myLoadGif', function(MtpApiFileManager) {

    return {
      link: link,
      templateUrl: 'partials/full_gif.html',
      scope: {
        document: '='
      }
    };

    function link ($scope, element, attrs) {

      var downloadPromise = false,
          inputFileLocation = {
            _: 'inputDocumentFileLocation',
            id: $scope.document.id,
            access_hash: $scope.document.access_hash
          };

      $scope.isActive = false;
      $scope.document.url = MtpApiFileManager.getCachedFile(inputFileLocation);

      /*return $scope.document.progress = {enabled: true, percent: 30, total: $scope.document.size};*/

      $scope.toggle = function () {
        if ($scope.document.url) {
          $scope.isActive = !$scope.isActive;
          $scope.$emit('ui_height');
          return;
        }

        if (downloadPromise) {
          downloadPromise.cancel();
          downloadPromise = false;
          return;
        }

        $scope.document.progress = {enabled: true, percent: 1, total: $scope.document.size};

        downloadPromise = MtpApiFileManager.downloadFile(
          $scope.document.dc_id,
          inputFileLocation,
          $scope.document.size,
          null,
          {mime: $scope.document.mime_type}
        );

        downloadPromise.then(function (url) {
          $scope.document.url = url;
          $scope.isActive = true;
          delete $scope.document.progress;
          console.log('file save done');
          $scope.$emit('ui_height');
        }, function () {
          $scope.document.progress.enabled = false;
        }, function (progress) {
          console.log('dl progress', progress);
          $scope.document.progress.done = progress.done;
          $scope.document.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
        })
      }
    }
  })

  .directive('myMapPoint', function(ExternalResourcesManager) {

    return {
      link: link,
      scope: {
        point: '='
      }
    };

    function link ($scope, element, attrs) {

      var apiKey = 'AIzaSyC32ij28dCa0YzEV_HqbWfIwTZQql-RNS0';

      var src = 'https://maps.googleapis.com/maps/api/staticmap?sensor=false&center=' + $scope.point['lat'] + ',' + $scope.point['long'] + '&zoom=13&size=200x100&scale=2&key=' + apiKey;

      ExternalResourcesManager.downloadImage(src).then(function (url) {
        element.append('<img src="' + url + '" width="200" height="100"/>');
      });

      element.attr('href','https://maps.google.com/?q=' + $scope.point['lat'] + ',' + $scope.point['long']);
      element.attr('target','_blank');
    }

  })


  .directive('myLoadingDots', function($interval) {

    return {
      link: link,
    };

    function link ($scope, element, attrs) {
      element.html(isAnimationSupported(element[0])
        ? '<div class="loading_dots"><span></span><span></span><span></span></div>'
        : '...'
      );
    }

    var animationSupported;
    function isAnimationSupported (el) {
      if (animationSupported === undefined) {
        animationSupported = el.style.animationName !== undefined;
        if (animationSupported === false) {
          var domPrefixes = 'Webkit Moz O ms Khtml'.split(' '), i;
          for (i = 0; i < domPrefixes.length; i++) {
            if (el.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
              animationSupported = true;
              break;
            }
          }
        }
      }

      return animationSupported;
    }
  })

  .directive('myAudioAutoplay', function() {

    return {
      link: link,
      scope: {
        audio: '='
      }
    };

    function link ($scope, element, attrs) {
      $scope.$watch('audio.autoplay', function (autoplay) {
        if (autoplay) {
          element.autoplay = true;
          element[0].play();
        } else {
          element.autoplay = false;
        }
      });
    }
  })

  .directive('myFocused', function(){
    return {
      link: function($scope, element, attrs) {
        if (Config.Navigator.touch) {
          return false;
        }
        setTimeout(function () {
          element[0].focus();
        }, 100);
      }
    };
  })

  .directive('myFocusOn', function(){
    return {
      link: function($scope, element, attrs) {
        $scope.$on(attrs.myFocusOn, function () {
          if (Config.Navigator.touch) {
            return false;
          }
          onContentLoaded(function () {
            element[0].focus();
          });
        });
      }
    };
  })

  .directive('myFileUpload', function(){

    return {
      link: link
    };

    function link($scope, element, attrs) {
      element.on('change', function () {
        var self = this;
        $scope.$apply(function () {
          $scope.photo.file = self.files[0];
          setTimeout(function () {
            try {
              self.value = '';
            } catch (e) {};
          }, 1000);
        });
      });
    };
  })


  .directive('myModalWidth', function () {

    return {
      link: link
    };

    function link($scope, element, attrs) {
      attrs.$observe('myModalWidth', function (newW) {
        $(element[0].parentNode.parentNode).css({width: parseInt(newW) + (Config.Navigator.mobile ? 0 : 36)});
      });
    };

  })

  .directive('myModalNav', function () {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      var onKeyDown = function (event) {
        var target = event.target;
        if (target && (target.tagName == 'INPUT' || target.tagName == 'TEXTAREA')) {
          return false;
        }

        switch (event.keyCode) {
          case 39: // right
          case 32: // space
          case 34: // pg down
          case 40: // down
            $scope.$eval(attrs.next);
            break;

          case 37: // left
          case 33: // pg up
          case 38: // up
            $scope.$eval(attrs.prev);
            break;
        }
      };

      $(document).on('keydown', onKeyDown);

      $scope.$on('$destroy', function () {
        $(document).off('keydown', onKeyDown);
      });
    };
  })

  .directive('myCustomBackground', function () {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      console.log(dT(), 'bg', attrs.myCustomBackground);
      $('html').css({background: attrs.myCustomBackground});

      $scope.$on('$destroy', function () {
        $('html').css({background: ''});
      });
    };
  })

  .directive('myInfiniteScroller', function () {

    return {
      link: link,
      scope: true
    };

    function link($scope, element, attrs) {

      var scrollableWrap = $('.content', element)[0],
          moreNotified = false;

      $(scrollableWrap).on('scroll', function (e) {
        if (!moreNotified &&
            scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          moreNotified = true;
          $scope.$apply(function () {
            $scope.slice.limit += ($scope.slice.limitDelta || 20);
          });

          onContentLoaded(function () {
            moreNotified = false;
            $(element).nanoScroller();
          });
        }
      });

    };
  })




  .directive('myModalPosition', function ($window, $timeout) {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      var updateMargin = function () {
        if (Config.Navigator.mobile &&
            $(element[0].parentNode.parentNode.parentNode).hasClass('page_modal')) {
          return;
        }
        var height = element[0].parentNode.offsetHeight,
            contHeight = element[0].parentNode.parentNode.parentNode.offsetHeight;

        if (height < contHeight) {
          $(element[0].parentNode).css('marginTop', (contHeight - height) / 2);
        } else {
          $(element[0].parentNode).css('marginTop', '');
        }

        if (attrs.animation != 'no') {
          $timeout(function () {
            $(element[0].parentNode).addClass('modal-content-animated');
          }, 300);
        }
      };

      onContentLoaded(updateMargin);

      $($window).on('resize', updateMargin);

      $scope.$on('ui_height', function () {
        onContentLoaded(updateMargin);
      });

    };

  })


  .directive('myVerticalPosition', function ($window, $timeout) {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      var usePadding = attrs.padding === 'true',
          prevMargin = 0;

      var updateMargin = function () {
        var height = element[0].offsetHeight,
            fullHeight = height - (height && usePadding ? 2 * prevMargin : 0),
            contHeight = $($window).height(),
            ratio = attrs.myVerticalPosition && parseFloat(attrs.myVerticalPosition) || 0.5,
            margin = fullHeight < contHeight ? parseInt((contHeight - fullHeight) * ratio) : '',
            styles = usePadding
              ? {paddingTop: margin, paddingBottom: margin}
              : {marginTop: margin, marginBottom: margin};

        element.css(styles);
        element.addClass('vertical-aligned');

        if (prevMargin !== margin) {
          $scope.$emit('ui_height');
        }

        prevMargin = margin;
      };

      onContentLoaded(updateMargin);

      $($window).on('resize', updateMargin);

      $scope.$on('ui_height', function () {
        onContentLoaded(updateMargin);
      });



    };

  })
