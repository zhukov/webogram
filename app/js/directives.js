/*!
 * Webogram v0.5.0 - messaging web application for MTProto
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
            if (selected != ($scope.selectedMsgs[$scope.historyMessage.mid] || false)) {
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
        if ((focusedMsgID == $scope.historyMessage.mid) != focused) {
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
          if (unreadAfter != ($scope.historyUnreadAfter == $scope.historyMessage.mid)) {
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
      if ($scope.historyMessage.unread && $scope.historyMessage.out) {
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

        case 'spotify':
          var spotifyUrl = embedData[1];
          html = '<div class="im_message_media_embed im_message_spotify_embed"><' + embedTag + ' type="text/html" frameborder="0" allowtransparency="true" ' +
           'src="https://embed.spotify.com/?uri=spotify:' + encodeEntities(encodeURIComponent(spotifyUrl)) +
           '"></' + embedTag + '></div>';
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

  .directive('myServiceShortMessage', function() {
    return {
      scope: {
        message: '=myServiceShortMessage'
      },
      templateUrl: templateUrl('dialog_service')
    };
  })

  .directive('myReplyMessage', function(AppPhotosManager, AppMessagesManager, AppPeersManager, $rootScope) {

    return {
      templateUrl: templateUrl('reply_message'),
      scope: {
        'replyMessage': '=myReplyMessage'
      },
      link: link
    };

    function link ($scope, element, attrs) {
      if (attrs.watch) {
        $scope.$watch('replyMessage', function () {
          checkMessage($scope, element);
        });
      } else {
        checkMessage($scope, element);
      }
    }

    function checkMessage ($scope, element) {
      var message = $scope.replyMessage;
      if (!message.loading) {
        updateMessage($scope, element);
      } else {
        var mid = message.mid;
        var stopWaiting = $scope.$on('messages_downloaded', function (e, mids) {
          if (mids.indexOf(mid) != -1) {
            $scope.replyMessage = AppMessagesManager.wrapForDialog(mid);
            updateMessage($scope, element);
            stopWaiting();
          }
        });
      }
    }

    function updateMessage($scope, element) {
      var message = $scope.replyMessage;
      if (!message || message.deleted || !message.to_id) {
        $(element).remove();
        return;
      }
      $scope.thumb = AppMessagesManager.getMessageThumb(message, 42, 42);

      if (element[0].tagName == 'A') {
        element.on('click', function () {
          var peerID = AppMessagesManager.getMessagePeer(message);
          var peerString = AppPeersManager.getPeerString(peerID);

          $rootScope.$broadcast('history_focus', {peerString: peerString, messageID: message.mid});

        })
      }

      onContentLoaded(function () {
        $scope.$emit('ui_height');
      })
    }

  })

  .directive('myForwardedMessages', function(AppPhotosManager, AppMessagesManager, AppPeersManager, $rootScope) {

    return {
      templateUrl: templateUrl('forwarded_messages'),
      scope: {
        'forwardMessages': '=myForwardedMessages'
      },
      link: link
    };

    function link ($scope, element, attrs) {
      if (attrs.watch) {
        $scope.$watch('forwardMessages', function () {
          updateMessages($scope, element);
        });
      } else {
        updateMessages($scope, element);
      }
    }

    function updateMessages ($scope, element) {
      var mids = $scope.forwardMessages;
      var length = mids.length;
      var fromID = false;
      var single = length == 1;
      $scope.thumb = false;
      $scope.singleMessage = false;
      angular.forEach(mids, function (mid) {
        var message = AppMessagesManager.getMessage(mid);
        if (fromID === false) {
          fromID = message.fromID;
        } else {
          if (fromID !== message.fromID) {
            fromID = AppMessagesManager.getMessagePeer(message);
          }
        }
        if (single) {
          $scope.thumb = AppMessagesManager.getMessageThumb(message, 42, 42);
          $scope.singleMessage = AppMessagesManager.wrapForDialog(mid);
        }
      });
      $scope.fromID = fromID;
      $scope.count = length;

      onContentLoaded(function () {
        $scope.$emit('ui_height');
      })
    }

  })

  .directive('myMessageText', function(AppPeersManager, AppMessagesManager, AppUsersManager, RichTextProcessor) {
    return {
      link: link,
      scope: {
        message: '=myMessageText'
      }
    };

    function updateHtml (message, element) {
      var entities = message.totalEntities;
      var fromUser = message.from_id && AppUsersManager.getUser(message.from_id);
      var fromBot = fromUser && fromUser.pFlags.bot && fromUser.username || false;
      var toPeerID = AppPeersManager.getPeerID(message.to_id);
      var withBot = (fromBot ||
                    toPeerID < 0 ||
                    toPeerID > 0 && AppUsersManager.isBot(toPeerID));

      var options = {
        noCommands: !withBot,
        fromBot: fromBot,
        entities: entities
      };
      if (message.flags & 16) {
        var user = AppUsersManager.getSelf();
        if (user) {
          options.highlightUsername = user.username;
        }
      }
      var html = RichTextProcessor.wrapRichText(message.message, options);
      // console.log('dd', entities, html);

      element.html(html.valueOf());
    }

    function link ($scope, element, attrs) {
      var message = $scope.message;
      var msgID = message.mid;
      // var msgID = $scope.$eval(attrs.myMessageText);
      // var message = AppMessagesManager.getMessage(msgID);

      updateHtml(message, element);

      if (message.pending) {
        var unlink = $scope.$on('messages_pending', function () {
          if (message.mid != msgID) {
            updateHtml(message, element);
            unlink();
          }
        })
      }
    }
  })

  .directive('myMessageViews', function($filter, AppMessagesManager) {

    var formatNumberFilter = $filter('formatShortNumber');

    return {
      link: link
    };

    function updateHtml (views, element) {
      element.html(formatNumberFilter(views));
    }

    function link ($scope, element, attrs) {
      var mid = $scope.$eval(attrs.myMessageViews);
      // console.log(element[0], mid);
      var views = AppMessagesManager.getMessage(mid).views || 0;

      updateHtml(views, element);

      $scope.$on('message_views', function (e, viewData) {
        if (viewData.mid == mid) {
          updateHtml(viewData.views, element);
        }
      })
    }
  })

  .directive('myReplyMarkup', function() {

    return {
      templateUrl: templateUrl('reply_markup'),
      scope: {
        'replyMarkup': '=myReplyMarkup'
      },
      link: link
    };

    function link ($scope, element, attrs) {
      var scrollable = $('.reply_markup', element);
      var scroller = new Scroller(scrollable, {
        classPrefix: 'reply_markup',
        maxHeight: 170
      });
      $scope.buttonSend = function (button) {
        $scope.$emit('reply_button_press', button);
      }

      $scope.$on('ui_keyboard_update', function (e, data) {
        onContentLoaded(function () {
          scroller.updateHeight();
          scroller.scrollTo(0);
          $scope.$emit('ui_panel_update', {blur: data.enabled});
        })
      });
      onContentLoaded(function () {
        scroller.updateHeight();
        $scope.$emit('ui_panel_update');
      });
    }

  })

  .directive('myMessagePhoto', function(AppPhotosManager) {
    return {
      scope: {
        'media': '=myMessagePhoto',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_photo'),
      link: function ($scope, element, attrs) {
        $scope.openPhoto = AppPhotosManager.openPhoto;
      }
    };
  })
  .directive('myMessageVideo', function(AppVideoManager) {
    return {
      scope: {
        'media': '=myMessageVideo',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_video'),
      link: function ($scope, element, attrs) {
        AppVideoManager.updateVideoDownloaded($scope.media.video.id);
        $scope.videoSave = function () {
          AppVideoManager.saveVideoFile($scope.media.video.id);
        };
        $scope.videoOpen = function () {
          AppVideoManager.openVideo($scope.media.video.id, $scope.messageId);
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
  .directive('myMessageGeo', function() {
    return {
      scope: {
        'media': '=myMessageGeo'
      },
      templateUrl: templateUrl('message_attach_geo')
    };
  })
  .directive('myMessageVenue', function() {
    return {
      scope: {
        'venue': '=myMessageVenue'
      },
      templateUrl: templateUrl('message_attach_venue')
    };
  })
  .directive('myMessageContact', function() {
    return {
      templateUrl: templateUrl('message_attach_contact')
    };
  })
  .directive('myMessageWebpage', function(AppWebPagesManager, AppPhotosManager) {
    return {
      scope: {
        'webpage': '=myMessageWebpage',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_webpage'),
      link: function ($scope) {
        $scope.openPhoto = AppPhotosManager.openPhoto;
        $scope.openEmbed = function ($event) {
          if ($scope.webpage && $scope.webpage.embed_url) {
            AppWebPagesManager.openEmbed($scope.webpage.id, $scope.messageId);
            return cancelEvent($event);
          }
        };

        $scope.$on('webpage_updated', function (e, eventData) {
          if ($scope.webpage && $scope.webpage.id == eventData.id) {
            $scope.$emit('ui_height');
          }
        });
      }
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
          setFieldSelection(searchField);
        })
      });

      $scope.$on('search_clear', function () {
        $(panelWrap).removeClass('im_dialogs_panel_search');
        $scope.$broadcast('ui_dialogs_search');
      });

      $(document).on('keydown', onKeyDown);

      $scope.$on('$destroy', function () {
        $(document).off('keydown', onKeyDown);
      });

      $scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          var selectedDialog = $(scrollableWrap).find('.active a.im_dialog')[0];
          if (selectedDialog) {
            scrollToNode(scrollableWrap, selectedDialog.parentNode, dialogsWrap);
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
            setFieldSelection(searchField);
            if (searchField.value) {
              searchField.select();
            }
          }
          else if (searchField.value) {
            $(searchClear).trigger('click');
          }
          else {
            $scope.$emit('esc_no_more');
            // Strange Chrome bug, when field doesn't get blur, but becomes inactive after location change
            setTimeout(function () {
              searchField.blur();
              searchField.focus();
            }, 100);
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

        if ( e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey &&
              e.keyCode >= 49 && e.keyCode <= 57 ) { // Alt + Shift + # , switch to conversation # where # is in [1..9]

          var dialogNumber = e.keyCode - 49,
              dialogWraps = $(scrollableWrap).find('.im_dialog_wrap'),
              nextDialogWrap = dialogWraps[dialogNumber];

          if (nextDialogWrap) {
            $(nextDialogWrap).find('a').trigger('mousedown');
            scrollToNode(scrollableWrap, nextDialogWrap, dialogsWrap);
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
            scrollToNode(scrollableWrap, nextDialogWrap, dialogsWrap);
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
                        (panelWrap ? panelWrap.offsetHeight : 49) -
                        (Config.Mobile ? 46 : 100);
          height = Math.min(Config.Mobile ? 350 : 450, height);
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

  .directive('mySessionsList', function($window, $timeout) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var sessionsWrap = $('.sessions_wrap', element)[0];

      onContentLoaded(function () {
        $(sessionsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
        updateSizes();
      });

      function updateSizes () {
        $(element).css({
          height: Math.min(760, $($window).height()
                    - (Config.Mobile ? 46 + 18 : 200))
        });
        $(sessionsWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);
    };

  })

  .directive('myStickersList', function($window, $timeout) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var stickersWrap = $('.stickerset_wrap', element)[0];

      onContentLoaded(function () {
        $(stickersWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
        updateSizes();
      });

      function updateSizes () {
        $(element).css({
          height: Math.min(500, $($window).height()
                    - (Config.Mobile ? 46 + 18 : 200))
        });
        $(stickersWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);
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
          onContentLoaded(function () {
            $(historyWrap).nanoScroller();
          });
          return;
        }
        if (options.idleScroll) {
          onContentLoaded(function () {
            $(historyWrap).nanoScroller();
            changeScroll(true);
          });
          return;
        }
        var curAnimated = animated &&
                          !$rootScope.idle.isIDLE &&
                          historyMessagesEl.clientHeight > 0,
            wasH;

        if (curAnimated) {
          wasH = scrollableWrap.scrollHeight;
        } else {
          var pr = parseInt($(scrollableWrap).css('paddingRight'))
          $(scrollable).css({bottom: 0, paddingRight: pr});
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
            $(scrollable).css({bottom: '', paddingRight: 0});
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
            updateBottomizer();
          }
        });
      });

      function changeScroll (noFocus, animated) {
        var unreadSplit, focusMessage;

        var newScrollTop = false;
        // console.trace('change scroll');
        if (!noFocus &&
            (focusMessage = $('.im_message_focus:visible', scrollableWrap)[0])) {
          var ch = scrollableWrap.clientHeight,
              st = scrollableWrap.scrollTop,
              ot = focusMessage.offsetTop,
              h = focusMessage.clientHeight;
          if (!st || st + ch < ot || st > ot + h || animated) {
            newScrollTop = Math.max(0, ot - Math.floor(ch / 2) + 26);
          }
          atBottom = false;
        } else if (unreadSplit = $('.im_message_unread_split:visible', scrollableWrap)[0]) {
          // console.log('change scroll unread', unreadSplit.offsetTop);
          newScrollTop = Math.max(0, unreadSplit.offsetTop - 52);
          atBottom = false;
        } else {
          // console.log('change scroll bottom');
          newScrollTop = scrollableWrap.scrollHeight;
          atBottom = true;
        }
        if (newScrollTop !== false) {
          var afterScroll = function () {
            updateScroller();
            $timeout(function () {
              $(scrollableWrap).trigger('scroll');
              scrollTopInitial = scrollableWrap.scrollTop;
            });
          }
          if (animated) {
            $(scrollableWrap).animate({scrollTop: newScrollTop}, 200, afterScroll);
          } else {
            scrollableWrap.scrollTop = newScrollTop;
            afterScroll();
          }
        }
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

      $scope.$on('ui_history_change_scroll', function (e, animated) {
        onContentLoaded(function () {
          changeScroll(false, animated);
        })
      });

      $scope.$on('ui_history_focus', function () {
        if (!atBottom) {
          // console.log(dT(), 'scroll history focus');
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
              // console.log('change scroll prepend');
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

      $scope.$on('ui_panel_update', function (e, data) {
        updateSizes();
        onContentLoaded(function () {
          updateSizes();
          if (data && data.blur) {
            $scope.$broadcast('ui_message_blur');
          } else if (!getSelectedText()) {
            $scope.$broadcast('ui_message_send');
          }

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
            // console.log('change scroll bottom');
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

  .directive('mySendForm', function (_, $timeout, $compile, $modalStack, $http, $interpolate, Storage, AppStickersManager, AppDocsManager, ErrorService) {

    return {
      link: link,
      scope: {
        draftMessage: '=',
        mentions: '=',
        commands: '='
      }
    };

    function link ($scope, element, attrs) {

      var messageField = $('textarea', element)[0];
      var emojiButton = $('.composer_emoji_insert_btn', element)[0];
      var emojiPanel = $('.composer_emoji_panel', element)[0];
      var fileSelects = $('input', element);
      var dropbox = $('.im_send_dropbox_wrap', element)[0];
      var messageFieldWrap = $('.im_send_field_wrap', element)[0];
      var dragStarted, dragTimeout;
      var submitBtn = $('.im_submit', element)[0];

      var stickerImageCompiled = $compile('<a class="composer_sticker_btn" data-sticker="{{::document.id}}" my-load-sticker document="document" thumb="true" img-class="composer_sticker_image"></a>');
      var cachedStickerImages = {};

      var emojiTooltip = new EmojiTooltip(emojiButton, {
        getStickers: function (callback) {
          AppStickersManager.getStickers().then(callback);
        },
        getStickerImage: function (element, docID) {
          var category = element.attr('data-category');
          var cached = cachedStickerImages[docID];
          if (cached && !isInDOM(cached[0])) {
            cached.attr('data-category', category);
            element.replaceWith(cached);
            return;
          }
          var scope = $scope.$new(true);
          scope.document = AppDocsManager.getDoc(docID);
          stickerImageCompiled(scope, function (clonedElement) {
            cachedStickerImages[docID] = clonedElement;
            clonedElement.attr('data-category', category);
            element.replaceWith(clonedElement);
          });
        },
        onStickersetSelected: function (stickerset) {
          AppStickersManager.openStickersetLink(stickerset);
        },
        onEmojiSelected: function (code) {
          $scope.$apply(function () {
            composer.onEmojiSelected(code);
          })
        },
        onStickerSelected: function (docID) {
          $scope.$apply(function () {
            $scope.draftMessage.sticker = docID;
          });
        },
        langpack: {
          im_emoji_tab: _('im_emoji_tab'),
          im_stickers_tab: _('im_stickers_tab')
        }
      });

      var composerEmojiPanel;
      if (emojiPanel) {
        composerEmojiPanel = new EmojiPanel(emojiPanel, {
          onEmojiSelected: function (code) {
            composer.onEmojiSelected(code);
          }
        });
      }

      var peerPhotoCompiled = $compile('<span class="composer_user_photo" my-peer-photolink="peerID" img-class="composer_user_photo"></span>');
      var cachedPeerPhotos = {};

      var composer = new MessageComposer(messageField, {
        onTyping: function () {
          $scope.$emit('ui_typing');
        },
        getSendOnEnter: function () {
          return sendOnEnter;
        },
        getPeerImage: function (element, peerID, noReplace) {
          if (cachedPeerPhotos[peerID] && !noReplace) {
            element.replaceWith(cachedPeerPhotos[peerID]);
            return;
          }
          var scope = $scope.$new(true);
          scope.peerID = peerID;
          peerPhotoCompiled(scope, function (clonedElement) {
            cachedPeerPhotos[peerID] = clonedElement;
            element.replaceWith(clonedElement);
          });
        },
        mentions: $scope.mentions,
        commands: $scope.commands,
        onMessageSubmit: onMessageSubmit,
        onFilePaste: onFilePaste,
        onCommandSend: function (command) {
          $scope.$apply(function () {
            $scope.draftMessage.command = command;
          });
        }
      });

      var richTextarea = composer.richTextareaEl[0];
      if (richTextarea) {
        $(richTextarea).on('keydown keyup', updateHeight);
      }

      fileSelects.on('change', function () {
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

      var sendOnEnter = true;
      function updateSendSettings () {
        Storage.get('send_ctrlenter').then(function (sendOnCtrl) {
          sendOnEnter = !sendOnCtrl;
        });
      };
      $scope.$on('settings_changed', updateSendSettings);
      updateSendSettings();

      $(submitBtn).on('mousedown touchstart', onMessageSubmit);

      function onMessageSubmit (e) {
        $scope.$apply(function () {
          updateValue();
          $scope.draftMessage.send();
          composer.resetTyping();
          if (composerEmojiPanel) {
            composerEmojiPanel.update();
          }
        });
        return cancelEvent(e);
      }

      function updateValue () {
        if (richTextarea) {
          composer.onChange();
          updateHeight();
        }
      }

      var height = richTextarea && richTextarea.offsetHeight;
      function updateHeight () {
        var newHeight = richTextarea.offsetHeight;
        if (height != newHeight) {
          height = newHeight;
          $scope.$emit('ui_editor_resize');
        }
      };

      function onKeyDown(e) {
        if (e.keyCode == 9 && !e.shiftKey && !e.ctrlKey && !e.metaKey && !$modalStack.getTop()) { // TAB
          composer.focus();
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

      $scope.$on('ui_peer_change', composer.resetTyping.bind(composer));
      $scope.$on('ui_peer_draft', function (e, options) {
        options = options || {};
        var isBroadcast = $scope.draftMessage.isBroadcast;
        composer.setPlaceholder(_(isBroadcast ? 'im_broadcast_field_placeholder_raw' : 'im_message_field_placeholder_raw'));

        if (options.customSelection) {
          composer.setFocusedValue(options.customSelection);
          updateHeight();
        } else {
          if (richTextarea) {
            composer.setValue($scope.draftMessage.text || '');
            updateHeight();
          }
          if (!Config.Navigator.touch || options && options.focus) {
            composer.focus();
          }
        }
        onContentLoaded(function () {
          composer.checkAutocomplete(true);
        });
        if (emojiTooltip && Config.Mobile) {
          emojiTooltip.hide();
        }
      });
      $scope.$on('ui_peer_reply', function () {
        onContentLoaded(function () {
          $scope.$emit('ui_editor_resize');
          if (!Config.Navigator.touch) {
            composer.focus();
          }
        })
      });

      $scope.$on('mentions_update', function () {
        composer.onMentionsUpdated();
      });

      var sendAwaiting = false;
      $scope.$on('ui_message_before_send', function () {
        sendAwaiting = true;
        updateValue();
      });
      $scope.$on('ui_message_send', function () {
        sendAwaiting = false;
        if (!Config.Navigator.touch) {
          focusField();
        }
      });
      $scope.$on('ui_message_blur', function () {
        composer.blur();
      });

      function focusField () {
        onContentLoaded(function () {
          composer.focus();
        });
      }

      function onFilePaste (blob) {
        ErrorService.confirm({type: 'FILE_CLIPBOARD_PASTE'}).then(function () {
          $scope.draftMessage.files = [blob];
          $scope.draftMessage.isMedia = true;
        });
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
              $(emojiButton).hide();
              $(dropbox)
                .css({height: messageFieldWrap.offsetHeight + 2, width: messageFieldWrap.offsetWidth})
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
              $(emojiButton).show();
              dragStarted = false;
              dragTimeout = false;
            }, 300);
          }
        }

        return cancelEvent(e);
      };


      $scope.$on('$destroy', function cleanup() {
        $(document).off('paste', onPasteEvent);
        $(document).off('keydown', onKeyDown);
        $('body').off('dragenter dragleave dragover drop', onDragDropEvent);
        $(submitBtn).off('mousedown touchstart');
        fileSelects.off('change');
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
          onContentLoaded(function () {
            $scope.isActive = !$scope.isActive;
            $scope.$emit('ui_height');
          })
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

  .directive('myLoadSticker', function(MtpApiFileManager, FileManager, AppStickersManager) {

    var emptySrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    return {
      link: link,
      scope: {
        document: '='
      }
    };

    function link ($scope, element, attrs) {
      var imgElement = $('<img />').addClass(attrs.imgClass);
      var wasAdded = false;

      if (attrs.open && $scope.document.stickerSetInput) {
        element
          .addClass('clickable')
          .on('click', function () {
            AppStickersManager.openStickerset($scope.document.stickerSetInput);
          });
      }

      var setSrc = function (blob) {
        imgElement.attr('src', FileManager.getUrl(blob));
        if (!wasAdded) {
          wasAdded = true;
          imgElement.appendTo(element);
        }
      };

      imgElement.css({
        width: $scope.document.thumb.width,
        height: $scope.document.thumb.height
      });
      element.css({
        width: $scope.document.thumb.width,
        height: $scope.document.thumb.height
      });

      var smallLocation = angular.copy($scope.document.thumb.location);
      smallLocation.sticker = true;

      var fullLocation = {
        _: 'inputDocumentFileLocation',
        id: $scope.document.id,
        access_hash: $scope.document.access_hash,
        dc_id: $scope.document.dc_id,
        file_name: $scope.document.file_name,
        sticker: true
      };


      var cachedBlob = MtpApiFileManager.getCachedFile(fullLocation);
      var fullDone = false;
      if (!cachedBlob) {
        cachedBlob = MtpApiFileManager.getCachedFile(smallLocation);
      } else {
        fullDone = true;
      }
      if (cachedBlob) {
        setSrc(cachedBlob);
        if (fullDone) {
          return;
        }
      } else {
        wasAdded = true;
        imgElement.attr('src', emptySrc).appendTo(element);
      }

      if (attrs.thumb) {
        MtpApiFileManager.downloadSmallFile(smallLocation).then(function (blob) {
          setSrc(blob);
        }, function (e) {
          console.log('Download sticker failed', e, fullLocation);
        });
      } else {
        MtpApiFileManager.downloadFile($scope.document.dc_id, fullLocation, $scope.document.size).then(function (blob) {
          setSrc(blob);
        }, function (e) {
          console.log('Download sticker failed', e, fullLocation);
        });
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

  .directive('myGeoPointMap', function(ExternalResourcesManager) {
    return {
      link: link,
      scope: {
        point: '=myGeoPointMap'
      }
    };

    function link ($scope, element, attrs) {
      var width = element.attr('width') || 200;
      var height = element.attr('height') || 200;

      element.attr('src', 'img/blank.gif');

      var apiKey = Config.ExtCredentials.gmaps.api_key;

      var src = 'https://maps.googleapis.com/maps/api/staticmap?sensor=false&center=' + $scope.point['lat'] + ',' + $scope.point['long'] + '&zoom=15&size='+width+'x'+height+'&scale=2&key=' + apiKey;

      ExternalResourcesManager.downloadImage(src).then(function (url) {
        element.attr('src', url);
      });
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
          setFieldSelection(element[0]);
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
            setFieldSelection(element[0]);
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

  .directive('myUserStatus', function ($filter, AppUsersManager) {

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
              .html(statusFilter(user, attrs.botChatPrivacy))
              .toggleClass('status_online', user.status && user.status._ == 'userStatusOnline' || false);
          };

      $scope.$watch(attrs.myUserStatus, function (newUserID) {
        userID = newUserID;
        update();
      });
      $scope.$on('user_update', function (e, updUserID) {
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

  .directive('myChatStatus', function ($rootScope, _, MtpApiManager, AppChatsManager, AppUsersManager, AppProfileManager) {

    var ind = 0;
    var statuses = {};

    var allPluralize = _.pluralize('group_modal_pluralize_participants');
    var onlinePluralize = _.pluralize('group_modal_pluralize_online_participants');

    var myID = 0;
    MtpApiManager.getUserID().then(function (newMyID) {
      myID = newMyID;
    });

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
      var chatID;
      var curInd = ind++;
      var participantsCount = 0;
      var participants = {};

      var updateParticipants = function () {
        participantsCount = 0;
        participants = {};
        if (!chatID) {
          return;
        }
        AppProfileManager.getChatFull(chatID).then(function (chatFull) {
          var participantsVector = (chatFull.participants || {}).participants || [];
          participantsCount = participantsVector.length;
          angular.forEach(participantsVector, function (participant) {
            participants[participant.user_id] = true;
          });
          if (chatFull.participants_count) {
            participantsCount = chatFull.participants_count || 0;
          }
          update();
        });
      };

      var update = function () {
        var html = allPluralize(participantsCount);
        var onlineCount = 0;
        var wasMe = false;
        angular.forEach(participants, function (t, userID) {
          var user = AppUsersManager.getUser(userID);
          if (user.status && user.status._ == 'userStatusOnline') {
            if (user.id == myID) {
              wasMe = true;
            }
            onlineCount++;
          }
        });
        if (onlineCount > 1 || onlineCount == 1 && !wasMe) {
          html = _('group_modal_participants', {total: html, online: onlinePluralize(onlineCount)});
        }
        if (!onlineCount && !participantsCount) {
          html = '';
        }
        element.html(html);
      };

      $scope.$watch(attrs.myChatStatus, function (newChatID) {
        chatID = newChatID;
        updateParticipants();
      });

      $rootScope.$on('chat_full_update', function (e, updChatID) {
        if (chatID == updChatID) {
          updateParticipants();
        }
      });

      $rootScope.$on('user_update', function (e, updUserID) {
        if (participants[updUserID]) {
          update();
        }
      });

      statuses[curInd] = update;
      $scope.$on('$destroy', function () {
        delete statuses[curInd];
      });
    }
  })

  .directive('myPeerLink', function (AppChatsManager, AppUsersManager) {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      var override = attrs.userOverride && $scope.$eval(attrs.userOverride) || {};
      var short = attrs.short && $scope.$eval(attrs.short);

      var peerID;
      var update = function () {
        if (element[0].className.indexOf('user_color_') != -1) {
          element[0].className = element[0].className.replace(/user_color_\d+/g, '');
        }
        if (peerID > 0) {
          var user = AppUsersManager.getUser(peerID);
          var key = short ? 'rFirstName' : 'rFullName';

          element.html(
            (override[key] || user[key] || '').valueOf() +
            (attrs.verified && user.pFlags && user.pFlags.verified ? ' <i class="icon-verified"></i>' : '')
          );
          if (attrs.color && $scope.$eval(attrs.color)) {
            element.addClass('user_color_' + user.num);
          }
        } else {
          var chat = AppChatsManager.getChat(-peerID);

          element.html(
            (chat.rTitle || '').valueOf() +
            (attrs.verified && chat.pFlags && chat.pFlags.verified ? ' <i class="icon-verified"></i>' : '')
          );
        }
      };

      if (element[0].tagName == 'A') {
        element.on('click', function () {
          if (peerID > 0) {
            AppUsersManager.openUser(peerID, override);
          } else {
            AppChatsManager.openChat(-peerID);
          }
        });
      }

      if (attrs.peerWatch) { // userWatch, chatWatch
        $scope.$watch(attrs.myPeerLink, function (newPeerID) {
          peerID = newPeerID;
          update();
        });
      } else {
        peerID = $scope.$eval(attrs.myPeerLink);
        update();
      }
      if (!attrs.noWatch) {
        $scope.$on('user_update', function (e, updUserID) {
          if (peerID == updUserID) {
            update();
          }
        });
        $scope.$on('chat_update', function (e, updChatID) {
          if (peerID == -updChatID) {
            update();
          }
        });
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
        var curJump = ++jump;

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
      setPeerID($scope.$eval(attrs.myPeerPhotolink));

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

  .directive('myAudioPlayer', function ($timeout, $q, Storage, AppAudioManager, AppDocsManager, AppMessagesManager, ErrorService) {

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
        audio: '=',
        message: '='
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
              var errorListenerEl = $('audio', element)[0] || element[0];
              if (errorListenerEl) {
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

                errorListenerEl.addEventListener('error', onAudioError, true);
                $scope.$on('$destroy', function () {
                  errorAlready = true;
                  errorListenerEl.removeEventListener('error', onAudioError);
                });
              }
              setTimeout(function () {
                checkPlayer($scope.mediaPlayer.player);
                $scope.mediaPlayer.player.setVolume(audioVolume);
                $scope.mediaPlayer.player.play();

                if ($scope.message &&
                    !$scope.message.out &&
                    $scope.message.media_unread) {
                  AppMessagesManager.readMessages([$scope.message.mid]);
                }
              }, 300);
            });
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

      $scope.$on('value_updated', function () {
        setZeroTimeout(function () {
          updateHasValueClass();
        });
      });
    };
  })

  .directive('myCopyField', function () {

    return {
      scope: {
        selectEvent: '=myCopyField'
      },
      link: link
    };

    function link($scope, element, attrs) {
      element.attr('readonly', 'true');
      element[0].readonly = true;
      element.on('click', function () {
        this.select();
      });

      if ($scope.selectEvent) {
        $scope.$on($scope.selectEvent, function () {
          setTimeout(function () {
            element[0].focus();
            element[0].select();
          }, 100);
        });
      }
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
          return cancelEvent(event);
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
