/*!
 * Webogram v0.1.5 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Services */

angular.module('myApp.services', [])

.service('AppConfigManager', function ($q) {
  var testPrefix = Config.Modes.test ? 't_' : '';
  var cache = {};
  var useCs = !!(window.chrome && chrome.storage && chrome.storage.local);
  var useLs = !useCs && !!window.localStorage;

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
      else if (!useCs) {
        result.push(cache[key] = false);
      }
      else {
        allFound = false;
      }
    });

    if (allFound) {
      return $q.when(single ? result[0] : result);
    }

    var deferred = $q.defer();

    chrome.storage.local.get(keys, function (resultObj) {
      result = [];
      angular.forEach(keys, function (key) {
        var value = resultObj[key];
        value = value === undefined || value === null ? false : JSON.parse(value);
        result.push(cache[key] = value);
      });

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

    if (!useCs) {
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

    if (!useCs) {
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

.service('AppUsersManager', function ($rootScope, $modal, $modalStack, $filter, $q, MtpApiFileManager, MtpApiManager, RichTextProcessor, SearchIndexManager) {
  var users = {},
      cachedPhotoLocations = {},
      contactsFillPromise,
      contactsList,
      contactsIndex = SearchIndexManager.createIndex();

  function fillContacts () {
    if (contactsFillPromise) {
      return contactsFillPromise;
    }
    return contactsFillPromise = MtpApiManager.invokeApi('contacts.getContacts', {
      hash: ''
    }).then(function (result) {
      var userID, searchText, i;
      contactsList = [];
      saveApiUsers(result.users);

      for (var i = 0; i < result.contacts.length; i++) {
        userID = result.contacts[i].user_id;
        contactsList.push(userID);
        SearchIndexManager.indexObject(userID, getUserSearchText(userID), contactsIndex);
      }

      return contactsList;
    });
  }

  function getUserSearchText (id) {
    var user = users[id];
    if (!user) {
      return false;
    }

    return (user.first_name || '') + ' ' + (user.last_name || '') + ' ' + (user.phone || '');
  }

  function getContacts (query) {
    return fillContacts().then(function (contactsList) {
      if (angular.isString(query) && query.length) {
        var results = SearchIndexManager.search(query, contactsIndex),
            filteredContactsList = [];

        for (var i = 0; i < contactsList.length; i++) {
          if (results[contactsList[i]]) {
            filteredContactsList.push(contactsList[i])
          }
        }
        contactsList = filteredContactsList;
      }

      return contactsList;
    });
  };

  function saveApiUsers (apiUsers) {
    angular.forEach(apiUsers, saveApiUser);
  };

  function saveApiUser (apiUser) {
    if (!angular.isObject(apiUser)) {
      return;
    }

    if (apiUser.phone) {
      apiUser.rPhone = $filter('phoneNumber')(apiUser.phone);
    }

    if (apiUser.first_name) {
      apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.first_name, {noLinks: true, noLinebreaks: true});
      apiUser.rFullName = RichTextProcessor.wrapRichText(apiUser.first_name + ' ' + (apiUser.last_name || ''), {noLinks: true, noLinebreaks: true});
    } else {
      apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || apiUser.rPhone || 'DELETED';
      apiUser.rFullName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || apiUser.rPhone || 'DELETED';
    }
    apiUser.sortName = SearchIndexManager.cleanSearchText(apiUser.first_name + ' ' + (apiUser.last_name || ''));
    apiUser.sortStatus = apiUser.status && (apiUser.status.expires || apiUser.status.was_online) || 0;


    if (users[apiUser.id] === undefined) {
      users[apiUser.id] = apiUser;
    } else {
      safeReplaceObject(users[apiUser.id], apiUser);
    }

    if (cachedPhotoLocations[apiUser.id] !== undefined) {
      safeReplaceObject(cachedPhotoLocations[apiUser.id], apiUser && apiUser.photo && apiUser.photo.photo_small || {empty: true});
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

    if (cachedPhotoLocations[id] === undefined) {
      cachedPhotoLocations[id] = user && user.photo && user.photo.photo_small || {empty: true};
    }

    var num = (Math.abs(id) % 8) + 1;

    return {
      num: num,
      placeholder: 'img/placeholders/' + placeholder + 'Avatar' + num + '@2x.png',
      location: cachedPhotoLocations[id]
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

    return user;
  }

  function openUser (userID, accessHash) {
    var scope = $rootScope.$new();
    scope.userID = userID;

    var modalInstance = $modal.open({
      templateUrl: 'partials/user_modal.html',
      controller: 'UserModalController',
      scope: scope,
      windowClass: 'user_modal_window'
    });
  };
  $rootScope.openUser = openUser;

  function importContact (phone, firstName, lastName) {
    return MtpApiManager.invokeApi('contacts.importContacts', {
      contacts: [{
        _: 'inputPhoneContact',
        client_id: '1',
        phone: phone,
        first_name: firstName,
        last_name: lastName
      }],
      replace: false
    }).then(function (importedContactsResult) {
      saveApiUsers(importedContactsResult.users);

      var foundUserID = false;
      angular.forEach(importedContactsResult.imported, function (importedContact) {
        onContactUpdated(foundUserID = importedContact.user_id, true);
      });

      return foundUserID;
    });
  };

  function deleteContacts (userIDs) {
    var ids = []
    angular.forEach(userIDs, function (userID) {
      ids.push({_: 'inputUserContact', user_id: userID})
    });
    return MtpApiManager.invokeApi('contacts.deleteContacts', {
      id: ids
    }).then(function () {
      angular.forEach(userIDs, function (userID) {
        onContactUpdated(userID, false);
      });
    })
  }

  function onContactUpdated (userID, isContact) {
    if (angular.isArray(contactsList)) {
      var curPos = curIsContact = contactsList.indexOf(userID),
          curIsContact = curPos != -1;

      if (isContact != curIsContact) {
        if (isContact) {
          contactsList.push(userID);
          SearchIndexManager.indexObject(userID, getUserSearchText(userID), contactsIndex);
        } else {
          contactsList.splice(curPos, 1);
        }
      }
    }
  }

  function openImportContact () {
    return $modal.open({
      templateUrl: 'partials/import_contact_modal.html',
      controller: 'ImportContactModalController',
      windowClass: 'import_contact_modal_window'
    }).result.then(function (foundUserID) {
      if (!foundUserID) {
        ErrorService.show({
          error: {code: 404, type: 'USER_NOT_USING_TELEGRAM'}
        });
        return $q.reject();
      }
      return foundUserID;
    });
  };


  $rootScope.$on('apiUpdate', function (e, update) {
    // console.log('on apiUpdate', update);
    switch (update._) {
      case 'updateUserStatus':
        var userID = update.user_id,
            user = users[userID];
        if (user) {
          user.status = update.status;
          user.sortStatus = update.status && (update.status.expires || update.status.was_online) || 0;
          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updateUserPhoto':
        var userID = update.user_id;
        if (users[userID]) {
          safeReplaceObject(users[userID].photo, update.photo);

          if (cachedPhotoLocations[userID] !== undefined) {
            safeReplaceObject(cachedPhotoLocations[userID], update.photo && update.photo.photo_small || {empty: true});
          }

          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updateContactLink':
        onContactUpdated(update.user_id, update.my_link._ == 'contacts.myLinkContact');
        break;
    }
  });


  return {
    getContacts: getContacts,
    saveApiUsers: saveApiUsers,
    saveApiUser: saveApiUser,
    getUser: getUser,
    getUserInput: getUserInput,
    getUserPhoto: getUserPhoto,
    getUserString: getUserString,
    getUserSearchText: getUserSearchText,
    hasUser: hasUser,
    importContact: importContact,
    deleteContacts: deleteContacts,
    wrapForFull: wrapForFull,
    openUser: openUser,
    openImportContact: openImportContact
  }
})

.service('AppChatsManager', function ($rootScope, $modal, MtpApiFileManager, MtpApiManager, AppUsersManager, RichTextProcessor) {
  var chats = {},
      cachedPhotoLocations = {};

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
      safeReplaceObject(chats[apiChat.id], apiChat);
    }

    if (cachedPhotoLocations[apiChat.id] !== undefined) {
      safeReplaceObject(cachedPhotoLocations[apiChat.id], apiChat && apiChat.photo && apiChat.photo.photo_small || {empty: true});
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

    if (cachedPhotoLocations[id] === undefined) {
      cachedPhotoLocations[id] = chat && chat.photo && chat.photo.photo_small || {empty: true};
    }

    return {
      placeholder: 'img/placeholders/' + placeholder + 'Avatar'+((Math.abs(id) % 4) + 1)+'@2x.png',
      location: cachedPhotoLocations[id]
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
      MtpApiManager.getUserID().then(function (myID) {
        angular.forEach(chatFull.participants.participants, function(participant){
          participant.user = AppUsersManager.getUser(participant.user_id);
          participant.userPhoto = AppUsersManager.getUserPhoto(participant.user_id, 'User');
          participant.inviter = AppUsersManager.getUser(participant.inviter_id);
          participant.canKick = myID != participant.user_id && (myID == chatFull.participants.admin_id || myID == participant.inviter_id);
        });
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
      templateUrl: 'partials/chat_modal.html',
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
    getPeerSearchText: function (peerID) {
      var text;
      if (peerID > 0) {
        text = AppUsersManager.getUserSearchText(peerID);
      } else if (peerID < 0) {
        var chat = AppChatsManager.getChat(-peerID);
        text = chat.title || '';
      }
      return text;
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

.service('SearchIndexManager', function () {
  var badCharsRe = /[`~!@#$%^&*()\-_=+\[\]\\|{}'";:\/?.>,<\s]+/g,
      trimRe = /^\s+|\s$/g,
      accentsReplace = {
        a: /[åáâäà]/g,
        e: /[éêëè]/g,
        i: /[íîïì]/g,
        o: /[óôöò]/g,
        u: /[úûüù]/g,
        c: /ç/g,
        ss: /ß/g
      }

  return {
    createIndex: createIndex,
    indexObject: indexObject,
    cleanSearchText: cleanSearchText,
    search: search
  };

  function createIndex () {
    return {
      shortIndexes: {},
      fullTexts: {}
    }
  }

  function cleanSearchText (text) {
    text = text.replace(badCharsRe, ' ').replace(trimRe, '').toLowerCase();

    for (var key in accentsReplace) {
      if (accentsReplace.hasOwnProperty(key)) {
        text = text.replace(accentsReplace[key], key);
      }
    }

    return text;
  }

  function indexObject (id, searchText, searchIndex) {
    if (searchIndex.fullTexts[id] !== undefined) {
      return false;
    }

    searchText = cleanSearchText(searchText);

    if (!searchText.length) {
      return false;
    }

    var shortIndexes = searchIndex.shortIndexes;

    searchIndex.fullTexts[id] = searchText;

    angular.forEach(searchText.split(' '), function(searchWord) {
      var len = Math.min(searchWord.length, 3),
          wordPart, i;
      for (i = 1; i <= len; i++) {
        wordPart = searchWord.substr(0, i);
        if (shortIndexes[wordPart] === undefined) {
          shortIndexes[wordPart] = [id];
        } else {
          shortIndexes[wordPart].push(id);
        }
      }
    });
  }

  function search (query, searchIndex) {
    console.time('search');
    var shortIndexes = searchIndex.shortIndexes,
        fullTexts = searchIndex.fullTexts;

    query = cleanSearchText(query);

    var queryWords = query.split(' '),
        foundObjs = false,
        newFoundObjs, i, j, searchText, found;

    for (i = 0; i < queryWords.length; i++) {
      newFoundObjs = shortIndexes[queryWords[i].substr(0, 3)];
      if (!newFoundObjs) {
        foundObjs = [];
        break;
      }
      if (foundObjs === false || foundObjs.length > newFoundObjs.length) {
        foundObjs = newFoundObjs;
      }
    }

    newFoundObjs = {};

    for (j = 0; j < foundObjs.length; j++) {
      found = true;
      searchText = fullTexts[foundObjs[j]];
      for (i = 0; i < queryWords.length; i++) {
        if (searchText.indexOf(queryWords[i]) == -1) {
          found = false;
          break;
        }
      }
      if (found) {
        newFoundObjs[foundObjs[j]] = true;
      }
    }

    console.timeEnd('search');
    return newFoundObjs;
  }
})

.service('AppMessagesManager', function ($q, $rootScope, $location, $filter, ApiUpdatesManager, AppUsersManager, AppChatsManager, AppPeersManager, AppPhotosManager, AppVideoManager, AppDocsManager, AppAudioManager, MtpApiManager, MtpApiFileManager, RichTextProcessor, NotificationsManager, SearchIndexManager) {

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

  NotificationsManager.start();

  function getDialogs (query, maxID, limit) {

    var curDialogStorage = dialogsStorage;

    if (angular.isString(query) && query.length) {
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
    if (maxID > 0) {
      for (offset = 0; offset < curDialogStorage.dialogs.length; offset++) {
        if (maxID > curDialogStorage.dialogs[offset].top_message) {
          break;
        }
      }
    }

    if (curDialogStorage.count !== null && curDialogStorage.dialogs.length == curDialogStorage.count ||
        curDialogStorage.dialogs.length >= offset + (limit || 1)
    ) {
      return $q.when({
        count: curDialogStorage.count,
        dialogs: curDialogStorage.dialogs.slice(offset, offset + (limit || 20))
      });
    }

    limit = limit || 20;

    return MtpApiManager.invokeApi('messages.getDialogs', {
      offset: offset,
      limit: limit,
      max_id: maxID || 0
    }).then(function (dialogsResult) {
      AppUsersManager.saveApiUsers(dialogsResult.users);
      AppChatsManager.saveApiChats(dialogsResult.chats);
      saveMessages(dialogsResult.messages);

      if (maxID > 0) {
        for (offset = 0; offset < curDialogStorage.dialogs.length; offset++) {
          if (maxID > curDialogStorage.dialogs[offset].top_message) {
            break;
          }
        }
      }

      curDialogStorage.count = dialogsResult._ == 'messages.dialogsSlice'
        ? dialogsResult.count
        : dialogsResult.dialogs.length;

      curDialogStorage.dialogs.splice(offset, curDialogStorage.dialogs.length - offset);
      angular.forEach(dialogsResult.dialogs, function (dialog) {
        var peerID = AppPeersManager.getPeerID(dialog.peer),
            peerText = AppPeersManager.getPeerSearchText(peerID);

        SearchIndexManager.indexObject(peerID, peerText, dialogsIndex);

        curDialogStorage.dialogs.push({
          peerID: peerID,
          top_message: dialog.top_message,
          unread_count: dialog.unread_count
        });

        if (historiesStorage[peerID] === undefined) {
          historiesStorage[peerID] = {count: null, history: [dialog.top_message], pending: []}
        }

        NotificationsManager.savePeerSettings(peerID, dialog.notify_settings);
      });

      return {
        count: curDialogStorage.count,
        dialogs: curDialogStorage.dialogs.slice(offset, offset + limit)
      };
    });
  }

  function fillHistoryStorage (inputPeer, maxID, fullLimit, historyStorage) {
    console.log('fill history storage', inputPeer, maxID, fullLimit, angular.copy(historyStorage));
    return MtpApiManager.invokeApi('messages.getHistory', {
      peer: inputPeer,
      offset: 0,
      limit: fullLimit,
      max_id: maxID || 0
    }).then(function (historyResult) {
      AppUsersManager.saveApiUsers(historyResult.users);
      AppChatsManager.saveApiChats(historyResult.chats);
      saveMessages(historyResult.messages);

      historyStorage.count = historyResult._ == 'messages.messagesSlice'
        ? historyResult.count
        : historyResult.messages.length;

      var offset = 0;
      if (maxID > 0) {
        for (offset = 0; offset < historyStorage.history.length; offset++) {
          if (maxID > historyStorage.history[offset]) {
            break;
          }
        }
      }

      historyStorage.history.splice(offset, historyStorage.history.length - offset);
      angular.forEach(historyResult.messages, function (message) {
        historyStorage.history.push(message.id);
      });

      fullLimit -= historyResult.messages.length;

      if (fullLimit > 0 && historyStorage.history.length < historyStorage.count) {
        maxID = historyStorage.history[historyStorage.history.length - 1];
        return fillHistoryStorage(inputPeer, maxID, fullLimit, historyStorage);
      }

      return true;
    });
  };

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

    var unreadLimit = false;
    if (!limit && !maxID) {
      var foundDialog = getDialogByPeerID(peerID);
      if (foundDialog && foundDialog[0] && foundDialog[0].unread_count > 1) {
        unreadLimit = Math.min(1000, foundDialog[0].unread_count);
        limit = unreadLimit;
      }
    }

    if (maxID > 0) {
      for (offset = 0; offset < historyStorage.history.length; offset++) {
        if (maxID > historyStorage.history[offset]) {
          break;
        }
      }
    }

    if (historyStorage.count !== null && historyStorage.history.length == historyStorage.count ||
      historyStorage.history.length >= offset + (limit || 1)
    ) {
      return $q.when({
        count: historyStorage.count,
        history: resultPending.concat(historyStorage.history.slice(offset, offset + (limit || 20))),
        unreadLimit: unreadLimit
      });
    }

    if (unreadLimit) {
      limit = Math.max(20, unreadLimit + 2);
    }

    limit = limit || 20;

    return fillHistoryStorage(inputPeer, maxID, limit, historyStorage).then(function () {
      offset = 0;
      if (maxID > 0) {
        for (offset = 0; offset < historyStorage.history.length; offset++) {
          if (maxID > historyStorage.history[offset]) {
            break;
          }
        }
      }

      return {
        count: historyStorage.count,
        history: resultPending.concat(historyStorage.history.slice(offset, offset + limit)),
        unreadLimit: unreadLimit
      };
    });
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
            foundMsgs.push(message.id);
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

      var foundCount = searchResult._ == 'messages.messagesSlice'
        ? searchResult.count
        : searchResult.messages.length;

      foundMsgs = [];
      angular.forEach(searchResult.messages, function (message) {
        foundMsgs.push(message.id);
      });

      if (useSearchCache) {
        lastSearchResults = listMergeSorted(lastSearchResults, foundMsgs);
      }

      return {
        count: foundCount,
        history: foundMsgs
      };
    });
  }

  function getMessage (messageID) {
    return messagesStorage[messageID] || {deleted: true};
  }

  function deleteMessages (messageIDs) {
    return MtpApiManager.invokeApi('messages.deleteMessages', {
      id: messageIDs
    }).then(function (deletedMessageIDs) {

      ApiUpdatesManager.saveUpdate({
        _: 'updateDeleteMessages',
        messages: deletedMessageIDs
      });

      return deletedMessageIDs;
    });
  }

  function processAffectedHistory (inputPeer, affectedHistory, method) {
    if (!ApiUpdatesManager.saveSeq(affectedHistory.seq)) {
      return false;
    }
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
        historyStorage = historiesStorage[peerID],
        foundDialog = getDialogByPeerID(peerID);

    if (!foundDialog[0] || !foundDialog[0].unread_count) {

      if (!historyStorage || !historyStorage.history.length) {
        return false;
      }

      var messageID,
          message,
          foundUnread = false;
      for (i = historyStorage.history.length; i >= 0; i--) {
        messageID = historyStorage.history[i];
        message = messagesStorage[messageID];
        // console.log('ms', message);
        if (message && !message.out && message.unread) {
          foundUnread = true;
          break;
        }
      }
      if (!foundUnread) {
        return false;
      }
    }

    var promise = MtpApiManager.invokeApi('messages.readHistory', {
      peer: inputPeer,
      offset: 0,
      max_id: 0
    }).then(function (affectedHistory) {
      return processAffectedHistory(inputPeer, affectedHistory, 'messages.readHistory');
    }).then(function () {
      if (foundDialog[0]) {
        // console.log('done read history', peerID);
        foundDialog[0].unread_count = 0;
        $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: 0});
      }
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
        }
      }
    }

    return promise;
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
      if (apiMessage.media && apiMessage.media._ == 'messageMediaAudio') {
        AppAudioManager.saveAudio(apiMessage.media.audio);
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
        date: tsNow() / 1000,
        message: text,
        media: {_: 'messageMediaEmpty'},
        random_id: randomIDS,
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
      }

      message.send = function () {
        toggleError(false);
        var sentRequestOptions = {};
        if (pendingAfterMsgs[peerID]) {
          sentRequestOptions.afterMessageID = pendingAfterMsgs[peerID].messageID;
        }
        MtpApiManager.invokeApi('messages.sendMessage', {
          peer: inputPeer,
          message: text,
          random_id: randomID
        }, sentRequestOptions).then(function (result) {
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
    });

    pendingByRandomID[randomIDS] = [peerID, messageID];
  };

  function sendFile(peerID, file, options) {
    options = options || {};
    var messageID = tempID--,
        randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString(),
        historyStorage = historiesStorage[peerID],
        inputPeer = AppPeersManager.getInputPeerByID(peerID),
        attachType, fileName;

    if (!options.isMedia) {
      attachType = 'document';
      fileName = 'document.' + file.type.split('/')[1];
    } else if (['image/jpeg', 'image/png', 'image/bmp'].indexOf(file.type) >= 0) {
      attachType = 'photo';
      fileName = 'photo.' + file.type.split('/')[1];
    } else if (file.type.substr(0, 6) == 'video/') {
      attachType = 'video';
      fileName = 'video.mp4';
    } else if (file.type == 'audio/mpeg' || file.type == 'audio/mp3') {
      attachType = 'audio';
      fileName = 'audio.mp3';
    } else {
      attachType = 'document';
      fileName = 'document.' + file.type.split('/')[1];
    }

    if (!file.name) {
      file.name = fileName;
    }

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    MtpApiManager.getUserID().then(function (fromID) {
      var media = {
        _: 'messageMediaPending',
        type: attachType,
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
        date: tsNow() / 1000,
        message: '',
        media: media,
        random_id: randomIDS,
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
      }

      message.send = function () {
        var sendFileDeferred = $q.defer();

        sendFilePromise.then(function () {
          var uploaded = false,
              uploadPromise = MtpApiFileManager.uploadFile(file);

          uploadPromise.then(function (inputFile) {
            uploaded = true;
            var inputMedia;
            switch (attachType) {
              case 'photo':
                inputMedia = {_: 'inputMediaUploadedPhoto', file: inputFile};
                break;

              case 'video':
                inputMedia = {_: 'inputMediaUploadedVideo', file: inputFile, duration: 0, w: 0, h: 0};
                break;

              case 'audio':
                inputMedia = {_: 'inputMediaUploadedAudio', file: inputFile, duration: 0};
                break;

              case 'document':
              default:
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

            }, function (error) {
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
    });

    pendingByRandomID[randomIDS] = [peerID, messageID];
  }

  function sendOther(peerID, inputMedia) {
    var messageID = tempID--,
        randomID = [nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)],
        randomIDS = bigint(randomID[0]).shiftLeft(32).add(bigint(randomID[1])).toString(),
        historyStorage = historiesStorage[peerID],
        inputPeer = AppPeersManager.getInputPeerByID(peerID);

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    MtpApiManager.getUserID().then(function (fromID) {
      var media;
      switch (inputMedia._) {
        case 'inputMediaContact':
          media = angular.extend({}, inputMedia, {_: 'messageMediaContact'});
          break;

        case 'inputMediaPhoto':
          media = {photo: AppPhotosManager.getPhoto(inputMedia.id.id)};
          break;
      }

      var message = {
        _: 'message',
        id: messageID,
        from_id: fromID,
        to_id: AppPeersManager.getOutputPeer(peerID),
        out: true,
        unread: true,
        date: tsNow() / 1000,
        message: '',
        media: media,
        random_id: randomIDS,
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
      }

      message.send = function () {
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
        }, function (error) {
          toggleError(true);
        });
      };

      saveMessages([message]);
      historyStorage.pending.unshift(messageID);
      $rootScope.$broadcast('history_append', {peerID: peerID, messageID: messageID, my: true});

      message.send();
    });

    pendingByRandomID[randomIDS] = [peerID, messageID];
  }

  function forwardMessages (peerID, msgIDs) {
    msgIDs = $filter('orderBy')(msgIDs);

    return MtpApiManager.invokeApi('messages.forwardMessages', {
      peer: AppPeersManager.getInputPeerByID(peerID),
      id: msgIDs
    }).then(function (forwardResult) {
      AppUsersManager.saveApiUsers(forwardResult.users);
      AppChatsManager.saveApiChats(forwardResult.chats);

      if (ApiUpdatesManager.saveSeq(forwardResult.seq)) {
        angular.forEach(forwardResult.messages, function(apiMessage) {

          ApiUpdatesManager.saveUpdate({
            _: 'updateNewMessage',
            message: apiMessage,
            pts: forwardResult.pts
          });

        });
      }

    });
  };

  function cancelPendingMessage (randomID) {
    var pendingData = pendingByRandomID[randomID];

    console.log('pending', randomID, pendingData);

    if (pendingData) {
      var peerID = pendingData[0],
          tempID = pendingData[1],
          historyStorage = historiesStorage[peerID],
          i;

      ApiUpdatesManager.saveUpdate({
        _: 'updateDeleteMessages',
        messages: [tempID]
      });

      for (i = 0; i < historyStorage.pending.length; i++) {
        if (historyStorage.pending[i] == tempID) {
          historyStorage.pending.splice(i, 1);
          break;
        }
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
          index = false,
          message = false,
          historyMessage = false,
          i;

      // console.log('pending', randomID, historyStorage.pending);
      for (i = 0; i < historyStorage.pending.length; i++) {
        if (historyStorage.pending[i] == tempID) {
          historyStorage.pending.splice(i, 1);
          break;
        }
      }

      if (message = messagesStorage[tempID]) {
        delete message.pending;
        delete message.error;
        delete message.random_id;
        delete message.send;
      }

      if (historyMessage = messagesForHistory[tempID]) {
        messagesForHistory[finalMessage.id] = angular.extend(historyMessage, wrapForHistory(finalMessage.id));
        delete historyMessage.pending;
        delete historyMessage.error;
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
      return toID;
    }
    return message.from_id;
  }

  function wrapForDialog (msgID, unreadCount) {
    if (messagesForDialogs[msgID] !== undefined) {
      return messagesForDialogs[msgID];
    }

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

    message.dateText = $filter('dateOrTime')(message.date);


    return messagesForDialogs[msgID] = message;
  }

  function wrapForHistory (msgID) {
    if (messagesForHistory[msgID] !== undefined) {
      return messagesForHistory[msgID];
    }

    var message = angular.copy(messagesStorage[msgID]) || {id: msgID};

    if (message.media && message.media.progress !== undefined) {
      message.media.progress = messagesStorage[msgID].media.progress;
    }

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

        case 'messageMediaAudio':
          message.media.audio = AppAudioManager.wrapForHistory(message.media.audio.id);
          break;

        case 'messageMediaContact':
          message.media.rFullName = RichTextProcessor.wrapRichText(
            message.media.first_name + ' ' + (message.media.last_name || ''),
            {noLinks: true, noLinebreaks: true}
          );
          break;
      }

      if (message.media.user_id) {
        message.media.user = AppUsersManager.getUser(message.media.user_id);
        message.media.userPhoto = AppUsersManager.getUserPhoto(message.media.user_id, 'User');
      }
    }
    else if (message.action) {
      switch (message.action._) {
        case 'messageActionChatEditPhoto':
          message.action.photo = AppPhotosManager.wrapForHistory(message.action.photo.id);
          break;

        case 'messageActionChatCreate':
        case 'messageActionChatEditTitle':
          message.action.rTitle = RichTextProcessor.wrapRichText(message.action.title, {noLinks: true, noLinebreaks: true}) || 'DELETED';
          break;
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

      notificationPhoto = AppChatsManager.getChatPhoto(-peerID, 'Group');

      peerString = AppChatsManager.getChatString(-peerID);
    }

    notification.onclick = function () {
      $rootScope.$broadcast('history_focus', {peerString: peerString});
    };

    notification.message = notificationMessage;
    notification.image = notificationPhoto.placeholder;
    notification.key = 'msg' + message.id;
    notification.tag = peerString;

    if (notificationPhoto.location && !notificationPhoto.location.empty) {
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
    // if (update._ != 'updateUserStatus') {
    //   console.log('on apiUpdate', update);
    // }
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

        // console.log(11, randomID, pendingMessage);
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
          // console.log('inc unread count', dialog.unread_count);
          dialog.unread_count++;
        }
        dialog.top_message = message.id;

        // console.log('new message', message, peerID, historyStorage, foundDialog, dialog);

        SearchIndexManager.indexObject(peerID, AppPeersManager.getPeerSearchText(peerID), dialogsIndex);

        dialogsStorage.dialogs.unshift(dialog);
        $rootScope.$broadcast('dialogs_update', dialog);


        if ($rootScope.idle.isIDLE && !message.out && message.unread) {
          NotificationsManager.getPeerMuted(peerID).then(function (muted) {
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
          // console.log('read', messageID, message.unread, message);
          if (message && message.unread) {
            message.unread = false;
            if (messagesForHistory[messageID]) {
              messagesForHistory[messageID].unread = false;
            }
            if (messagesForDialogs[messageID]) {
              messagesForDialogs[messageID].unread = false;
            }
            peerID = getMessagePeer(message);
            if (!message.out) {
              foundDialog = getDialogByPeerID(peerID);
              if (foundDialog) {
                dialogsUpdated[peerID] = --foundDialog[0].unread_count;
              }

              NotificationsManager.cancel('msg' + messageID);
            }
          }
        }

        angular.forEach(dialogsUpdated, function(count, peerID) {
          $rootScope.$broadcast('dialog_unread', {peerID: peerID, count: count});
        });
        break;

      case 'updateDeleteMessages':
        var dialogsUpdated = {},
            historiesUpdated = {},
            messageID, message, i, peerID, foundDialog, dialog, history;

        for (i = 0; i < update.messages.length; i++) {
          messageID = update.messages[i];
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
              messagesForHistory[messageID].DELETED = true;
              delete messagesForHistory[messageID];
            }
            if (messagesForDialogs[messageID]) {
              messagesForDialogs[messageID].DELETED = true;
              delete messagesForDialogs[messageID];
            }
            message.DELETED = true;
            delete messagesStorage[messageID];
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
    }
  });

  return {
    getDialogs: getDialogs,
    getHistory: getHistory,
    getSearch: getSearch,
    getMessage: getMessage,
    readHistory: readHistory,
    flushHistory: flushHistory,
    deleteMessages: deleteMessages,
    saveMessages: saveMessages,
    sendText: sendText,
    sendFile: sendFile,
    sendOther: sendOther,
    forwardMessages: forwardMessages,
    getMessagePeer: getMessagePeer,
    wrapForDialog: wrapForDialog,
    wrapForHistory: wrapForHistory
  }
})

.service('AppPhotosManager', function ($modal, $window, $timeout, $rootScope, MtpApiManager, MtpApiFileManager, AppUsersManager) {
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

    // console.log('choosing', photo, width, height, bestPhotoSize);

    return bestPhotoSize;
  }

  function getUserPhotos (inputUser, maxID, limit) {
    return MtpApiManager.invokeApi('photos.getUserPhotos', {
      user_id: inputUser,
      offset: 0,
      limit: limit || 20,
      max_id: maxID || 0
    }).then(function (photosResult) {
      AppUsersManager.saveApiUsers(photosResult.users);
      var photoIDs = [];
      for (var i = 0; i < photosResult.photos.length; i++) {
        savePhoto(photosResult.photos[i]);
        photoIDs.push(photosResult.photos[i].id)
      }

      return {
        count: photosResult.count || photosResult.photos.length,
        photos: photoIDs
      };
    });
  }

  function preloadPhoto (photoID) {
    if (!photos[photoID]) {
      return;
    }
    var photo = photos[photoID],
        fullWidth = $(window).width() - 36,
        fullHeight = $($window).height() - 150,
        fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight);

    if (fullPhotoSize && !fullPhotoSize.preloaded) {
      fullPhotoSize.preloaded = true;
      if (fullPhotoSize.size) {
        MtpApiFileManager.downloadFile(fullPhotoSize.location.dc_id, {
          _: 'inputFileLocation',
          volume_id: fullPhotoSize.location.volume_id,
          local_id: fullPhotoSize.location.local_id,
          secret: fullPhotoSize.location.secret
        }, fullPhotoSize.size);
      } else {
        MtpApiFileManager.downloadSmallFile(fullPhotoSize.location);
      }
    }
  };
  $rootScope.preloadPhoto = preloadPhoto;

  function getPhoto (photoID) {
    return photos[photoID] || {_: 'photoEmpty'};
  }

  function wrapForHistory (photoID) {
    var photo = angular.copy(photos[photoID]) || {_: 'photoEmpty'},
        width = 260,
        height = 260,
        thumbPhotoSize = choosePhotoSize(photo, width, height),
        thumb = {
          placeholder: 'img/placeholders/PhotoThumbConversation.gif',
          width: width,
          height: height
        };

    // console.log('chosen photo size', photoID, thumbPhotoSize);
    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      if (thumbPhotoSize.w > thumbPhotoSize.h) {
        thumb.height = parseInt(thumbPhotoSize.h * width / thumbPhotoSize.w);
      } else {
        thumb.width = parseInt(thumbPhotoSize.w * height / thumbPhotoSize.h);
      }

      thumb.location = thumbPhotoSize.location;
      thumb.size = thumbPhotoSize.size;
    } else {
      thumb.width = 100;
      thumb.height = 100;
    }

    photo.thumb = thumb;

    return photo;
  }

  function wrapForFull (photoID) {
    var photo = wrapForHistory(photoID),
        fullWidth = $(window).width() - 36,
        fullHeight = $($window).height() - 150,
        fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight),
        full = {
          placeholder: 'img/placeholders/PhotoThumbModal.gif'
        };

    if (fullWidth > 800) {
      fullWidth -= 200;
    }

    full.width = fullWidth;
    full.height = fullHeight;

    if (fullPhotoSize && fullPhotoSize._ != 'photoSizeEmpty') {
      if ((fullPhotoSize.w / fullPhotoSize.h) > (fullWidth / fullHeight)) {
        full.height = parseInt(fullPhotoSize.h * fullWidth / fullPhotoSize.w);
      }
      else {
        full.width = parseInt(fullPhotoSize.w * fullHeight / fullPhotoSize.h);
        if (full.width > fullWidth) {
          full.height = parseInt(full.height * fullWidth / full.width);
          full.width = fullWidth;
        }
      }

      if (full.width >= fullPhotoSize.w && full.height >= fullPhotoSize.h) {
        full.width = fullPhotoSize.w;
        full.height = fullPhotoSize.h;
      }

      full.modalWidth = Math.max(full.width, Math.min(400, fullWidth));

      full.location = fullPhotoSize.location;
      full.size = fullPhotoSize.size;
    }

    photo.full = full;
    photo.fromUser = AppUsersManager.getUser(photo.user_id);

    return photo;
  }

  function openPhoto (photoID, peerListID) {
    if (!photoID || photoID === '0') {
      return false;
    }

    var scope = $rootScope.$new(true);

    scope.photoID = photoID;
    if (peerListID < 0) {
      scope.userID = -peerListID;
    } else{
      scope.messageID = peerListID;
    }

    var modalInstance = $modal.open({
      templateUrl: 'partials/photo_modal.html',
      controller: scope.userID ? 'UserpicModalController' : 'PhotoModalController',
      scope: scope,
      windowClass: 'photo_modal_window'
    });
  }

  function downloadPhoto (photoID) {
    var photo = photos[photoID],
        ext = 'jpg',
        mimeType = 'image/jpeg',
        fileName = 'photo' + photoID + '.' + ext,
        fullWidth = $(window).width() - 36,
        fullHeight = $($window).height() - 150,
        fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight),
        inputFileLocation = {
          _: 'inputFileLocation',
          volume_id: fullPhotoSize.location.volume_id,
          local_id: fullPhotoSize.location.local_id,
          secret: fullPhotoSize.location.secret
        };

    if (window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry) {

      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: fileName,
        accepts: [{
          mimeTypes: [mimeType],
          extensions: [ext]
        }]
      }, function (writableFileEntry) {
        var downloadPromise = MtpApiFileManager.downloadFile(fullPhotoSize.location.dc_id, inputFileLocation, fullPhotoSize.size, {
          mime: mimeType,
          toFileEntry: writableFileEntry
        });
        downloadPromise.then(function (url) {
          console.log('file save done');
        }, function (e) {
          console.log('photo download failed', e);
        });

      });
    } else {
      var downloadPromise = MtpApiFileManager.downloadFile(fullPhotoSize.location.dc_id, inputFileLocation, fullPhotoSize.size, {mime: mimeType});

      downloadPromise.then(function (url) {

        var a = $('<a>Download</a>')
                  .css({position: 'absolute', top: 1, left: 1})
                  .attr('href', url)
                  .attr('target', '_blank')
                  .attr('download', fileName)
                  .appendTo('body');

        a[0].dataset.downloadurl = [mimeType, fileName, url].join(':');
        a[0].click();
        $timeout(function () {
          a.remove();
        }, 100);
      }, function (e) {
        console.log('photo download failed', e);
      });
    }
  };

  $rootScope.openPhoto = openPhoto;


  return {
    savePhoto: savePhoto,
    preloadPhoto: preloadPhoto,
    getUserPhotos: getUserPhotos,
    getPhoto: getPhoto,
    wrapForHistory: wrapForHistory,
    wrapForFull: wrapForFull,
    openPhoto: openPhoto,
    downloadPhoto: downloadPhoto
  }
})


.service('AppVideoManager', function ($rootScope, $modal, $window, $timeout, MtpApiFileManager, AppUsersManager) {
  var videos = {};
  var videosForHistory = {};

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
    if (videosForHistory[videoID] !== undefined) {
      return videosForHistory[videoID];
    }

    var video = angular.copy(videos[videoID]),
        width = 200,
        height = 200,
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

    return videosForHistory[videoID] = video;
  }

  function wrapForFull (videoID) {
    var video = wrapForHistory(videoID),
        fullWidth = Math.min($(window).width() - 60, 542),
        fullHeight = $($window).height() - 150,
        fullPhotoSize = video,
        full = {
          placeholder: 'img/placeholders/VideoThumbModal.gif',
          width: fullWidth,
          height: fullHeight,
        };

    if (!video.w || !video.h) {
      full.height = full.width = Math.min(fullWidth, fullHeight);
    }
    else if (video.w > video.h) {
      full.height = parseInt(video.h * fullWidth / video.w);
    }
    else {
      full.width = parseInt(video.w * fullHeight / video.h);
      if (full.width > fullWidth) {
        full.height = parseInt(full.height * fullWidth / full.width);
        full.width = fullWidth;
      }
    }
    // console.log(222, video.w, video.h, full.width, full.height);

    video.full = full;
    video.fullThumb = angular.copy(video.thumb);
    video.fullThumb.width = full.width;
    video.fullThumb.height = full.height;
    video.fromUser = AppUsersManager.getUser(video.user_id);

    return video;
  }

  function openVideo (videoID, messageID) {
    var scope = $rootScope.$new(true);
    scope.videoID = videoID;
    scope.messageID = messageID;

    var modalInstance = $modal.open({
      templateUrl: 'partials/video_modal.html',
      controller: 'VideoModalController',
      scope: scope
    });
  }

  function downloadVideo (videoID, accessHash, popup) {
    var video = videos[videoID],
        historyVideo = videosForHistory[videoID] || video || {},
        inputFileLocation = {
          _: 'inputVideoFileLocation',
          id: videoID,
          access_hash: accessHash || video.access_hash
        };

    historyVideo.progress = {enabled: true, percent: 1, total: video.size};

    function updateDownloadProgress (progress) {
      console.log('dl progress', progress);
      historyVideo.progress.done = progress.done;
      historyVideo.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      $rootScope.$broadcast('history_update');
    }

    var ext = 'mp4',
        mimeType = 'video/mpeg4',
        fileName = 'video' + videoID + '.' + ext;

    if (window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry) {

      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: fileName,
        accepts: [{
          mimeTypes: [mimeType],
          extensions: [ext]
        }]
      }, function (writableFileEntry) {
        var downloadPromise = MtpApiFileManager.downloadFile(video.dc_id, inputFileLocation, video.size, {
          mime: mimeType,
          toFileEntry: writableFileEntry
        });
        downloadPromise.then(function (url) {
          delete historyVideo.progress;
          console.log('file save done');
        }, function (e) {
          console.log('video download failed', e);
          historyVideo.progress.enabled = false;
        }, updateDownloadProgress);

        historyVideo.progress.cancel = downloadPromise.cancel;
      });
    } else {
      var downloadPromise = MtpApiFileManager.downloadFile(video.dc_id, inputFileLocation, video.size, {mime: mimeType});

      downloadPromise.then(function (url) {
        delete historyVideo.progress;

        if (popup) {
          window.open(url, '_blank');
          return
        }

        var a = $('<a>Download</a>')
                  .css({position: 'absolute', top: 1, left: 1})
                  .attr('href', url)
                  .attr('target', '_blank')
                  .attr('download', fileName)
                  .appendTo('body');

        a[0].dataset.downloadurl = [mimeType, fileName, url].join(':');
        a[0].click();
        $timeout(function () {
          a.remove();
        }, 100);
      }, function (e) {
        console.log('video download failed', e);
        historyVideo.progress.enabled = false;
      }, updateDownloadProgress);

      historyVideo.progress.cancel = downloadPromise.cancel;
    }
  };

  $rootScope.openVideo = openVideo;
  $rootScope.downloadVideo = downloadVideo;

  return {
    saveVideo: saveVideo,
    wrapForHistory: wrapForHistory,
    wrapForFull: wrapForFull,
    openVideo: openVideo
  }
})

.service('AppDocsManager', function ($rootScope, $modal, $window, $timeout, MtpApiFileManager) {
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
        isGif = doc.mime_type == 'image/gif',
        width = isGif ? 260 : 100,
        height = isGif ? 260 : 100,
        thumbPhotoSize = doc.thumb,
        thumb = {
          // placeholder: 'img/placeholders/DocThumbConversation.jpg',
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

    doc.canDownload = !(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry);
    doc.withPreview = doc.canDownload && doc.mime_type.match(/^(image\/|application\/pdf)/) ? 1 : 0;

    if (isGif) {
      doc.isSpecial = 'gif';
    }

    return docsForHistory[docID] = doc;
  }

  function downloadDoc (docID, action) {
    var doc = docs[docID],
        historyDoc = docsForHistory[docID] || doc || {},
        inputFileLocation = {
          _: 'inputDocumentFileLocation',
          id: docID,
          access_hash: doc.access_hash
        };

    historyDoc.progress = {enabled: true, percent: 1, total: doc.size};

    function updateDownloadProgress (progress) {
      console.log('dl progress', progress);
      historyDoc.progress.done = progress.done;
      historyDoc.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      $rootScope.$broadcast('history_update');
    }


    if (window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry) {
      var ext = (doc.file_name.split('.', 2) || [])[1] || '';

      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: doc.file_name,
        accepts: [{
          mimeTypes: [doc.mime_type],
          extensions: [ext]
        }]
      }, function (writableFileEntry) {
        var downloadPromise = MtpApiFileManager.downloadFile(doc.dc_id, inputFileLocation, doc.size, {
          mime: doc.mime_type,
          toFileEntry: writableFileEntry
        });

        downloadPromise.then(function (url) {
          delete historyDoc.progress;
          console.log('file save done');
        }, function (e) {
          console.log('document download failed', e);
          historyDoc.progress.enabled = false;
        }, updateDownloadProgress);

        historyDoc.progress.cancel = downloadPromise.cancel;
      });
    } else {
      var downloadPromise = MtpApiFileManager.downloadFile(doc.dc_id, inputFileLocation, doc.size, {mime: doc.mime_type});

      downloadPromise.then(function (url) {
        delete historyDoc.progress;

        historyDoc.url = url;

        switch (action) {
          case 1:
            window.open(url, '_blank');
            break;

          default:
            var a = $('<a>Download</a>')
                      .css({position: 'absolute', top: 1, left: 1})
                      .attr('href', url)
                      .attr('target', '_blank')
                      .attr('download', doc.file_name)
                      .appendTo('body');

            a[0].dataset.downloadurl = [doc.mime_type, doc.file_name, url].join(':');
            a[0].click();
            $timeout(function () {
              a.remove();
            }, 100);
        }
      }, function (e) {
        console.log('document download failed', e);
        historyDoc.progress.enabled = false;
      }, updateDownloadProgress);

      historyDoc.progress.cancel = downloadPromise.cancel;
    }
  }

  $rootScope.downloadDoc = downloadDoc;

  return {
    saveDoc: saveDoc,
    wrapForHistory: wrapForHistory,
    downloadDoc: downloadDoc
  }
})

.service('AppAudioManager', function ($rootScope, $modal, $window, $timeout, $sce, MtpApiFileManager) {
  var audios = {};
  var audiosForHistory = {};

  function saveAudio (apiAudio) {
    audios[apiAudio.id] = apiAudio;
  };

  function wrapForHistory (audioID) {
    if (audiosForHistory[audioID] !== undefined) {
      return audiosForHistory[audioID];
    }

    var audio = angular.copy(audios[audioID]);

    return audiosForHistory[audioID] = audio;
  }

  function openAudio (audioID, accessHash) {
    var audio = audios[audioID],
        historyAudio = audiosForHistory[audioID] || audio || {},
        inputFileLocation = {
          _: 'inputAudioFileLocation',
          id: audioID,
          access_hash: accessHash || audio.access_hash
        };

    historyAudio.progress = {enabled: true, percent: 1, total: audio.size};

    function updateDownloadProgress (progress) {
      console.log('dl progress', progress);
      historyAudio.progress.done = progress.done;
      historyAudio.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      $rootScope.$broadcast('history_update');
    }

    var downloadPromise = MtpApiFileManager.downloadFile(audio.dc_id, inputFileLocation, audio.size, {mime: 'audio/ogg'});

    downloadPromise.then(function (url) {
      delete historyAudio.progress;
      historyAudio.url = $sce.trustAsResourceUrl(url);
      historyAudio.autoplay = true;
      $timeout(function () {
        console.log('disable autoplay');
        delete historyAudio.autoplay;
        $rootScope.$broadcast('history_update');
      }, 1000);
    }, function (e) {
      console.log('audio download failed', e);
      historyAudio.progress.enabled = false;
    }, updateDownloadProgress);

    historyAudio.progress.cancel = downloadPromise.cancel;
  }

  $rootScope.openAudio = openAudio;

  return {
    saveAudio: saveAudio,
    wrapForHistory: wrapForHistory,
    openAudio: openAudio
  }
})

.service('ExternalResourcesManager', function ($q, $http) {
  var urlPromises = {};

  function downloadImage (url) {
    if (urlPromises[url] !== undefined) {
      return urlPromises[url];
    }

    return urlPromises[url] = $http.get(url, {responseType: 'blob', transformRequest: null})
      .then(function (response) {
        window.URL = window.URL || window.webkitURL;
        return window.URL.createObjectURL(response.data);
      });
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
                console.log('User not found', message.from_id, 'getDiff');
                getDifference();
                return false;
              }
              if (message.to_id.chat_id && !AppChatsManager.hasChat(message.to_id.chat_id)) {
                console.log('Chat not found', message.to_id.chat_id, 'getDiff');
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
          console.log('User not found', updateMessage.from_id, 'getDiff');
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
          console.log('User or chat not found', updateMessage.from_id, updateMessage.chat_id, 'getDiff');
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
    // console.log('saving seq', curState.invalid, seq, seqStart, curState.seq);

    if (curState.invalid) {
      return false;
    }

    seqStart = seqStart || seq;

    if (!seqStart) {
      return true;
    }

    if (seqStart != curState.seq + 1) {
      if (seqStart > curState.seq) {
        console.warn('Seq hole', seqStart, curState.seq);
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
      emojiIconSize = 18,
      emojiCode;

  for (emojiCode in emojiData) {
    emojiUtf.push(emojiData[emojiCode][0]);
    emojiMap[emojiData[emojiCode][0]] = emojiCode;
  }

  var regExp = new RegExp('((?:(ftp|https?)://|(?:mailto:)?([A-Za-z0-9._%+-]+@))(\\S*\\.\\S*[^\\s.;,(){}<>"\']))|(\\n)|(' + emojiUtf.join('|') + ')', 'i');
  var youtubeRegex = /(?:https?:\/\/)?(?:www\.)?youtu(?:|.be|be.com|.b)(?:\/v\/|\/watch\\?v=|e\/|\/watch(?:.+)v=)(.{11})(?:\&[^\s]*)?/;

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
  }

  function getEmojiSpritesheetCoords(emojiCode) {
    var i, row, column, totalColumns;
    for (var cat = 0; cat < Config.EmojiCategories.length; cat++) {
      totalColumns = Config.EmojiCategorySpritesheetDimens[cat][1];
      i = Config.EmojiCategories[cat].indexOf(emojiCode);
      if (i > -1) {
        row = Math.floor(i / totalColumns);
        column = (i % totalColumns);
        return { category: cat, row: row, column: column };
      }
    }
    console.error('emoji not found in spritesheet', emojiCode);
    return null;
  }

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
        emojiFound = false,
        emojiTitle,
        emojiCoords;

    while ((match = raw.match(regExp))) {
      // console.log(2, match);
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
              encodeEntities(match[2] + '://' + match[4]),
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

        if ((emojiCode = emojiMap[match[6]]) &&
            (emojiCoords = getEmojiSpritesheetCoords(emojiCode))) {

          emojiTitle = encodeEntities(emojiData[emojiCode][1][0]);
          emojiFound = true;
          html.push(
            '<span class="emoji emoji-',
            emojiCoords.category,
            '-',
            (emojiIconSize * emojiCoords.column),
            '-',
            (emojiIconSize * emojiCoords.row),
            '" ',
            'title="',emojiTitle, '">',
            ':', emojiTitle, ':</span>'
          );
        } else {
          html.push(encodeEntities(match[6]));
        }
      }
      raw = raw.substr(match.index + match[0].length);
    }

    html.push(encodeEntities(raw));

    text = $sanitize(html.join(''));

    // console.log(3, text, html);

    if (emojiFound) {
      text = text.replace(/<span class="emoji emoji-(\d)-(\d+)-(\d+)"(.+?)<\/span>/g,
                          '<span class="emoji emoji-spritesheet-$1" style="background-position: -$2px -$3px;" $4</span>');
    }

    // console.log(4, text, html);
    if (!options.noLinks) {
      var youtubeMatches = text.match(youtubeRegex),
          videoID = youtubeMatches && youtubeMatches[1];

      if (videoID) {
        text = text + '<div class="im_message_iframe_video"><iframe type="text/html" frameborder="0" ' +
              'src="http://www.youtube.com/embed/' + videoID +
              '?autoplay=0&amp;controls=2"></iframe></div>'
      }
    }

    return $sce.trustAs('html', text);
  }

})


.service('IdleManager', function ($rootScope, $window, $timeout) {

  $rootScope.idle = {isIDLE: false};

  var toPromise, started = false;

  return {
    start: start
  };

  function start () {
    if (!started) {
      started = true;
      $($window).on('blur focus keydown mousedown touchstart', onEvent);
    }
  }

  function onEvent (e) {
    // console.log('event', e.type);
    if (e.type == 'mousemove') {
      $($window).off('mousemove', onEvent);
    }
    var isIDLE = e.type == 'blur' || e.type == 'timeout' ? true : false;

    $timeout.cancel(toPromise);
    if (!isIDLE) {
      // console.log('update timeout');
      toPromise = $timeout(function () {
        onEvent({type: 'timeout'});
      }, 30000);
    }

    if ($rootScope.idle.isIDLE == isIDLE) {
      return;
    }

    // console.log('IDLE changed', isIDLE);
    $rootScope.$apply(function () {
      $rootScope.idle.isIDLE = isIDLE;
    });

    if (isIDLE && e.type == 'timeout') {
      $($window).on('mousemove', onEvent);
    }
  }
})

.service('StatusManager', function ($timeout, $rootScope, MtpApiManager, IdleManager) {

  var toPromise, lastOnlineUpdated = 0, started = false;

  return {
    start: start
  };

  function start() {
    if (!started) {
      started = true;
      $rootScope.$watch('idle.isIDLE', checkIDLE);
      $rootScope.$watch('offline', checkIDLE);
    }
  }

  function sendUpdateStatusReq(offline) {
    var date = tsNow();
    if (offline && !lastOnlineUpdated ||
        !offline && (date - lastOnlineUpdated) < 50000 ||
        $rootScope.offline) {
      return;
    }
    lastOnlineUpdated = offline ? 0 : date;
    return MtpApiManager.invokeApi('account.updateStatus', {
      offline: offline
    }, {noErrorBox: true});
  }

  function checkIDLE() {
    toPromise && $timeout.cancel(toPromise);
    if ($rootScope.idle.isIDLE) {
      toPromise = $timeout(function () {
        sendUpdateStatusReq(true);
      }, 5000);
    } else {
      sendUpdateStatusReq(false);
      toPromise = $timeout(checkIDLE, 60000);
    }
  }

})

.service('NotificationsManager', function ($rootScope, $window, $timeout, $interval, $q, MtpApiManager, AppPeersManager, IdleManager, AppConfigManager) {

  var notificationsUiSupport = 'Notification' in window;
  var notificationsShown = {};
  // var lastClosed = [];
  var notificationIndex = 0;
  var notificationsCount = 0;
  var peerSettings = {};
  var faviconBackupEl = $('link[rel="icon"]'),
      faviconNewEl = $('<link rel="icon" href="favicon_unread.ico" type="image/x-icon" />');

  var titleBackup = document.title,
      titlePromise;

  $rootScope.$watch('idle.isIDLE', function (newVal) {
    // console.log('isIDLE watch', newVal);
    $interval.cancel(titlePromise);

    if (!newVal) {
      notificationsCount = 0;
      document.title = titleBackup;
      $('link[rel="icon"]').replaceWith(faviconBackupEl);
      notificationsClear();
    } else {
      titleBackup = document.title;

      titlePromise = $interval(function () {
        var time = tsNow();
        if (!notificationsCount || time % 2000 > 1000) {
          document.title = titleBackup;
          $('link[rel="icon"]').replaceWith(faviconBackupEl);
        } else {
          document.title = notificationsCount > 1
            ? (notificationsCount + ' notifications')
            : '1 notification';

          $('link[rel="icon"]').replaceWith(faviconNewEl);
        }
      }, 1000);
    }
  });

  $rootScope.$on('apiUpdate', function (e, update) {
    // console.log('on apiUpdate', update);
    switch (update._) {
      case 'updateNotifySettings':
        if (update.peer._ == 'notifyPeer') {
          var peerID = AppPeersManager.getPeerID(update.peer.peer);
          savePeerSettings(peerID, update.notify_settings);
        }
        break;
    }
  });

  return {
    start: start,
    notify: notify,
    cancel: notificationCancel,
    clear: notificationsClear,
    getPeerSettings: getPeerSettings,
    getPeerMuted: getPeerMuted,
    savePeerSettings: savePeerSettings,
    updatePeerSettings: updatePeerSettings,
    testSound: playSound
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
    });
  }

  function savePeerSettings (peerID, settings) {
    // console.trace(dT(), 'peer settings', peerID, settings);
    peerSettings[peerID] = $q.when(settings);
  }

  function updatePeerSettings (peerID, settings) {
    savePeerSettings(peerID, settings);

    var inputSettings = angular.copy(settings);
    inputSettings._ = 'inputPeerNotifySettings';

    return MtpApiManager.invokeApi('account.updateNotifySettings', {
      peer: {
        _: 'inputNotifyPeer',
        peer: AppPeersManager.getInputPeerByID(peerID)
      },
      settings: inputSettings
    });
  }

  function getPeerMuted (peerID) {
    return getPeerSettings(peerID).then(function (peerNotifySettings) {
      return peerNotifySettings._ == 'peerNotifySettings' &&
             peerNotifySettings.mute_until * 1000 > tsNow();
    });
  }

  function start () {
    if (!notificationsUiSupport) {
      return false;
    }

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      $($window).on('click', requestPermission);
    }


    try {
      $($window).on('beforeunload', notificationsClear);
    } catch (e) {}
  }

  function requestPermission() {
    Notification.requestPermission();
    $($window).off('click', requestPermission);
  }

  function notify (data) {
    // console.log('notify', $rootScope.idle.isIDLE, notificationsUiSupport);
    if (!$rootScope.idle.isIDLE) {
      return false;
    }

    notificationsCount++;

    if (!notificationsUiSupport ||
        Notification.permission !== 'granted') {
      return false;
    }

    AppConfigManager.get('notify_nosound', 'notify_volume').then(function (settings) {
      if (!settings[0] && settings[1] === false || settings[1] > 0) {
        playSound(settings[1] || 0.5);
      }
    })

    AppConfigManager.get('notify_nodesktop').then(function (noShow) {
      if (noShow) {
        return;
      }
      var idx = ++notificationIndex,
          key = data.key || 'k' + idx;

      var notification = new Notification(data.title, {
        icon: data.image || '',
        body: data.message || '',
        tag: data.tag || ''
      });

      notification.onclick = function () {
        notification.close();
        if (window.chrome && chrome.app && chrome.app.window) {
          chrome.app.window.current().focus();
        }
        window.focus();
        notificationsClear();
        if (data.onclick) {
          data.onclick();
        }
      };

      notification.onclose = function () {
        delete notificationsShown[key];
        // lastClosed.push(tsNow());
        notificationsClear();
      };

      notificationsShown[key] = notification;
    });
  };

  function playSound (volume) {
    var filename = 'img/sound_a.wav';
    var obj = $('#notify_sound').html('<audio autoplay="autoplay">' +
        '<source src="' + filename + '" type="audio/mpeg" />' +
        '<embed hidden="true" autostart="true" loop="false" volume="' + (volume * 100) +'" src="' + filename +'" />' +
        '</audio>');
    obj.find('audio')[0].volume = volume;
  }

  function notificationCancel (key) {
    var notification = notificationsShown[key];
    if (notification) {
      try {
        if (notification.close) {
          notification.close();
        }
      } catch (e) {}
    }
  }

  function notificationsClear() {
    angular.forEach(notificationsShown, function (notification) {
      try {
        if (notification.close) {
          notification.close()
        }
      } catch (e) {}
    });
    notificationsShown = {};
  }
})


.service('ErrorService', function ($rootScope, $modal, $window) {

  var shownBoxes = 0;

  function show (params, options) {
    if (shownBoxes >= 2) {
      console.log('Skip error box, too many open', shownBoxes, params, options);
      return false;
    }

    options = options || {};
    var scope = $rootScope.$new();
    angular.extend(scope, params);

    shownBoxes++;
    var modal = $modal.open({
      templateUrl: 'partials/error_modal.html',
      scope: scope,
      windowClass: options.windowClass || 'error_modal_window'
    });

    modal.result['finally'](function () {
      shownBoxes--;
    });

    return modal;
  }

  function alert (title, description) {
    return show ({
      title: title,
      description: description
    });
  };

  function confirm (params, options) {
    options = options || {};
    var scope = $rootScope.$new();
    angular.extend(scope, params);

    var modal = $modal.open({
      templateUrl: 'partials/confirm_modal.html',
      scope: scope,
      windowClass: options.windowClass || 'confirm_modal_window'
    });

    return modal.result;
  };

  $window.safeConfirm = function (params, callback) {
    if (typeof params === 'string') {
      params = {message: params};
    }
    confirm(params).then(function (result) {
      callback(result || true)
    }, function () {
      callback(false)
    });
  };

  return {
    show: show,
    alert: alert,
    confirm: confirm
  }
})



.service('PeersSelectService', function ($rootScope, $modal) {

  function selectPeer (options) {
    var scope = $rootScope.$new();
    if (options) {
      angular.extend(scope, options);
    }

    return $modal.open({
      templateUrl: 'partials/peer_select.html',
      controller: 'PeerSelectController',
      scope: scope,
      windowClass: 'peer_select_window'
    }).result;
  }


  return {
    selectPeer: selectPeer
  }
})


.service('ContactsSelectService', function ($rootScope, $modal) {

  function select (multiSelect, options) {
    options = options || {};

    var scope = $rootScope.$new();
    scope.multiSelect = multiSelect;
    angular.extend(scope, options);

    return $modal.open({
      templateUrl: 'partials/contacts_modal.html',
      controller: 'ContactsModalController',
      scope: scope,
      windowClass: 'contacts_modal_window'
    }).result;
  }


  return {
    selectContacts: function (options) {
      return select (true, options);
    },
    selectContact: function (options) {
      return select (false, options);
    },
  }
})


.service('ChangelogNotifyService', function (AppConfigManager, $rootScope, $http, $modal) {

  function versionCompare (ver1, ver2) {
    if (typeof ver1 !== 'string') {
      ver1 = '';
    }
    if (typeof ver2 !== 'string') {
      ver2 = '';
    }
    // console.log('ss', ver1, ver2);
    ver1 = ver1.replace(/^\s+|\s+$/g, '').split('.');
    ver2 = ver2.replace(/^\s+|\s+$/g, '').split('.');

    var a = Math.max(ver1.length, ver2.length), i;

    for (i = 0; i < a; i++) {
      if (ver1[i] == ver2[i]) {
        continue;
      }
      if (ver1[i] > ver2[i]) {
        return 1;
      } else {
        return -1;
      }
    }

    return 0;
  }

  function checkUpdate () {
    AppConfigManager.get('last_version').then(function (lastVersion) {
      if (lastVersion != Config.App.version) {
        showChangelog(lastVersion || '0');
        AppConfigManager.set({last_version: Config.App.version});
      }
    })
  }

  function showChangelog (lastVersion) {
    var $scope = $rootScope.$new();

    $scope.lastVersion = lastVersion;
    $scope.canShowVersion = function (curVersion) {
      if ($scope.lastVersion === false || $scope.lastVersion === undefined) {
        return true;
      }

      return versionCompare(curVersion, lastVersion) > 0;
    };

    $modal.open({
      templateUrl: 'partials/changelog_modal.html',
      scope: $scope,
      windowClass: 'changelog_modal_window'
    });
  }

  return {
    checkUpdate: checkUpdate,
    showChangelog: showChangelog
  }
})
