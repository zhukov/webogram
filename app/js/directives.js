/*!
 * Webogram v0.3.9 - messaging web application for MTProto
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

  .directive('myFooter', function() {
    return {
      restrict: 'AE',
      templateUrl: templateUrl('footer')
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
  .directive('myExternalEmbed', function () {

    var twitterAttached = false;
    var facebookAttached = false;
    var gplusAttached = false;
    var twitterPendingWidgets = [];
    var facebookPendingWidgets = [];
    var embedTag = Config.Modes.chrome_packed ? 'webview' : 'iframe';

    function link ($scope, element, attrs) {
      var embedData = $scope.$eval(attrs.myExternalEmbed);
      if (!embedData) {
        return;
      }
      var html = '';
      var callback = false;
      var needTwitter = false;
      switch (embedData[0]) {
        case 'youtube':
          var videoID = embedData[1];
          html = '<div class="im_message_media_embed im_message_video_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
                'src="https://www.youtube.com/embed/' + videoID +
                '?autoplay=0&amp;controls=2" webkitallowfullscreen mozallowfullscreen allowfullscreen></' + embedTag + '></div>';
          break;

        case 'vimeo':
          var videoID = embedData[1];
          html = '<div class="im_message_media_embed im_message_video_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
                'src="https://player.vimeo.com/video/' + videoID +
                '?title=0&amp;byline=0&amp;portrait=0" webkitallowfullscreen mozallowfullscreen allowfullscreen></' + embedTag + '></div>';
          break;

        case 'instagram':
          var instaID = embedData[1];
          html = '<div class="im_message_media_embed im_message_insta_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
                'src="https://instagram.com/p/' + instaID +
                '/embed/"></' + embedTag + '></div>';
          break;

        case 'vine':
          var vineID = embedData[1];
          html = '<div class="im_message_media_embed im_message_vine_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
                'src="https://vine.co/v/' + vineID + '/embed/simple"></' + embedTag + '></div>';
          break;

        case 'soundcloud':
          var soundcloudUrl = embedData[1];
          html = '<div class="im_message_media_embed im_message_soundcloud_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
                'src="https://w.soundcloud.com/player/?url=' + encodeEntities(encodeURIComponent(soundcloudUrl)) +
                '&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></' + embedTag + '></div>';
          break;

        case 'twitter':
          html = '<div class="im_message_twitter_embed"><blockquote class="twitter-tweet" lang="en"><a href="' + embedData[1] + '"></a></blockquote></div>';

          callback = function () {
            if (!twitterAttached) {
              twitterAttached = true;
              $('<script>')
                .appendTo('body')
                .on('load', function () {
                  twttr.events.bind('loaded', function (event) {
                    for (var i = 0; i < twitterPendingWidgets.length; i++) {
                      twitterPendingWidgets[i].$emit('ui_height');
                    }
                    twitterPendingWidgets = [];
                  });
                })
                .attr('src', 'https://platform.twitter.com/widgets.js');
            }
            else if (window.twttr) {
              twttr.widgets.load(element[0]);
            }
            twitterPendingWidgets.push($scope);
          };
          break;

        case 'facebook':
          html = '<div class="im_message_facebook_embed"><div class="fb-post" data-href="' + embedData[1] + '" data-width="300"></div></div>';

          callback = function () {
            if (!facebookAttached) {
              facebookAttached = true;
              $('<script>')
                .appendTo('body')
                .on('load', function () {
                  FB.Event.subscribe('xfbml.render', function (event) {
                    for (var i = 0; i < facebookPendingWidgets.length; i++) {
                      facebookPendingWidgets[i].$emit('ui_height');
                    }
                    facebookPendingWidgets = [];
                  });
                })
                .attr('src', 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&appId=254098051407226&version=v2.0');
            }

            else if (window.FB) {
              FB.XFBML.parse(element[0]);
            }
            facebookPendingWidgets.push($scope);
          };
          break;

        case 'gplus':
          html = '<div class="im_message_gplus_embed"><div class="g-post" data-href="' + embedData[1] + '"></div></div>';

          callback = function () {
            if (!gplusAttached) {
              gplusAttached = true;

              window.___gcfg = {"parsetags": "explicit"};
              $('<script>')
                .appendTo('body')
                .on('load', function () {
                  gapi.post.go();
                })
                .attr('src', 'https://apis.google.com/js/plusone.js');
            }
            else if (window.gapi) {
              gapi.post.go(element[0]);
            }
            element.one('load', function () {
              $scope.$emit('ui_height');
            });
          };
          break;
      }

      if (html) {
        element[0].innerHTML = html;
        if (callback) {
          callback();
        }
      }
    }

    return {
      link: link
    };

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
  .directive('myMessageVideo', function(AppVideoManager) {
    return {
      scope: {
        'video': '=myMessageVideo',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_video'),
      link: function ($scope, element, attrs) {
        AppVideoManager.updateVideoDownloaded($scope.video.id);
        $scope.videoSave = function () {
          AppVideoManager.saveVideoFile($scope.video.id);
        };
        $scope.videoOpen = function () {
          AppVideoManager.openVideo($scope.video.id, $scope.messageId);
        };
      }
    };
  })
  .directive('myMessageDocument', function(AppDocsManager) {
    return {
      scope: {
        'document': '=myMessageDocument',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_document'),
      link: function ($scope, element, attrs) {
        AppDocsManager.updateDocDownloaded($scope.document.id);
        $scope.docSave = function () {
          AppDocsManager.saveDocFile($scope.document.id);
        };
        $scope.docOpen = function () {
          if (!$scope.document.withPreview) {
            return $scope.docSave();
          }
          AppDocsManager.openDoc($scope.document.id, $scope.messageId);
        };
      }
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

      $scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          var selectedDialog = $(scrollableWrap).find('.active a.im_dialog')[0];
          if (selectedDialog) {
            scrollToDialog(selectedDialog.parentNode);
          }
        });
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
          else {
            $scope.$emit('esc_no_more');
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
            scrollToDialog(nextDialogWrap);
          }

          return cancelEvent(e);
        }
      }

      function scrollToDialog(dialogWrap) {
        var elTop = dialogWrap.offsetTop,
            elHeight = dialogWrap.offsetHeight,
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
          var height = $($window).height() -
                        (panelWrap ? panelWrap.offsetHeight : 58) -
                        (Config.Mobile ? 46 : 200);
          height = Math.min(350, height);
          $(element).css({height: height});
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
        var footerHeight = footer ? footer.offsetHeight : 0;
        if (footerHeight) {
          footerHeight++; // Border bottom
        }
        $(element).css({
          height: $($window).height() -
                  footerHeight -
                  (headWrap ? headWrap.offsetHeight : 48) -
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
        $(scrollable).css({bottom: 0, paddingRight: pr});
        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: '', paddingRight: ''});
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
        $(scrollable).css({bottom: -(sh - st - ch), paddingRight: pr});

        var upd = function () {
            $(scrollableWrap).removeClass('im_history_to_bottom');
            $(scrollable).css({bottom: '', paddingRight: ''});
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
        var footerHeight = footer ? footer.offsetHeight : 0;
        if (footerHeight) {
          footerHeight++; // Border bottom
        }
        var historyH = $($window).height() - bottomPanelWrap.offsetHeight - (headWrap ? headWrap.offsetHeight : 48) - footerHeight;
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
                        - (Config.Mobile ? 0 : 39);

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

  .directive('mySendForm', function ($timeout, $modalStack, $http, $interpolate, Storage, ErrorService) {

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
          emojiQuickSelect = !Config.Mobile ? $('.im_emoji_quick_select_area', element)[0] : false,
          editorElement = messageField,
          dragStarted, dragTimeout,
          emojiArea = $(messageField).emojiarea({button: emojiButton, norealTime: true, quickSelect: emojiQuickSelect}),
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

            if (!sendAwaiting) {
              $scope.$apply(function () {
                $scope.draftMessage.text = richTextarea.textContent;
              });
            }

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
            $scope.draftMessage.send();
            $(element).trigger('message_send');
            resetTyping();
            return cancelEvent(e);
          }
        }

      });

      $(submitBtn).on('mousedown touchstart', function (e) {
        $timeout.cancel(updatePromise);
        updateValue();
        $scope.draftMessage.send();
        $(element).trigger('message_send');
        resetTyping();
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

      function resetTyping () {
        lastTyping = 0;
        lastLength = 0;
      };

      function updateRichTextarea () {
        if (richTextarea) {
          $timeout.cancel(updatePromise);
          var html = $('<div>').text($scope.draftMessage.text || '').html();
          html = html.replace(/\n/g, '<br/>');
          $(richTextarea).html(html);
          lastLength = html.length;
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

      $scope.$on('ui_peer_change', resetTyping);
      $scope.$on('ui_peer_draft', updateRichTextarea);

      var sendAwaiting = false;
      $scope.$on('ui_message_before_send', function () {
        sendAwaiting = true;
        $timeout.cancel(updatePromise);
        updateValue();
      });
      $scope.$on('ui_message_send', function () {
        sendAwaiting = false;
        focusField();
      });


      function focusField () {
        onContentLoaded(function () {
          editorElement.focus();
        });
      }

      function onPastedImageEvent (e) {
        var element = (e.originalEvent || e).target,
            src = (element || {}).src || '',
            remove = false;

        if (src.substr(0, 5) == 'data:') {
          remove = true;
          var blob = dataUrlToBlob(src);
          ErrorService.confirm({type: 'FILE_CLIPBOARD_PASTE'}).then(function () {
            $scope.draftMessage.files = [blob];
            $scope.draftMessage.isMedia = true;
          });
          setZeroTimeout(function () {
            element.parentNode.removeChild(element);
          })
        }
        else if (src && !src.match(/img\/blank\.gif/)) {
          var replacementNode = document.createTextNode(' ' + src + ' ');
          setTimeout(function () {
            element.parentNode.replaceChild(replacementNode, element);
          }, 100);
        }
      };

      function onPasteEvent (e) {
        var cData = (e.originalEvent || e).clipboardData,
            items = cData && cData.items || [],
            files = [],
            file, i;

        for (i = 0; i < items.length; i++) {
          if (items[i].kind == 'file') {
            file = items[i].getAsFile();
            files.push(file);
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
                .css({height: editorElement.offsetHeight + 2, width: editorElement.offsetWidth})
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

  .directive('myLoadThumb', function(MtpApiFileManager, FileManager) {

    return {
      link: link,
      scope: {
        thumb: '='
      }
    };

    function link ($scope, element, attrs) {
      var counter = 0;

      var cachedBlob = MtpApiFileManager.getCachedFile(
        $scope.thumb &&
        $scope.thumb.location &&
        !$scope.thumb.location.empty &&
        $scope.thumb.location
      );

      if (cachedBlob) {
        element.attr('src', FileManager.getUrl(cachedBlob, 'image/jpeg'));
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

        var cachedBlob = MtpApiFileManager.getCachedFile(newLocation);
        if (cachedBlob) {
          element.attr('src', FileManager.getUrl(cachedBlob, 'image/jpeg'));
          cleanup();
          return;
        }

        if (!element.attr('src')) {
          element.attr('src', $scope.thumb.placeholder || 'img/blank.gif');
        }

        MtpApiFileManager.downloadSmallFile($scope.thumb.location).then(function (blob) {
          if (counterSaved == counter) {
            element.attr('src', FileManager.getUrl(blob, 'image/jpeg'));
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

  .directive('myLoadFullPhoto', function(MtpApiFileManager, FileManager, _) {

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
            $scope.$emit('ui_height', true);
          };

      var jump = 0;
      $scope.$watchCollection('fullPhoto.location', function () {
        var cachedBlob = MtpApiFileManager.getCachedFile($scope.thumbLocation),
            curJump = ++jump;

        if (cachedBlob) {
          imgElement.src = FileManager.getUrl(cachedBlob, 'image/jpeg');
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

        apiPromise.then(function (blob) {
          if (curJump == jump) {
            $scope.progress.enabled = false;
            imgElement.src = FileManager.getUrl(blob, 'image/jpeg');
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


  .directive('myLoadVideo', function($sce, AppVideoManager, ErrorService, _) {

    return {
      link: link,
      transclude: true,
      templateUrl: templateUrl('full_video'),
      scope: {
        video: '='
      }
    };

    function link ($scope, element, attrs) {

      var downloadPromise = AppVideoManager.downloadVideo($scope.video.id);

      downloadPromise.then(function () {
        $scope.$emit('ui_height');
        onContentLoaded(function () {
          var videoEl = $('video', element)[0];
          if (videoEl) {
            var errorAlready = false;
            var onVideoError = function (event) {
              if (errorAlready) {
                return;
              }
              if (!event.target ||
                  !event.target.error ||
                  event.target.error.code == event.target.error.MEDIA_ERR_DECODE ||
                  event.target.error.code == event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                errorAlready = true;
                ErrorService.show({
                  error: {
                    type: 'MEDIA_TYPE_NOT_SUPPORTED',
                    originalError: event.target && event.target.error
                  }
                });
              }
            };

            videoEl.addEventListener('error', onVideoError, true);
            $(videoEl).on('$destroy', function () {
              errorAlready = true;
              videoEl.removeEventListener('error', onVideoError);
            });
          }
        });
      }, function (e) {
        console.log('Download video failed', e, $scope.video);

        if (e && e.type == 'FS_BROWSER_UNSUPPORTED') {
          $scope.error = {html: _('error_browser_no_local_file_system_video_md', {
              'moz-link': '<a href="{0}" target="_blank">{1}</a>',
              'chrome-link': '<a href="{0}" target="_blank">{1}</a>',
              'telegram-link': '<a href="{0}" target="_blank">{1}</a>'
            })};
        } else {
          $scope.error = {text: _('error_video_download_failed'), error: e};
        }

      });

      $scope.$emit('ui_height');

      $scope.$on('$destroy', function () {
        downloadPromise.cancel();
      });
    }

  })

  .directive('myLoadGif', function(AppDocsManager) {

    return {
      link: link,
      templateUrl: templateUrl('full_gif'),
      scope: {
        document: '='
      }
    };

    function link ($scope, element, attrs) {

      var downloadPromise = false;

      $scope.isActive = false;

      $scope.toggle = function (e) {
        if (checkClick(e, true)) {
          AppDocsManager.saveDocFile($scope.document.id);
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

        downloadPromise = AppDocsManager.downloadDoc($scope.document.id);

        downloadPromise.then(function () {
          $scope.isActive = true;
          $scope.$emit('ui_height');
        })
      }
    }
  })

  .directive('myLoadDocument', function(MtpApiFileManager, AppDocsManager, FileManager) {

    return {
      link: link,
      templateUrl: templateUrl('full_document'),
      scope: {
        document: '=myLoadDocument'
      }
    };

    function updateModalWidth(element, width) {
      while (element && !$(element).hasClass('modal-dialog')) {
        element = element.parentNode;
      }
      if (element) {
        $(element).width(width + (Config.Mobile ? 0 : 32));
      }
    }

    function link ($scope, element, attrs) {
      var loaderWrap = $('.document_fullsize_with_progress_wrap', element);
      var fullSizeWrap = $('.document_fullsize_wrap', element);
      var fullSizeImage = $('.document_fullsize_img', element);

      var fullWidth = $(window).width() - (Config.Mobile ? 20 : 32);
      var fullHeight = $(window).height() - 150;
      if (fullWidth > 800) {
        fullWidth -= 208;
      }

      $scope.imageWidth = fullWidth;
      $scope.imageHeight = fullHeight;

      var thumbPhotoSize = $scope.document.thumb;

      if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
        var wh = calcImageInBox(thumbPhotoSize.width, thumbPhotoSize.height, fullWidth, fullHeight);
        $scope.imageWidth = wh.w;
        $scope.imageHeight = wh.h;

        var cachedBlob = MtpApiFileManager.getCachedFile(thumbPhotoSize.location);
        if (cachedBlob) {
          $scope.thumbSrc = FileManager.getUrl(cachedBlob, 'image/jpeg');
        }
      }

      $scope.frameWidth = Math.max($scope.imageWidth, Math.min(600, fullWidth))
      $scope.frameHeight = $scope.imageHeight;

      onContentLoaded(function () {
        $scope.$emit('ui_height');
      });

      updateModalWidth(element[0], $scope.frameWidth);

      var checkSizesInt;
      var realImageWidth, realImageHeight;
      AppDocsManager.downloadDoc($scope.document.id).then(function (blob) {
        var url = FileManager.getUrl(blob, $scope.document.mime_type);
        var image = new Image();
        var limit = 100; // 2 sec
        var checkSizes = function (e) {
          if ((!image.height || !image.width) && --limit) {
            return;
          }
          realImageWidth = image.width;
          realImageHeight = image.height;
          clearInterval(checkSizesInt);

          var defaultWh = calcImageInBox(image.width, image.height, fullWidth, fullHeight, true);
          var zoomedWh = {w: realImageWidth, h: realImageHeight};
          if (defaultWh.w >= zoomedWh.w && defaultWh.h >= zoomedWh.h) {
            zoomedWh.w *= 4;
            zoomedWh.h *= 4;
          }

          var zoomed = true;
          $scope.toggleZoom = function () {
            zoomed = !zoomed;
            var imageWidth = (zoomed ? zoomedWh : defaultWh).w;
            var imageHeight = (zoomed ? zoomedWh : defaultWh).h;
            fullSizeImage.css({
              width: imageWidth,
              height: imageHeight,
              marginTop: $scope.frameHeight > imageHeight ? Math.floor(($scope.frameHeight - imageHeight) / 2) : 0
            });
            fullSizeWrap.toggleClass('document_fullsize_zoomed', zoomed);
          };

          $scope.toggleZoom(false);

          fullSizeImage.attr('src', url);
          loaderWrap.hide();
          fullSizeWrap.css({width: $scope.frameWidth, height: $scope.frameHeight}).show();

        };
        checkSizesInt = setInterval(checkSizes, 20);
        image.onload = checkSizes;
        image.src = url;
        setZeroTimeout(checkSizes);
      });
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
        ? '<div class="loading_dots"><i></i><i></i><i></i></div>'
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
        $(element[0].parentNode.parentNode).css({width: parseInt(newW) + (Config.Mobile ? 0 : 32)});
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
            modal = element[0].parentNode.parentNode.parentNode,
            bottomPanel = $('.media_modal_bottom_panel_wrap', modal)[0],
            contHeight = modal.offsetHeight - (bottomPanel && bottomPanel.offsetHeight || 0);

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

      $scope.$on('ui_height', function (e, sync) {
        if (sync) {
          updateMargin();
        } else {
          onContentLoaded(updateMargin);
        }
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
            ratio = attrs.myVerticalPosition && parseFloat(attrs.myVerticalPosition) || 0.5,
            contHeight = attrs.contHeight ? $scope.$eval(attrs.contHeight) : $($window).height(),
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

      $($window).on('resize', updateMargin);

      onContentLoaded(updateMargin);


      $scope.$on('ui_height', function () {
        onContentLoaded(updateMargin);
      });



    };

  })


  .directive('myUserLink', function ($timeout, AppUsersManager) {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      var override = attrs.userOverride && $scope.$eval(attrs.userOverride) || {};
      var short = attrs.short && $scope.$eval(attrs.short);

      var userID;
      var update = function () {
        var user = AppUsersManager.getUser(userID);
        var key = short ? 'rFirstName' : 'rFullName';

        element.html(
          (override[key] || user[key] || '').valueOf()
        );
        if (attrs.color && $scope.$eval(attrs.color)) {
          element.addClass('user_color_' + user.num);
        }
      };

      if (element[0].tagName == 'A') {
        element.on('click', function () {
          AppUsersManager.openUser(userID, override);
        });
      }

      if (attrs.userWatch) {
        $scope.$watch(attrs.myUserLink, function (newUserID) {
          userID = newUserID;
          update();
        });
      } else {
        userID = $scope.$eval(attrs.myUserLink);
        update();
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


  .directive('myUserPhotolink', function (AppUsersManager) {

    return {
      link: link,
      template: '<img my-load-thumb thumb="photo" /><i class="icon icon-online" ng-if="::showStatus || false" ng-show="user.status._ == \'userStatusOnline\'"></i>'
    };

    function link($scope, element, attrs) {

      var userID = $scope.$eval(attrs.myUserPhotolink);

      $scope.photo = AppUsersManager.getUserPhoto(userID, 'User');

      if ($scope.showStatus = attrs.status && $scope.$eval(attrs.status)) {
        $scope.user = AppUsersManager.getUser(userID);
      }

      if (element[0].tagName == 'A') {
        element.on('click', function (e) {
          AppUsersManager.openUser(userID, attrs.userOverride && $scope.$eval(attrs.userOverride));
        });
      }

      if (attrs.imgClass) {
        $(element[0].firstChild).addClass(attrs.imgClass)
      }

    }
  })

  .directive('myPeerPhotolink', function (AppPeersManager, AppUsersManager, AppChatsManager, MtpApiFileManager, FileManager) {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      element.addClass('peer_photo_init');

      var peerID, peer, peerPhoto;
      var imgEl = $('<img class="' + (attrs.imgClass || '') + '">');
      var initEl = $('<span class="peer_initials ' + (attrs.imgClass || '') + '"></span>');
      var jump = 0;
      var prevClass = false;

      var setPeerID = function (newPeerID) {
        if (peerID == newPeerID) {
          return false;
        }
        peerID = newPeerID;
        peer = AppPeersManager.getPeer(peerID);

        var newClass = 'user_bgcolor_' + (peer.num || 1);
        if (newClass != prevClass) {
          if (prevClass) {
            initEl.removeClass(prevClass);
          }
          initEl.addClass(newClass);
          prevClass = newClass;
        }

        updatePeerPhoto();

        return true;
      }

      var updatePeerPhoto = function () {
        peerPhoto = peer.photo && angular.copy(peer.photo.photo_small);

        var hasPhoto = peerPhoto !== undefined;

        if (hasPhoto) {
          var cachedBlob = MtpApiFileManager.getCachedFile(peer.photo.photo_small);
          if (cachedBlob) {
            initEl.remove();
            imgEl.prependTo(element).attr('src', FileManager.getUrl(cachedBlob, 'image/jpeg'));
            return;
          }
        }

        initEl.text(peer.initials).prependTo(element);
        imgEl.remove();


        if (hasPhoto) {
          var curJump = ++jump;

          MtpApiFileManager.downloadSmallFile(peer.photo.photo_small).then(function (blob) {
            if (curJump != jump) {
              return;
            }
            initEl.remove();
            imgEl.prependTo(element).attr('src', FileManager.getUrl(blob, 'image/jpeg'));

          }, function (e) {
            console.log('Download image failed', e, peer.photo.photo_small, element[0]);
          });
        }
      };

      if (element[0].tagName == 'A' && !attrs.noOpen) {
        element.on('click', function (e) {
          if (peerID > 0) {
            AppUsersManager.openUser(peerID, attrs.userOverride && $scope.$eval(attrs.userOverride));
          } else {
            AppChatsManager.openChat(-peerID);
          }
        });
      }

      $scope.$watch(attrs.myPeerPhotolink, setPeerID);

      if (attrs.watch) {
        $scope.$on('user_update', function (e, updUserID) {
          if (peerID == updUserID) {
            if (!angular.equals(peer.photo && peer.photo.photo_small, peerPhoto)) {
              updatePeerPhoto();
            }
          }
        });
        $scope.$on('chat_update', function (e, updChatID) {
          if (peerID == -updChatID) {
            if (!angular.equals(peer.photo && peer.photo.photo_small, peerPhoto)) {
              updatePeerPhoto();
            }
          }
        });
      }

    }
  })

  .directive('myAudioPlayer', function ($timeout, $q, Storage, AppAudioManager, AppDocsManager, ErrorService) {

    var currentPlayer = false;
    var audioVolume = 0.5;

    Storage.get('audio_volume').then(function (newAudioVolume) {
      if (newAudioVolume > 0 && newAudioVolume <= 1.0) {
        audioVolume = newAudioVolume;
      }
    });

    var onAudioError = function (event) {
      if (!event.target ||
          !event.target.error ||
          event.target.error.code == event.target.error.MEDIA_ERR_DECODE ||
          event.target.error.code == event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        ErrorService.show({
          error: {
            type: 'MEDIA_TYPE_NOT_SUPPORTED',
            originalError: event.target && event.target.error
          }
        });
      }
    };

    return {
      link: link,
      scope: {
        audio: '='
      },
      templateUrl: templateUrl('audio_player')
    };

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
      if ($scope.audio._ == 'audio') {
        AppAudioManager.updateAudioDownloaded($scope.audio.id);
      } else {
        AppDocsManager.updateDocDownloaded($scope.audio.id);
      }

      $scope.volume = audioVolume;
      $scope.mediaPlayer = {};

      $scope.download = function () {
        if ($scope.audio._ == 'audio') {
          AppAudioManager.saveAudioFile($scope.audio.id);
        } else {
          AppDocsManager.saveDocFile($scope.audio.id);
        }
      };

      $scope.togglePlay = function () {
        if ($scope.audio.url) {
          checkPlayer($scope.mediaPlayer.player);
          $scope.mediaPlayer.player.playPause();
        }
        else if ($scope.audio.progress && $scope.audio.progress.enabled) {
          return;
        }
        else {
          var downloadPromise;
          if ($scope.audio._ == 'audio') {
            downloadPromise = AppAudioManager.downloadAudio($scope.audio.id);
          } else {
            downloadPromise = AppDocsManager.downloadDoc($scope.audio.id);
          }

          downloadPromise.then(function () {
            onContentLoaded(function () {
              var audioEl = $('audio', element)[0];
              if (audioEl) {
                var errorAlready = false;
                var onAudioError = function (event) {
                  if (errorAlready) {
                    return;
                  }
                  if (!event.target ||
                      !event.target.error ||
                      event.target.error.code == event.target.error.MEDIA_ERR_DECODE ||
                      event.target.error.code == event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                    errorAlready = true;
                    ErrorService.show({
                      error: {
                        type: 'MEDIA_TYPE_NOT_SUPPORTED',
                        originalError: event.target && event.target.error
                      }
                    });
                  }
                };

                audioEl.addEventListener('error', onAudioError, true);
                $(audioEl).on('$destroy', function () {
                  errorAlready = true;
                  audioEl.removeEventListener('error', onAudioError);
                });
              }
              checkPlayer($scope.mediaPlayer.player);
              $scope.mediaPlayer.player.setVolume(audioVolume);
              $scope.mediaPlayer.player.play();
            })
          })
        }
      };

      $scope.seek = function (position) {
        if ($scope.mediaPlayer && $scope.mediaPlayer.player) {
          $scope.mediaPlayer.player.seek(position);
        } else {
          $scope.togglePlay();
        }
      };
      $scope.setVolume = function (volume) {
        audioVolume = volume;
        Storage.set({audio_volume: volume});
        if ($scope.mediaPlayer && $scope.mediaPlayer.player) {
          $scope.mediaPlayer.player.setVolume(volume);
        }
      };
    }
  })

  .directive('mySlider', function ($window) {
    return {
      link: link,
      templateUrl: templateUrl('slider')
    };

    function link ($scope, element, attrs) {
      var wrap = $('.tg_slider_wrap', element);
      var fill = $('.tg_slider_track_fill', element);
      var thumb = $('.tg_slider_thumb', element);
      var width = wrap.width();
      var thumbWidth = Math.ceil(thumb.width());
      var model = attrs.sliderModel;
      var sliderCallback = attrs.sliderOnchange;
      var minValue = 0.0;
      var maxValue = 1.0;
      var lastUpdValue = false;
      var lastMinPageX = false;

      if (attrs.sliderMin) {
        $scope.$watch(attrs.sliderMin, function (newMinValue) {
          minValue = newMinValue || 0.0;
        });
      }
      if (attrs.sliderMax) {
        $scope.$watch(attrs.sliderMax, function (newMaxValue) {
          maxValue = newMaxValue || 1.0;
        });
      }

      var onSliderMove = function (e) {
        e = e.originalEvent || e;

        var offsetX = (e.touches && e.touches[0] ? e.touches[0].pageX : e.pageX) - lastMinPageX;
        offsetX = Math.min(width, Math.max(0 , offsetX));
        // console.log(e.type, lastMinPageX, e.pageX, offsetX);
        lastUpdValue = minValue + offsetX / width * (maxValue - minValue);
        if (sliderCallback) {
          $scope.$eval(sliderCallback, {value: lastUpdValue});
        } else {
          $scope.$eval(model + '=' + lastUpdValue);
        }

        thumb.css('left', Math.max(0, offsetX - thumbWidth));
        fill.css('width', offsetX);

        return cancelEvent(e);
      };
      var stopSliderTrack = function () {
        $($window).off('mousemove touchmove', onSliderMove);
        $($window).off('mouseup touchend touchcancel touchleave', stopSliderTrack);
      };

      $scope.$watch(model, function (newVal) {
        if (newVal != lastUpdValue && newVal !== undefined) {
          var percent = Math.max(0, (newVal - minValue) / (maxValue - minValue));
          if (width) {
            var offsetX = Math.ceil(width * percent);
            offsetX = Math.min(width, Math.max(0 , offsetX));
            thumb.css('left', Math.max(0, offsetX - thumbWidth));
            fill.css('width', offsetX);
          } else {
            thumb.css('left', percent * 100 + '%');
            fill.css('width', percent * 100 + '%');
          }
          lastUpdValue = false;
        }
      });

      element.on('dragstart selectstart', cancelEvent);

      element.on('mousedown touchstart', function (e) {
        if (!width) {
          width = wrap.width();
          if (!width) {
            console.error('empty width');
            return cancelEvent(e);
          }
        }
        stopSliderTrack();

        e = e.originalEvent || e;

        var offsetX;
        if (e.touches && e.touches[0]) {
          lastMinPageX = element.position().left;
          offsetX = e.touches[0].pageX - lastMinPageX;
        }
        else if (e.offsetX !== undefined) {
          offsetX = e.offsetX;
          lastMinPageX = e.pageX - offsetX;
        }
        else if (e.layerX !== undefined) {
          offsetX = e.layerX;
          lastMinPageX = e.pageX - offsetX;
        }
        else {
          return cancelEvent(e);
        }

        // console.log(e.type, e, lastMinPageX, e.pageX, offsetX);
        lastUpdValue = minValue + offsetX / width * (maxValue - minValue);
        if (sliderCallback) {
          $scope.$eval(sliderCallback, {value: lastUpdValue});
        } else {
          $scope.$eval(model + '=' + lastUpdValue);
        }

        thumb.css('left', Math.max(0, offsetX - thumbWidth));
        fill.css('width', offsetX);

        $($window).on('mousemove touchmove', onSliderMove);
        $($window).on('mouseup touchend touchcancel touchleave', stopSliderTrack);

        return cancelEvent(e);
      });
    }

  })

  .directive('myLabeledInput', function () {

    return {
      link: link
    };

    function link($scope, element, attrs) {
      var input = $('.md-input:first', element);
      var label = $('.md-input-label:first', element);
      var isDisabled = input[0] && input[0].tagName == 'SPAN';
      var focused = false;
      var updateHasValueClass = function () {
        if (isDisabled) {
          element.toggleClass('md-input-has-value', input.html().length > 0);
        } else {
          element.toggleClass('md-input-has-value', focused || input.val().length > 0);
        }
      };

      updateHasValueClass();
      onContentLoaded(function () {
        updateHasValueClass();
        setZeroTimeout(function () {
          element.addClass('md-input-animated');
        });
      });

      if (!isDisabled) {
        input.on('blur focus change', function (e) {
          focused = e.type == 'focus';
          element.toggleClass('md-input-focused', focused);
          updateHasValueClass();
        });
      }

      $scope.$on('value_updated', function (event, args) {
        setZeroTimeout(function () {
          updateHasValueClass();
        });
      });
    };
  })

  .directive('mySubmitOnEnter', function () {

    return {
      link: link
    };

    function link($scope, element, attrs) {
      element.on('keydown', function (event) {
        if (event.keyCode == 13) {
          element.trigger('submit');
        }
      });
    };
  })

  .directive('myScrollToOn', function () {

    return {
      link: function($scope, element, attrs) {
        var ev = attrs.myScrollToOn;
        var doScroll = function () {
          onContentLoaded(function () {
            console.log(111,element, element.offset().top);
            $('html, body').animate({
              scrollTop: element.offset().top
            }, 200);
          });
        };
        if (ev == '$init') {
          doScroll();
        } else {
          $scope.$on(ev, doScroll);
        }
      }
    };

  })
