/*!
 * Webogram v0.4.2 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Services */

angular.module('myApp.services', ['myApp.i18n', 'izhukov.utils'])

.service('AppUsersManager', function ($rootScope, $modal, $modalStack, $filter, $q, qSync, MtpApiFileManager, MtpApiManager, RichTextProcessor, ErrorService, Storage, _) {
  var users = {},
      usernames = {},
      cachedPhotoLocations = {},
      contactsFillPromise,
      contactsList,
      contactsIndex = SearchIndexManager.createIndex(),
      myID,
      serverTimeOffset = 0;

  Storage.get('server_time_offset').then(function (to) {
    if (to) {
      serverTimeOffset = to;
    }
  });
  MtpApiManager.getUserID().then(function (id) {
    myID = id;
  });

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

    return (user.first_name || '') + ' ' + (user.last_name || '') + ' ' + (user.phone || '') + ' ' + (user.username || '');
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

  function userNameClean (username) {
    return username && username.toLowerCase() || '';
  }

  function resolveUsername (username) {
    var searchUserName = userNameClean(username);
    var foundUserID = usernames[searchUserName];
    if (foundUserID &&
        userNameClean(users[foundUserID].username) == searchUserName) {
      return qSync.when(foundUserID);
    }
    return MtpApiManager.invokeApi('contacts.resolveUsername', {username: username}).then(function (resolveResult) {
      saveApiUser(resolveResult);
      return resolveResult.id;
    });
  }

  function saveApiUsers (apiUsers) {
    angular.forEach(apiUsers, saveApiUser);
  };

  function saveApiUser (apiUser, noReplace) {
    if (!angular.isObject(apiUser) ||
        noReplace && angular.isObject(users[apiUser.id]) && users[apiUser.id].first_name) {
      return;
    }

    var userID = apiUser.id;

    if (apiUser.phone) {
      apiUser.rPhone = $filter('phoneNumber')(apiUser.phone);
    }

    apiUser.num = (Math.abs(userID) % 8) + 1;

    if (apiUser.first_name) {
      apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.first_name, {noLinks: true, noLinebreaks: true});
      apiUser.rFullName = apiUser.last_name ? RichTextProcessor.wrapRichText(apiUser.first_name + ' ' + (apiUser.last_name || ''), {noLinks: true, noLinebreaks: true}) : apiUser.rFirstName;
    } else {
      apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || apiUser.rPhone || _('user_first_name_deleted');
      apiUser.rFullName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || apiUser.rPhone || _('user_name_deleted');
    }

    if (apiUser.username) {
      usernames[userNameClean(apiUser.username)] = userID;
    }

    apiUser.sortName = SearchIndexManager.cleanSearchText(apiUser.first_name + ' ' + (apiUser.last_name || ''));

    var nameWords = apiUser.sortName.split(' ');
    var firstWord = nameWords.shift();
    var lastWord = nameWords.pop();
    apiUser.initials = firstWord.charAt(0) + (lastWord ? lastWord.charAt(0) : firstWord.charAt(1));

    apiUser.sortStatus = getUserStatusForSort(apiUser.status);


    var result = users[userID];
    if (result === undefined) {
      result = users[userID] = apiUser;
    } else {
      safeReplaceObject(result, apiUser);
    }
    $rootScope.$broadcast('user_update', userID);

    if (cachedPhotoLocations[userID] !== undefined) {
      safeReplaceObject(cachedPhotoLocations[userID], apiUser && apiUser.photo && apiUser.photo.photo_small || {empty: true});
    }
  };

  function getUserStatusForSort(status) {
    if (status) {
      var expires = status.expires || status.was_online;
      if (expires) {
        return expires;
      }
      var timeNow = tsNow(true) + serverTimeOffset;
      switch (status._) {
        case 'userStatusRecently':
          return tsNow(true) + serverTimeOffset - 86400 * 3;
        case 'userStatusLastWeek':
          return tsNow(true) + serverTimeOffset - 86400 * 7;
          case 'userStatusLastMonth':
          return tsNow(true) + serverTimeOffset - 86400 * 30;
      }
    }

    return 0;
  }

  function getUser (id) {
    if (angular.isObject(id)) {
      return id;
    }
    return users[id] || {id: id, deleted: true, num: 1};
  }

  function getSelf() {
    return getUser(myID);
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

    return {
      num: user.num,
      placeholder: 'img/placeholders/' + placeholder + 'Avatar' + user.num + '@2x.png',
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

  function updateUsersStatuses () {
    var timestampNow = tsNow(true) + serverTimeOffset;
    angular.forEach(users, function (user) {
      if (user.status &&
          user.status._ == 'userStatusOnline' &&
          user.status.expires < timestampNow) {
        user.status = user.status.wasStatus ||
                      {_: 'userStatusOffline', was_online: user.status.expires};
        delete user.status.wasStatus;
        $rootScope.$broadcast('user_update', user.id);
      }
    });
  }

  function forceUserOnline (id) {
    var user = getUser(id);
    if (user &&
        user.status &&
        user.status._ != 'userStatusOnline' &&
        user.status._ != 'userStatusEmpty') {

      var wasStatus;
      if (user.status._ != 'userStatusOffline') {
        delete user.status.wasStatus;
        wasStatus != angular.copy(user.status);
      }
      user.status = {
        _: 'userStatusOnline',
        expires: tsNow(true) + serverTimeOffset + 60,
        wasStatus: wasStatus
      };
      user.sortStatus = getUserStatusForSort(user.status);
      $rootScope.$broadcast('user_update', id);
    }
  }

  function wrapForFull (id) {
    var user = getUser(id);

    return user;
  }

  function openUser (userID, override) {
    var scope = $rootScope.$new();
    scope.userID = userID;
    scope.override = override || {};

    var modalInstance = $modal.open({
      templateUrl: templateUrl('user_modal'),
      controller: 'UserModalController',
      scope: scope,
      windowClass: 'user_modal_window mobile_modal'
    });
  };

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

      return foundUserID || false;
    });
  };

  function importContacts (contacts) {
    var inputContacts = [],
        i, j;

    for (i = 0; i < contacts.length; i++) {
      for (j = 0; j < contacts[i].phones.length; j++) {
        inputContacts.push({
          _: 'inputPhoneContact',
          client_id: (i << 16 | j).toString(10),
          phone: contacts[i].phones[j],
          first_name: contacts[i].first_name,
          last_name: contacts[i].last_name
        });
      }
    }

    return MtpApiManager.invokeApi('contacts.importContacts', {
      contacts: inputContacts,
      replace: false
    }).then(function (importedContactsResult) {
      saveApiUsers(importedContactsResult.users);

      var result = [];
      angular.forEach(importedContactsResult.imported, function (importedContact) {
        onContactUpdated(importedContact.user_id, true);
        result.push(importedContact.user_id);
      });

      return result;
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
      var curPos = curIsContact = contactsList.indexOf(parseInt(userID)),
          curIsContact = curPos != -1;

      if (isContact != curIsContact) {
        if (isContact) {
          contactsList.push(userID);
          SearchIndexManager.indexObject(userID, getUserSearchText(userID), contactsIndex);
        } else {
          contactsList.splice(curPos, 1);
        }
        $rootScope.$broadcast('contacts_update', userID);
      }
    }
  }

  function openImportContact () {
    return $modal.open({
      templateUrl: templateUrl('import_contact_modal'),
      controller: 'ImportContactModalController',
      windowClass: 'md_simple_modal_window mobile_modal'
    }).result.then(function (foundUserID) {
      if (!foundUserID) {
        return $q.reject();
      }
      return foundUserID;
    });
  };

  function setUserStatus (userID, offline) {
    var user = users[userID];
    if (user) {
      var status = offline ? {
          _: 'userStatusOffline',
          was_online: tsNow(true) + serverTimeOffset
        } : {
          _: 'userStatusOnline',
          expires: tsNow(true) + serverTimeOffset + 500
        };

      user.status = status;
      user.sortStatus = getUserStatusForSort(user.status);
      $rootScope.$broadcast('user_update', userID);
    }
  }


  $rootScope.$on('apiUpdate', function (e, update) {
    // console.log('on apiUpdate', update);
    switch (update._) {
      case 'updateUserStatus':
        var userID = update.user_id,
            user = users[userID];
        if (user) {
          user.status = update.status;
          user.sortStatus = getUserStatusForSort(user.status);
          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updateUserPhoto':
        var userID = update.user_id;
        if (users[userID]) {
          forceUserOnline(userID);
          safeReplaceObject(users[userID].photo, update.photo);

          if (cachedPhotoLocations[userID] !== undefined) {
            safeReplaceObject(cachedPhotoLocations[userID], update.photo && update.photo.photo_small || {empty: true});
          }

          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updateContactLink':
        onContactUpdated(update.user_id, update.my_link._ == 'contactLinkContact');
        break;
    }
  });

  setInterval(updateUsersStatuses, 60000);


  return {
    getContacts: getContacts,
    saveApiUsers: saveApiUsers,
    saveApiUser: saveApiUser,
    getUser: getUser,
    getSelf: getSelf,
    getUserInput: getUserInput,
    setUserStatus: setUserStatus,
    forceUserOnline: forceUserOnline,
    getUserPhoto: getUserPhoto,
    getUserString: getUserString,
    getUserSearchText: getUserSearchText,
    hasUser: hasUser,
    importContact: importContact,
    importContacts: importContacts,
    deleteContacts: deleteContacts,
    wrapForFull: wrapForFull,
    openUser: openUser,
    resolveUsername: resolveUsername,
    openImportContact: openImportContact
  }
})

.service('PhonebookContactsService', function ($q, $modal, $sce, FileManager) {

  return {
    isAvailable: isAvailable,
    openPhonebookImport: openPhonebookImport,
    getPhonebookContacts: getPhonebookContacts
  };

  function isAvailable () {
    if (Config.Mobile && Config.Navigator.ffos && Config.Modes.packed) {
      try {
        return navigator.mozContacts && navigator.mozContacts.getAll;
      } catch (e) {
        console.error(dT(), 'phonebook n/a', e);
        return false;
      }
    }
    return false;
  }

  function openPhonebookImport () {
    return $modal.open({
      templateUrl: templateUrl('phonebook_modal'),
      controller: 'PhonebookModalController',
      windowClass: 'phonebook_modal_window mobile_modal'
    });
  }

  function getPhonebookContacts () {
    try {
      var request = window.navigator.mozContacts.getAll({});
    } catch (e) {
      return $q.reject(e);
    }

    var deferred = $q.defer(),
        contacts = [],
        count = 0;

    request.onsuccess = function () {
      if (this.result) {
        var contact = {
          id: count,
          first_name: (this.result.givenName || []).join(' '),
          last_name: (this.result.familyName || []).join(' '),
          phones: []
        };

        if (this.result.tel != undefined) {
          for (var i = 0; i < this.result.tel.length; i++) {
            contact.phones.push(this.result.tel[i].value);
          }
        }
        if (this.result.photo && this.result.photo[0]) {
          try {
            contact.photo = FileManager.getUrl(this.result.photo[0]);
          } catch (e) {}
        }
        if (!contact.photo) {
          contact.photo = 'img/placeholders/UserAvatar' + ((Math.abs(count) % 8) + 1) + '@2x.png';
        }
        contact.photo = $sce.trustAsResourceUrl(contact.photo);

        count++;
        contacts.push(contact);
      }

      if (!this.result || count >= 1000) {
        deferred.resolve(contacts);
        return;
      }

      this['continue']();
    }

    request.onerror = function (e) {
      console.log('phonebook error', e, e.type, e.message);
      deferred.reject(e);
    }

    return deferred.promise;
  }

})

.service('AppChatsManager', function ($q, $rootScope, $modal, _, MtpApiFileManager, MtpApiManager, AppUsersManager, AppPhotosManager, RichTextProcessor) {
  var chats = {},
      chatsFull = {},
      chatFullPromises = {},
      cachedPhotoLocations = {};

  function saveApiChats (apiChats) {
    angular.forEach(apiChats, saveApiChat);
  };

  function saveApiChat (apiChat) {
    if (!angular.isObject(apiChat)) {
      return;
    }
    apiChat.rTitle = RichTextProcessor.wrapRichText(apiChat.title, {noLinks: true, noLinebreaks: true}) || _('chat_title_deleted');

    var titleWords = SearchIndexManager.cleanSearchText(apiChat.title || '').split(' ');
    var firstWord = titleWords.shift();
    var lastWord = titleWords.pop();
    apiChat.initials = firstWord.charAt(0) + (lastWord ? lastWord.charAt(0) : firstWord.charAt(1));

    apiChat.num = (Math.abs(apiChat.id >> 1) % (Config.Mobile ? 4 : 8)) + 1;

    if (chats[apiChat.id] === undefined) {
      chats[apiChat.id] = apiChat;
    } else {
      safeReplaceObject(chats[apiChat.id], apiChat);
      $rootScope.$broadcast('chat_update', apiChat.id);
    }

    if (cachedPhotoLocations[apiChat.id] !== undefined) {
      safeReplaceObject(cachedPhotoLocations[apiChat.id], apiChat && apiChat.photo && apiChat.photo.photo_small || {empty: true});
    }
  };

  function getChat (id) {
    return chats[id] || {id: id, deleted: true};
  }

  function getChatFull(id) {
    if (chatsFull[id] !== undefined) {
      if (chats[id].version == chatsFull[id].participants.version) {
        return $q.when(chatsFull[id]);
      }
    }
    if (chatFullPromises[id] !== undefined) {
      return chatFullPromises[id];
    }
    return chatFullPromises[id] = MtpApiManager.invokeApi('messages.getFullChat', {
      chat_id: id
    }).then(function (result) {
      saveApiChats(result.chats);
      AppUsersManager.saveApiUsers(result.users);
      if (result.full_chat && result.full_chat.chat_photo.id) {
        AppPhotosManager.savePhoto(result.full_chat.chat_photo);
      }
      delete chatFullPromises[id];
      $rootScope.$broadcast('chat_full_update', id);

      return chatsFull[id] = result.full_chat;
    });
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
      placeholder: 'img/placeholders/' + placeholder + 'Avatar' + (Config.Mobile ? chat.num : Math.ceil(chat.num / 2)) + '@2x.png',
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
          participant.canLeave = myID == participant.user_id;
          participant.canKick = !participant.canLeave && (myID == chatFull.participants.admin_id || myID == participant.inviter_id);
        });
      });
    }

    chatFull.thumb = {
      placeholder: 'img/placeholders/GroupAvatar'+((Math.abs(id) % 4) + 1)+'@2x.png',
      location: chat && chat.photo && chat.photo.photo_small,
      width: 72,
      height: 72,
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
      templateUrl: templateUrl('chat_modal'),
      controller: 'ChatModalController',
      scope: scope,
      windowClass: 'chat_modal_window mobile_modal'
    });
  }

  $rootScope.$on('apiUpdate', function (e, update) {
    // console.log('on apiUpdate', update);
    switch (update._) {
      case 'updateChatParticipants':
        var participants = update.participants;
        var chatFull = chatsFull[participants.id];
        if (chatFull !== undefined) {
          chatFull.participants = update.participants;
          $rootScope.$broadcast('chat_full_update', chatID);
        }
        break;

      case 'updateChatParticipantAdd':
        var chatFull = chatsFull[update.chat_id];
        if (chatFull !== undefined) {
          var participants = chatFull.participants.participants || [];
          for (var i = 0, length = participants.length; i < length; i++) {
            if (participants[i].user_id == update.user_id) {
              return;
            }
          }
          participants.push({
            _: 'chatParticipant',
            user_id: update.user_id,
            inviter_id: update.inviter_id,
            date: tsNow(true)
          });
          chatFull.participants.version = update.version;
          $rootScope.$broadcast('chat_full_update', update.chat_id);
        }
        break;

      case 'updateChatParticipantDelete':
        var chatFull = chatsFull[update.chat_id];
        if (chatFull !== undefined) {
          var participants = chatFull.participants.participants || [];
          for (var i = 0, length = participants.length; i < length; i++) {
            if (participants[i].user_id == update.user_id) {
              participants.splice(i, 1);
              chatFull.participants.version = update.version;
              $rootScope.$broadcast('chat_full_update', update.chat_id);
              return;
            }
          }
        }
        break;
    }
  });

  return {
    saveApiChats: saveApiChats,
    saveApiChat: saveApiChat,
    getChat: getChat,
    getChatFull: getChatFull,
    getChatPhoto: getChatPhoto,
    getChatString: getChatString,
    hasChat: hasChat,
    wrapForFull: wrapForFull,
    openChat: openChat
  }
})

.service('AppPeersManager', function (AppUsersManager, AppChatsManager, MtpApiManager) {
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
    getPeerString: function (peerID) {
      if (peerID > 0) {
        return AppUsersManager.getUserString(peerID);
      }
      return AppChatsManager.getChatString(-peerID);
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

.service('AppMessagesManager', function ($q, $rootScope, $location, $filter, ApiUpdatesManager, AppUsersManager, AppChatsManager, AppPeersManager, AppPhotosManager, AppVideoManager, AppDocsManager, AppAudioManager, MtpApiManager, MtpApiFileManager, RichTextProcessor, NotificationsManager, PeersSelectService, Storage, FileManager, TelegramMeWebService, StatusManager, _) {

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

  var serverTimeOffset = 0,
      timestampNow = tsNow(true),
      midnightNoOffset = timestampNow - (timestampNow % 86400),
      midnightOffseted = new Date(),
      midnightOffset;


  var maxSeenID = false;
  if (Config.Modes.packed) {
    Storage.get('max_seen_msg').then(function (maxID) {
      maxSeenID = maxID || 0;
    });
  }

  Storage.get('server_time_offset').then(function (to) {
    if (to) {
      serverTimeOffset = to;
    }
  });

  var dateOrTimeFilter = $filter('dateOrTime');

  midnightOffseted.setHours(0);
  midnightOffseted.setMinutes(0);
  midnightOffseted.setSeconds(0);
  midnightOffset = midnightNoOffset - (Math.floor(+midnightOffseted / 1000));

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
      TelegramMeWebService.setAuthorized(true);

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

      curDialogStorage.count = dialogsResult.count || dialogsResult.dialogs.length;

      if (!maxID && curDialogStorage.dialogs.length) {
        incrementMaxSeenID(curDialogStorage.dialogs[0].top_message);
      }

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

        if (
          dialog.unread_count > 0 &&
          maxSeenID &&
          dialog.top_message > maxSeenID
        ) {
          var message = getMessage(dialog.top_message);
          var notifyPeer = message.flags & 16 ? message.from_id : peerID;
          if (message.unread && !message.out) {
            NotificationsManager.getPeerMuted(notifyPeer).then(function (muted) {
              if (!muted) {
                Storage.get('notify_nopreview').then(function (no_preview) {
                  notifyAboutMessage(message, no_preview);
                });
              }
            });
          }
        }
      });

      return {
        count: curDialogStorage.count,
        dialogs: curDialogStorage.dialogs.slice(offset, offset + limit)
      };
    });
  }

  function requestHistory (inputPeer, maxID, limit, offset) {
    return MtpApiManager.invokeApi('messages.getHistory', {
      peer: inputPeer,
      offset: offset || 0,
      limit: limit || 0,
      max_id: maxID || 0
    }, {noErrorBox: true}).then(function (historyResult) {
      AppUsersManager.saveApiUsers(historyResult.users);
      AppChatsManager.saveApiChats(historyResult.chats);
      saveMessages(historyResult.messages);

      return historyResult;
    });
  }

  function fillHistoryStorage (inputPeer, maxID, fullLimit, historyStorage) {
    // console.log('fill history storage', inputPeer, maxID, fullLimit, angular.copy(historyStorage));
    return requestHistory (inputPeer, maxID, fullLimit).then(function (historyResult) {
      historyStorage.count = historyResult.count || historyResult.messages.length;

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

  function getHistory (inputPeer, maxID, limit, backLimit, prerendered) {
    var peerID = AppPeersManager.getPeerID(inputPeer),
        historyStorage = historiesStorage[peerID],
        offset = 0,
        offsetNotFound = false,
        unreadOffset = false,
        unreadSkip = false,
        resultPending = [];

    prerendered = prerendered ? Math.min(50, prerendered) : 0;

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }
    else if (!maxID && historyStorage.pending.length) {
      resultPending = historyStorage.pending.slice();
    }

    if (!limit && !maxID) {
      var foundDialog = getDialogByPeerID(peerID);
      if (foundDialog && foundDialog[0] && foundDialog[0].unread_count > 1) {
        var unreadCount = foundDialog[0].unread_count;
        if (unreadSkip = (unreadCount > 50)) {
          limit = 20;
          unreadOffset = 16;
          offset = unreadCount - unreadOffset;
        } else {
          limit = Math.max(10, prerendered, unreadCount + 2);
          unreadOffset = unreadCount;
        }
      }
      else if (Config.Mobile) {
        limit = 20;
      }
    }
    else if (maxID > 0) {
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
      return $q.when({
        count: historyStorage.count,
        history: resultPending.concat(historyStorage.history.slice(offset, offset + limit)),
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
          history.push(message.id);
        });

        return {
          count: historyStorage.count,
          history: resultPending.concat(history),
          unreadOffset: unreadOffset,
          unreadSkip: unreadSkip
        };
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

      return {
        count: historyStorage.count,
        history: resultPending.concat(historyStorage.history.slice(offset, offset + limit)),
        unreadOffset: unreadOffset,
        unreadSkip: unreadSkip
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

      var foundCount = searchResult.count || searchResult.messages.length;

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

    if (historyStorage.readPromise) {
      return historyStorage.readPromise;
    }

    historyStorage.readPromise = MtpApiManager.invokeApi('messages.readHistory', {
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
        $rootScope.$broadcast('messages_read');
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

    return historyStorage.readPromise;
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
      apiMessage.unread = apiMessage.flags & 1 ? true : false;
      apiMessage.out = apiMessage.flags & 2 ? true : false;
      messagesStorage[apiMessage.id] = apiMessage;

      apiMessage.date -= serverTimeOffset;

      if (apiMessage.media) {
        switch (apiMessage.media._) {
          case 'messageMediaEmpty':
            delete apiMessage.media;
            break;
          case 'messageMediaPhoto':
            AppPhotosManager.savePhoto(apiMessage.media.photo);
            break;
          case 'messageMediaVideo':
            AppVideoManager.saveVideo(apiMessage.media.video);
            break;
          case 'messageMediaDocument':
            AppDocsManager.saveDoc(apiMessage.media.document);
            break;
          case 'messageMediaAudio':
            AppAudioManager.saveAudio(apiMessage.media.audio);
            break;
        }
      }
      if (apiMessage.action && apiMessage.action._ == 'messageActionChatEditPhoto') {
        AppPhotosManager.savePhoto(apiMessage.action.photo);
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
        message;

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    MtpApiManager.getUserID().then(function (fromID) {
      if (peerID != fromID) {
        flags |= 3;
      }
      if (replyToMsgID) {
        flags |= 8;
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
        MtpApiManager.invokeApi('messages.sendMessage', {
          peer: inputPeer,
          message: text,
          random_id: randomID,
          reply_to_msg_id: replyToMsgID
        }, sentRequestOptions).then(function (sentMessage) {
          message.date = sentMessage.date;
          message.id = sentMessage.id;

          ApiUpdatesManager.processUpdateMessage({
            _: 'updates',
            users: [],
            chats: [],
            seq: 0,
            updates: [{
              _: 'updateMessageID',
              random_id: randomIDS,
              id: sentMessage.id
            }, {
              _: 'updateNewMessage',
              message: message,
              pts: sentMessage.pts,
              pts_count: sentMessage.pts_count
            }]
          });
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
        flags = 0,
        replyToMsgID = options.replyToMsgID,
        attachType, apiFileName, realFileName;

    if (!options.isMedia) {
      attachType = 'document';
      apiFileName = 'document.' + file.type.split('/')[1];
    } else if (['image/jpeg', 'image/png', 'image/bmp'].indexOf(file.type) >= 0) {
      attachType = 'photo';
      apiFileName = 'photo.' + file.type.split('/')[1];
    } else if (file.type.substr(0, 6) == 'video/') {
      attachType = 'video';
      apiFileName = 'video.mp4';
    } else if (file.type.substr(0, 6) == 'audio/') {
      attachType = 'audio';
      apiFileName = 'audio.' + (file.type.split('/')[1] == 'ogg' ? 'ogg' : 'mp3');
    } else {
      attachType = 'document';
      apiFileName = 'document.' + file.type.split('/')[1];
    }

    if (historyStorage === undefined) {
      historyStorage = historiesStorage[peerID] = {count: null, history: [], pending: []};
    }

    MtpApiManager.getUserID().then(function (fromID) {
      if (peerID != fromID) {
        flags |= 3;
      }
      if (replyToMsgID) {
        flags |= 8;
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
            MtpApiManager.invokeApi('messages.sendMedia', {
              peer: inputPeer,
              media: inputMedia,
              random_id: randomID,
              reply_to_msg_id: replyToMsgID
            }).then(function (statedMessage) {
              message.date = statedMessage.message.date;
              message.id = statedMessage.message.id;
              message.media = statedMessage.message.media;

              ApiUpdatesManager.processUpdateMessage({
                _: 'updates',
                users: statedMessage.users,
                chats: statedMessage.chats,
                seq: 0,
                updates: [{
                  _: 'updateMessageID',
                  random_id: randomIDS,
                  id: statedMessage.message.id
                }, {
                  _: 'updateNewMessage',
                  message: message,
                  pts: statedMessage.pts,
                  pts_count: statedMessage.pts_count
                }]
              });
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
          media = {
            _: 'messageMediaPhoto',
            photo: AppPhotosManager.getPhoto(inputMedia.id.id)
          };
          break;

        case 'inputMediaDocument':
          media = {
            _: 'messageMediaDocument',
            'document': AppDocsManager.getDoc(inputMedia.id.id)
          };
          break;
      }

      var message = {
        _: 'message',
        id: messageID,
        from_id: fromID,
        to_id: AppPeersManager.getOutputPeer(peerID),
        flags: peerID == fromID ? 0 : 3,
        date: tsNow(true) + serverTimeOffset,
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
        $rootScope.$broadcast('messages_pending');
      }

      message.send = function () {
        MtpApiManager.invokeApi('messages.sendMedia', {
          peer: inputPeer,
          media: inputMedia,
          random_id: randomID,
          reply_to_msg_id: 0
        }).then(function (statedMessage) {
          message.date = statedMessage.message.date;
          message.id = statedMessage.message.id;
          message.media = statedMessage.message.media;

          ApiUpdatesManager.processUpdateMessage({
            _: 'updates',
            users: statedMessage.users,
            chats: statedMessage.chats,
            seq: 0,
            updates: [{
              _: 'updateMessageID',
              random_id: randomIDS,
              id: statedMessage.message.id
            }, {
              _: 'updateNewMessage',
              message: message,
              pts: statedMessage.pts,
              pts_count: statedMessage.pts_count
            }]
          });
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
    msgIDs = msgIDs.sort();

    var randomIDs = [];
    var i;
    var len = msgIDs.length;
    for (var i = 0; i < msgIDs.length; i++) {
      randomIDs.push([nextRandomInt(0xFFFFFFFF), nextRandomInt(0xFFFFFFFF)]);
    }

    return MtpApiManager.invokeApi('messages.forwardMessages', {
      peer: AppPeersManager.getInputPeerByID(peerID),
      id: msgIDs,
      random_id: randomIDs
    }).then(function (statedMessages) {
      var updates = [];
      angular.forEach(statedMessages.messages, function(apiMessage) {
        updates.push({
          _: 'updateNewMessage',
          message: apiMessage,
          pts: statedMessages.pts,
          pts_count: statedMessages.pts_count
        });
      });

      ApiUpdatesManager.processUpdateMessage({
        _: 'updates',
        users: statedMessages.users,
        chats: statedMessages.chats,
        seq: 0,
        updates: updates
      });
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

      ApiUpdatesManager.processUpdateMessage({
        _: 'updateShort',
        update: {
          _: 'updateDeleteMessages',
          messages: [tempID]
        }
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

        $rootScope.$broadcast('messages_pending');
      }

      delete messagesForHistory[tempID];
      delete messagesStorage[tempID];

      return message;
    }

    return false;
  }

  function onStatedMessage (statedMessage) {
    ApiUpdatesManager.processUpdateMessage({
      _: 'updates',
      users: statedMessage.users,
      chats: statedMessage.chats,
      seq: 0,
      updates: [{
        _: 'updateNewMessage',
        message: statedMessage.message,
        pts: statedMessage.pts,
        pts_count: statedMessage.pts_count
      }]
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

  function wrapForDialog (msgID, unreadCount) {
    var useCache = unreadCount != -1;

    if (useCache && messagesForDialogs[msgID] !== undefined) {
      return messagesForDialogs[msgID];
    }

    var message = angular.copy(messagesStorage[msgID]) || {id: msgID};

    if (message.chatID = message.to_id.chat_id) {
      message.peerID = -message.chatID;
      message.peerData = AppChatsManager.getChat(message.chatID);
    } else {
      message.peerID = message.out ? message.to_id.user_id : message.from_id;
      message.peerData = AppUsersManager.getUser(message.peerID);
    }
    message.peerString = AppPeersManager.getPeerString(message.peerID);
    message.peerPhoto = AppPeersManager.getPeerPhoto(message.peerID, 'User', 'Group');
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
    }
    else if (message.action) {
      switch (message.action._) {
        case 'messageActionChatEditPhoto':
          message.action.photo = AppPhotosManager.wrapForHistory(message.action.photo.id);
          break;

        case 'messageActionChatCreate':
        case 'messageActionChatEditTitle':
          message.action.rTitle = RichTextProcessor.wrapRichText(message.action.title, {noLinks: true, noLinebreaks: true}) || _('chat_title_deleted');
          break;
      }
    }

    var replyToMsgID = message.reply_to_msg_id;
    if (replyToMsgID) {
      if (messagesStorage[replyToMsgID]) {
        message.reply_to_msg = wrapForDialog(replyToMsgID);
      } else {
        message.reply_to_msg = {id: replyToMsgID, loading: true};
        if (needSingleMessages.indexOf(replyToMsgID) == -1) {
          needSingleMessages.push(replyToMsgID);
          if (fetchSingleMessagesTimeout === false) {
            fetchSingleMessagesTimeout = setTimeout(fetchSingleMessages, 100);
          }
        }
      }
    }

    if (message.message && message.message.length) {
      var options = {};
      if (!Config.Navigator.mobile) {
        options.extractUrlEmbed = true;
      }
      if (message.flags & 16) {
        var user = AppUsersManager.getSelf();
        if (user) {
          options.highlightUsername = user.username;
        }
      }
      message.richMessage = RichTextProcessor.wrapRichText(message.message, options);
      if (options.extractedUrlEmbed) {
        message.richUrlEmbed = options.extractedUrlEmbed;
      }
    }

    return messagesForHistory[msgID] = message;
  }

  function fetchSingleMessages () {
    if (fetchSingleMessagesTimeout !== false) {
      clearTimeout(fetchSingleMessagesTimeout);
      fetchSingleMessagesTimeout = false;
    }
    if (!needSingleMessages.length) {
      return;
    }
    var msgIDs = needSingleMessages.slice();
    needSingleMessages = [];
    MtpApiManager.invokeApi('messages.getMessages', {
      id: msgIDs
    }).then(function (getMessagesResult) {
      AppUsersManager.saveApiUsers(getMessagesResult.users);
      AppChatsManager.saveApiChats(getMessagesResult.chats);
      saveMessages(getMessagesResult.messages);

      $rootScope.$broadcast('messages_downloaded', msgIDs);
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

      if (curMessage.fwd_from_id &&
          curMessage.media &&
          curMessage.media.document &&
          curMessage.media.document.sticker &&
          (curMessage.from_id != (prevMessage || {}).from_id || !(prevMessage || {}).fwd_from_id)) {
        delete curMessage.fwd_from_id;
        curMessage._ = 'message';
      }

      if (prevMessage &&
          curMessage.from_id == prevMessage.from_id &&
          !prevMessage.fwd_from_id == !curMessage.fwd_from_id &&
          !prevMessage.action &&
          !curMessage.action &&
          curMessage.date < prevMessage.date + 900) {

        var singleLine = curMessage.message && curMessage.message.length < 70 && curMessage.message.indexOf("\n") == -1 && !curMessage.reply_to_msg_id;
        if (groupFwd && curMessage.fwd_from_id && curMessage.fwd_from_id == prevMessage.fwd_from_id) {
          curMessage.grouped = singleLine ? 'im_grouped_fwd_short' : 'im_grouped_fwd';
        } else {
          curMessage.grouped = !curMessage.fwd_from_id && singleLine ? 'im_grouped_short' : 'im_grouped';
        }
        if (groupFwd && curMessage.fwd_from_id) {
          if (!prevMessage.grouped) {
            prevMessage.grouped = 'im_grouped_fwd_start';
          }
          if (curMessage.grouped && i == len - 1) {
            curMessage.grouped += ' im_grouped_fwd_end';
          }
        }
      } else if (prevMessage || !i) {
        delete curMessage.grouped;

        if (groupFwd && prevMessage && prevMessage.grouped && prevMessage.fwd_from_id) {
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

  function getDialogByPeerID (peerID) {
    for (var i = 0; i < dialogsStorage.dialogs.length; i++) {
      if (dialogsStorage.dialogs[i].peerID == peerID) {
        return [dialogsStorage.dialogs[i], i];
      }
    }

    return [];
  }

  function incrementMaxSeenID (maxID) {
    if (maxSeenID !== false && maxID && maxID > maxSeenID) {
      Storage.set({
        max_seen_msg: maxID
      });
    }
  }

  function notifyAboutMessage (message, no_preview) {
    var peerID = getMessagePeer(message);
    var fromUser = AppUsersManager.getUser(message.from_id);
    var fromPhoto = AppUsersManager.getUserPhoto(message.from_id, 'User');
    var peerString;
    var notification = {},
        notificationMessage = false,
        notificationPhoto;

    if (message.message) {
      if (no_preview) {
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
            var stickerEmoji = EmojiHelper.stickers[message.media.document.id];
            if (stickerEmoji !== undefined) {
              notificationMessage = RichTextProcessor.wrapPlainText(stickerEmoji) + ' (' + notificationMessage + ')';
            }
          } else {
            notificationMessage = message.media.document.file_name || _('conversation_media_document_raw');
          }
          break;
        case 'messageMediaAudio': notificationMessage = _('conversation_media_audio_raw'); break;
        case 'messageMediaGeo': notificationMessage = _('conversation_media_location_raw'); break;
        case 'messageMediaContact': notificationMessage = _('conversation_media_contact_raw'); break;
        default: notificationMessage = _('conversation_media_attachment_raw'); break;
      }
    } else if (message._ == 'messageService') {
      switch (message.action._) {
        case 'messageActionChatCreate': notificationMessage = _('conversation_group_created_raw'); break;
        case 'messageActionChatEditTitle': notificationMessage = _('conversation_group_renamed_raw'); break;
        case 'messageActionChatEditPhoto': notificationMessage = _('conversation_group_photo_updated_raw'); break;
        case 'messageActionChatDeletePhoto': notificationMessage = _('conversation_group_photo_removed_raw'); break;
        case 'messageActionChatAddUser':
          notificationMessage = message.action.user_id == message.from_id ? _('conversation_returned_to_group') : _('conversation_invited_user_message_raw');
          break;
        case 'messageActionChatDeleteUser':
          notificationMessage = message.action.user_id == message.from_id ? _('conversation_left_group') : _('conversation_kicked_user_message_raw');
          break;
      }
    }

    if (peerID > 0) {
      notification.title = (fromUser.first_name || '') +
                           (fromUser.first_name && fromUser.last_name ? ' ' : '') +
                           (fromUser.last_name || '');
      if (!notification.title) {
        notification.title = fromUser.phone || _('conversation_unknown_user_raw');
      }

      notificationPhoto = fromPhoto;

      peerString = AppUsersManager.getUserString(peerID);

    } else {
      notification.title = (fromUser.first_name || fromUser.last_name || _('conversation_unknown_user_raw')) +
                           ' @ ' +
                           (AppChatsManager.getChat(-peerID).title || _('conversation_unknown_chat_raw'));

      notificationPhoto = AppChatsManager.getChatPhoto(-peerID, 'Group');

      peerString = AppChatsManager.getChatString(-peerID);
    }

    notification.title = RichTextProcessor.wrapPlainText(notification.title);

    notification.onclick = function () {
      $rootScope.$broadcast('history_focus', {
        peerString: peerString,
        messageID: message.flags & 16 ? message.id : 0,
      });
    };

    notification.message = notificationMessage;
    notification.image = notificationPhoto.placeholder;
    notification.key = 'msg' + message.id;
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
          if (historiesStorage[peerID].history.indexOf(message.id) != -1) {
            return false;
          }
          else {
            historyStorage.history.unshift(message.id);
            if (message.id > 0 && message.id < topMsgID || true) {
              historyStorage.history.sort(function (a, b) {
                return b - a;
              });
            }
          }
        } else {
          historyStorage = historiesStorage[peerID] = {count: null, history: [message.id], pending: []};
        }

        saveMessages([message]);

        if (!message.out) {
          AppUsersManager.forceUserOnline(message.from_id);
        }

        if (historyStorage.count !== null) {
          historyStorage.count++;
        }

        var randomID = pendingByMessageID[message.id],
            pendingMessage;

        if (randomID) {
          if (pendingMessage = finalizePendingMessage(randomID, message)) {
            $rootScope.$broadcast('history_update', {peerID: peerID});
          }
          delete pendingByMessageID[message.id];
        }

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

        if (($rootScope.selectedPeerID != peerID || $rootScope.idle.isIDLE) &&
            !message.out &&
            message.unread) {

          var notifyPeer = message.flags & 16 ? message.from_id : peerID;
          var isMutedPromise = NotificationsManager.getPeerMuted(notifyPeer);
          var timeout = $rootScope.idle.isIDLE && StatusManager.isOtherDeviceActive() ? 30000 : 1000;
          setTimeout(function () {
            isMutedPromise.then(function (muted) {
              if (message.unread && !muted) {
                Storage.get('notify_nopreview').then(function (no_preview) {
                  notifyAboutMessage(message, no_preview);
                });
              }
            })
          }, timeout);
        }

        incrementMaxSeenID(message.id);
        break;

      case 'updateReadHistoryInbox':
      case 'updateReadHistoryOutbox':
        var maxID = update.max_id;
        var isOut = update._ == 'updateReadHistoryOutbox';
        var peerID = AppPeersManager.getPeerID(update.peer);
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

      case 'updateDeleteMessages':
        var dialogsUpdated = {},
            historiesUpdated = {},
            messageID, message, i, peerID, foundDialog, history;

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
    onStatedMessage: onStatedMessage,
    getMessagePeer: getMessagePeer,
    wrapForDialog: wrapForDialog,
    wrapForHistory: wrapForHistory,
    regroupWrappedHistory: regroupWrappedHistory
  }
})

.service('AppPhotosManager', function ($modal, $window, $rootScope, MtpApiManager, MtpApiFileManager, AppUsersManager, FileManager) {
  var photos = {},
      windowW = $(window).width(),
      windowH = $(window).height();

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
    if (Config.Navigator.retina) {
      width *= 2;
      height *= 2;
    }
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
    var photo = photos[photoID];
    var fullWidth = $(window).width() - (Config.Mobile ? 20 : 32);
    var fullHeight = $($window).height() - (Config.Mobile ? 150 : 116);
    if (fullWidth > 800) {
      fullWidth -= 208;
    }
    var fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight);

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
        width = Math.min(windowW - 80, Config.Mobile ? 210 : 260),
        height = Math.min(windowH - 100, Config.Mobile ? 210 : 260),
        thumbPhotoSize = choosePhotoSize(photo, width, height),
        thumb = {
          placeholder: 'img/placeholders/PhotoThumbConversation.gif',
          width: width,
          height: height
        };

    // console.log('chosen photo size', photoID, thumbPhotoSize);
    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      var dim = calcImageInBox(thumbPhotoSize.w, thumbPhotoSize.h, width, height);
      thumb.width = dim.w;
      thumb.height = dim.h;
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
    var photo = wrapForHistory(photoID);
    var fullWidth = $(window).width() - (Config.Mobile ? 0 : 32);
    var fullHeight = $($window).height() - (Config.Mobile ? 0 : 116);
    if (!Config.Mobile && fullWidth > 800) {
      fullWidth -= 208;
    }
    var fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight);
    var full = {
          placeholder: 'img/placeholders/PhotoThumbModal.gif'
        };

    full.width = fullWidth;
    full.height = fullHeight;

    if (fullPhotoSize && fullPhotoSize._ != 'photoSizeEmpty') {
      var wh = calcImageInBox(fullPhotoSize.w, fullPhotoSize.h, fullWidth, fullHeight, true);
      full.width = wh.w;
      full.height = wh.h;

      full.modalWidth = Math.max(full.width, Math.min(400, fullWidth));

      full.location = fullPhotoSize.location;
      full.size = fullPhotoSize.size;
    }

    photo.full = full;

    return photo;
  }

  function openPhoto (photoID, list) {
    if (!photoID || photoID === '0') {
      return false;
    }

    var scope = $rootScope.$new(true);

    scope.photoID = photoID;

    var controller = 'PhotoModalController';
    if (list && list.p > 0) {
      controller = 'UserpicModalController';
      scope.userID = list.p;
    }
    else if (list && list.p < 0) {
      controller = 'ChatpicModalController';
      scope.chatID = -list.p;
    }
    else if (list && list.m > 0) {
      scope.messageID = list.m;
    }

    var modalInstance = $modal.open({
      templateUrl: templateUrl('photo_modal'),
      windowTemplateUrl: templateUrl('media_modal_layout'),
      controller: controller,
      scope: scope,
      windowClass: 'photo_modal_window'
    });
  }

  function downloadPhoto (photoID) {
    var photo = photos[photoID],
        ext = 'jpg',
        mimeType = 'image/jpeg',
        fileName = 'photo' + photoID + '.' + ext,
        fullWidth = Math.max(screen.width || 0, $(window).width() - 36, 800),
        fullHeight = Math.max(screen.height || 0, $($window).height() - 150, 800),
        fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight),
        inputFileLocation = {
          _: 'inputFileLocation',
          volume_id: fullPhotoSize.location.volume_id,
          local_id: fullPhotoSize.location.local_id,
          secret: fullPhotoSize.location.secret
        };

    FileManager.chooseSave(fileName, ext, mimeType).then(function (writableFileEntry) {
      if (writableFileEntry) {
        MtpApiFileManager.downloadFile(
          fullPhotoSize.location.dc_id, inputFileLocation, fullPhotoSize.size, {
          mime: mimeType,
          toFileEntry: writableFileEntry
        }).then(function () {
          // console.log('file save done');
        }, function (e) {
          console.log('photo download failed', e);
        });
      }
    }, function () {
      var cachedBlob = MtpApiFileManager.getCachedFile(inputFileLocation);
      if (cachedBlob) {
        return FileManager.download(cachedBlob, mimeType, fileName);
      }

      MtpApiFileManager.downloadFile(
        fullPhotoSize.location.dc_id, inputFileLocation, fullPhotoSize.size, {mime: mimeType}
      ).then(function (blob) {
        FileManager.download(blob, mimeType, fileName);
      }, function (e) {
        console.log('photo download failed', e);
      });
    });
  };

  $rootScope.openPhoto = openPhoto;

  return {
    savePhoto: savePhoto,
    preloadPhoto: preloadPhoto,
    getUserPhotos: getUserPhotos,
    getPhoto: getPhoto,
    choosePhotoSize: choosePhotoSize,
    wrapForHistory: wrapForHistory,
    wrapForFull: wrapForFull,
    openPhoto: openPhoto,
    downloadPhoto: downloadPhoto
  }
})


.service('AppVideoManager', function ($sce, $rootScope, $modal, $window, MtpApiFileManager, AppUsersManager, FileManager, qSync) {
  var videos = {},
      videosForHistory = {},
      windowW = $(window).width(),
      windowH = $(window).height();

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
        width = Math.min(windowW - 80, Config.Mobile ? 210 : 150),
        height = Math.min(windowH - 100, Config.Mobile ? 210 : 150),
        thumbPhotoSize = video.thumb,
        thumb = {
          placeholder: 'img/placeholders/VideoThumbConversation.gif',
          width: width,
          height: height
        };

    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      if ((thumbPhotoSize.w / thumbPhotoSize.h) > (width / height)) {
        thumb.height = parseInt(thumbPhotoSize.h * width / thumbPhotoSize.w);
      }
      else {
        thumb.width = parseInt(thumbPhotoSize.w * height / thumbPhotoSize.h);
        if (thumb.width > width) {
          thumb.height = parseInt(thumb.height * width / thumb.width);
          thumb.width = width;
        }
      }

      thumb.location = thumbPhotoSize.location;
      thumb.size = thumbPhotoSize.size;
    }

    video.thumb = thumb;

    return videosForHistory[videoID] = video;
  }

  function wrapForFull (videoID) {
    var video = wrapForHistory(videoID),
        fullWidth = Math.min($(window).width() - (Config.Mobile ? 0 : 60), 542),
        fullHeight = $($window).height() - (Config.Mobile ? 92 : 150),
        fullPhotoSize = video,
        full = {
          placeholder: 'img/placeholders/VideoThumbModal.gif',
          width: fullWidth,
          height: fullHeight,
        };

    if (!video.w || !video.h) {
      full.height = full.width = Math.min(fullWidth, fullHeight);
    } else {
      var wh = calcImageInBox(video.w, video.h, fullWidth, fullHeight);
      full.width = wh.w;
      full.height = wh.h;
    }

    video.full = full;
    video.fullThumb = angular.copy(video.thumb);
    video.fullThumb.width = full.width;
    video.fullThumb.height = full.height;

    return video;
  }

  function openVideo (videoID, messageID) {
    var scope = $rootScope.$new(true);
    scope.videoID = videoID;
    scope.messageID = messageID;

    return $modal.open({
      templateUrl: templateUrl('video_modal'),
      windowTemplateUrl: templateUrl('media_modal_layout'),
      controller: 'VideoModalController',
      scope: scope,
      windowClass: 'video_modal_window'
    });
  }

  function updateVideoDownloaded (videoID) {
    var video = videos[videoID],
        historyVideo = videosForHistory[videoID] || video || {},
        inputFileLocation = {
          _: 'inputVideoFileLocation',
          id: videoID,
          access_hash: video.access_hash
        };

    // historyVideo.progress = {enabled: true, percent: 10, total: video.size};

    if (historyVideo.downloaded === undefined) {
      MtpApiFileManager.getDownloadedFile(inputFileLocation, video.size).then(function () {
        historyVideo.downloaded = true;
      }, function () {
        historyVideo.downloaded = false;
      });
    }
  }

  function downloadVideo (videoID, toFileEntry) {
    var video = videos[videoID],
        historyVideo = videosForHistory[videoID] || video || {},
        mimeType = video.mime_type || 'video/ogg',
        inputFileLocation = {
          _: 'inputVideoFileLocation',
          id: videoID,
          access_hash: video.access_hash
        };

    if (historyVideo.downloaded && !toFileEntry) {
      var cachedBlob = MtpApiFileManager.getCachedFile(inputFileLocation);
      if (cachedBlob) {
        return qSync.when(cachedBlob);
      }
    }

    historyVideo.progress = {enabled: !historyVideo.downloaded, percent: 1, total: video.size};

    var downloadPromise = MtpApiFileManager.downloadFile(video.dc_id, inputFileLocation, video.size, {
      mime: mimeType,
      toFileEntry: toFileEntry
    });

    downloadPromise.then(function (blob) {
      FileManager.getFileCorrectUrl(blob, mimeType).then(function (url) {
        historyVideo.url = $sce.trustAsResourceUrl(url);
      });

      delete historyVideo.progress;
      historyVideo.downloaded = true;
      console.log('video save done');
    }, function (e) {
      console.log('video download failed', e);
      historyVideo.progress.enabled = false;
    }, function (progress) {
      console.log('dl progress', progress);
      historyVideo.progress.enabled = true;
      historyVideo.progress.done = progress.done;
      historyVideo.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      $rootScope.$broadcast('history_update');
    });

    historyVideo.progress.cancel = downloadPromise.cancel;

    return downloadPromise;
  }

  function saveVideoFile (videoID) {
    var video = videos[videoID],
        mimeType = video.mime_type || 'video/mp4',
        fileExt = mimeType.split('.')[1] || 'mp4',
        fileName = 't_video' + videoID + '.' + fileExt,
        historyVideo = videosForHistory[videoID] || video || {};

    FileManager.chooseSave(fileName, fileExt, mimeType).then(function (writableFileEntry) {
      if (writableFileEntry) {
        downloadVideo(videoID, writableFileEntry);
      }
    }, function () {
      downloadVideo(videoID).then(function (blob) {
        FileManager.download(blob, mimeType, fileName);
      });
    });
  }

  return {
    saveVideo: saveVideo,
    wrapForHistory: wrapForHistory,
    wrapForFull: wrapForFull,
    openVideo: openVideo,
    updateVideoDownloaded: updateVideoDownloaded,
    downloadVideo: downloadVideo,
    saveVideoFile: saveVideoFile
  }
})

.service('AppDocsManager', function ($sce, $rootScope, $modal, $window, $q, RichTextProcessor, MtpApiFileManager, FileManager, qSync) {
  var docs = {},
      docsForHistory = {},
      windowW = $(window).width(),
      windowH = $(window).height();

  function saveDoc (apiDoc) {
    docs[apiDoc.id] = apiDoc;

    if (apiDoc.thumb && apiDoc.thumb._ == 'photoCachedSize') {
      MtpApiFileManager.saveSmallFile(apiDoc.thumb.location, apiDoc.thumb.bytes);

      // Memory
      apiDoc.thumb.size = apiDoc.thumb.bytes.length;
      delete apiDoc.thumb.bytes;
      apiDoc.thumb._ = 'photoSize';
    }
    angular.forEach(apiDoc.attributes, function (attribute) {
      switch (attribute._) {
        case 'documentAttributeFilename':
          apiDoc.file_name = attribute.file_name;
          break;
        case 'documentAttributeVideo':
        case 'documentAttributeAudio':
          apiDoc.duration = attribute.duration;
          break;
        case 'documentAttributeSticker':
          apiDoc.sticker = 1;
          var stickerEmoji = attribute.alt || EmojiHelper.stickers[apiDoc.id];
          if (stickerEmoji !== undefined) {
            apiDoc.sticker = 2;
            apiDoc.stickerEmoji = RichTextProcessor.wrapRichText(stickerEmoji, {noLinks: true, noLinebreaks: true});
          }
          break;
        case 'documentAttributeImageSize':
          apiDoc.w = attribute.w;
          apiDoc.h = attribute.h;
          break;
      }
    });
    apiDoc.file_name = apiDoc.file_name || '';
  };

  function getDoc (docID) {
    return docs[docID] || {_: 'documentEmpty'};
  }

  function wrapForHistory (docID) {
    if (docsForHistory[docID] !== undefined) {
      return docsForHistory[docID];
    }

    var doc = angular.copy(docs[docID]),
        isGif = doc.mime_type == 'image/gif',
        isSticker = doc.mime_type.substr(0, 6) == 'image/' && doc.sticker,
        thumbPhotoSize = doc.thumb,
        width, height;

    if (isGif) {
      width = Math.min(windowW - 80, 260);
      height = Math.min(windowH - 100, 260);
    }
    else if (isSticker) {
      width = Math.min(windowW - 80, Config.Mobile ? 210 : 260);
      height = Math.min(windowH - 100, Config.Mobile ? 210 : 260);
    } else {
      width = height = 100;
    }

    var thumb = {
          width: width,
          height: height
        };

    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      var dim = calcImageInBox(thumbPhotoSize.w, thumbPhotoSize.h, width, height);
      thumb.width = dim.w;
      thumb.height = dim.h;
      thumb.location = thumbPhotoSize.location;
      thumb.size = thumbPhotoSize.size;
    }
    else if (isSticker) {
      var dim = calcImageInBox(doc.w, doc.h, width, height);
      thumb.width = dim.w;
      thumb.height = dim.h;
    }
    else {
      thumb = false;
    }
    doc.thumb = thumb;

    doc.withPreview = !Config.Mobile && doc.mime_type.match(/^(image\/)/) ? 1 : 0;

    if (isGif && doc.thumb) {
      doc.isSpecial = 'gif';
    }
    else if (isSticker) {
      doc.isSpecial = 'sticker';
    }
    else if (doc.mime_type.substr(0, 6) == 'audio/') {
      doc.isSpecial = 'audio';
    }

    return docsForHistory[docID] = doc;
  }

  function updateDocDownloaded (docID) {
    var doc = docs[docID],
        historyDoc = docsForHistory[docID] || doc || {},
        inputFileLocation = {
          _: 'inputDocumentFileLocation',
          id: docID,
          access_hash: doc.access_hash
        };

    if (historyDoc.downloaded === undefined) {
      MtpApiFileManager.getDownloadedFile(inputFileLocation, doc.size).then(function () {
        historyDoc.downloaded = true;
      }, function () {
        historyDoc.downloaded = false;
      });
    }
  }

  function downloadDoc (docID, toFileEntry) {
    var doc = docs[docID],
        historyDoc = docsForHistory[docID] || doc || {},
        inputFileLocation = {
          _: 'inputDocumentFileLocation',
          id: docID,
          access_hash: doc.access_hash
        };

    if (historyDoc.downloaded && !toFileEntry) {
      var cachedBlob = MtpApiFileManager.getCachedFile(inputFileLocation);
      if (cachedBlob) {
        return qSync.when(cachedBlob);
      }
    }

    historyDoc.progress = {enabled: !historyDoc.downloaded, percent: 1, total: doc.size};

    var downloadPromise = MtpApiFileManager.downloadFile(doc.dc_id, inputFileLocation, doc.size, {
      mime: doc.mime_type || 'application/octet-stream',
      toFileEntry: toFileEntry
    });

    downloadPromise.then(function (blob) {
      delete historyDoc.progress;
      if (blob) {
        FileManager.getFileCorrectUrl(blob, doc.mime_type).then(function (url) {
          historyDoc.url = $sce.trustAsResourceUrl(url);
        })
        historyDoc.downloaded = true;
      }
      console.log('file save done');
    }, function (e) {
      console.log('document download failed', e);
      historyDoc.progress.enabled = false;
    }, function (progress) {
      console.log('dl progress', progress);
      historyDoc.progress.enabled = true;
      historyDoc.progress.done = progress.done;
      historyDoc.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      $rootScope.$broadcast('history_update');
    });

    historyDoc.progress.cancel = downloadPromise.cancel;

    return downloadPromise;
  }

  function openDoc (docID, messageID) {
    var scope = $rootScope.$new(true);
    scope.docID = docID;
    scope.messageID = messageID;

    var modalInstance = $modal.open({
      templateUrl: templateUrl('document_modal'),
      windowTemplateUrl: templateUrl('media_modal_layout'),
      controller: 'DocumentModalController',
      scope: scope,
      windowClass: 'document_modal_window'
    });
  }

  function saveDocFile (docID) {
    var doc = docs[docID],
        historyDoc = docsForHistory[docID] || doc || {};

    var ext = (doc.file_name.split('.', 2) || [])[1] || '';
    FileManager.chooseSave(doc.file_name, ext, doc.mime_type).then(function (writableFileEntry) {
      if (writableFileEntry) {
        downloadDoc(docID, writableFileEntry);
      }
    }, function () {
      downloadDoc(docID).then(function (blob) {
        FileManager.download(blob, doc.mime_type, doc.file_name);
      });
    });
  }

  return {
    saveDoc: saveDoc,
    getDoc: getDoc,
    wrapForHistory: wrapForHistory,
    updateDocDownloaded: updateDocDownloaded,
    downloadDoc: downloadDoc,
    openDoc: openDoc,
    saveDocFile: saveDocFile
  }
})

.service('AppAudioManager', function ($sce, $rootScope, $modal, $window, MtpApiFileManager, FileManager, qSync) {
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

  function updateAudioDownloaded (audioID) {
    var audio = audios[audioID],
        historyAudio = audiosForHistory[audioID] || audio || {},
        inputFileLocation = {
          _: 'inputAudioFileLocation',
          id: audioID,
          access_hash: audio.access_hash
        };

    // historyAudio.progress = {enabled: !historyAudio.downloaded, percent: 10, total: audio.size};

    if (historyAudio.downloaded === undefined) {
      MtpApiFileManager.getDownloadedFile(inputFileLocation, audio.size).then(function () {
        historyAudio.downloaded = true;
      }, function () {
        historyAudio.downloaded = false;
      });
    }
  }

  function downloadAudio (audioID, toFileEntry) {
    var audio = audios[audioID],
        historyAudio = audiosForHistory[audioID] || audio || {},
        mimeType = audio.mime_type || 'audio/ogg',
        inputFileLocation = {
          _: 'inputAudioFileLocation',
          id: audioID,
          access_hash: audio.access_hash
        };

    if (historyAudio.downloaded && !toFileEntry) {
      var cachedBlob = MtpApiFileManager.getCachedFile(inputFileLocation);
      if (cachedBlob) {
        return qSync.when(cachedBlob);
      }
    }

    historyAudio.progress = {enabled: !historyAudio.downloaded, percent: 1, total: audio.size};

    var downloadPromise = MtpApiFileManager.downloadFile(audio.dc_id, inputFileLocation, audio.size, {
      mime: mimeType,
      toFileEntry: toFileEntry
    });

    downloadPromise.then(function (blob) {
      FileManager.getFileCorrectUrl(blob, mimeType).then(function (url) {
        historyAudio.url = $sce.trustAsResourceUrl(url);
      });
      delete historyAudio.progress;
      historyAudio.downloaded = true;
      console.log('audio save done');
    }, function (e) {
      console.log('audio download failed', e);
      historyAudio.progress.enabled = false;
    }, function (progress) {
      console.log('dl progress', progress);
      historyAudio.progress.enabled = true;
      historyAudio.progress.done = progress.done;
      historyAudio.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      $rootScope.$broadcast('history_update');
    });

    historyAudio.progress.cancel = downloadPromise.cancel;

    return downloadPromise;
  }

  function saveAudioFile (audioID) {
    var audio = audios[audioID],
        mimeType = audio.mime_type || 'audio/ogg',
        fileExt = mimeType.split('.')[1] || 'ogg',
        fileName = 't_audio' + audioID + '.' + fileExt,
        historyAudio = audiosForHistory[audioID] || audio || {};

    FileManager.chooseSave(fileName, fileExt, mimeType).then(function (writableFileEntry) {
      if (writableFileEntry) {
        downloadAudio(audioID, writableFileEntry);
      }
    }, function () {
      downloadAudio(audioID).then(function (blob) {
        FileManager.download(blob, mimeType, fileName);
      });
    });
  }

  return {
    saveAudio: saveAudio,
    wrapForHistory: wrapForHistory,
    updateAudioDownloaded: updateAudioDownloaded,
    downloadAudio: downloadAudio,
    saveAudioFile: saveAudioFile
  }
})

.service('AppStickersManager', function ($q, FileManager, MtpApiManager, MtpApiFileManager, AppDocsManager, Storage) {

  var stickersToEmoji = {};
  var currentStickers = [];
  var applied = false;
  var started = false;

  return {
    start: start,
    getStickerEmoji: getStickerEmoji,
    getStickers: getStickers,
    getStickersImages: getStickersImages
  };

  function start () {
    if (!started) {
      started = true;
      setTimeout(getStickers, 1000);
      setInterval(preloadStickers, 900000);
    }
  }

  function preloadStickers() {
    getStickers().then(getStickersImages);
  }

  function getStickerEmoji(docID) {
    return EmojiHelper.stickers[docID] || false;
  }

  function processRawStickers(stickers) {
    if (applied !== stickers.hash) {
      applied = stickers.hash;
      var i, j, len1, len2;

      len1 = stickers.documents.length;
      for (i = 0; i < len1; i++) {
        AppDocsManager.saveDoc(stickers.documents[i]);
      }

      var pack, emoticon, docID;
      var doneDocIDs = {};
      currentStickers = [];
      len1 = stickers.packs.length;
      for (i = 0; i < len1; i++) {
        pack = stickers.packs[i];
        emoticon = pack.emoticon;
        len2 = pack.documents.length;
        for (j = 0; j < len2; j++) {
          docID = pack.documents[j];
          if (EmojiHelper.stickers[docID] === undefined) {
            EmojiHelper.stickers[docID] = emoticon;
          }
          if (doneDocIDs[docID] === undefined) {
            doneDocIDs[docID] = true;
            currentStickers.push(docID);
          }
        }
      }
    }
    return currentStickers;
  }

  function getStickers () {
    return Storage.get('all_stickers').then(function (stickers) {
      var layer = Config.Schema.API.layer;
      if (stickers.layer != layer) {
        stickers = false;
      }
      if (stickers && stickers.date > tsNow(true)) {
        return processRawStickers(stickers);
      }
      return MtpApiManager.invokeApi('messages.getAllStickers', {
        hash: stickers && stickers.hash || ''
      }).then(function (newStickers) {
        if (newStickers._ == 'messages.allStickersNotModified') {
          newStickers = stickers;
        }
        newStickers.date = tsNow(true) + 3600;
        newStickers.layer = layer;
        delete newStickers._;
        Storage.set({all_stickers: newStickers});

        return processRawStickers(newStickers);
      });
    })
  }

  function getStickersImages () {
    var promises = [];
    angular.forEach(currentStickers, function (docID) {
      var doc = AppDocsManager.getDoc(docID);
      var promise = MtpApiFileManager.downloadSmallFile(doc.thumb.location).then(function (blob) {
        if (WebpManager.isWebpSupported()) {
          return {
            id: docID,
            src: FileManager.getUrl(blob, 'image/webp')
          };
        }

        return FileManager.getByteArray(blob).then(function (bytes) {
          return {
            id: docID,
            src: WebpManager.getPngUrlFromData(bytes)
          };
        });
      });
      promises.push(promise);
    });
    return $q.all(promises);
  }
})

.service('ApiUpdatesManager', function ($rootScope, MtpNetworkerFactory, AppUsersManager, AppChatsManager, AppPeersManager, MtpApiManager) {

  var curState = {};

  var myID = 0;
  MtpApiManager.getUserID().then(function (id) {
    myID = id;
  });

  var syncPending = false;
  var syncLoading = true;
  var pendingSeqUpdates = {};
  var pendingPtsUpdates = [];

  function popPendingSeqUpdate () {
    var nextSeq = curState.seq + 1,
        pendingUpdatesData = pendingSeqUpdates[nextSeq];
    if (!pendingUpdatesData) {
      return false;
    }
    var updates = pendingUpdatesData.updates;
    var i, length;
    for (var i = 0, length = updates.length; i < length; i++) {
      saveUpdate(updates[i]);
    }
    curState.seq = pendingUpdatesData.seq;
    if (pendingUpdatesData.date && curState.date < pendingUpdatesData.date) {
      curState.date = pendingUpdatesData.date;
    }
    delete pendingSeqUpdates[nextSeq];

    if (!popPendingSeqUpdate() &&
        syncPending &&
        syncPending.seqAwaiting &&
        curState.seq >= syncPending.seqAwaiting) {
      if (!syncPending.ptsAwaiting) {
        clearTimeout(syncPending.timeout);
        syncPending = false;
      } else {
        delete syncPending.seqAwaiting;
      }
    }

    return true;
  }

  function popPendingPtsUpdate () {
    if (!pendingPtsUpdates.length) {
      return false;
    }
    pendingPtsUpdates.sort(function (a, b) {
      return a.pts - b.pts;
    });

    var curPts = curState.pts;
    var goodPts = false;
    var goodIndex = false;
    var update;
    for (var i = 0, length = pendingPtsUpdates.length; i < length; i++) {
      update = pendingPtsUpdates[i];
      curPts += update.pts_count;
      if (curPts >= update.pts) {
        goodPts = update.pts;
        goodIndex = i;
      }
    }

    if (!goodPts) {
      return false;
    }

    curState.pts = goodPts;
    for (i = 0; i <= goodIndex; i++) {
      update = pendingPtsUpdates[i];
      saveUpdate(update);
    }
    pendingPtsUpdates.splice(goodIndex, length - goodIndex);

    if (!pendingPtsUpdates.length && syncPending) {
      if (!syncPending.seqAwaiting) {
        clearTimeout(syncPending.timeout);
        syncPending = false;
      } else {
        delete syncPending.ptsAwaiting;
      }
    }

    return true;
  }

  function forceGetDifference () {
    if (!syncLoading) {
      getDifference();
    }
  }

  function processUpdateMessage (updateMessage) {
    var processOpts = {
      date: updateMessage.date,
      seq: updateMessage.seq,
      seqStart: updateMessage.seq_start
    };

    switch (updateMessage._) {
      case 'updatesTooLong':
      case 'new_session_created':
        forceGetDifference();
        break;

      case 'updateShort':
        processUpdate(updateMessage.update, processOpts);
        break;


      case 'updateShortMessage':
      case 'updateShortChatMessage':
        var isOut  = updateMessage.flags & 2;
        var fromID = updateMessage.from_id || (isOut ? myID : updateMessage.user_id);
        var toID   = updateMessage.chat_id
                       ? -updateMessage.chat_id
                       : (isOut ? updateMessage.user_id : myID);

        processUpdate({
          _: 'updateNewMessage',
          message: {
            _: 'message',
            flags: updateMessage.flags,
            id: updateMessage.id,
            from_id: fromID,
            to_id: AppPeersManager.getOutputPeer(toID),
            date: updateMessage.date,
            message: updateMessage.message,
            fwd_from_id: updateMessage.fwd_from_id,
            fwd_date: updateMessage.fwd_date,
            reply_to_msg_id: updateMessage.reply_to_msg_id,
          },
          pts: updateMessage.pts,
          pts_count: updateMessage.pts_count
        }, processOpts);
        break;

      case 'updatesCombined':
      case 'updates':
        AppUsersManager.saveApiUsers(updateMessage.users);
        AppChatsManager.saveApiChats(updateMessage.chats);

        angular.forEach(updateMessage.updates, function (update) {
          processUpdate(update, processOpts);
        });
        break;

      default:
        console.warn(dT(), 'Unknown update message', updateMessage);
    }
  }

  function getDifference () {
    if (!syncLoading) {
      syncLoading = true;
      pendingSeqUpdates = {};
      pendingPtsUpdates = [];
    }

    if (syncPending) {
      clearTimeout(syncPending.timeout);
      syncPending = false;
    }

    MtpApiManager.invokeApi('updates.getDifference', {pts: curState.pts, date: curState.date, qts: 0}).then(function (differenceResult) {
      if (differenceResult._ == 'updates.differenceEmpty') {
        console.log(dT(), 'apply empty diff', differenceResult.seq);
        curState.date = differenceResult.date;
        curState.seq = differenceResult.seq;
        syncLoading = false;
        return false;
      }

      AppUsersManager.saveApiUsers(differenceResult.users);
      AppChatsManager.saveApiChats(differenceResult.chats);

      // Should be first because of updateMessageID
      angular.forEach(differenceResult.other_updates, function(update){
        saveUpdate(update);
      });

      angular.forEach(differenceResult.new_messages, function (apiMessage) {
        saveUpdate({
          _: 'updateNewMessage',
          message: apiMessage,
          pts: curState.pts,
          pts_count: 0
        });
      });

      var nextState = differenceResult.intermediate_state || differenceResult.state;
      curState.seq = nextState.seq;
      curState.pts = nextState.pts;
      curState.date = nextState.date;

      console.log(dT(), 'apply diff', curState.seq, curState.pts);

      if (differenceResult._ == 'updates.differenceSlice') {
        getDifference();
      } else {
        syncLoading = false;
      }
    });
  }

  function processUpdate (update, options) {
    if (syncLoading) {
      return false;
    }
    if (update._ == 'updateNewMessage') {
      var message = update.message;
      if (message.from_id && !AppUsersManager.hasUser(message.from_id) ||
          message.fwd_from_id && !AppUsersManager.hasUser(message.fwd_from_id) ||
          message.to_id.user_id && !AppUsersManager.hasUser(message.to_id.user_id) ||
          message.to_id.chat_id && !AppChatsManager.hasChat(message.to_id.chat_id)) {
        console.warn(dT(), 'Short update not enough data', message);
        forceGetDifference();
        return false;
      }
    }

    var popPts, popSeq;

    if (update.pts) {
      var newPts = curState.pts + (update.pts_count || 0);
      if (newPts < update.pts) {
        console.log(dT(), 'Pts hole', curState, update);
        pendingPtsUpdates.push(update);
        if (!syncPending) {
          syncPending = {
            timeout: setTimeout(function () {
              getDifference();
            }, 5000)
          };
        }
        syncPending.ptsAwaiting = true;
        return false;
      }
      curState.pts = update.pts;
      popPts = true;
    }
    else if (options.seq > 0) {
      var seq = options.seq;
      var seqStart = options.seqStart || seq;

      if (seqStart != curState.seq + 1) {
        if (seqStart > curState.seq) {
          console.warn(dT(), 'Seq hole', curState, syncPending && syncPending.seqAwaiting);

          if (pendingSeqUpdates[seqStart] === undefined) {
            pendingSeqUpdates[seqStart] = {seq: seq, date: options.date, updates: []};
          }
          pendingSeqUpdates[seqStart].updates.push(update);

          if (!syncPending) {
            syncPending = {
              timeout: setTimeout(function () {
                getDifference();
              }, 5000)
            };
          }
          if (!syncPending.seqAwaiting ||
              syncPending.seqAwaiting < seqStart) {
            syncPending.seqAwaiting = seqStart;
          }
          return false;
        }
      }

      if (curState.seq != seq) {
        curState.seq = seq;
        if (options.date && curState.date < options.date) {
          curState.date = options.date;
        }
        popSeq = true;
      }
    }


    saveUpdate (update);


    if (popPts) {
      popPendingPtsUpdate();
    }
    else if (popSeq) {
      popPendingSeqUpdate();
    }
  }

  function saveUpdate (update) {
    $rootScope.$broadcast('apiUpdate', update);
  }

  function attach () {
    MtpNetworkerFactory.setUpdatesProcessor(processUpdateMessage);
    MtpApiManager.invokeApi('updates.getState', {}, {noErrorBox: true}).then(function (stateResult) {
      curState.seq = stateResult.seq;
      curState.pts = stateResult.pts;
      curState.date = stateResult.date;
      setTimeout(function () {
        syncLoading = false;
      }, 1000);
    })
  }


  return {
    processUpdateMessage: processUpdateMessage,
    attach: attach
  }
})

.service('RichTextProcessor', function ($sce, $sanitize) {

  var emojiMap = {},
      emojiData = Config.Emoji,
      emojiIconSize = 18,
      emojiSupported = navigator.userAgent.search(/OS X|iPhone|iPad|iOS|Android/i) != -1,
      emojiCode;

  var emojiRegex = '\\u0023\\u20E3|\\u00a9|\\u00ae|\\u203c|\\u2049|\\u2139|[\\u2194-\\u2199]|\\u21a9|\\u21aa|\\u231a|\\u231b|\\u23e9|[\\u23ea-\\u23ec]|\\u23f0|\\u24c2|\\u25aa|\\u25ab|\\u25b6|\\u2611|\\u2614|\\u26fd|\\u2705|\\u2709|[\\u2795-\\u2797]|\\u27a1|\\u27b0|\\u27bf|\\u2934|\\u2935|[\\u2b05-\\u2b07]|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55|\\u3030|\\u303d|\\u3297|\\u3299|[\\uE000-\\uF8FF\\u270A-\\u2764\\u2122\\u25C0\\u25FB-\\u25FE\\u2615\\u263a\\u2648-\\u2653\\u2660-\\u2668\\u267B\\u267F\\u2693\\u261d\\u26A0-\\u26FA\\u2708\\u2702\\u2601\\u260E]|[\\u2600\\u26C4\\u26BE\\u23F3\\u2764]|\\uD83D[\\uDC00-\\uDFFF]|\\uD83C[\\uDDE8-\\uDDFA\uDDEC]\\uD83C[\\uDDEA-\\uDDFA\uDDE7]|[0-9]\\u20e3|\\uD83C[\\uDC00-\\uDFFF]';

  for (emojiCode in emojiData) {
    emojiMap[emojiData[emojiCode][0]] = emojiCode;
  }

  var regexAlphaChars = "a-z" +
                        "\\u00c0-\\u00d6\\u00d8-\\u00f6\\u00f8-\\u00ff" + // Latin-1
                        "\\u0100-\\u024f" + // Latin Extended A and B
                        "\\u0253\\u0254\\u0256\\u0257\\u0259\\u025b\\u0263\\u0268\\u026f\\u0272\\u0289\\u028b" + // IPA Extensions
                        "\\u02bb" + // Hawaiian
                        "\\u0300-\\u036f" + // Combining diacritics
                        "\\u1e00-\\u1eff" + // Latin Extended Additional (mostly for Vietnamese)
                        "\\u0400-\\u04ff\\u0500-\\u0527" +  // Cyrillic
                        "\\u2de0-\\u2dff\\ua640-\\ua69f" +  // Cyrillic Extended A/B
                        "\\u0591-\\u05bf\\u05c1-\\u05c2\\u05c4-\\u05c5\\u05c7" +
                        "\\u05d0-\\u05ea\\u05f0-\\u05f4" + // Hebrew
                        "\\ufb1d-\\ufb28\\ufb2a-\\ufb36\\ufb38-\\ufb3c\\ufb3e\\ufb40-\\ufb41" +
                        "\\ufb43-\\ufb44\\ufb46-\\ufb4f" + // Hebrew Pres. Forms
                        "\\u0610-\\u061a\\u0620-\\u065f\\u066e-\\u06d3\\u06d5-\\u06dc" +
                        "\\u06de-\\u06e8\\u06ea-\\u06ef\\u06fa-\\u06fc\\u06ff" + // Arabic
                        "\\u0750-\\u077f\\u08a0\\u08a2-\\u08ac\\u08e4-\\u08fe" + // Arabic Supplement and Extended A
                        "\\ufb50-\\ufbb1\\ufbd3-\\ufd3d\\ufd50-\\ufd8f\\ufd92-\\ufdc7\\ufdf0-\\ufdfb" + // Pres. Forms A
                        "\\ufe70-\\ufe74\\ufe76-\\ufefc" + // Pres. Forms B
                        "\\u200c" +                        // Zero-Width Non-Joiner
                        "\\u0e01-\\u0e3a\\u0e40-\\u0e4e" + // Thai
                        "\\u1100-\\u11ff\\u3130-\\u3185\\uA960-\\uA97F\\uAC00-\\uD7AF\\uD7B0-\\uD7FF" + // Hangul (Korean)
                        "\\u3003\\u3005\\u303b" +           // Kanji/Han iteration marks
                        "\\uff21-\\uff3a\\uff41-\\uff5a" +  // full width Alphabet
                        "\\uff66-\\uff9f" +                 // half width Katakana
                        "\\uffa1-\\uffdc";                  // half width Hangul (Korean)

  var regexAlphaNumericChars  = "0-9\.\_" + regexAlphaChars;

  // Based on Regular Expression for URL validation by Diego Perini
  var urlRegex =  "((?:https?|ftp)://|mailto:)?" +
    // user:pass authentication
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // sindresorhus/ip-regex
      "(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}" +
    "|" +
      // host name
      "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[" + regexAlphaChars + "0-9]+)" +
      // domain name
      "(?:\\.(?:[" + regexAlphaChars + "]-*)*[" + regexAlphaChars + "0-9]+)*" +
      // TLD identifier
      "(?:\\.(xn--[0-9a-z]{2,16}|[" + regexAlphaChars + "]{2,24}))" +
    ")" +
    // port number
    "(?::\\d{2,5})?" +
    // resource path
    "(?:/(?:\\S*[^\\s.;,(\\[\\]{}<>\"'])?)?";

  var regExp = new RegExp('(^|\\s)((?:https?://)?telegram\\.me/|@)([a-zA-Z\\d_]{5,32})|(' + urlRegex + ')|(\\n)|(' + emojiRegex + ')|(^|\\s)(#[' + regexAlphaNumericChars + ']{2,20})', 'i');

  var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?youtu(?:|\.be|be\.com|\.b)(?:\/v\/|\/watch\\?v=|e\/|(?:\/\??#)?\/watch(?:.+)v=)(.{11})(?:\&[^\s]*)?/;
  var vimeoRegex = /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
  var instagramRegex = /^https?:\/\/(?:instagr\.am\/p\/|instagram\.com\/p\/)([a-zA-Z0-9\-\_]+)/i;
  var vineRegex = /^https?:\/\/vine\.co\/v\/([a-zA-Z0-9\-\_]+)/i;
  var twitterRegex = /^https?:\/\/twitter\.com\/.+?\/status\/\d+/i;
  var facebookRegex = /^https?:\/\/(?:www\.|m\.)?facebook\.com\/(?:.+?\/posts\/\d+|(?:story\.php|permalink\.php)\?story_fbid=(\d+)(?:&substory_index=\d+)?&id=(\d+))/i;
  var gplusRegex = /^https?:\/\/plus\.google\.com\/\d+\/posts\/[a-zA-Z0-9\-\_]+/i;
  var soundcloudRegex = /^https?:\/\/(?:soundcloud\.com|snd\.sc)\/([a-zA-Z0-9%\-\_]+)\/([a-zA-Z0-9%\-\_]+)/i;
  var spotifyRegex = /(https?:\/\/(open\.spotify\.com|play\.spotify\.com|spoti\.fi)\/(.+)|spotify:(.+))/i;


  return {
    wrapRichText: wrapRichText,
    wrapPlainText: wrapPlainText
  };

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

    var match,
        raw = text,
        html = [],
        url,
        emojiFound = false,
        emojiTitle,
        emojiCoords;

    // var start = tsNow();

    while ((match = raw.match(regExp))) {
      html.push(encodeEntities(raw.substr(0, match.index)));

      if (match[3]) { // telegram.me links
        if (!options.noLinks) {
          var attr = '';
          if (options.highlightUsername &&
              options.highlightUsername.toLowerCase() == match[3].toLowerCase() &&
              match[2] == '@') {
            attr = 'class="im_message_mymention"';
          }
          html.push(
            match[1],
            '<a ' + attr + ' href="#/im?p=',
            encodeURIComponent('@' + match[3]),
            '">',
            encodeEntities(match[2] + match[3]),
            '</a>'
          );
        } else {
          html.push(
            match[1],
            encodeEntities(match[2] + match[3])
          );
        }
      }
      else if (match[4]) { // URL & e-mail
        if (!options.noLinks) {
          if (emailRegex.test(match[4])) {
            html.push(
              '<a href="',
              encodeEntities('mailto:' + match[4]),
              '" target="_blank">',
              encodeEntities(match[4]),
              '</a>'
            );
          } else {
            var url = false,
                protocol = match[5],
                tld = match[6],
                excluded = '';

            if (tld) {
              if (!protocol && (tld.substr(0, 4) === 'xn--' || Config.TLD.indexOf(tld.toLowerCase()) !== -1)) {
                protocol = 'http://';
              }

              if (protocol) {
                var balanced = checkBrackets(match[4]);

                if (balanced.length !== match[4].length) {
                  excluded = match[4].substring(balanced.length);
                  match[4] = balanced;
                }

                url = (match[5] ? '' : protocol) + match[4];
              }
            } else { // IP address
              url = (match[5] ? '' : 'http://') + match[4];
            }

            if (url) {
              html.push(
                '<a href="',
                encodeEntities(url),
                '" target="_blank">',
                encodeEntities(match[4]),
                '</a>',
                excluded
              );

              if (options.extractUrlEmbed &&
                  !options.extractedUrlEmbed) {
                options.extractedUrlEmbed = findExternalEmbed(url);
              }
            } else {
              html.push(encodeEntities(match[0]));
            }
          }
        } else {
          html.push(encodeEntities(match[0]));
        }
      }
      else if (match[7]) { // New line
        if (!options.noLinebreaks) {
          html.push('<br/>');
        } else {
          html.push(' ');
        }
      }
      else if (match[8]) {
        if ((emojiCode = emojiMap[match[8]]) &&
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
          html.push(encodeEntities(match[8]));
        }
      }
      else if (match[10]) {
        if (!options.noLinks) {
          html.push(
            encodeEntities(match[9]),
            '<a href="#/im?q=',
            encodeURIComponent(match[10]),
            '">',
            encodeEntities(match[10]),
            '</a>'
          );
        } else {
          html.push(
            encodeEntities(match[9]),
            encodeEntities(match[10])
          );
        }
      }
      raw = raw.substr(match.index + match[0].length);
    }

    html.push(encodeEntities(raw));

    // var timeDiff = tsNow() - start;
    // if (timeDiff > 1) {
    //   console.log(dT(), 'wrap text', text.length, timeDiff);
    // }

    text = $sanitize(html.join(''));

    // console.log(3, text, html);

    if (emojiFound) {
      text = text.replace(/\ufe0f|&#65039;/g, '', text);
      text = text.replace(/<span class="emoji emoji-(\d)-(\d+)-(\d+)"(.+?)<\/span>/g,
                          '<span class="emoji emoji-spritesheet-$1" style="background-position: -$2px -$3px;" $4</span>');
    }

    return $sce.trustAs('html', text);
  }

  function checkBrackets(url) {
    var urlLength = url.length,
        urlOpenBrackets = url.split('(').length - 1,
        urlCloseBrackets = url.split(')').length - 1;

    while (urlCloseBrackets > urlOpenBrackets &&
           url.charAt(urlLength - 1) === ')') {
      url = url.substr(0, urlLength - 1);
      urlCloseBrackets--;
      urlLength--;
    }
    if (urlOpenBrackets > urlCloseBrackets) {
      url = url.replace(/\)+$/, '');
    }
    return url;
  }

  function findExternalEmbed(url) {
    var embedUrlMatches,
        result;

    if (embedUrlMatches = url.match(youtubeRegex)) {
      return ['youtube', embedUrlMatches[1]];
    }
    if (embedUrlMatches = url.match(vimeoRegex)) {
      return ['vimeo', embedUrlMatches[1]];
    }
    else if (embedUrlMatches = url.match(instagramRegex)) {
      return ['instagram', embedUrlMatches[1]];
    }
    else if (embedUrlMatches = url.match(vineRegex)) {
      return ['vine', embedUrlMatches[1]];
    }
    else if (embedUrlMatches = url.match(soundcloudRegex)) {
      var badFolders = 'explore,upload,pages,terms-of-use,mobile,jobs,imprint'.split(',');
      var badSubfolders = 'sets'.split(',');
      if (badFolders.indexOf(embedUrlMatches[1]) == -1 &&
          badSubfolders.indexOf(embedUrlMatches[2]) == -1) {
        return ['soundcloud', embedUrlMatches[0]];
      }
    }
    else if (embedUrlMatches = url.match(spotifyRegex)) {
      return ['spotify', embedUrlMatches[3].replace('/', ':')];
    }

    if (!Config.Modes.chrome_packed) { // Need external JS
      if (embedUrlMatches = url.match(twitterRegex)) {
        return ['twitter', embedUrlMatches[0]];
      }
      else if (embedUrlMatches = url.match(facebookRegex)) {
        if (embedUrlMatches[2]!= undefined){
          return ['facebook', "https://www.facebook.com/"+embedUrlMatches[2]+"/posts/"+embedUrlMatches[1]];
        }
        return ['facebook', embedUrlMatches[0]];
      }
      // Sorry, GPlus widget has no `xfbml.render` like callback and is too wide.
      // else if (embedUrlMatches = url.match(gplusRegex)) {
      //   return ['gplus', embedUrlMatches[0]];
      // }
    }

    return false;
  }

  function wrapPlainText (text, options) {
    if (emojiSupported) {
      return text;
    }
    if (!text || !text.length) {
      return '';
    }

    options = options || {};

    text = text.replace(/\ufe0f/g, '', text);

    var match,
        raw = text,
        text = [],
        emojiTitle;

    while ((match = raw.match(regExp))) {
      text.push(raw.substr(0, match.index));

      if (match[8]) {
        if ((emojiCode = emojiMap[match[8]]) &&
            (emojiTitle = emojiData[emojiCode][1][0])) {
          text.push(':' + emojiTitle + ':');
        } else {
          text.push(match[0]);
        }
      } else {
        text.push(match[0]);
      }
      raw = raw.substr(match.index + match[0].length);
    }
    text.push(raw);

    return text.join('');
  }

})

.service('StatusManager', function ($timeout, $rootScope, MtpApiManager, AppUsersManager, IdleManager) {

  var toPromise;
  var lastOnlineUpdated = 0;
  var started = false;
  var myID = 0;
  var myOtherDeviceActive = false;

  MtpApiManager.getUserID().then(function (id) {
    myID = id;
  });

  $rootScope.$on('apiUpdate', function (e, update) {
    if (update._ == 'updateUserStatus' && update.user_id == myID) {
      myOtherDeviceActive = tsNow() + (update.status._ == 'userStatusOnline' ? 300000 : 0);
    }
  });

  return {
    start: start,
    isOtherDeviceActive: isOtherDeviceActive
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
    AppUsersManager.setUserStatus(myID, offline);
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

  function isOtherDeviceActive() {
    if (!myOtherDeviceActive) {
      return false;
    }
    if (tsNow() > myOtherDeviceActive) {
      myOtherDeviceActive = false;
      return false;
    }
    return true;
  }

})

.service('NotificationsManager', function ($rootScope, $window, $interval, $q, _, MtpApiManager, AppPeersManager, IdleManager, Storage, AppRuntimeManager) {

  navigator.vibrate = navigator.vibrate || navigator.mozVibrate || navigator.webkitVibrate;

  var notificationsMsSiteMode = false;
  try {
    if (window.external && window.external.msIsSiteMode()) {
      notificationsMsSiteMode = true;
    }
  } catch (e) {};

  var notificationsUiSupport = notificationsMsSiteMode ||
                               ('Notification' in window) ||
                               ('mozNotification' in navigator);
  var notificationsShown = {};
  var notificationIndex = 0;
  var notificationsCount = 0;
  var vibrateSupport = !!navigator.vibrate;
  var nextSoundAt = false;
  var prevSoundVolume = false;
  var peerSettings = {};
  var faviconEl = $('link[rel="icon"]:first')[0];
  var langNotificationsPluralize = _.pluralize('page_title_pluralize_notifications');

  var titleBackup = document.title,
      titleChanged = false,
      titlePromise;
  var prevFavicon;

  $rootScope.$watch('idle.isIDLE', function (newVal) {
    if (!newVal) {
      notificationsClear();
    }
    if (!Config.Navigator.mobile) {
      $interval.cancel(titlePromise);
      if (!newVal) {
        titleChanged = false;
        document.title = titleBackup;
        setFavicon();
      } else {
        titleBackup = document.title;

        titlePromise = $interval(function () {
          var time = tsNow();
          if (!notificationsCount || time % 2000 > 1000) {
            if (titleChanged) {
              titleChanged = false;
              document.title = titleBackup;
              setFavicon();
            }
          } else {
            titleChanged = true;
            document.title = langNotificationsPluralize(notificationsCount);
            setFavicon('favicon_unread.ico');
          }
        }, 1000);
      }
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

  var registeredDevice = false;
  if (window.navigator.mozSetMessageHandler) {
    window.navigator.mozSetMessageHandler('push', function(e) {
      console.log(dT(), 'received push', e);
      $rootScope.$broadcast('push_received');
    });

    window.navigator.mozSetMessageHandler('push-register', function(e) {
      console.log(dT(), 'received push', e);
      registeredDevice = false;
      registerDevice();
    });
  }

  return {
    start: start,
    notify: notify,
    cancel: notificationCancel,
    clear: notificationsClear,
    getPeerSettings: getPeerSettings,
    getPeerMuted: getPeerMuted,
    savePeerSettings: savePeerSettings,
    updatePeerSettings: updatePeerSettings,
    getVibrateSupport: getVibrateSupport,
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

  function setFavicon (href) {
    href = href || 'favicon.ico';
    if (prevFavicon === href) {
      return
    }
    var link = document.createElement('link');
    link.rel = 'shortcut icon';
    link.type = 'image/x-icon';
    link.href = href;
    faviconEl.parentNode.replaceChild(link, faviconEl);
    faviconEl = link;

    prevFavicon = href
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
    registerDevice();
    if (!notificationsUiSupport) {
      return false;
    }

    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      $($window).on('click', requestPermission);
    }


    try {
      if ('onbeforeunload' in window) {
        $($window).on('beforeunload', notificationsClear);
      }
    } catch (e) {}
  }

  function requestPermission() {
    Notification.requestPermission();
    $($window).off('click', requestPermission);
  }

  function notify (data) {
    // console.log('notify', $rootScope.idle.isIDLE, notificationsUiSupport);

    // FFOS Notification blob src bug workaround
    if (Config.Navigator.ffos) {
      data.image = 'https://raw.githubusercontent.com/zhukov/webogram/master/app/img/icons/icon60.png';
    }
    else if (!data.image) {
      data.image = 'img/icons/icon60.png';
    }

    notificationsCount++;

    Storage.get('notify_nosound', 'notify_volume').then(function (settings) {
      if (!settings[0] && settings[1] === false || settings[1] > 0) {
        playSound(settings[1] || 0.5);
      }
    })

    if (!notificationsUiSupport ||
        'Notification' in window && Notification.permission !== 'granted') {
      return false;
    }

    Storage.get('notify_nodesktop', 'notify_novibrate').then(function (settings) {
      if (settings[0]) {
        if (vibrateSupport && !settings[1]) {
          navigator.vibrate([200, 100, 200]);
          return;
        }
        return;
      }
      var idx = ++notificationIndex,
          key = data.key || 'k' + idx,
          notification;

      if ('Notification' in window) {
        notification = new Notification(data.title, {
          icon: data.image || '',
          body: data.message || '',
          tag: data.tag || ''
        });
      }
      else if ('mozNotification' in navigator) {
        notification = navigator.mozNotification.createNotification(data.title, data.message || '', data.image || '');
      }
      else if (notificationsMsSiteMode) {
        window.external.msSiteModeClearIconOverlay();
        window.external.msSiteModeSetIconOverlay('img/icons/icon16.png', data.title);
        window.external.msSiteModeActivate();
        notification = {
          index: idx
        };
      }
      else {
        return;
      }

      notification.onclick = function () {
        notification.close();
        AppRuntimeManager.focus();
        notificationsClear();
        if (data.onclick) {
          data.onclick();
        }
      };

      notification.onclose = function () {
        delete notificationsShown[key];
        notificationsClear();
      };

      if (notification.show) {
        notification.show();
      }
      notificationsShown[key] = notification;
    });
  };

  function playSound (volume) {
    var now = tsNow();
    if (nextSoundAt && now < nextSoundAt && prevSoundVolume == volume) {
      return;
    }
    nextSoundAt = now + 1000;
    prevSoundVolume = volume;
    var filename = 'img/sound_a.mp3';
    var obj = $('#notify_sound').html('<audio autoplay="autoplay">' +
        '<source src="' + filename + '" type="audio/mpeg" />' +
        '<embed hidden="true" autostart="true" loop="false" volume="' + (volume * 100) +'" src="' + filename +'" />' +
        '</audio>');
    obj.find('audio')[0].volume = volume;
  }

  function notificationCancel (key) {
    var notification = notificationsShown[key];
    if (notification) {
      if (notificationsCount > 0) {
        notificationsCount--;
      }
      try {
        if (notification.close) {
          notification.close();
        }
        else if (notificationsMsSiteMode &&
                 notification.index == notificationIndex) {
          window.external.msSiteModeClearIconOverlay();
        }
      } catch (e) {}
      delete notificationsCount[key];
    }
  }

  function notificationsClear() {
    if (notificationsMsSiteMode) {
      window.external.msSiteModeClearIconOverlay();
    } else {
      angular.forEach(notificationsShown, function (notification) {
        try {
          if (notification.close) {
            notification.close()
          }
        } catch (e) {}
      });
    }
    notificationsShown = {};
    notificationsCount = 0;
  }

  var registerDevicePeriod = 1000,
      registerDeviceTO;
  function registerDevice () {
    if (registeredDevice) {
      return false;
    }
    if (navigator.push && Config.Navigator.ffos && Config.Modes.packed) {
      var req = navigator.push.register();

      req.onsuccess = function(e) {
        clearTimeout(registerDeviceTO);
        console.log(dT(), 'Push registered', req.result);
        registeredDevice = req.result;
        MtpApiManager.invokeApi('account.registerDevice', {
          token_type: 4,
          token: registeredDevice,
          device_model: navigator.userAgent || 'Unknown UserAgent',
          system_version: navigator.platform  || 'Unknown Platform',
          app_version: Config.App.version,
          app_sandbox: false,
          lang_code: navigator.language || 'en'
        });
      }

      req.onerror = function(e) {
        console.error('Push register error', e, e.toString());
        registerDeviceTO = setTimeout(registerDevice, registerDevicePeriod);
        registerDevicePeriod = Math.min(30000, registerDevicePeriod * 1.5);
      }
    }
  }

  function unregisterDevice () {
    if (!registeredDevice) {
      return false;
    }
    MtpApiManager.invokeApi('account.unregisterDevice', {
      token_type: 4,
      token: registeredDevice
    }).then(function () {
      registeredDevice = false;
    })
  }

  function getVibrateSupport () {
    return vibrateSupport;
  }

})


.service('ErrorService', function ($rootScope, $modal, $window) {

  var shownBoxes = 0;

  function show (params, options) {
    if (shownBoxes >= 1) {
      console.log('Skip error box, too many open', shownBoxes, params, options);
      return false;
    }

    options = options || {};
    var scope = $rootScope.$new();
    angular.extend(scope, params);

    shownBoxes++;
    var modal = $modal.open({
      templateUrl: templateUrl('error_modal'),
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
      templateUrl: templateUrl('confirm_modal'),
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
    scope.multiSelect = false;
    if (options) {
      angular.extend(scope, options);
    }

    return $modal.open({
      templateUrl: templateUrl('peer_select'),
      controller: 'PeerSelectController',
      scope: scope,
      windowClass: 'peer_select_window mobile_modal'
    }).result;
  }

  function selectPeers (options) {
    if (Config.Mobile) {
      return selectPeer(options).then(function (peerString) {
        return [peerString];
      });
    }

    var scope = $rootScope.$new();
    scope.multiSelect = true;
    if (options) {
      angular.extend(scope, options);
    }

    return $modal.open({
      templateUrl: templateUrl('peer_select'),
      controller: 'PeerSelectController',
      scope: scope,
      windowClass: 'peer_select_window mobile_modal'
    }).result;
  }


  return {
    selectPeer: selectPeer,
    selectPeers: selectPeers
  }
})


.service('ContactsSelectService', function ($rootScope, $modal) {

  function select (multiSelect, options) {
    options = options || {};

    var scope = $rootScope.$new();
    scope.multiSelect = multiSelect;
    angular.extend(scope, options);
    if (!scope.action && multiSelect) {
      scope.action = 'select';
    }

    return $modal.open({
      templateUrl: templateUrl('contacts_modal'),
      controller: 'ContactsModalController',
      scope: scope,
      windowClass: 'contacts_modal_window mobile_modal'
    }).result;
  }


  return {
    selectContacts: function (options) {
      return select (true, options);
    },
    selectContact: function (options) {
      return select (false, options);
    }
  }
})


.service('ChangelogNotifyService', function (Storage, $rootScope, $modal) {

  function checkUpdate () {
    Storage.get('last_version').then(function (lastVersion) {
      if (lastVersion != Config.App.version) {
        if (lastVersion) {
          showChangelog(lastVersion);
        }
        Storage.set({last_version: Config.App.version});
      }
    })
  }

  function showChangelog (lastVersion) {
    var $scope = $rootScope.$new();
    $scope.lastVersion = lastVersion;

    $modal.open({
      controller: 'ChangelogModalController',
      templateUrl: templateUrl('changelog_modal'),
      scope: $scope,
      windowClass: 'changelog_modal_window mobile_modal'
    });
  }

  return {
    checkUpdate: checkUpdate,
    showChangelog: showChangelog
  }
})

.service('HttpsMigrateService', function (ErrorService, Storage) {

  var started = false;

  function check () {
    Storage.get('https_dismiss').then(function (ts) {
      if (!ts || tsNow() > ts + 43200000) {
        ErrorService.confirm({
          type: 'MIGRATE_TO_HTTPS'
        }).then(function () {
          var popup;
          try {
            popup = window.open('https://web.telegram.org', '_blank');
          } catch (e) {}
          if (!popup) {
            location = 'https://web.telegram.org';
          }
        }, function () {
          Storage.set({https_dismiss: tsNow()});
        });
      }
    });
  }

  function start () {
    if (started ||
        location.protocol != 'http:' ||
        Config.Modes.http ||
        Config.App.domains.indexOf(location.hostname) == -1) {
      return;
    }
    started = true;
    setTimeout(check, 120000);
  }

  return {
    start: start,
    check: check
  }
})


.service('LayoutSwitchService', function (ErrorService, Storage, AppRuntimeManager, $window) {

  var started = false;
  var confirmShown = false;

  function switchLayout(mobile) {
    ConfigStorage.noPrefix();
    Storage.set({
      layout_selected: mobile ? 'mobile' : 'desktop',
      layout_width: $(window).width()
    }).then(function () {
      AppRuntimeManager.reload();
    });
  }

  function layoutCheck (e) {
    if (confirmShown) {
      return;
    }
    var width = $(window).width();
    var newMobile = width < 600;
    if (!width ||
        !e && (Config.Navigator.mobile ? width <= 800 : newMobile)) {
      return;
    }
    if (newMobile != Config.Mobile) {
      ConfigStorage.noPrefix();
      Storage.get('layout_width').then(function (confirmedWidth) {
        if (width == confirmedWidth) {
          return false;
        }
        confirmShown = true;
        ErrorService.confirm({
          type: newMobile ? 'SWITCH_MOBILE_VERSION' : 'SWITCH_DESKTOP_VERSION'
        }).then(function () {
          switchLayout(newMobile);
        }, function () {
          ConfigStorage.noPrefix();
          Storage.set({layout_width: width});
          confirmShown = false;
        });
      });
    }
  }

  function start () {
    if (started || Config.Navigator.mobile) {
      return;
    }
    started = true;
    layoutCheck();
    $($window).on('resize', layoutCheck);
  }

  return {
    start: start,
    switchLayout: switchLayout
  }
})

.service('TelegramMeWebService', function (Storage) {

  var disabled =  Config.Modes.test ||
                  Config.App.domains.indexOf(location.hostname) == -1 ||
                  location.protocol != 'http:' && location.protocol != 'https:' ||
                  location.protocol == 'https:' && location.hostname != 'web.telegram.org';

  function sendAsyncRequest (canRedirect) {
    if (disabled) {
      return false;
    }
    Storage.get('tgme_sync').then(function (curValue) {
      var ts = tsNow(true);
      if (canRedirect &&
          curValue &&
          curValue.canRedirect == canRedirect &&
          curValue.ts + 86400 > ts) {
        return false;
      }
      Storage.set({tgme_sync: {canRedirect: canRedirect, ts: ts}});

      var script = $('<script>').appendTo('body')
      .on('load error', function() {
        script.remove();
      })
      .attr('src', '//telegram.me/_websync_?authed=' + (canRedirect ? '1' : '0'));
    });
  };

  return {
    setAuthorized: sendAsyncRequest
  };

})


.service('LocationParamsService', function ($rootScope, $routeParams, AppUsersManager) {

  function checkTgAddr () {
    if (!$routeParams.tgaddr) {
      return;
    }
    var matches = $routeParams.tgaddr.match(/^(web\+)?tg:(\/\/)?resolve\?domain=(.+)$/);
    if (matches && matches[3]) {
      AppUsersManager.resolveUsername(matches[3]).then(function (userID) {
        $rootScope.$broadcast('history_focus', {
          peerString: AppUsersManager.getUserString(userID)
        });
      });
    }
  }

  var started = !('registerProtocolHandler' in navigator);
  function start () {
    if (started) {
      return;
    }
    started = true;
    try {
      navigator.registerProtocolHandler('tg', '#im?tgaddr=%s', 'Telegram Web');
    } catch (e) {}
    try {
      navigator.registerProtocolHandler('web+tg', '#im?tgaddr=%s', 'Telegram Web');
    } catch (e) {}

    $rootScope.$on('$routeUpdate', checkTgAddr);
    checkTgAddr();
  };

  return {
    start: start
  };
})
