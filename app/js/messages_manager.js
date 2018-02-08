/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict'

angular.module('myApp.services')

  .service('AppMessagesManager', function ($q, $rootScope, $location, $filter, $timeout, $sce, ApiUpdatesManager, AppUsersManager, AppChatsManager, AppPeersManager, AppPhotosManager, AppDocsManager, AppStickersManager, AppMessagesIDsManager, DraftsManager, AppWebPagesManager, AppGamesManager, MtpApiManager, MtpApiFileManager, ServerTimeManager, RichTextProcessor, NotificationsManager, Storage, AppProfileManager, TelegramMeWebService, ErrorService, StatusManager, _) {
    var messagesStorage = {}
    var messagesForHistory = {}
    var messagesForDialogs = {}
    var historiesStorage = {}
    var dialogsStorage = {count: null, dialogs: []}
    var pendingByRandomID = {}
    var pendingByMessageID = {}
    var pendingAfterMsgs = {}
    var pendingTopMsgs = {}
    var sendFilePromise = $q.when()
    var tempID = -1
    var tempFinalizeCallbacks = {}

    var dialogsIndex = SearchIndexManager.createIndex()
    var cachedResults = {query: false}

    var lastSearchFilter = {}
    var lastSearchResults = []

    var needSingleMessages = []
    var fetchSingleMessagesTimeout = false

    var incrementedMessageViews = {}
    var needIncrementMessageViews = []
    var incrementMessageViewsTimeout = false

    var maxSeenID = false
    Storage.get('max_seen_msg').then(function (maxID) {
      if (maxID &&
          !AppMessagesIDsManager.getMessageIDInfo(maxID)[1]) {
        maxSeenID = maxID
      }
    })

    var dateOrTimeFilter = $filter('dateOrTime')
    var fwdMessagesPluralize = _.pluralize('conversation_forwarded_X_messages')
    var gameScorePluralize = _.pluralize('conversation_scored_X')

    NotificationsManager.start()

    var allDialogsLoaded = false
    var dialogsOffsetDate = 0
    var pinnedIndex = 0
    var dialogsNum = 0

    var migratedFromTo = {}
    var migratedToFrom = {}

    function getConversations (query, offsetIndex, limit) {
      var curDialogStorage = dialogsStorage
      var isSearch = angular.isString(query) && query.length

      if (isSearch) {
        if (!limit || cachedResults.query !== query) {
          cachedResults.query = query

          var results = SearchIndexManager.search(query, dialogsIndex)

          cachedResults.dialogs = []
          angular.forEach(dialogsStorage.dialogs, function (dialog) {
            if (results[dialog.peerID]) {
              cachedResults.dialogs.push(dialog)
            }
          })
          cachedResults.count = cachedResults.dialogs.length
        }
        curDialogStorage = cachedResults
      } else {
        cachedResults.query = false
      }

      var offset = 0
      if (offsetIndex > 0) {
        for (offset = 0; offset < curDialogStorage.dialogs.length; offset++) {
          if (offsetIndex > curDialogStorage.dialogs[offset].index) {
            break
          }
        }
      }

      limit = limit || 20

      if (
        isSearch ||
        allDialogsLoaded ||
        curDialogStorage.dialogs.length >= offset + limit
      ) {
        return $q.when({
          dialogs: curDialogStorage.dialogs.slice(offset, offset + limit)
        })
      }

      return getTopMessages(limit).then(function () {
        offset = 0
        if (offsetIndex > 0) {
          for (offset = 0; offset < curDialogStorage.dialogs.length; offset++) {
            if (offsetIndex > curDialogStorage.dialogs[offset].index) {
              break
            }
          }
        }
        return {
          dialogs: curDialogStorage.dialogs.slice(offset, offset + limit)
        }
      })
    }

    function getConversation(peerID) {
      var foundDialog = getDialogByPeerID(peerID)
      if (foundDialog.length) {
        return $q.when(foundDialog[0])
      }
      return $q.when({
        peerID: peerID,
        top_message: 0,
        index: generateDialogIndex(generateDialogPinnedDate()),
        pFlags: {}
      })
    }

    function getDialogByPeerID (peerID) {
      for (var i = 0; i < dialogsStorage.dialogs.length; i++) {
        if (dialogsStorage.dialogs[i].peerID == peerID) {
          return [dialogsStorage.dialogs[i], i]
        }
      }

      return []
    }

    function saveConversation (dialog) {
      var peerID = AppPeersManager.getPeerID(dialog.peer)
      if (!peerID) {
        return false
      }
      var channelID = AppPeersManager.isChannel(peerID) ? -peerID : 0
      var peerText = AppPeersManager.getPeerSearchText(peerID)
      SearchIndexManager.indexObject(peerID, peerText, dialogsIndex)

      var isMegagroup = AppPeersManager.isMegagroup(channelID)
      if (dialog.top_message) {
        var mid = AppMessagesIDsManager.getFullMessageID(dialog.top_message, channelID)
        var message = getMessage(mid)
      } else {
        var mid = tempID--
        var message = {
          _: 'message',
          id: mid,
          mid: mid,
          from_id: AppUsersManager.getSelf().id,
          to_id: AppPeersManager.getOutputPeer(peerID),
          deleted: true,
          flags: 0,
          pFlags: {unread: false, out: true},
          date: 0,
          message: ''
        }
        saveMessages([message])
      }
      var offsetDate = message.date

      if (!channelID && peerID < 0) {
        var chat = AppChatsManager.getChat(-peerID)
        if (chat && chat.migrated_to && chat.pFlags.deactivated) {
          var migratedToPeer = AppPeersManager.getPeerID(chat.migrated_to)
          migratedFromTo[peerID] = migratedToPeer
          migratedToFrom[migratedToPeer] = peerID
          return
        }
      }

      dialog.top_message = mid
      dialog.read_inbox_max_id = AppMessagesIDsManager.getFullMessageID(dialog.read_inbox_max_id, channelID)
      dialog.read_outbox_max_id = AppMessagesIDsManager.getFullMessageID(dialog.read_outbox_max_id, channelID)

      var topDate = message.date
      if (channelID) {
        var channel = AppChatsManager.getChat(channelID)
        if (!topDate || channel.date && channel.date > topDate) {
          topDate = channel.date
        }
      }
      var savedDraft = DraftsManager.saveDraft(peerID, dialog.draft)
      if (savedDraft && savedDraft.date > topDate) {
        topDate = savedDraft.date
      }
      if (dialog.pFlags.pinned) {
        topDate = generateDialogPinnedDate()
      }

      dialog.index = generateDialogIndex(topDate)
      dialog.peerID = peerID

      pushDialogToStorage(dialog, offsetDate)

      // Because we saved message without dialog present
      var unreadKey = message.pFlags.out ? 'read_outbox_max_id' : 'read_inbox_max_id'
      if (message.mid && message.mid > dialog[unreadKey]) {
        message.pFlags.unread = true
      }

      if (historiesStorage[peerID] === undefined &&
        !message.deleted) {
        var historyStorage = {count: null, history: [], pending: []}
        historyStorage[mid > 0 ? 'history' : 'pending'].push(mid)
        if (mid < 0 && message.pFlags.unread) {
          dialog.unread_count++
        }
        historiesStorage[peerID] = historyStorage
        if (mergeReplyKeyboard(historyStorage, message)) {
          $rootScope.$broadcast('history_reply_markup', {peerID: peerID})
        }
      }

      NotificationsManager.savePeerSettings(peerID, dialog.notify_settings)

      if (channelID && dialog.pts) {
        ApiUpdatesManager.addChannelState(channelID, dialog.pts)
      }

      if (
        Config.Modes.packed &&
        !channelID &&
        dialog.unread_count > 0 &&
        maxSeenID &&
        dialog.top_message > maxSeenID &&
        message.pFlags.unread &&
        !message.pFlags.out
      ) {
        var notifyPeer = message.flags & 16 ? message.from_id : peerID
        NotificationsManager.getPeerMuted(notifyPeer).then(function (muted) {
          if (!muted) {
            notifyAboutMessage(message)
          }
        })
      }
    }

    function getTopMessages (limit) {
      var first = true
      var dialogs = dialogsStorage.dialogs
      var offsetDate = 0
      var offsetID = 0
      var offsetPeerID = 0
      var offsetIndex = 0
      var flags = 0
      if (dialogsOffsetDate) {
        offsetDate = dialogsOffsetDate + ServerTimeManager.serverTimeOffset
        offsetIndex = dialogsOffsetDate * 0x10000
        flags |= 1
      }
      return MtpApiManager.invokeApi('messages.getDialogs', {
        flags: flags,
        offset_date: offsetDate,
        offset_id: AppMessagesIDsManager.getMessageLocalID(offsetID),
        offset_peer: AppPeersManager.getInputPeerByID(offsetPeerID),
        limit: limit
      }, {
        timeout: 300
      }).then(function (dialogsResult) {
        if (!offsetDate) {
          TelegramMeWebService.setAuthorized(true)
        }

        AppUsersManager.saveApiUsers(dialogsResult.users)
        AppChatsManager.saveApiChats(dialogsResult.chats)
        saveMessages(dialogsResult.messages)

        var maxSeenIdIncremented = offsetDate ? true : false
        var hasPrepend = false
        dialogsResult.dialogs.reverse()
        angular.forEach(dialogsResult.dialogs, function (dialog) {
          saveConversation(dialog)
          if (offsetIndex && dialog.index > offsetIndex) {
            newDialogsToHandle[dialog.peerID] = dialog
            hasPrepend = true
          }

          if (!maxSeenIdIncremented &&
              !AppPeersManager.isChannel(AppPeersManager.getPeerID(dialog.peer))) {
            incrementMaxSeenID(dialog.top_message)
            maxSeenIdIncremented = true
          }
        })
        dialogsResult.dialogs.reverse()

        if (!dialogsResult.dialogs.length ||
          !dialogsResult.count ||
          dialogs.length >= dialogsResult.count) {
          allDialogsLoaded = true
        }

        if (hasPrepend &&
            !newDialogsHandlePromise) {
          newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
        } else {
          $rootScope.$broadcast('dialogs_multiupdate', {})
        }
      })
    }

    function generateDialogPinnedDate() {
      return 0x7fffff00 + ((pinnedIndex++) & 0xff)
    }

    function generateDialogIndex (date) {
      if (date === undefined) {
        date = tsNow(true) + ServerTimeManager.serverTimeOffset
      }
      return (date * 0x10000) + ((++dialogsNum) & 0xFFFF)
    }

    function pushDialogToStorage (dialog, offsetDate) {
      var dialogs = dialogsStorage.dialogs
      var pos = getDialogByPeerID(dialog.peerID)[1]
      if (pos !== undefined) {
        dialogs.splice(pos, 1)
      }

      if (offsetDate &&
          !dialog.pFlags.pinned &&
          (!dialogsOffsetDate || offsetDate < dialogsOffsetDate)) {
        if (pos !== undefined) {
          // So the dialog jumped to the last position
          return false
        }
        dialogsOffsetDate = offsetDate
      }

      var index = dialog.index
      var i
      var len = dialogs.length
      if (!len || index < dialogs[len - 1].index) {
        dialogs.push(dialog)
      }
      else if (index >= dialogs[0].index) {
        dialogs.unshift(dialog)
      }
      else {
        for (i = 0; i < len; i++) {
          if (index > dialogs[i].index) {
            dialogs.splice(i, 0, dialog)
            break
          }
        }
      }
    }

    function requestHistory (peerID, maxID, limit, offset) {
      var isChannel = AppPeersManager.isChannel(peerID)
      var isMegagroup = isChannel && AppPeersManager.isMegagroup(peerID)

      return MtpApiManager.invokeApi('messages.getHistory', {
        peer: AppPeersManager.getInputPeerByID(peerID),
        offset_id: maxID ? AppMessagesIDsManager.getMessageLocalID(maxID) : 0,
        add_offset: offset || 0,
        limit: limit || 0
      }, {
        timeout: 300,
        noErrorBox: true
      }).then(function (historyResult) {
        AppUsersManager.saveApiUsers(historyResult.users)
        AppChatsManager.saveApiChats(historyResult.chats)
        saveMessages(historyResult.messages)

        if (isChannel) {
          ApiUpdatesManager.addChannelState(-peerID, historyResult.pts)
        }

        var length = historyResult.messages.length
        if (length &&
          historyResult.messages[length - 1].deleted) {
          historyResult.messages.splice(length - 1, 1)
          length--
          historyResult.count--
        }

        if (
          peerID < 0 ||
          !AppUsersManager.isBot(peerID) ||
          (length == limit && limit < historyResult.count)
        ) {
          return historyResult
        }

        return AppProfileManager.getProfile(peerID).then(function (userFull) {
          var description = userFull.bot_info && userFull.bot_info.description
          if (description) {
            var messageID = tempID--
            var message = {
              _: 'messageService',
              id: messageID,
              from_id: peerID,
              to_id: AppPeersManager.getOutputPeer(peerID),
              flags: 0,
              pFlags: {},
              date: tsNow(true) + ServerTimeManager.serverTimeOffset,
              action: {
                _: 'messageActionBotIntro',
                description: description
              }
            }
            saveMessages([message])
            historyResult.messages.push(message)
            if (historyResult.count) {
              historyResult.count++
            }
          }
          return historyResult
        })
      }, function (error) {
        switch (error.type) {
          case 'CHANNEL_PRIVATE':
            var channel = AppChatsManager.getChat(-peerID)
            channel = {_: 'channelForbidden', access_hash: channel.access_hash, title: channel.title}
            ApiUpdatesManager.processUpdateMessage({
              _: 'updates',
              updates: [{
                _: 'updateChannel',
                channel_id: -peerID
              }],
              chats: [channel],
              users: []
            })
            break
        }
        return $q.reject(error)
      })
    }

    function fillHistoryStorage (peerID, maxID, fullLimit, historyStorage) {
      // console.log('fill history storage', peerID, maxID, fullLimit, angular.copy(historyStorage))
      var offset = (migratedFromTo[peerID] && !maxID) ? 1 : 0
      return requestHistory(peerID, maxID, fullLimit, offset).then(function (historyResult) {
        historyStorage.count = historyResult.count || historyResult.messages.length

        var offset = 0
        if (!maxID && historyResult.messages.length) {
          maxID = historyResult.messages[0].mid + 1
        }
        if (maxID > 0) {
          for (offset = 0; offset < historyStorage.history.length; offset++) {
            if (maxID > historyStorage.history[offset]) {
              break
            }
          }
        }

        var wasTotalCount = historyStorage.history.length

        historyStorage.history.splice(offset, historyStorage.history.length - offset)
        angular.forEach(historyResult.messages, function (message) {
          if (mergeReplyKeyboard(historyStorage, message)) {
            $rootScope.$broadcast('history_reply_markup', {peerID: peerID})
          }
          historyStorage.history.push(message.mid)
        })

        var totalCount = historyStorage.history.length
        fullLimit -= (totalCount - wasTotalCount)

        var migratedNextPeer = migratedFromTo[peerID]
        var migratedPrevPeer = migratedToFrom[peerID]
        var isMigrated = migratedNextPeer !== undefined || migratedPrevPeer !== undefined

        if (isMigrated) {
          historyStorage.count = Math.max(historyStorage.count, totalCount) + 1
        }

        if (fullLimit > 0) {
          maxID = historyStorage.history[totalCount - 1]
          if (isMigrated) {
            if (!historyResult.messages.length) {
              if (migratedPrevPeer) {
                maxID = 0
                peerID = migratedPrevPeer
              } else {
                historyStorage.count = totalCount
                return true
              }
            }
            return fillHistoryStorage(peerID, maxID, fullLimit, historyStorage)
          }
          else if (totalCount < historyStorage.count) {
            return fillHistoryStorage(peerID, maxID, fullLimit, historyStorage)
          }
        }
        return true
      })
    }

    function wrapHistoryResult (peerID, result) {
      var unreadOffset = result.unreadOffset
      if (unreadOffset) {
        var i
        var message
        for (i = result.history.length - 1; i >= 0; i--) {
          message = messagesStorage[result.history[i]]
          if (message && !message.pFlags.out && message.pFlags.unread) {
            result.unreadOffset = i + 1
            break
          }
        }
      }
      return $q.when(result)
    }

    function migrateChecks (migrateFrom, migrateTo) {
      if (!migratedFromTo[migrateFrom] &&
        !migratedToFrom[migrateTo] &&
        AppChatsManager.hasChat(-migrateTo)) {
        var fromChat = AppChatsManager.getChat(-migrateFrom)
        if (fromChat &&
          fromChat.migrated_to &&
          fromChat.migrated_to.channel_id == -migrateTo) {
          migratedFromTo[migrateFrom] = migrateTo
          migratedToFrom[migrateTo] = migrateFrom

          $timeout(function () {
            var foundDialog = getDialogByPeerID(migrateFrom)
            if (foundDialog.length) {
              dialogsStorage.dialogs.splice(foundDialog[1], 1)
              $rootScope.$broadcast('dialog_drop', {peerID: migrateFrom})
            }
            $rootScope.$broadcast('dialog_migrate', {migrateFrom: migrateFrom, migrateTo: migrateTo})
          }, 100)
        }
      }
    }

    function convertMigratedPeer (peerID) {
      if (migratedFromTo[peerID]) {
        return migratedFromTo[peerID]
      }
    }

    function getHistory (peerID, maxID, limit, backLimit, prerendered) {
      if (migratedFromTo[peerID]) {
        peerID = migratedFromTo[peerID]
      }
      var historyStorage = historiesStorage[peerID]
      var offset = 0
      var offsetNotFound = false
      var unreadOffset = false
      var unreadSkip = false

      prerendered = prerendered ? Math.min(50, prerendered) : 0

      if (historyStorage === undefined) {
        historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []}
      }

      if (maxID < 0) {
        maxID = 0
      }
      var isMigrated = false
      var reqPeerID = peerID
      if (migratedToFrom[peerID]) {
        isMigrated = true
        if (maxID && maxID < AppMessagesIDsManager.fullMsgIDModulus) {
          reqPeerID = migratedToFrom[peerID]
        }
      }

      if (!limit && !maxID) {
        var foundDialog = getDialogByPeerID(peerID)[0]
        if (foundDialog && foundDialog.unread_count > 1) {
          var unreadCount = foundDialog.unread_count
          if (unreadSkip = (unreadCount > 50)) {
            if (foundDialog.read_inbox_max_id) {
              maxID = foundDialog.read_inbox_max_id
              backLimit = 16
              unreadOffset = 16
              limit = 4
            } else {
              limit = 20
              unreadOffset = 16
              offset = unreadCount - unreadOffset
            }
          } else {
            limit = Math.max(10, prerendered, unreadCount + 2)
            unreadOffset = unreadCount
          }
        }
        else if (Config.Mobile) {
          limit = 20
        }
      }
      if (maxID > 0) {
        offsetNotFound = true
        for (offset = 0; offset < historyStorage.history.length; offset++) {
          if (maxID > historyStorage.history[offset]) {
            offsetNotFound = false
            break
          }
        }
      }

      if (!offsetNotFound && (
        historyStorage.count !== null && historyStorage.history.length == historyStorage.count ||
        historyStorage.history.length >= offset + (limit || 1)
        )) {
        if (backLimit) {
          backLimit = Math.min(offset, backLimit)
          offset = Math.max(0, offset - backLimit)
          limit += backLimit
        } else {
          limit = limit || (offset ? 20 : (prerendered || 5))
        }
        var history = historyStorage.history.slice(offset, offset + limit)
        if (!maxID && historyStorage.pending.length) {
          history = historyStorage.pending.slice().concat(history)
        }
        return wrapHistoryResult(peerID, {
          count: historyStorage.count,
          history: history,
          unreadOffset: unreadOffset,
          unreadSkip: unreadSkip
        })
      }

      if (!backLimit && !limit) {
        limit = prerendered || 20
      }
      if (offsetNotFound) {
        offset = 0
      }
      if (backLimit || unreadSkip || maxID && historyStorage.history.indexOf(maxID) == -1) {
        if (backLimit) {
          offset = -backLimit
          limit += backLimit
        }
        return requestHistory(reqPeerID, maxID, limit, offset).then(function (historyResult) {
          historyStorage.count = historyResult.count || historyResult.messages.length
          if (isMigrated) {
            historyStorage.count++
          }

          var history = []
          angular.forEach(historyResult.messages, function (message) {
            history.push(message.mid)
          })
          if (!maxID && historyStorage.pending.length) {
            history = historyStorage.pending.slice().concat(history)
          }

          return wrapHistoryResult(peerID, {
            count: historyStorage.count,
            history: history,
            unreadOffset: unreadOffset,
            unreadSkip: unreadSkip
          })
        })
      }

      return fillHistoryStorage(peerID, maxID, limit, historyStorage).then(function () {
        offset = 0
        if (maxID > 0) {
          for (offset = 0; offset < historyStorage.history.length; offset++) {
            if (maxID > historyStorage.history[offset]) {
              break
            }
          }
        }

        var history = historyStorage.history.slice(offset, offset + limit)
        if (!maxID && historyStorage.pending.length) {
          history = historyStorage.pending.slice().concat(history)
        }

        return wrapHistoryResult(peerID, {
          count: historyStorage.count,
          history: history,
          unreadOffset: unreadOffset,
          unreadSkip: unreadSkip
        })
      })
    }

    function getReplyKeyboard (peerID) {
      return (historiesStorage[peerID] || {}).reply_markup || false
    }

    function mergeReplyKeyboard (historyStorage, message) {
      // console.log('merge', message.mid, message.reply_markup, historyStorage.reply_markup)
      if (!message.reply_markup &&
        !message.pFlags.out &&
        !message.action) {
        return false
      }
      if (message.reply_markup &&
        message.reply_markup._ == 'replyInlineMarkup') {
        return false
      }
      var messageReplyMarkup = message.reply_markup
      var lastReplyMarkup = historyStorage.reply_markup
      if (messageReplyMarkup) {
        if (lastReplyMarkup && lastReplyMarkup.mid >= message.mid) {
          return false
        }
        if (messageReplyMarkup.pFlags.selective &&
          !(message.flags & 16)) {
          return false
        }
        if (historyStorage.maxOutID &&
          message.mid < historyStorage.maxOutID &&
          messageReplyMarkup.pFlags.single_use) {
          messageReplyMarkup.pFlags.hidden = true
        }
        messageReplyMarkup = angular.extend({
          mid: message.mid
        }, messageReplyMarkup)
        if (messageReplyMarkup._ != 'replyKeyboardHide') {
          messageReplyMarkup.fromID = message.from_id
        }
        historyStorage.reply_markup = messageReplyMarkup
        // console.log('set', historyStorage.reply_markup)
        return true
      }

      if (message.pFlags.out) {
        if (lastReplyMarkup) {
          if (lastReplyMarkup.pFlags.single_use &&
            !lastReplyMarkup.pFlags.hidden &&
            (message.mid > lastReplyMarkup.mid || message.mid < 0) &&
            message.message) {
            lastReplyMarkup.pFlags.hidden = true
            // console.log('set', historyStorage.reply_markup)
            return true
          }
        } else if (!historyStorage.maxOutID ||
          message.mid > historyStorage.maxOutID) {
          historyStorage.maxOutID = message.mid
        }
      }

      if (message.action &&
        message.action._ == 'messageActionChatDeleteUser' &&
        (lastReplyMarkup
          ? message.action.user_id == lastReplyMarkup.fromID
          : AppUsersManager.isBot(message.action.user_id)
        )
      ) {
        historyStorage.reply_markup = {
          _: 'replyKeyboardHide',
          mid: message.mid,
          flags: 0,
          pFlags: {}
        }
        // console.log('set', historyStorage.reply_markup)
        return true
      }

      return false
    }

    function getSearch (peerID, query, inputFilter, maxID, limit) {
      peerID = peerID ? parseInt(peerID) : 0
      var foundMsgs = []
      var useSearchCache = !query
      var newSearchFilter = {peer: peerID, filter: inputFilter}
      var sameSearchCache = useSearchCache && angular.equals(lastSearchFilter, newSearchFilter)

      if (useSearchCache && !sameSearchCache) {
        // console.warn(dT(), 'new search filter', lastSearchFilter, newSearchFilter)
        lastSearchFilter = newSearchFilter
        lastSearchResults = []
      }

      // console.log(dT(), 'search', useSearchCache, sameSearchCache, lastSearchResults, maxID)

      if (peerID && !maxID && !query) {
        var historyStorage = historiesStorage[peerID]

        if (historyStorage !== undefined && historyStorage.history.length) {
          var neededContents = {},
            neededDocType
          var neededLimit = limit || 20,
            i
          var message

          switch (inputFilter._) {
            case 'inputMessagesFilterPhotos':
              neededContents['messageMediaPhoto'] = true
              break

            case 'inputMessagesFilterPhotoVideo':
              neededContents['messageMediaPhoto'] = true
              neededContents['messageMediaDocument'] = true
              neededDocType = 'video'
              break

            case 'inputMessagesFilterVideo':
              neededContents['messageMediaDocument'] = true
              neededDocType = 'video'
              break

            case 'inputMessagesFilterDocument':
              neededContents['messageMediaDocument'] = true
              neededDocType = false
              break

            case 'inputMessagesFilterVoice':
              neededContents['messageMediaDocument'] = true
              neededDocType = 'voice'
              break

            case 'inputMessagesFilterRoundVideo':
              neededContents['messageMediaDocument'] = true
              neededDocType = 'round'
              break

            case 'inputMessagesFilterMusic':
              neededContents['messageMediaDocument'] = true
              neededDocType = 'audio'
              break

            case 'inputMessagesFilterUrl':
              neededContents['url'] = true
              break

            case 'inputMessagesFilterMyMentions':
              neededContents['mentioned'] = true
              break

            default:
              return $q.when({
                count: 0,
                history: []
              })
          }
          for (i = 0; i < historyStorage.history.length; i++) {
            message = messagesStorage[historyStorage.history[i]]
            if (message.media && neededContents[message.media._]) {
              if (neededDocType !== undefined &&
                  message.media._ == 'messageMediaDocument' &&
                  message.media.document.type != neededDocType) {
                continue
              }
              foundMsgs.push(message.mid)
              if (foundMsgs.length >= neededLimit) {
                break
              }
            }
          }
        }

        // console.warn(dT(), 'before append', foundMsgs)
        if (foundMsgs.length < neededLimit && lastSearchResults.length && sameSearchCache) {
          var minID = foundMsgs.length ? foundMsgs[foundMsgs.length - 1] : false
          for (var i = 0; i < lastSearchResults.length; i++) {
            if (minID === false || lastSearchResults[i] < minID) {
              foundMsgs.push(lastSearchResults[i])
              if (foundMsgs.length >= neededLimit) {
                break
              }
            }
          }
        }
        // console.warn(dT(), 'after append', foundMsgs)
      }

      if (foundMsgs.length || limit == 1000) {
        if (useSearchCache) {
          lastSearchResults = listMergeSorted(lastSearchResults, foundMsgs)
        }

        return $q.when({
          count: null,
          history: foundMsgs
        })
      }

      var apiPromise

      if (peerID || !query) {
        apiPromise = MtpApiManager.invokeApi('messages.search', {
          flags: 0,
          peer: AppPeersManager.getInputPeerByID(peerID),
          q: query || '',
          filter: inputFilter || {_: 'inputMessagesFilterEmpty'},
          min_date: 0,
          max_date: 0,
          limit: limit || 20,
          offset_id: AppMessagesIDsManager.getMessageLocalID(maxID) || 0,
          add_offset: 0,
          max_id: 0,
          min_id: 0
        }, {
          timeout: 300,
          noErrorBox: true
        })
      } else {
        var offsetDate = 0
        var offsetPeerID = 0
        var offsetID = 0
        var offsetMessage = maxID && getMessage(maxID)

        if (offsetMessage && offsetMessage.date) {
          offsetDate = offsetMessage.date + ServerTimeManager.serverTimeOffset
          offsetID = offsetMessage.id
          offsetPeerID = getMessagePeer(offsetMessage)
        }
        apiPromise = MtpApiManager.invokeApi('messages.searchGlobal', {
          q: query,
          offset_date: offsetDate,
          offset_peer: AppPeersManager.getInputPeerByID(offsetPeerID),
          offset_id: AppMessagesIDsManager.getMessageLocalID(offsetID),
          limit: limit || 20
        }, {
          timeout: 300,
          noErrorBox: true
        })
      }

      return apiPromise.then(function (searchResult) {
        AppUsersManager.saveApiUsers(searchResult.users)
        AppChatsManager.saveApiChats(searchResult.chats)
        saveMessages(searchResult.messages)

        var foundCount = searchResult.count || searchResult.messages.length

        foundMsgs = []
        angular.forEach(searchResult.messages, function (message) {
          var peerID = getMessagePeer(message)
          if (peerID < 0) {
            var chat = AppChatsManager.getChat(-peerID)
            if (chat.migrated_to) {
              migrateChecks(peerID, -chat.migrated_to.channel_id)
            }
          }
          foundMsgs.push(message.mid)
        })

        if (useSearchCache &&
            (!maxID || sameSearchCache && lastSearchResults.indexOf(maxID) >= 0)) {
          lastSearchResults = listMergeSorted(lastSearchResults, foundMsgs)
        }
        // console.log(dT(), 'after API', foundMsgs, lastSearchResults)

        return {
          count: foundCount,
          history: foundMsgs
        }
      }, function (error) {
        if (error.code == 400) {
          error.handled = true
        }
        return $q.reject(error)
      })
    }

    function getMessage (messageID) {
      return messagesStorage[messageID] || {
        _: 'messageEmpty',
        deleted: true,
        pFlags: {out: false, unread: false}
      }
    }

    function canMessageBeEdited(message) {
      var goodMedias = [
        'messageMediaPhoto',
        'messageMediaDocument',
        'messageMediaWebPage',
        'messageMediaPending'
      ]
      if (message._ != 'message' ||
          message.deleted ||
          message.fwd_from ||
          message.via_bot_id ||
          message.media && goodMedias.indexOf(message.media._) == -1 ||
          message.fromID && AppUsersManager.isBot(message.fromID)) {
        return false
      }
      if (message.media &&
          message.media._ == 'messageMediaDocument' &&
          message.media.document.sticker) {
        return false
      }

      return true
    }

    function canEditMessage(messageID) {
      if (!messagesStorage[messageID]) {
        return false
      }
      var message = messagesStorage[messageID]
      if (!message ||
          !message.canBeEdited) {
        return false
      }
      if (getMessagePeer(message) == AppUsersManager.getSelf().id) {
        return true
      }
      if (message.date < tsNow(true) - 2 * 86400 ||
          !message.pFlags.out) {
        return false
      }
      return true
    }

    function getMessageEditData(messageID) {
      if (!canEditMessage(messageID)) {
        return $q.reject()
      }
      var message = getMessage(messageID)
      if (message.media &&
          message.media._ != 'messageMediaEmpty' &&
          message.media._ != 'messageMediaWebPage') {

        return $q.when({
          caption: true,
          text: typeof message.media.caption === 'string' ? message.media.caption : ''
        })
      }

      var text = typeof message.message === 'string' ? message.message : ''
      var entities = RichTextProcessor.parseEntities(text)
      var serverEntities = message.entities || []
      entities = RichTextProcessor.mergeEntities(entities, serverEntities)

      text = RichTextProcessor.wrapDraftText(text, {entities: entities})

      return $q.when({
        caption: false,
        text: text
      })
    }

    function canRevokeMessage(messageID) {
      if (messageID <= 0 ||
          !messagesStorage[messageID]) {
        return false
      }

      var message = messagesStorage[messageID]
      if (message._ != 'message' ||
          message.deleted) {
        return false
      }

      var peerID = getMessagePeer(message)
      if (peerID < 0 && !AppChatsManager.isChannel(-peerID)) {
        var chat = AppChatsManager.getChat(-peerID)
        if (chat.pFlags.creator ||
            chat.pFlags.admins_enabled && chat.pFlags.admin) {
          return true
        }
      }

      if (!message.pFlags.out ||
          message.date < tsNow(true) - 2 * 86400) {
        return false
      }

      return true
    }

    function deleteMessages (messageIDs, revoke) {
      var splitted = AppMessagesIDsManager.splitMessageIDsByChannels(messageIDs)
      var promises = []
      angular.forEach(splitted.msgIDs, function (msgIDs, channelID) {
        var promise
        if (channelID > 0) {
          var channel = AppChatsManager.getChat(channelID)
          if (!channel.pFlags.creator && !(channel.pFlags.editor && channel.pFlags.megagroup)) {
            var goodMsgIDs = []
            if (channel.pFlags.editor || channel.pFlags.megagroup) {
              angular.forEach(msgIDs, function (msgID, i) {
                var message = getMessage(splitted.mids[channelID][i])
                if (message.pFlags.out) {
                  goodMsgIDs.push(msgID)
                }
              })
            }
            if (!goodMsgIDs.length) {
              return
            }
            msgIDs = goodMsgIDs
          }
          promise = MtpApiManager.invokeApi('channels.deleteMessages', {
            channel: AppChatsManager.getChannelInput(channelID),
            id: msgIDs
          }).then(function (affectedMessages) {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updateShort',
              update: {
                _: 'updateDeleteChannelMessages',
                channel_id: channelID,
                messages: msgIDs,
                pts: affectedMessages.pts,
                pts_count: affectedMessages.pts_count
              }
            })
          })
        } else {
          var flags = 0
          if (revoke) {
            flags |= 1
          }
          promise = MtpApiManager.invokeApi('messages.deleteMessages', {
            flags: flags,
            id: msgIDs
          }).then(function (affectedMessages) {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updateShort',
              update: {
                _: 'updateDeleteMessages',
                messages: msgIDs,
                pts: affectedMessages.pts,
                pts_count: affectedMessages.pts_count
              }
            })
          })
        }
        promises.push(promise)
      })

      return $q.all(promises)
    }

    function getMessageShareLink (fullMsgID) {
      var info = AppMessagesIDsManager.getMessageIDInfo(fullMsgID)
      var msgID = info[0]
      var channelID = info[1]
      if (!channelID) {
        return $q.reject()
      }
      var message = getMessage(fullMsgID)
      var channel = AppChatsManager.getChat(channelID)
      if (!message ||
          !message.pFlags ||
          !message.pFlags.post ||
          !channel.username) {
        return $q.reject()
      }
      return MtpApiManager.invokeApi('channels.exportMessageLink', {
        channel: AppChatsManager.getChannelInput(channelID),
        id: msgID
      }).then(function (exportedMessageLink) {
        return exportedMessageLink.link
      })
    }

    function readHistory (peerID) {
      // console.trace('start read')
      var isChannel = AppPeersManager.isChannel(peerID)
      var historyStorage = historiesStorage[peerID]
      var foundDialog = getDialogByPeerID(peerID)[0]

      if (!foundDialog || !foundDialog.unread_count) {
        if (!historyStorage || !historyStorage.history.length) {
          return false
        }

        var messageID,
          message
        var foundUnread = false
        for (i = historyStorage.history.length; i >= 0; i--) {
          messageID = historyStorage.history[i]
          message = messagesStorage[messageID]
          if (message && !message.pFlags.out && message.pFlags.unread) {
            foundUnread = true
            break
          }
        }
        if (!foundUnread) {
          return false
        }
      }

      if (historyStorage.readPromise) {
        return historyStorage.readPromise
      }

      var apiPromise
      if (isChannel) {
        apiPromise = MtpApiManager.invokeApi('channels.readHistory', {
          channel: AppChatsManager.getChannelInput(-peerID),
          max_id: 0
        })
      } else {
        apiPromise = MtpApiManager.invokeApi('messages.readHistory', {
          peer: AppPeersManager.getInputPeerByID(peerID),
          max_id: 0
        }).then(function (affectedMessages) {
          ApiUpdatesManager.processUpdateMessage({
            _: 'updateShort',
            update: {
              _: 'updatePts',
              pts: affectedMessages.pts,
              pts_count: affectedMessages.pts_count
            }
          })
        })
      }

      historyStorage.readPromise = apiPromise.then(function () {
        if (foundDialog) {
          // console.log('done read history', peerID)
          foundDialog.unread_count = 0
          $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: 0})
          $rootScope.$broadcast('messages_read')
          if (historyStorage && historyStorage.history.length) {
            foundDialog.read_inbox_max_id = historyStorage.history[0]
          }
        }
      })['finally'](function () {
        delete historyStorage.readPromise
      })

      if (historyStorage && historyStorage.history.length) {
        var messageID
        var message, i
        var peerID, foundDialog
        var dialog
        for (i = 0; i < historyStorage.history.length; i++) {
          messageID = historyStorage.history[i]
          message = messagesStorage[messageID]
          if (message && !message.pFlags.out) {
            message.pFlags.unread = false
            if (messagesForHistory[messageID]) {
              messagesForHistory[messageID].pFlags.unread = false
            }
            if (messagesForDialogs[messageID]) {
              messagesForDialogs[messageID].pFlags.unread = false
            }
            NotificationsManager.cancel('msg' + messageID)
          }
        }
      }

      NotificationsManager.soundReset(AppPeersManager.getPeerString(peerID))

      return historyStorage.readPromise
    }

    function readMessages (messageIDs) {
      var splitted = AppMessagesIDsManager.splitMessageIDsByChannels(messageIDs)
      angular.forEach(splitted.msgIDs, function (msgIDs, channelID) {
        if (channelID > 0) {
          MtpApiManager.invokeApi('channels.readMessageContents', {
            channel: AppChatsManager.getChannelInput(channelID),
            id: msgIDs
          }).then(function () {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updateShort',
              update: {
                _: 'updateChannelReadMessagesContents',
                channel_id: channelID,
                messages: msgIDs
              }
            })
          })
        } else {
          MtpApiManager.invokeApi('messages.readMessageContents', {
            id: msgIDs
          }).then(function (affectedMessages) {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updateShort',
              update: {
                _: 'updateReadMessagesContents',
                messages: msgIDs,
                pts: affectedMessages.pts,
                pts_count: affectedMessages.pts_count
              }
            })
          })
        }
      })


    }

    function doFlushHistory (inputPeer, justClear) {
      var flags = 0
      if (justClear) {
        flags |= 1
      }
      return MtpApiManager.invokeApi('messages.deleteHistory', {
        flags: flags,
        peer: inputPeer,
        max_id: 0
      }).then(function (affectedHistory) {
        ApiUpdatesManager.processUpdateMessage({
          _: 'updateShort',
          update: {
            _: 'updatePts',
            pts: affectedHistory.pts,
            pts_count: affectedHistory.pts_count
          }
        })
        if (!affectedHistory.offset) {
          return true
        }
        return doFlushHistory(inputPeer, justClear)
      })
    }

    function flushHistory (peerID, justClear) {
      if (AppPeersManager.isChannel(peerID)) {
        return getHistory(peerID, false, 1).then(function (historyResult) {
          var channelID = -peerID
          var maxID = AppMessagesIDsManager.getMessageLocalID(historyResult.history[0] || 0)
          return MtpApiManager.invokeApi('channels.deleteHistory', {
            channel: AppChatsManager.getChannelInput(channelID),
            max_id: maxID
          }).then(function () {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updateShort',
              update: {
                _: 'updateChannelAvailableMessages',
                channel_id: channelID,
                available_min_id: maxID
              }
            })
            return true
          })
        })
      }
      return doFlushHistory(AppPeersManager.getInputPeerByID(peerID), justClear).then(function () {
        if (justClear) {
          $rootScope.$broadcast('dialog_flush', {peerID: peerID})
        } else {
          var foundDialog = getDialogByPeerID(peerID)
          if (foundDialog[0]) {
            dialogsStorage.dialogs.splice(foundDialog[1], 1)
          }
          delete historiesStorage[peerID]
          $rootScope.$broadcast('dialog_drop', {peerID: peerID})
        }
      })
    }

    function saveMessages (apiMessages, options) {
      options = options || {}
      angular.forEach(apiMessages, function (apiMessage) {
        if (apiMessage.pFlags === undefined) {
          apiMessage.pFlags = {}
        }
        if (!apiMessage.pFlags.out) {
          apiMessage.pFlags.out = false
        }
        if (!apiMessage.pFlags.unread) {
          apiMessage.pFlags.unread = false
        }
        if (apiMessage._ == 'messageEmpty') {
          return
        }

        var peerID = getMessagePeer(apiMessage)
        var isChannel = apiMessage.to_id._ == 'peerChannel'
        var channelID = isChannel ? -peerID : 0
        var isBroadcast = isChannel && AppChatsManager.isBroadcast(channelID)

        var mid = AppMessagesIDsManager.getFullMessageID(apiMessage.id, channelID)
        apiMessage.mid = mid

        var dialog = getDialogByPeerID(peerID)[0]
        if (dialog && mid > 0) {
          var dialogKey = apiMessage.pFlags.out
            ? 'read_outbox_max_id'
            : 'read_inbox_max_id'

          apiMessage.pFlags.unread = mid > dialog[dialogKey]
        }
        else if (options.isNew) {
          apiMessage.pFlags.unread = true
        }
        // console.log(dT(), 'msg unread', mid, apiMessage.pFlags.out, dialog && dialog[apiMessage.pFlags.out ? 'read_outbox_max_id' : 'read_inbox_max_id'])

        if (apiMessage.reply_to_msg_id) {
          apiMessage.reply_to_mid = AppMessagesIDsManager.getFullMessageID(apiMessage.reply_to_msg_id, channelID)
        }

        apiMessage.date -= ServerTimeManager.serverTimeOffset

        apiMessage.peerID = peerID
        apiMessage.fromID = apiMessage.pFlags.post ? peerID : apiMessage.from_id

        var fwdHeader = apiMessage.fwd_from
        if (fwdHeader) {
          if (peerID == AppUsersManager.getSelf().id) {
            if (fwdHeader.saved_from_peer && fwdHeader.saved_from_msg_id) {
              var savedFromPeerID = AppPeersManager.getPeerID(fwdHeader.saved_from_peer)
              var savedFromMid = AppMessagesIDsManager.getFullMessageID(fwdHeader.saved_from_msg_id, AppPeersManager.isChannel(savedFromPeerID) ? -savedFromPeerID : 0)
              apiMessage.savedFrom = savedFromPeerID + '_' + savedFromMid
            }
            apiMessage.fromID = fwdHeader.channel_id ? -fwdHeader.channel_id : fwdHeader.from_id
          } else {
            apiMessage.fwdFromID = fwdHeader.channel_id ? -fwdHeader.channel_id : fwdHeader.from_id
            apiMessage.fwdPostID = fwdHeader.channel_post
          }
          fwdHeader.date -= ServerTimeManager.serverTimeOffset
        }

        if (apiMessage.via_bot_id > 0) {
          apiMessage.viaBotID = apiMessage.via_bot_id
        }

        var mediaContext = {
          user_id: apiMessage.fromID,
          date: apiMessage.date
        }

        if (apiMessage.media) {
          switch (apiMessage.media._) {
            case 'messageMediaEmpty':
              delete apiMessage.media
              break
            case 'messageMediaPhoto':
              if (apiMessage.media.ttl_seconds) {
                apiMessage.media = {_: 'messageMediaUnsupportedWeb'}
              } else {
                AppPhotosManager.savePhoto(apiMessage.media.photo, mediaContext)
              }
              break
            case 'messageMediaDocument':
              if (apiMessage.media.ttl_seconds) {
                apiMessage.media = {_: 'messageMediaUnsupportedWeb'}
              } else {
                AppDocsManager.saveDoc(apiMessage.media.document, mediaContext)
              }
              break
            case 'messageMediaWebPage':
              AppWebPagesManager.saveWebPage(apiMessage.media.webpage, apiMessage.mid, mediaContext)
              break
            case 'messageMediaGame':
              AppGamesManager.saveGame(apiMessage.media.game, apiMessage.mid, mediaContext)
              apiMessage.media.handleMessage = true
              break
            case 'messageMediaInvoice':
              apiMessage.media = {_: 'messageMediaUnsupportedWeb'}
              break
            case 'messageMediaGeoLive':
              apiMessage.media._ = 'messageMediaGeo'
              break
          }
        }
        if (apiMessage.action) {
          var migrateFrom
          var migrateTo
          switch (apiMessage.action._) {
            case 'messageActionChatEditPhoto':
              AppPhotosManager.savePhoto(apiMessage.action.photo, mediaContext)
              if (isBroadcast) {
                apiMessage.action._ = 'messageActionChannelEditPhoto'
              }
              break

            case 'messageActionChatEditTitle':
              if (isBroadcast) {
                apiMessage.action._ = 'messageActionChannelEditTitle'
              }
              break

            case 'messageActionChatDeletePhoto':
              if (isBroadcast) {
                apiMessage.action._ = 'messageActionChannelDeletePhoto'
              }
              break

            case 'messageActionChatAddUser':
              if (apiMessage.action.users.length == 1) {
                apiMessage.action.user_id = apiMessage.action.users[0]
                if (apiMessage.fromID == apiMessage.action.user_id) {
                  if (isChannel) {
                    apiMessage.action._ = 'messageActionChatJoined'
                  } else {
                    apiMessage.action._ = 'messageActionChatReturn'
                  }
                }
              }
              else if (apiMessage.action.users.length > 1) {
                apiMessage.action._ = 'messageActionChatAddUsers'
              }
              break

            case 'messageActionChatDeleteUser':
              if (apiMessage.fromID == apiMessage.action.user_id) {
                apiMessage.action._ = 'messageActionChatLeave'
              }
              break

            case 'messageActionChannelMigrateFrom':
              migrateFrom = -apiMessage.action.chat_id
              migrateTo = -channelID
              break

            case 'messageActionChatMigrateTo':
              migrateFrom = -channelID
              migrateTo = -apiMessage.action.channel_id
              break

            case 'messageActionHistoryClear':
              apiMessage.deleted = true
              apiMessage.clear_history = true
              apiMessage.pFlags.out = false
              apiMessage.pFlags.unread = false
              break

            case 'messageActionPhoneCall':
              delete apiMessage.fromID
              apiMessage.action.type = 
                (apiMessage.pFlags.out ? 'out_' : 'in_') +
                (
                  apiMessage.action.reason._ == 'phoneCallDiscardReasonMissed' ||
                  apiMessage.action.reason._ == 'phoneCallDiscardReasonBusy'
                     ? 'missed'
                     : 'ok'
                )
              break
          }
          
          if (migrateFrom &&
              migrateTo &&
              !migratedFromTo[migrateFrom] &&
              !migratedToFrom[migrateTo]) {
            migrateChecks(migrateFrom, migrateTo)
          }
        }

        if (apiMessage.message && apiMessage.message.length) {
          var myEntities = RichTextProcessor.parseEntities(apiMessage.message)
          var apiEntities = apiMessage.entities || []
          apiMessage.totalEntities = RichTextProcessor.mergeEntities(myEntities, apiEntities, !apiMessage.pending)
        }

        apiMessage.canBeEdited = canMessageBeEdited(apiMessage)

        if (!options.isEdited) {
          messagesStorage[mid] = apiMessage
        }
      })
    }

    function sendText (peerID, text, options) {
      if (!angular.isString(text)) {
        return
      }
      peerID = AppPeersManager.getPeerMigratedTo(peerID) || peerID
      options = options || {}
      var entities = options.entities || []
      if (!options.viaBotID) {
        text = RichTextProcessor.parseMarkdown(text, entities)
      }
      if (!text.length) {
        return
      }

      var sendEntites = getInputEntities(entities)
      var messageID = tempID--
      var randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)]
      var randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString()
      var historyStorage = historiesStorage[peerID]
      var flags = 0
      var pFlags = {}
      var replyToMsgID = options.replyToMsgID
      var isChannel = AppPeersManager.isChannel(peerID)
      var isMegagroup = isChannel && AppPeersManager.isMegagroup(peerID)
      var asChannel = isChannel && !isMegagroup ? true : false
      var message

      if (historyStorage === undefined) {
        historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []}
      }

      var fromID = AppUsersManager.getSelf().id
      if (peerID != fromID) {
        flags |= 2
        pFlags.out = true
        if (!isChannel && !AppUsersManager.isBot(peerID)) {
          flags |= 1
          pFlags.unread = true
        }
      }
      if (replyToMsgID) {
        flags |= 8
      }
      if (asChannel) {
        fromID = 0
        pFlags.post = true
      } else {
        flags |= 256
      }
      message = {
        _: 'message',
        id: messageID,
        from_id: fromID,
        to_id: AppPeersManager.getOutputPeer(peerID),
        flags: flags,
        pFlags: pFlags,
        date: tsNow(true) + ServerTimeManager.serverTimeOffset,
        message: text,
        random_id: randomIDS,
        reply_to_msg_id: replyToMsgID,
        via_bot_id: options.viaBotID,
        reply_markup: options.reply_markup,
        entities: entities,
        views: asChannel && 1,
        pending: true
      }

      var toggleError = function (on) {
        var historyMessage = messagesForHistory[messageID]
        if (on) {
          message.error = true
          if (historyMessage) {
            historyMessage.error = true
          }
        } else {
          delete message.error
          if (historyMessage) {
            delete historyMessage.error
          }
        }
        $rootScope.$broadcast('messages_pending')
      }

      message.send = function () {
        toggleError(false)
        var sentRequestOptions = {}
        if (pendingAfterMsgs[peerID]) {
          sentRequestOptions.afterMessageID = pendingAfterMsgs[peerID].messageID
        }
        var flags = 0
        if (replyToMsgID) {
          flags |= 1
        }
        if (asChannel) {
          flags |= 16
        }
        if (options.clearDraft) {
          flags |= 128
        }
        var apiPromise
        if (options.viaBotID) {
          apiPromise = MtpApiManager.invokeApi('messages.sendInlineBotResult', {
            flags: flags,
            peer: AppPeersManager.getInputPeerByID(peerID),
            random_id: randomID,
            reply_to_msg_id: AppMessagesIDsManager.getMessageLocalID(replyToMsgID),
            query_id: options.queryID,
            id: options.resultID
          }, sentRequestOptions)
        } else {
          if (sendEntites.length) {
            flags |= 8
          }
          apiPromise = MtpApiManager.invokeApi('messages.sendMessage', {
            flags: flags,
            peer: AppPeersManager.getInputPeerByID(peerID),
            message: text,
            random_id: randomID,
            reply_to_msg_id: AppMessagesIDsManager.getMessageLocalID(replyToMsgID),
            entities: sendEntites
          }, sentRequestOptions)
        }
        // console.log(flags, entities)
        apiPromise.then(function (updates) {
          if (updates._ == 'updateShortSentMessage') {
            message.flags = updates.flags
            message.date = updates.date
            message.id = updates.id
            message.media = updates.media
            message.entities = updates.entities
            updates = {
              _: 'updates',
              users: [],
              chats: [],
              seq: 0,
              updates: [{
                _: 'updateMessageID',
                random_id: randomIDS,
                id: updates.id
              }, {
                _: isChannel
                      ? 'updateNewChannelMessage'
                      : 'updateNewMessage',
                message: message,
                pts: updates.pts,
                pts_count: updates.pts_count
              }]
            }
          }
          else if (updates.updates) {
            angular.forEach(updates.updates, function (update) {
              if (update._ == 'updateDraftMessage') {
                update.local = true
              }
            })
          }
          // Testing bad situations
          // var upd = angular.copy(updates)
          // updates.updates.splice(0, 1)

          ApiUpdatesManager.processUpdateMessage(updates)

          // $timeout(function () {
          // ApiUpdatesManager.processUpdateMessage(upd)
          // }, 5000)
        }, function (error) {
          toggleError(true)
        })['finally'](function () {
          if (pendingAfterMsgs[peerID] === sentRequestOptions) {
            delete pendingAfterMsgs[peerID]
          }
        })

        pendingAfterMsgs[peerID] = sentRequestOptions
      }

      saveMessages([message])
      historyStorage.pending.unshift(messageID)
      $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID, my: true})

      setZeroTimeout(message.send)
      // setTimeout(function () {
      //   message.send()
      // }, 5000)

      if (options.clearDraft) {
        DraftsManager.clearDraft(peerID)
      }

      pendingByRandomID[randomIDS] = [peerID, messageID]
    }

    function sendFile (peerID, file, options) {
      peerID = AppPeersManager.getPeerMigratedTo(peerID) || peerID
      options = options || {}
      var messageID = tempID--
      var randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)]
      var randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString()
      var historyStorage = historiesStorage[peerID]
      var flags = 0
      var pFlags = {}
      var replyToMsgID = options.replyToMsgID
      var isChannel = AppPeersManager.isChannel(peerID)
      var isMegagroup = isChannel && AppPeersManager.isMegagroup(peerID)
      var asChannel = isChannel && !isMegagroup ? true : false
      var attachType, apiFileName
      var realFileName

      if (!options.isMedia) {
        attachType = 'document'
        apiFileName = 'document.' + file.type.split('/')[1]
      } else if (['image/jpeg', 'image/png', 'image/bmp'].indexOf(file.type) >= 0) {
        attachType = 'photo'
        apiFileName = 'photo.' + file.type.split('/')[1]
      } else if (file.type.substr(0, 6) == 'audio/' || ['video/ogg'].indexOf(file.type) >= 0) {
        attachType = 'audio'
        apiFileName = 'audio.' + (file.type.split('/')[1] == 'ogg' ? 'ogg' : 'mp3')
      } else if (file.type.substr(0, 6) == 'video/') {
        attachType = 'video'
        apiFileName = 'video.mp4'
      } else {
        attachType = 'document'
        apiFileName = 'document.' + file.type.split('/')[1]
      }

      // console.log(attachType, apiFileName, file.type)

      if (historyStorage === undefined) {
        historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []}
      }

      var fromID = AppUsersManager.getSelf().id
      if (peerID != fromID) {
        flags |= 2
        pFlags.out = true
        if (!isChannel && !AppUsersManager.isBot(peerID)) {
          flags |= 1
          pFlags.unread = true
        }
      }
      if (replyToMsgID) {
        flags |= 8
      }
      if (asChannel) {
        fromID = 0
        pFlags.post = true
      } else {
        flags |= 256
      }
      var media = {
        _: 'messageMediaPending',
        type: attachType,
        file_name: file.name || apiFileName,
        size: file.size,
        progress: {percent: 1, total: file.size}
      }

      var message = {
        _: 'message',
        id: messageID,
        from_id: fromID,
        to_id: AppPeersManager.getOutputPeer(peerID),
        flags: flags,
        pFlags: pFlags,
        date: tsNow(true) + ServerTimeManager.serverTimeOffset,
        message: '',
        media: media,
        random_id: randomIDS,
        reply_to_msg_id: replyToMsgID,
        views: asChannel && 1,
        pending: true
      }

      var toggleError = function (on) {
        var historyMessage = messagesForHistory[messageID]
        if (on) {
          message.error = true
          if (historyMessage) {
            historyMessage.error = true
          }
        } else {
          delete message.error
          if (historyMessage) {
            delete historyMessage.error
          }
        }
        $rootScope.$broadcast('messages_pending')
      }

      var uploaded = false,
        uploadPromise

      message.send = function () {
        var sendFileDeferred = $q.defer()

        sendFilePromise.then(function () {
          if (!uploaded || message.error) {
            uploaded = false
            uploadPromise = MtpApiFileManager.uploadFile(file)
          }

          uploadPromise.then(function (inputFile) {
            inputFile.name = apiFileName
            uploaded = true
            var inputMedia
            switch (attachType) {
              case 'photo':
                inputMedia = {_: 'inputMediaUploadedPhoto', flags: 0, file: inputFile}
                break

              case 'document':
              default:
                inputMedia = {_: 'inputMediaUploadedDocument', file: inputFile, mime_type: file.type, caption: '', attributes: [
                    {_: 'documentAttributeFilename', file_name: file.name}
                ]}
            }
            var flags = 0
            if (replyToMsgID) {
              flags |= 1
            }
            if (asChannel) {
              flags |= 16
            }
            MtpApiManager.invokeApi('messages.sendMedia', {
              flags: flags,
              peer: AppPeersManager.getInputPeerByID(peerID),
              media: inputMedia,
              random_id: randomID,
              reply_to_msg_id: AppMessagesIDsManager.getMessageLocalID(replyToMsgID)
            }).then(function (updates) {
              ApiUpdatesManager.processUpdateMessage(updates)
            }, function (error) {
              if (attachType == 'photo' &&
                error.code == 400 &&
                (error.type == 'PHOTO_INVALID_DIMENSIONS' ||
                error.type == 'PHOTO_SAVE_FILE_INVALID')) {
                error.handled = true
                attachType = 'document'
                message.send()
                return
              }
              toggleError(true)
            })
          }, function (error) {
            toggleError(true)
          }, function (progress) {
            // console.log('upload progress', progress)
            media.progress.done = progress.done
            media.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total))
            $rootScope.$broadcast('history_update', {peerID: peerID})
          })

          media.progress.cancel = function () {
            if (!uploaded) {
              sendFileDeferred.resolve()
              uploadPromise.cancel()
              cancelPendingMessage(randomIDS)
            }
          }

          uploadPromise['finally'](function () {
            sendFileDeferred.resolve()
          })
        })

        sendFilePromise = sendFileDeferred.promise
      }

      saveMessages([message])
      historyStorage.pending.unshift(messageID)
      $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID, my: true})

      setZeroTimeout(message.send)

      pendingByRandomID[randomIDS] = [peerID, messageID]
    }

    function sendOther (peerID, inputMedia, options) {
      peerID = AppPeersManager.getPeerMigratedTo(peerID) || peerID
      options = options || {}

      var messageID = tempID--
      var randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)]
      var randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString()
      var historyStorage = historiesStorage[peerID]
      var replyToMsgID = options.replyToMsgID
      var isChannel = AppPeersManager.isChannel(peerID)
      var isMegagroup = isChannel && AppPeersManager.isMegagroup(peerID)
      var asChannel = isChannel && !isMegagroup ? true : false

      if (historyStorage === undefined) {
        historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []}
      }

      var fromID = AppUsersManager.getSelf().id
      var media
      switch (inputMedia._) {
        case 'inputMediaPhoto':
          media = {
            _: 'messageMediaPhoto',
            photo: AppPhotosManager.getPhoto(inputMedia.id.id),
            caption: inputMedia.caption || ''
          }
          break

        case 'inputMediaDocument':
          var doc = AppDocsManager.getDoc(inputMedia.id.id)
          if (doc.sticker && doc.stickerSetInput) {
            AppStickersManager.pushPopularSticker(doc.id)
          }
          media = {
            _: 'messageMediaDocument',
            'document': doc,
            caption: inputMedia.caption || ''
          }
          break

        case 'inputMediaContact':
          media = {
            _: 'messageMediaContact',
            phone_number: inputMedia.phone_number,
            first_name: inputMedia.first_name,
            last_name: inputMedia.last_name,
            user_id: 0
          }
          break

        case 'inputMediaGeoPoint':
          media = {
            _: 'messageMediaGeo',
            geo: {
              _: 'geoPoint',
              'lat': inputMedia.geo_point['lat'],
              'long': inputMedia.geo_point['long']
            }
          }
          break

        case 'inputMediaVenue':
          media = {
            _: 'messageMediaVenue',
            geo: {
              _: 'geoPoint',
              'lat': inputMedia.geo_point['lat'],
              'long': inputMedia.geo_point['long']
            },
            title: inputMedia.title,
            address: inputMedia.address,
            provider: inputMedia.provider,
            venue_id: inputMedia.venue_id
          }
          break

        case 'messageMediaPending':
          media = inputMedia
          break
      }

      var flags = 0
      var pFlags = {}
      if (peerID != fromID) {
        flags |= 2
        pFlags.out = true
        if (!AppUsersManager.isBot(peerID)) {
          flags |= 1
          pFlags.unread = true
        }
      }
      if (replyToMsgID) {
        flags |= 8
      }
      if (asChannel) {
        fromID = 0
        pFlags.post = true
      } else {
        flags |= 256
      }

      var message = {
        _: 'message',
        id: messageID,
        from_id: fromID,
        to_id: AppPeersManager.getOutputPeer(peerID),
        flags: flags,
        pFlags: pFlags,
        date: tsNow(true) + ServerTimeManager.serverTimeOffset,
        message: '',
        media: media,
        random_id: randomIDS,
        reply_to_msg_id: replyToMsgID,
        via_bot_id: options.viaBotID,
        reply_markup: options.reply_markup,
        views: asChannel && 1,
        pending: true
      }

      var toggleError = function (on) {
        var historyMessage = messagesForHistory[messageID]
        if (on) {
          message.error = true
          if (historyMessage) {
            historyMessage.error = true
          }
        } else {
          delete message.error
          if (historyMessage) {
            delete historyMessage.error
          }
        }
        $rootScope.$broadcast('messages_pending')
      }

      message.send = function () {
        var flags = 0
        if (replyToMsgID) {
          flags |= 1
        }
        if (asChannel) {
          flags |= 16
        }
        if (options.clearDraft) {
          flags |= 128
        }

        var sentRequestOptions = {}
        if (pendingAfterMsgs[peerID]) {
          sentRequestOptions.afterMessageID = pendingAfterMsgs[peerID].messageID
        }

        var apiPromise
        if (options.viaBotID) {
          apiPromise = MtpApiManager.invokeApi('messages.sendInlineBotResult', {
            flags: flags,
            peer: AppPeersManager.getInputPeerByID(peerID),
            random_id: randomID,
            reply_to_msg_id: AppMessagesIDsManager.getMessageLocalID(replyToMsgID),
            query_id: options.queryID,
            id: options.resultID
          }, sentRequestOptions)
        } else {
          apiPromise = MtpApiManager.invokeApi('messages.sendMedia', {
            flags: flags,
            peer: AppPeersManager.getInputPeerByID(peerID),
            media: inputMedia,
            random_id: randomID,
            reply_to_msg_id: AppMessagesIDsManager.getMessageLocalID(replyToMsgID)
          }, sentRequestOptions)
        }
        apiPromise.then(function (updates) {
          if (updates.updates) {
            angular.forEach(updates.updates, function (update) {
              if (update._ == 'updateDraftMessage') {
                update.local = true
              }
            })
          }
          ApiUpdatesManager.processUpdateMessage(updates)
        }, function (error) {
          toggleError(true)
        })['finally'](function () {
          if (pendingAfterMsgs[peerID] === sentRequestOptions) {
            delete pendingAfterMsgs[peerID]
          }
        })
        pendingAfterMsgs[peerID] = sentRequestOptions
      }

      saveMessages([message])
      historyStorage.pending.unshift(messageID)
      $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID, my: true})

      setZeroTimeout(message.send)

      if (options.clearDraft) {
        DraftsManager.clearDraft(peerID)
      }

      pendingByRandomID[randomIDS] = [peerID, messageID]
    }

    function forwardMessages (peerID, mids, options) {
      peerID = AppPeersManager.getPeerMigratedTo(peerID) || peerID
      mids = mids.sort()
      options = options || {}

      var flags = 0
      var isChannel = AppPeersManager.isChannel(peerID)
      var isMegagroup = isChannel && AppPeersManager.isMegagroup(peerID)
      var asChannel = isChannel && !isMegagroup ? true : false

      if (asChannel) {
        flags |= 16
      }
      if (options.withMyScore) {
        flags |= 256
      }

      var splitted = AppMessagesIDsManager.splitMessageIDsByChannels(mids)
      var promises = []
      angular.forEach(splitted.msgIDs, function (msgIDs, channelID) {
        var len = msgIDs.length
        var randomIDs = []
        for (var i = 0; i < len; i++) {
          randomIDs.push([nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)])
        }
        var sentRequestOptions = {}
        if (pendingAfterMsgs[peerID]) {
          sentRequestOptions.afterMessageID = pendingAfterMsgs[peerID].messageID
        }
        var promise = MtpApiManager.invokeApi('messages.forwardMessages', {
          flags: flags,
          from_peer: AppPeersManager.getInputPeerByID(-channelID),
          id: msgIDs,
          random_id: randomIDs,
          to_peer: AppPeersManager.getInputPeerByID(peerID)
        }, sentRequestOptions).then(function (updates) {
          ApiUpdatesManager.processUpdateMessage(updates)
        })['finally'](function () {
          if (pendingAfterMsgs[peerID] === sentRequestOptions) {
            delete pendingAfterMsgs[peerID]
          }
        })
        pendingAfterMsgs[peerID] = sentRequestOptions
        promises.push(promise)
      })

      return $q.all(promises)
    }

    function startBot (botID, chatID, startParam) {
      var peerID = chatID ? -chatID : botID
      if (startParam) {
        var randomID = bigint(nextRandomInt(0xFFFFFFFF)).shiftLeft(32).add(bigint(nextRandomInt(0xFFFFFFFF))).toString()

        return MtpApiManager.invokeApi('messages.startBot', {
          bot: AppUsersManager.getUserInput(botID),
          peer: AppPeersManager.getInputPeerByID(peerID),
          random_id: randomID,
          start_param: startParam
        }).then(function (updates) {
          ApiUpdatesManager.processUpdateMessage(updates)
        })
      }

      if (chatID) {
        if (AppChatsManager.isChannel(chatID)) {
          return MtpApiManager.invokeApi('channels.inviteToChannel', {
            channel: AppChatsManager.getChannelInput(chatID),
            users: [AppUsersManager.getUserInput(botID)]
          }).then(function (updates) {
            ApiUpdatesManager.processUpdateMessage(updates)
            sendText(peerID, '/start@' + bot.username)
          }, function (error) {
            if (error && error.type == 'USER_ALREADY_PARTICIPANT') {
              var bot = AppUsersManager.getUser(botID)
              sendText(peerID, '/start@' + bot.username)
              error.handled = true
            }
          })
        } else {
          return MtpApiManager.invokeApi('messages.addChatUser', {
            chat_id: AppChatsManager.getChatInput(chatID),
            user_id: AppUsersManager.getUserInput(botID)
          }).then(function (updates) {
            ApiUpdatesManager.processUpdateMessage(updates)
            sendText(peerID, '/start@' + bot.username)
          }, function (error) {
            if (error && error.type == 'USER_ALREADY_PARTICIPANT') {
              var bot = AppUsersManager.getUser(botID)
              sendText(peerID, '/start@' + bot.username)
              error.handled = true
            }
          })
        }
      }

      return sendText(peerID, '/start')
    }

    function shareGame (botID, peerID, inputGame) {
      var randomID = bigint(nextRandomInt(0xFFFFFFFF)).shiftLeft(32).add(bigint(nextRandomInt(0xFFFFFFFF))).toString()
      return MtpApiManager.invokeApi('messages.sendMedia', {
        flags: 0,
        peer: AppPeersManager.getInputPeerByID(peerID),
        media: {
          _: 'inputMediaGame',
          id: inputGame
        },
        random_id: randomID
      }).then(function (updates) {
        ApiUpdatesManager.processUpdateMessage(updates)
      })
    }

    function cancelPendingMessage (randomID) {
      var pendingData = pendingByRandomID[randomID]

      console.log('pending', randomID, pendingData)

      if (pendingData) {
        var peerID = pendingData[0]
        var tempID = pendingData[1]
        var historyStorage = historiesStorage[peerID]
        var pos = historyStorage.pending.indexOf(tempID)

        ApiUpdatesManager.processUpdateMessage({
          _: 'updateShort',
          update: {
            _: 'updateDeleteMessages',
            messages: [tempID]
          }
        })

        if (pos != -1) {
          historyStorage.pending.splice(pos, 1)
        }

        delete messagesForHistory[tempID]
        delete messagesStorage[tempID]

        return true
      }

      return false
    }

    function finalizePendingMessage (randomID, finalMessage) {
      var pendingData = pendingByRandomID[randomID]
      // console.log('pdata', randomID, pendingData)

      if (pendingData) {
        var peerID = pendingData[0]
        var tempID = pendingData[1]
        var historyStorage = historiesStorage[peerID],
          message,
          historyMessage

        // console.log('pending', randomID, historyStorage.pending)
        var pos = historyStorage.pending.indexOf(tempID)
        if (pos != -1) {
          historyStorage.pending.splice(pos, 1)
        }

        if (message = messagesStorage[tempID]) {
          delete message.pending
          delete message.error
          delete message.random_id
          delete message.send
        }

        if (historyMessage = messagesForHistory[tempID]) {
          messagesForHistory[finalMessage.mid] = angular.extend(historyMessage, wrapForHistory(finalMessage.mid))
          delete historyMessage.pending
          delete historyMessage.error
          delete historyMessage.random_id
          delete historyMessage.send

          $rootScope.$broadcast('messages_pending')
        }

        delete messagesForHistory[tempID]
        delete messagesStorage[tempID]

        finalizePendingMessageCallbacks(tempID, finalMessage.mid)

        return message
      }

      return false
    }

    function finalizePendingMessageCallbacks(tempID, mid) {
      var callbacks = tempFinalizeCallbacks[tempID]
      console.warn(dT(), callbacks, tempID)
      if (callbacks !== undefined) {
        angular.forEach(callbacks, function (callback) {
          callback(mid)
        })
        delete tempFinalizeCallbacks[tempID]
      }
    }

    function getInputEntities(entities) {
      var sendEntites = angular.copy(entities)
      angular.forEach(sendEntites, function (entity) {
        if (entity._ == 'messageEntityMentionName') {
          entity._ = 'inputMessageEntityMentionName'
          entity.user_id = AppUsersManager.getUserInput(entity.user_id)
        }
      })
      return sendEntites
    }

    function editMessage(messageID, text) {
      if (!angular.isString(text) ||
          !canEditMessage(messageID)) {
        return $q.reject()
      }
      if (messageID < 0) {
        if (tempFinalizeCallbacks[messageID] === undefined) {
          tempFinalizeCallbacks[messageID] = {}
        }
        var deferred = $q.defer()
        tempFinalizeCallbacks[messageID].edit = function (mid) {
          console.log('invoke callback', mid)
          editMessage(mid, text).then(function (result) {
            deferred.resolve(result)
          }, function (error) {
            deferred.reject(error)
          })
        }
        return deferred.promise
      }
      var entities = []
      text = RichTextProcessor.parseMarkdown(text, entities)

      var message = getMessage(messageID)
      var peerID = getMessagePeer(message)
      var flags = 8 | (1 << 11)

      return MtpApiManager.invokeApi('messages.editMessage', {
        flags: flags,
        peer: AppPeersManager.getInputPeerByID(peerID),
        id: AppMessagesIDsManager.getMessageLocalID(messageID),
        message: text,
        entities: getInputEntities(entities)
      }).then(function (updates) {
        ApiUpdatesManager.processUpdateMessage(updates)
      }, function (error) {
        if (error &&
            error.type == 'MESSAGE_NOT_MODIFIED') {
          error.handled = true
          return
        }
        if (error &&
            error.type == 'MESSAGE_EMPTY') {
          error.handled = true
        }
        return $q.reject(error)
      })
    }

    function getMessagePeer (message) {
      var toID = message.to_id && AppPeersManager.getPeerID(message.to_id) || 0

      if (toID < 0) {
        return toID
      } else if (message.pFlags && message.pFlags.out || message.flags & 2) {
        return toID
      }
      return message.from_id
    }

    function wrapForDialog (msgID, dialog) {
      var useCache = msgID && dialog !== undefined
      var unreadCount = dialog && dialog.unread_count

      if (useCache && messagesForDialogs[msgID] !== undefined) {
        delete messagesForDialogs[msgID].typing
        messagesForDialogs[msgID].unreadCount = unreadCount
        return messagesForDialogs[msgID]
      }

      var message = angular.copy(messagesStorage[msgID])

      if (!message || !message.to_id) {
        if (dialog && dialog.peerID) {
          message = {
            _: 'message',
            to_id: AppPeersManager.getOutputPeer(dialog.peerID),
            deleted: true,
            date: tsNow(true),
            pFlags: {out: true}
          }
        } else {
          return message
        }
      }

      message.peerID = getMessagePeer(message)
      message.peerData = AppPeersManager.getPeer(message.peerID)
      message.peerString = AppPeersManager.getPeerString(message.peerID)
      message.unreadCount = unreadCount
      message.index = dialog && dialog.index || (message.date * 0x10000)
      message.pinned = dialog && dialog.pFlags.pinned || false

      if (message._ == 'messageService' && message.action.user_id) {
        message.action.user = AppUsersManager.getUser(message.action.user_id)
      }

      if (message.message && message.message.length) {
        message.richMessage = RichTextProcessor.wrapRichText(message.message.substr(0, 128), {noLinks: true, noLinebreaks: true})
      }

      message.dateText = dateOrTimeFilter(message.date)

      if (useCache) {
        message.draft = DraftsManager.getServerDraft(message.peerID)
        messagesForDialogs[msgID] = message
      }

      return message
    }

    function wrapSingleMessage (msgID) {
      if (messagesStorage[msgID]) {
        return wrapForDialog(msgID)
      }
      if (needSingleMessages.indexOf(msgID) == -1) {
        needSingleMessages.push(msgID)
        if (fetchSingleMessagesTimeout === false) {
          fetchSingleMessagesTimeout = setTimeout(fetchSingleMessages, 100)
        }
      }
      return {mid: msgID, loading: true}
    }

    function clearDialogCache (msgID) {
      delete messagesForDialogs[msgID]
    }

    function wrapForHistory (msgID) {
      if (messagesForHistory[msgID] !== undefined) {
        return messagesForHistory[msgID]
      }

      var message = angular.copy(messagesStorage[msgID]) || {id: msgID}

      if (message.media && message.media.progress !== undefined) {
        message.media.progress = messagesStorage[msgID].media.progress
      }

      var fromUser = message.from_id && AppUsersManager.getUser(message.from_id)
      var fromBot = fromUser && fromUser.pFlags.bot && fromUser.username || false
      var withBot = (fromBot ||
        message.to_id && (
        message.to_id.chat_id ||
        message.to_id.user_id && AppUsersManager.isBot(message.to_id.user_id)
      )
      )

      if (message.media) {
        if (message.media.caption &&
          message.media.caption.length) {
          message.media.rCaption = RichTextProcessor.wrapRichText(message.media.caption, {
            noCommands: !withBot,
            fromBot: fromBot
          })
        }

        switch (message.media._) {
          case 'messageMediaPhoto':
            message.media.photo = AppPhotosManager.wrapForHistory(message.media.photo.id)
            break

          case 'messageMediaDocument':
            message.media.document = AppDocsManager.wrapForHistory(message.media.document.id)
            break

          case 'messageMediaGeo':
            var mapUrl = 'https://maps.google.com/?q=' + message.media.geo['lat'] + ',' + message.media.geo['long']
            message.media.mapUrl = $sce.trustAsResourceUrl(mapUrl)
            break

          case 'messageMediaVenue':
            var mapUrl
            if (message.media.provider == 'foursquare' &&
              message.media.venue_id) {
              mapUrl = 'https://foursquare.com/v/' + encodeURIComponent(message.media.venue_id)
            } else {
              mapUrl = 'https://maps.google.com/?q=' + message.media.geo['lat'] + ',' + message.media.geo['long']
            }
            message.media.mapUrl = $sce.trustAsResourceUrl(mapUrl)
            break

          case 'messageMediaContact':
            message.media.rFullName = RichTextProcessor.wrapRichText(
              message.media.first_name + ' ' + (message.media.last_name || ''),
              {noLinks: true, noLinebreaks: true}
            )
            break

          case 'messageMediaWebPage':
            if (!message.media.webpage ||
              message.media.webpage._ == 'webPageEmpty') {
              delete message.media
              break
            }
            message.media.webpage = AppWebPagesManager.wrapForHistory(message.media.webpage.id)
            break

          case 'messageMediaGame':
            message.media.game = AppGamesManager.wrapForHistory(message.media.game.id)
            break
        }
      }
      else if (message.action) {
        switch (message.action._) {
          case 'messageActionChatEditPhoto':
          case 'messageActionChannelEditPhoto':
            message.action.photo = AppPhotosManager.wrapForHistory(message.action.photo.id)
            break

          case 'messageActionChatCreate':
          case 'messageActionChatEditTitle':
          case 'messageActionChannelCreate':
          case 'messageActionChannelEditTitle':
            message.action.rTitle = RichTextProcessor.wrapRichText(message.action.title, {noLinebreaks: true}) || _('chat_title_deleted')
            break

          case 'messageActionBotIntro':
            message.action.rDescription = RichTextProcessor.wrapRichText(message.action.description, {
              noCommands: !withBot,
              fromBot: fromBot
            })
            break
        }
      }

      return messagesForHistory[msgID] = message
    }

    function wrapReplyMarkup (replyMarkup, fromID) {
      if (!replyMarkup ||
        replyMarkup._ == 'replyKeyboardHide') {
        return false
      }
      if (replyMarkup.wrapped) {
        return replyMarkup
      }
      var isInline = replyMarkup._ == 'replyInlineMarkup'
      var count = replyMarkup.rows && replyMarkup.rows.length || 0
      if (!isInline &&
        count > 0 &&
        count <= 4 &&
        !(replyMarkup.pFlags && replyMarkup.pFlags.resize)) {
        replyMarkup.splitCount = count
      }
      replyMarkup.wrapped = true
      angular.forEach(replyMarkup.rows, function (markupRow) {
        angular.forEach(markupRow.buttons, function (markupButton) {
          markupButton.rText = RichTextProcessor.wrapRichText(markupButton.text, {noLinks: true, noLinebreaks: true})
          if (markupButton._ == 'keyboardButtonUrl') {
            var from = AppUsersManager.getUser(fromID)
            var unsafe = !(from && from.pFlags && from.pFlags.verified)
            markupButton.pUrl = RichTextProcessor.wrapUrl(markupButton.url, unsafe)
          }
        })
      })
      return replyMarkup
    }

    function wrapMessageText(msgID) {
      var message = getMessage(msgID)
      var fromUser = message.from_id && AppUsersManager.getUser(message.from_id)
      var fromBot = fromUser && fromUser.pFlags.bot && fromUser.username || false
      var toPeerID = AppPeersManager.getPeerID(message.to_id)
      var withBot = (
        fromBot ||
        AppPeersManager.isBot(toPeerID) ||
        AppPeersManager.isAnyGroup(toPeerID)
      )

      var options = {
        noCommands: !withBot,
        fromBot: fromBot,
        entities: message.totalEntities
      }
      if (message.pFlags.mentioned) {
        var user = AppUsersManager.getSelf()
        if (user) {
          options.highlightUsername = user.username
        }
      }
      return RichTextProcessor.wrapRichText(message.message, options)
    }

    function fetchSingleMessages () {
      if (fetchSingleMessagesTimeout !== false) {
        clearTimeout(fetchSingleMessagesTimeout)
        fetchSingleMessagesTimeout = false
      }
      if (!needSingleMessages.length) {
        return
      }
      var mids = needSingleMessages.slice()
      needSingleMessages = []

      var splitted = AppMessagesIDsManager.splitMessageIDsByChannels(mids)
      angular.forEach(splitted.msgIDs, function (msgIDs, channelID) {
        var promise
        if (channelID > 0) {
          promise = MtpApiManager.invokeApi('channels.getMessages', {
            channel: AppChatsManager.getChannelInput(channelID),
            id: msgIDs
          })
        } else {
          promise = MtpApiManager.invokeApi('messages.getMessages', {
            id: msgIDs
          })
        }

        promise.then(function (getMessagesResult) {
          AppUsersManager.saveApiUsers(getMessagesResult.users)
          AppChatsManager.saveApiChats(getMessagesResult.chats)
          saveMessages(getMessagesResult.messages)

          $rootScope.$broadcast('messages_downloaded', splitted.mids[channelID])
        })
      })
    }

    function incrementMessageViews () {
      if (incrementMessageViewsTimeout !== false) {
        clearTimeout(incrementMessageViewsTimeout)
        incrementMessageViewsTimeout = false
      }
      if (!needIncrementMessageViews.length) {
        return
      }
      var mids = needIncrementMessageViews.slice()
      needIncrementMessageViews = []

      var splitted = AppMessagesIDsManager.splitMessageIDsByChannels(mids)
      angular.forEach(splitted.msgIDs, function (msgIDs, channelID) {
        // console.log('increment', msgIDs, channelID)
        MtpApiManager.invokeApi('messages.getMessagesViews', {
          peer: AppPeersManager.getInputPeerByID(-channelID),
          id: msgIDs,
          increment: true
        }).then(function (views) {
          if (channelID) {
            var mids = splitted.mids[channelID]
            var updates = []
            for (var i = 0; i < mids.length; i++) {
              updates.push({
                _: 'updateChannelMessageViews',
                channel_id: channelID,
                id: mids[i],
                views: views[i]
              })
            }
            ApiUpdatesManager.processUpdateMessage({
              _: 'updates',
              updates: updates,
              chats: [],
              users: []
            })
          }
        })
      })
    }

    function regroupWrappedHistory (history, limit) {
      if (!history || !history.length) {
        return false
      }
      var start = 0
      var len = history.length
      var end = len,
        i, curDay
      var prevDay, curMessage
      var prevMessage, curGrouped
      var prevGrouped
      var wasUpdated = false
      var groupFwd = !Config.Mobile

      if (limit > 0) {
        end = Math.min(limit, len)
      } else if (limit < 0) {
        start = Math.max(0, end + limit)
      }

      for (i = start; i < end; i++) {
        if (history[i].deleted) {
          history.splice(i, 1)
          end--
          continue
        }
        curMessage = history[i]
        curDay = Math.floor((curMessage.date + ServerTimeManager.midnightOffset) / 86400)

        prevGrouped = prevMessage && prevMessage.grouped
        curGrouped = curMessage.grouped

        if (curDay === prevDay) {
          if (curMessage.needDate) {
            delete curMessage.needDate
            wasUpdated = true
          }
        } else if (!i || prevMessage) {
          if (!curMessage.needDate) {
            curMessage.needDate = true
            wasUpdated = true
          }
        }

        if (curMessage.fwdFromID &&
          curMessage.media &&
          curMessage.media.document &&
          (curMessage.media.document.sticker || curMessage.media.document.audioTitle) &&
          (curMessage.fromID != (prevMessage || {}).fromID || !(prevMessage || {}).fwdFromID)) {
          delete curMessage.fwdFromID
          curMessage._ = 'message'
        }

        if (curMessage.views &&
            !incrementedMessageViews[curMessage.mid]) {
          incrementedMessageViews[curMessage.mid] = true
          needIncrementMessageViews.push(curMessage.mid)
          if (incrementMessageViewsTimeout === false) {
            incrementMessageViewsTimeout = setTimeout(incrementMessageViews, 10000)
          }
        }

        if ((!AppPeersManager.isBroadcast(getMessagePeer(curMessage)) || curMessage.fwdFromID) &&
            prevMessage &&
            prevMessage.fromID == curMessage.fromID &&
            !prevMessage.fwdFromID == !curMessage.fwdFromID &&
            prevMessage.viaBotID == curMessage.viaBotID &&
            !prevMessage.action &&
            !curMessage.action &&
            curMessage.date < prevMessage.date + 900) {
          var singleLine = curMessage.message && curMessage.message.length < 70 && curMessage.message.indexOf('\n') == -1 && !curMessage.reply_to_mid
          if (groupFwd &&
            curMessage.fwdFromID &&
            curMessage.fwdFromID == prevMessage.fwdFromID &&
            curMessage.viaBotID == prevMessage.viaBotID) {
            curMessage.grouped = singleLine ? 'im_grouped_fwd_short' : 'im_grouped_fwd'
          } else {
            curMessage.grouped = !curMessage.fwdFromID && singleLine ? 'im_grouped_short' : 'im_grouped'
          }
          if (groupFwd && curMessage.fwdFromID) {
            if (!prevMessage.grouped) {
              prevMessage.grouped = 'im_grouped_fwd_start'
            }
            if (curMessage.grouped && i == len - 1) {
              curMessage.grouped += ' im_grouped_fwd_end'
            }
          }
        } else if (prevMessage || !i) {
          delete curMessage.grouped

          if (groupFwd && prevMessage && prevMessage.grouped && prevMessage.fwdFromID) {
            prevMessage.grouped += ' im_grouped_fwd_end'
          }
        }
        if (!wasUpdated && prevGrouped != (prevMessage && prevMessage.grouped)) {
          wasUpdated = true
        }
        prevMessage = curMessage
        prevDay = curDay
      }
      if (!wasUpdated && curGrouped != (prevMessage && prevMessage.grouped)) {
        wasUpdated = true
      }

      return wasUpdated
    }

    function getMessageThumb (message, thumbWidth, thumbHeight) {
      var thumbPhotoSize
      var sticker = false
      if (message.media) {
        switch (message.media._) {
          case 'messageMediaPhoto':
            thumbPhotoSize = AppPhotosManager.choosePhotoSize(message.media.photo, thumbWidth, thumbHeight)
            break

          case 'messageMediaDocument':
            thumbPhotoSize = message.media.document.thumb
            if (message.media.document.sticker) {
              sticker = true
            }
            break
        }
      }

      if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
        var dim = calcImageInBox(thumbPhotoSize.w, thumbPhotoSize.h, thumbWidth, thumbHeight, true)

        var thumb = {
          width: dim.w,
          height: dim.h,
          location: thumbPhotoSize.location,
          size: thumbPhotoSize.size
        }
        if (sticker) {
          thumb.location.sticker = true
        }

        return thumb
      }

      return false
    }

    function incrementMaxSeenID (maxID) {
      if (!maxID || !(!maxSeenID || maxID > maxSeenID)) {
        return false
      }
      Storage.set({
        max_seen_msg: maxID
      })
      MtpApiManager.invokeApi('messages.receivedMessages', {
        max_id: maxID
      })
    }

    function notifyAboutMessage (message, options) {
      options = options || {}

      var peerID = getMessagePeer(message)
      var peerString
      var notification = {}
      var notificationMessage = false,
        notificationPhoto

      var notifySettings = NotificationsManager.getNotifySettings()

      if (message.fwdFromID && options.fwd_count) {
        notificationMessage = fwdMessagesPluralize(options.fwd_count)
      } else if (message.message) {
        if (notifySettings.nopreview) {
          notificationMessage = _('conversation_message_sent')
        } else {
          notificationMessage = RichTextProcessor.wrapPlainText(message.message)
        }
      } else if (message.media) {
        var captionEmoji = false;
        switch (message.media._) {
          case 'messageMediaPhoto':
            notificationMessage = _('conversation_media_photo_raw')
            captionEmoji = '🖼'
            break
          case 'messageMediaDocument':
            switch (message.media.document.type) {
              case 'gif':
                notificationMessage = _('conversation_media_gif_raw')
                captionEmoji = '🎬'
                break
              case 'sticker':
                notificationMessage = _('conversation_media_sticker')
                var stickerEmoji = message.media.document.stickerEmojiRaw
                if (stickerEmoji !== undefined) {
                  notificationMessage = RichTextProcessor.wrapPlainText(stickerEmoji) + ' ' + notificationMessage
                }
                break
              case 'video':
                notificationMessage = _('conversation_media_video_raw')
                captionEmoji = '📹'
                break
              case 'round':
                notificationMessage = _('conversation_media_round_raw')
                captionEmoji = '📹'
                break
              case 'voice':
              case 'audio':
                notificationMessage = _('conversation_media_audio_raw')
                break
              default:
                if (message.media.document.file_name) {
                  notificationMessage = RichTextProcessor.wrapPlainText('📎 ' + message.media.document.file_name)
                } else {
                  notificationMessage = _('conversation_media_document_raw')
                  captionEmoji = '📎'
                }
                break
            }
            break

          case 'messageMediaGeo':
          case 'messageMediaVenue':
            notificationMessage = _('conversation_media_location_raw')
            captionEmoji = '📍'
            break
          case 'messageMediaContact':
            notificationMessage = _('conversation_media_contact_raw')
            break
          case 'messageMediaGame':
            notificationMessage = RichTextProcessor.wrapPlainText('🎮 ' + message.media.game.title)
            break
          case 'messageMediaUnsupported':
            notificationMessage = _('conversation_media_unsupported_raw')
            break
          default:
            notificationMessage = _('conversation_media_attachment_raw')
            break
        }

        if (captionEmoji !== false &&
            message.media.caption) {
          notificationMessage = RichTextProcessor.wrapPlainText(captionEmoji + ' ' + message.media.caption)
        }
      } else if (message._ == 'messageService') {
        switch (message.action._) {
          case 'messageActionChatCreate':
            notificationMessage = _('conversation_group_created_raw')
            break
          case 'messageActionChatEditTitle':
            notificationMessage = _('conversation_group_renamed_raw')
            break
          case 'messageActionChatEditPhoto':
            notificationMessage = _('conversation_group_photo_updated_raw')
            break
          case 'messageActionChatDeletePhoto':
            notificationMessage = _('conversation_group_photo_removed_raw')
            break
          case 'messageActionChatAddUser':
          case 'messageActionChatAddUsers':
            notificationMessage = _('conversation_invited_user_message_raw')
            break
          case 'messageActionChatReturn':
            notificationMessage = _('conversation_returned_to_group_raw')
            break
          case 'messageActionChatJoined':
            notificationMessage = _('conversation_joined_group_raw')
            break
          case 'messageActionChatDeleteUser':
            notificationMessage = _('conversation_kicked_user_message_raw')
            break
          case 'messageActionChatLeave':
            notificationMessage = _('conversation_left_group_raw')
            break
          case 'messageActionChatJoinedByLink':
            notificationMessage = _('conversation_joined_by_link_raw')
            break
          case 'messageActionChannelCreate':
            notificationMessage = _('conversation_created_channel_raw')
            break
          case 'messageActionChannelEditTitle':
            notificationMessage = _('conversation_changed_channel_name_raw')
            break
          case 'messageActionChannelEditPhoto':
            notificationMessage = _('conversation_changed_channel_photo_raw')
            break
          case 'messageActionChannelDeletePhoto':
            notificationMessage = _('conversation_removed_channel_photo_raw')
            break
          case 'messageActionPinMessage':
            notificationMessage = _('conversation_pinned_message_raw')
            break
          case 'messageActionGameScore':
            notificationMessage = gameScorePluralize(message.action.score)
            break

          case 'messageActionPhoneCall':
            switch (message.action.type) {
              case 'out_missed':
                notificationMessage = _('message_service_phonecall_canceled_raw')
                break
              case 'in_missed':
                notificationMessage = _('message_service_phonecall_missed_raw')
                break
              case 'out_ok':
                notificationMessage = _('message_service_phonecall_outgoing_raw')
                break
              case 'in_ok':
                notificationMessage = _('message_service_phonecall_incoming_raw')
                break
            }
            break
        }
      }

      if (peerID > 0) {
        var fromUser = AppUsersManager.getUser(message.from_id)
        var fromPhoto = AppUsersManager.getUserPhoto(message.from_id)

        notification.title = (fromUser.first_name || '') +
          (fromUser.first_name && fromUser.last_name ? ' ' : '') +
          (fromUser.last_name || '')
        if (!notification.title) {
          notification.title = fromUser.phone || _('conversation_unknown_user_raw')
        }

        notificationPhoto = fromPhoto

        peerString = AppUsersManager.getUserString(peerID)
      } else {
        notification.title = AppChatsManager.getChat(-peerID).title || _('conversation_unknown_chat_raw')

        if (message.from_id > 0) {
          var fromUser = AppUsersManager.getUser(message.from_id)
          notification.title = (fromUser.first_name || fromUser.last_name || _('conversation_unknown_user_raw')) +
          ' @ ' +
          notification.title
        }

        notificationPhoto = AppChatsManager.getChatPhoto(-peerID)

        peerString = AppChatsManager.getChatString(-peerID)
      }

      notification.title = RichTextProcessor.wrapPlainText(notification.title)

      notification.onclick = function () {
        $rootScope.$broadcast('history_focus', {
          peerString: peerString,
          messageID: message.flags & 16 ? message.mid : 0
        })
      }

      notification.message = notificationMessage
      notification.key = 'msg' + message.mid
      notification.tag = peerString
      notification.silent = message.pFlags.silent || false

      if (notificationPhoto.location && !notificationPhoto.location.empty) {
        MtpApiFileManager.downloadSmallFile(notificationPhoto.location, notificationPhoto.size).then(function (blob) {
          if (message.pFlags.unread) {
            notification.image = blob
            NotificationsManager.notify(notification)
          }
        })
      } else {
        NotificationsManager.notify(notification)
      }
    }

    var newMessagesHandlePromise = false
    var newMessagesToHandle = {}
    var newDialogsHandlePromise = false
    var newDialogsToHandle = {}
    var notificationsHandlePromise = false
    var notificationsToHandle = {}
    var newUpdatesAfterReloadToHandle = {}

    function handleNewMessages () {
      $timeout.cancel(newMessagesHandlePromise)
      newMessagesHandlePromise = false
      $rootScope.$broadcast('history_multiappend', newMessagesToHandle)
      newMessagesToHandle = {}
    }

    function handleNewDialogs () {
      $timeout.cancel(newDialogsHandlePromise)
      newDialogsHandlePromise = false
      var newMaxSeenID = 0
      angular.forEach(newDialogsToHandle, function (dialog, peerID) {
        if (dialog.reload) {
          reloadConversation(peerID)
          delete newDialogsToHandle[peerID]
        } else {
          pushDialogToStorage(dialog)
          if (!AppPeersManager.isChannel(peerID)) {
            newMaxSeenID = Math.max(newMaxSeenID, dialog.top_message || 0)
          }
        }
      })
      if (newMaxSeenID !== false) {
        incrementMaxSeenID(newMaxSeenID)
      }
      $rootScope.$broadcast('dialogs_multiupdate', newDialogsToHandle)
      newDialogsToHandle = {}
    }

    function handleNotifications () {
      $timeout.cancel(notificationsHandlePromise)
      notificationsHandlePromise = false

      var timeout = $rootScope.idle.isIDLE && StatusManager.isOtherDeviceActive() ? 30000 : 1000
      angular.forEach(notificationsToHandle, function (notifyPeerToHandle) {
        notifyPeerToHandle.isMutedPromise.then(function (muted) {
          var topMessage = notifyPeerToHandle.top_message
          if (muted ||
            !topMessage.pFlags.unread) {
            return
          }
          setTimeout(function () {
            if (topMessage.pFlags.unread) {
              notifyAboutMessage(topMessage, {
                fwd_count: notifyPeerToHandle.fwd_count
              })
            }
          }, timeout)
        })
      })

      notificationsToHandle = {}
    }

    function handleUpdate(update) {
      switch (update._) {
        case 'updateMessageID':
          var randomID = update.random_id
          var pendingData = pendingByRandomID[randomID]
          if (pendingData) {
            var peerID = pendingData[0]
            var tempID = pendingData[1]
            var channelID = AppPeersManager.isChannel(peerID) ? -peerID : 0
            var mid = AppMessagesIDsManager.getFullMessageID(update.id, channelID)
            var message = messagesStorage[mid]
            if (message) {
              var historyStorage = historiesStorage[peerID]
              var pos = historyStorage.pending.indexOf(tempID)
              if (pos != -1) {
                historyStorage.pending.splice(pos, 1)
              }
              delete messagesForHistory[tempID]
              delete messagesStorage[tempID]

              var msgs = {}
              msgs[tempID] = true

              $rootScope.$broadcast('history_delete', {peerID: peerID, msgs: msgs})

              finalizePendingMessageCallbacks(tempID, finalMessage.mid)
            } else {
              pendingByMessageID[mid] = randomID
            }
          }
          break

        case 'updateNewMessage':
        case 'updateNewChannelMessage':
          var message = update.message
          var peerID = getMessagePeer(message)
          var historyStorage = historiesStorage[peerID]
          var foundDialog = getDialogByPeerID(peerID)

          if (!foundDialog.length) {
            newDialogsToHandle[peerID] = {reload: true}
            if (!newDialogsHandlePromise) {
              newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
            }
            if (newUpdatesAfterReloadToHandle[peerID] === undefined) {
              newUpdatesAfterReloadToHandle[peerID] = []
            }
            newUpdatesAfterReloadToHandle[peerID].push(update)
            break
          }

          if (update._ == 'updateNewChannelMessage') {
            var chat = AppChatsManager.getChat(-peerID)
            if (chat.pFlags && (chat.pFlags.left || chat.pFlags.kicked)) {
              break
            }
          }

          saveMessages([message], {isNew: true})
          // console.warn(dT(), 'message unread', message.mid, message.pFlags.unread)

          if (historyStorage === undefined) {
           historyStorage = historiesStorage[peerID] = {
              count: null,
              history: [],
              pending: []
            }
          }

          var history = message.mid > 0 ? historyStorage.history : historyStorage.pending
          if (history.indexOf(message.mid) != -1) {
            return false
          }
          var topMsgID = history[0]
          history.unshift(message.mid)
          if (message.mid > 0 && message.mid < topMsgID) {
            history.sort(function (a, b) {
              return b - a
            })
          }
          if (message.mid > 0 &&
              historyStorage.count !== null) {
            historyStorage.count++
          }

          if (mergeReplyKeyboard(historyStorage, message)) {
            $rootScope.$broadcast('history_reply_markup', {peerID: peerID})
          }

          if (!message.pFlags.out && message.from_id) {
            AppUsersManager.forceUserOnline(message.from_id)
          }

          var randomID = pendingByMessageID[message.mid],
            pendingMessage

          if (randomID) {
            if (pendingMessage = finalizePendingMessage(randomID, message)) {
              $rootScope.$broadcast('history_update', {peerID: peerID})
            }
            delete pendingByMessageID[message.mid]
          }

          if (!pendingMessage) {
            if (newMessagesToHandle[peerID] === undefined) {
              newMessagesToHandle[peerID] = []
            }
            newMessagesToHandle[peerID].push(message.mid)
            if (!newMessagesHandlePromise) {
              newMessagesHandlePromise = $timeout(handleNewMessages, 0)
            }
          }

          var inboxUnread = !message.pFlags.out && message.pFlags.unread
          var dialog = foundDialog[0]
          dialog.top_message = message.mid
          if (inboxUnread) {
            dialog.unread_count++
          }
          if (!dialog.pFlags.pinned || !dialog.index) {
            dialog.index = generateDialogIndex(message.date)
          }

          newDialogsToHandle[peerID] = dialog
          if (!newDialogsHandlePromise) {
            newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
          }

          if (inboxUnread &&
              ($rootScope.selectedPeerID != peerID || $rootScope.idle.isIDLE)) {
            var notifyPeer = message.flags & 16 ? message.from_id : peerID
            var notifyPeerToHandle = notificationsToHandle[notifyPeer]
            if (notifyPeerToHandle === undefined) {
              notifyPeerToHandle = notificationsToHandle[notifyPeer] = {
                isMutedPromise: NotificationsManager.getPeerMuted(notifyPeer),
                fwd_count: 0,
                from_id: 0
              }
            }

            if (notifyPeerToHandle.from_id != message.from_id) {
              notifyPeerToHandle.from_id = message.from_id
              notifyPeerToHandle.fwd_count = 0
            }
            if (message.fwdFromID) {
              notifyPeerToHandle.fwd_count++
            }

            notifyPeerToHandle.top_message = message

            if (!notificationsHandlePromise) {
              notificationsHandlePromise = $timeout(handleNotifications, 1000)
            }
          }
          break

        case 'updateDialogPinned':
          var peerID = AppPeersManager.getPeerID(update.peer)
          var foundDialog = getDialogByPeerID(peerID)

          if (!foundDialog.length || !update.pFlags.pinned) {
            newDialogsToHandle[peerID] = {reload: true}
            if (!newDialogsHandlePromise) {
              newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
            }
            break
          }

          var dialog = foundDialog[0]
          dialog.index = generateDialogIndex(generateDialogPinnedDate())
          dialog.pFlags.pinned = true
          break

        case 'updatePinnedDialogs':
          var changedDialogs = {}
          var newPinned = {}
          if (!update.order) {
            MtpApiManager.invokeApi('messages.getPinnedDialogs', {}).then(function (dialogsResult) {
              dialogsResult.dialogs.reverse()
              applyConversations(dialogsResult)
              angular.forEach(dialogsResult.dialogs, function (dialog) {
                newPinned[dialog.peerID] = true
              })
              angular.forEach(dialogsStorage.dialogs, function (dialog) {
                var peerID = dialog.peerID
                if (dialog.pFlags.pinned && !newPinned[peerID]) {
                  newDialogsToHandle[peerID] = {reload: true}
                  if (!newDialogsHandlePromise) {
                    newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
                  }
                }
              })
            })
            break
          }
          update.order.reverse()
          angular.forEach(update.order, function (peer) {
            var peerID = AppPeersManager.getPeerID(peer)
            newPinned[peerID] = true

            var foundDialog = getDialogByPeerID(peerID)

            if (!foundDialog.length) {
              newDialogsToHandle[peerID] = {reload: true}
              if (!newDialogsHandlePromise) {
                newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
              }
              return
            }

            var dialog = foundDialog[0]
            dialog.index = generateDialogIndex(generateDialogPinnedDate())
            dialog.pFlags.pinned = true

            newDialogsToHandle[peerID] = dialog
            if (!newDialogsHandlePromise) {
              newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
            }
          })
          angular.forEach(dialogsStorage.dialogs, function (dialog) {
            var peerID = dialog.peerID
            if (dialog.pFlags.pinned && !newPinned[peerID]) {
              newDialogsToHandle[peerID] = {reload: true}
              if (!newDialogsHandlePromise) {
                newDialogsHandlePromise = $timeout(handleNewDialogs, 0)
              }
            }
          })
          break

        case 'updateEditMessage':
        case 'updateEditChannelMessage':
          var message = update.message
          var peerID = getMessagePeer(message)
          var channelID = message.to_id._ == 'peerChannel' ? -peerID : 0
          var mid = AppMessagesIDsManager.getFullMessageID(message.id, channelID)
          if (messagesStorage[mid] === undefined) {
            break
          }

          // console.trace(dT(), 'edit message', message)
          saveMessages([message], {isEdited: true})
          safeReplaceObject(messagesStorage[mid], message)

          var wasForHistory = messagesForHistory[mid]
          if (wasForHistory !== undefined) {
            delete messagesForHistory[mid]
            var newForHistory = wrapForHistory(mid)
            safeReplaceObject(wasForHistory, newForHistory)
            messagesForHistory[mid] = wasForHistory
          }

          var foundDialog = getDialogByPeerID(peerID)[0]
          var isTopMessage = foundDialog && foundDialog.top_message == mid
          if (message.clear_history) {
            if (isTopMessage) {
              $rootScope.$broadcast('dialog_flush', {peerID: peerID})
            } else {
              var msgs = {}
              msgs[mid] = true
              $rootScope.$broadcast('history_delete', {peerID: peerID, msgs: msgs})
            }
          } else {
            $rootScope.$broadcast('message_edit', {
              peerID: peerID,
              id: message.id,
              mid: mid
            })
            if (isTopMessage) {
              var updatedDialogs = {}
              updatedDialogs[peerID] = foundDialog
              $rootScope.$broadcast('dialogs_multiupdate', updatedDialogs)
            }
          }
          break

        case 'updateReadHistoryInbox':
        case 'updateReadHistoryOutbox':
        case 'updateReadChannelInbox':
        case 'updateReadChannelOutbox':
          var isOut = update._ == 'updateReadHistoryOutbox' || update._ == 'updateReadChannelOutbox'
          var channelID = update.channel_id
          var maxID = AppMessagesIDsManager.getFullMessageID(update.max_id, channelID)
          var peerID = channelID ? -channelID : AppPeersManager.getPeerID(update.peer)
          var foundDialog = getDialogByPeerID(peerID)
          var history = (historiesStorage[peerID] || {}).history || []
          var newUnreadCount = false
          var length = history.length
          var foundAffected = false
          var messageID, message
          var i

          // console.warn(dT(), 'read', peerID, isOut ? 'out' : 'in', maxID)

          if (peerID > 0 && isOut) {
            AppUsersManager.forceUserOnline(peerID)
          }

          for (i = 0; i < length; i++) {
            messageID = history[i]
            if (messageID > maxID) {
              continue
            }
            message = messagesStorage[messageID]

            if (message.pFlags.out != isOut) {
              continue
            }
            if (!message.pFlags.unread) {
              break
            }
            // console.warn('read', messageID, message.pFlags.unread, message)
            if (message && message.pFlags.unread) {
              message.pFlags.unread = false
              if (messagesForHistory[messageID]) {
                messagesForHistory[messageID].pFlags.unread = false
                if (!foundAffected) {
                  foundAffected = true
                }
              }
              if (messagesForDialogs[messageID]) {
                messagesForDialogs[messageID].pFlags.unread = false
              }
              if (!message.pFlags.out) {
                if (foundDialog[0]) {
                  newUnreadCount = --foundDialog[0].unread_count
                }
                NotificationsManager.cancel('msg' + messageID)
              }
            }
          }
          if (foundDialog[0]) {
            if (!isOut &&
              newUnreadCount &&
              foundDialog[0].top_message <= maxID) {
              newUnreadCount = foundDialog[0].unread_count = 0
            }
            var dialogKey = isOut ? 'read_outbox_max_id' : 'read_inbox_max_id'
            foundDialog[0][dialogKey] = maxID
          }

          if (newUnreadCount !== false) {
            // console.warn(dT(), 'cnt', peerID, newUnreadCount)
            $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: newUnreadCount})
          }
          if (foundAffected) {
            $rootScope.$broadcast('messages_read')
          }
          break

        case 'updateChannelReadMessagesContents':
          var channelID = update.channel_id
          var newMessages = []
          angular.forEach(update.messages, function (msgID) {
            newMessages.push(AppMessagesIDsManager.getFullMessageID(msgID, channelID))
          })
          update.messages = newMessages

        case 'updateReadMessagesContents':
          var messages = update.messages
          var len = messages.length
          var i
          var messageID, message
          var historyMessage
          for (i = 0; i < len; i++) {
            messageID = messages[i]
            if (message = messagesStorage[messageID]) {
              delete message.pFlags.media_unread
            }
            if (historyMessage = messagesForHistory[messageID]) {
              delete historyMessage.pFlags.media_unread
            }
          }
          break

        case 'updateChannelAvailableMessages':
          var channelID = update.channel_id
          var messages = []
          var peerID = -channelID
          var history = (historiesStorage[peerID] || {}).history || []
          if (history.length) {
            angular.forEach(history, function (msgID) {
              if (!update.available_min_id ||
                  AppMessagesIDsManager.getMessageLocalID(msgID) <= update.available_min_id) {
                messages.push(msgID)
              }
            })
          }
          update.messages = messages

        case 'updateDeleteMessages':
        case 'updateDeleteChannelMessages':
          var dialogsUpdated = {}
          var historiesUpdated = {}
          var channelID = update.channel_id
          var messageID
          var message, i
          var peerID, foundDialog
          var history
          var peerMessagesToHandle
          var peerMessagesHandlePos

          for (i = 0; i < update.messages.length; i++) {
            messageID = AppMessagesIDsManager.getFullMessageID(update.messages[i], channelID)
            message = messagesStorage[messageID]
            if (message) {
              peerID = getMessagePeer(message)
              history = historiesUpdated[peerID] || (historiesUpdated[peerID] = {count: 0, unread: 0, msgs: {}})

              if (!message.pFlags.out && message.pFlags.unread) {
                history.unread++
                NotificationsManager.cancel('msg' + messageID)
              }
              history.count++
              history.msgs[messageID] = true

              if (messagesForHistory[messageID]) {
                messagesForHistory[messageID].deleted = true
                delete messagesForHistory[messageID]
              }
              if (messagesForDialogs[messageID]) {
                messagesForDialogs[messageID].deleted = true
                delete messagesForDialogs[messageID]
              }
              message.deleted = true
              messagesStorage[messageID] = {
                deleted: true,
                id: messageID,
                from_id: message.from_id,
                to_id: message.to_id,
                flags: message.flags,
                pFlags: message.pFlags,
                date: message.date
              }

              peerMessagesToHandle = newMessagesToHandle[peerID]
              if (peerMessagesToHandle && peerMessagesToHandle.length) {
                peerMessagesHandlePos = peerMessagesToHandle.indexOf(messageID)
                if (peerMessagesHandlePos != -1) {
                  peerMessagesToHandle.splice(peerMessagesHandlePos)
                }
              }
            }
          }

          angular.forEach(historiesUpdated, function (updatedData, peerID) {
            var historyStorage = historiesStorage[peerID]
            if (historyStorage !== undefined) {
              var newHistory = []
              var newPending = []
              for (var i = 0; i < historyStorage.history.length; i++) {
                if (!updatedData.msgs[historyStorage.history[i]]) {
                  newHistory.push(historyStorage.history[i])
                }
              }
              historyStorage.history = newHistory
              if (updatedData.count &&
                historyStorage.count !== null &&
                historyStorage.count > 0) {
                historyStorage.count -= updatedData.count
                if (historyStorage.count < 0) {
                  historyStorage.count = 0
                }
              }

              for (var i = 0; i < historyStorage.pending.length; i++) {
                if (!updatedData.msgs[historyStorage.pending[i]]) {
                  newPending.push(historyStorage.pending[i])
                }
              }
              historyStorage.pending = newPending

              $rootScope.$broadcast('history_delete', {peerID: peerID, msgs: updatedData.msgs})
            }

            var foundDialog = getDialogByPeerID(peerID)[0]
            if (foundDialog) {
              if (updatedData.unread) {
                foundDialog.unread_count -= updatedData.unread

                $rootScope.$broadcast('dialog_unread', {
                  peerID: peerID,
                  count: foundDialog.unread_count
                })
              }

              if (updatedData.msgs[foundDialog.top_message]) {
                reloadConversation(peerID)
              }
            }
          })
          break

        case 'updateChannel':
          var channelID = update.channel_id
          var peerID = -channelID
          var channel = AppChatsManager.getChat(channelID)

          var needDialog = channel._ == 'channel' && (!channel.pFlags.left && !channel.pFlags.kicked)
          var foundDialog = getDialogByPeerID(peerID)
          var hasDialog = foundDialog.length > 0

          var canViewHistory = channel._ == 'channel' && (channel.username || !channel.pFlags.left && !channel.pFlags.kicked) && true || false
          var hasHistory = historiesStorage[peerID] !== undefined

          if (canViewHistory != hasHistory) {
            delete historiesStorage[peerID]
            $rootScope.$broadcast('history_forbidden', peerID)
          }
          if (hasDialog != needDialog) {
            if (needDialog) {
              reloadConversation(-channelID)
            } else {
              if (foundDialog[0]) {
                dialogsStorage.dialogs.splice(foundDialog[1], 1)
                $rootScope.$broadcast('dialog_drop', {peerID: peerID})
              }
            }
          }
          break

        case 'updateChannelReload':
          var channelID = update.channel_id
          var peerID = -channelID
          var foundDialog = getDialogByPeerID(peerID)
          if (foundDialog[0]) {
            dialogsStorage.dialogs.splice(foundDialog[1], 1)
          }
          delete historiesStorage[peerID]
          reloadConversation(-channelID).then(function () {
            $rootScope.$broadcast('history_reload', peerID)
          })
          break

        case 'updateChannelMessageViews':
          var views = update.views
          var mid = AppMessagesIDsManager.getFullMessageID(update.id, update.channel_id)
          var message = getMessage(mid)
          if (message && message.views && message.views < views) {
            message.views = views
            $rootScope.$broadcast('message_views', {
              mid: mid,
              views: views
            })
          }
          break

        case 'updateServiceNotification':
          // update.inbox_date = tsNow(true)
          // update.pFlags = {popup: true}
          var fromID = 777000
          var peerID = fromID
          var messageID = tempID--
          var message = {
            _: 'message',
            id: messageID,
            from_id: fromID,
            to_id: AppPeersManager.getOutputPeer(peerID),
            flags: 0,
            pFlags: {unread: true},
            date: (update.inbox_date || tsNow(true)) + ServerTimeManager.serverTimeOffset,
            message: update.message,
            media: update.media,
            entities: update.entities
          }
          if (!AppUsersManager.hasUser(fromID)) {
            AppUsersManager.saveApiUsers([{
              _: 'user',
              id: fromID,
              pFlags: {verified: true},
              access_hash: 0,
              first_name: 'Telegram',
              phone: '42777'
            }])
          }
          saveMessages([message])

          if (update.inbox_date) {
            pendingTopMsgs[peerID] = messageID
            handleUpdate({
              _: 'updateNewMessage',
              message: message
            })
          }
          if (update.pFlags.popup && update.message) {
            var historyMessage = wrapForHistory(messageID)
            ErrorService.show({error: {code: 400, type: 'UPDATE_SERVICE_NOTIFICATION'}, historyMessage: historyMessage})
          }
          break
      }
    }

    $rootScope.$on('apiUpdate', function (e, update) {
      // if (update._ != 'updateUserStatus') {
      //   console.log('on apiUpdate', update)
      // }
      handleUpdate(update)
    })

    function reloadConversation (peerID) {
      return MtpApiManager.invokeApi('messages.getPeerDialogs', {
        peers: [
          AppPeersManager.getInputPeerByID(peerID)
        ]
      }).then(applyConversations)
    }

    function applyConversations(dialogsResult) {
      AppUsersManager.saveApiUsers(dialogsResult.users)
      AppChatsManager.saveApiChats(dialogsResult.chats)
      saveMessages(dialogsResult.messages)

      var updatedDialogs = {}
      var hasUpdated = false
      angular.forEach(dialogsResult.dialogs, function (dialog) {
        var peerID = AppPeersManager.getPeerID(dialog.peer)
        var topMessage = dialog.top_message
        var topPendingMesage = pendingTopMsgs[peerID]
        if (topPendingMesage) {
          if (!topMessage || getMessage(topPendingMesage).date > getMessage(topMessage).date) {
            dialog.top_message = topMessage = topPendingMesage
          }
        }
        if (topMessage) {
          var wasBefore = getDialogByPeerID(peerID).length > 0
          saveConversation(dialog)
          if (wasBefore) {
            clearDialogCache(topMessage)
            $rootScope.$broadcast('dialog_top', dialog)
          } else {
            updatedDialogs[peerID] = dialog
            hasUpdated = true
          }
        } else {
          var foundDialog = getDialogByPeerID(peerID)
          if (foundDialog.length) {
            dialogsStorage.dialogs.splice(foundDialog[1], 1)
            $rootScope.$broadcast('dialog_drop', {peerID: peerID})
          }
        }
        if (newUpdatesAfterReloadToHandle[peerID] !== undefined) {
          angular.forEach(newUpdatesAfterReloadToHandle[peerID], function (update) {
            handleUpdate(update)
          })
          delete newUpdatesAfterReloadToHandle[peerID]
        }
      })
      if (hasUpdated) {
        $rootScope.$broadcast('dialogs_multiupdate', updatedDialogs)
      }
    }

    $rootScope.$on('webpage_updated', function (e, eventData) {
      angular.forEach(eventData.msgs, function (msgID) {
        var historyMessage = messagesForHistory[msgID]
        if (historyMessage) {
          historyMessage.media = {
            _: 'messageMediaWebPage',
            webpage: AppWebPagesManager.wrapForHistory(eventData.id)
          }
          $rootScope.$broadcast('message_edit', {
            peerID: getMessagePeer(historyMessage),
            id: historyMessage.id,
            mid: msgID,
            justMedia: true
          })
        }
      })
    })

    $rootScope.$on('draft_updated', function (e, eventData) {
      var peerID = eventData.peerID
      var draft = eventData.draft

      var dialog = getDialogByPeerID(peerID)[0]
      if (dialog) {
        var topDate
        if (draft && draft.date) {
          topDate = draft.date
        } else {
          var channelID = AppPeersManager.isChannel(peerID) ? -peerID : 0
          var topDate = getMessage(dialog.top_message).date
          if (channelID) {
            var channel = AppChatsManager.getChat(channelID)
            if (!topDate || channel.date && channel.date > topDate) {
              topDate = channel.date
            }
          }
        }
        if (!dialog.pFlags.pinned) {
          dialog.index = generateDialogIndex(topDate)
        }
        pushDialogToStorage(dialog)

        $rootScope.$broadcast('dialog_draft', {
          peerID: peerID,
          draft: draft,
          index: dialog.index
        })
      }
    })

    return {
      getConversations: getConversations,
      getConversation: getConversation,
      getHistory: getHistory,
      getSearch: getSearch,
      getMessage: getMessage,
      getReplyKeyboard: getReplyKeyboard,
      readHistory: readHistory,
      readMessages: readMessages,
      flushHistory: flushHistory,
      deleteMessages: deleteMessages,
      sendText: sendText,
      sendFile: sendFile,
      sendOther: sendOther,
      forwardMessages: forwardMessages,
      startBot: startBot,
      shareGame: shareGame,
      editMessage: editMessage,
      convertMigratedPeer: convertMigratedPeer,
      getMessagePeer: getMessagePeer,
      getMessageThumb: getMessageThumb,
      getMessageShareLink: getMessageShareLink,
      canMessageBeEdited: canMessageBeEdited,
      canEditMessage: canEditMessage,
      getMessageEditData: getMessageEditData,
      canRevokeMessage: canRevokeMessage,
      clearDialogCache: clearDialogCache,
      wrapForDialog: wrapForDialog,
      wrapForHistory: wrapForHistory,
      wrapReplyMarkup: wrapReplyMarkup,
      wrapSingleMessage: wrapSingleMessage,
      wrapMessageText: wrapMessageText,
      regroupWrappedHistory: regroupWrappedHistory
    }
  })

  .service('AppMessagesIDsManager', function () {
    var channelLocals = {}
    var channelsByLocals = {}
    var channelCurLocal = 0
    var fullMsgIDModulus = 4294967296

    return {
      getFullMessageID: getFullMessageID,
      getMessageIDInfo: getMessageIDInfo,
      getMessageLocalID: getMessageLocalID,
      splitMessageIDsByChannels: splitMessageIDsByChannels,
      fullMsgIDModulus: fullMsgIDModulus
    }

    function getFullMessageID (msgID, channelID) {
      if (!channelID || msgID <= 0) {
        return msgID
      }
      msgID = getMessageLocalID(msgID)
      var localStart = channelLocals[channelID]
      if (!localStart) {
        localStart = (++channelCurLocal) * fullMsgIDModulus
        channelsByLocals[localStart] = channelID
        channelLocals[channelID] = localStart
      }

      return localStart + msgID
    }

    function getMessageIDInfo (fullMsgID) {
      if (fullMsgID < fullMsgIDModulus) {
        return [fullMsgID, 0]
      }
      var msgID = fullMsgID % fullMsgIDModulus
      var channelID = channelsByLocals[fullMsgID - msgID]

      return [msgID, channelID]
    }

    function getMessageLocalID (fullMsgID) {
      if (!fullMsgID) {
        return 0
      }
      return fullMsgID % fullMsgIDModulus
    }

    function splitMessageIDsByChannels (mids) {
      var msgIDsByChannels = {}
      var midsByChannels = {}
      var i
      var mid, msgChannel
      var channelID
      for (i = 0; i < mids.length; i++) {
        mid = mids[i]
        msgChannel = getMessageIDInfo(mid)
        channelID = msgChannel[1]
        if (msgIDsByChannels[channelID] === undefined) {
          msgIDsByChannels[channelID] = []
          midsByChannels[channelID] = []
        }
        msgIDsByChannels[channelID].push(msgChannel[0])
        midsByChannels[channelID].push(mid)
      }

      return {
        msgIDs: msgIDsByChannels,
        mids: midsByChannels
      }
    }
  })
