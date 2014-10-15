/*!
 * Webogram v0.3.2 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Directives */


angular.module('myApp.directives')

	.directive('myDialogsListMobile', function($window, $timeout) {

    return {
      link: link
    };


    function link ($scope, element, attrs) {
      var dialogsColWrap = $('.im_dialogs_col_wrap')[0],
          scrollableWrap = element[0],
          headWrap = $('.tg_page_head')[0],
          panelWrapSelector = attrs.modal
                              ? '.mobile_modal_body .im_dialogs_panel'
                              : '.im_dialogs_panel',
          panelWrap = $(panelWrapSelector)[0],
          hasTabs = false,
          moreNotified = false;

      $scope.$on('ui_dialogs_tabs', function (e, newHasTabs) {
        hasTabs = newHasTabs;
        updateSizes();
      });
      $scope.$on('ui_dialogs_search', updateSizes);
      $scope.$on('ui_dialogs_update', updateSizes);


      $scope.$on('ui_dialogs_append', function () {
        onContentLoaded(function () {
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $(scrollableWrap).on('scroll', function (e) {
        if (!element.is(':visible')) return;
        if (!moreNotified && scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
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
                    (panelWrap ? panelWrap.offsetHeight : 58) - 46
          });
          return;
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0];
        }

        if (!dialogsColWrap || !dialogsColWrap.offsetHeight) {
          dialogsColWrap = $('.im_dialogs_col_wrap')[0];
        }
        $(element).css({
          height: $($window).height() -
                  (headWrap ? headWrap.offsetHeight : 46) -
                  (panelWrap ? panelWrap.offsetHeight : 58) -
                  parseInt($(dialogsColWrap).css('paddingBottom') || 0)
        });
      }

      $($window).on('resize', updateSizes);

      updateSizes();
      setTimeout(updateSizes, 1000);
    };

  })

  .directive('myHistoryMobile', function ($window, $timeout, $rootScope, $transition) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var historyWrap = $('.im_history_wrap', element)[0],
          historyMessagesEl = $('.im_history_messages', element)[0],
          scrollableWrap = $('.im_history_scrollable_wrap', element)[0],
          scrollable = $('.im_history_scrollable', element)[0],
          bottomPanelWrap = $('.im_bottom_panel_wrap', element)[0],
          sendFormWrap = $('.im_send_form_wrap', element)[0],
          headWrap = $('.tg_page_head')[0],
          sendForm = $('.im_send_form', element)[0],
          moreNotified = false,
          lessNotified = false;

      onContentLoaded(function () {
        scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
      });

      $scope.$on('ui_history_append_new', function (e, options) {
        if (!atBottom && !options.my) {
          return;
        }
        
        var pr = parseInt($(scrollableWrap).css('paddingRight'))
        $(scrollableWrap).addClass('im_history_to_bottom');
        $(scrollable).css({bottom: 0, marginLeft: -Math.ceil(pr / 2)});

        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: '', marginLeft: ''});
          scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
          updateBottomizer();
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
        $timeout(function () {
          $(scrollableWrap).trigger('scroll');
          scrollTopInitial = scrollableWrap.scrollTop;
        });
      };

      $scope.$on('ui_history_change', function () {
        var pr = parseInt($(scrollableWrap).css('paddingRight'))
        $(scrollableWrap).addClass('im_history_to_bottom');
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
      });

      var atBottom = true,
          scrollTopInitial = -1;
      $(scrollableWrap).on('scroll', function (e) {
        if (!element.is(':visible') ||
            $(scrollableWrap).hasClass('im_history_to_bottom')) {
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
        var historyH = $($window).height() - bottomPanelWrap.offsetHeight - (headWrap ? headWrap.offsetHeight : 46);
        $(historyWrap).css({
          height: historyH
        });

        updateBottomizer();


        if (heightOnly === true) return;
        if (atBottom) {
          onContentLoaded(function () {
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
          });
        }
      }

      function updateBottomizer () {
        return;
        $(historyMessagesEl).css({marginTop: 0});
        var marginTop = scrollableWrap.offsetHeight
                        - historyMessagesEl.offsetHeight
                        - 20;

        if (historyMessagesEl.offsetHeight > 0 && marginTop > 0) {
          $(historyMessagesEl).css({marginTop: marginTop});
        }
      }

      $($window).on('resize', updateSizes);

      updateSizes();
      onContentLoaded(updateSizes);
    }

  })

  .directive('myContactsListMobile', function($window, $timeout) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var searchWrap = $('.contacts_modal_search')[0],
          panelWrap = $('.contacts_modal_panel')[0];

      function updateSizes () {
        $(element).css({
          height: $($window).height() -
                  (panelWrap && panelWrap.offsetHeight || 0) -
                  (searchWrap && searchWrap.offsetHeight || 0) -
                  64
        });
      }

      $($window).on('resize', updateSizes);
      $scope.$on('contacts_change', function () {
        onContentLoaded(updateSizes)
      });
      onContentLoaded(updateSizes);
    };

  })

  .directive('myCountriesListMobile', function($window, $timeout) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var searchWrap = $('.countries_modal_search')[0],
          panelWrap = $('.countries_modal_panel')[0];

      function updateSizes () {
        $(element).css({
          height: $($window).height()
                    - (panelWrap && panelWrap.offsetHeight || 0)
                    - (searchWrap && searchWrap.offsetHeight || 0)
                    - (46 + 18)
        });
      }

      $($window).on('resize', updateSizes);
      onContentLoaded(updateSizes);
    };

  })

  .directive('myInfiniteScrollerMobile', function () {

    return {
      link: link,
      scope: true
    };

    function link($scope, element, attrs) {

      var scrollableWrap = element[0],
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
          });
        }
      });

    };
  })