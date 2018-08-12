/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict'
/* global Config, templateUrl, onContentLoaded, cancelEvent, dT, setZeroTimeout calcImageInBox, getSelectedText,Scroller, setFieldSelection, scrollToNode, EmojiTooltip, EmojiPanel, MessageComposer, checkDragEvent, checkClick, Image, Clipboard, EmojiHelper, encodeEntities, FB, twttr, gapi, isInDOM, hasOnclick */

/* Directives */

angular.module('myApp.directives', ['myApp.filters'])

  .constant('shouldFocusOnInteraction', !Config.Navigator.mobile)

  .directive('myHead', function () {
    return {
      restrict: 'AE',
      templateUrl: templateUrl('head')
    }
  })

  .directive('myLangFooter', function () {
    return {
      restrict: 'AE',
      templateUrl: templateUrl('lang_footer')
    }
  })

  .directive('myFooter', function () {
    return {
      restrict: 'AE',
      templateUrl: templateUrl('footer')
    }
  })

  .directive('myDialog', function () {
    return {
      restrict: 'AE',
      templateUrl: templateUrl('dialog')
    }
  })

  .directive('myMessage', function ($filter, _) {
    var dateFilter = $filter('myDate')
    var dateSplitHtml = '<div class="im_message_date_split im_service_message_wrap"><div class="im_service_message"><span class="copyonly"><br/>---&nbsp;</span><span class="im_message_date_split_text"></span><span class="copyonly">&nbsp;---</span></div></div>'
    var unreadSplitHtml = '<div class="im_message_unread_split">' + _('unread_messages_split') + '</div>'
    var selectedClass = 'im_message_selected'
    var focusClass = 'im_message_focus'
    var unreadClass = 'im_message_unread'
    var errorClass = 'im_message_error'
    var pendingClass = 'im_message_pending'

    return {
      templateUrl: templateUrl('message'),
      link: link
    }

    function link ($scope, element, attrs) {
      var selected = false
      var grouped = false
      var focused = false
      var error = false
      var pending = false
      var needDate = false
      var unreadAfter = false
      var applySelected = function () {
        if (selected != ($scope.selectedMsgs[$scope.historyMessage.mid] || false)) {
          selected = !selected
          element.toggleClass(selectedClass, selected)
        }
      }
      var needDateSplit, unreadAfterSplit
      var applyGrouped = function () {
        if (grouped != $scope.historyMessage.grouped) {
          if (grouped) {
            element.removeClass(grouped)
          }
          grouped = $scope.historyMessage.grouped
          if (grouped) {
            element.addClass(grouped)
          }
        }
        if (needDate != ($scope.historyMessage.needDate || false)) {
          needDate = !needDate
          if (needDate) {
            if (needDateSplit) {
              needDateSplit.show()
            } else {
              needDateSplit = $(dateSplitHtml)
              $('.im_message_date_split_text', needDateSplit).text(dateFilter($scope.historyMessage.date))
              if (unreadAfterSplit) {
                needDateSplit.insertBefore(unreadAfterSplit)
              } else {
                needDateSplit.prependTo(element)
              }
            }
          } else {
            needDateSplit.hide()
          }
        }
      }

      applySelected()
      applyGrouped()

      $scope.$on('messages_select', applySelected)
      $scope.$on('messages_regroup', applyGrouped)

      $scope.$on('messages_focus', function (e, focusedMsgID) {
        if ((focusedMsgID == $scope.historyMessage.mid) != focused) {
          focused = !focused
          element.toggleClass(focusClass, focused)
        }
      })

      var deregisterUnreadAfter
      if (!$scope.historyMessage.pFlags.out &&
        ($scope.historyMessage.pFlags.unread || $scope.historyMessage.unreadAfter)) {
        var applyUnreadAfter = function () {
          if ($scope.peerHistory.peerID != $scope.historyPeer.id) {
            return
          }
          if (unreadAfter != ($scope.historyUnreadAfter == $scope.historyMessage.mid)) {
            unreadAfter = !unreadAfter
            if (unreadAfter) {
              if (unreadAfterSplit) {
                unreadAfterSplit.show()
              } else {
                unreadAfterSplit = $(unreadSplitHtml).prependTo(element)
              }
            } else {
              unreadAfterSplit.hide()
              if (deregisterUnreadAfter) {
                deregisterUnreadAfter()
              }
            }
          }
        }
        applyUnreadAfter()
        deregisterUnreadAfter = $scope.$on('messages_unread_after', applyUnreadAfter)
      }
      if ($scope.historyMessage.pFlags.unread && $scope.historyMessage.pFlags.out) {
        element.addClass(unreadClass)
        var deregisterUnread = $scope.$on('messages_read', function () {
          if (!$scope.historyMessage.pFlags.unread) {
            element.removeClass(unreadClass)
            deregisterUnread()
            if (deregisterUnreadAfter && !unreadAfter) {
              deregisterUnreadAfter()
            }
          }
        })
      }
      if ($scope.historyMessage.error || $scope.historyMessage.pending) {
        var applyPending = function () {
          if (pending != ($scope.historyMessage.pending || false)) {
            pending = !pending
            element.toggleClass(pendingClass, pending)
          }
          if (error != ($scope.historyMessage.error || false)) {
            error = !error
            element.toggleClass(errorClass, error)
          }
          if (!error && !pending) {
            deregisterPending()
          }
        }
        var deregisterPending = $scope.$on('messages_pending', applyPending)

        applyPending()
      }
    }
  })

  .directive('myMessageBody', function ($compile, AppPeersManager, AppChatsManager, AppUsersManager, AppMessagesManager, AppInlineBotsManager, RichTextProcessor) {
    var messageMediaCompiled = $compile('<div class="im_message_media" my-message-media="media" message-id="messageId"></div>')
    var messageKeyboardCompiled = $compile('<div class="im_message_keyboard" my-inline-reply-markup="markup"></div>')
    var messageSignCompiled = $compile('<div class="im_message_sign"><span class="im_message_sign_link" my-peer-link="signID"></span></div>')

    return {
      link: link,
      scope: {
        message: '=myMessageBody'
      }
    }

    function updateMessageText ($scope, element, message) {
      if ((message.media && message.media.handleMessage) ||
          typeof message.message !== 'string' ||
        !message.message.length) {
        $('.im_message_text', element).hide()
        return
      }
      var html = AppMessagesManager.wrapMessageText(message.mid)
      $('.im_message_text', element).html(html.valueOf())
    }

    function updateMessageMedia ($scope, element, message) {
      if (!message.media) {
        $('.im_message_media', element).hide()
        return
      }

      var scope = $scope.$new(true)
      scope.media = message.media
      scope.messageId = message.mid
      messageMediaCompiled(scope, function (clonedElement) {
        $('.im_message_media', element).replaceWith(clonedElement)
      })
    }

    function updateMessageSignature ($scope, element, message) {
      var postAuthor = message.post_author || (message.fwd_from && message.fwd_from.post_author)
      if (!postAuthor) {
        $('.im_message_sign', element).hide()
        return
      }

      var html = RichTextProcessor.wrapRichText(postAuthor, {noLinks: true, noLinebreaks: true})
      $('.im_message_sign', element).html('<span class="im_message_sign_link">' + html.valueOf() + '</span>')
    }

    function updateMessageKeyboard ($scope, element, message) {
      if (!message.reply_markup ||
        message.reply_markup._ != 'replyInlineMarkup') {
        $('.im_message_keyboard', element).hide()
        return
      }

      var scope = $scope.$new(true)
      scope.markup = AppMessagesManager.wrapReplyMarkup(message.reply_markup, message.fromID)
      scope.messageId = message.mid
      messageKeyboardCompiled(scope, function (clonedElement) {
        $('.im_message_keyboard', element).replaceWith(clonedElement)
      })

      scope.$on('reply_inline_button_press', function (e, button) {
        switch (button._) {
          case 'keyboardButtonSwitchInline':
            AppInlineBotsManager.switchInlineButtonClick(message.mid, button)
            break
          case 'keyboardButtonCallback':
            AppInlineBotsManager.callbackButtonClick(message.mid, button)
            break
          case 'keyboardButtonGame':
            AppInlineBotsManager.gameButtonClick(message.mid)
            break
        }
      })
    }

    function updateMessageBody ($scope, element, message) {
      updateMessageText($scope, element, message)
      updateMessageMedia($scope, element, message)
      updateMessageSignature($scope, element, message)
      updateMessageKeyboard($scope, element, message)
    }

    function link ($scope, element, attrs) {
      var message = $scope.message
      message.dir = true
      var msgID = message.mid

      updateMessageBody($scope, element, message)

      if (message.pending) {
        var unlink = $scope.$on('messages_pending', function () {
          if (message.mid != msgID) {
            updateMessageBody($scope, element, message)
            unlink()
          }
        })
      }

      $scope.$on('message_edit', function (e, data) {
        if (data.mid == message.mid) {
          if (data.justMedia) {
            updateMessageMedia($scope, element, message)
          } else {
            updateMessageBody($scope, element, message)
          }
        }
      })
    }
  })

  .directive('myMessageViews', function ($filter, AppMessagesManager) {
    var formatNumberFilter = $filter('formatShortNumber')

    return {
      link: link
    }

    function updateHtml (views, element) {
      element.html(formatNumberFilter(views))
    }

    function link ($scope, element, attrs) {
      var mid = $scope.$eval(attrs.myMessageViews)
      // console.log(element[0], mid)
      var views = AppMessagesManager.getMessage(mid).views || 0

      updateHtml(views, element)

      $scope.$on('message_views', function (e, viewData) {
        if (viewData.mid == mid) {
          updateHtml(viewData.views, element)
        }
      })
    }
  })

  .directive('myReplyMarkup', function () {
    return {
      templateUrl: templateUrl('reply_markup'),
      scope: {
        'replyMarkup': '=myReplyMarkup'
      },
      link: link
    }

    function link ($scope, element, attrs) {
      var scrollable = $('.reply_markup', element)
      var scroller = new Scroller(scrollable, {
        classPrefix: 'reply_markup',
        maxHeight: 170
      })
      $scope.buttonClick = function (button) {
        $scope.$emit('reply_button_press', button)
      }

      $scope.$on('ui_keyboard_update', function (e, data) {
        onContentLoaded(function () {
          scroller.updateHeight()
          scroller.scrollTo(0)
          $scope.$emit('ui_panel_update', {blur: data && data.enabled})
        })
      })
      onContentLoaded(function () {
        scroller.updateHeight()
        $scope.$emit('ui_panel_update')
      })
    }
  })

  .directive('myMessageMedia', function () {
    return {
      scope: {
        'media': '=myMessageMedia',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_media')
    }
  })
  .directive('myMessagePhoto', function (AppPhotosManager) {
    return {
      scope: {
        'media': '=myMessagePhoto',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_photo'),
      link: function ($scope, element, attrs) {
        $scope.openPhoto = AppPhotosManager.openPhoto
        $scope.preloadPhoto = AppPhotosManager.preloadPhoto
      }
    }
  })
  .directive('myMessageDocument', function (AppDocsManager) {
    return {
      scope: {
        'media': '=myMessageDocument',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_document'),
      link: function ($scope, element, attrs) {
        AppDocsManager.updateDocDownloaded($scope.media.document.id)
        $scope.docSave = function () {
          AppDocsManager.saveDocFile($scope.media.document.id)
        }
        $scope.docOpen = function () {
          if (!$scope.media.document.withPreview) {
            return $scope.docSave()
          }
          AppDocsManager.openDoc($scope.media.document.id, $scope.messageId)
        }
        $scope.videoOpen = function () {
          AppDocsManager.openVideo($scope.media.document.id, $scope.messageId)
        }
        if ($scope.media.document.file_name) {
          var fileNameParts = $scope.media.document.file_name.split('.')
          if (fileNameParts.length > 1) {
            $scope.media_file_ext = '.' + fileNameParts.pop()
            $scope.media_file_name_without_ext = fileNameParts.join('.')
            if (!$scope.media_file_name_without_ext) {
              $scope.media_file_name_without_ext = $scope.media_file_ext
              $scope.media_file_ext = ''
            }
          } else {
            $scope.media_file_ext = ''
            $scope.media_file_name_without_ext = fileNameParts[0]
          }
        }
      }
    }
  })
  .directive('myMessageGeo', function () {
    return {
      scope: {
        'media': '=myMessageGeo'
      },
      templateUrl: templateUrl('message_attach_geo')
    }
  })
  .directive('myMessageVenue', function () {
    return {
      scope: {
        'media': '=myMessageVenue'
      },
      templateUrl: templateUrl('message_attach_venue')
    }
  })
  .directive('myMessageContact', function () {
    return {
      scope: {
        'media': '=myMessageContact'
      },
      templateUrl: templateUrl('message_attach_contact')
    }
  })
  .directive('myMessageWebpage', function (AppWebPagesManager, AppPhotosManager) {
    return {
      scope: {
        'media': '=myMessageWebpage',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_webpage'),
      link: function ($scope) {
        $scope.openPhoto = AppPhotosManager.openPhoto
        $scope.openEmbed = function ($event) {
          if ($scope.media.webpage &&
            $scope.media.webpage.embed_url) {
            AppWebPagesManager.openEmbed($scope.media.webpage.id, $scope.messageId)
            return cancelEvent($event)
          }
        }

        $scope.$on('webpage_updated', function (e, eventData) {
          if ($scope.media.webpage &&
            $scope.media.webpage.id == eventData.id) {
            $scope.$emit('ui_height')
          }
        })
      }
    }
  })
  .directive('myMessageGame', function (AppInlineBotsManager, AppMessagesManager) {
    return {
      scope: {
        'media': '=myMessageGame',
        'messageId': '=messageId'
      },
      templateUrl: templateUrl('message_attach_game'),
      link: function ($scope, element) {
        $scope.openGame = function () {
          AppInlineBotsManager.gameButtonClick($scope.messageId)
        }

        function updateMessageText (argument) {
          var message = AppMessagesManager.getMessage($scope.messageId)
          if (message.message) {
            var html = AppMessagesManager.wrapMessageText($scope.messageId)
            $('.im_message_game_message', element).html(html.valueOf()).show()
            $('.im_message_game_description', element).hide()
          } else {
            $('.im_message_game_message', element).html('').hide()
            $('.im_message_game_description', element).show()
          }
        }

        $scope.$on('message_edit', function (e, data) {
          if (data.mid == $scope.messageId) {
            updateMessageText()
          }
        })

        updateMessageText()
      }
    }
  })
  .directive('myMessagePending', function () {
    return {
      scope: {
        'media': '=myMessagePending'
      },
      templateUrl: templateUrl('message_attach_pending'),
      link: link
    }

    function link ($scope, element, attrs) {
      if ($scope.media.file_name) {
        var fileNameParts = $scope.media.file_name.split('.')
        if (fileNameParts.length > 1) {
          $scope.media_file_ext = '.' + fileNameParts.pop()
          $scope.media_file_name_without_ext = fileNameParts.join('.')
          if (!$scope.media_file_name_without_ext) {
            $scope.media_file_name_without_ext = $scope.media_file_ext
            $scope.media_file_ext = ''
          }
        } else {
          $scope.media_file_ext = ''
          $scope.media_file_name_without_ext = fileNameParts[0]
        }
      }
    }
  })

  .directive('myInlineReplyMarkup', function () {
    return {
      templateUrl: templateUrl('reply_markup'),
      scope: {
        'replyMarkup': '=myInlineReplyMarkup'
      },
      link: link
    }

    function link ($scope, element, attrs) {
      $scope.buttonClick = function (button) {
        $scope.$emit('reply_inline_button_press', button)
      }
    }
  })

  .directive('myServiceMessage', function (ErrorService, AppMessagesManager) {
    return {
      templateUrl: templateUrl('message_service'),
      scope: {
        'historyMessage': '=myServiceMessage'
      },
      link: link
    }

    function link ($scope, element, attrs) {
      $scope.phoneCallClick = function (messageID) {
        var message = AppMessagesManager.getMessage(messageID)
        var userID = AppMessagesManager.getMessagePeer(message)
        ErrorService.show({
          error: {
            type: 'PHONECALLS_NOT_SUPPORTED',
            userID: userID
          }
        })
      }
    }
  })

  .directive('myShortMessage', function () {
    return {
      scope: {
        message: '=myShortMessage'
      },
      templateUrl: templateUrl('short_message')
    }
  })

  .directive('myReplyMessage', function (AppMessagesManager, AppPeersManager, $rootScope) {
    return {
      templateUrl: templateUrl('reply_message'),
      scope: {},
      link: link
    }

    function link ($scope, element, attrs) {
      if (attrs.watch) {
        $scope.$parent.$watch(attrs.myReplyMessage, function (mid) {
          var isEdit = $scope.$parent.$eval(attrs.edit)
          checkMessage($scope, element, mid, isEdit)
        })
      } else {
        var mid = $scope.$parent.$eval(attrs.myReplyMessage)
        var isEdit = $scope.$parent.$eval(attrs.edit)
        checkMessage($scope, element, mid, isEdit)
      }
    }

    function checkMessage ($scope, element, mid, isEdit) {
      var message = $scope.replyMessage = AppMessagesManager.wrapSingleMessage(mid)
      $scope.thumb = false
      $scope.isEdit = isEdit || false
      if (message.loading) {
        var stopWaiting = $scope.$on('messages_downloaded', function (e, mids) {
          if (mids.indexOf(mid) != -1) {
            $scope.replyMessage = AppMessagesManager.wrapForDialog(mid)
            updateMessage($scope, element)
            stopWaiting()
          }
        })
      } else {
        updateMessage($scope, element)
      }
    }

    function updateMessage ($scope, element) {
      var message = $scope.replyMessage
      if (!message || message.deleted || !message.to_id) {
        $(element).remove()
        return
      }
      $scope.thumb = AppMessagesManager.getMessageThumb(message, 42, 42)

      if (element[0].tagName == 'A') {
        element.on('click', function () {
          var peerID = AppMessagesManager.getMessagePeer(message)
          var peerString = AppPeersManager.getPeerString(peerID)

          $rootScope.$broadcast('history_focus', {peerString: peerString, messageID: message.mid})
        })
      }

      onContentLoaded(function () {
        $scope.$emit('ui_height')
      })
    }
  })

  .directive('myPinnedMessage', function (AppMessagesManager, AppPeersManager, $rootScope) {
    return {
      templateUrl: templateUrl('pinned_message'),
      scope: {},
      link: link
    }

    function link ($scope, element, attrs) {
      var mid = $scope.$parent.$eval(attrs.myPinnedMessage)
      var message = $scope.pinnedMessage = AppMessagesManager.wrapSingleMessage(mid)
      if (message.loading) {
        var stopWaiting = $scope.$on('messages_downloaded', function (e, mids) {
          if (mids.indexOf(mid) != -1) {
            $scope.pinnedMessage = AppMessagesManager.wrapForDialog(mid)
            updateMessage($scope, element)
            stopWaiting()
          }
        })
      } else {
        updateMessage($scope, element)
      }
    }

    function updateMessage ($scope, element) {
      var message = $scope.pinnedMessage
      if (!message || message.deleted || !message.to_id) {
        $(element).remove()
        return
      }

      if (element[0].tagName == 'A') {
        element.on('click', function () {
          var peerID = AppMessagesManager.getMessagePeer(message)
          var peerString = AppPeersManager.getPeerString(peerID)

          $rootScope.$broadcast('history_focus', {peerString: peerString, messageID: message.mid})
        })
      }

      onContentLoaded(function () {
        $scope.$emit('ui_height')
      })
    }
  })

  .directive('myPeerPinnedMessageBar', function (AppMessagesManager, AppPeersManager, AppProfileManager) {

    return {
      templateUrl: templateUrl('peer_pinned_message_bar'),
      scope: {},
      link: link
    }

    function updatePeerID(peerID, $scope, force) {
      if (force) {
        $scope.pinnedMessageID = 0
        $scope.$emit('ui_height')
      }
      var jump = ++$scope.jump
      if (!AppPeersManager.isChannel(peerID)) {
        return
      }
      var channelID = -peerID
      AppProfileManager.getChannelPinnedMessage(channelID).then(function (pinnedMessageID) {
        if (jump != $scope.jump) {
          return
        }
        $scope.pinnedMessageID = pinnedMessageID || 0
        $scope.$emit('ui_height')
      })
    }

    function link ($scope, element, attrs) {
      $scope.jump = 0

      $scope.$parent.$watch(attrs.myPeerPinnedMessageBar, function (peerID) {
        $scope.peerID = peerID
        updatePeerID(peerID, $scope, true)
      })

      $scope.$on('peer_pinned_message', function (e, updPeerID) {
        if (updPeerID == $scope.peerID) {
          updatePeerID($scope.peerID, $scope)
        }
      })
      $scope.$on('chat_full_update', function (e, updChatID) {
        if (updChatID == -$scope.peerID) {
          updatePeerID($scope.peerID, $scope)
        }
      })

      $scope.hidePinned = function () {
        AppProfileManager.hideChannelPinnedMessage(-$scope.peerID, $scope.pinnedMessageID)
        $scope.pinnedMessageID = 0
        $scope.$emit('ui_height')
      }
    }
  })

  .directive('myForwardedMessages', function (AppPhotosManager, AppMessagesManager, AppPeersManager, $rootScope) {
    return {
      templateUrl: templateUrl('forwarded_messages'),
      scope: {
        'forwardMessages': '=myForwardedMessages'
      },
      link: link
    }

    function link ($scope, element, attrs) {
      if (attrs.watch) {
        $scope.$watch('forwardMessages', function () {
          updateMessages($scope, element)
        })
      } else {
        updateMessages($scope, element)
      }
    }

    function updateMessages ($scope, element) {
      var mids = $scope.forwardMessages
      var length = mids.length
      var fromID = false
      var single = length == 1
      $scope.thumb = false
      $scope.singleMessage = false
      angular.forEach(mids, function (mid) {
        var message = AppMessagesManager.getMessage(mid)
        if (fromID === false) {
          fromID = message.fromID
        } else {
          if (fromID !== message.fromID) {
            fromID = AppMessagesManager.getMessagePeer(message)
          }
        }
        if (single) {
          $scope.thumb = AppMessagesManager.getMessageThumb(message, 42, 42)
          $scope.singleMessage = AppMessagesManager.wrapForDialog(mid)
        }
      })
      $scope.fromID = fromID
      $scope.count = length

      onContentLoaded(function () {
        $scope.$emit('ui_height')
      })
    }
  })

  .directive('myMessageEdited', function (_, $timeout, AppMessagesManager) {
    var editedLabel = _('message_edited')

    return {
      scope: {},
      link: link
    }

    function link ($scope, element, attrs) {
      var messageID = $scope.$parent.$eval(attrs.myMessageEdited)
      if (checkEdited($scope, element, messageID)) {
        $scope.$on('message_edit', function (e, data) {
          var messageID = $scope.$parent.$eval(attrs.myMessageEdited)
          if (data.mid == messageID) {
            checkEdited($scope, element, messageID)
          }
        })
      }
    }

    function checkEdited ($scope, element, messageID) {
      var message = AppMessagesManager.getMessage(messageID)
      if (!message.canBeEdited) {
        $timeout(function () {
          $scope.$destroy()
          element.remove()
        })
        return false
      }
      if (message.edit_date) {
        element.html(editedLabel).show()
        $timeout(function () {
          $scope.$destroy()
        })
        return false
      }
      return true
    }
  })

  .directive('myMessageAdminBadge', function (_, AppPeersManager, AppMessagesManager, AppProfileManager) {

    var adminBadgeText = _('message_admin_badge_raw')

    return {
      scope: {},
      link: link
    }

    function link($scope, element, attrs) {
      var message = $scope.$parent.$eval(attrs.myMessageAdminBadge)
      var fromID = message && message.fromID
      var peerID = message && AppMessagesManager.getMessagePeer(message)
      if (!fromID || !AppPeersManager.isMegagroup(peerID)) {
        element.hide()
        return
      }

      var channelID = -peerID

      AppProfileManager.getChannelParticipants(channelID, {_: 'channelParticipantsAdmins'}).then(function (participants) {
        var isAdmin = false
        for (var i = 0, len = participants.length; i < len; i++) {
          if (participants[i].user_id == fromID) {
            isAdmin = true
            break
          }
        }
        if (isAdmin) {
          element.text(adminBadgeText).show()
        } else {
          element.hide()
        }
      }, function () {
        element.hide()
      })
    }
  })

  .directive('myDialogs', function ($modalStack, $transition, $window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var dialogsWrap = $('.im_dialogs_wrap', element)[0]
      var scrollableWrap = $('.im_dialogs_scrollable_wrap', element)[0]
      var searchField = $('.im_dialogs_search_field', element)[0]
      var panelWrap = $('.im_dialogs_panel', element)[0]
      var searchClear = $('.im_dialogs_search_clear', element)[0]
      var searchFocused = false

      $(searchField).on('focus blur', function (e) {
        searchFocused = e.type == 'focus'

        if (!searchFocused) {
          $(scrollableWrap).find('.im_dialog_selected').removeClass('im_dialog_selected')
          if (!searchField.value) {
            $scope.$emit('ui_dialogs_search_clear')
          }
        }
      })

      $scope.$on('dialogs_search_toggle', function () {
        $(panelWrap).addClass('im_dialogs_panel_search')
        $scope.$broadcast('ui_dialogs_search')
        $($window).scrollTop(0)
        $timeout(function () {
          setFieldSelection(searchField)
        })
      })

      $scope.$on('search_clear', function () {
        $(panelWrap).removeClass('im_dialogs_panel_search')
        $scope.$broadcast('ui_dialogs_search')
      })

      $(document).on('keydown', onKeyDown)

      $scope.$on('$destroy', function () {
        $(document).off('keydown', onKeyDown)
      })

      $scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          var selectedDialog = $(scrollableWrap).find('.active a.im_dialog')[0]
          if (selectedDialog) {
            scrollToNode(scrollableWrap, selectedDialog.parentNode, dialogsWrap)
          }
        })
      })

      function onKeyDown (e) {
        if (!searchFocused && $modalStack.getTop()) {
          return true
        }

        var currentSelected, nextDialogWrap, dialogWraps
        if (e.keyCode == 36 && !e.shiftKey && !e.ctrlKey && e.altKey) { // Alt + Home
          currentSelected = $(scrollableWrap).find('.im_dialog_wrap a')
          if (currentSelected.length) {
            $(currentSelected[0]).trigger('mousedown')
            scrollableWrap.scrollTop = 0
            $(dialogsWrap).nanoScroller({flash: true})
          }
          return cancelEvent(e)
        }

        if (e.keyCode == 27 || (e.keyCode == 9 && e.shiftKey && !e.ctrlKey && !e.metaKey)) { // ESC or Shift + Tab
          if (!searchFocused) {
            setFieldSelection(searchField)
            if (searchField.value) {
              searchField.select()
            }
          } else if (searchField.value) {
            $(searchClear).trigger('click')
          } else {
            $scope.$emit('esc_no_more')
            // Strange Chrome bug, when field doesn't get blur, but becomes inactive after location change
            setTimeout(function () {
              searchField.blur()
              setTimeout(function () {
                searchField.focus()
              }, 0)
            }, 100)
          }
          return cancelEvent(e)
        }

        if (searchFocused && e.keyCode == 13 && !Config.Navigator.mobile) { // Enter
          currentSelected = $(scrollableWrap).find('.im_dialog_selected')[0] || $(scrollableWrap).find('.im_dialog_wrap a')[0]
          if (currentSelected &&
              !$(currentSelected).hasClass('disabled')) {
            $(currentSelected).trigger('mousedown')
          }
          return cancelEvent(e)
        }

        if (
          (!Config.Navigator.osX && // No Mac users
              e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey &&
              e.keyCode >= 49 && e.keyCode <= 57) || // Alt + Shift + # , switch to conversation # where # is in [1..9]
          (Config.Navigator.osX && // Mac users only
          e.ctrlKey && e.shiftKey && !e.metaKey && !e.altKey &&
          e.keyCode >= 49 && e.keyCode <= 57)) { // Ctrl + Shift + # , switch to conversation # where # is in [1..9]
          var dialogNumber = e.keyCode - 49
          dialogWraps = $(scrollableWrap).find('.im_dialog_wrap')
          nextDialogWrap = dialogWraps[dialogNumber]

          if (nextDialogWrap) {
            $(nextDialogWrap).find('a').trigger('mousedown')
            scrollToNode(scrollableWrap, nextDialogWrap, dialogsWrap)
          }

          return cancelEvent(e)
        }

        var next
        var prev, skip
        var ctrlTabSupported = Config.Modes.packed
        if (e.keyCode == 40 || e.keyCode == 38) { // UP, DOWN
          next = e.keyCode == 40
          prev = !next
          skip = !e.shiftKey && e.altKey
        } else if (ctrlTabSupported && e.keyCode == 9 && e.ctrlKey && !e.metaKey) { // Ctrl + Tab, Shift + Ctrl + Tab
          next = !e.shiftKey
          prev = !next
          skip = true
        }

        if (next || prev) {
          if (!skip && (!searchFocused || e.metaKey)) {
            return true
          }

          currentSelected = (!skip && $(scrollableWrap).find('.im_dialog_selected')[0]) || $(scrollableWrap).find('.active a.im_dialog')[0]
          var currentSelectedWrap = currentSelected && currentSelected.parentNode

          if (currentSelectedWrap) {
            nextDialogWrap = currentSelected[next ? 'nextSibling' : 'previousSibling']

            if (!nextDialogWrap || !nextDialogWrap.className || nextDialogWrap.className.indexOf('im_dialog_wrap') == -1) {
              dialogWraps = $(scrollableWrap).find('.im_dialog_wrap')
              var pos = dialogWraps.index(currentSelected.parentNode)
              var nextPos = pos + (next ? 1 : -1)

              nextDialogWrap = dialogWraps[nextPos]
            }
          } else {
            dialogWraps = $(scrollableWrap).find('.im_dialog_wrap')
            if (next) {
              nextDialogWrap = dialogWraps[0]
            } else {
              nextDialogWrap = dialogWraps[dialogWraps.length - 1]
            }
          }

          if (skip) {
            if (nextDialogWrap) {
              $(nextDialogWrap).find('a').trigger('mousedown')
            }
          } else {
            if (currentSelectedWrap && nextDialogWrap) {
              $(currentSelectedWrap).find('a').removeClass('im_dialog_selected')
            }
            if (nextDialogWrap) {
              $(nextDialogWrap).find('a').addClass('im_dialog_selected')
            }
          }

          if (nextDialogWrap) {
            scrollToNode(scrollableWrap, nextDialogWrap, dialogsWrap)
          }

          return cancelEvent(e)
        }
      }
    }
  })

  .directive('myDialogsList', function ($window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var dialogsWrap = $('.im_dialogs_wrap', element)[0]
      var dialogsColWrap = $('.im_dialogs_col_wrap')[0]
      var scrollableWrap = $('.im_dialogs_scrollable_wrap', element)[0]
      var headWrap = $('.tg_page_head')[0]
      var panelWrapSelector = Config.Mobile && attrs.modal
        ? '.mobile_modal_body .im_dialogs_panel'
        : '.im_dialogs_panel'
      var panelWrap = $(panelWrapSelector)[0]
      var footer = $('.footer_wrap')[0]
      var moreNotified = false

      onContentLoaded(function () {
        $(dialogsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true})
      })

      var updateScroller = function () {
        onContentLoaded(function () {
          $(dialogsWrap).nanoScroller()
        })
      }

      $scope.$on('ui_dialogs_prepend', updateScroller)
      $scope.$on('ui_dialogs_search', updateSizes)
      $scope.$on('ui_dialogs_update', updateSizes)

      $scope.$on('ui_dialogs_append', function () {
        onContentLoaded(function () {
          updateScroller()
          moreNotified = false

          $timeout(function () {
            $(scrollableWrap).trigger('scroll')
          })
        })
      })

      $scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          updateScroller()
          moreNotified = false

          $timeout(function () {
            $(scrollableWrap).trigger('scroll')
          })
        })
      })

      $(scrollableWrap).on('scroll', function (e) {
        if (!element.is(':visible')) return
        // console.log('scroll', moreNotified)
        if (!moreNotified && scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          // console.log('emit need more')
          $scope.$emit('dialogs_need_more')
          moreNotified = true
        }
      })

      function updateSizes () {
        if (!panelWrap || !panelWrap.offsetHeight) {
          panelWrap = $(panelWrapSelector)[0]
        }

        if (attrs.modal) {
          var height = $($window).height() -
          (panelWrap ? panelWrap.offsetHeight : 49) -
          (Config.Mobile ? 46 : 100)
          height = Math.min(Config.Mobile ? 350 : 450, height)
          $(element).css({height: height})
          updateScroller()
          return
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0]
        }
        if (!footer || !footer.offsetHeight) {
          footer = $('.footer_wrap')[0]
        }

        if (!dialogsColWrap || !dialogsColWrap.offsetHeight) {
          dialogsColWrap = $('.im_dialogs_col_wrap')[0]
        }
        var footerHeight = footer ? footer.offsetHeight : 0
        if (footerHeight) {
          footerHeight++ // Border bottom
        }
        $(element).css({
          height: $($window).height() -
            footerHeight -
            (headWrap ? headWrap.offsetHeight : 48) -
            (panelWrap ? panelWrap.offsetHeight : 58) -
            parseInt($(dialogsColWrap).css('paddingBottom') || 0)
        })

        updateScroller()
      }

      $($window).on('resize', updateSizes)

      updateSizes()
      setTimeout(updateSizes, 1000)
    }
  })

  .directive('myContactsList', function ($window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var searchWrap = $('.contacts_modal_search')[0]
      var panelWrap = $('.contacts_modal_panel')[0]
      var contactsWrap = $('.contacts_wrap', element)[0]

      onContentLoaded(function () {
        $(contactsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true})
        updateSizes()
      })

      function updateSizes () {
        $(element).css({
          height: $($window).height() -
            ((panelWrap && panelWrap.offsetHeight) || 0) -
            ((searchWrap && searchWrap.offsetHeight) || 0) -
            (Config.Mobile ? 64 : 200)
        })
        $(contactsWrap).nanoScroller()
      }

      $($window).on('resize', updateSizes)
      $scope.$on('contacts_change', function () {
        onContentLoaded(updateSizes)
      })
    }
  })

  .directive('myCountriesList', function ($window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var searchWrap = $('.countries_modal_search')[0]
      var panelWrap = $('.countries_modal_panel')[0]
      var countriesWrap = $('.countries_wrap', element)[0]

      onContentLoaded(function () {
        $(countriesWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true})
        updateSizes()
      })

      function updateSizes () {
        $(element).css({
          height: $($window).height() -
            ((panelWrap && panelWrap.offsetHeight) || 0) -
            ((searchWrap && searchWrap.offsetHeight) || 0) -
            (Config.Mobile ? 46 + 18 : 200)
        })
        $(countriesWrap).nanoScroller()
      }

      $($window).on('resize', updateSizes)
      $scope.$on('contacts_change', function () {
        onContentLoaded(updateSizes)
      })
    }
  })

  .directive('mySessionsList', function ($window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var sessionsWrap = $('.sessions_wrap', element)[0]

      onContentLoaded(function () {
        $(sessionsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true})
        updateSizes()
      })

      function updateSizes () {
        $(element).css({
          height: Math.min(760, $($window).height() -
            (Config.Mobile ? 46 + 18 : 200))
        })
        $(sessionsWrap).nanoScroller()
      }

      $($window).on('resize', updateSizes)
    }
  })

  .directive('myStickersList', function ($window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var stickersWrap = $('.stickerset_wrap', element)[0]

      onContentLoaded(function () {
        $(stickersWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true})
        updateSizes()
      })

      function updateSizes () {
        $(element).css({
          height: Math.min(600, $($window).height() -
            (Config.Mobile ? 46 + 18 : 200))
        })
        $(stickersWrap).nanoScroller()
      }

      $($window).on('resize', updateSizes)
    }
  })

  .directive('myHistory', function ($window, $timeout, $rootScope, $transition) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var historyWrap = $('.im_history_wrap', element)[0]
      var historyMessagesEl = $('.im_history_messages', element)[0]
      var historyEl = $('.im_history', element)[0]
      var scrollableWrap = $('.im_history_scrollable_wrap', element)[0]
      var scrollable = $('.im_history_scrollable', element)[0]
      var emptyWrapEl = $('.im_history_empty_wrap', element)[0]
      var pinnedPanelEl = $('.im_history_pinned_panel', element)[0]
      var bottomPanelWrap = $('.im_bottom_panel_wrap', element)[0]
      var sendFormWrap = $('.im_send_form_wrap', element)[0]
      var headWrap = $('.tg_page_head')[0]
      var footer = $('.footer_wrap')[0]
      var sendForm = $('.im_send_form', element)[0]
      var moreNotified = false
      var lessNotified = false

      onContentLoaded(function () {
        scrollableWrap.scrollTop = scrollableWrap.scrollHeight
      })
      $(historyWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true})

      var updateScroller = function (delay) {
        // console.trace('scroller update', delay)
        $timeout(function () {
          if (!$(scrollableWrap).hasClass('im_history_to_bottom')) {
            $(historyWrap).nanoScroller()
          }
        }, delay || 0)
      }

      var transform = false
      var trs = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'OTransform']
      var i
      for (i = 0; i < trs.length; i++) {
        if (trs[i] in historyMessagesEl.style) {
          transform = trs[i]
          break
        }
      }

      var animated = transform && false ? true : false // ?
      var curAnimation = false

      $scope.$on('ui_history_append_new', function (e, options) {
        if (!atBottom && !options.my) {
          onContentLoaded(function () {
            $(historyWrap).nanoScroller()
          })
          return
        }
        if (options.idleScroll) {
          onContentLoaded(function () {
            $(historyWrap).nanoScroller()
            changeScroll(true)
          })
          return
        }
        var curAnimated = animated &&
            !$rootScope.idle.isIDLE &&
            historyMessagesEl.clientHeight > 0
        var wasH

        if (curAnimated) {
          wasH = scrollableWrap.scrollHeight
        } else {
          var pr = parseInt($(scrollableWrap).css('paddingRight'))
          $(scrollable).css({bottom: 0, paddingRight: pr})
          $(scrollableWrap).addClass('im_history_to_bottom')
        }

        onContentLoaded(function () {
          if (curAnimated) {
            curAnimation = true
            $(historyMessagesEl).removeClass('im_history_appending')
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight
            $(historyMessagesEl).css(transform, 'translate(0px, ' + (scrollableWrap.scrollHeight - wasH) + 'px)')
            $(historyWrap).nanoScroller()
            var styles = {}
            styles[transform] = 'translate(0px, 0px)'
            $(historyMessagesEl).addClass('im_history_appending')
            $transition($(historyMessagesEl), styles).then(function () {
              curAnimation = false
              $(historyMessagesEl).removeClass('im_history_appending')
              updateBottomizer()
            })
          } else {
            $(scrollableWrap).removeClass('im_history_to_bottom')
            $(scrollable).css({bottom: '', paddingRight: 0})
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight
            updateBottomizer()
          }
        })
      })

      function changeScroll (noFocus, animated) {
        var unreadSplit
        var focusMessage

        var newScrollTop = false
        var afterScrollAdd
        // console.trace(dT(), 'change scroll', animated)
        if (!noFocus &&
          (focusMessage = $('.im_message_focus:visible', scrollableWrap)[0])) {
          // console.log(dT(), 'change scroll to focus', focusMessage)
          var ch = scrollableWrap.clientHeight
          var st = scrollableWrap.scrollTop
          var ot = focusMessage.offsetTop
          var h = focusMessage.clientHeight
          if (!st || st + ch < ot || st > ot + h || animated) {
            newScrollTop = Math.max(0, ot - Math.floor(ch / 2) + 26)
          }
          atBottom = false

          afterScrollAdd = function () {
            var unfocusMessagePromise = $(focusMessage).data('unfocus_promise')
            if (unfocusMessagePromise) {
              $timeout.cancel(unfocusMessagePromise)
              $(focusMessage).removeClass('im_message_focus_active')
            }
            $timeout(function () {
              $(focusMessage).addClass('im_message_focus_active')
              unfocusMessagePromise = $timeout(function () {
                $(focusMessage).removeClass('im_message_focus_active')
                $(focusMessage).data('unfocus_promise', false)
              }, 2800)
              $(focusMessage).data('unfocus_promise', unfocusMessagePromise)
            })
          }
        } else if (unreadSplit = $('.im_message_unread_split:visible', scrollableWrap)[0]) {
          // console.log(dT(), 'change scroll unread', unreadSplit.offsetTop)
          newScrollTop = Math.max(0, unreadSplit.offsetTop - 52)
          atBottom = false
        } else {
          // console.log(dT(), 'change scroll bottom')
          newScrollTop = scrollableWrap.scrollHeight
          atBottom = true
        }
        if (newScrollTop !== false) {
          var afterScroll = function () {
            updateScroller()
            $timeout(function () {
              $(scrollableWrap).trigger('scroll')
              scrollTopInitial = scrollableWrap.scrollTop
            })
            if (afterScrollAdd) {
              afterScrollAdd()
            }
          }
          if (animated) {
            $(scrollableWrap).animate({scrollTop: newScrollTop}, 200, afterScroll)
          } else {
            scrollableWrap.scrollTop = newScrollTop
            afterScroll()
          }
        }
      }

      $scope.$on('history_direction_key', function (e, data) {
        var newScrollTop = false
        console.warn('scroll top', data.keyCode)
        switch (data.keyCode) {
          case 33: // page up
            newScrollTop = scrollableWrap.scrollTop - scrollableWrap.clientHeight
            break
          case 34: // page down
            newScrollTop = scrollableWrap.scrollTop + scrollableWrap.clientHeight
            break
          case 36: // home
            newScrollTop = 0
            break
          case 35: // end
            newScrollTop = scrollableWrap.scrollHeight
            break
        }
        if (newScrollTop !== false) {
          $(scrollableWrap).stop().animate({scrollTop: newScrollTop}, 200)
        }
      })

      $scope.$on('ui_history_change', function () {
        var pr = parseInt($(scrollableWrap).css('paddingRight'))
        $(scrollableWrap).addClass('im_history_to_bottom')
        scrollableWrap.scrollHeight // Some strange Chrome bug workaround
        $(scrollable).css({bottom: 0, paddingRight: pr})
        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom')
          $(scrollable).css({bottom: '', paddingRight: ''})
          updateSizes(true)
          moreNotified = false
          lessNotified = false
          changeScroll()
        })
      })

      $scope.$on('ui_history_change_scroll', function (e, animated) {
        onContentLoaded(function () {
          changeScroll(false, animated)
        })
      })

      $scope.$on('ui_history_focus', function () {
        if (!atBottom) {
          // console.log(dT(), 'scroll history focus')
          scrollableWrap.scrollTop = scrollableWrap.scrollHeight
          updateScroller()
          atBottom = true
        }
      })

      $scope.$on('ui_history_prepend', function () {
        var sh = scrollableWrap.scrollHeight
        var st = scrollableWrap.scrollTop
        var pr = parseInt($(scrollableWrap).css('paddingRight'))
        var ch = scrollableWrap.clientHeight

        $(scrollableWrap).addClass('im_history_to_bottom')
        scrollableWrap.scrollHeight // Some strange Chrome bug workaround
        $(scrollable).css({bottom: -(sh - st - ch), paddingRight: pr})

        var upd = function () {
          $(scrollableWrap).removeClass('im_history_to_bottom')
          $(scrollable).css({bottom: '', paddingRight: ''})
          if (scrollTopInitial >= 0) {
            changeScroll()
          } else {
            // console.log('change scroll prepend')
            scrollableWrap.scrollTop = st + scrollableWrap.scrollHeight - sh
          }

          updateBottomizer()
          moreNotified = false

          $timeout(function () {
            if (scrollableWrap.scrollHeight != sh) {
              $(scrollableWrap).trigger('scroll')
            }
          })

          clearTimeout(timer)
          unreg()
        }
        var timer = setTimeout(upd, 0)
        var unreg = $scope.$on('$viewContentLoaded', upd)
      })

      $scope.$on('ui_history_append', function () {
        var sh = scrollableWrap.scrollHeight
        onContentLoaded(function () {
          atBottom = false
          updateBottomizer()
          lessNotified = false

          if (scrollTopInitial >= 0) {
            changeScroll()
          }

          $timeout(function () {
            if (scrollableWrap.scrollHeight != sh) {
              $(scrollableWrap).trigger('scroll')
            }
          })
        })
      })

      $scope.$on('ui_panel_update', function (e, data) {
        updateSizes()
        onContentLoaded(function () {
          updateSizes()
          if (data && data.blur) {
            $scope.$broadcast('ui_message_blur')
          } else if (!getSelectedText()) {
            $scope.$broadcast('ui_message_send')
          }

          $timeout(function () {
            $(scrollableWrap).trigger('scroll')
          })
        })
      })

      $scope.$on('ui_selection_clear', function () {
        if (window.getSelection) {
          if (window.getSelection().empty) { // Chrome
            window.getSelection().empty()
          } else if (window.getSelection().removeAllRanges) { // Firefox
            window.getSelection().removeAllRanges()
          }
        } else if (document.selection) { // IE?
          document.selection.empty()
        }
      })

      $scope.$on('ui_editor_resize', updateSizes)
      $scope.$on('ui_height', function () {
        onContentLoaded(updateSizes)
      // updateSizes()
      })

      var atBottom = true
      var scrollTopInitial = -1
      $(scrollableWrap).on('scroll', function (e) {
        if (!element.is(':visible') ||
          $(scrollableWrap).hasClass('im_history_to_bottom') ||
          curAnimation) {
          return
        }
        var st = scrollableWrap.scrollTop
        atBottom = st >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight
        if (scrollTopInitial >= 0 && scrollTopInitial != st) {
          scrollTopInitial = -1
        }

        if (!moreNotified && st <= 300) {
          moreNotified = true
          $scope.$emit('history_need_more')
        } else if (!lessNotified && st >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          lessNotified = true
          $scope.$emit('history_need_less')
        }
      })

      function updateSizes (heightOnly) {
        if (!element.is(':visible') && !$(element[0].parentNode.parentNode).is(':visible')) {
          return
        }
        if ($(sendFormWrap).is(':visible')) {
          if (!sendForm || !sendForm.offsetHeight) {
            sendForm = $('.im_send_form', element)[0]
          }
          $(sendFormWrap).css({
            height: $(sendForm).height()
          })
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0]
        }
        if (!footer || !footer.offsetHeight) {
          footer = $('.footer_wrap')[0]
        }
        if (!pinnedPanelEl || !pinnedPanelEl.offsetHeight) {
          pinnedPanelEl = $('.im_history_pinned_panel', element)[0]
        }

        var footerHeight = footer ? footer.offsetHeight : 0
        if (footerHeight) {
          footerHeight++ // Border bottom
        }
        var pinnedHeight = pinnedPanelEl && pinnedPanelEl.offsetHeight || 0
        var historyH = $($window).height() - bottomPanelWrap.offsetHeight - (headWrap ? headWrap.offsetHeight : 48) - footerHeight - pinnedHeight

        $(historyWrap).css({
          height: historyH
        })

        updateBottomizer()

        if (heightOnly === true) return
        if (atBottom) {
          onContentLoaded(function () {
            // console.log('change scroll bottom')
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight
            updateScroller()
          })
        }
        updateScroller(100)
      }

      function updateBottomizer () {
        $(historyMessagesEl).css({marginTop: 0})
        var marginTop = scrollableWrap.offsetHeight -
        historyMessagesEl.offsetHeight -
        emptyWrapEl.offsetHeight -
        (Config.Mobile ? 0 : 39)

        if (historyMessagesEl.offsetHeight > 0 && marginTop > 0) {
          $(historyMessagesEl).css({marginTop: marginTop})
        }
        $(historyWrap).nanoScroller()
      }

      $($window).on('resize', updateSizes)

      updateSizes()
      onContentLoaded(updateSizes)
    }
  })

  .directive('mySendForm', function (_, $q, $timeout, $interval, $window, $compile, $modalStack, $http, $interpolate, Storage, AppStickersManager, AppDocsManager, ErrorService, AppInlineBotsManager, FileManager, shouldFocusOnInteraction) {

    return {
      link: link,
      templateUrl: templateUrl('send_form'),
      scope: {
        draftMessage: '=',
        replyKeyboard: '=',
        mentions: '=',
        commands: '='
      }
    }

    function link ($scope, element, attrs) {
      var messageFieldWrap = $('.im_send_field_wrap', element)[0]
      var messageField = $('textarea', element)[0]
      var emojiButton = $('.composer_emoji_insert_btn', element)[0]
      var emojiPanel = $('.composer_emoji_panel', element)[0]
      var fileSelects = $('input', element)
      var dropbox = $('.im_send_dropbox_wrap', element)[0]
      var dragStarted
      var dragTimeout
      var submitBtn = $('.im_submit', element)[0]
      var voiceRecorderWrap = $('.im_voice_recorder_wrap', element)[0]
      var voiceRecordBtn = $('.im_record', element)[0]

      var stickerImageCompiled = $compile('<a class="composer_sticker_btn" data-sticker="{{::document.id}}" my-load-sticker document="document" thumb="true" img-class="composer_sticker_image"></a>')
      var cachedStickerImages = {}

      var voiceRecorder = null
      var voiceRecordSupported = Recorder.isRecordingSupported()
      var voiceRecordDurationInterval = null
      if (voiceRecordSupported) {
        element.addClass('im_record_supported')
      }

      $scope.voiceRecorder = {duration: 0, recording: false, processing: false}

      var emojiTooltip = new EmojiTooltip(emojiButton, {
        getStickers: function (callback) {
          AppStickersManager.getStickers().then(callback)
        },
        getStickerImage: function (element, docID) {
          var category = element.attr('data-category')
          var cached = cachedStickerImages[docID]
          if (cached && !isInDOM(cached[0])) {
            cached.attr('data-category', category)
            element.replaceWith(cached)
            return
          }
          var scope = $scope.$new(true)
          scope.document = AppDocsManager.getDoc(docID)
          stickerImageCompiled(scope, function (clonedElement) {
            cachedStickerImages[docID] = clonedElement
            clonedElement.attr('data-category', category)
            element.replaceWith(clonedElement)
          })
        },
        onStickersetSelected: function (stickerset) {
          AppStickersManager.openStickersetLink(stickerset)
        },
        onEmojiSelected: function (code) {
          $scope.$apply(function () {
            composer.onEmojiSelected(code)
          })
        },
        onStickerSelected: function (docID) {
          $scope.$apply(function () {
            $scope.draftMessage.sticker = docID
          })
        },
        langpack: {
          im_emoji_tab: _('im_emoji_tab'),
          im_stickers_tab: _('im_stickers_tab')
        }
      })

      $scope.$on('stickers_changed', function () {
        emojiTooltip.onStickersChanged()
      })

      var composerEmojiPanel
      if (emojiPanel) {
        composerEmojiPanel = new EmojiPanel(emojiPanel, {
          onEmojiSelected: function (code) {
            composer.onEmojiSelected(code)
          }
        })
      }

      var composer = new MessageComposer(messageField, {
        onTyping: function () {
          $scope.$emit('ui_typing')
        },
        getSendOnEnter: function () {
          return sendOnEnter
        },
        dropdownDirective: function (element, callback) {
          var scope = $scope.$new(true)
          var clonedElement = $compile('<div><div my-composer-dropdown></div></div>')(scope, function (clonedElement, scope) {
            element.replaceWith(clonedElement)
            callback(scope, clonedElement)
          })
        },
        mentions: $scope.mentions,
        commands: $scope.commands,
        onMessageSubmit: onMessageSubmit,
        onDirectionKey: onDirectionKey,
        onInlineResultSend: onInlineResultSend,
        onFilePaste: onFilePaste,
        onCommandSend: function (command) {
          $scope.$apply(function () {
            $scope.draftMessage.command = command
          })
        }
      })

      var richTextarea = composer.richTextareaEl && composer.richTextareaEl[0]
      if (richTextarea) {
        $(richTextarea).on('keydown keyup', updateHeight)
      }

      $scope.$on('inline_results', function (e, inlineResults) {
        var w = Config.Mobile ? $(window).width() : (messageFieldWrap.offsetWidth || 382) - 2
        var h = 80
        if (inlineResults) {
          AppInlineBotsManager.regroupWrappedResults(inlineResults.results, w, h)
        }
        setZeroTimeout(function () {
          composer.setInlineSuggestions(inlineResults)
        })
      })

      $scope.$on('inline_placeholder', function (e, data) {
        composer.setInlinePlaceholder(data.prefix, data.placeholder)
      })

      fileSelects.on('change', function () {
        var self = this
        $scope.$apply(function () {
          $scope.draftMessage.files = Array.prototype.slice.call(self.files)
          $scope.draftMessage.isMedia = $(self).hasClass('im_media_attach_input') || Config.Mobile
          setTimeout(function () {
            try {
              self.value = ''
            } catch (e) {}
          }, 1000)
        })
      })

      $(voiceRecordBtn).on('contextmenu', cancelEvent)

      var voiceRecordTouch = Config.Navigator.touch ? true : false
      var voiceRecordEvents = {
        start: voiceRecordTouch ? 'touchstart' : 'mousedown',
        move: voiceRecordTouch ? 'touchmove' : 'mousemove',
        stop: voiceRecordTouch ? 'touchend blur' : 'mouseup blur'
      }
      var onRecordStart, onRecordStreamReady, onRecordStop
      var recInited = false
      var recCancelAfterInit = false

      $(voiceRecordBtn).on(voiceRecordEvents.start, function(event) {
        if ($scope.voiceRecorder.processing) {
          return
        }

        voiceRecorder = new Recorder({
          monitorGain: 0,
          numberOfChannels: 1,
          bitRate: 64000,
          encoderSampleRate: 48000,
          encoderPath: 'vendor/recorderjs/encoder_worker.js'
        })

        recInited = false
        recCancelAfterInit = false

        onRecordStart = function(e) {
          var startTime = tsNow(true)

          voiceRecordDurationInterval = $interval(function() {
            $scope.voiceRecorder.duration = tsNow(true) - startTime
          }, 1000)

          $scope.$apply(function() {
            $scope.voiceRecorder.recording = true
          })
        }
        voiceRecorder.addEventListener('start', onRecordStart)

        onRecordStreamReady = function(e) {
          recInited = true
          if (recCancelAfterInit) {
            voiceRecorderStop()
            return
          }
          voiceRecorder.start()
        }
        voiceRecorder.addEventListener('streamReady', onRecordStreamReady)

        voiceRecorder.initStream()

        var curHover = false
        var curBoundaries = {}

        var updateVoiceHoverBoundaries = function () {
          var boundElement = $('.im_bottom_panel_wrap')
          var offset = boundElement.offset()
          curBoundaries = {
            top: offset.top,
            left: offset.left,
            width: boundElement.outerWidth(),
            height: boundElement.outerHeight(),
          }
        }

        var updateVoiceHoveredClass = function (event, returnHover) {
          var originalEvent = event.originalEvent || event
          var touch = voiceRecordTouch
                  ? originalEvent.changedTouches && originalEvent.changedTouches[0]
                  : originalEvent
          var isHover = touch &&
                        touch.pageX >= curBoundaries.left &&
                        touch.pageX <= curBoundaries.left + curBoundaries.width &&
                        touch.pageY >= curBoundaries.top &&
                        touch.pageY <= curBoundaries.top + curBoundaries.height

          if (curHover != isHover) {
            element.toggleClass('im_send_form_hover', isHover)
            curHover = isHover
          }
          return returnHover && isHover
        }

        updateVoiceHoverBoundaries()
        updateVoiceHoveredClass(event)

        onRecordStop = function(event) {
          $($window).off(voiceRecordEvents.move, updateVoiceHoveredClass)
          $($window).off(voiceRecordEvents.stop, onRecordStop)

          var isHover = event == 'blur' ? false : updateVoiceHoveredClass(event, true)

          if ($scope.voiceRecorder.duration > 0 && isHover) {
            $scope.voiceRecorder.processing = true
            voiceRecorder.addEventListener('dataAvailable', function(e) {
              var blob = blobConstruct([e.detail], 'audio/ogg')
              console.warn(dT(), 'got audio', blob)

              $scope.$apply(function () {
                if (blob.size !== undefined && 
                    blob.size > 1024) {
                  $scope.draftMessage.files = [blob]
                  $scope.draftMessage.isMedia = true
                }

                $scope.voiceRecorder.processing = false
              })
            })
          }
          cancelRecord()
        }

        if (!Config.Mobile) {
          $(voiceRecorderWrap).css({
            height: messageFieldWrap.offsetHeight,
            width: messageFieldWrap.offsetWidth
          })
        }

        $($window).on(voiceRecordEvents.move, updateVoiceHoveredClass)
        $($window).one(voiceRecordEvents.stop, onRecordStop)
      })

      function voiceRecorderStop() {
        if (!recInited) {
          recCancelAfterInit = true
          return
        }
        if (voiceRecorder) {
          voiceRecorder.stop()
          voiceRecorder.removeEventListener('streamReady', onRecordStreamReady)
          voiceRecorder.removeEventListener('start', onRecordStart)


          if (voiceRecorder.audioContext) {
            if (voiceRecorder.scriptProcessorNode) {
              voiceRecorder.scriptProcessorNode.disconnect()
            }
            voiceRecorder.clearStream()

            voiceRecorder.audioContext.close()
            voiceRecorder.audioContext = null
          }
        }
      }

      function cancelRecord() {
        voiceRecorderStop()

        if ($scope.voiceRecorder.recording) {
          $interval.cancel(voiceRecordDurationInterval)

          $scope.$apply(function() {
            $scope.voiceRecorder.recording = false
            $scope.voiceRecorder.duration = 0
          })
        }
      }

      var sendOnEnter = true
      function updateSendSettings () {
        Storage.get('send_ctrlenter').then(function (sendOnCtrl) {
          sendOnEnter = !sendOnCtrl
        })
      }
      $scope.$on('settings_changed', updateSendSettings)
      updateSendSettings()

      $(submitBtn).on('mousedown touchstart', onMessageSubmit)

      function onMessageSubmit (e) {
        $timeout(function () {
          updateValue()
          $scope.draftMessage.send()
          composer.resetTyping()
          if (composerEmojiPanel) {
            composerEmojiPanel.update()
          }

          composer.hideSuggestions()
        }, shouldFocusOnInteraction ? 0 : 100)
        return cancelEvent(e)
      }

      function onInlineResultSend (qID) {
        $scope.$apply(function () {
          $scope.draftMessage.inlineResultID = qID
        })
      }

      function onDirectionKey (e) {
        if (e.keyCode == 38) {
          $scope.$emit('last_message_edit')
          return cancelEvent(e)
        }
        $scope.$emit('history_direction_key', e)
        return true
      }

      function updateValue () {
        if (richTextarea) {
          composer.onChange()
          updateHeight()
        }
      }

      var height = richTextarea && richTextarea.offsetHeight
      function updateHeight () {
        var newHeight = richTextarea.offsetHeight
        if (height != newHeight) {
          height = newHeight
          $scope.$emit('ui_editor_resize')
        }
      }

      function onKeyDown (e) {
        if (e.keyCode == 9 && !e.shiftKey && !e.ctrlKey && !e.metaKey && !$modalStack.getTop()) { // TAB
          composer.focus()
          return cancelEvent(e)
        }
      }
      $(document).on('keydown', onKeyDown)

      $('body').on('dragenter dragleave dragover drop', onDragDropEvent)
      $(document).on('paste', onPasteEvent)

      if (shouldFocusOnInteraction) {
        $scope.$on('ui_peer_change', focusField)
        $scope.$on('ui_history_focus', focusField)
        $scope.$on('ui_history_change', focusField)
      }

      $scope.$on('ui_peer_change', composer.resetTyping.bind(composer))
      $scope.$on('ui_peer_draft', function (e, options) {
        options = options || {}
        var isBroadcast = $scope.draftMessage.isBroadcast
        composer.setPlaceholder(_(isBroadcast ? 'im_broadcast_field_placeholder_raw' : 'im_message_field_placeholder_raw'))

        if (options.customSelection) {
          composer.setFocusedValue(options.customSelection)
          updateHeight()
        } else {
          if (richTextarea) {
            composer.setValue($scope.draftMessage.text || '')
            updateHeight()
          }
          if (shouldFocusOnInteraction || (options && options.focus)) {
            composer.focus()
          }
        }
        onContentLoaded(function () {
          composer.checkAutocomplete(true)
        })
        if (emojiTooltip && Config.Mobile) {
          emojiTooltip.hide()
        }
      })
      $scope.$on('ui_peer_reply', function () {
        onContentLoaded(function () {
          $scope.$emit('ui_editor_resize')
          if (shouldFocusOnInteraction) {
            composer.focus()
          }
        })
      })

      $scope.$on('mentions_update', function () {
        composer.onMentionsUpdated()
      })

      $scope.$on('ui_message_before_send', function () {
        updateValue()
      })
      $scope.$on('ui_message_send', function () {
        if (shouldFocusOnInteraction) {
          focusField()
        }
      })
      $scope.$on('ui_message_blur', function () {
        composer.blur()
      })

      function focusField () {
        onContentLoaded(function () {
          composer.focus()
        })
      }

      function onFilePaste (blob) {
        var mimeType = blob.type || ''
        var fileUrlPromise = $q.when(false)
        if (['image/jpeg', 'image/gif', 'image/png', 'image/bmp'].indexOf(mimeType) >= 0) {
          fileUrlPromise = FileManager.getFileCorrectUrl(blob, mimeType)
        }
        fileUrlPromise.then(function (fileUrl) {
          fileUrl = fileUrl || false
          ErrorService.confirm({type: 'FILE_CLIPBOARD_PASTE', fileUrl: fileUrl}).then(function () {
            $scope.draftMessage.files = [blob]
            $scope.draftMessage.isMedia = true
          })
        })
      }

      function onPasteEvent (e) {
        var cData = (e.originalEvent || e).clipboardData
        var items = (cData && cData.items) || []
        var files = []
        var i, file

        for (i = 0; i < items.length; i++) {
          if (items[i].kind == 'file') {
            file = items[i].getAsFile()
            files.push(file)
          }
        }

        if (files.length > 0) {
          if (files.length == 1) {
            return onFilePaste(files[0])
          }
          ErrorService.confirm({type: 'FILES_CLIPBOARD_PASTE', files: files}).then(function () {
            $scope.draftMessage.files = files
            $scope.draftMessage.isMedia = true
          })
        }
      }

      function onDragDropEvent (e) {
        var dragStateChanged = false
        if (!dragStarted || dragStarted == 1) {
          dragStarted = checkDragEvent(e) ? 2 : 1
          dragStateChanged = true
        }
        if (dragStarted == 2) {
          if (dragTimeout) {
            setTimeout(function () {
              clearTimeout(dragTimeout)
              dragTimeout = false
            }, 0)
          }

          if (e.type == 'dragenter' || e.type == 'dragover') {
            if (dragStateChanged) {
              $(dropbox).css({
                height: messageFieldWrap.offsetHeight,
                width: messageFieldWrap.offsetWidth
              })
              element.addClass('im_send_form_dragging')
            }
          } else {
            if (e.type == 'drop') {
              $scope.$apply(function () {
                $scope.draftMessage.files = Array.prototype.slice.call(e.originalEvent.dataTransfer.files)
                $scope.draftMessage.isMedia = true
              })
            }
            dragTimeout = setTimeout(function () {
              element.removeClass('im_send_form_dragging')
              dragStarted = false
              dragTimeout = false
            }, 300)
          }
        }

        return cancelEvent(e)
      }

      $scope.$on('$destroy', function cleanup () {
        $(document).off('paste', onPasteEvent)
        $(document).off('keydown', onKeyDown)
        $('body').off('dragenter dragleave dragover drop', onDragDropEvent)
        $(submitBtn).off('mousedown touchstart')
        fileSelects.off('change')
      })

      if (shouldFocusOnInteraction) {
        focusField()
      }
    }
  })

  .directive('myLoadThumb', function (MtpApiFileManager, FileManager) {
    return {
      link: link,
      scope: {
        thumb: '='
      }
    }

    function link ($scope, element, attrs) {
      var counter = 0

      var cachedBlob = MtpApiFileManager.getCachedFile(
        $scope.thumb &&
        $scope.thumb.location &&
        !$scope.thumb.location.empty &&
        $scope.thumb.location
      )

      if (cachedBlob) {
        element.attr('src', FileManager.getUrl(cachedBlob, 'image/jpeg'))
      }
      if ($scope.thumb && $scope.thumb.width && $scope.thumb.height) {
        element.attr('width', $scope.thumb.width)
        element.attr('height', $scope.thumb.height)
      }

      var stopWatching = $scope.$watchCollection('thumb.location', function (newLocation) {
        if ($scope.thumb && $scope.thumb.width && $scope.thumb.height) {
          element.attr('width', $scope.thumb.width)
          element.attr('height', $scope.thumb.height)
          $scope.$emit('ui_height')
        }
        // console.log('new loc', newLocation, arguments)
        var counterSaved = ++counter
        if (!newLocation || newLocation.empty) {
          element.attr('src', ($scope.thumb && $scope.thumb.placeholder) || 'img/blank.gif')
          cleanup()
          return
        }

        var cachedBlob = MtpApiFileManager.getCachedFile(newLocation)
        if (cachedBlob) {
          element.attr('src', FileManager.getUrl(cachedBlob, 'image/jpeg'))
          cleanup()
          return
        }

        if (!element.attr('src')) {
          element.attr('src', $scope.thumb.placeholder || 'img/blank.gif')
        }

        MtpApiFileManager.downloadSmallFile($scope.thumb.location).then(function (blob) {
          if (counterSaved == counter) {
            element.attr('src', FileManager.getUrl(blob, 'image/jpeg'))
            cleanup()
          }
        }, function (e) {
          console.log('Download image failed', e, $scope.thumb.location, element[0])
          if (counterSaved == counter) {
            element.attr('src', $scope.thumb.placeholder || 'img/blank.gif')
            cleanup()
          }
        })
      })

      var cleanup = attrs.watch
        ? angular.noop
        : function () {
          setTimeout(function () {
            $scope.$destroy()
            stopWatching()
          }, 0)
        }
    }
  })

  .directive('myLoadFullPhoto', function (MtpApiFileManager, FileManager, _) {
    return {
      link: link,
      transclude: true,
      templateUrl: templateUrl('full_photo'),
      scope: {
        fullPhoto: '=',
        thumbLocation: '='
      }
    }

    function link ($scope, element, attrs) {
      var imgElement = $('img', element)[0]
      var resizeElements = $('.img_fullsize_with_progress_wrap', element)
        .add('.img_fullsize_progress_wrap', element)
        .add($(imgElement))
      var resize = function () {
        resizeElements.css({width: $scope.fullPhoto.width, height: $scope.fullPhoto.height})
        $scope.$emit('ui_height', true)
      }

      var jump = 0
      $scope.$watchCollection('fullPhoto.location', function () {
        var cachedBlob = MtpApiFileManager.getCachedFile($scope.thumbLocation)
        var curJump = ++jump

        if (cachedBlob) {
          imgElement.src = FileManager.getUrl(cachedBlob, 'image/jpeg')
          resize()
        } else {
          imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        }

        if (!$scope.fullPhoto.location) {
          return
        }

        var apiPromise
        if ($scope.fullPhoto.size) {
          var inputLocation = {
            _: 'inputFileLocation',
            volume_id: $scope.fullPhoto.location.volume_id,
            local_id: $scope.fullPhoto.location.local_id,
            secret: $scope.fullPhoto.location.secret
          }
          apiPromise = MtpApiFileManager.downloadFile($scope.fullPhoto.location.dc_id, inputLocation, $scope.fullPhoto.size)
        } else {
          apiPromise = MtpApiFileManager.downloadSmallFile($scope.fullPhoto.location)
        }

        $scope.progress = {enabled: true, percent: 0}

        apiPromise.then(function (blob) {
          if (curJump == jump) {
            $scope.progress.enabled = false
            imgElement.src = FileManager.getUrl(blob, 'image/jpeg')
            resize()
          }
        }, function (e) {
          console.log('Download image failed', e, $scope.fullPhoto.location)
          $scope.progress.enabled = false

          if (e && e.type == 'FS_BROWSER_UNSUPPORTED') {
            $scope.error = {html: _('error_browser_no_local_file_system_image_md', {
              'moz-link': '<a href="{0}" target="_blank">{1}</a>',
              'chrome-link': '<a href="{0}" target="_blank">{1}</a>',
              'telegram-link': '<a href="{0}" target="_blank">{1}</a>'
            })}
          } else {
            $scope.error = {text: _('error_image_download_failed'), error: e}
          }
        }, function (progress) {
          $scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total))
        })
      })

      resize()
    }
  })

  .directive('myLoadVideo', function ($sce, AppDocsManager, ErrorService, _) {
    return {
      link: link,
      transclude: true,
      templateUrl: templateUrl('full_video'),
      scope: {
        video: '='
      }
    }

    function link ($scope, element, attrs) {
      var downloadPromise = AppDocsManager.downloadDoc($scope.video.id)

      downloadPromise.then(function () {
        $scope.$emit('ui_height')
        onContentLoaded(function () {
          var videoEl = $('video', element)[0]
          if (videoEl) {
            var errorAlready = false
            var onVideoError = function (event) {
              if (errorAlready) {
                return
              }
              if (!event.target ||
                !event.target.error ||
                event.target.error.code == event.target.error.MEDIA_ERR_DECODE ||
                event.target.error.code == event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                errorAlready = true
                ErrorService.show({
                  error: {
                    type: 'MEDIA_TYPE_NOT_SUPPORTED',
                    originalError: event.target && event.target.error
                  }
                })
              }
            }

            videoEl.addEventListener('error', onVideoError, true)
            $(videoEl).on('$destroy', function () {
              errorAlready = true
              videoEl.removeEventListener('error', onVideoError)
            })
          }
        })
      }, function (e) {
        console.log('Download video failed', e, $scope.video)

        if (e && e.type == 'FS_BROWSER_UNSUPPORTED') {
          $scope.error = {html: _('error_browser_no_local_file_system_video_md', {
            'moz-link': '<a href="{0}" target="_blank">{1}</a>',
            'chrome-link': '<a href="{0}" target="_blank">{1}</a>',
            'telegram-link': '<a href="{0}" target="_blank">{1}</a>'
          })}
        } else {
          $scope.error = {text: _('error_video_download_failed'), error: e}
        }
      })

      $scope.$emit('ui_height')

      $scope.$on('$destroy', function () {
        downloadPromise.cancel()
      })
    }
  })

  .directive('myLoadGif', function (AppDocsManager, $timeout) {

    var currentPlayer = false
    var currentPlayerScope = false

    return {
      link: link,
      templateUrl: templateUrl('full_gif'),
      scope: {
        document: '='
      }
    }

    function checkPlayer(newPlayer, newScope) {
      if (currentPlayer === newPlayer) {
        return false
      }
      if (currentPlayer) {
        currentPlayer.pause()
        currentPlayer.currentTime = 0
        currentPlayerScope.isActive = false
      }
      currentPlayer = newPlayer
      currentPlayerScope = newScope
    }

    function toggleVideoPlayer ($scope, element) {
      var video = $('video', element)[0]
      if (video) {
        if (!$scope.isActive) {
          video.pause()
          video.currentTime = 0
        } else {
          checkPlayer(video, $scope)

          var promise = video.play()
          if (promise && promise.then) {
            promise.then(function () {
              $scope.needClick = false
            }, function () {
              $scope.needClick = true
            })
          }
        }
        return video
      }
      return false
    }

    function link ($scope, element, attrs) {
      var imgWrap = $('.img_gif_image_wrap', element)
      imgWrap.css({width: $scope.document.thumb.width, height: $scope.document.thumb.height})

      var downloadPromise = false
      var peerChanged = false

      $scope.isActive = false

      $scope.toggle = function (e) {
        if (e && checkClick(e, true)) {
          AppDocsManager.saveDocFile($scope.document.id)
          return false
        }

        if ($scope.document.url) {
          if ($scope.needClick) {
            if (toggleVideoPlayer($scope, element)) {
              return;
            }
          }
          $scope.isActive = !$scope.isActive
          onContentLoaded(function () {
            $scope.$emit('ui_height')
            toggleVideoPlayer($scope, element)
          })
          return
        }

        if (downloadPromise) {
          downloadPromise.cancel()
          downloadPromise = false
          return
        }

        peerChanged = false
        downloadPromise = AppDocsManager.downloadDoc($scope.document.id)

        downloadPromise.then(function () {
          $timeout(function () {
            if (!peerChanged) {
              $scope.isActive = true
            }
            var video = toggleVideoPlayer($scope, element)
            if (video) {
              $(video).on('ended', function () {
                if ($scope.isActive) {
                  $scope.toggle()
                }
              })
            }
          }, 200)
        })
      }

      $scope.$on('ui_history_change', function () {
        if ($scope.isActive) {
          $scope.toggle()
        }
        peerChanged = true
      })

      $scope.$on('$destroy', function () {
        if (downloadPromise) {
          downloadPromise.cancel()
          downloadPromise = false
        }
      })
    }
  })

  .directive('myLoadRound', function (AppMessagesManager, AppDocsManager, $timeout) {

    var currentPlayer = false
    var currentPlayerScope = false

    return {
      link: link,
      templateUrl: templateUrl('full_round'),
      scope: {
        document: '='
      }
    }

    function checkPlayer(newPlayer, newScope) {
      if (currentPlayer === newPlayer) {
        return false
      }
      if (currentPlayer) {
        currentPlayer.pause()
        currentPlayer.currentTime = 0
        currentPlayerScope.isActive = false
      }
      currentPlayer = newPlayer
      currentPlayerScope = newScope
    }

    function readVideoMessage($scope) {
      if ($scope.message &&
          !$scope.message.pFlags.out &&
          $scope.message.pFlags.media_unread) {
        AppMessagesManager.readMessages([$scope.message.mid])
      }
    }

    function toggleVideoPlayer ($scope, element) {
      var video = $('video', element)[0]
      if (video) {
        if (!$scope.isActive) {
          video.pause()
          video.currentTime = 0
        } else {
          checkPlayer(video, $scope)

          var promise = video.play()
          if (promise && promise.then) {
            promise.then(function () {
              $scope.needClick = false
              readVideoMessage($scope)
            }, function () {
              $scope.needClick = true
            })
          } else {
            readVideoMessage($scope)
          }
        }
        return video
      }
      return false
    }

    function link ($scope, element, attrs) {
      var imgWrap = $('.img_round_image_wrap', element)
      imgWrap.css({width: $scope.document.thumb.width, height: $scope.document.thumb.height})

      var downloadPromise = false
      var peerChanged = false

      $scope.isActive = false

      if ($scope.$parent.messageId) {
        $scope.message = AppMessagesManager.wrapForHistory($scope.$parent.messageId)
      }

      $scope.toggle = function (e) {
        if (e && checkClick(e, true)) {
          AppDocsManager.saveDocFile($scope.document.id)
          return false
        }

        if ($scope.document.url) {
          if ($scope.needClick) {
            if (toggleVideoPlayer($scope, element)) {
              return;
            }
          }
          $scope.isActive = !$scope.isActive
          onContentLoaded(function () {
            $scope.$emit('ui_height')
            toggleVideoPlayer($scope, element)
          })
          return
        }

        if (downloadPromise) {
          downloadPromise.cancel()
          downloadPromise = false
          return
        }

        peerChanged = false
        downloadPromise = AppDocsManager.downloadDoc($scope.document.id)

        downloadPromise.then(function () {
          $timeout(function () {
            if (!peerChanged) {
              $scope.isActive = true
            }
            var video = toggleVideoPlayer($scope, element)
            if (video) {
              $(video).on('ended', function () {
                if ($scope.isActive) {
                  $scope.toggle()
                }
              })
            }
          }, 200)
        })
      }

      $scope.$on('ui_history_change', function () {
        if ($scope.isActive) {
          $scope.toggle()
        }
        peerChanged = true
      })

      $scope.$on('$destroy', function () {
        if (downloadPromise) {
          downloadPromise.cancel()
          downloadPromise = false
        }
      })
    }
  })

  .directive('myLoadSticker', function (_, MtpApiFileManager, FileManager, AppStickersManager) {
    var emptySrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

    return {
      link: link,
      scope: {
        document: '='
      }
    }

    function link ($scope, element, attrs) {
      var imgElement = $('<img />').addClass(attrs.imgClass)
      var wasAdded = false

      imgElement.attr('alt', '[' + ($scope.document.stickerEmojiRaw || '') + ' ' + _('conversation_media_sticker') + ']')

      var dim = (attrs.dim && $scope.$parent.$eval(attrs.dim)) || $scope.document.thumb

      if (attrs.open && $scope.document.stickerSetInput) {
        element
          .addClass('clickable')
          .on('click', function () {
            AppStickersManager.openStickerset($scope.document.stickerSetInput)
          })
      }

      var setSrc = function (blob) {
        imgElement.attr('src', FileManager.getUrl(blob))
        if (!wasAdded) {
          wasAdded = true
          imgElement.appendTo(element)
        }
      }

      imgElement.css({
        width: dim.width,
        height: dim.height
      })
      element.css({
        width: dim.width,
        height: dim.height
      })

      var smallLocation = false
      if ($scope.document.thumb.location) {
        smallLocation = angular.copy($scope.document.thumb.location)
        smallLocation.sticker = true
      }

      var fullLocation = {
        _: 'inputDocumentFileLocation',
        id: $scope.document.id,
        access_hash: $scope.document.access_hash,
        dc_id: $scope.document.dc_id,
        file_name: $scope.document.file_name,
        version: $scope.document.version,
        sticker: true
      }

      var cachedBlob = MtpApiFileManager.getCachedFile(fullLocation)
      var fullDone = false
      if (!cachedBlob) {
        cachedBlob = MtpApiFileManager.getCachedFile(smallLocation)
      } else {
        fullDone = true
      }
      if (cachedBlob) {
        setSrc(cachedBlob)
        if (fullDone) {
          return
        }
      } else {
        wasAdded = true
        imgElement.attr('src', emptySrc).appendTo(element)
      }

      if (attrs.thumb && smallLocation) {
        MtpApiFileManager.downloadSmallFile(smallLocation).then(function (blob) {
          setSrc(blob)
        }, function (e) {
          console.log('Download sticker failed', e, fullLocation)
        })
      } else {
        MtpApiFileManager.downloadFile($scope.document.dc_id, fullLocation, $scope.document.size).then(function (blob) {
          setSrc(blob)
        }, function (e) {
          console.log('Download sticker failed', e, fullLocation)
        })
      }
    }
  })

  .directive('myLoadDocument', function (MtpApiFileManager, AppDocsManager, FileManager) {
    return {
      link: link,
      templateUrl: templateUrl('full_document'),
      scope: {
        document: '=myLoadDocument'
      }
    }

    function updateModalWidth (element, width) {
      while (element && !$(element).hasClass('modal-dialog')) {
        element = element.parentNode
      }
      if (element) {
        $(element).width(width + (Config.Mobile ? 0 : 32))
      }
    }

    function link ($scope, element, attrs) {
      var loaderWrap = $('.document_fullsize_with_progress_wrap', element)
      var fullSizeWrap = $('.document_fullsize_wrap', element)
      var fullSizeImage = $('.document_fullsize_img', element)

      var fullWidth = $(window).width() - (Config.Mobile ? 20 : 32)
      var fullHeight = $(window).height() - 150
      if (fullWidth > 800) {
        fullWidth -= 208
      }

      $scope.imageWidth = fullWidth
      $scope.imageHeight = fullHeight

      var thumbPhotoSize = $scope.document.thumb

      if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
        var wh = calcImageInBox(thumbPhotoSize.width, thumbPhotoSize.height, fullWidth, fullHeight)
        $scope.imageWidth = wh.w
        $scope.imageHeight = wh.h

        var cachedBlob = MtpApiFileManager.getCachedFile(thumbPhotoSize.location)
        if (cachedBlob) {
          $scope.thumbSrc = FileManager.getUrl(cachedBlob, 'image/jpeg')
        }
      }

      $scope.frameWidth = Math.max($scope.imageWidth, Math.min(600, fullWidth))
      $scope.frameHeight = $scope.imageHeight

      onContentLoaded(function () {
        $scope.$emit('ui_height')
      })

      updateModalWidth(element[0], $scope.frameWidth)

      var checkSizesInt
      var realImageWidth
      var realImageHeight
      AppDocsManager.downloadDoc($scope.document.id).then(function (blob) {
        var url = FileManager.getUrl(blob, $scope.document.mime_type)
        var image = new Image()
        var limit = 100 // 2 sec
        var checkSizes = function (e) {
          if ((!image.height || !image.width) && --limit) {
            return
          }
          realImageWidth = image.width
          realImageHeight = image.height
          clearInterval(checkSizesInt)

          var defaultWh = calcImageInBox(image.width, image.height, fullWidth, fullHeight, true)
          var zoomedWh = {w: realImageWidth, h: realImageHeight}
          if (defaultWh.w >= zoomedWh.w && defaultWh.h >= zoomedWh.h) {
            zoomedWh.w *= 4
            zoomedWh.h *= 4
          }

          var zoomed = true
          $scope.toggleZoom = function () {
            zoomed = !zoomed
            var imageWidth = (zoomed ? zoomedWh : defaultWh).w
            var imageHeight = (zoomed ? zoomedWh : defaultWh).h
            fullSizeImage.css({
              width: imageWidth,
              height: imageHeight,
              marginTop: $scope.frameHeight > imageHeight ? Math.floor(($scope.frameHeight - imageHeight) / 2) : 0
            })
            fullSizeWrap.toggleClass('document_fullsize_zoomed', zoomed)
          }

          $scope.toggleZoom(false)

          fullSizeImage.attr('src', url)
          loaderWrap.hide()
          fullSizeWrap.css({width: $scope.frameWidth, height: $scope.frameHeight}).show()
        }
        checkSizesInt = setInterval(checkSizes, 20)
        image.onload = checkSizes
        image.src = url
        setZeroTimeout(checkSizes)
      })
    }
  })

  .directive('myGeoPointMap', function (ExternalResourcesManager) {
    return {
      link: link,
      scope: {
        point: '=myGeoPointMap'
      }
    }

    function link ($scope, element, attrs) {
      var width = element.attr('width') || 200
      var height = element.attr('height') || 200
      var zoom = width > 200 ? 15 : 13
      var useGoogle = false
      var src

      if (useGoogle) {
        var apiKey = Config.ExtCredentials.gmaps.api_key
        var useApiKey = true
        src = 'https://maps.googleapis.com/maps/api/staticmap?sensor=false&center=' + $scope.point['lat'] + ',' + $scope.point['long'] + '&zoom=' + zoom + '&size=' + width + 'x' + height + '&scale=2&markers=color:red|size:big|' + $scope.point['lat'] + ',' + $scope.point['long']
        if (useApiKey) {
          src += '&key=' + apiKey
        }
      } else {
        src = 'https://static-maps.yandex.ru/1.x/?l=map&ll=' + $scope.point['long'] + ',' + $scope.point['lat'] + '&z=' + zoom + '&size=' + width + ',' + height + '&scale=1&pt=' + $scope.point['long'] + ',' + $scope.point['lat'] + ',pm2rdm&lang=en_US'
      }

      element.attr('src', 'img/blank.gif')

      ExternalResourcesManager.downloadByURL(src).then(function (url) {
        element.attr('src', url.valueOf())
      })
    }
  })

  .directive('myLoadingDots', function ($interval) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      element.html(isAnimationSupported(element[0])
        ? '<div class="loading_dots"><i></i><i></i><i></i></div>'
        : '...'
      )
    }

    var animationSupported
    function isAnimationSupported (el) {
      if (animationSupported === undefined) {
        animationSupported = el.style.animationName !== undefined
        if (animationSupported === false) {
          var domPrefixes = 'Webkit Moz O ms Khtml'.split(' ')
          var i
          for (i = 0; i < domPrefixes.length; i++) {
            if (el.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
              animationSupported = true
              break
            }
          }
        }
      }

      return animationSupported
    }
  })

  .directive('myFocused', function (shouldFocusOnInteraction) {
    return {
      link: function ($scope, element, attrs) {
        if (!shouldFocusOnInteraction) {
          return false
        }
        setTimeout(function () {
          setFieldSelection(element[0])
        }, 100)
      }
    }
  })

  .directive('myFocusOn', function (shouldFocusOnInteraction) {
    return {
      link: function ($scope, element, attrs) {
        $scope.$on(attrs.myFocusOn, function () {
          if (!shouldFocusOnInteraction) {
            return false
          }
          onContentLoaded(function () {
            setFieldSelection(element[0])
          })
        })
      }
    }
  })

  .directive('myFileUpload', function () {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      element.on('change', function () {
        var self = this
        $scope.$apply(function () {
          $scope.photo.file = self.files[0]
          setTimeout(function () {
            try {
              self.value = ''
            } catch (e) {}
          }, 1000)
        })
      })
    }
  })

  .directive('myModalWidth', function () {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      attrs.$observe('myModalWidth', function (newW) {
        $(element[0].parentNode.parentNode).css({width: parseInt(newW) + (Config.Mobile ? 0 : 32)})
      })
    }
  })

  .directive('myModalNav', function () {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var onKeyDown = function (event) {
        var target = event.target
        if (target && (target.tagName == 'INPUT' || target.tagName == 'TEXTAREA')) {
          return
        }

        switch (event.keyCode) {
          case 39: // right
          case 32: // space
          case 34: // pg down
          case 40: // down
            $scope.$eval(attrs.next)
            break

          case 37: // left
          case 33: // pg up
          case 38: // up
            $scope.$eval(attrs.prev)
            break
        }
      }

      $(document).on('keydown', onKeyDown)

      $scope.$on('$destroy', function () {
        $(document).off('keydown', onKeyDown)
      })
    }
  })

  .directive('myCustomBackground', function () {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      $('html').css({background: attrs.myCustomBackground})

      $scope.$on('$destroy', function () {
        $('html').css({background: ''})
      })
    }
  })

  .directive('myInfiniteScroller', function () {
    return {
      link: link,
      scope: true
    }

    function link ($scope, element, attrs) {
      var scrollableWrap = $('.nano-content', element)[0]
      var moreNotified = false

      $(scrollableWrap).on('scroll', function (e) {
        if (!element.is(':visible')) return
        if (!moreNotified &&
          scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          moreNotified = true
          $scope.$apply(function () {
            $scope.slice.limit += ($scope.slice.limitDelta || 20)
          })

          onContentLoaded(function () {
            moreNotified = false
            $(element).nanoScroller()
          })
        }
      })
    }
  })

  .directive('myModalPosition', function ($window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var updateMargin = function () {
        if (Config.Mobile &&
          $(element[0].parentNode.parentNode.parentNode).hasClass('mobile_modal')) {
          return
        }
        var height = element[0].parentNode.offsetHeight
        var modal = element[0].parentNode.parentNode.parentNode
        var bottomPanel = $('.media_modal_bottom_panel_wrap', modal)[0]
        var contHeight = modal.offsetHeight - ((bottomPanel && bottomPanel.offsetHeight) || 0)

        if (height < contHeight) {
          $(element[0].parentNode).css('marginTop', (contHeight - height) / 2)
        } else {
          $(element[0].parentNode).css('marginTop', '')
        }

        if (attrs.animation != 'no') {
          $timeout(function () {
            $(element[0].parentNode).addClass('modal-content-animated')
          }, 300)
        }
      }

      onContentLoaded(updateMargin)

      $($window).on('resize', updateMargin)

      $scope.$on('ui_height', function (e, sync) {
        if (sync) {
          updateMargin()
        } else {
          onContentLoaded(updateMargin)
        }
      })
    }
  })

  .directive('myVerticalPosition', function ($window, $timeout) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var usePadding = attrs.padding === 'true'
      var prevMargin = 0

      var updateMargin = function () {
        var height = element[0].offsetHeight
        var fullHeight = height - (height && usePadding ? 2 * prevMargin : 0)
        var ratio = (attrs.myVerticalPosition && parseFloat(attrs.myVerticalPosition)) || 0.5
        var contHeight = attrs.contHeight ? $scope.$eval(attrs.contHeight) : $($window).height()
        var margin = fullHeight < contHeight ? parseInt((contHeight - fullHeight) * ratio) : ''
        var styles = usePadding
          ? {paddingTop: margin, paddingBottom: margin}
          : {marginTop: margin, marginBottom: margin}

        element.css(styles)
        element.addClass('vertical-aligned')

        if (prevMargin !== margin) {
          $scope.$emit('ui_height')
        }

        prevMargin = margin
      }

      $($window).on('resize', updateMargin)

      onContentLoaded(updateMargin)

      $scope.$on('ui_height', function () {
        onContentLoaded(updateMargin)
      })
    }
  })

  .directive('myUserStatus', function (_, $filter, $rootScope, AppUsersManager) {
    var statusFilter = $filter('userStatus')
    var ind = 0
    var statuses = {}

    setInterval(updateAll, 90000)

    $rootScope.$on('stateSynchronized', function () {
      setTimeout(function () {
        updateAll()
      }, 100)
    })

    return {
      link: link
    }

    function updateAll () {
      angular.forEach(statuses, function (update) {
        update()
      })
    }

    function link ($scope, element, attrs) {
      var userID
      var curInd = ind++
      var forDialog = attrs.forDialog && $scope.$eval(attrs.forDialog)

      var update = function () {
        var user = AppUsersManager.getUser(userID)
        if (forDialog && user.pFlags.self) {
          element.html('')
        } else {
          element
            .html(statusFilter(user, attrs.botChatPrivacy))
            .toggleClass('status_online', (user.status && user.status._ == 'userStatusOnline') || false)
        }
        // console.log(dT(), 'update status', element[0], user.status && user.status, tsNow(true), element.html())
      }

      $scope.$watch(attrs.myUserStatus, function (newUserID) {
        userID = newUserID
        update()
      })
      $scope.$on('user_update', function (e, updUserID) {
        if (userID == updUserID) {
          update()
        }
      })
      statuses[curInd] = update
      $scope.$on('$destroy', function () {
        delete statuses[curInd]
      })
    }
  })

  .directive('myChatStatus', function ($rootScope, _, MtpApiManager, AppChatsManager, AppUsersManager, AppProfileManager) {
    var ind = 0
    var statuses = {}

    var allPluralize = _.pluralize('group_modal_pluralize_participants')
    var onlinePluralize = _.pluralize('group_modal_pluralize_online_participants')
    var subscribersPluralize = _.pluralize('group_modal_pluralize_subscribers')

    var myID = 0
    MtpApiManager.getUserID().then(function (newMyID) {
      myID = newMyID
    })

    setInterval(updateAll, 90000)

    return {
      link: link
    }

    function updateAll () {
      angular.forEach(statuses, function (update) {
        update()
      })
    }

    function link ($scope, element, attrs) {
      var chatID
      var curInd = ind++
      var jump = 0
      var participantsCount = 0
      var participants = {}

      var updateParticipants = function () {
        var curJump = ++jump
        participantsCount = 0
        participants = {}
        var chat = AppChatsManager.getChat(chatID)
        if (chat.participants_count) {
          participantsCount = chat.participants_count
        }
        update()
        if (!chatID || AppChatsManager.isChannel(chatID) && participantsCount) {
          return
        }
        AppProfileManager.getChatFull(chatID).then(function (chatFull) {
          if (curJump != jump) {
            return
          }
          var participantsVector = (chatFull.participants || {}).participants || []
          participantsCount = participantsVector.length
          angular.forEach(participantsVector, function (participant) {
            participants[participant.user_id] = true
          })
          if (chatFull.participants_count) {
            participantsCount = chatFull.participants_count || 0
          }
          if (!participantsCount) {
            var chat = AppChatsManager.getChat(chatID)
            if (chat.participants_count) {
              participantsCount = chat.participants_count
            }
          }
          update()
        })
      }

      var update = function () {
        var html = AppChatsManager.isBroadcast(chatID)
          ? subscribersPluralize(participantsCount)
          : allPluralize(participantsCount)
        var onlineCount = 0
        if (!AppChatsManager.isChannel(chatID)) {
          var wasMe = false
          angular.forEach(participants, function (t, userID) {
            var user = AppUsersManager.getUser(userID)
            if (user.status && user.status._ == 'userStatusOnline') {
              if (user.id == myID) {
                wasMe = true
              }
              onlineCount++
            }
          })
          if (onlineCount > 1 || onlineCount == 1 && !wasMe) {
            html = _('group_modal_participants', {total: html, online: onlinePluralize(onlineCount)})
          }
        }
        if (!onlineCount && !participantsCount) {
          html = ''
        }
        element.html(html)
      }

      $scope.$watch(attrs.myChatStatus, function (newChatID) {
        chatID = newChatID
        updateParticipants()
      })

      $rootScope.$on('chat_full_update', function (e, updChatID) {
        if (chatID == updChatID) {
          updateParticipants()
        }
      })

      $rootScope.$on('user_update', function (e, updUserID) {
        if (participants[updUserID]) {
          update()
        }
      })

      statuses[curInd] = update
      $scope.$on('$destroy', function () {
        delete statuses[curInd]
      })
    }
  })

  .directive('myPeerMuted', function ($rootScope, NotificationsManager) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var peerID = $scope.$eval(attrs.myPeerMuted)
      var className = attrs.mutedClass || 'muted'
      var unsubscribe = $rootScope.$on('notify_settings', function (e, data) {
        if (data.peerID == peerID) {
          updateClass(peerID, element, className)
        }
      })
      updateClass(peerID, element, className)

      $scope.$on('$destroy', unsubscribe)
    }

    function updateClass (peerID, element, className) {
      NotificationsManager.getPeerMuted(peerID).then(function (muted) {
        element.toggleClass(className, muted)
      })
    }
  })

  .directive('myPeerLink', function (_, $rootScope, AppPeersManager, AppChatsManager, AppUsersManager, AppMessagesIDsManager) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var override = attrs.userOverride && $scope.$eval(attrs.userOverride) || {}
      var short = attrs.short && $scope.$eval(attrs.short)
      var username = attrs.username && $scope.$eval(attrs.username)
      var forDialog = attrs.forDialog && $scope.$eval(attrs.forDialog)

      var peerID
      var update = function () {
        if (element[0].className.indexOf('user_color_') != -1) {
          element[0].className = element[0].className.replace(/user_color_\d+/g, '')
        }
        if (peerID > 0) {
          var user = AppUsersManager.getUser(peerID)
          if (forDialog && user.pFlags.self) {
            element.text(_('user_name_saved_msgs_raw'))
          } else {
            var prefix = username ? '@' : ''
            var key = username ? 'username' : (short ? 'rFirstName' : 'rFullName')

            element.html(
              prefix +
              (override[key] || user[key] || '').valueOf() +
              (attrs.verified && user.pFlags && user.pFlags.verified ? ' <i class="icon-verified"></i>' : '')
            )

            if (attrs.color && $scope.$eval(attrs.color)) {
              element.addClass('user_color_' + user.num)
            }
          }
        } else {
          var chat = AppChatsManager.getChat(-peerID)

          element.html(
            (chat.rTitle || '').valueOf() +
            (attrs.verified && chat.pFlags && chat.pFlags.verified ? ' <i class="icon-verified"></i>' : '')
          )
        }
      }

      if (element[0].tagName == 'A' && !hasOnclick(element[0])) {
        element.on('click', function () {
          if (peerID > 0) {
            AppUsersManager.openUser(peerID, override)
          } else {
            var chatID = -peerID
            var postID = attrs.postId && $scope.$eval(attrs.postId)
            var savedFrom = attrs.savedFrom && $scope.$eval(attrs.savedFrom)
            if (postID) {
              $rootScope.$broadcast('history_focus', {
                peerString: AppChatsManager.getChatString(chatID),
                messageID: AppMessagesIDsManager.getFullMessageID(parseInt(postID), chatID)
              })
            } else if (savedFrom) {
              var peerMid = savedFrom.split('_')
              $rootScope.$broadcast('history_focus', {
                peerString: AppPeersManager.getPeerString(peerMid[0]),
                messageID: peerMid[1]
              })
            } else {
              AppChatsManager.openChat(chatID)
            }
          }
        })
      }

      if (attrs.peerWatch) { // userWatch, chatWatch
        $scope.$watch(attrs.myPeerLink, function (newPeerID) {
          peerID = newPeerID
          update()
        })
      } else {
        peerID = $scope.$eval(attrs.myPeerLink)
        update()
      }
      if (!attrs.noWatch) {
        $scope.$on('user_update', function (e, updUserID) {
          if (peerID == updUserID) {
            update()
          }
        })
        $scope.$on('chat_update', function (e, updChatID) {
          if (peerID == -updChatID) {
            update()
          }
        })
      }
    }
  })

  .directive('myPeerPhotolink', function (AppPeersManager, AppUsersManager, AppChatsManager, MtpApiFileManager, FileManager) {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      element.addClass('peer_photo_init')

      var peerID, peer
      var peerPhoto
      var imgEl = $('<img class="' + (attrs.imgClass || '') + '">')
      var initEl = $('<span class="peer_initials nocopy ' + (attrs.imgClass || '') + '"></span>')
      var jump = 0
      var prevClass = false
      var forDialog = attrs.forDialog && $scope.$eval(attrs.forDialog)

      var setPeerID = function (newPeerID) {
        if (peerID == newPeerID) {
          return false
        }
        peerID = newPeerID
        peer = AppPeersManager.getPeer(peerID)

        var newClass = 'user_bgcolor_' + (peer.num || 1)
        if (newClass != prevClass) {
          if (prevClass) {
            initEl.removeClass(prevClass)
          }
          initEl.addClass(newClass)
          prevClass = newClass
        }

        updatePeerPhoto()

        return true
      }

      var updatePeerPhoto = function () {
        var curJump = ++jump

        peerPhoto = peer.photo && angular.copy(peer.photo.photo_small)

        if (forDialog && peer.pFlags && peer.pFlags.self) {
          initEl.remove()
          imgEl.prependTo(element).attr('src', 'img/placeholders/Fave.png')
          return
        }

        var hasPhoto = peerPhoto !== undefined

        if (hasPhoto) {
          var cachedBlob = MtpApiFileManager.getCachedFile(peer.photo.photo_small)
          if (cachedBlob) {
            initEl.remove()
            imgEl.prependTo(element).attr('src', FileManager.getUrl(cachedBlob, 'image/jpeg'))
            return
          }
        }

        initEl.attr('data-content', peer.initials || '').prependTo(element)
        imgEl.remove()

        if (hasPhoto) {
          MtpApiFileManager.downloadSmallFile(peer.photo.photo_small).then(function (blob) {
            if (curJump != jump) {
              return
            }
            initEl.remove()
            imgEl.prependTo(element).attr('src', FileManager.getUrl(blob, 'image/jpeg'))
          }, function (e) {
            console.log('Download image failed', e, peer.photo.photo_small, element[0])
          })
        }
      }

      if (element[0].tagName == 'A' && !attrs.noOpen) {
        element.on('click', function (e) {
          if (peerID > 0) {
            AppUsersManager.openUser(peerID, attrs.userOverride && $scope.$eval(attrs.userOverride))
          } else {
            AppChatsManager.openChat(-peerID)
          }
        })
      }

      $scope.$watch(attrs.myPeerPhotolink, setPeerID)
      setPeerID($scope.$eval(attrs.myPeerPhotolink))

      if (attrs.watch) {
        $scope.$on('user_update', function (e, updUserID) {
          if (peerID == updUserID) {
            peer = AppPeersManager.getPeer(peerID)
            if (!angular.equals(peer.photo && peer.photo.photo_small, peerPhoto) ||
                !peerPhoto) {
              updatePeerPhoto()
            }
          }
        })
        $scope.$on('chat_update', function (e, updChatID) {
          if (peerID == -updChatID) {
            if (!angular.equals(peer.photo && peer.photo.photo_small, peerPhoto)) {
              updatePeerPhoto()
            }
          }
        })
      }
    }
  })

  .directive('myOgvPlayer', function ($compile) {
    return {
      link: function ($scope, $element, $attrs) {
        var audio = $scope.audio
        var playerEl
        if (audio.mime_type == 'audio/ogg' &&
            // false &&
            OGVCompat.hasWebAudio() && // we don't want to use Flash
            OGVCompat.supported('OGVPlayer')) {
          playerEl = new OGVPlayer({debug: false, worker: false})
        } else {
          playerEl = document.createElement('audio')
        }

        $(playerEl).attr('media-player', $attrs.myOgvPlayer)
        $(playerEl).attr('src', '{{::' + $attrs.src + '}}')

        $compile(playerEl)($scope)
        $($element).append(playerEl)
      }
    }
  })

  .directive('myAudioPlayer', function ($timeout, $q, Storage, AppDocsManager, AppMessagesManager, ErrorService) {
    var currentPlayerScope = false
    var audioVolume = 0.5

    Storage.get('audio_volume').then(function (newAudioVolume) {
      if (newAudioVolume > 0 && newAudioVolume <= 1.0) {
        audioVolume = newAudioVolume
      }
    })

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
        })
      }
    }

    return {
      link: link,
      scope: {
        audio: '='
      },
      templateUrl: templateUrl('audio_player')
    }

    function checkAudioPlayer (newPlayerScope) {
      if (newPlayerScope === currentPlayerScope) {
        return false
      }
      if (currentPlayerScope) {
        ;(function ($scope) {
          setZeroTimeout(function () {
            $scope.mediaPlayer.player.pause()
          })
        })(currentPlayerScope)
      }
      currentPlayerScope = newPlayerScope
    }

    function link ($scope, element, attrs) {
      AppDocsManager.updateDocDownloaded($scope.audio.id)

      $scope.volume = audioVolume
      $scope.mediaPlayer = {}
      if ($scope.$parent.messageId) {
        $scope.message = AppMessagesManager.wrapForHistory($scope.$parent.messageId)
      }

      $scope.download = function () {
        AppDocsManager.saveDocFile($scope.audio.id)
      }

      $scope.duration = function () {
        if ($scope.mediaPlayer.player &&
            $scope.mediaPlayer.player.duration > 0 &&
            $scope.mediaPlayer.player.duration < Infinity) {
          return $scope.mediaPlayer.player.duration
        }
        return $scope.audio && $scope.audio.duration || 0
      }

      $scope.togglePlay = function () {
        if ($scope.audio.url) {
          checkAudioPlayer($scope)
          setZeroTimeout(function () {
            $scope.mediaPlayer.player.playPause()
          })
        } else if ($scope.audio.progress && $scope.audio.progress.enabled) {
        } else {
          AppDocsManager.downloadDoc($scope.audio.id).then(function () {
            onContentLoaded(function () {
              var errorListenerEl = $('audio, ogvjs', element)[0] || element[0]
              if (errorListenerEl) {
                var errorAlready = false
                var onAudioError = function (event) {
                  if (errorAlready) {
                    return
                  }
                  if (!event.target ||
                    !event.target.error ||
                    event.target.error.code == event.target.error.MEDIA_ERR_DECODE ||
                    event.target.error.code == event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                    errorAlready = true
                    ErrorService.show({
                      error: {
                        type: 'MEDIA_TYPE_NOT_SUPPORTED',
                        originalError: event.target && event.target.error
                      }
                    })
                  }
                }

                errorListenerEl.addEventListener('error', onAudioError, true)
                $scope.$on('$destroy', function () {
                  errorAlready = true
                  errorListenerEl.removeEventListener('error', onAudioError)
                })
              }
              setTimeout(function () {
                checkAudioPlayer($scope)
                $scope.mediaPlayer.player.setVolume(audioVolume)
                $scope.mediaPlayer.player.play()

                if ($scope.message &&
                    !$scope.message.pFlags.out &&
                    $scope.message.pFlags.media_unread) {
                  AppMessagesManager.readMessages([$scope.message.mid])
                }
              }, 300)
            })
          })
        }
      }

      $scope.seek = function (position) {
        if ($scope.mediaPlayer && $scope.mediaPlayer.player) {
          $scope.mediaPlayer.player.seek(position)
        } else {
          $scope.togglePlay()
        }
      }
      $scope.setVolume = function (volume) {
        audioVolume = volume
        Storage.set({audio_volume: volume})
        if ($scope.mediaPlayer && $scope.mediaPlayer.player) {
          $scope.mediaPlayer.player.setVolume(volume)
        }
      }
    }
  })

  .directive('mySlider', function ($window) {
    return {
      link: link,
      templateUrl: templateUrl('slider')
    }

    function link ($scope, element, attrs) {
      var wrap = $('.tg_slider_wrap', element)
      var fill = $('.tg_slider_track_fill', element)
      var thumb = $('.tg_slider_thumb', element)
      var width = wrap.width()
      var thumbWidth = Math.ceil(thumb.width())
      var model = attrs.sliderModel
      var sliderCallback = attrs.sliderOnchange
      var minValue = 0.0
      var maxValue = 1.0
      var lastUpdValue = false
      var lastMinPageX = false

      if (attrs.sliderMin) {
        $scope.$watch(attrs.sliderMin, function (newMinValue) {
          minValue = newMinValue || 0.0
        })
      }
      if (attrs.sliderMax) {
        $scope.$watch(attrs.sliderMax, function (newMaxValue) {
          maxValue = newMaxValue || 1.0
        })
      }

      var onSliderMove = function (e) {
        e = e.originalEvent || e

        var offsetX = (e.touches && e.touches[0] ? e.touches[0].pageX : e.pageX) - lastMinPageX
        offsetX = Math.min(width, Math.max(0, offsetX))
        // console.log(e.type, lastMinPageX, e.pageX, offsetX)
        lastUpdValue = minValue + offsetX / width * (maxValue - minValue)
        if (sliderCallback) {
          $scope.$eval(sliderCallback, {value: lastUpdValue})
        } else {
          $scope.$eval(model + '=' + lastUpdValue)
        }

        thumb.css('left', Math.max(0, offsetX - thumbWidth))
        fill.css('width', offsetX)

        return cancelEvent(e)
      }
      var stopSliderTrack = function () {
        $($window).off('mousemove touchmove', onSliderMove)
        $($window).off('mouseup touchend touchcancel touchleave', stopSliderTrack)
      }

      $scope.$watch(model, function (newVal) {
        if (newVal != lastUpdValue && newVal !== undefined) {
          var percent = Math.max(0, (newVal - minValue) / (maxValue - minValue))
          if (width) {
            var offsetX = Math.ceil(width * percent)
            offsetX = Math.min(width, Math.max(0, offsetX))
            thumb.css('left', Math.max(0, offsetX - thumbWidth))
            fill.css('width', offsetX)
          } else {
            thumb.css('left', percent * 100 + '%')
            fill.css('width', percent * 100 + '%')
          }
          lastUpdValue = false
        }
      })

      element.on('dragstart selectstart', cancelEvent)

      element.on('mousedown touchstart', function (e) {
        if (!width) {
          width = wrap.width()
          if (!width) {
            console.error('empty width')
            return cancelEvent(e)
          }
        }
        stopSliderTrack()

        e = e.originalEvent || e

        var offsetX
        if (e.touches && e.touches[0]) {
          lastMinPageX = element.position().left
          offsetX = e.touches[0].pageX - lastMinPageX
        } else if (e.offsetX !== undefined) {
          offsetX = e.offsetX
          lastMinPageX = e.pageX - offsetX
        } else if (e.layerX !== undefined) {
          offsetX = e.layerX
          lastMinPageX = e.pageX - offsetX
        } else {
          return cancelEvent(e)
        }

        // console.log(e.type, e, lastMinPageX, e.pageX, offsetX)
        lastUpdValue = minValue + offsetX / width * (maxValue - minValue)
        if (sliderCallback) {
          $scope.$eval(sliderCallback, {value: lastUpdValue})
        } else {
          $scope.$eval(model + '=' + lastUpdValue)
        }

        thumb.css('left', Math.max(0, offsetX - thumbWidth))
        fill.css('width', offsetX)

        $($window).on('mousemove touchmove', onSliderMove)
        $($window).on('mouseup touchend touchcancel touchleave', stopSliderTrack)

        return cancelEvent(e)
      })
    }
  })

  .directive('myLabeledInput', function () {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      var input = $('.md-input:first', element)
      var label = $('.md-input-label:first', element)
      var isDisabled = input[0] && input[0].tagName == 'SPAN'
      var focused = false
      var updateHasValueClass = function () {
        if (isDisabled) {
          element.toggleClass('md-input-has-value', input.html().length > 0)
        } else {
          element.toggleClass('md-input-has-value', focused || input.val().length > 0)
        }
      }

      updateHasValueClass()
      onContentLoaded(function () {
        updateHasValueClass()
        setZeroTimeout(function () {
          element.addClass('md-input-animated')
        })
      })

      if (!isDisabled) {
        input.on('blur focus change', function (e) {
          focused = e.type == 'focus'
          element.toggleClass('md-input-focused', focused)
          updateHasValueClass()
        })
      }

      $scope.$on('value_updated', function () {
        setZeroTimeout(function () {
          updateHasValueClass()
        })
      })
    }
  })

  .directive('myCopyField', function (toaster, _) {
    return {
      scope: {
        selectEvent: '=myCopyField'
      },
      link: link
    }

    function link ($scope, element, attrs) {
      element.attr('readonly', 'true')
      element[0].readonly = true
      element.on('click', function () {
        this.select()
      })

      if ($scope.selectEvent) {
        $scope.$on($scope.selectEvent, function () {
          setTimeout(function () {
            element[0].focus()
            element[0].select()
          }, 100)
        })
      }
    }
  })

  .directive('myCopyLink', function ($compile, $timeout, _) {
    return {
      restrict: 'A',
      replace: false,
      terminal: true,
      priority: 1000,
      link: link
    }

    function link ($scope, element, attrs) {
      element.attr('tooltip', '{{ttLabel}}')
      element.removeAttr('my-copy-link')
      element.removeAttr('data-my-copy-link')

      var resetPromise = false
      var resetTooltip = function () {
        $timeout.cancel(resetPromise)
        resetPromise = false
        $scope.ttLabel = _('conversations_modal_share_url_copy_raw')
      }

      resetTooltip()

      $compile(element)($scope)

      var clipboard = new Clipboard(element[0])

      clipboard.on('success', function (e) {
        $timeout.cancel(resetPromise)
        $scope.$apply(function () {
          $scope.ttLabel = _('clipboard_copied_raw')
        })
        resetPromise = $timeout(resetTooltip, 2000)
      })

      clipboard.on('error', function (e) {
        $timeout.cancel(resetPromise)
        var langKey = Config.Navigator.osX
          ? 'clipboard_press_cmd_c'
          : 'clipboard_press_ctrl_c'
        $scope.$apply(function () {
          $scope.ttLabel = _(langKey + '_raw')
        })
        resetPromise = $timeout(resetTooltip, 5000)
      })

      $scope.$on('$destroy', function () {
        clipboard.destroy()
      })
    }
  })

  .directive('mySubmitOnEnter', function () {
    return {
      link: link
    }

    function link ($scope, element, attrs) {
      element.on('keydown', function (event) {
        if (event.keyCode == 13) {
          element.trigger('submit')
          return cancelEvent(event)
        }
      })
    }
  })

  .directive('myArcProgress', function () {
    var html =
    '<svg class="progress-arc" viewPort="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">\
  <defs>\
    <linearGradient id="grad_intermediate%id%" x1="0%" y1="0%" x2="100%" y2="0%">\
      <stop offset="0%" class="stop0" />\
      <stop offset="60%" class="stop60" />\
      <stop offset="100%"  class="stop100"/>\
    </linearGradient>\
  </defs>\
  <circle class="progress-arc-bar"></circle>\
</svg>'

    function updateProgress (bar, progress, fullLen) {
      progress = Math.max(0.0, Math.min(progress, 1.0))
      var minProgress = 0.2
      progress = minProgress + (1 - minProgress) * progress
      bar.css({strokeDasharray: (progress * fullLen) + ', ' + ((1 - progress) * fullLen)})
    }

    var num = 0

    return {
      scope: {
        progress: '=myArcProgress'
      },
      link: function ($scope, element, attrs) {
        var intermediate = !attrs.myArcProgress
        var width = attrs.width || element.width() || 40
        var stroke = attrs.stroke || (width / 2 * 0.14)
        var center = width / 2
        var radius = center - (stroke / 2)

        // Doesn't work without unique id for every gradient
        var curNum = ++num

        element
          .html(html.replace('%id%', curNum))
          .addClass('progress-arc-wrap')
          .addClass(intermediate ? 'progress-arc-intermediate' : 'progress-arc-percent')
          .css({width: width, height: width})

        $(element[0].firstChild)
          .attr('width', width)
          .attr('height', width)

        var bar = $('.progress-arc-bar', element)
        bar
          .attr('cx', center)
          .attr('cy', center)
          .attr('r', radius)
          .css({strokeWidth: stroke})

        var fullLen = 2 * Math.PI * radius
        if (intermediate) {
          updateProgress(bar, 0.3, fullLen)
          bar.css({stroke: 'url(#grad_intermediate' + curNum + ')'})
        } else {
          $scope.$watch('progress', function (newProgress) {
            updateProgress(bar, newProgress / 100.0, fullLen)
          })
        }
      }
    }
  })

  .directive('myScrollToOn', function () {
    return {
      link: function ($scope, element, attrs) {
        var ev = attrs.myScrollToOn
        var doScroll = function () {
          onContentLoaded(function () {
            $('html, body').animate({
              scrollTop: element.offset().top
            }, 200)
          })
        }
        if (ev == '$init') {
          doScroll()
        } else {
          $scope.$on(ev, doScroll)
        }
      }
    }
  })

  .directive('myComposerDropdown', function () {
    return {
      templateUrl: templateUrl('composer_dropdown')
    }
  })

  .directive('myEmojiSuggestions', function () {
    return {
      link: function ($scope, element, attrs) {
        $scope.$watchCollection('emojiCodes', function (codes) {
          // var codes = $scope.$eval(attrs.myEmojiSuggestions)
          var html = []
          var iconSize = Config.Mobile ? 26 : 20

          var emoticonCode, emoticonData
          var spritesheet, pos
          var categoryIndex
          var count = Math.min(5, codes.length)
          var i, x, y

          for (i = 0; i < count; i++) {
            emoticonCode = codes[i]
            if (emoticonCode.code) {
              emoticonCode = emoticonCode.code
            }
            if (emoticonData = Config.Emoji[emoticonCode]) {
              spritesheet = EmojiHelper.spritesheetPositions[emoticonCode]
              categoryIndex = spritesheet[0]
              pos = spritesheet[1]
              x = iconSize * spritesheet[3]
              y = iconSize * spritesheet[2]
              html.push('<li><a class="composer_emoji_option" data-code="' + encodeEntities(emoticonCode) + '"><i class="emoji emoji-w', iconSize, ' emoji-spritesheet-' + categoryIndex + '" style="background-position: -' + x + 'px -' + y + 'px;"></i><span class="composer_emoji_shortcut">:' + encodeEntities(emoticonData[1][0]) + ':</span></a></li>')
            }
          }
          // onContentLoaded(function () {
          element.html(html.join(''))
          console.log(dT(), 'emoji done')
        // })
        })
      }
    }
  })

  .directive('myInlineResults', function (AppPhotosManager, ExternalResourcesManager, AppDocsManager) {
    return {
      templateUrl: templateUrl('inline_results'),
      scope: {
        botResults: '=myInlineResults'
      },

      link: function ($scope, element, attrs) {
        $scope.$watch('botResults.results', function (results) {
          angular.forEach(results, function (result) {
            if (result.thumb_url && !result.thumbUrl) {
              ExternalResourcesManager.downloadByURL(result.thumb_url).then(function (url) {
                result.thumbUrl = url
              })
            }
            if (result.type == 'gif' && result.content_url && !result.contentUrl) {
              ExternalResourcesManager.downloadByURL(result.content_url).then(function (url) {
                result.contentUrl = url
              })
            }
            if ((result.type == 'gif' || result.type == 'sticker') && result.document) {
              AppDocsManager.downloadDoc(result.document.id)
            }
            var photoSize
            if (result.type == 'photo' && result.photo) {
              photoSize = AppPhotosManager.choosePhotoSize(result.photo, result.thumbW, result.thumbH)
              var dim = calcImageInBox(photoSize.w, photoSize.h, result.thumbW, result.thumbH)
              result.thumb = {
                width: dim.w,
                height: dim.h,
                location: photoSize.location,
                size: photoSize.size
              }
            }
            if (result.type == 'game' && result.photo) {
              photoSize = AppPhotosManager.choosePhotoSize(result.photo, 100, 100)
              // var dim = calcImageInBox(photoSize.w, photoSize.h, result.thumbW, result.thumbH)
              result.thumb = {
                // width: dim.w,
                // height: dim.h,
                location: photoSize.location,
                size: photoSize.size
              }
            }
          })
        })
      }
    }
  })

  .directive('myGameCommunication', function ($window) {
    function link ($scope, element, attrs) {
      onContentLoaded(function () {
        var iframe = $('iframe, webview', element)[0]
        var contentWindow = iframe.contentWindow
        var handler = function (event) {
          event = event.originalEvent || event
          if (event.source && event.source != contentWindow) {
            return
          }
          var data = event.data
          try {
            var dataParsed = JSON.parse(data)
          } catch (e) {
            return
          }
          if (!dataParsed || !dataParsed.eventType) {
            return
          }
          $scope.$emit('game_frame_event', dataParsed)
        }

        $($window).on('message', handler)

        $scope.$on('$destroy', function () {
          $($window).off('message', handler)
        })
      })
    }

    return {
      link: link
    }
  })

  .directive('myEmojiImage', function (RichTextProcessor) {
    function link ($scope, element, attrs) {
      var emoji = attrs.myEmojiImage
      var html = RichTextProcessor.wrapRichText(emoji, {noLinks: true, noLinebreaks: true})
      element.html(html.valueOf())
    }

    return {
      link: link
    }
  })

  .directive('myExternalEmbed', function () {
    var twitterAttached = false
    var facebookAttached = false
    var gplusAttached = false
    var twitterPendingWidgets = []
    var facebookPendingWidgets = []
    var embedTag = Config.Modes.chrome_packed ? 'webview' : 'iframe'

    function link ($scope, element, attrs) {
      var embedData = $scope.$eval(attrs.myExternalEmbed)
      if (!embedData) {
        return
      }
      var html = ''
      var callback = false
      var needTwitter = false
      var videoID
      switch (embedData[0]) {
        case 'youtube':
          videoID = embedData[1]
          html = '<div class="im_message_media_embed im_message_video_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
            'src="https://www.youtube.com/embed/' + videoID +
            '?autoplay=0&amp;controls=2" webkitallowfullscreen mozallowfullscreen allowfullscreen></' + embedTag + '></div>'
          break

        case 'vimeo':
          videoID = embedData[1]
          html = '<div class="im_message_media_embed im_message_video_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
            'src="https://player.vimeo.com/video/' + videoID +
            '?title=0&amp;byline=0&amp;portrait=0" webkitallowfullscreen mozallowfullscreen allowfullscreen></' + embedTag + '></div>'
          break

        case 'instagram':
          var instaID = embedData[1]
          html = '<div class="im_message_media_embed im_message_insta_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
            'src="https://instagram.com/p/' + instaID +
            '/embed/"></' + embedTag + '></div>'
          break

        case 'vine':
          var vineID = embedData[1]
          html = '<div class="im_message_media_embed im_message_vine_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
            'src="https://vine.co/v/' + vineID + '/embed/simple"></' + embedTag + '></div>'
          break

        case 'soundcloud':
          var soundcloudUrl = embedData[1]
          html = '<div class="im_message_media_embed im_message_soundcloud_embed"><' + embedTag + ' type="text/html" frameborder="0" ' +
            'src="https://w.soundcloud.com/player/?url=' + encodeEntities(encodeURIComponent(soundcloudUrl)) +
            '&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></' + embedTag + '></div>'
          break

        case 'spotify':
          var spotifyUrl = embedData[1]
          html = '<div class="im_message_media_embed im_message_spotify_embed"><' + embedTag + ' type="text/html" frameborder="0" allowtransparency="true" ' +
            'src="https://embed.spotify.com/?uri=spotify:' + encodeEntities(encodeURIComponent(spotifyUrl)) +
            '"></' + embedTag + '></div>'
          break

        case 'twitter':
          html = '<div class="im_message_twitter_embed"><blockquote class="twitter-tweet" lang="en"><a href="' + embedData[1] + '"></a></blockquote></div>'

          callback = function () {
            if (!twitterAttached) {
              twitterAttached = true
              $('<script>')
                .appendTo('body')
                .on('load', function () {
                  twttr.events.bind('loaded', function (event) {
                    for (var i = 0; i < twitterPendingWidgets.length; i++) {
                      twitterPendingWidgets[i].$emit('ui_height')
                    }
                    twitterPendingWidgets = []
                  })
                })
                .attr('src', 'https://platform.twitter.com/widgets.js')
            } else if (window.twttr) {
              twttr.widgets.load(element[0])
            }
            twitterPendingWidgets.push($scope)
          }
          break

        case 'facebook':
          html = '<div class="im_message_facebook_embed"><div class="fb-post" data-href="' + embedData[1] + '" data-width="300"></div></div>'

          callback = function () {
            if (!facebookAttached) {
              facebookAttached = true
              $('<script>')
                .appendTo('body')
                .on('load', function () {
                  FB.Event.subscribe('xfbml.render', function (event) {
                    for (var i = 0; i < facebookPendingWidgets.length; i++) {
                      facebookPendingWidgets[i].$emit('ui_height')
                    }
                    facebookPendingWidgets = []
                  })
                })
                .attr('src', 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&appId=254098051407226&version=v2.0')
            } else if (window.FB) {
              FB.XFBML.parse(element[0])
            }
            facebookPendingWidgets.push($scope)
          }
          break

        case 'gplus':
          html = '<div class="im_message_gplus_embed"><div class="g-post" data-href="' + embedData[1] + '"></div></div>'

          callback = function () {
            if (!gplusAttached) {
              gplusAttached = true

              window.___gcfg = {'parsetags': 'explicit'}
              $('<script>')
                .appendTo('body')
                .on('load', function () {
                  gapi.post.go()
                })
                .attr('src', 'https://apis.google.com/js/plusone.js')
            } else if (window.gapi) {
              gapi.post.go(element[0])
            }
            element.one('load', function () {
              $scope.$emit('ui_height')
            })
          }
          break
      }

      if (html) {
        element[0].innerHTML = html
        if (callback) {
          callback()
        }
      }
    }

    return {
      link: link
    }
  })