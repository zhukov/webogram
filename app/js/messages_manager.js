/*!
 * Webogram v0.5.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

angular.module('myApp.services')

.service('AppMessagesManager', function ($q, $rootScope, $location, $filter, $timeout, $sce, ApiUpdatesManager, AppUsersManager, AppChatsManager, AppPeersManager, AppPhotosManager, AppVideoManager, AppDocsManager, AppStickersManager, AppAudioManager, AppWebPagesManager, MtpApiManager, MtpApiFileManager, RichTextProcessor, NotificationsManager, PeersSelectService, Storage, AppProfileManager, FileManager, TelegramMeWebService, ErrorService, StatusManager, _) {

  var messagesStorage = {};
  var messagesForHistory = {};
  var messagesForDialogs = {};
  var historiesStorage = {};
  var dialogsStorage = {count: null, dialogs: []};
  var pendingByRandomID = {};
  var pendingByMessageID = {};
  var pendingAfterMsgs = {};
  var sendFilePromise = $q.when();
  var tempID = -1;

  var dialogsIndex = SearchIndexManager.createIndex(),
      cachedResults = {query: false};

  var lastSearchFilter = {},
      lastSearchResults = [];

  var needSingleMessages = [],
      fetchSingleMessagesTimeout = false;

  var incrementedMessageViews = {},
      needIncrementMessageViews = [],
      incrementMessageViewsTimeout = false;

  var serverTimeOffset = 0,
      timestampNow = tsNow(true),
      midnightNoOffset = timestampNow - (timestampNow % 86400),
      midnightOffseted = new Date(),
      midnightOffset;

  Storage.get('server_time_offset').then(function (to) {
    if (to) {
      serverTimeOffset = to;
    }
  });

  var maxSeenID = false;
  if (Config.Modes.packed) {
    Storage.get('max_seen_msg').then(function (maxID) {
      maxSeenID = maxID || 0;
    });
  }


  var dateOrTimeFilter = $filter('dateOrTime');
  var fwdMessagesPluralize = _.pluralize('conversation_forwarded_X_messages');

  midnightOffseted.setHours(0);
  midnightOffseted.setMinutes(0);
  midnightOffseted.setSeconds(0);
  midnightOffset = midnightNoOffset - (Math.floor(+midnightOffseted / 1000));

  NotificationsManager.start();

  var allChannelsLoaded = false;
  var channelsLoadPromise = false;
  var allDialogsLoaded = false
  var loadedDialogsCount = 0;
  var dialogsNum = 0;
  var minDialogsIndex = Math.pow(2, 50);

  function getConversations (query, offsetIndex, limit) {
    var curDialogStorage = dialogsStorage;
    var isSearch = angular.isString(query) && query.length;

    if (isSearch) {
      if (!limit || cachedResults.query !== query) {
        cachedResults.query = query;

        var results = SearchIndexManager.search(query, dialogsIndex);

        cachedResults.dialogs = [];
        angular.forEach(dialogsStorage.dialogs, function (dialog) {
          if (results[dialog.peerID]) {
            cachedResults.dialogs.push(dialog);
          }
        });
        cachedResults.count = cachedResults.dialogs.length;
      }
      curDialogStorage = cachedResults;
    } else {
      cachedResults.query = false;
    }

    var offset = 0;
    if (offsetIndex > 0) {
      for (offset = 0; offset < curDialogStorage.dialogs.length; offset++) {
        if (offsetIndex > curDialogStorage.dialogs[offset].index) {
          break;
        }
      }
    }

    limit = limit || 20;

    if (
      isSearch ||
      (allChannelsLoaded && allDialogsLoaded) ||
      (
        curDialogStorage.dialogs.length >= offset + limit &&
        curDialogStorage.dialogs[offset + limit - 1].index >= minDialogsIndex
      )
    ) {
      return $q.when({
        dialogs: curDialogStorage.dialogs.slice(offset, offset + limit)
      });
    }

    return $q.all([getAllChannels(), getTopMessages(loadedDialogsCount, limit)]).then(function () {
      offset = 0;
      if (offsetIndex > 0) {
        for (offset = 0; offset < curDialogStorage.dialogs.length; offset++) {
          if (offsetIndex > curDialogStorage.dialogs[offset].index) {
            break;
          }
        }
      }
      return {
        dialogs: curDialogStorage.dialogs.slice(offset, offset + limit)
      }
    });
  }

  function getDialogByPeerID (peerID) {
    for (var i = 0; i < dialogsStorage.dialogs.length; i++) {
      if (dialogsStorage.dialogs[i].peerID == peerID) {
        return [dialogsStorage.dialogs[i], i];
      }
    }

    return [];
  }

  function saveChannelDialog (channelID, dialog) {
    var peerID = -channelID;
    var peerText = AppPeersManager.getPeerSearchText(peerID);
    SearchIndexManager.indexObject(peerID, peerText, dialogsIndex);

    var mid = getFullMessageID(dialog.top_important_message, channelID);
    dialog.top_message = mid;
    dialog.unread_count = dialog.unread_important_count;
    dialog.read_inbox_max_id = getFullMessageID(dialog.read_inbox_max_id, channelID);

    var message = getMessage(dialog.top_message);
    var topDate = message.date;
    var channel = AppChatsManager.getChat(channelID);
    if (!topDate || channel.date && channel.date > topDate) {
      topDate = channel.date;
    }

    dialog.index = generateDialogIndex(topDate);
    dialog.peerID = peerID;

    pushDialogToStorage(dialog);

    // Because we saved message without dialog present
    if (message.mid && message.mid > dialog.read_inbox_max_id) {
      message.unread = true;
    }

    if (historiesStorage[peerID] === undefined) {
      var historyStorage = {count: null, history: [mid], pending: []};
      historiesStorage[peerID] = historyStorage;
    }

    NotificationsManager.savePeerSettings(peerID, dialog.notify_settings);
    ApiUpdatesManager.addChannelState(channelID, dialog.pts);
  }

  function getAllChannels () {
    if (channelsLoadPromise) {
      return channelsLoadPromise;
    }
    return channelsLoadPromise = MtpApiManager.invokeApi('channels.getDialogs', {
      offset: 0,
      limit: 100
    }).then(function (dialogsResult) {
      AppUsersManager.saveApiUsers(dialogsResult.users);
      AppChatsManager.saveApiChats(dialogsResult.chats);
      saveMessages(dialogsResult.messages);

      angular.forEach(dialogsResult.dialogs, function (dialog) {
        var peerID = AppPeersManager.getPeerID(dialog.peer);
        var channelID = -peerID;
        saveChannelDialog(channelID, dialog);
        ApiUpdatesManager.addChannelState(channelID, dialog.pts);
      });
      allChannelsLoaded = true;
    });
  }

  function getTopMessages (offset, limit) {
    return MtpApiManager.invokeApi('messages.getDialogs', {
      offset: offset,
      limit: limit
    }).then(function (dialogsResult) {
      if (!offset) {
        TelegramMeWebService.setAuthorized(true);
      }

      // Server-side bug
      if (dialogsResult.count && offset >= dialogsResult.count) {
        dialogsResult.dialogs = [];
      }

      AppUsersManager.saveApiUsers(dialogsResult.users);
      AppChatsManager.saveApiChats(dialogsResult.chats);
      saveMessages(dialogsResult.messages);

      if (!dialogsResult.dialogs.length) {
        allDialogsLoaded = true;
      }
      else if (!offset) {
        incrementMaxSeenID(dialogsResult.dialogs[0].top_message);
      }

      angular.forEach(dialogsResult.dialogs, function (dialog) {
        var peerID = AppPeersManager.getPeerID(dialog.peer);
        var peerText = AppPeersManager.getPeerSearchText(peerID);
        SearchIndexManager.indexObject(peerID, peerText, dialogsIndex);

        var message = getMessage(dialog.top_message);

        dialog.index = generateDialogIndex(message.date);
        dialog.peerID = peerID;

        pushDialogToStorage(dialog);

        if (historiesStorage[peerID] === undefined) {
          var historyStorage = {count: null, history: [dialog.top_message], pending: []};
          historiesStorage[peerID] = historyStorage;
          if (mergeReplyKeyboard(historyStorage, message)) {
            $rootScope.$broadcast('history_reply_markup', {peerID: peerID});
          }
        }

        NotificationsManager.savePeerSettings(peerID, dialog.notify_settings);

        if (
          dialog.unread_count > 0 &&
          maxSeenID &&
          dialog.top_message > maxSeenID
        ) {
          var notifyPeer = message.flags & 16 ? message.from_id : peerID;
          if (message.unread && !message.out) {
            NotificationsManager.getPeerMuted(notifyPeer).then(function (muted) {
              if (!muted) {
                notifyAboutMessage(message);
              }
            });
          }
        }
      });
    });
  }

  function generateDialogIndex (date) {
    if (date === undefined) {
      date = tsNow(true) + serverTimeOffset;
    }
    return (date * 0x10000) + ((++dialogsNum) & 0xFFFF);
  }

  function pushDialogToStorage (dialog) {
    var dialogs = dialogsStorage.dialogs;

    var pos = getDialogByPeerID(dialog.peerID)[1];
    var index = dialog.index;
    var isDialog = dialog._ == 'dialog';
    if (pos !== undefined) {
      dialogs.splice(pos, 1);
    }
    else if (isDialog) {
      loadedDialogsCount++;
      if (index < minDialogsIndex) {
        minDialogsIndex = index;
      }
    }

    var i, len = dialogs.length;
    if (!len || index < dialogs[len - 1].index) {
      dialogs.push(dialog);
    }
    else if (index >= dialogs[0].index) {
      dialogs.unshift(dialog);
    }
    else {
      for (i = 0; i < len; i++) {
        if (index > dialogs[i].index) {
          dialogs.splice(i, 0, dialog);
          break;
        }
      }
    }
  }

  function requestHistory (inputPeer, maxID, limit, offset) {
    var peerID = AppPeersManager.getPeerID(inputPeer);
    var isChannel = AppPeersManager.isChannel(peerID);
    var promise;
    if (isChannel) {
      promise = MtpApiManager.invokeApi('channels.getImportantHistory', {
        channel: AppChatsManager.getChannelInput(-peerID),
        offset_id: maxID ? getMessageLocalID(maxID) : 0,
        add_offset: offset || 0,
        limit: limit || 0
      });
    } else {
      promise = MtpApiManager.invokeApi('messages.getHistory', {
        peer: inputPeer,
        offset_id: maxID ? getMessageLocalID(maxID) : 0,
        add_offset: offset || 0,
        limit: limit || 0
      }, {noErrorBox: true});
    }

    return promise.then(function (historyResult) {
      AppUsersManager.saveApiUsers(historyResult.users);
      AppChatsManager.saveApiChats(historyResult.chats);
      saveMessages(historyResult.messages);

      if (isChannel) {
        ApiUpdatesManager.addChannelState(-peerID, historyResult.pts);
      }

      if (
        peerID < 0 ||
        !AppUsersManager.isBot(peerID) ||
        (historyResult.messages.length == limit && limit < historyResult.count)
      ) {
        return historyResult;
      }

      return AppProfileManager.getProfile(peerID).then(function (userFull) {
        var description = userFull.bot_info && userFull.bot_info.description;
        if (description) {
          var messageID = tempID--;
          var message = {
            _: 'messageService',
            id: messageID,
            from_id: peerID,
            to_id: AppPeersManager.getOutputPeer(peerID),
            flags: 0,
            date: tsNow(true) + serverTimeOffset,
            action: {
              _: 'messageActionBotIntro',
              description: description
            }
          };
          saveMessages([message]);
          historyResult.messages.push(message);
          if (historyResult.count) {
            historyResult.count++;
          }
        }
        return historyResult;
      });
    }, function (error) {
      switch (error.type) {
        case 'CHANNEL_PRIVATE':
          var channel = AppChatsManager.getChat(-peerID);
          channel = {_: 'channelForbidden', access_hash: channel.access_hash, title: channel.title};
          ApiUpdatesManager.processUpdateMessage({
            _: 'updates',
            updates: [{
              _: 'updateChannel',
              channel_id: -peerID
            }],
            chats: [channel],
            users: []
          });
          break;
      }
      return $q.reject(error);
    });
  }

  var channelLocals = {};
  var channelsByLocals = {};
  var channelCurLocal = 0;
  var fullMsgIDModulus = 4294967296;

  function getFullMessageID (msgID, channelID) {
    if (!channelID || msgID <= 0) {
      return msgID;
    }
    msgID = getMessageLocalID(msgID);
    var localStart = channelLocals[channelID];
    if (!localStart) {
      localStart = (++channelCurLocal) * fullMsgIDModulus;
      channelsByLocals[localStart] = channelID;
      channelLocals[channelID] = localStart;
    }

    return localStart + msgID;
  }

  function getMessageIDInfo (fullMsgID) {
    if (fullMsgID < fullMsgIDModulus) {
      return [fullMsgID, 0];
    }
    var msgID = fullMsgID % fullMsgIDModulus;
    var channelID = channelsByLocals[fullMsgID - msgID];

    return [msgID, channelID];
  }

  function getMessageLocalID (fullMsgID) {
    if (!fullMsgID) {
      return 0;
    }
    return fullMsgID % fullMsgIDModulus;
  }

  function splitMessageIDsByChannels (mids) {
    var msgIDsByChannels = {};
    var midsByChannels = {};
    var i, mid, msgChannel, channelID;
    for (i = 0; i < mids.length; i++) {
      mid = mids[i];
      msgChannel = getMessageIDInfo(mid);
      channelID = msgChannel[1];
      if (msgIDsByChannels[channelID] === undefined) {
        msgIDsByChannels[channelID] = [];
        midsByChannels[channelID] = [];
      }
      msgIDsByChannels[channelID].push(msgChannel[0]);
      midsByChannels[channelID].push(mid);
    }

    return {
      msgIDs: msgIDsByChannels,
      mids: midsByChannels
    };
  }

  function fillHistoryStorage (inputPeer, maxID, fullLimit, historyStorage) {
    // console.log('fill history storage', inputPeer, maxID, fullLimit, angular.copy(historyStorage));
    return requestHistory (inputPeer, maxID, fullLimit).then(function (historyResult) {
      historyStorage.count = historyResult.count || historyResult.messages.length;

      var offset = 0;
      if (!maxID && historyResult.messages.length) {
        maxID = historyResult.messages[0].mid + 1;
      }
      if (maxID > 0) {
        for (offset = 0; offset < historyStorage.history.length; offset++) {
          if (maxID > historyStorage.history[offset]) {
            break;
          }
        }
      }

      historyStorage.history.splice(offset, historyStorage.history.length - offset);
      angular.forEach(historyResult.messages, function (message) {
        if (mergeReplyKeyboard(historyStorage, message)) {
          $rootScope.$broadcast('history_reply_markup', {peerID: AppPeersManager.getPeerID(inputPeer)});
        }
        historyStorage.history.push(message.mid);
      });

      fullLimit -= historyResult.messages.length;

      if (fullLimit > 0 && historyStorage.history.length < historyStorage.count) {
        maxID = historyStorage.history[historyStorage.history.length - 1];
        return fillHistoryStorage(inputPeer, maxID, fullLimit, historyStorage);
      }

      return true;
    });
  };

  function wrapHistoryResult (peerID, result) {
    var unreadOffset = result.unreadOffset;
    if (unreadOffset) {
      var i, message;
      for (i = result.history.length - 1; i >= 0; i--) {
        message = messagesStorage[result.history[i]];
        if (message && !message.out && message.unread) {
          result.unreadOffset = i + 1;
          break;
        }
      }
    }
    return $q.when(result);
  }

  function getHistory (inputPeer, maxID, limit, backLimit, prerendered) {
    var peerID = AppPeersManager.getPeerID(inputPeer),
        historyStorage = historiesStorage[peerID],
        offset = 0,
        offsetNotFound = false,
        unreadOffset = false,
        unreadSkip = false;

    prerendered = prerendered ? Math.min(50, prerendered) : 0;

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    if (!limit && !maxID) {
      var foundDialog = getDialogByPeerID(peerID)[0];
      if (foundDialog && foundDialog.unread_count > 1) {
        var unreadCount = foundDialog.unread_count;
        if (unreadSkip = (unreadCount > 50)) {
          if (foundDialog.read_inbox_max_id) {
            maxID = foundDialog.read_inbox_max_id;
            backLimit = 16;
            unreadOffset = 16;
            limit = 4;
          } else {
            limit = 20;
            unreadOffset = 16;
            offset = unreadCount - unreadOffset;
          }
        } else {
          limit = Math.max(10, prerendered, unreadCount + 2);
          unreadOffset = unreadCount;
        }
      }
      else if (Config.Mobile) {
        limit = 20;
      }
    }
    if (maxID > 0) {
      offsetNotFound = true;
      for (offset = 0; offset < historyStorage.history.length; offset++) {
        if (maxID > historyStorage.history[offset]) {
          offsetNotFound = false;
          break;
        }
      }
    }

    if (!offsetNotFound && (
          historyStorage.count !== null && historyStorage.history.length == historyStorage.count ||
          historyStorage.history.length >= offset + (limit || 1)
    )) {
      if (backLimit) {
        backLimit = Math.min(offset, backLimit);
        offset = Math.max(0, offset - backLimit);
        limit += backLimit;
      } else {
        limit = limit || (offset ? 20 : (prerendered || 5));
      }
      var history = historyStorage.history.slice(offset, offset + limit);
      if (!maxID && historyStorage.pending.length) {
        history = historyStorage.pending.slice().concat(history);
      }
      return wrapHistoryResult(peerID, {
        count: historyStorage.count,
        history: history,
        unreadOffset: unreadOffset,
        unreadSkip: unreadSkip
      });
    }

    if (!backLimit && !limit) {
      limit = prerendered || 20;
    }
    if (offsetNotFound) {
      offset = 0;
    }
    if (backLimit || unreadSkip || maxID && historyStorage.history.indexOf(maxID) == -1) {
      if (backLimit) {
        offset = -backLimit;
        limit += backLimit;
      }
      return requestHistory(inputPeer, maxID, limit, offset).then(function (historyResult) {
        historyStorage.count = historyResult.count || historyResult.messages.length;

        var history = [];
        angular.forEach(historyResult.messages, function (message) {
          history.push(message.mid);
        });
        if (!maxID && historyStorage.pending.length) {
          history = historyStorage.pending.slice().concat(history);
        }

        return wrapHistoryResult(peerID, {
          count: historyStorage.count,
          history: history,
          unreadOffset: unreadOffset,
          unreadSkip: unreadSkip
        });
      })
    }

    return fillHistoryStorage(inputPeer, maxID, limit, historyStorage).then(function () {
      offset = 0;
      if (maxID > 0) {
        for (offset = 0; offset < historyStorage.history.length; offset++) {
          if (maxID > historyStorage.history[offset]) {
            break;
          }
        }
      }

      var history = historyStorage.history.slice(offset, offset + limit);
      if (!maxID && historyStorage.pending.length) {
        history = historyStorage.pending.slice().concat(history);
      }

      return wrapHistoryResult(peerID, {
        count: historyStorage.count,
        history: history,
        unreadOffset: unreadOffset,
        unreadSkip: unreadSkip
      });
    });
  }

  function getReplyKeyboard (peerID) {
    return (historiesStorage[peerID] || {}).reply_markup || false;
  }

  function mergeReplyKeyboard (historyStorage, message) {
    // console.log('merge', message.mid, message.reply_markup, historyStorage.reply_markup);
    if (!message.reply_markup &&
        !message.out &&
        !message.action) {
      return false;
    }
    var messageReplyMarkup = message.reply_markup;
    var lastReplyMarkup = historyStorage.reply_markup;
    if (messageReplyMarkup) {
      if (lastReplyMarkup && lastReplyMarkup.mid >= message.mid) {
        return false;
      }
      if (messageReplyMarkup.pFlags.selective &&
          !(message.flags & 16)) {
        return false;
      }
      if (historyStorage.maxOutID &&
          message.mid < historyStorage.maxOutID &&
          messageReplyMarkup.pFlags.one_time) {
        messageReplyMarkup.pFlags.hidden = true;
      }
      messageReplyMarkup = angular.extend({
        mid: message.mid
      }, messageReplyMarkup);
      if (messageReplyMarkup._ != 'replyKeyboardHide') {
        messageReplyMarkup.fromID = message.from_id;
      }
      historyStorage.reply_markup = messageReplyMarkup;
      // console.log('set', historyStorage.reply_markup);
      return true;
    }

    if (message.out) {
      if (lastReplyMarkup) {
        if (lastReplyMarkup.pFlags.one_time &&
            !lastReplyMarkup.pFlags.hidden &&
            (message.mid > lastReplyMarkup.mid || message.mid < 0) &&
            message.message) {
          lastReplyMarkup.pFlags.hidden = true;
          // console.log('set', historyStorage.reply_markup);
          return true;
        }
      } else if (!historyStorage.maxOutID ||
                  message.mid > historyStorage.maxOutID) {
        historyStorage.maxOutID = message.mid;
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
      };
      // console.log('set', historyStorage.reply_markup);
      return true;
    }

    return false;
  }

  function getSearch (inputPeer, query, inputFilter, maxID, limit) {
    var foundMsgs = [],
        useSearchCache = !query,
        peerID = AppPeersManager.getPeerID(inputPeer),
        newSearchFilter = {peer: peerID, filter: inputFilter},
        sameSearchCache = useSearchCache && angular.equals(lastSearchFilter, newSearchFilter);

    if (useSearchCache && !sameSearchCache) {
      lastSearchFilter = newSearchFilter;
      lastSearchResults = [];
    }

    if (!maxID && !query) {
      var historyStorage = historiesStorage[peerID];

      if (historyStorage !== undefined && historyStorage.history.length) {
        var neededContents = {},
            neededLimit = limit || 20,
            i, message;

        switch (inputFilter._) {
          case 'inputMessagesFilterPhotos':
            neededContents['messageMediaPhoto'] = true;
            break;

          case 'inputMessagesFilterVideo':
            neededContents['messageMediaVideo'] = true;
            break;

          case 'inputMessagesFilterPhotoVideo':
            neededContents['messageMediaPhoto'] = true;
            neededContents['messageMediaVideo'] = true;
            break;

          case 'inputMessagesFilterDocument':
            neededContents['messageMediaDocument'] = true;
            break;

          case 'inputMessagesFilterAudio':
            neededContents['messageMediaAudio'] = true;
            break;
        }
        for (i = 0; i < historyStorage.history.length; i++) {
          message = messagesStorage[historyStorage.history[i]];
          if (message.media && neededContents[message.media._]) {
            foundMsgs.push(message.mid);
            if (foundMsgs.length >= neededLimit) {
              break;
            }
          }
        }
      }

      // console.log(dT(), sameSearchCache, foundMsgs, lastSearchResults);
      if (foundMsgs.length < neededLimit && lastSearchResults.length && sameSearchCache) {
        var minID = foundMsgs.length ? foundMsgs[foundMsgs.length - 1] : 0xFFFFFFFF;
        for (var i = 0; i < lastSearchResults.length; i++) {
          if (lastSearchResults[i] < minID) {
            foundMsgs.push(lastSearchResults[i]);
            if (foundMsgs.length >= neededLimit) {
              break;
            }
          }
        }
      }
      // console.log(dT(), foundMsgs);
    }

    if (foundMsgs.length || limit == 1000) {
      if (useSearchCache) {
        lastSearchResults = listMergeSorted(lastSearchResults, foundMsgs);
      }

      return $q.when({
        count: null,
        history: foundMsgs
      });
    }

    return MtpApiManager.invokeApi('messages.search', {
      flags: 0,
      peer: inputPeer,
      q: query || '',
      filter: inputFilter || {_: 'inputMessagesFilterEmpty'},
      min_date: 0,
      max_date: 0,
      limit: limit || 20,
      max_id: maxID || 0
    }).then(function (searchResult) {
      AppUsersManager.saveApiUsers(searchResult.users);
      AppChatsManager.saveApiChats(searchResult.chats);
      saveMessages(searchResult.messages);

      var foundCount = searchResult.count || searchResult.messages.length;

      foundMsgs = [];
      angular.forEach(searchResult.messages, function (message) {
        foundMsgs.push(message.mid);
      });

      if (useSearchCache) {
        lastSearchResults = listMergeSorted(lastSearchResults, foundMsgs);
      }

      return {
        count: foundCount,
        history: foundMsgs
      };
    }, function (error) {
      if (error.code == 400) {
        error.handled = true;
      }
      return $q.reject(error);
    });
  }

  function getMessage (messageID) {
    return messagesStorage[messageID] || {deleted: true};
  }

  function deleteMessages (messageIDs) {
    return MtpApiManager.invokeApi('messages.deleteMessages', {
      id: messageIDs
    }).then(function (affectedMessages) {
      ApiUpdatesManager.processUpdateMessage({
        _: 'updateShort',
        update: {
          _: 'updateDeleteMessages',
          messages: messageIDs,
          pts: affectedMessages.pts,
          pts_count: affectedMessages.pts_count
        }
      });
      return messageIDs;
    });
  }

  function processAffectedHistory (inputPeer, affectedHistory, method) {
    ApiUpdatesManager.processUpdateMessage({
      _: 'updateShort',
      update: {
        _: 'updatePts',
        pts: affectedHistory.pts,
        pts_count: affectedHistory.pts_count
      }
    });
    if (!affectedHistory.offset) {
      return $q.when();
    }

    return MtpApiManager.invokeApi(method, {
      peer: inputPeer,
      offset: affectedHistory.offset,
      max_id: 0
    }).then(function (affectedHistory) {
      return processAffectedHistory(inputPeer, affectedHistory, method);
    });
  }

  function readHistory (inputPeer) {
    // console.trace('start read');
    var peerID = AppPeersManager.getPeerID(inputPeer),
        isChannel = AppPeersManager.isChannel(peerID),
        historyStorage = historiesStorage[peerID],
        foundDialog = getDialogByPeerID(peerID)[0];

    if (!foundDialog || !foundDialog.unread_count) {

      if (!historyStorage || !historyStorage.history.length) {
        return false;
      }

      var messageID,
          message,
          foundUnread = false;
      for (i = historyStorage.history.length; i >= 0; i--) {
        messageID = historyStorage.history[i];
        message = messagesStorage[messageID];
        if (message && !message.out && message.unread) {
          foundUnread = true;
          break;
        }
      }
      if (!foundUnread) {
        return false;
      }
    }

    if (historyStorage.readPromise) {
      return historyStorage.readPromise;
    }

    var apiPromise;
    if (isChannel) {
      apiPromise = MtpApiManager.invokeApi('channels.readHistory', {
        channel: AppChatsManager.getChannelInput(-peerID),
        max_id: 0
      });
    } else {
      apiPromise = MtpApiManager.invokeApi('messages.readHistory', {
        peer: inputPeer,
        offset: 0,
        max_id: 0
      }).then(function (affectedHistory) {
        return processAffectedHistory(inputPeer, affectedHistory, 'messages.readHistory');
      });
    }

    historyStorage.readPromise = apiPromise.then(function () {
      if (foundDialog) {
        // console.log('done read history', peerID);
        foundDialog.unread_count = 0;
        $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: 0});
        $rootScope.$broadcast('messages_read');
        if (historyStorage && historyStorage.history.length) {
          foundDialog.read_inbox_max_id = historyStorage.history[0];
        }
      }
    })['finally'](function () {
      delete historyStorage.readPromise;
    });

    if (historyStorage && historyStorage.history.length) {
      var messageID, message, i, peerID, foundDialog, dialog;
      for (i = 0; i < historyStorage.history.length; i++) {
        messageID = historyStorage.history[i];
        message = messagesStorage[messageID];
        if (message && !message.out) {
          message.unread = false;
          if (messagesForHistory[messageID]) {
            messagesForHistory[messageID].unread = false;
          }
          if (messagesForDialogs[messageID]) {
            messagesForDialogs[messageID].unread = false;
          }
          NotificationsManager.cancel('msg' + messageID);
        }
      }
    }

    NotificationsManager.soundReset(AppPeersManager.getPeerString(peerID))

    return historyStorage.readPromise;
  }

  function readMessages (messageIDs) {
    MtpApiManager.invokeApi('messages.readMessageContents', {
      id: messageIDs
    }).then(function (affectedMessages) {
      ApiUpdatesManager.processUpdateMessage({
        _: 'updateShort',
        update: {
          _: 'updateReadMessagesContents',
          messages: messageIDs,
          pts: affectedMessages.pts,
          pts_count: affectedMessages.pts_count
        }
      });
    });
  }

  function flushHistory (inputPeer) {
    // console.log('start flush');
    var peerID = AppPeersManager.getPeerID(inputPeer),
        historyStorage = historiesStorage[peerID];

    return MtpApiManager.invokeApi('messages.deleteHistory', {
      peer: inputPeer,
      offset: 0
    }).then(function (affectedHistory) {
      return processAffectedHistory(inputPeer, affectedHistory, 'messages.deleteHistory');
    }).then(function () {
      var foundDialog = getDialogByPeerID(peerID);
      if (foundDialog[0]) {
        dialogsStorage.dialogs.splice(foundDialog[1], 1);
      }
      delete historiesStorage[peerID];
      $rootScope.$broadcast('dialog_flush', {peerID: peerID});
    });
  }

  function saveMessages (apiMessages) {
    angular.forEach(apiMessages, function (apiMessage) {
      if (apiMessage._ == 'messageEmpty') {
        return;
      }
      apiMessage.out = apiMessage.flags & 2 ? true : false;
      apiMessage.media_unread = apiMessage.flags & 32 ? true : false;

      var toPeerID = AppPeersManager.getPeerID(apiMessage.to_id);
      var isChannel = apiMessage.to_id._ == 'peerChannel';
      var channelID = isChannel ? -toPeerID : 0;

      var mid = getFullMessageID(apiMessage.id, channelID);
      apiMessage.mid = mid;
      messagesStorage[mid] = apiMessage;

      if (channelID && !apiMessage.out) {
        var dialog = getDialogByPeerID(toPeerID)[0];
        apiMessage.unread = dialog ? mid > dialog.read_inbox_max_id : true;
      } else {
        apiMessage.unread = apiMessage.flags & 1 ? true : false;
      }

      if (apiMessage.reply_to_msg_id) {
        apiMessage.reply_to_mid = getFullMessageID(apiMessage.reply_to_msg_id, channelID);
      }

      apiMessage.date -= serverTimeOffset;
      apiMessage.toID = toPeerID;
      apiMessage.fromID = apiMessage.from_id || toPeerID;
      if (apiMessage.fwd_from_id) {
        apiMessage.fwdFromID = AppPeersManager.getPeerID(apiMessage.fwd_from_id);
      }

      var mediaContext = {
        user_id: apiMessage.fromID,
        date: apiMessage.date
      };

      if (apiMessage.media) {
        switch (apiMessage.media._) {
          case 'messageMediaEmpty':
            delete apiMessage.media;
            break;
          case 'messageMediaPhoto':
            AppPhotosManager.savePhoto(apiMessage.media.photo, mediaContext);
            break;
          case 'messageMediaVideo':
            AppVideoManager.saveVideo(apiMessage.media.video, mediaContext);
            break;
          case 'messageMediaDocument':
            AppDocsManager.saveDoc(apiMessage.media.document, mediaContext);
            break;
          case 'messageMediaAudio':
            AppAudioManager.saveAudio(apiMessage.media.audio);
            break;
          case 'messageMediaWebPage':
            AppWebPagesManager.saveWebPage(apiMessage.media.webpage, apiMessage.mid, mediaContext);
            break;
        }
      }
      if (apiMessage.action) {
        if (apiMessage.action._ == 'messageActionChatEditPhoto') {
          AppPhotosManager.savePhoto(apiMessage.action.photo, mediaContext);
          if (isChannel) {
            apiMessage.action._ = 'messageActionChannelEditPhoto';
          }
        }
        else if (isChannel) {
          if (apiMessage.action._ == 'messageActionChatEditTitle') {
            apiMessage.action._ = 'messageActionChannelEditTitle';
          }
          if (apiMessage.action._ == 'messageActionChatDeletePhoto') {
            apiMessage.action._ = 'messageActionChannelDeletePhoto';
          }
        }
      }
      if (apiMessage.reply_markup) {
        apiMessage.reply_markup.pFlags = {
          resize: (apiMessage.reply_markup.flags & 1) > 0,
          one_time: (apiMessage.reply_markup.flags & 2) > 0,
          selective: (apiMessage.reply_markup.flags & 4) > 0
        };
      }

      if (apiMessage.message && apiMessage.message.length) {
        var myEntities = RichTextProcessor.parseEntities(apiMessage.message);
        var apiEntities = apiMessage.entities || [];
        apiMessage.totalEntities = RichTextProcessor.mergeEntities(myEntities, apiEntities, !apiMessage.pending);
      }
    });
  }

  function sendText(peerID, text, options) {
    if (!angular.isString(text) || !text.length) {
      return;
    }
    options = options || {};
    var messageID = tempID--,
        randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString(),
        historyStorage = historiesStorage[peerID],
        inputPeer = AppPeersManager.getInputPeerByID(peerID),
        flags = 0,
        replyToMsgID = options.replyToMsgID,
        isChannel = AppPeersManager.isChannel(peerID),
        asChannel = isChannel ? true : false,
        entities = [],
        message;

    text = RichTextProcessor.parseMarkdown(text, entities);

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    var fromID = AppUsersManager.getSelf().id;
    if (peerID != fromID) {
      flags |= 2;
      if (!isChannel && !AppUsersManager.isBot(peerID)) {
        flags |= 1;
      }
    }
    if (replyToMsgID) {
      flags |= 8;
    }
    if (asChannel) {
      fromID = 0;
    } else {
      flags |= 256;
    }
    message = {
      _: 'message',
      id: messageID,
      from_id: fromID,
      to_id: AppPeersManager.getOutputPeer(peerID),
      flags: flags,
      date: tsNow(true) + serverTimeOffset,
      message: text,
      random_id: randomIDS,
      reply_to_msg_id: replyToMsgID,
      entities: entities,
      views: asChannel && 1,
      pending: true
    };

    var toggleError = function (on) {
      var historyMessage = messagesForHistory[messageID];
      if (on) {
        message.error = true;
        if (historyMessage) {
          historyMessage.error = true;
        }
      } else {
        delete message.error;
        if (historyMessage) {
          delete historyMessage.error;
        }
      }
      $rootScope.$broadcast('messages_pending');
    }

    message.send = function () {
      toggleError(false);
      var sentRequestOptions = {};
      if (pendingAfterMsgs[peerID]) {
        sentRequestOptions.afterMessageID = pendingAfterMsgs[peerID].messageID;
      }
      var flags = 0;
      if (replyToMsgID) {
        flags |= 1;
      }
      if (entities.length) {
        flags |= 8;
      }
      if (asChannel) {
        flags |= 16;
      }
      // console.log(flags, entities);
      MtpApiManager.invokeApi('messages.sendMessage', {
        flags: flags,
        peer: inputPeer,
        message: text,
        random_id: randomID,
        reply_to_msg_id: getMessageLocalID(replyToMsgID),
        entities: entities
      }, sentRequestOptions).then(function (updates) {
        if (updates._ == 'updateShortSentMessage') {
          message.flags = updates.flags;
          message.date = updates.date;
          message.id = updates.id;
          message.media = updates.media;
          message.entities = updates.entities;
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
              _: isChannel ? 'updateNewChannelMessage' : 'updateNewMessage',
              message: message,
              pts: updates.pts,
              pts_count: updates.pts_count
            }]
          };
        }
        ApiUpdatesManager.processUpdateMessage(updates);
      }, function (error) {
        toggleError(true);
      })['finally'](function () {
        if (pendingAfterMsgs[peerID] === sentRequestOptions) {
          delete pendingAfterMsgs[peerID];
        }
      });

      pendingAfterMsgs[peerID] = sentRequestOptions;
    };

    saveMessages([message]);
    historyStorage.pending.unshift(messageID);
    $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID, my: true});

    // setTimeout(function () {
      message.send();
    // }, 5000);

    pendingByRandomID[randomIDS] = [peerID, messageID];
  };

  function sendFile(peerID, file, options) {
    options = options || {};
    var messageID = tempID--,
        randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString(),
        historyStorage = historiesStorage[peerID],
        inputPeer = AppPeersManager.getInputPeerByID(peerID),
        flags = 0,
        replyToMsgID = options.replyToMsgID,
        isChannel = AppPeersManager.isChannel(peerID),
        asChannel = isChannel ? true : false,
        attachType, apiFileName, realFileName;

    if (!options.isMedia) {
      attachType = 'document';
      apiFileName = 'document.' + file.type.split('/')[1];
    } else if (['image/jpeg', 'image/png', 'image/bmp'].indexOf(file.type) >= 0) {
      attachType = 'photo';
      apiFileName = 'photo.' + file.type.split('/')[1];
    } else if (file.type.substr(0, 6) == 'audio/' || ['video/ogg'].indexOf(file.type) >= 0) {
      attachType = 'audio';
      apiFileName = 'audio.' + (file.type.split('/')[1] == 'ogg' ? 'ogg' : 'mp3');
    } else if (file.type.substr(0, 6) == 'video/') {
      attachType = 'video';
      apiFileName = 'video.mp4';
    } else {
      attachType = 'document';
      apiFileName = 'document.' + file.type.split('/')[1];
    }

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    var fromID = AppUsersManager.getSelf().id;
    if (peerID != fromID) {
      flags |= 2;
      if (!isChannel && !AppUsersManager.isBot(peerID)) {
        flags |= 1;
      }
    }
    if (replyToMsgID) {
      flags |= 8;
    }
    if (asChannel) {
      fromID = 0;
    } else {
      flags |= 256;
    }
    var media = {
      _: 'messageMediaPending',
      type: attachType,
      file_name: file.name || apiFileName,
      size: file.size,
      progress: {percent: 1, total: file.size}
    };

    var message = {
      _: 'message',
      id: messageID,
      from_id: fromID,
      to_id: AppPeersManager.getOutputPeer(peerID),
      flags: flags,
      date: tsNow(true) + serverTimeOffset,
      message: '',
      media: media,
      random_id: randomIDS,
      reply_to_msg_id: replyToMsgID,
      views: asChannel && 1,
      pending: true
    };

    var toggleError = function (on) {
      var historyMessage = messagesForHistory[messageID];
      if (on) {
        message.error = true;
        if (historyMessage) {
          historyMessage.error = true;
        }
      } else {
        delete message.error;
        if (historyMessage) {
          delete historyMessage.error;
        }
      }
      $rootScope.$broadcast('messages_pending');
    }

    var uploaded = false,
        uploadPromise;

    message.send = function () {
      var sendFileDeferred = $q.defer();

      sendFilePromise.then(function () {
        if (!uploaded || message.error) {
          uploaded = false;
          uploadPromise = MtpApiFileManager.uploadFile(file);
        }

        uploadPromise.then(function (inputFile) {
          inputFile.name = apiFileName;
          uploaded = true;
          var inputMedia;
          switch (attachType) {
            case 'photo':
              inputMedia = {_: 'inputMediaUploadedPhoto', file: inputFile};
              break;

            case 'video':
              inputMedia = {_: 'inputMediaUploadedVideo', file: inputFile, duration: 0, w: 0, h: 0, mime_type: file.type};
              break;

            case 'audio':
              inputMedia = {_: 'inputMediaUploadedAudio', file: inputFile, duration: 0, mime_type: file.type};
              break;

            case 'document':
            default:
              inputMedia = {_: 'inputMediaUploadedDocument', file: inputFile, mime_type: file.type, attributes: [
                {_: 'documentAttributeFilename', file_name: file.name}
              ]};
          }
          var flags = 0;
          if (replyToMsgID) {
            flags |= 1;
          }
          if (asChannel) {
            flags |= 16;
          }
          MtpApiManager.invokeApi('messages.sendMedia', {
            flags: flags,
            peer: inputPeer,
            media: inputMedia,
            random_id: randomID,
            reply_to_msg_id: getMessageLocalID(replyToMsgID)
          }).then(function (updates) {
            ApiUpdatesManager.processUpdateMessage(updates);
          }, function (error) {
            if (attachType == 'photo' &&
                error.code == 400 &&
                error.type == 'PHOTO_INVALID_DIMENSIONS') {
              error.handled = true;
              attachType = 'document';
              message.send();
              return;
            }
            toggleError(true);
          });
        }, function (error) {
          toggleError(true);
        }, function (progress) {
          // console.log('upload progress', progress);
          media.progress.done = progress.done;
          media.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
          $rootScope.$broadcast('history_update', {peerID: peerID});
        });

        media.progress.cancel = function () {
          if (!uploaded) {
            sendFileDeferred.resolve();
            uploadPromise.cancel();
            cancelPendingMessage(randomIDS);
          }
        }

        uploadPromise['finally'](function () {
          sendFileDeferred.resolve();
        });
      });

      sendFilePromise = sendFileDeferred.promise;
    };

    saveMessages([message]);
    historyStorage.pending.unshift(messageID);
    $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID, my: true});

    message.send();

    pendingByRandomID[randomIDS] = [peerID, messageID];
  }

  function sendOther(peerID, inputMedia, options) {
    options = options || {};

    var messageID = tempID--,
        randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString(),
        historyStorage = historiesStorage[peerID],
        inputPeer = AppPeersManager.getInputPeerByID(peerID),
        replyToMsgID = options.replyToMsgID,
        isChannel = AppPeersManager.isChannel(peerID),
        asChannel = isChannel ? true : false;

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    var fromID = AppUsersManager.getSelf().id;
    var media;
    switch (inputMedia._) {
      case 'inputMediaContact':
        media = angular.extend({}, inputMedia, {_: 'messageMediaContact'});
        break;

      case 'inputMediaPhoto':
        media = {
          _: 'messageMediaPhoto',
          photo: AppPhotosManager.getPhoto(inputMedia.id.id)
        };
        break;

      case 'inputMediaDocument':
        var doc = AppDocsManager.getDoc(inputMedia.id.id);
        if (doc.sticker && doc.stickerSetInput) {
          AppStickersManager.pushPopularSticker(doc.id);
        };
        media = {
          _: 'messageMediaDocument',
          'document': doc
        };
        break;
    }

    var flags = 0;
    if (peerID != fromID) {
      flags |= 2;
      if (!AppUsersManager.isBot(peerID)) {
        flags |= 1;
      }
    }
    if (replyToMsgID) {
      flags |= 8;
    }
    if (asChannel) {
      fromID = 0;
    } else {
      flags |= 256;
    }

    var message = {
      _: 'message',
      id: messageID,
      from_id: fromID,
      to_id: AppPeersManager.getOutputPeer(peerID),
      flags: flags,
      date: tsNow(true) + serverTimeOffset,
      message: '',
      media: media,
      random_id: randomIDS,
      reply_to_msg_id: replyToMsgID,
      views: asChannel && 1,
      pending: true
    };

    var toggleError = function (on) {
      var historyMessage = messagesForHistory[messageID];
      if (on) {
        message.error = true;
        if (historyMessage) {
          historyMessage.error = true;
        }
      } else {
        delete message.error;
        if (historyMessage) {
          delete historyMessage.error;
        }
      }
      $rootScope.$broadcast('messages_pending');
    }

    message.send = function () {
      var flags = 0;
      if (replyToMsgID) {
        flags |= 1;
      }
      if (asChannel) {
        flags |= 16;
      }

      var sentRequestOptions = {};
      if (pendingAfterMsgs[peerID]) {
        sentRequestOptions.afterMessageID = pendingAfterMsgs[peerID].messageID;
      }

      MtpApiManager.invokeApi('messages.sendMedia', {
        flags: flags,
        peer: inputPeer,
        media: inputMedia,
        random_id: randomID,
        reply_to_msg_id: getMessageLocalID(replyToMsgID)
      }, sentRequestOptions).then(function (updates) {
        ApiUpdatesManager.processUpdateMessage(updates);
      }, function (error) {
        toggleError(true);
      })['finally'](function () {
        if (pendingAfterMsgs[peerID] === sentRequestOptions) {
          delete pendingAfterMsgs[peerID];
        }
      });
      pendingAfterMsgs[peerID] = sentRequestOptions;
    };

    saveMessages([message]);
    historyStorage.pending.unshift(messageID);
    $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID, my: true});

    message.send();
    pendingByRandomID[randomIDS] = [peerID, messageID];
  }

  function forwardMessages (peerID, mids) {
    mids = mids.sort();

    var flags = 0;
    var msgIDs = [];
    var randomIDs = [];
    var len = mids.length;
    var i, mid, msgID;
    var fromChannel = getMessageIDInfo(mids[0])[1];
    var isChannel = AppPeersManager.isChannel(peerID);
    var asChannel = isChannel ? true : false;

    if (asChannel) {
      flags |= 16;
    }

    for (i = 0; i < len; i++) {
      msgIDs.push(getMessageLocalID(mids[i]));
      randomIDs.push([nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)]);
    }
    var sentRequestOptions = {};
    if (pendingAfterMsgs[peerID]) {
      sentRequestOptions.afterMessageID = pendingAfterMsgs[peerID].messageID;
    }
    return MtpApiManager.invokeApi('messages.forwardMessages', {
      flags: flags,
      from_peer: AppPeersManager.getInputPeerByID(-fromChannel),
      id: msgIDs,
      random_id: randomIDs,
      to_peer: AppPeersManager.getInputPeerByID(peerID),
    }, sentRequestOptions).then(function (updates) {
      ApiUpdatesManager.processUpdateMessage(updates);
    })['finally'](function () {
      if (pendingAfterMsgs[peerID] === sentRequestOptions) {
        delete pendingAfterMsgs[peerID];
      }
    });
    pendingAfterMsgs[peerID] = sentRequestOptions;
  };

  function startBot (botID, chatID, startParam) {
    if (startParam) {
      var randomID = bigint(nextRandomInt(0xFFFFFFFF)).shiftLeft(32).add(bigint(nextRandomInt(0xFFFFFFFF))).toString();

      return MtpApiManager.invokeApi('messages.startBot', {
        bot: AppUsersManager.getUserInput(botID),
        chat_id: AppChatsManager.getChatInput(chatID),
        random_id: randomID,
        start_param: startParam
      });
    }

    var peerID = chatID ? -chatID : botID;
    var inputPeer = AppPeersManager.getInputPeerByID(peerID);

    if (chatID) {
      return MtpApiManager.invokeApi('messages.addChatUser', {
        chat_id: AppChatsManager.getChatInput(chatID),
        user_id: AppUsersManager.getUserInput(botID)
      }).then(function (updates) {
        ApiUpdatesManager.processUpdateMessage(updates);
      }, function (error) {
        if (error && error.type == 'USER_ALREADY_PARTICIPANT') {
          var bot = AppUsersManager.getUser(botID);
          sendText(-chatID, '/start@' + bot.username);
          error.handled = true;
        }
      });
    }

    return sendText(botID, '/start');
  }

  function cancelPendingMessage (randomID) {
    var pendingData = pendingByRandomID[randomID];

    console.log('pending', randomID, pendingData);

    if (pendingData) {
      var peerID = pendingData[0],
          tempID = pendingData[1],
          historyStorage = historiesStorage[peerID],
          pos = historyStorage.pending.indexOf(tempID);

      ApiUpdatesManager.processUpdateMessage({
        _: 'updateShort',
        update: {
          _: 'updateDeleteMessages',
          messages: [tempID]
        }
      });

      if (pos != -1) {
        historyStorage.pending.splice(pos, 1);
      }

      delete messagesForHistory[tempID];
      delete messagesStorage[tempID];

      return true;
    }

    return false;
  }

  function finalizePendingMessage(randomID, finalMessage) {
    var pendingData = pendingByRandomID[randomID];
    // console.log('pdata', randomID, pendingData);

    if (pendingData) {
      var peerID = pendingData[0],
          tempID = pendingData[1],
          historyStorage = historiesStorage[peerID],
          message,
          historyMessage;

      // console.log('pending', randomID, historyStorage.pending);
      var pos = historyStorage.pending.indexOf(tempID);
      if (pos != -1) {
        historyStorage.pending.splice(pos, 1);
      }

      if (message = messagesStorage[tempID]) {
        delete message.pending;
        delete message.error;
        delete message.random_id;
        delete message.send;
      }

      if (historyMessage = messagesForHistory[tempID]) {
        messagesForHistory[finalMessage.mid] = angular.extend(historyMessage, wrapForHistory(finalMessage.mid));
        delete historyMessage.pending;
        delete historyMessage.error;
        delete historyMessage.random_id;
        delete historyMessage.send;

        $rootScope.$broadcast('messages_pending');
      }

      delete messagesForHistory[tempID];
      delete messagesStorage[tempID];

      return message;
    }

    return false;
  }

  function openChatInviteLink (hash) {
    return MtpApiManager.invokeApi('messages.checkChatInvite', {
      hash: hash
    }).then(function (chatInvite) {
      var chatTitle;
      if (chatInvite._ == 'chatInviteAlready') {
        AppChatsManager.saveApiChat(chatInvite.chat);
        if (!chatInvite.chat.pFlags.left) {
          return $rootScope.$broadcast('history_focus', {
            peerString: AppChatsManager.getChatString(chatInvite.chat.id)
          });
        }
        chatTitle = chatInvite.chat.title;
      } else {
        chatTitle = chatInvite.title;
      }
      ErrorService.confirm({
        type:  chatInvite.flags & 1 ? 'JOIN_CHANNEL_BY_LINK' : 'JOIN_GROUP_BY_LINK',
        title: chatTitle
      }).then(function () {
        return MtpApiManager.invokeApi('messages.importChatInvite', {
          hash: hash
        }).then(function (updates) {
          ApiUpdatesManager.processUpdateMessage(updates);

          if (updates.chats && updates.chats.length == 1) {
            $rootScope.$broadcast('history_focus', {peerString: AppChatsManager.getChatString(updates.chats[0].id)
            });
          }
          else if (updates.updates && updates.updates.length) {
            for (var i = 0, len = updates.updates.length, update; i < len; i++) {
              update = updates.updates[i];
              if (update._ == 'updateNewMessage') {
                $rootScope.$broadcast('history_focus', {peerString: AppChatsManager.getChatString(update.message.to_id.chat_id)
                });
                break;
              }
            }
          }
        });
      });
    });
  }

  function getMessagePeer (message) {
    var toID = message.to_id && AppPeersManager.getPeerID(message.to_id) || 0;

    if (toID < 0) {
      return toID;
    } else if (message.out || message.flags & 2) {
      return toID;
    }
    return message.from_id;
  }

  function wrapForDialog (msgID, dialog) {
    var useCache = msgID && dialog !== undefined;
    var unreadCount = dialog && dialog.unread_count;

    if (useCache && messagesForDialogs[msgID] !== undefined) {
      delete messagesForDialogs[msgID].typing;
      return messagesForDialogs[msgID];
    }

    var message = angular.copy(messagesStorage[msgID]);

    if (!message || !message.to_id) {
      if (dialog && dialog.peerID) {
        message = {_: 'message', to_id: AppPeersManager.getOutputPeer(dialog.peerID), deleted: true, date: tsNow(true)};
        message.deleted = true;
      } else {
        return message;
      }
    }

    message.peerID = getMessagePeer(message);
    message.peerData = AppPeersManager.getPeer(message.peerID);
    message.peerString = AppPeersManager.getPeerString(message.peerID);
    message.unreadCount = unreadCount;

    if (message._ == 'messageService' && message.action.user_id) {
      message.action.user = AppUsersManager.getUser(message.action.user_id);
    }

    if (message.message && message.message.length) {
      message.richMessage = RichTextProcessor.wrapRichText(message.message.substr(0, 64), {noLinks: true, noLinebreaks: true});
    }

    message.dateText = dateOrTimeFilter(message.date);

    if (useCache) {
      messagesForDialogs[msgID] = message;
    }

    return message;
  }

  function wrapForHistory (msgID) {
    if (messagesForHistory[msgID] !== undefined) {
      return messagesForHistory[msgID];
    }

    var message = angular.copy(messagesStorage[msgID]) || {id: msgID};

    if (message.media && message.media.progress !== undefined) {
      message.media.progress = messagesStorage[msgID].media.progress;
    }

    var fromUser = message.from_id && AppUsersManager.getUser(message.from_id);
    var fromBot = fromUser && fromUser.pFlags.bot && fromUser.username || false;
    var withBot = (fromBot ||
                    message.to_id && (
                      message.to_id.chat_id ||
                      message.to_id.user_id && AppUsersManager.isBot(message.to_id.user_id)
                    )
                  );

    if (message.media) {
      if (message.media.caption &&
          message.media.caption.length) {
        message.media.rCaption = RichTextProcessor.wrapRichText(message.media.caption, {
          noCommands: !withBot,
          fromBot: fromBot
        });
      }

      switch (message.media._) {
        case 'messageMediaPhoto':
          message.media.photo = AppPhotosManager.wrapForHistory(message.media.photo.id);
          break;

        case 'messageMediaVideo':
          message.media.video = AppVideoManager.wrapForHistory(message.media.video.id);
          break;

        case 'messageMediaDocument':
          message.media.document = AppDocsManager.wrapForHistory(message.media.document.id);
          break;

        case 'messageMediaAudio':
          message.media.audio = AppAudioManager.wrapForHistory(message.media.audio.id);
          break;

        case 'messageMediaGeo':
          var mapUrl = 'https://maps.google.com/?q=' + message.media.geo['lat'] + ',' + message.media.geo['long'];
          message.media.mapUrl = $sce.trustAsResourceUrl(mapUrl);
          break;

        case 'messageMediaVenue':
          var mapUrl;
          if (message.media.provider == 'foursquare' &&
              message.media.venue_id) {
            mapUrl = 'https://foursquare.com/v/' + encodeURIComponent(message.media.venue_id);
          } else {
            mapUrl = 'https://maps.google.com/?q=' + message.media.geo['lat'] + ',' + message.media.geo['long'];
          }
          message.media.mapUrl = $sce.trustAsResourceUrl(mapUrl);
          break;

        case 'messageMediaContact':
          message.media.rFullName = RichTextProcessor.wrapRichText(
            message.media.first_name + ' ' + (message.media.last_name || ''),
            {noLinks: true, noLinebreaks: true}
          );
          break;

        case 'messageMediaWebPage':
          if (!message.media.webpage ||
              message.media.webpage._ == 'webPageEmpty' ||
              Config.Mobile) {
            delete message.media;
            break;
          }
          message.media.webpage = AppWebPagesManager.wrapForHistory(message.media.webpage.id);
          break;
      }
    }
    else if (message.action) {
      switch (message.action._) {
        case 'messageActionChatEditPhoto':
        case 'messageActionChannelEditPhoto':
          message.action.photo = AppPhotosManager.wrapForHistory(message.action.photo.id);
          break;

        case 'messageActionChatCreate':
        case 'messageActionChatEditTitle':
        case 'messageActionChannelCreate':
        case 'messageActionChannelEditTitle':
          message.action.rTitle = RichTextProcessor.wrapRichText(message.action.title, {noLinks: true, noLinebreaks: true}) || _('chat_title_deleted');
          break;

        case 'messageActionBotIntro':
          message.action.rDescription = RichTextProcessor.wrapRichText(message.action.description, {
            noCommands: !withBot,
            fromBot: fromBot
          });
          break;
      }
    }

    var replyToMsgID = message.reply_to_mid;
    if (replyToMsgID) {
      if (messagesStorage[replyToMsgID]) {
        message.reply_to_msg = wrapForDialog(replyToMsgID);
      } else {
        message.reply_to_msg = {mid: replyToMsgID, loading: true};
        if (needSingleMessages.indexOf(replyToMsgID) == -1) {
          needSingleMessages.push(replyToMsgID);
          if (fetchSingleMessagesTimeout === false) {
            fetchSingleMessagesTimeout = setTimeout(fetchSingleMessages, 100);
          }
        }
      }
    }

    return messagesForHistory[msgID] = message;
  }

  function wrapReplyMarkup (replyMarkup) {
    if (!replyMarkup ||
        replyMarkup._ == 'replyKeyboardHide') {
      return false;
    }
    if (replyMarkup.wrapped) {
      return replyMarkup;
    }
    var count = replyMarkup.rows && replyMarkup.rows.length || 0;
    if (count > 0 && count <= 4 && !replyMarkup.pFlags.resize) {
      replyMarkup.splitCount = count;
    }
    replyMarkup.wrapped = true;
    angular.forEach(replyMarkup.rows, function (markupRow) {
      angular.forEach(markupRow.buttons, function (markupButton) {
        markupButton.rText = RichTextProcessor.wrapRichText(markupButton.text, {noLinks: true, noLinebreaks: true});
      })
    })

    if (nextRandomInt(1)) {
      replyMarkup.rows = replyMarkup.rows.slice(0, 2);
    }
    return replyMarkup;
  }

  function fetchSingleMessages () {
    if (fetchSingleMessagesTimeout !== false) {
      clearTimeout(fetchSingleMessagesTimeout);
      fetchSingleMessagesTimeout = false;
    }
    if (!needSingleMessages.length) {
      return;
    }
    var mids = needSingleMessages.slice();
    needSingleMessages = [];

    var splitted = splitMessageIDsByChannels(mids);
    angular.forEach(splitted.msgIDs, function (msgIDs, channelID) {
      var promise;
      if (channelID > 0) {
        promise = MtpApiManager.invokeApi('channels.getMessages', {
          channel: AppChatsManager.getChannelInput(channelID),
          id: msgIDs
        });
      } else {
        promise = MtpApiManager.invokeApi('messages.getMessages', {
          id: msgIDs
        });
      }

      promise.then(function (getMessagesResult) {
        AppUsersManager.saveApiUsers(getMessagesResult.users);
        AppChatsManager.saveApiChats(getMessagesResult.chats);
        saveMessages(getMessagesResult.messages);

        $rootScope.$broadcast('messages_downloaded', splitted.mids[channelID]);
      })
    })
  }

  function incrementMessageViews () {
    if (incrementMessageViewsTimeout !== false) {
      clearTimeout(incrementMessageViewsTimeout);
      incrementMessageViewsTimeout = false;
    }
    if (!needIncrementMessageViews.length) {
      return;
    }
    var mids = needIncrementMessageViews.slice();
    needIncrementMessageViews = [];

    var splitted = splitMessageIDsByChannels(mids);
    angular.forEach(splitted.msgIDs, function (msgIDs, channelID) {
      // console.log('increment', msgIDs, channelID);
      MtpApiManager.invokeApi('messages.getMessagesViews', {
        peer: AppPeersManager.getInputPeerByID(-channelID),
        id: msgIDs,
        increment: true
      }).then(function (views) {
        if (channelID) {
          var mids = splitted.mids[channelID];
          var updates = [];
          for (var i = 0; i < mids.length; i++) {
            updates.push({
              _: 'updateChannelMessageViews',
              channel_id: channelID,
              id: mids[i],
              views: views[i]
            });
          }
          ApiUpdatesManager.processUpdateMessage({
            _: 'updates',
            updates: updates,
            chats: [],
            users: []
          });
        }
      })
    })
  }

  function regroupWrappedHistory (history, limit) {
    if (!history || !history.length) {
      return false;
    }
    var start = 0,
        len = history.length,
        end = len,
        i, curDay, prevDay, curMessage, prevMessage, curGrouped, prevGrouped,
        wasUpdated = false,
        groupFwd = !Config.Mobile;

    if (limit > 0) {
      end = Math.min(limit, len);
    } else if (limit < 0) {
      start = Math.max(0, end + limit);
    }

    for (i = start; i < end; i++) {
      curMessage = history[i];
      curDay = Math.floor((curMessage.date + midnightOffset) / 86400);

      prevGrouped = prevMessage && prevMessage.grouped;
      curGrouped = curMessage.grouped;

      if (curDay === prevDay) {
        if (curMessage.needDate) {
          delete curMessage.needDate;
          wasUpdated = true;
        }
      } else if (!i || prevMessage) {
        if (!curMessage.needDate) {
          curMessage.needDate = true;
          wasUpdated = true;
        }
      }

      if (curMessage.fwdFromID &&
          curMessage.media &&
          curMessage.media.document &&
          (curMessage.media.document.sticker || curMessage.media.document.audioTitle) &&
          (curMessage.fromID != (prevMessage || {}).fromID || !(prevMessage || {}).fwdFromID)) {
        delete curMessage.fwdFromID;
        curMessage._ = 'message';
      }

      if (curMessage.views &&
          !incrementedMessageViews[curMessage.mid]) {
        incrementedMessageViews[curMessage.mid] = true;
        needIncrementMessageViews.push(curMessage.mid);
        if (incrementMessageViewsTimeout === false) {
          incrementMessageViewsTimeout = setTimeout(incrementMessageViews, 10000);
        }
      }

      if (prevMessage &&
          // !curMessage.views &&
          curMessage.fromID == prevMessage.fromID &&
          !prevMessage.fwdFromID == !curMessage.fwdFromID &&
          !prevMessage.action &&
          !curMessage.action &&
          curMessage.date < prevMessage.date + 900) {

        var singleLine = curMessage.message && curMessage.message.length < 70 && curMessage.message.indexOf("\n") == -1 && !curMessage.reply_to_mid;
        if (groupFwd && curMessage.fwdFromID && curMessage.fwdFromID == prevMessage.fwdFromID) {
          curMessage.grouped = singleLine ? 'im_grouped_fwd_short' : 'im_grouped_fwd';
        } else {
          curMessage.grouped = !curMessage.fwdFromID && singleLine ? 'im_grouped_short' : 'im_grouped';
        }
        if (groupFwd && curMessage.fwdFromID) {
          if (!prevMessage.grouped) {
            prevMessage.grouped = 'im_grouped_fwd_start';
          }
          if (curMessage.grouped && i == len - 1) {
            curMessage.grouped += ' im_grouped_fwd_end';
          }
        }
      } else if (prevMessage || !i) {
        delete curMessage.grouped;

        if (groupFwd && prevMessage && prevMessage.grouped && prevMessage.fwdFromID) {
          prevMessage.grouped += ' im_grouped_fwd_end';
        }
      }
      if (!wasUpdated && prevGrouped != (prevMessage && prevMessage.grouped)) {
        wasUpdated = true;
      }
      prevMessage = curMessage;
      prevDay = curDay;
    }
    if (!wasUpdated && curGrouped != (prevMessage && prevMessage.grouped)) {
      wasUpdated = true;
    }

    return wasUpdated;
  }

  function getMessageThumb (message, thumbWidth, thumbHeight) {
    var thumbPhotoSize;
    var sticker = false;
    if (message.media) {
      switch (message.media._) {
        case 'messageMediaPhoto':
          thumbPhotoSize = AppPhotosManager.choosePhotoSize(message.media.photo, thumbWidth, thumbHeight);
          break;

        case 'messageMediaDocument':
          thumbPhotoSize = message.media.document.thumb;
          if (message.media.document.sticker) {
            sticker = true;
          }
          break;

        case 'messageMediaVideo':
          thumbPhotoSize = message.media.video.thumb;
          break;
      }
    }

    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      var dim = calcImageInBox(thumbPhotoSize.w, thumbPhotoSize.h, thumbWidth, thumbHeight, true);

      var thumb = {
        width: dim.w,
        height: dim.h,
        location: thumbPhotoSize.location,
        size: thumbPhotoSize.size
      };
      if (sticker) {
        thumb.location.sticker = true;
      }

      return thumb;
    }

    return false;
  }

  function incrementMaxSeenID (maxID) {
    if (maxSeenID !== false && maxID && maxID > maxSeenID) {
      Storage.set({
        max_seen_msg: maxID
      });
    }
  }

  function notifyAboutMessage (message, options) {
    options = options || {};

    var peerID = getMessagePeer(message);
    var peerString;
    var notification = {},
        notificationMessage = false,
        notificationPhoto;

    var notifySettings = NotificationsManager.getNotifySettings();

    if (message.fwdFromID && options.fwd_count) {
      notificationMessage = fwdMessagesPluralize(options.fwd_count);
    } else if (message.message) {
      if (notifySettings.nopreview) {
        notificationMessage = _('conversation_message_sent');
      } else {
        notificationMessage = RichTextProcessor.wrapPlainText(message.message);
      }
    } else if (message.media) {
      switch (message.media._) {
        case 'messageMediaPhoto': notificationMessage = _('conversation_media_photo_raw'); break;
        case 'messageMediaVideo': notificationMessage = _('conversation_media_video_raw'); break;
        case 'messageMediaDocument':
          if (message.media.document.sticker) {
            notificationMessage = _('conversation_media_sticker');
            var stickerEmoji = message.media.document.stickerEmojiRaw;
            if (stickerEmoji !== undefined) {
              notificationMessage = RichTextProcessor.wrapPlainText(stickerEmoji) + ' (' + notificationMessage + ')';
            }
          } else {
            notificationMessage = message.media.document.file_name || _('conversation_media_document_raw');
          }
          break;
        case 'messageMediaAudio': notificationMessage = _('conversation_media_audio_raw'); break;
        case 'messageMediaGeo':
        case 'messageMediaVenue': notificationMessage = _('conversation_media_location_raw'); break;
        case 'messageMediaContact': notificationMessage = _('conversation_media_contact_raw'); break;
        default: notificationMessage = _('conversation_media_attachment_raw'); break;
      }
    } else if (message._ == 'messageService') {
      switch (message.action._) {
        case 'messageActionChatCreate':
          notificationMessage = _('conversation_group_created_raw');
          break;
        case 'messageActionChatEditTitle': notificationMessage = _('conversation_group_renamed_raw');
          break;
        case 'messageActionChatEditPhoto': notificationMessage = _('conversation_group_photo_updated_raw');
          break;
        case 'messageActionChatDeletePhoto': notificationMessage = _('conversation_group_photo_removed_raw');
          break;
        case 'messageActionChatAddUser':
          notificationMessage = message.action.user_id == message.from_id ? _('conversation_returned_to_group') : _('conversation_invited_user_message_raw');
          break;
        case 'messageActionChatDeleteUser':
          notificationMessage = message.action.user_id == message.from_id ? _('conversation_left_group') : _('conversation_kicked_user_message_raw');
          break;
        case 'messageActionChatJoinedByLink':
          notificationMessage = _('conversation_joined_by_link');
          break;
        case 'messageActionChannelCreate':
          notificationMessage = _('conversation_created_channel');
          break;
        case 'messageActionChannelEditTitle':
          notificationMessage = _('conversation_changed_channel_name');
          break;
        case 'messageActionChannelEditPhoto':
          notificationMessage = _('conversation_changed_channel_photo');
          break;
        case 'messageActionChannelDeletePhoto':
          notificationMessage = _('conversation_removed_channel_photo');
          break;
      }
    }


    if (peerID > 0) {
      var fromUser = AppUsersManager.getUser(message.from_id);
      var fromPhoto = AppUsersManager.getUserPhoto(message.from_id);

      notification.title = (fromUser.first_name || '') +
                           (fromUser.first_name && fromUser.last_name ? ' ' : '') +
                           (fromUser.last_name || '');
      if (!notification.title) {
        notification.title = fromUser.phone || _('conversation_unknown_user_raw');
      }

      notificationPhoto = fromPhoto;

      peerString = AppUsersManager.getUserString(peerID);

    } else {
      notification.title = AppChatsManager.getChat(-peerID).title || _('conversation_unknown_chat_raw');

      if (message.from_id > 0) {
        var fromUser = AppUsersManager.getUser(message.from_id);
        notification.title = (fromUser.first_name || fromUser.last_name || _('conversation_unknown_user_raw')) +
                             ' @ ' +
                             notification.title;
      }

      notificationPhoto = AppChatsManager.getChatPhoto(-peerID);

      peerString = AppChatsManager.getChatString(-peerID);
    }

    notification.title = RichTextProcessor.wrapPlainText(notification.title);

    notification.onclick = function () {
      $rootScope.$broadcast('history_focus', {
        peerString: peerString,
        messageID: message.flags & 16 ? message.mid : 0,
      });
    };

    notification.message = notificationMessage;
    notification.image = notificationPhoto.placeholder;
    notification.key = 'msg' + message.mid;
    notification.tag = peerString;

    if (notificationPhoto.location && !notificationPhoto.location.empty) {
      MtpApiFileManager.downloadSmallFile(notificationPhoto.location, notificationPhoto.size).then(function (blob) {
        notification.image = FileManager.getUrl(blob, 'image/jpeg');

        if (message.unread) {
          NotificationsManager.notify(notification);
        }
      });
    } else {
      NotificationsManager.notify(notification);
    }
  }

  if (window.navigator.mozSetMessageHandler) {
    window.navigator.mozSetMessageHandler('activity', function(activityRequest) {
      var source = activityRequest.source;
      console.log(dT(), 'Received activity', source.name, source.data);

      if (source.name === 'share' && source.data.blobs.length > 0) {
        PeersSelectService.selectPeers({confirm_type: 'EXT_SHARE_PEER'}).then(function (peerStrings) {
          angular.forEach(peerStrings, function (peerString) {
            var peerID = AppPeersManager.getPeerID(peerString);
            angular.forEach(source.data.blobs, function (blob) {
              sendFile(peerID, blob, {isMedia: true});
            });
          })
          if (peerStrings.length == 1) {
            $rootScope.$broadcast('history_focus', {peerString: peerStrings[0]});
          }
        });
      }
    });
  }

  var newMessagesHandlePromise = false;
  var newMessagesToHandle = {};
  var newDialogsHandlePromise = false;
  var newDialogsToHandle = {};
  var notificationsHandlePromise = false;
  var notificationsToHandle = {};

  function handleNewMessages () {
    $timeout.cancel(newMessagesHandlePromise);
    newMessagesHandlePromise = false;
    $rootScope.$broadcast('history_multiappend', newMessagesToHandle);
    newMessagesToHandle = {};
  }

  function handleNewDialogs () {
    $timeout.cancel(newDialogsHandlePromise);
    newDialogsHandlePromise = false;
    angular.forEach(newDialogsToHandle, function (dialog) {
      pushDialogToStorage(dialog);
    });
    $rootScope.$broadcast('dialogs_multiupdate', newDialogsToHandle);
    newDialogsToHandle = {};
  }

  function handleNotifications () {
    $timeout.cancel(notificationsHandlePromise);
    notificationsHandlePromise = false;

    var timeout = $rootScope.idle.isIDLE && StatusManager.isOtherDeviceActive() ? 30000 : 1000;
    angular.forEach(notificationsToHandle, function (notifyPeerToHandle) {
      notifyPeerToHandle.isMutedPromise.then(function (muted) {
        var topMessage = notifyPeerToHandle.top_message;
        if (muted ||
            !topMessage.unread) {
          return;
        }
        setTimeout(function () {
          if (topMessage.unread) {
            notifyAboutMessage(topMessage, {
              fwd_count: notifyPeerToHandle.fwd_count
            });
          }
        }, timeout);
      });
    });

    notificationsToHandle = {};
  }

  $rootScope.$on('apiUpdate', function (e, update) {
    // if (update._ != 'updateUserStatus') {
    //   console.log('on apiUpdate', update);
    // }
    switch (update._) {
      case 'updateMessageID':
        var randomID = update.random_id;
        var pendingData = pendingByRandomID[randomID];
        if (pendingData) {
          var peerID = pendingData[0];
          var channelID = AppPeersManager.isChannel(peerID) ? -peerID : 0;
          pendingByMessageID[getFullMessageID(update.id, channelID)] = randomID;
        }
        break;

      case 'updateNewMessage':
      case 'updateNewChannelMessage':
        var message = update.message,
            peerID = getMessagePeer(message),
            historyStorage = historiesStorage[peerID];

        if (update._ == 'updateNewChannelMessage' &&
            !(message.flags & 16 || message.flags & 2 || (message.flags & 256) == 0)) {
          // we don't support not important messages yet
          break;
        }

        saveMessages([message]);

        if (historyStorage !== undefined) {
          var history = historyStorage.history;
          if (history.indexOf(message.mid) != -1) {
            return false;
          }
          var topMsgID = history[0];
          history.unshift(message.mid);
          if (message.mid > 0 && message.mid < topMsgID) {
            history.sort(function (a, b) {
              return b - a;
            });
          }
          if (historyStorage.count !== null) {
            historyStorage.count++;
          }
        } else {
          historyStorage = historiesStorage[peerID] = {
            count: null,
            history: [message.mid],
            pending: []
          };
        }

        if (mergeReplyKeyboard(historyStorage, message)) {
          $rootScope.$broadcast('history_reply_markup', {peerID: peerID})
        }

        if (!message.out && message.from_id) {
          AppUsersManager.forceUserOnline(message.from_id);
        }

        var randomID = pendingByMessageID[message.mid],
            pendingMessage;

        if (randomID) {
          if (pendingMessage = finalizePendingMessage(randomID, message)) {
            $rootScope.$broadcast('history_update', {peerID: peerID});
          }
          delete pendingByMessageID[message.mid];
        }

        if (!pendingMessage) {
          if (newMessagesToHandle[peerID] === undefined) {
            newMessagesToHandle[peerID] = [];
          }
          newMessagesToHandle[peerID].push(message.mid);
          if (!newMessagesHandlePromise) {
            newMessagesHandlePromise = $timeout(handleNewMessages, 0);
          }
        }

        var foundDialog = getDialogByPeerID(peerID);
        var dialog;
        var inboxUnread = !message.out && message.unread;

        if (foundDialog.length) {
          dialog = foundDialog[0];
          dialog.top_message = message.mid;
          if (inboxUnread) {
            dialog.unread_count++;
          }
        } else {
          SearchIndexManager.indexObject(peerID, AppPeersManager.getPeerSearchText(peerID), dialogsIndex);
          dialog = {
            peerID: peerID,
            unread_count: inboxUnread ? 1 : 0,
            top_message: message.mid
          };
        }
        dialog.index = generateDialogIndex(message.date);

        newDialogsToHandle[peerID] = dialog;
        if (!newDialogsHandlePromise) {
          newDialogsHandlePromise = $timeout(handleNewDialogs, 0);
        }

        if (inboxUnread && ($rootScope.selectedPeerID != peerID || $rootScope.idle.isIDLE)) {

          var notifyPeer = message.flags & 16 ? message.from_id : peerID;
          var notifyPeerToHandle = notificationsToHandle[notifyPeer];
          if (notifyPeerToHandle === undefined) {
            notifyPeerToHandle = notificationsToHandle[notifyPeer] = {
              isMutedPromise: NotificationsManager.getPeerMuted(notifyPeer),
              fwd_count: 0,
              from_id: 0
            };
          }

          if (notifyPeerToHandle.from_id != message.from_id) {
            notifyPeerToHandle.from_id = message.from_id;
            notifyPeerToHandle.fwd_count = 0;
          }
          if (message.fwdFromID) {
            notifyPeerToHandle.fwd_count++;
          }

          notifyPeerToHandle.top_message = message;

          if (!notificationsHandlePromise) {
            notificationsHandlePromise = $timeout(handleNotifications, 1000);
          }
        }

        incrementMaxSeenID(message.id);
        break;

      case 'updateReadHistoryInbox':
      case 'updateReadHistoryOutbox':
      case 'updateReadChannelInbox':
        var isOut = update._ == 'updateReadHistoryOutbox';
        var channelID = update.channel_id;
        var maxID = getFullMessageID(update.max_id, channelID);
        var peerID = channelID ? -channelID : AppPeersManager.getPeerID(update.peer);
        var foundDialog = getDialogByPeerID(peerID);
        var history = (historiesStorage[peerID] || {}).history || [];
        var newUnreadCount = false;
        var length = history.length;
        var foundAffected = false;
        var messageID, message, i;

        if (peerID > 0 && isOut) {
          AppUsersManager.forceUserOnline(peerID);
        }

        for (i = 0; i < length; i++) {
          messageID = history[i];
          if (messageID > maxID) {
            continue;
          }
          message = messagesStorage[messageID];

          if (message.out != isOut) {
            continue;
          }
          if (!message.unread) {
            break;
          }
          // console.log('read', messageID, message.unread, message);
          if (message && message.unread) {
            message.unread = false;
            if (messagesForHistory[messageID]) {
              messagesForHistory[messageID].unread = false;
              if (!foundAffected) {
                foundAffected = true;
              }
            }
            if (messagesForDialogs[messageID]) {
              messagesForDialogs[messageID].unread = false;
            }
            if (!message.out) {
              if (foundDialog) {
                newUnreadCount = --foundDialog[0].unread_count;
              }
              NotificationsManager.cancel('msg' + messageID);
            }
          }
        }

        if (newUnreadCount !== false) {
          $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: newUnreadCount});
        }
        if (foundAffected) {
          $rootScope.$broadcast('messages_read');
        }
        break;

      case 'updateReadMessagesContents':
        var messages = update.messages;
        var len = messages.length;
        var i, messageID, message, historyMessage;
        for (i = 0; i < len; i++) {
          messageID = messages[i];
          if (message = messagesStorage[messageID]) {
            delete message.media_unread;
          }
          if (historyMessage = messagesForHistory[messageID]) {
            delete historyMessage.media_unread;
          }
        }
        break;

      case 'updateDeleteMessages':
      case 'updateDeleteChannelMessages':
        var dialogsUpdated = {};
        var historiesUpdated = {};
        var channelID = update.channel_id;
        var messageID, message, i, peerID, foundDialog, history;

        for (i = 0; i < update.messages.length; i++) {
          messageID = getFullMessageID(update.messages[i], channelID);
          message = messagesStorage[messageID];
          if (message) {
            peerID = getMessagePeer(message);
            history = historiesUpdated[peerID] || (historiesUpdated[peerID] = {count: 0, unread: 0, msgs: {}});

            if (!message.out && message.unread) {
              history.unread++;
              NotificationsManager.cancel('msg' + messageID);
            }
            history.count++;
            history.msgs[messageID] = true;

            if (messagesForHistory[messageID]) {
              messagesForHistory[messageID].deleted = true;
              delete messagesForHistory[messageID];
            }
            if (messagesForDialogs[messageID]) {
              messagesForDialogs[messageID].deleted = true;
              delete messagesForDialogs[messageID];
            }
            message.deleted = true;
            messagesStorage[messageID] = {
              deleted: true,
              id: messageID,
              from_id: message.from_id,
              to_id: message.to_id,
              flags: message.flags,
              out: message.out,
              unread: message.unread,
              date: message.date
            };
          }
        }

        angular.forEach(historiesUpdated, function (updatedData, peerID) {
          var foundDialog = getDialogByPeerID(peerID);
          if (foundDialog) {
            if (updatedData.unread) {
              foundDialog[0].unread_count -= updatedData.unread;

              $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: foundDialog[0].unread_count});
            }
          }

          var historyStorage = historiesStorage[peerID];
          if (historyStorage !== undefined) {
            var newHistory = [],
                newPending = [];
            for (var i = 0; i < historyStorage.history.length; i++) {
              if (!updatedData.msgs[historyStorage.history[i]]) {
                newHistory.push(historyStorage.history[i]);
              }
            }
            historyStorage.history = newHistory;
            if (updatedData.count &&
                historyStorage.count !== null &&
                historyStorage.count > 0) {
              historyStorage.count -= updatedData.count;
              if (historyStorage.count < 0) {
                historyStorage.count = 0;
              }
            }

            for (var i = 0; i < historyStorage.pending.length; i++) {
              if (!updatedData.msgs[historyStorage.pending[i]]) {
                newPending.push(historyStorage.pending[i]);
              }
            }
            historyStorage.pending = newPending;

            $rootScope.$broadcast('history_delete', {peerID: peerID, msgs: updatedData.msgs});
          }
        });
        break;

      case 'updateChannel':
        var channelID = update.channel_id;
        var peerID = -channelID;
        var channel = AppChatsManager.getChat(channelID);

        var needDialog = channel._ == 'channel' && (!channel.pFlags.left && !channel.pFlags.kicked);
        var foundDialog = getDialogByPeerID(peerID);
        var hasDialog = foundDialog.length > 0;

        var canViewHistory = channel._ == 'channel' && (channel.username || !channel.pFlags.left && !channel.pFlags.kicked) && true || false;
        var hasHistory = historiesStorage[peerID] !== undefined;

        if (canViewHistory != hasHistory) {
          delete historiesStorage[peerID];
          $rootScope.$broadcast('history_forbidden', peerID);
        }
        if (hasDialog != needDialog) {
          if (needDialog) {
            reloadChannelDialog(channelID);
          } else {
            if (foundDialog[0]) {
              dialogsStorage.dialogs.splice(foundDialog[1], 1);
              $rootScope.$broadcast('dialog_drop', {peerID: peerID});
            }
          }
        }
        break;

      case 'updateChannelReload':
        var channelID = update.channel_id;
        var peerID = -channelID;
        var foundDialog = getDialogByPeerID(peerID);
        if (foundDialog[0]) {
          dialogsStorage.dialogs.splice(foundDialog[1], 1);
        }
        delete historiesStorage[peerID];
        reloadChannelDialog(channelID).then(function () {
          $rootScope.$broadcast('history_reload', peerID);
        });
        break;

      case 'updateChannelMessageViews':
        var views = update.views;
        var mid = getFullMessageID(update.id, update.channel_id);
        var message = getMessage(mid);
        if (message && message.views && message.views < views) {
          message.views = views;
          $rootScope.$broadcast('message_views', {
            mid: mid,
            views: views
          });
        }
        break;
    }
  });

  function reloadChannelDialog (channelID) {
    var peerID = -channelID;
    var inputPeer = AppPeersManager.getInputPeerByID(peerID);
    return $q.all([
      AppProfileManager.getChannelFull(channelID, true),
      getHistory(inputPeer, 0)
    ]).then(function (results) {
      var channelResult = results[0];
      var historyResult = results[1];
      var topMsgID = historyResult.history[0];
      var dialog = {
        _: 'dialogChannel',
        peer: AppPeersManager.getOutputPeer(peerID),
        top_message: topMsgID,
        top_important_message: topMsgID,
        read_inbox_max_id: channelResult.read_inbox_max_id,
        unread_count: channelResult.unread_count,
        unread_important_count: channelResult.unread_important_count,
        notify_settings: channelResult.notify_settings
      };
      saveChannelDialog(channelID, dialog);

      var updatedDialogs = {};
      updatedDialogs[peerID] = dialog;
      $rootScope.$broadcast('dialogs_multiupdate', updatedDialogs);
    });
  }

  $rootScope.$on('webpage_updated', function (e, eventData) {
    angular.forEach(eventData.msgs, function (msgID) {
      var historyMessage = messagesForHistory[msgID];
      if (historyMessage) {
        historyMessage.media = {
          _: 'messageMediaWebPage',
          webpage: AppWebPagesManager.wrapForHistory(eventData.id)
        };
      }
    })
  })

  return {
    getConversations: getConversations,
    getHistory: getHistory,
    getSearch: getSearch,
    getMessage: getMessage,
    getReplyKeyboard: getReplyKeyboard,
    readHistory: readHistory,
    readMessages: readMessages,
    flushHistory: flushHistory,
    deleteMessages: deleteMessages,
    saveMessages: saveMessages,
    sendText: sendText,
    sendFile: sendFile,
    sendOther: sendOther,
    forwardMessages: forwardMessages,
    startBot: startBot,
    openChatInviteLink: openChatInviteLink,
    getMessagePeer: getMessagePeer,
    getMessageThumb: getMessageThumb,
    wrapForDialog: wrapForDialog,
    wrapForHistory: wrapForHistory,
    wrapReplyMarkup: wrapReplyMarkup,
    regroupWrappedHistory: regroupWrappedHistory
  }
});
