/*!
 * Webogram v0.3.2 - messaging web application for MTProto
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
      templateUrl: templateUrl('head')
    };
  })

  .directive('myLangFooter', function() {
    return {
      restrict: 'AE',
      templateUrl: templateUrl('lang_footer')
    };
  })

  .directive('myDialog', function() {
    return {
      restrict: 'AE',
      templateUrl: templateUrl('dialog')
    };
  })

  .directive('myMessage', function($filter, _) {

    var dateFilter = $filter('myDate'),
        dateSplitHtml = '<div class="im_message_date_split im_service_message_wrap"><div class="im_service_message"></div></div>',
        unreadSplitHtml = '<div class="im_message_unread_split">' + _('unread_messages_split') + '</div>',
        selectedClass = 'im_message_selected',
        focusClass = 'im_message_focus',
        unreadClass =  'im_message_unread',
        errorClass = 'im_message_error',
        pendingClass = 'im_message_pending';

    return {
      templateUrl: templateUrl('message'),
      link: link
    };

    function link($scope, element, attrs) {
      var selected = false,
          grouped = false,
          focused = false,
          error = false,
          pending = false,
          needDate = false,
          unreadAfter = false,
          applySelected = function () {
            if (selected != ($scope.selectedMsgs[$scope.historyMessage.id] || false)) {
              selected = !selected;
              element.toggleClass(selectedClass, selected);
            }
          },
          needDateSplit,
          applyGrouped = function () {
            if (grouped != $scope.historyMessage.grouped) {
              if (grouped) {
                element.removeClass(grouped);
              }
              grouped = $scope.historyMessage.grouped;
              if (grouped) {
                element.addClass(grouped);
              }
            }
            if (needDate != ($scope.historyMessage.needDate || false)) {
              needDate = !needDate;
              if (needDate) {
                if (needDateSplit) {
                  needDateSplit.show();
                } else {
                  needDateSplit = $(dateSplitHtml);
                  $(needDateSplit[0].firstChild).text(dateFilter($scope.historyMessage.date));
                  if (unreadAfterSplit) {
                    needDateSplit.insertBefore(unreadAfterSplit)
                  } else {
                    needDateSplit.prependTo(element);
                  }
                }
              } else {
                needDateSplit.hide();
              }
            }
          },
          unreadAfterSplit;

      applySelected();
      applyGrouped();

      $scope.$on('messages_select', applySelected);
      $scope.$on('messages_regroup', applyGrouped);

      $scope.$on('messages_focus', function (e, focusedMsgID) {
        if ((focusedMsgID == $scope.historyMessage.id) != focused) {
          focused = !focused;
          element.toggleClass(focusClass, focused);
        }
      });

      var deregisterUnreadAfter;
      if (!$scope.historyMessage.out &&
          ($scope.historyMessage.unread || $scope.historyMessage.unreadAfter)) {
        var applyUnreadAfter = function () {
          if ($scope.peerHistory.peerID != $scope.historyPeer.id) {
            return;
          }
          if (unreadAfter != ($scope.historyUnreadAfter == $scope.historyMessage.id)) {
            unreadAfter = !unreadAfter;
            if (unreadAfter) {
              if (unreadAfterSplit) {
                unreadAfterSplit.show();
              } else {
                unreadAfterSplit = $(unreadSplitHtml).prependTo(element);
              }
            } else {
              unreadAfterSplit.hide();
              if (deregisterUnreadAfter) {
                deregisterUnreadAfter();
              }
            }
          }
        };
        applyUnreadAfter();
        deregisterUnreadAfter = $scope.$on('messages_unread_after', applyUnreadAfter);
      }
      if ($scope.historyMessage.unread) {
        element.addClass(unreadClass);
        var deregisterUnread = $scope.$on('messages_read', function () {
          if (!$scope.historyMessage.unread) {
            element.removeClass(unreadClass);
            deregisterUnread();
            if (deregisterUnreadAfter && !unreadAfter) {
              deregisterUnreadAfter();
            }
          }
        });
      }
      if ($scope.historyMessage.error || $scope.historyMessage.pending) {
        var applyPending = function () {
              if (pending != ($scope.historyMessage.pending || false)) {
                pending = !pending;
                element.toggleClass(pendingClass, pending);
              }
              if (error != ($scope.historyMessage.error || false)) {
                error = !error;
                element.toggleClass(errorClass, error);
              }
              if (!error && !pending) {
                deregisterPending();
              }
            },
            deregisterPending = $scope.$on('messages_pending', applyPending);

        applyPending();
      }
    }
  })

  .directive('myServiceMessage', function() {
    return {
      templateUrl: templateUrl('message_service')
    };
  })
  .directive('myMessagePhoto', function() {
    return {
      templateUrl: templateUrl('message_attach_photo')
    };
  })
  .directive('myMessageVideo', function() {
    return {
      templateUrl: templateUrl('message_attach_video')
    };
  })
  .directive('myMessageDocument', function() {
    return {
      templateUrl: templateUrl('message_attach_document')
    };
  })
  .directive('myMessageAudio', function() {
    return {
      templateUrl: templateUrl('message_attach_audio')
    };
  })
  .directive('myMessageMap', function() {
    return {
      templateUrl: templateUrl('message_attach_map')
    };
  })
  .directive('myMessageContact', function() {
    return {
      templateUrl: templateUrl('message_attach_contact')
    };
  })
  .directive('myMessagePending', function() {
    return {
      templateUrl: templateUrl('message_attach_pending')
    };
  })

  .directive('myDialogs', function ($modalStack, $transition, $window, $timeout) {

    return {
      link: link
    };


    function link ($scope, element, attrs) {
      var dialogsWrap = $('.im_dialogs_wrap', element)[0],
          scrollableWrap = $('.im_dialogs_scrollable_wrap', element)[0],
          searchField = $('.im_dialogs_search_field', element)[0],
          panelWrap = $('.im_dialogs_panel', element)[0],
          searchClear = $('.im_dialogs_search_clear', element)[0],
          tabsWrap = $('.im_dialogs_tabs_wrap', element)[0],
          searchFocused = false;


      $(searchField).on('focus blur', function (e) {
        searchFocused = e.type == 'focus';

        if (!searchFocused) {
          $(scrollableWrap).find('.im_dialog_selected').removeClass('im_dialog_selected');
          if (!searchField.value) {
            $scope.$emit('ui_dialogs_search_clear');
          }
        }
      });

      $scope.$on('dialogs_search_toggle', function () {
        $(panelWrap).addClass('im_dialogs_panel_search');
        $scope.$broadcast('ui_dialogs_search');
        $($window).scrollTop(0);
        $timeout(function () {
          searchField.focus();
        })
      });

      $scope.$on('search_clear', function () {
        $(panelWrap).removeClass('im_dialogs_panel_search');
        $scope.$broadcast('ui_dialogs_search');
      })

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
          var currentSelected = $(scrollableWrap).find('.im_dialog_wrap a');
          if (currentSelected.length) {
            $(currentSelected[0]).trigger('mousedown');
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
          else if (searchField.value) {
            $(searchClear).trigger('click');
          }
          return cancelEvent(e);
        }

        if (searchFocused && e.keyCode == 13) { // Enter
          var currentSelected = $(scrollableWrap).find('.im_dialog_selected')[0] || $(scrollableWrap).find('.im_dialog_wrap a')[0];
          if (currentSelected) {
            $(currentSelected).trigger('mousedown');
          }
          return cancelEvent(e);
        }

        var next, prev, skip, ctrlTabSupported = Config.Modes.packed;
        if (e.keyCode == 40 || e.keyCode == 38) { // UP, DOWN
          next = e.keyCode == 40;
          prev = !next;
          skip = !e.shiftKey && e.altKey
        }
        else if (ctrlTabSupported && e.keyCode == 9 && e.ctrlKey && !e.metaKey) { // Ctrl + Tab, Shift + Ctrl + Tab
          next = !e.shiftKey;
          prev = !next;
          skip = true;
        }
        if (next || prev) {
          if (!skip && (!searchFocused || e.metaKey)) {
            return true;
          }

          var currentSelected = !skip && $(scrollableWrap).find('.im_dialog_selected')[0] || $(scrollableWrap).find('.active a.im_dialog')[0],
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
              $(nextDialogWrap).find('a').trigger('mousedown');
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
          dialogsColWrap = $('.im_dialogs_col_wrap')[0],
          scrollableWrap = $('.im_dialogs_scrollable_wrap', element)[0],
          headWrap = $('.tg_page_head')[0],
          panelWrapSelector = Config.Mobile && attrs.modal
                              ? '.mobile_modal_body .im_dialogs_panel'
                              : '.im_dialogs_panel',
          panelWrap = $(panelWrapSelector)[0],
          footer = $('.footer_wrap')[0],
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
      });
      $scope.$on('ui_dialogs_search', updateSizes);
      $scope.$on('ui_dialogs_update', updateSizes);


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
        if (!element.is(':visible')) return;
        // console.log('scroll', moreNotified);
        if (!moreNotified && scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          // console.log('emit need more');
          $scope.$emit('dialogs_need_more');
          moreNotified = true;
        }
      });


      function updateSizes () {
        if (!panelWrap || !panelWrap.offsetHeight) {
          panelWrap = $(panelWrapSelector)[0];
        }

        if (attrs.modal) {
          $(element).css({
            height: $($window).height() -
                    (panelWrap ? panelWrap.offsetHeight : 58) -
                    (Config.Mobile ? 46 : 200)
          });
          updateScroller();
          return;
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0];
        }
        if (!footer || !footer.offsetHeight) {
          footer = $('.footer_wrap')[0];
        }

        if (!dialogsColWrap || !dialogsColWrap.offsetHeight) {
          dialogsColWrap = $('.im_dialogs_col_wrap')[0];
        }
        $(element).css({
          height: $($window).height() -
                  (footer ? footer.offsetHeight : 0)  -
                  (headWrap ? headWrap.offsetHeight : 44) -
                  (panelWrap ? panelWrap.offsetHeight : 58) -
                  parseInt($(dialogsColWrap).css('paddingBottom') || 0)
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
                  (Config.Mobile ? 64 : 200)
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
          height: $($window).height()
                    - (panelWrap && panelWrap.offsetHeight || 0)
                    - (searchWrap && searchWrap.offsetHeight || 0)
                    - (Config.Mobile ? 46 + 18 : 200)
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
          footer = $('.footer_wrap')[0],
          sendForm = $('.im_send_form', element)[0],
          moreNotified = false,
          lessNotified = false;

      onContentLoaded(function () {
        scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
      });
      $(historyWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});

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

      var animated = transform && false ? true : false,
          curAnimation = false;

      $scope.$on('ui_history_append_new', function (e, options) {
        if (!atBottom && !options.my) {
          return;
        }
        var curAnimated = animated &&
                          !$rootScope.idle.isIDLE &&
                          historyMessagesEl.clientHeight > 0,
            wasH;

        if (curAnimated) {
          wasH = scrollableWrap.scrollHeight;
        } else {
          $(scrollable).css({bottom: 0});
          $(scrollableWrap).addClass('im_history_to_bottom');
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
          }
        });
      });

      function changeScroll () {
        var unreadSplit, focusMessage;

        // console.trace('change scroll');
        if (focusMessage = $('.im_message_focus:visible', scrollableWrap)[0]) {
          var ch = scrollableWrap.clientHeight,
              st = scrollableWrap.scrollTop,
              ot = focusMessage.offsetTop,
              h = focusMessage.clientHeight;
          if (!st || st + ch < ot || st > ot + h) {
            scrollableWrap.scrollTop = Math.max(0, ot - Math.floor(ch / 2) + 26);
          }
          atBottom = false;
        } else if (unreadSplit = $('.im_message_unread_split:visible', scrollableWrap)[0]) {
          // console.log('change scroll unread', unreadSplit.offsetTop);
          scrollableWrap.scrollTop = Math.max(0, unreadSplit.offsetTop - 52);
          atBottom = false;
        } else {
          // console.log('change scroll bottom');
          scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
          atBottom = true;
        }
        updateScroller();
        $timeout(function () {
          $(scrollableWrap).trigger('scroll');
          scrollTopInitial = scrollableWrap.scrollTop;
        });
      };

      $scope.$on('ui_history_change', function () {
        var pr = parseInt($(scrollableWrap).css('paddingRight'))
        $(scrollableWrap).addClass('im_history_to_bottom');
        scrollableWrap.scrollHeight; // Some strange Chrome bug workaround
        $(scrollable).css({bottom: 0, marginLeft: -Math.ceil(pr / 2)});
        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: '', marginLeft: ''});
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
            pr = parseInt($(scrollableWrap).css('paddingRight')),
            ch = scrollableWrap.clientHeight;

        $(scrollableWrap).addClass('im_history_to_bottom');
        scrollableWrap.scrollHeight; // Some strange Chrome bug workaround
        $(scrollable).css({bottom: -(sh - st - ch), marginLeft: -Math.ceil(pr / 2)});

        var upd = function () {
            $(scrollableWrap).removeClass('im_history_to_bottom');
            $(scrollable).css({bottom: '', marginLeft: ''});
            if (scrollTopInitial >= 0) {
              changeScroll();
            } else {
              scrollableWrap.scrollTop = st + scrollableWrap.scrollHeight - sh;
            }

            updateBottomizer();
            moreNotified = false;

            $timeout(function () {
              if (scrollableWrap.scrollHeight != sh) {
                $(scrollableWrap).trigger('scroll');
              }
            });

            clearTimeout(timer);
            unreg();
          },
          timer = setTimeout(upd, 0),
          unreg = $scope.$on('$viewContentLoaded', upd);
      });

      $scope.$on('ui_history_append', function () {
        var sh = scrollableWrap.scrollHeight;
        onContentLoaded(function () {
          atBottom = false;
          updateBottomizer();
          lessNotified = false;

          if (scrollTopInitial >= 0) {
            changeScroll();
          }

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

      var atBottom = true,
          scrollTopInitial = -1;
      $(scrollableWrap).on('scroll', function (e) {
        if (!element.is(':visible') ||
            $(scrollableWrap).hasClass('im_history_to_bottom') ||
            curAnimation) {
          return;
        }
        var st = scrollableWrap.scrollTop;
        atBottom = st >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight;
        if (scrollTopInitial >= 0 && scrollTopInitial != st) {
          scrollTopInitial = -1;
        }

        if (!moreNotified && st <= 300) {
          moreNotified = true;
          $scope.$emit('history_need_more');
        }
        else if (!lessNotified && st >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          lessNotified = true;
          $scope.$emit('history_need_less');
        }
      });

      function updateSizes (heightOnly) {
        if (!element.is(':visible') && !$(element[0].parentNode.parentNode).is(':visible')) {
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
          footer = $('.footer_wrap')[0];
        }
        var historyH = $($window).height() - panelWrap.offsetHeight - bottomPanelWrap.offsetHeight - (headWrap ? headWrap.offsetHeight : 44) - (footer ? footer.offsetHeight : 0);
        $(historyWrap).css({
          height: historyH
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
        var marginTop = scrollableWrap.offsetHeight
                        - historyMessagesEl.offsetHeight
                        - 20
                        - (Config.Mobile ? 0 : 49);

        if (historyMessagesEl.offsetHeight > 0 && marginTop > 0) {
          $(historyMessagesEl).css({marginTop: marginTop});
        }
        $(historyWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);

      updateSizes();
      onContentLoaded(updateSizes);
    }

  })

  .directive('mySendForm', function ($timeout, $modalStack, Storage, ErrorService, $interpolate) {

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
        $(richTextarea).attr('placeholder', $interpolate($(messageField).attr('placeholder'))($scope));

        var updatePromise;
        $(richTextarea)
          .on('DOMNodeInserted', onPastedImageEvent)
          .on('keyup', function (e) {
            updateHeight();

            $scope.$apply(function () {
              $scope.draftMessage.text = richTextarea.textContent;
            });

            $timeout.cancel(updatePromise);
            updatePromise = $timeout(updateValue, 1000);
          });
      }

      // Head is sometimes slower
      $timeout(function () {
        fileSelects
          .on('change', function () {
            var self = this;
            $scope.$apply(function () {
              $scope.draftMessage.files = Array.prototype.slice.call(self.files);
              $scope.draftMessage.isMedia = $(self).hasClass('im_media_attach_input') || Config.Mobile;
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
            $timeout.cancel(updatePromise);
            updateValue();
            $(element).trigger('submit');
            $(element).trigger('message_send');
            resetAfterSubmit();
            return cancelEvent(e);
          }
        }

      });

      $(submitBtn).on('mousedown touchstart', function (e) {
        $timeout.cancel(updatePromise);
        updateValue();
        $(element).trigger('submit');
        $(element).trigger('message_send');
        resetAfterSubmit();
        return cancelEvent(e);
      });

      var lastTyping = 0,
          lastLength;
      $(editorElement).on('keyup', function (e) {
        var now = tsNow(),
            length = (editorElement[richTextarea ? 'textContent' : 'value']).length;


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

      function updateRichTextarea () {
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

      $scope.$on('ui_peer_draft', updateRichTextarea);
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

      var cleanup = attrs.watch
            ? angular.noop
            : function () {
                setTimeout(function () {
                  $scope.$destroy()
                  stopWatching();
                }, 0);
              };
    }

  })

  .directive('myLoadFullPhoto', function(MtpApiFileManager, _) {

    return {
      link: link,
      transclude: true,
      templateUrl: templateUrl('full_photo'),
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
            $scope.error = {html: _('error_browser_no_local_file_system_image_md', {
              'moz-link': '<a href="{0}" target="_blank">{1}</a>',
              'chrome-link': '<a href="{0}" target="_blank">{1}</a>',
              'telegram-link': '<a href="{0}" target="_blank">{1}</a>'
            })};
          } else {
            $scope.error = {text: _('error_image_download_failed'), error: e};
          }
        }, function (progress) {
          $scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
        });
      })

      resize();
    }
  })


  .directive('myLoadVideo', function($sce, MtpApiFileManager, _) {

    return {
      link: link,
      transclude: true,
      templateUrl: templateUrl('full_video'),
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
          $scope.error = {html: _('error_browser_no_local_file_system_video_md', {
              'moz-link': '<a href="{0}" target="_blank">{1}</a>',
              'chrome-link': '<a href="{0}" target="_blank">{1}</a>',
              'telegram-link': '<a href="{0}" target="_blank">{1}</a>'
            })};
        } else {
          $scope.error = {text: _('error_video_download_failed'), error: e};
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

  .directive('myLoadGif', function($rootScope, MtpApiFileManager) {

    return {
      link: link,
      templateUrl: templateUrl('full_gif'),
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

      $scope.toggle = function (e) {
        if (checkClick(e, true)) {
          $rootScope.downloadDoc($scope.document.id);
          return false;
        }

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
        $(element[0].parentNode.parentNode).css({width: parseInt(newW) + (Config.Mobile ? 0 : 36)});
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
          return;
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

      var scrollableWrap = $('.nano-content', element)[0],
          moreNotified = false;

      $(scrollableWrap).on('scroll', function (e) {
        if (!element.is(':visible')) return;
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
        if (Config.Mobile &&
            $(element[0].parentNode.parentNode.parentNode).hasClass('mobile_modal')) {
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


  .directive('myUserLink', function ($timeout, $rootScope, AppUsersManager) {

    return {
      link: link
    };

    function link($scope, element, attrs) {
      var userID = $scope.$eval(attrs.myUserLink),
          user = AppUsersManager.getUser(userID);

      element.html(
        (user[attrs.short && $scope.$eval(attrs.short) ? 'rFirstName' : 'rFullName'] || '').valueOf()
      );

      if (element[0].tagName == 'A') {
        element.on('click', function () {
          $rootScope.openUser(userID);
        });
      }
      if (attrs.color && $scope.$eval(attrs.color)) {
        element.addClass('user_color_' + user.num);
      }
    }
  })

  .directive('myUserStatus', function ($filter, $rootScope, AppUsersManager) {

    var statusFilter = $filter('userStatus'),
        ind = 0,
        statuses = {};

    setInterval(updateAll, 90000);

    return {
      link: link
    };

    function updateAll () {
      angular.forEach(statuses, function (update) {
        update();
      });
    }

    function link($scope, element, attrs) {
      var userID,
          curInd = ind++,
          update = function () {
            var user = AppUsersManager.getUser(userID);
            element
              .html(statusFilter(user))
              .toggleClass('status_online', user.status && user.status._ == 'userStatusOnline');
          };

      $scope.$watch(attrs.myUserStatus, function (newUserID) {
        userID = newUserID;
        update();
      });
      $rootScope.$on('user_update', function (e, updUserID) {
        if (userID == updUserID) {
          update();
        }
      });
      statuses[curInd] = update;
      $scope.$on('$destroy', function () {
        delete statuses[curInd];
      });
    }
  })


  .directive('myUserPhotolink', function ($rootScope, AppUsersManager) {

    return {
      link: link,
      scope: {
        userID: '=myUserPhotolink'
      },
      template: '<img my-load-thumb thumb="photo" /><i class="icon icon-online" ng-if="::showStatus || false" ng-show="user.status._ == \'userStatusOnline\'"></i>'
    };

    function link($scope, element, attrs) {
      $scope.photo = AppUsersManager.getUserPhoto($scope.userID, 'User');

      if ($scope.showStatus = attrs.status && $scope.$eval(attrs.status)) {
        $scope.user = AppUsersManager.getUser($scope.userID);
      }

      if (element[0].tagName == 'A') {
        element.on('click', function (e) {
          $rootScope.openUser($scope.userID);
        });
      }

      if (attrs.imgClass) {
        $(element[0].firstChild).addClass(attrs.imgClass)
      }

    }
  })

  .directive('myAudioPlayer', function ($sce, $timeout, $q, FileManager, MtpApiFileManager) {

    var currentPlayer = false;

    return {
      link: link,
      scope: {
        audio: '='
      },
      templateUrl: templateUrl('audio_player')
    };

    function downloadAudio (audio) {
      var inputFileLocation = {
            _: audio._ == 'document' ? 'inputDocumentFileLocation' : 'inputAudioFileLocation',
            id: audio.id,
            access_hash: audio.access_hash
          };

      audio.progress = {enabled: true, percent: 1, total: audio.size};

      var downloadPromise = MtpApiFileManager.downloadFile(audio.dc_id, inputFileLocation, audio.size, {mime: 'audio/ogg'});

      audio.progress.cancel = downloadPromise.cancel;

      return downloadPromise.then(function (url) {
        delete audio.progress;
        audio.rawUrl = url;
        audio.url = $sce.trustAsResourceUrl(url);
      }, function (e) {
        console.log('audio download failed', e);
        audio.progress.enabled = false;
      }, function (progress) {
        console.log('audio dl progress', progress);
        audio.progress.done = progress.done;
        audio.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      });
    }

    function checkPlayer (newPlayer) {
      if (newPlayer === currentPlayer) {
        return false;
      }
      if (currentPlayer) {
        currentPlayer.pause();
      }
      currentPlayer = newPlayer;
    }

    function link($scope, element, attrs) {
      $scope.mediaPlayer = {};

      $scope.download = function () {
        ($scope.audio.rawUrl ? $q.when() : downloadAudio($scope.audio)).then(
          function () {
            FileManager.download($scope.audio.rawUrl, $scope.audio.mime_type || 'audio/ogg', $scope.audio.file_name || 'audio.ogg');
          }
        );
      };

      $scope.togglePlay = function () {
        if ($scope.audio.url) {
          checkPlayer($scope.mediaPlayer.player);
          $scope.mediaPlayer.player.playPause();
        }
        else if ($scope.audio.progress && $scope.audio.progress.enabled) {
          $scope.audio.progress.cancel();
        }
        else {
          downloadAudio($scope.audio).then(function () {
            onContentLoaded(function () {
              checkPlayer($scope.mediaPlayer.player);
              $scope.mediaPlayer.player.play();
            })
          })
        }
      };
    }
  })
