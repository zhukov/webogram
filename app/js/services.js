/*!
 * Webogram v0.1 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Services */

angular.module('myApp.services', [])

.service('AppConfigManager', function ($q) {
  var testPrefix = window._testMode ? 't_' : '';
  var cache = {};
  var useLs = !window.chrome || !chrome.storage || !chrome.storage.local;

  function getValue() {
    var keys = Array.prototype.slice.call(arguments),
        result = [],
        single = keys.length == 1,
        allFound = true;

    for (var i = 0; i < keys.length; i++) {
      keys[i] = testPrefix + keys[i];
    }

    angular.forEach(keys, function (key) {
      if (cache[key] !== undefined) {
        result.push(cache[key]);
      }
      else if (useLs) {
        var value = localStorage.getItem(key);
        value = (value === undefined || value === null) ? false : JSON.parse(value);
        result.push(cache[key] = value);
      }
      else {
        allFound = false;
      }
    });

    if (allFound) {
      return $q.when(single ? result[0] : result);
    }

    var deferred = $q.defer();

    // dLog('get', keys);
    chrome.storage.local.get(keys, function (resultObj) {
      // dLog('got', resultObj);
      result = [];
      angular.forEach(keys, function (key) {
        var value = resultObj[key];
        // dLog('p1', key, value);
        value = value === undefined || value === null ? false : JSON.parse(value);
        // dLog('p2', value);
        result.push(cache[key] = value);
      });

      // dLog('got parsed', result);
      deferred.resolve(single ? result[0] : result);
    });

    return deferred.promise;
  };

  function setValue(obj) {
    var keyValues = {};
    angular.forEach(obj, function (value, key) {
      keyValues[testPrefix + key] = JSON.stringify(value);
      cache[testPrefix + key] = value;
    });

    if (useLs) {
      angular.forEach(keyValues, function (value, key) {
        localStorage.setItem(key, value);
      });
      return $q.when();
    }

    var deferred = $q.defer();

    chrome.storage.local.set(keyValues, function () {
      deferred.resolve();
    });

    return deferred.promise;
  };

  function removeValue () {
    var keys = Array.prototype.slice.call(arguments);

    for (var i = 0; i < keys.length; i++) {
      keys[i] = testPrefix + keys[i];
    }

    angular.forEach(keys, function(key){
      delete cache[key];
    });

    if (useLs) {
      angular.forEach(keys, function(key){
        localStorage.removeItem(key);
      });

      return $q.when();
    }

    var deferred = $q.defer();

    chrome.storage.local.remove(keys, function () {
      deferred.resolve();
    });

    return deferred.promise;
  };

  return {
    get: getValue,
    set: setValue,
    remove: removeValue
  };
})

.service('AppUsersManager', function ($rootScope, $modal, MtpApiFileManager, MtpApiManager, RichTextProcessor) {
  var users = {};

  function saveApiUsers (apiUsers) {
    angular.forEach(apiUsers, saveApiUser);
  };

  function saveApiUser (apiUser) {
    if (!angular.isObject(apiUser)) {
      return;
    }

    if (apiUser.first_name) {
      apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.first_name, {noLinks: true, noLinebreaks: true});
      apiUser.rFullName = RichTextProcessor.wrapRichText(apiUser.first_name + ' ' + (apiUser.last_name || ''), {noLinks: true, noLinebreaks: true});
    } else {
      apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || 'DELETED';
      apiUser.rFullName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || 'DELETED';
    }

    if (users[apiUser.id] === undefined) {
      users[apiUser.id] = apiUser;
    } else {
      angular.extend(users[apiUser.id], apiUser);
    }
  };

  function getUser (id) {
    if (angular.isObject(id)) {
      return id;
    }
    return users[id] || {id: id, deleted: true};
  }

  function hasUser(id) {
    return angular.isObject(users[id]);
  }

  function getUserPhoto(id, placeholder) {
    var user = getUser(id);

    if (id == 333000) {
      return {
        placeholder: 'img/placeholders/DialogListAvatarSystem@2x.png'
      }
    };

    return {
      placeholder: 'img/placeholders/' + placeholder + 'Avatar'+((Math.abs(id) % 8) + 1)+'@2x.png',
      location: user && user.photo && user.photo.photo_small
    };
  }

  function getUserString (id) {
    var user = getUser(id);
    return 'u' + id + (user.access_hash ? '_' + user.access_hash : '');
  }

  function getUserInput (id) {
    var user = getUser(id);
    if (user._ == 'userSelf') {
      return {_: 'inputUserSelf'};
    }
    return {
      _: 'inputUserForeign',
      user_id: id,
      access_hash: user.access_hash || 0
    };
  }

  function wrapForFull (id) {
    var user = getUser(id);

    user.thumb = {
      placeholder: 'img/placeholders/UserAvatar'+((Math.abs(id) % 8) + 1)+'@2x.png',
      location: user && user.photo && user.photo.photo_small,
      width: 120,
      height: 120,
      size: 0
    };
    user.peerString = getUserString(id);

    return user;
  }

  function openUser (userID, accessHash) {
    var scope = $rootScope.$new();
    scope.userID = userID;

    var modalInstance = $modal.open({
      templateUrl: 'partials/user_modal.html?1',
      controller: 'UserModalController',
      scope: scope,
      windowClass: 'user_modal_window',
      resolve: {
        userFull: MtpApiManager.invokeApi('users.getFullUser', {
          id: getUserInput(userID)
        }).then(function (result) {
          saveApiUser(result.user);
          return result;
        })
      }
    });
  }

  $rootScope.openUser = openUser;

  $rootScope.$on('apiUpdate', function (e, update) {
    // dLog('on apiUpdate', update);
    switch (update._) {
      case 'updateUserStatus':
        var userID = update.user_id;
        if (users[userID]) {
          users[userID].status = update.status;
          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updateUserPhoto':
        var userID = update.user_id;
        if (users[userID]) {
          users[userID].photo = update.photo;
          $rootScope.$broadcast('user_update', userID);
        }
        break;
    }
  });


  return {
    saveApiUsers: saveApiUsers,
    saveApiUser: saveApiUser,
    getUser: getUser,
    getUserPhoto: getUserPhoto,
    getUserString: getUserString,
    hasUser: hasUser,
    wrapForFull: wrapForFull,
    openUser: openUser
  }
})

.service('AppChatsManager', function ($rootScope, $modal, MtpApiFileManager, MtpApiManager, AppUsersManager, RichTextProcessor) {
  var chats = {};

  function saveApiChats (apiChats) {
    angular.forEach(apiChats, saveApiChat);
  };

  function saveApiChat (apiChat) {
    if (!angular.isObject(apiChat)) {
      return;
    }
    apiChat.rTitle = RichTextProcessor.wrapRichText(apiChat.title, {noLinks: true, noLinebreaks: true}) || 'DELETED';
    if (chats[apiChat.id] === undefined) {
      chats[apiChat.id] = apiChat;
    } else {
      angular.extend(chats[apiChat.id], apiChat);
    }
  };

  function getChat (id) {
    return chats[id] || {id: id, deleted: true};
  }

  function hasChat (id) {
    return angular.isObject(chats[id]);
  }

  function getChatPhoto(id, placeholder) {
    var chat = getChat(id);

    return {
      placeholder: 'img/placeholders/' + placeholder + 'Avatar'+((Math.abs(id) % 4) + 1)+'@2x.png',
      location: chat && chat.photo && chat.photo.photo_small
    };
  }

  function getChatString (id) {
    var chat = getChat(id);
    return 'g' + id;
  }

  function wrapForFull (id, fullChat) {
    var chatFull = angular.copy(fullChat),
        chat = getChat(id);

    if (chatFull.participants && chatFull.participants._ == 'chatParticipants') {
      angular.forEach(chatFull.participants.participants, function(participant){
        participant.user = AppUsersManager.getUser(participant.user_id);
        participant.userPhoto = AppUsersManager.getUserPhoto(participant.user_id, 'User');
        participant.inviter = AppUsersManager.getUser(participant.inviter_id);
      });
    }

    chatFull.thumb = {
      placeholder: 'img/placeholders/GroupAvatar'+((Math.abs(id) % 4) + 1)+'@2x.png',
      location: chat && chat.photo && chat.photo.photo_small,
      width: 120,
      height: 120,
      size: 0
    };
    chatFull.peerString = getChatString(id);
    chatFull.chat = chat;

    return chatFull;
  }

  function openChat (chatID, accessHash) {
    var scope = $rootScope.$new();
    scope.chatID = chatID;

    var modalInstance = $modal.open({
      templateUrl: 'partials/chat_modal.html?3',
      controller: 'ChatModalController',
      windowClass: 'chat_modal_window',
      scope: scope
    });
  }

  $rootScope.openChat = openChat;


  return {
    saveApiChats: saveApiChats,
    saveApiChat: saveApiChat,
    getChat: getChat,
    getChatPhoto: getChatPhoto,
    getChatString: getChatString,
    hasChat: hasChat,
    wrapForFull: wrapForFull,
    openChat: openChat
  }
})

.service('AppPeersManager', function (AppUsersManager, AppChatsManager) {
  return {
    getInputPeer: function (peerString) {
      var isUser = peerString.charAt(0) == 'u',
          peerParams = peerString.substr(1).split('_');

      return isUser
            ? {_: 'inputPeerForeign', user_id: peerParams[0], access_hash: peerParams[1]}
            : {_: 'inputPeerChat', chat_id: peerParams[0]};
    },
    getInputPeerByID: function (peerID) {
      if (peerID > 0) {
        return {
          _: 'inputPeerForeign',
          user_id: peerID,
          access_hash: AppUsersManager.getUser(peerID).access_hash || 0
        };
      } else if (peerID < 0) {
        return {
          _: 'inputPeerChat',
          chat_id: -peerID
        };
      }
    },
    getOutputPeer: function (peerID) {
      return peerID > 0
            ? {_: 'peerUser', user_id: peerID}
            : {_: 'peerChat', chat_id: -peerID};
    },
    getPeerID: function (peerString) {
      if (angular.isObject(peerString)) {
        return peerString.user_id
          ? peerString.user_id
          : -peerString.chat_id;
      }
      var isUser = peerString.charAt(0) == 'u',
          peerParams = peerString.substr(1).split('_');

      return isUser ? peerParams[0] : -peerParams[0] || 0;
    },
    getPeer: function (peerID) {
      return peerID > 0
        ? AppUsersManager.getUser(peerID)
        : AppChatsManager.getChat(-peerID);
    },
    getPeerPhoto: function (peerID, userPlaceholder, chatPlaceholder) {
      return peerID > 0
        ? AppUsersManager.getUserPhoto(peerID, userPlaceholder)
        : AppChatsManager.getChatPhoto(-peerID, chatPlaceholder)
    }
  }
})

.service('AppMessagesManager', function ($q, $rootScope, $filter, $sanitize, $location, ApiUpdatesManager, AppUsersManager, AppChatsManager, AppPeersManager, AppPhotosManager, AppVideoManager, AppDocsManager, MtpApiManager, MtpApiFileManager, RichTextProcessor, NotificationsManager) {

  var messagesStorage = {};
  var messagesForHistory = {};
  var historiesStorage = {};
  var dialogsStorage = {count: null, dialogs: []};
  var pendingByRandomID = {};
  var pendingByMessageID = {};
  var tempID = -1;

  NotificationsManager.start();

  function getDialogs (offset, limit) {
    if (dialogsStorage.count !== null && dialogsStorage.dialogs.length >= offset + limit) {
      return $q.when({
        count: dialogsStorage.count,
        dialogs: dialogsStorage.dialogs.slice(offset, offset + limit)
      });
    }

    var deferred = $q.defer();

    MtpApiManager.invokeApi('messages.getDialogs', {
      offset: offset,
      limit: limit,
      max_id: 0
    }).then(function (dialogsResult) {
      AppUsersManager.saveApiUsers(dialogsResult.users);
      AppChatsManager.saveApiChats(dialogsResult.chats);
      saveMessages(dialogsResult.messages);

      dialogsStorage.count = dialogsResult._ == 'messages.dialogsSlice'
        ? dialogsResult.count
        : dialogsResult.dialogs.length;

      angular.forEach(dialogsResult.dialogs, function (dialog) {
        dialogsStorage.dialogs.push({
          peerID: AppPeersManager.getPeerID(dialog.peer),
          top_message: dialog.top_message,
          unread_count: dialog.unread_count
        });
      });

      deferred.resolve({
        count: dialogsStorage.count,
        dialogs: dialogsStorage.dialogs.slice(offset, offset + limit)
      });
    }, function (error) {
      deferred.reject(error);
    });

    return deferred.promise;
  }

  function getHistory (inputPeer, maxID, limit) {

    var peerID = AppPeersManager.getPeerID(inputPeer),
        historyStorage = historiesStorage[peerID],
        offset = 0,
        resultPending = [];

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }
    else if (!maxID && historyStorage.pending.length) {
      resultPending = historyStorage.pending.slice();
    }


    if (maxID > 0) {
      for (offset = 0; offset < historyStorage.history.length; offset++) {
        if (maxID > historyStorage.history[offset]) {
          break;
        }
      }
    }
    // dLog('history storage', angular.copy(historyStorage.history), maxID, offset);

    if (historyStorage.count !== null && historyStorage.history.length >= offset + limit) {
      return $q.when({
        count: historyStorage.count,
        history: resultPending.concat(historyStorage.history.slice(offset, offset + limit))
      });
    }

    var deferred = $q.defer();

    MtpApiManager.invokeApi('messages.getHistory', {
      peer: inputPeer,
      offset: offset,
      limit: limit,
      max_id: maxID || 0
    }).then(function (historyResult) {
      AppUsersManager.saveApiUsers(historyResult.users);
      AppChatsManager.saveApiChats(historyResult.chats);
      saveMessages(historyResult.messages);

      historyStorage.count = historyResult._ == 'messages.messagesSlice'
        ? historyResult.count
        : historyResult.messages.length;

      offset = 0;
      if (maxID > 0) {
        for (offset = 0; offset < historyStorage.history.length; offset++) {
          if (maxID > historyStorage.history[offset]) {
            break;
          }
        }
      }

      // dLog('history storage after', angular.copy(historyStorage.history), historyResult.messages, maxID, offset);

      historyStorage.history.splice(offset, historyStorage.history.length - offset);
      angular.forEach(historyResult.messages, function (message) {
        historyStorage.history.push(message.id);
      });
      // dLog('history storage final', angular.copy(historyStorage.history), historyResult.messages, maxID, offset);

      deferred.resolve({
        count: historyStorage.count,
        history: resultPending.concat(historyStorage.history.slice(offset, offset + limit))
      });
    }, function (error) {
      deferred.reject(error);
    });

    return deferred.promise;
  }

  function processAffectedHistory (inputPeer, affectedHistory) {
    if (!ApiUpdatesManager.saveSeq(affectedHistory.seq)) {
      return false;
    }
    if (!affectedHistory.offset) {
      return $q.when();
    }

    return MtpApiManager.invokeApi('messages.readHistory', {
      peer: inputPeer,
      offset: affectedHistory.offset,
      max_id: 0
    }).then(function (affectedHistory) {
      return processAffectedHistory(inputPeer, affectedHistory);
    });
  }

  function readHistory (inputPeer) {
    // dLog('start read');
    var peerID = AppPeersManager.getPeerID(inputPeer),
        historyStorage = historiesStorage[peerID],
        foundDialog = getDialogByPeerID(peerID);

    if (!historyStorage ||
        !historyStorage.history.length ||
        foundDialog[0] && !foundDialog[0].unread_count) {
      // dLog('bad1', historyStorage, foundDialog[0]);
      return false;
    }

    var wasUnread = false;
    // dLog(historyStorage);
    for (i = 0; i < historyStorage.history.length; i++) {
      messageID = historyStorage.history[i];
      message = messagesStorage[messageID];
      // dLog('ms', message);
      if (message && !message.out) {
        if (message.unread) {
          // dLog('unread');
          wasUnread = true;
        } else if (!wasUnread) {
          // dLog('bad2');
          return false;
        }
      }
    }

    var promise = MtpApiManager.invokeApi('messages.readHistory', {
      peer: inputPeer,
      offset: 0,
      max_id: 0
    }).then(function (affectedHistory) {
      return processAffectedHistory(inputPeer, affectedHistory);
    }).then(function () {
      if (foundDialog[0]) {
        foundDialog[0].unread_count = 0;
        $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: 0});
      }
    });


    var messageID, message, i, peerID, foundDialog, dialog;
    for (i = 0; i < historyStorage.history.length; i++) {
      messageID = historyStorage.history[i];
      message = messagesStorage[messageID];
      if (message && !message.out) {
        message.unread = false;
        if (messagesForHistory[messageID]) {
          messagesForHistory[messageID].unread = false;
        }
      }
    }

    return promise;
  }

  function saveMessages (apiMessages) {
    angular.forEach(apiMessages, function (apiMessage) {
      messagesStorage[apiMessage.id] = apiMessage;

      if (apiMessage.media && apiMessage.media._ == 'messageMediaPhoto') {
        AppPhotosManager.savePhoto(apiMessage.media.photo);
      }
      if (apiMessage.media && apiMessage.media._ == 'messageMediaVideo') {
        AppVideoManager.saveVideo(apiMessage.media.video);
      }
      if (apiMessage.media && apiMessage.media._ == 'messageMediaDocument') {
        AppDocsManager.saveDoc(apiMessage.media.document);
      }
      if (apiMessage.action && apiMessage.action._ == 'messageActionChatEditPhoto') {
        AppPhotosManager.savePhoto(apiMessage.action.photo);
      }
    });
  }

  function sendText(peerID, text) {
    var messageID = tempID--,
        randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString(),
        historyStorage = historiesStorage[peerID],
        inputPeer = AppPeersManager.getInputPeerByID(peerID),
        message;

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    MtpApiManager.getUserID().then(function (fromID) {
      message = {
        _: 'message',
        id: messageID,
        from_id: fromID,
        to_id: AppPeersManager.getOutputPeer(peerID),
        out: true,
        unread: true,
        date: (+new Date()) / 1000,
        message: text,
        media: {_: 'messageMediaEmpty'},
        random_id: randomIDS,
        pending: true
      };

      message.send = function () {
        MtpApiManager.invokeApi('messages.sendMessage', {
          peer: inputPeer,
          message: text,
          random_id: randomID
        }).then(function (result) {
          if (ApiUpdatesManager.saveSeq(result.seq)) {
            ApiUpdatesManager.saveUpdate({
              _: 'updateMessageID',
              random_id: randomIDS,
              id: result.id
            });

            message.date = result.date;
            message.id = result.id;
            ApiUpdatesManager.saveUpdate({
              _: 'updateNewMessage',
              message: message,
              pts: result.pts
            });
          }
        });
      };

      saveMessages([message]);
      historyStorage.pending.unshift(messageID);
      $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID});

      // setTimeout(function () {
        message.send();
      // }, 5000);
    });

    pendingByRandomID[randomIDS] = [peerID, messageID];
  };

  function sendFile(peerID, file, options) {
    var messageID = tempID--,
        randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString(),
        historyStorage = historiesStorage[peerID],
        inputPeer = AppPeersManager.getInputPeerByID(peerID),
        isPhoto = file.type == 'image/jpeg' && file.size <= 5242880; // 5Mb

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    MtpApiManager.getUserID().then(function (fromID) {
      var media = {
        _: 'messageMediaPending',
        type: isPhoto ? 'photo' : 'doc',
        file_name: file.name,
        size: file.size,
        progress: {percent: 1, total: file.size}
      };

      var message = {
        _: 'message',
        id: messageID,
        from_id: fromID,
        to_id: AppPeersManager.getOutputPeer(peerID),
        out: true,
        unread: true,
        date: (+new Date()) / 1000,
        message: '',
        media: media,
        random_id: randomIDS,
        pending: true
      };

      message.send = function () {
        MtpApiFileManager.uploadFile(file).then(function (inputFile) {
          var inputMedia;
          if (isPhoto) {
            inputMedia = {_: 'inputMediaUploadedPhoto', file: inputFile};
          } else {
            inputMedia = {_: 'inputMediaUploadedDocument', file: inputFile, file_name: file.name, mime_type: file.type};
          }
          MtpApiManager.invokeApi('messages.sendMedia', {
            peer: inputPeer,
            media: inputMedia,
            random_id: randomID
          }).then(function (result) {
            if (ApiUpdatesManager.saveSeq(result.seq)) {
              ApiUpdatesManager.saveUpdate({
                _: 'updateMessageID',
                random_id: randomIDS,
                id: result.message.id
              });

              message.date = result.message.date;
              message.id = result.message.id;
              message.media = result.message.media;

              ApiUpdatesManager.saveUpdate({
                _: 'updateNewMessage',
                message: message,
                pts: result.pts
              });
            }

          });
        }, null, function (progress) {
          // dLog('upload progress', progress);
          var historyMessage = messagesForHistory[messageID],
              percent = Math.max(1, Math.floor(100 * progress.done / progress.total));

          media.progress.done = progress.done;
          media.progress.percent = percent;
          if (historyMessage) {
            historyMessage.media.progress.done = progress.done;
            historyMessage.media.progress.percent = percent;
            $rootScope.$broadcast('history_update', {peerID: peerID});
          }
        });
      };

      saveMessages([message]);
      historyStorage.pending.unshift(messageID);
      $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID});

      // setTimeout(function () {
        message.send();
      // }, 5000);
    });

    pendingByRandomID[randomIDS] = [peerID, messageID];
  }


  function finalizePendingMessage(randomID, finalMessage) {
    var pendingData = pendingByRandomID[randomID];
    // dLog('pdata', randomID, pendingData);

    if (pendingData) {
      var peerID = pendingData[0],
          tempID = pendingData[1],
          historyStorage = historiesStorage[peerID],
          index = false,
          message = false,
          historyMessage = false,
          i;

      // dLog('pending', randomID, historyStorage.pending);
      for (i = 0; i < historyStorage.pending.length; i++) {
        if (historyStorage.pending[i] == tempID) {
          historyStorage.pending.splice(i, 1);
          break;
        }
      }

      if (message = messagesStorage[tempID]) {
        delete message.pending;
        delete message.random_id;
        delete message.send;
      }

      if (historyMessage = messagesForHistory[tempID]) {
        messagesForHistory[finalMessage.id] = angular.extend(historyMessage, wrapForHistory(finalMessage.id));
        delete historyMessage.pending;
        delete historyMessage.random_id;
        delete historyMessage.send;
      }

      delete messagesForHistory[tempID];
      delete messagesStorage[tempID];

      return message;
    }

    return false;
  }

  function getMessagePeer (message) {
    var toID = message.to_id && AppPeersManager.getPeerID(message.to_id) || 0;

    if (toID < 0) {
      return toID;
    } else if (message.out) {
      return toID
    }
    return message.from_id;
  }

  function wrapForDialog (msgID, unreadCount) {
    var message = angular.copy(messagesStorage[msgID]) || {id: msgID};

    message.fromUser = AppUsersManager.getUser(message.from_id);

    if (message.chatID = message.to_id.chat_id) {
      message.peerID = -message.chatID;
      message.peerData = AppChatsManager.getChat(message.chatID);
      message.peerString = AppChatsManager.getChatString(message.chatID);
    } else {
      message.peerID = message.out ? message.to_id.user_id : message.from_id;
      message.peerData = AppUsersManager.getUser(message.peerID);
      message.peerString = AppUsersManager.getUserString(message.peerID);
    }

    message.peerPhoto = AppPeersManager.getPeerPhoto(message.peerID, 'User', 'Group');
    message.unreadCount = unreadCount;

    if (message._ == 'messageService' && message.action.user_id) {
      message.action.user = AppUsersManager.getUser(message.action.user_id);
    }

    if (message.message && message.message.length) {
      message.richMessage = RichTextProcessor.wrapRichText(message.message.substr(0, 64), {noLinks: true, noLinebreaks: true});
    }


    return message;
  }

  function wrapForHistory (msgID) {
    if (messagesForHistory[msgID] !== undefined) {
      return messagesForHistory[msgID];
    }

    var message = angular.copy(messagesStorage[msgID]) || {id: msgID};

    message.fromUser = AppUsersManager.getUser(message.from_id);
    message.fromPhoto = AppUsersManager.getUserPhoto(message.from_id, 'User');

    if (message._ == 'messageForwarded') {
      message.fwdUser = AppUsersManager.getUser(message.fwd_from_id);
    }

    if (message.media) {
      switch (message.media._) {
        case 'messageMediaPhoto':
          message.media.photo = AppPhotosManager.wrapForHistory(message.media.photo.id)
          break;

        case 'messageMediaVideo':
          message.media.video = AppVideoManager.wrapForHistory(message.media.video.id);
          break;

        case 'messageMediaDocument':
          message.media.document = AppDocsManager.wrapForHistory(message.media.document.id);
          break;
      }

      if (message.media.user_id) {
        message.media.user = AppUsersManager.getUser(message.media.user_id);
        message.media.userPhoto = AppUsersManager.getUserPhoto(message.media.user_id, 'User');
      }
    }
    else if (message.action) {
      if (message.action._ == 'messageActionChatEditPhoto') {
        message.action.photo = AppPhotosManager.wrapForHistory(message.action.photo.id);
      }

      if (message.action.user_id) {
        message.action.user = AppUsersManager.getUser(message.action.user_id);
        message.action.userPhoto = AppUsersManager.getUserPhoto(message.action.user_id, 'User');
      }
    }

    if (message.message && message.message.length) {
      message.richMessage = RichTextProcessor.wrapRichText(message.message);
    }

    return messagesForHistory[msgID] = message;
  }

  function getDialogByPeerID (peerID) {
    for (var i = 0; i < dialogsStorage.dialogs.length; i++) {
      if (dialogsStorage.dialogs[i].peerID == peerID) {
        return [dialogsStorage.dialogs[i], i];
      }
    }

    return [];
  }

  function notifyAboutMessage (message) {
    var peerID = getMessagePeer(message);
    var fromUser = AppUsersManager.getUser(message.from_id);
    var fromPhoto = AppUsersManager.getUserPhoto(message.from_id, 'User');
    var peerString;
    var notification = {},
        notificationMessage = false,
        notificationPhoto;

    if (message.message) {
      notificationMessage = message.message;
    } else if (message.media && message.media._ != 'messageMediaEmpty') {
      switch (message.media._) {
        case 'messageMediaPhoto': notificationMessage = 'Photo'; break;
        case 'messageMediaVideo': notificationMessage = 'Video'; break;
        case 'messageMediaDocument': notificationMessage = 'Document'; break;
        case 'messageMediaGeo': notificationMessage = 'Location'; break;
        case 'messageMediaContact': notificationMessage = 'Contact'; break;
        default: notificationMessage = 'Attachment'; break;
      }
    } else if (message._ == 'messageService') {
      switch (message.action._) {
        case 'messageActionChatCreate': notificationMessage = 'created the group'; break;
        case 'messageActionChatEditTitle': notificationMessage = 'changed group name'; break;
        case 'messageActionChatEditPhoto': notificationMessage = 'changed group photo'; break;
        case 'messageActionChatDeletePhoto': notificationMessage = 'removed group photo'; break;
        case 'messageActionChatAddUser': notificationMessage = 'invited user'; break;
        case 'messageActionChatDeleteUser': notificationMessage = 'kicked user'; break;
      }
    }

    if (peerID > 0) {
      notification.title = (fromUser.first_name || '') +
                           (fromUser.first_name && fromUser.last_name ? ' ' : '') +
                           (fromUser.last_name || '');

      notificationPhoto = fromPhoto;

      peerString = AppUsersManager.getUserString(peerID);

    } else {
      notification.title = (fromUser.first_name || fromUser.last_name || 'Somebody') +
                           ' @ ' +
                           (AppChatsManager.getChat(-peerID).title || 'Unknown chat');

      notificationPhoto = AppChatsManager.getChatPhoto(-peerID, 'Chat');

      peerString = AppChatsManager.getChatString(-peerID);
    }

    notification.onclick = function () {
      $location.url('/im?p=' + peerString);
    };

    notification.message = notificationMessage;
    notification.image = notificationPhoto.placeholder;

    if (notificationPhoto.location) {
      MtpApiFileManager.downloadSmallFile(notificationPhoto.location, notificationPhoto.size).then(function (url) {
        notification.image = url;

        if (message.unread) {
          NotificationsManager.notify(notification);
        }
      });
    } else {
      NotificationsManager.notify(notification);
    }
  }

  $rootScope.$on('apiUpdate', function (e, update) {
    dLog('on apiUpdate', update);
    switch (update._) {
      case 'updateMessageID':
        pendingByMessageID[update.id] = update.random_id;
        break;

      case 'updateNewMessage':
        var message = update.message,
            peerID = getMessagePeer(message),
            historyStorage = historiesStorage[peerID];

        if (historyStorage !== undefined) {
          var topMsgID = historiesStorage[peerID].history[0];
          if (message.id <= topMsgID) {
            return false;
          }
        } else {
          historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
        }

        saveMessages([message]);

        if (historyStorage.count !== null) {
          historyStorage.count++;
        }

        historyStorage.history.unshift(message.id);
        var randomID = pendingByMessageID[message.id],
            pendingMessage;


        if (randomID) {
          if (pendingMessage = finalizePendingMessage(randomID, message)) {
            $rootScope.$broadcast('history_update', {peerID: peerID});
          }
          delete pendingByMessageID[message.id];
        }

        // dLog(11, randomID, pendingMessage);
        if (!pendingMessage) {
          $rootScope.$broadcast('history_append', {peerID: peerID, messageID: message.id});
        }

        var foundDialog = getDialogByPeerID(peerID),
            dialog;

        if (foundDialog.length) {
          dialog = foundDialog[0];
          dialogsStorage.dialogs.splice(foundDialog[1], 1);
        } else {
          dialog = {peerID: peerID, unread_count: 0, top_message: false}
        }
        if (!message.out && message.unread) {
          dialog.unread_count++;
        }
        dialog.top_message = message.id;
        dialogsStorage.dialogs.unshift(dialog);
        $rootScope.$broadcast('dialogs_update', dialog);


        if ($rootScope.idle.isIDLE && !message.out && message.unread) {
          NotificationsManager.getPeerSettings(peerID).then(function (muted) {
            if (!message.unread || muted) {
              return;
            }
            notifyAboutMessage(message);
          });
        }
        break;

      case 'updateReadMessages':
        var dialogsUpdated = {},
            messageID, message, i, peerID, foundDialog, dialog;
        for (i = 0; i < update.messages.length; i++) {
          messageID = update.messages[i];
          message = messagesStorage[messageID];
          // dLog('read', messageID, message);
          if (message) {
            message.unread = false;
            if (messagesForHistory[messageID]) {
              // dLog(222, messagesForHistory[messageID]);
              messagesForHistory[messageID].unread = false;
            }
            peerID = getMessagePeer(message);
            if (!message.out) {
              foundDialog = getDialogByPeerID(peerID);
              if (foundDialog) {
                dialogsUpdated[peerID] = --foundDialog[0].unread_count;
              }
            }
          }
        }

        angular.forEach(dialogsUpdated, function(count, peerID) {
          $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: count});
        });
        // $rootScope.$broadcast('history_update');
        break;
    }
  });

  return {
    getDialogs: getDialogs,
    getHistory: getHistory,
    readHistory: readHistory,
    saveMessages: saveMessages,
    sendText: sendText,
    sendFile: sendFile,
    getMessagePeer: getMessagePeer,
    wrapForDialog: wrapForDialog,
    wrapForHistory: wrapForHistory
  }
})

.service('AppPhotosManager', function ($modal, $window, $rootScope, MtpApiFileManager, AppUsersManager) {
  var photos = {};

  function savePhoto (apiPhoto) {
    photos[apiPhoto.id] = apiPhoto;
    angular.forEach(apiPhoto.sizes, function (photoSize) {
      if (photoSize._ == 'photoCachedSize') {
        MtpApiFileManager.saveSmallFile(photoSize.location, photoSize.bytes);

        // Memory
        photoSize.size = photoSize.bytes.length;
        delete photoSize.bytes;
        photoSize._ = 'photoSize';
      }
    });
  };

  function choosePhotoSize (photo, width, height) {
    var bestPhotoSize = {_: 'photoSizeEmpty'},
        bestDiff = 0xFFFFFF;

    angular.forEach(photo.sizes, function (photoSize) {
      var diff = Math.abs(photoSize.w * photoSize.h - width * height);
      if (diff < bestDiff) {
        bestPhotoSize = photoSize;
        bestDiff = diff;
      }
    });

    return bestPhotoSize;
  }

  function wrapForHistory (photoID) {
    var photo = angular.copy(photos[photoID]) || {_: 'photoEmpty'},
        width = 100,
        height = 100,
        thumbPhotoSize = choosePhotoSize(photo, width, height),
        thumb = {
          placeholder: 'img/placeholders/PhotoThumbConversation.gif',
          width: width,
          height: height
        };

        // dLog('chosen photo size', photoID, thumbPhotoSize);
    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      if (thumbPhotoSize.w > thumbPhotoSize.h) {
        thumb.height = parseInt(thumbPhotoSize.h * width / thumbPhotoSize.w);
      } else {
        thumb.width = parseInt(thumbPhotoSize.w * height / thumbPhotoSize.h);
      }

      thumb.location = thumbPhotoSize.location;
      thumb.size = thumbPhotoSize.size;
    }

    photo.thumb = thumb;

    return photo;
  }

  function wrapForFull (photoID) {
    var photo = wrapForHistory(photoID),
        fullWidth = 542,
        fullHeight = $($window).height() - 150,
        fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight),
        full = {
          placeholder: 'img/placeholders/PhotoThumbModal.gif',
          width: fullWidth,
          height: fullHeight
        };

    if (fullPhotoSize && fullPhotoSize._ != 'photoSizeEmpty') {
      if (fullPhotoSize.w > fullPhotoSize.h) {
        full.height = parseInt(fullPhotoSize.h * fullWidth / fullPhotoSize.w);
      } else {
        full.width = parseInt(fullPhotoSize.w * fullHeight / fullPhotoSize.h);
        if (full.width > fullWidth) {
          full.height = parseInt(full.height * fullWidth / full.width);
          full.width = fullWidth;
        }
      }

      full.location = fullPhotoSize.location;
      full.size = fullPhotoSize.size;
    }

    photo.full = full;
    photo.fromUser = AppUsersManager.getUser(photo.user_id);

    return photo;
  }

  function openPhoto (photoID, accessHash) {
    var scope = $rootScope.$new(true);
    scope.photoID = photoID;

    var modalInstance = $modal.open({
      templateUrl: 'partials/photo_modal.html',
      controller: 'PhotoModalController',
      scope: scope,
      backdrop: 'static'
    });
  }

  $rootScope.openPhoto = openPhoto;


  return {
    savePhoto: savePhoto,
    wrapForHistory: wrapForHistory,
    wrapForFull: wrapForFull,
    openPhoto: openPhoto
  }
})


.service('AppVideoManager', function ($rootScope, $modal, $window, MtpApiFileManager, AppUsersManager) {
  var videos = {};

  function saveVideo (apiVideo) {
    videos[apiVideo.id] = apiVideo;

    if (apiVideo.thumb && apiVideo.thumb._ == 'photoCachedSize') {
      MtpApiFileManager.saveSmallFile(apiVideo.thumb.location, apiVideo.thumb.bytes);

      // Memory
      apiVideo.thumb.size = apiVideo.thumb.bytes.length;
      delete apiVideo.thumb.bytes;
      apiVideo.thumb._ = 'photoSize';
    }
  };

  function wrapForHistory (videoID) {
    var video = angular.copy(videos[videoID]),
        width = 100,
        height = 100,
        thumbPhotoSize = video.thumb,
        thumb = {
          placeholder: 'img/placeholders/VideoThumbConversation.gif',
          width: width,
          height: height
        };

    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      if (thumbPhotoSize.w > thumbPhotoSize.h) {
        thumb.height = parseInt(thumbPhotoSize.h * width / thumbPhotoSize.w);
      } else {
        thumb.width = parseInt(thumbPhotoSize.w * height / thumbPhotoSize.h);
      }

      thumb.location = thumbPhotoSize.location;
      thumb.size = thumbPhotoSize.size;
    }

    video.thumb = thumb;

    return video;
  }

  function wrapForFull (videoID) {
    var video = wrapForHistory(videoID),
        fullWidth = 542,
        fullHeight = $($window).height() - 150,
        fullPhotoSize = video,
        full = {
          placeholder: 'img/placeholders/VideoThumbModal.gif',
          width: fullWidth,
          height: fullHeight,
        };

    if (video.w > video.h) {
      full.height = parseInt(video.h * fullWidth / video.w);
    } else {
      full.width = parseInt(video.w * fullHeight / video.h);
      if (full.width > fullWidth) {
        full.height = parseInt(full.height * fullWidth / full.width);
        full.width = fullWidth;
      }
    }

    video.full = full;
    video.fromUser = AppUsersManager.getUser(video.user_id);

    return video;
  }

  function openVideo (videoID, accessHash) {
    var scope = $rootScope.$new(true);
    scope.videoID = videoID;
    scope.progress = {enabled: false};
    scope.player = {};
    // scope.close = function () {
    //   modalInstance.close();
    // }

    var modalInstance = $modal.open({
      templateUrl: 'partials/video_modal.html',
      controller: 'VideoModalController',
      scope: scope
    });
  }

  $rootScope.openVideo = openVideo;

  return {
    saveVideo: saveVideo,
    wrapForHistory: wrapForHistory,
    wrapForFull: wrapForFull,
    openVideo: openVideo
  }
})

.service('AppDocsManager', function ($rootScope, $modal, $window, $timeout, MtpApiFileManager, AppUsersManager) {
  var docs = {};
  var docsForHistory = {};

  function saveDoc (apiDoc) {
    docs[apiDoc.id] = apiDoc;

    if (apiDoc.thumb && apiDoc.thumb._ == 'photoCachedSize') {
      MtpApiFileManager.saveSmallFile(apiDoc.thumb.location, apiDoc.thumb.bytes);

      // Memory
      apiDoc.thumb.size = apiDoc.thumb.bytes.length;
      delete apiDoc.thumb.bytes;
      apiDoc.thumb._ = 'photoSize';
    }
  };

  function wrapForHistory (docID) {
    if (docsForHistory[docID] !== undefined) {
      return docsForHistory[docID];
    }

    var doc = angular.copy(docs[docID]),
        width = 100,
        height = 100,
        thumbPhotoSize = doc.thumb,
        thumb = {
          placeholder: 'img/placeholders/DocThumbConversation.jpg',
          width: width,
          height: height
        };

    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      if (thumbPhotoSize.w > thumbPhotoSize.h) {
        thumb.height = parseInt(thumbPhotoSize.h * width / thumbPhotoSize.w);
      } else {
        thumb.width = parseInt(thumbPhotoSize.w * height / thumbPhotoSize.h);
      }

      thumb.location = thumbPhotoSize.location;
      thumb.size = thumbPhotoSize.size;
    } else {
      thumb = false;
    }

    doc.thumb = thumb;

    return docsForHistory[docID] = doc;
  }

  function openDoc (docID, accessHash) {
    var doc = docs[docID],
        historyDoc = docsForHistory[docID] || doc || {},
        inputFileLocation = {
          _: 'inputDocumentFileLocation',
          id: docID,
          access_hash: accessHash || doc.access_hash
        };

    historyDoc.progress = {enabled: true, percent: 1, total: doc.size};

    function updateDownloadProgress (progress) {
      dLog('dl progress', progress);
      historyDoc.progress.done = progress.done;
      historyDoc.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      $rootScope.$broadcast('history_update');
    }


    if (window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry) {
      var ext = (doc.file_name.split('.', 2) || [])[1] || '',
          mime = doc.mime_type;
      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: doc.file_name,
        accepts: [{
          mimeTypes: [mime],
          extensions: [ext]
        }]
      }, function (writableFileEntry) {
        MtpApiFileManager.downloadFile(doc.dc_id, inputFileLocation, doc.size, writableFileEntry).then(function (url) {
          delete historyDoc.progress;
          dLog('file save done');
        }, function (e) {
          dLog('document download failed', e);
          historyDoc.progress.enabled = false;
        }, updateDownloadProgress);
      });
    } else {
      MtpApiFileManager.downloadFile(doc.dc_id, inputFileLocation, doc.size).then(function (url) {
        delete historyDoc.progress;

        var a = $('<a>Download</a>').attr('href', url).attr('target', '_blank').attr('download', doc.file_name).appendTo('body');
        a[0].dataset.downloadurl = ['png', doc.file_name, url].join(':');
        a[0].click();
        $timeout(function () {
          a.remove();
        }, 100);
      }, function (e) {
        dLog('document download failed', e);
        historyDoc.progress.enabled = false;
      }, updateDownloadProgress);
    }
  }

  $rootScope.openDoc = openDoc;

  return {
    saveDoc: saveDoc,
    wrapForHistory: wrapForHistory,
    openDoc: openDoc
  }
})

.service('ExternalResourcesManager', function ($q, $http) {
  var urlPromises = {};

  function downloadImage (url) {
    if (urlPromises[url] !== undefined) {
      return urlPromises[url];
    }

    var deferred = $q.defer();

    $http.get(url, {responseType: 'blob', transformRequest: null})
      .then(
        function (response) {
          deferred.resolve(window.webkitURL.createObjectURL(response.data));
        }, function (error) {
          deferred.reject(error);
        }
      );

    return urlPromises[url] = deferred.promise;
  }

  return {
    downloadImage: downloadImage
  }
})


.service('ApiUpdatesManager', function ($rootScope, MtpNetworkerFactory, AppUsersManager, AppChatsManager, AppPeersManager, MtpApiManager) {

  var curState = {invalid: true};

  function processUpdateMessage (updateMessage) {
    if (curState.invalid) {
      return false;
    }

    if (updateMessage.seq) {
      if (!saveSeq(updateMessage.seq, updateMessage.seq_start)) {
        return false;
      }
      if (updateMessage.date) {
        curState.date = updateMessage.date;
      }
    }


    switch (updateMessage._) {
      case 'updatesTooLong':
        getDifference();
        break;

      case 'updateShort':
        saveUpdate(updateMessage.update);
        break;

      case 'updatesCombined':
      case 'updates':
        AppUsersManager.saveApiUsers(updateMessage.users);
        AppChatsManager.saveApiChats(updateMessage.chats);

        var i, update, message;
        for (var i = 0; i < updateMessage.updates.length; i++) {
          update = updateMessage.updates[i];
          switch (update._) {
            case 'updateNewMessage':
              message = update.message;
              if (message.from_id && !AppUsersManager.hasUser(message.from_id)) {
                dLog('User not found', message.from_id, 'getDiff');
                getDifference();
                return false;
              }
              if (message.to_id.chat_id && !AppChatsManager.hasChat(message.to_id.chat_id)) {
                dLog('Chat not found', message.to_id.chat_id, 'getDiff');
                getDifference();
                return false;
              }
              break;
          }
        }

        angular.forEach(updateMessage.updates, function (update) {
          saveUpdate(update);
        });
        break;

      case 'updateShortMessage':
        if (!AppUsersManager.hasUser(updateMessage.from_id)) {
          dLog('User not found', updateMessage.from_id, 'getDiff');
          getDifference();
          break;
        }
        saveUpdate({
          _: 'updateNewMessage',
          message: {
            _: 'message',
            id: updateMessage.id,
            from_id: updateMessage.from_id,
            to_id: AppPeersManager.getOutputPeer(MtpApiManager.getUserID()),
            out: false,
            unread: true,
            date: updateMessage.date,
            message: updateMessage.message,
            media: {_: 'messageMediaEmpty'}
          },
          pts: updateMessage.pts
        });
        break;

      case 'updateShortChatMessage':
        if (!AppUsersManager.hasUser(updateMessage.from_id) ||
            !AppChatsManager.hasChat(updateMessage.chat_id)) {
          dLog('User or chat not found', updateMessage.from_id, updateMessage.chat_id, 'getDiff');
          getDifference();
          break;
        }
        saveUpdate({
          _: 'updateNewMessage',
          message: {
            _: 'message',
            id: updateMessage.id,
            from_id: updateMessage.from_id,
            to_id: AppPeersManager.getOutputPeer(-updateMessage.chat_id),
            out: false,
            unread: true,
            date: updateMessage.date,
            message: updateMessage.message,
            media: {_: 'messageMediaEmpty'}
          },
          pts: updateMessage.pts
        });
        break;
    }

    return true;
  }

  function getDifference (force) {
    if (curState.invalid && !force) {
      return false;
    }

    curState.invalid = true;
    MtpApiManager.invokeApi('updates.getDifference', {pts: curState.pts, date: curState.date, qts: 0}).then(function (differenceResult) {
      if (differenceResult._ == 'updates.differenceEmpty') {
        curState.date = differenceResult.date;
        curState.seq = differenceResult.seq;
        delete curState.invalid;
        return false;
      }

      AppUsersManager.saveApiUsers(differenceResult.users);
      AppChatsManager.saveApiChats(differenceResult.chats);

      // Should be first because of updateMessageID
      angular.forEach(differenceResult.other_updates, function(update){
        saveUpdate(update, true);
      });

      angular.forEach(differenceResult.new_messages, function (apiMessage) {
        saveUpdate({
          _: 'updateNewMessage',
          message: apiMessage,
          pts: curState.pts
        }, true);
      });

      var nextState = differenceResult.intermediate_state || differenceResult.state;
      curState.seq = nextState.seq;
      curState.pts = nextState.pts;
      curState.date = nextState.date;

      if (differenceResult._ == 'updates.differenceSlice') {
        getDifference(true);
      } else {
        delete curState.invalid;
      }
    });
  }

  function saveUpdate (update, force) {
    if (curState.invalid && !force) {
      return false;
    }
    if (update.pts) {
      curState.pts = update.pts;
    }

    $rootScope.$broadcast('apiUpdate', update);
  }

  function saveSeq (seq, seqStart) {
    // dLog('saving seq', curState.invalid, seq, seqStart, curState.seq);

    if (curState.invalid) {
      return false;
    }

    seqStart = seqStart || seq;

    if (seqStart != curState.seq + 1) {
      // dLog('seq hole', seqStart, curState.seq);
      if (seqStart != curState.seq) {
        getDifference();
      }
      return false;
    }

    curState.seq = seq;

    return true;
  }

  function attach () {
    MtpNetworkerFactory.setUpdatesProcessor(processUpdateMessage);
    MtpApiManager.invokeApi('updates.getState').then(function (stateResult) {
      curState.seq = stateResult.seq;
      curState.pts = stateResult.pts;
      curState.date = stateResult.date;
      delete curState.invalid;
    })
  }


  return {
    saveUpdate: saveUpdate,
    saveSeq: saveSeq,
    attach: attach
  }
})

.service('RichTextProcessor', function ($sce, $sanitize) {

  var emojiUtf = [],
      emojiMap = {},
      emojiData = Config.Emoji,
      emojiCode;

  for (emojiCode in emojiData) {
    emojiUtf.push(emojiData[emojiCode][0]);
    emojiMap[emojiData[emojiCode][0]] = emojiCode;
  }

  var regExp = new RegExp('((?:(ftp|https?)://|(?:mailto:)?([A-Za-z0-9._%+-]+@))(\\S*\\.\\S*[^\\s.;,(){}<>"\']))|(\\n)|(' + emojiUtf.join('|') + ')', 'i');

  // dLog(regExp);


  return {
    wrapRichText: wrapRichText
  };

  function encodeEntities(value) {
    return value.
      replace(/&/g, '&amp;').
      replace(/([^\#-~| |!])/g, function (value) { // non-alphanumeric
        return '&#' + value.charCodeAt(0) + ';';
      }).
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;');
  };


  function wrapRichText(text, options) {
    if (!text || !text.length) {
      return '';
    }

    options = options || {};

    text = text.replace(/\ufe0f/g, '', text);

    var match,
        raw = text,
        html = [],
        url,
        emojiTitle,
        emojiFound = false;


    while ((match = raw.match(regExp))) {
      // dLog(2, match);
      html.push(encodeEntities(raw.substr(0, match.index)));

      if (match[1]) { // URL
        if (!options.noLinks) {
          if (match[3]) {
            html.push(
              '<a href="',
              encodeEntities('mailto:' + match[3] + match[4]),
              '" target="_blank">',
              encodeEntities(match[3] + match[4]),
              '</a>'
            );
          } else {
            html.push(
              '<a href="',
              encodeEntities(match[2] + '://' + match[4]),
              '" target="_blank">',
              encodeEntities((match[2] != 'http' ? match[2] + '://' : '') + match[4]),
              '</a>'
            );
          }
        } else {
          html.push(encodeEntities(match[0]));
        }
      }
      else if (match[5]) { // New line
        if (!options.noLinebreaks) {
          html.push('<br/>');
        } else {
          html.push(' ');
        }
      }
      else if (match[6]) {

        if (emojiCode = emojiMap[match[6]]) {
          emojiFound = true;
          emojiTitle = encodeEntities(emojiData[emojiCode][1][0]);
          html.push(
            '<span class="emoji emoji-file-',
            encodeEntities(emojiCode),
            '" title="',
            emojiTitle,
            '">:',
            emojiTitle,
            ':</span>'
          );
        } else {
          html.push(encodeEntities(match[6]));
        }
      }
      raw = raw.substr(match.index + match[0].length);
    }

    html.push(encodeEntities(raw));

    text = $sanitize(html.join(''));

    // dLog(3, text, html);

    if (emojiFound) {
      text = text.replace(/<span class="emoji emoji-file-([0-9a-f]+?)"(.+?)<\/span>/g,
                          '<span class="emoji" style="background-image: url(\'vendor/gemoji/images/$1.png\')"$2</span>');
    }

    // dLog(4, text, html);

    return $sce.trustAs('html', text);
  }

})


.service('IdleManager', function ($rootScope, $window, $timeout) {

  $rootScope.idle = {isIDLE: false};

  var toPromise;

  return {
    start: start
  };

  function start () {
    $($window).on('blur focus keydown mousedown touchstart', onEvent);
  }

  function onEvent (e) {
    // dLog('event', e.type);
    if (e.type == 'mousemove') {
      $($window).off('mousemove', onEvent);
    }
    var isIDLE = e.type == 'blur' || e.type == 'timeout' ? true : false;

    $timeout.cancel(toPromise);
    if (!isIDLE) {
      // dLog('update timeout');
      toPromise = $timeout(function () {
        onEvent({type: 'timeout'});
      }, 30000);
    }

    if ($rootScope.idle.isIDLE == isIDLE) {
      return;
    }

    // dLog('IDLE changed', isIDLE);
    $rootScope.$apply(function () {
      $rootScope.idle.isIDLE = isIDLE;
    });

    if (isIDLE && e.type == 'timeout') {
      $($window).on('mousemove', onEvent);
    }
  }
})


.service('NotificationsManager', function ($rootScope, $window, $timeout, $interval, MtpApiManager, AppPeersManager, IdleManager) {

  var notificationsUiSupport = window.webkitNotifications !== undefined;
  var notificationsShown = [];
  var notificationsCount = 0;
  var peerSettings = {};
  var faviconEl = $('link[rel="icon"]');

  var titleBackup = document.title,
      faviconBackup = faviconEl.attr('href'),
      titlePromise;

  $rootScope.$watch('idle.isIDLE', function (newVal) {
    // dLog('isIDLE watch', newVal);
    $interval.cancel(titlePromise);

    if (!newVal) {
      notificationsCount = 0;
      document.title = titleBackup;
      faviconEl.attr('href', faviconBackup);
      notificationsClear();
    } else {
      titleBackup = document.title;

      titlePromise = $interval(function () {
        var time = +new Date();
        // dLog('check title', notificationsCount, time % 2000 > 1000);
        if (!notificationsCount || time % 2000 > 1000) {
          document.title = titleBackup;
          faviconEl.attr('href', faviconBackup);
        } else {
          document.title = notificationsCount + ' notifications';
          faviconEl.attr('href', 'favicon_unread.ico');
        }
      }, 1000);
    }
  });

  return {
    start: start,
    notify: notify,
    getPeerSettings: getPeerSettings
  };

  function getPeerSettings (peerID) {
    if (peerSettings[peerID] !== undefined) {
      return peerSettings[peerID];
    }

    return peerSettings[peerID] = MtpApiManager.invokeApi('account.getNotifySettings', {
      peer: {
        _: 'inputNotifyPeer',
        peer: AppPeersManager.getInputPeerByID(peerID)
      }
    }).then(function (peerNotifySettings) {
      // dLog('got settings', peerID, peerNotifySettings);
      return peerNotifySettings._ == 'peerNotifySettings' &&
             peerNotifySettings.mute_until * 1000 > (+new Date());
    });
  }

  function start () {
    if (!notificationsUiSupport) {
      return false;
    }

    var havePermission = window.webkitNotifications.checkPermission();
    // dLog('perm', havePermission);

    if (havePermission != 0) { // 0 is PERMISSION_ALLOWED
      $($window).on('click', requestPermission);
    }

    $($window).on('beforeunload', notificationsClear);
  }

  function requestPermission() {
    window.webkitNotifications.requestPermission();
    $($window).off('click', requestPermission);
  }

  function notify (data) {
    // dLog('notify', $rootScope.idle.isIDLE);
    if (!$rootScope.idle.isIDLE) {
      return false;
    }

    notificationsCount++;

    if (!notificationsUiSupport ||
        window.webkitNotifications.checkPermission() != 0) {
      return false;
    }

    var notification = window.webkitNotifications.createNotification(
      data.image || '',
      data.title || '',
      data.message || ''
    );

    notification.onclick = function () {
      notification.close();
      window.focus();
      notificationsClear();
      if (data.onclick) {
        data.onclick();
      }
    };

    // dLog('notify', notification);

    notification.show();

    notificationsShown.push(notification);
  };

  function notificationsClear() {
    angular.forEach(notificationsShown, function (notification) {
      try {
        if (notification.close) {
          notification.close()
        } else if (notification.cancel) {
          notification.cancel();
        }
      } catch (e) {}
    });
    notificationsShown = [];
  }
})


.service('ErrorService', function ($rootScope, $modal) {

  function showError (templateUrl, params, options) {
    var scope = $rootScope.$new();
    angular.extend(scope, params);

    return $modal.open({
      templateUrl: templateUrl,
      // controller: 'ErrorModalController',
      scope: scope,
      windowClass: options.windowClass || ''
    });
  }

  function showSimpleError (title, description) {
    return showError ('partials/error_modal.html', {
      title: title,
      description: description
    }, {
      windowClass: 'error_modal_window'
    });
  };

  return {
    showError: showError,
    showSimpleError: showSimpleError
  }
})
