/*!
 * Webogram v0.5.2 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Services */

angular.module('myApp.services', ['myApp.i18n', 'izhukov.utils'])

.service('AppUsersManager', function ($rootScope, $modal, $modalStack, $filter, $q, qSync, MtpApiManager, RichTextProcessor, ErrorService, Storage, _) {
  var users = {},
      usernames = {},
      userAccess = {},
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

  function resolveUsername (username) {
    return usernames[username] || 0;
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
      var searchUsername = SearchIndexManager.cleanUsername(apiUser.username);
      usernames[searchUsername] = userID;
    }

    if (apiUser.pFlags === undefined) {
      apiUser.pFlags = {};
    }

    apiUser.sortName = apiUser.pFlags.deleted ? '' : SearchIndexManager.cleanSearchText(apiUser.first_name + ' ' + (apiUser.last_name || ''));

    var nameWords = apiUser.sortName.split(' ');
    var firstWord = nameWords.shift();
    var lastWord = nameWords.pop();
    apiUser.initials = firstWord.charAt(0) + (lastWord ? lastWord.charAt(0) : firstWord.charAt(1));

    if (apiUser.status) {
      if (apiUser.status.expires) {
        apiUser.status.expires -= serverTimeOffset;
      }
      if (apiUser.status.was_online) {
        apiUser.status.was_online -= serverTimeOffset;
      }
    }
    if (apiUser.pFlags.bot) {
      apiUser.sortStatus = -1;
    } else {
      apiUser.sortStatus = getUserStatusForSort(apiUser.status);
    }

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

  function saveUserAccess (id, accessHash) {
    userAccess[id] = accessHash;
  }

  function getUserStatusForSort(status) {
    if (status) {
      var expires = status.expires || status.was_online;
      if (expires) {
        return expires;
      }
      var timeNow = tsNow(true);
      switch (status._) {
        case 'userStatusRecently':
          return timeNow - 86400 * 3;
        case 'userStatusLastWeek':
          return timeNow - 86400 * 7;
        case 'userStatusLastMonth':
          return timeNow - 86400 * 30;
      }
    }

    return 0;
  }

  function getUser (id) {
    if (angular.isObject(id)) {
      return id;
    }
    return users[id] || {id: id, deleted: true, num: 1, access_hash: userAccess[id]};
  }

  function getSelf() {
    return getUser(myID);
  }

  function isBot(id) {
    return users[id] && users[id].pFlags.bot;
  }

  function hasUser(id) {
    return angular.isObject(users[id]);
  }

  function getUserPhoto(id) {
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
      placeholder: 'img/placeholders/UserAvatar' + user.num + '@2x.png',
      location: cachedPhotoLocations[id]
    };
  }

  function getUserString (id) {
    var user = getUser(id);
    return 'u' + id + (user.access_hash ? '_' + user.access_hash : '');
  }

  function getUserInput (id) {
    var user = getUser(id);
    if (user.pFlags.self) {
      return {_: 'inputUserSelf'};
    }
    return {
      _: 'inputUser',
      user_id: id,
      access_hash: user.access_hash || 0
    };
  }

  function updateUsersStatuses () {
    var timestampNow = tsNow(true);
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
    if (isBot(id)) {
      return;
    }
    var user = getUser(id);
    if (user &&
        user.status &&
        user.status._ != 'userStatusOnline' &&
        user.status._ != 'userStatusEmpty') {

      var wasStatus;
      if (user.status._ != 'userStatusOffline') {
        delete user.status.wasStatus;
        wasStatus = angular.copy(user.status);
      }
      user.status = {
        _: 'userStatusOnline',
        expires: tsNow(true) + 60,
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
      windowClass: 'user_modal_window mobile_modal',
      backdrop: 'single'
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
      ids.push(getUserInput(userID))
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
    if (isBot(userID)) {
      return;
    }
    var user = users[userID];
    if (user) {
      var status = offline ? {
          _: 'userStatusOffline',
          was_online: tsNow(true)
        } : {
          _: 'userStatusOnline',
          expires: tsNow(true) + 500
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
          if (user.status) {
            if (user.status.expires) {
              user.status.expires -= serverTimeOffset;
            }
            if (user.status.was_online) {
              user.status.was_online -= serverTimeOffset;
            }
          }
          user.sortStatus = getUserStatusForSort(user.status);
          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updateUserPhoto':
        var userID = update.user_id;
        var user = users[userID];
        if (user) {
          forceUserOnline(userID);
          if (!user.photo) {
            user.photo = update.photo;
          } else {
            safeReplaceObject(user.photo, update.photo);
          }

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

  $rootScope.$on('user_auth', function (e, userAuth) {
    myID = userAuth && userAuth.id || 0;
  });


  setInterval(updateUsersStatuses, 60000);

  $rootScope.$on('stateSynchronized', updateUsersStatuses);

  return {
    getContacts: getContacts,
    saveApiUsers: saveApiUsers,
    saveApiUser: saveApiUser,
    saveUserAccess: saveUserAccess,
    getUser: getUser,
    getSelf: getSelf,
    getUserInput: getUserInput,
    setUserStatus: setUserStatus,
    forceUserOnline: forceUserOnline,
    getUserPhoto: getUserPhoto,
    getUserString: getUserString,
    getUserSearchText: getUserSearchText,
    hasUser: hasUser,
    isBot: isBot,
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

.service('AppChatsManager', function ($q, $rootScope, $modal, _, MtpApiManager, AppUsersManager, AppPhotosManager, RichTextProcessor) {
  var chats = {},
      usernames = {},
      channelAccess = {},
      megagroups = {},
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

    apiChat.num = (Math.abs(apiChat.id >> 1) % 8) + 1;

    if (apiChat.pFlags === undefined) {
      apiChat.pFlags = {};
    }

    if (apiChat.username) {
      var searchUsername = SearchIndexManager.cleanUsername(apiChat.username);
      usernames[searchUsername] = apiChat.id;
    }

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
    return chats[id] || {id: id, deleted: true, access_hash: channelAccess[id]};
  }

  function hasRights (id, action) {
    if (chats[id] === undefined) {
      return false;
    }
    var chat = getChat(id);
    if (chat._ == 'chatForbidden' ||
        chat._ == 'channelForbidden' ||
        chat.pFlags.kicked ||
        chat.pFlags.left) {
      return false;
    }
    if (chat.pFlags.creator) {
      return true;
    }

    switch (action) {
      case 'send':
        if (chat._ == 'channel' &&
            !chat.pFlags.megagroup &&
            !chat.pFlags.editor) {
          return false;
        }
        break;

      case 'edit_title':
      case 'edit_photo':
      case 'invite':
        if (chat._ == 'channel') {
          if (chat.pFlags.megagroup) {
            if (!chat.pFlags.editor) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          if (chat.pFlags.admins_enabled &&
              !chat.pFlags.admin) {
            return false;
          }
        }
        break;
    }
    return true;
  }

  function resolveUsername (username) {
    return usernames[username] || 0;
  }

  function saveChannelAccess (id, accessHash) {
    channelAccess[id] = accessHash;
  }

  function saveIsMegagroup (id) {
    megagroups[id] = true;
  }

  function isChannel (id) {
    var chat = chats[id];
    if (chat && (chat._ == 'channel' || chat._ == 'channelForbidden') ||
        channelAccess[id]) {
      return true;
    }
    return false;
  }

  function isMegagroup (id) {
    if (megagroups[id]) {
      return true;
    }
    var chat = chats[id];
    if (chat && chat._ == 'channel' && chat.pFlags.megagroup) {
      return true;
    }
    return false;
  }

  function getChatInput (id) {
    return id || 0;
  }

  function getChannelInput (id) {
    if (!id) {
      return {_: 'inputChannelEmpty'};
    }
    return {
      _: 'inputChannel',
      channel_id: id,
      access_hash: getChat(id).access_hash || channelAccess[id] || 0
    }
  }

  function hasChat (id) {
    return angular.isObject(chats[id]);
  }

  function getChatPhoto(id) {
    var chat = getChat(id);

    if (cachedPhotoLocations[id] === undefined) {
      cachedPhotoLocations[id] = chat && chat.photo && chat.photo.photo_small || {empty: true};
    }

    return {
      placeholder: 'img/placeholders/GroupAvatar' + Math.ceil(chat.num / 2) + '@2x.png',
      location: cachedPhotoLocations[id]
    };
  }

  function getChatString (id) {
    var chat = getChat(id);
    if (isChannel(id)) {
      return (isMegagroup(id) ? 's' : 'c') + id + '_' + chat.access_hash;
    }
    return 'g' + id;
  }

  function wrapForFull (id, fullChat) {
    var chatFull = angular.copy(fullChat),
        chat = getChat(id);

    if (chatFull.participants && chatFull.participants._ == 'chatParticipants') {
      MtpApiManager.getUserID().then(function (myID) {
        var isAdmin = chat.pFlags.creator || chat.pFlags.admins_enabled && chat.pFlags.admin;
        angular.forEach(chatFull.participants.participants, function(participant){
          participant.canLeave = myID == participant.user_id;
          participant.canKick = !participant.canLeave && (
                                  chat.pFlags.creator ||
                                  participant._ == 'chatParticipant' && (isAdmin || myID == participant.inviter_id)
                                );

          // just for order by last seen
          participant.user = AppUsersManager.getUser(participant.user_id);
        });
      });
    }
    if (chatFull.participants && chatFull.participants._ == 'channelParticipants') {
      var isAdmin = chat.pFlags.creator || chat.pFlags.editor || chat.pFlags.moderator;
      angular.forEach(chatFull.participants.participants, function(participant) {
        participant.canLeave = !chat.pFlags.creator && participant._ == 'channelParticipantSelf';
        participant.canKick = isAdmin && participant._ == 'channelParticipant';

        // just for order by last seen
        participant.user = AppUsersManager.getUser(participant.user_id);
      });
    }

    if (chatFull.about) {
      chatFull.rAbout = RichTextProcessor.wrapRichText(chatFull.about, {noLinebreaks: true});
    }

    chatFull.peerString = getChatString(id);
    chatFull.chat = chat;

    return chatFull;
  }

  function openChat (chatID, accessHash) {
    var scope = $rootScope.$new();
    scope.chatID = chatID;

    if (isChannel(chatID)) {
      var modalInstance = $modal.open({
        templateUrl: templateUrl('channel_modal'),
        controller: 'ChannelModalController',
        scope: scope,
        windowClass: 'chat_modal_window channel_modal_window mobile_modal'
      });
    } else {
      var modalInstance = $modal.open({
        templateUrl: templateUrl('chat_modal'),
        controller: 'ChatModalController',
        scope: scope,
        windowClass: 'chat_modal_window mobile_modal'
      });
    }
  }

  $rootScope.$on('apiUpdate', function (e, update) {
    // console.log('on apiUpdate', update);
    switch (update._) {
      case 'updateChannel':
        var channelID = update.channel_id;
        $rootScope.$broadcast('channel_settings', {channelID: channelID});
        break;
    }
  });

  return {
    saveApiChats: saveApiChats,
    saveApiChat: saveApiChat,
    getChat: getChat,
    isChannel: isChannel,
    isMegagroup: isMegagroup,
    hasRights: hasRights,
    saveChannelAccess: saveChannelAccess,
    saveIsMegagroup: saveIsMegagroup,
    getChatInput: getChatInput,
    getChannelInput: getChannelInput,
    getChatPhoto: getChatPhoto,
    getChatString: getChatString,
    resolveUsername: resolveUsername,
    hasChat: hasChat,
    wrapForFull: wrapForFull,
    openChat: openChat
  }
})

.service('AppPeersManager', function ($q, qSync, AppUsersManager, AppChatsManager, MtpApiManager) {

  function getInputPeer (peerString) {
    var firstChar = peerString.charAt(0),
        peerParams = peerString.substr(1).split('_');

    if (firstChar == 'u') {
      AppUsersManager.saveUserAccess(peerParams[0], peerParams[1]);
      return {
        _: 'inputPeerUser',
        user_id: peerParams[0],
        access_hash: peerParams[1]
      };
    }
    else if (firstChar == 'c' || firstChar == 's') {
      AppChatsManager.saveChannelAccess(peerParams[0], peerParams[1]);
      if (firstChar == 's') {
        AppChatsManager.saveIsMegagroup(peerParams[0]);
      }
      return {
        _: 'inputPeerChannel',
        channel_id: peerParams[0],
        access_hash: peerParams[1] || 0
      };
    }
    else {
      return {
        _: 'inputPeerChat',
        chat_id: peerParams[0]
      }
    }
  }

  function getInputPeerByID (peerID) {
    if (!peerID) {
      return {_: 'inputPeerEmpty'};
    }
    if (peerID < 0) {
      var chatID = -peerID;
      if (!AppChatsManager.isChannel(chatID)) {
        return {
          _: 'inputPeerChat',
          chat_id: chatID
        };
      } else {
        return {
          _: 'inputPeerChannel',
          channel_id: chatID,
          access_hash: AppChatsManager.getChat(chatID).access_hash || 0
        }
      }
    }
    return {
      _: 'inputPeerUser',
      user_id: peerID,
      access_hash: AppUsersManager.getUser(peerID).access_hash || 0
    };
  }

  function getPeerSearchText (peerID) {
    var text;
    if (peerID > 0) {
      text = '%pu ' + AppUsersManager.getUserSearchText(peerID);
    } else if (peerID < 0) {
      var chat = AppChatsManager.getChat(-peerID);
      text = '%pg ' + (chat.title || '');
    }
    return text;
  }

  function getPeerString (peerID) {
    if (peerID > 0) {
      return AppUsersManager.getUserString(peerID);
    }
    return AppChatsManager.getChatString(-peerID);
  }

  function getOutputPeer (peerID) {
    if (peerID > 0) {
      return {_: 'peerUser', user_id: peerID};
    }
    var chatID = -peerID;
    if (AppChatsManager.isChannel(chatID)) {
      return {_: 'peerChannel', channel_id: chatID}
    }
    return {_: 'peerChat', chat_id: chatID}
  }

  function resolveUsername (username) {
    var searchUserName = SearchIndexManager.cleanUsername(username);
    var foundUserID, foundChatID, foundPeerID, foundUsername;
    if (foundUserID = AppUsersManager.resolveUsername(searchUserName)) {
      foundUsername = AppUsersManager.getUser(foundUserID).username;
      if (SearchIndexManager.cleanUsername(foundUsername) == searchUserName) {
        return qSync.when(foundUserID);
      }
    }
    if (foundChatID = AppChatsManager.resolveUsername(searchUserName)) {
      foundUsername = AppChatsManager.getChat(foundChatID).username;
      if (SearchIndexManager.cleanUsername(foundUsername) == searchUserName) {
        return qSync.when(-foundChatID);
      }
    }

    return MtpApiManager.invokeApi('contacts.resolveUsername', {username: username}).then(function (resolveResult) {
      AppUsersManager.saveApiUsers(resolveResult.users);
      AppChatsManager.saveApiChats(resolveResult.chats);
      return getPeerID(resolveResult.peer);
    });
  }

  function resolveInlineMention (username) {
    return resolveUsername(username).then(function (peerID) {
      if (peerID > 0) {
        var bot = AppUsersManager.getUser(peerID);
        if (bot.pFlags.bot && bot.bot_inline_placeholder !== undefined) {
          return qSync.when({
            id: peerID,
            placeholder: bot.bot_inline_placeholder
          });
        }
      }
      return $q.reject();
    }, function (error) {
      error.handled = true;
      return $q.reject(error);
    });
  }

  function getPeerID (peerString) {
    if (angular.isObject(peerString)) {
      return peerString.user_id
        ? peerString.user_id
        : -(peerString.channel_id || peerString.chat_id);
    }
    var isUser = peerString.charAt(0) == 'u',
        peerParams = peerString.substr(1).split('_');

    return isUser ? peerParams[0] : -peerParams[0] || 0;
  }

  function getPeer (peerID) {
    return peerID > 0
      ? AppUsersManager.getUser(peerID)
      : AppChatsManager.getChat(-peerID);
  }

  function getPeerPhoto (peerID) {
    return peerID > 0
      ? AppUsersManager.getUserPhoto(peerID)
      : AppChatsManager.getChatPhoto(-peerID)
  }

  function isChannel (peerID) {
    return (peerID < 0) && AppChatsManager.isChannel(-peerID);
  }

  function isMegagroup (peerID) {
    return (peerID < 0) && AppChatsManager.isMegagroup(-peerID);
  }

  function isBot (peerID) {
    return (peerID > 0) && AppUsersManager.isBot(peerID);
  }

  return {
    getInputPeer: getInputPeer,
    getInputPeerByID: getInputPeerByID,
    getPeerSearchText: getPeerSearchText,
    getPeerString: getPeerString,
    getOutputPeer: getOutputPeer,
    getPeerID: getPeerID,
    getPeer: getPeer,
    getPeerPhoto: getPeerPhoto,
    resolveUsername: resolveUsername,
    resolveInlineMention: resolveInlineMention,
    isChannel: isChannel,
    isMegagroup: isMegagroup,
    isBot: isBot
  }
})

.service('AppProfileManager', function ($q, $rootScope, AppUsersManager, AppChatsManager, AppPeersManager, AppPhotosManager, NotificationsManager, MtpApiManager, ApiUpdatesManager, RichTextProcessor) {

  var botInfos = {};
  var chatsFull = {};
  var chatFullPromises = {};

  function saveBotInfo (botInfo) {
    var botID = botInfo && botInfo.user_id;
    if (!botID) {
      return false;
    }
    var commands = {};
    angular.forEach(botInfo.commands, function (botCommand) {
      commands[botCommand.command] = botCommand.description;
    })
    return botInfos[botID] = {
      id: botID,
      version: botInfo.version,
      shareText: botInfo.share_text,
      description: botInfo.description,
      rAbout: RichTextProcessor.wrapRichText(botInfo.share_text, {noLinebreaks: true}),
      commands: commands
    };
  }

  function getProfile (id, override) {
    return MtpApiManager.invokeApi('users.getFullUser', {
      id: AppUsersManager.getUserInput(id)
    }).then(function (userFull) {
      if (override && override.phone_number) {
        userFull.user.phone = override.phone_number;
        if (override.first_name || override.last_name) {
          userFull.user.first_name = override.first_name;
          userFull.user.last_name = override.last_name;
        }
        AppUsersManager.saveApiUser(userFull.user);
      } else {
        AppUsersManager.saveApiUser(userFull.user, true);
      }

      AppPhotosManager.savePhoto(userFull.profile_photo, {
        user_id: id
      });

      NotificationsManager.savePeerSettings(id, userFull.notify_settings);

      userFull.bot_info = saveBotInfo(userFull.bot_info);

      return userFull;
    });
  }

  function getPeerBots (peerID) {
    var peerBots = [];
    if (peerID >= 0 && !AppUsersManager.isBot(peerID) ||
        (AppPeersManager.isChannel(peerID) && !AppPeersManager.isMegagroup(peerID))) {
      return $q.when(peerBots);
    }
    if (peerID >= 0) {
      return getProfile(peerID).then(function (userFull) {
        var botInfo = userFull.bot_info;
        if (botInfo && botInfo._ != 'botInfoEmpty') {
          peerBots.push(botInfo);
        }
        return peerBots;
      });
    }

    return getChatFull(-peerID).then(function (chatFull) {
      angular.forEach(chatFull.bot_info, function (botInfo) {
        peerBots.push(saveBotInfo(botInfo));
      });
      return peerBots;
    });

  }

  function getChatFull(id) {
    if (AppChatsManager.isChannel(id)) {
      return getChannelFull(id);
    }
    if (chatsFull[id] !== undefined) {
      var chat = AppChatsManager.getChat(id);
      if (chat.version == chatsFull[id].participants.version ||
          chat.pFlags.left) {
        return $q.when(chatsFull[id]);
      }
    }
    if (chatFullPromises[id] !== undefined) {
      return chatFullPromises[id];
    }
    console.trace(dT(), 'Get chat full', id, AppChatsManager.getChat(id));
    return chatFullPromises[id] = MtpApiManager.invokeApi('messages.getFullChat', {
      chat_id: AppChatsManager.getChatInput(id)
    }).then(function (result) {
      AppChatsManager.saveApiChats(result.chats);
      AppUsersManager.saveApiUsers(result.users);
      var fullChat = result.full_chat;
      if (fullChat && fullChat.chat_photo.id) {
        AppPhotosManager.savePhoto(fullChat.chat_photo);
      }
      NotificationsManager.savePeerSettings(-id, fullChat.notify_settings);
      delete chatFullPromises[id];
      chatsFull[id] = fullChat;
      $rootScope.$broadcast('chat_full_update', id);

      return fullChat;
    });
  }

  function getChatInviteLink (id, force) {
    return getChatFull(id).then(function (chatFull) {
      if (!force &&
          chatFull.exported_invite &&
          chatFull.exported_invite._ == 'chatInviteExported') {
        return chatFull.exported_invite.link;
      }
      var promise;
      if (AppChatsManager.isChannel(id)) {
        promise = MtpApiManager.invokeApi('channels.exportInvite', {
          channel: AppChatsManager.getChannelInput(id)
        });
      } else {
        promise = MtpApiManager.invokeApi('messages.exportChatInvite', {
          chat_id: AppChatsManager.getChatInput(id)
        });
      }
      return promise.then(function (exportedInvite) {
        if (chatsFull[id] !== undefined) {
          chatsFull[id].exported_invite = exportedInvite;
        }
        return exportedInvite.link;
      });
    });
  }

  function getChannelParticipants (id) {
    return MtpApiManager.invokeApi('channels.getParticipants', {
      channel: AppChatsManager.getChannelInput(id),
      filter: {_: 'channelParticipantsRecent'},
      offset: 0,
      limit: AppChatsManager.isMegagroup(id) ? 50 : 200
    }).then(function (result) {
      AppUsersManager.saveApiUsers(result.users);
      var participants = result.participants;

      var chat = AppChatsManager.getChat(id);
      if (!chat.pFlags.kicked && !chat.pFlags.left) {
        var myID = AppUsersManager.getSelf().id;
        var myIndex = false;
        var myParticipant;
        for (var i = 0, len = participants.length; i < len; i++) {
          if (participants[i].user_id == myID) {
            myIndex = i;
            break;
          }
        }
        if (myIndex !== false) {
          myParticipant = participants[i];
          participants.splice(i, 1);
        } else {
          myParticipant = {_: 'channelParticipantSelf', user_id: myID};
        }
        participants.unshift(myParticipant);
      }

      return participants;
    });
  }

  function getChannelFull (id, force) {
    if (chatsFull[id] !== undefined && !force) {
      return $q.when(chatsFull[id]);
    }
    if (chatFullPromises[id] !== undefined) {
      return chatFullPromises[id];
    }

    return chatFullPromises[id] = MtpApiManager.invokeApi('channels.getFullChannel', {
      channel: AppChatsManager.getChannelInput(id)
    }).then(function (result) {
      AppChatsManager.saveApiChats(result.chats);
      AppUsersManager.saveApiUsers(result.users);
      var fullChannel = result.full_chat;
      var chat = AppChatsManager.getChat(id);
      if (fullChannel && fullChannel.chat_photo.id) {
        AppPhotosManager.savePhoto(fullChannel.chat_photo);
      }
      NotificationsManager.savePeerSettings(-id, fullChannel.notify_settings);
      var participantsPromise;
      if (fullChannel.flags & 8) {
        participantsPromise = getChannelParticipants(id).then(function (participants) {
          delete chatFullPromises[id];
          fullChannel.participants = {
            _: 'channelParticipants',
            participants: participants
          };
        }, function (error) {
          error.handled = true;
        });
      } else {
        participantsPromise = $q.when();
      }
      return participantsPromise.then(function () {
        delete chatFullPromises[id];
        chatsFull[id] = fullChannel;
        $rootScope.$broadcast('chat_full_update', id);

        return fullChannel;
      });
    }, function (error) {
      switch (error.type) {
        case 'CHANNEL_PRIVATE':
          var channel = AppChatsManager.getChat(id);
          channel = {_: 'channelForbidden', access_hash: channel.access_hash, title: channel.title};
          ApiUpdatesManager.processUpdateMessage({
            _: 'updates',
            updates: [{
              _: 'updateChannel',
              channel_id: id
            }],
            chats: [channel],
            users: []
          });
          break;
      }
      return $q.reject(error);
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

  $rootScope.$on('chat_update', function (e, chatID) {
    var fullChat = chatsFull[chatID];
    var chat = AppChatsManager.getChat(chatID);
    if (!chat.photo || !fullChat) {
      return;
    }
    var emptyPhoto = chat.photo._ == 'chatPhotoEmpty';
    if (emptyPhoto != (fullChat.chat_photo._ == 'photoEmpty')) {
      delete chatsFull[chatID];
      $rootScope.$broadcast('chat_full_update', chatID);
      return;
    }
    if (emptyPhoto) {
      return;
    }
    var smallUserpic = chat.photo.photo_small;
    var smallPhotoSize = AppPhotosManager.choosePhotoSize(fullChat.chat_photo, 0, 0);
    if (!angular.equals(smallUserpic, smallPhotoSize.location)) {
      delete chatsFull[chatID];
      $rootScope.$broadcast('chat_full_update', chatID);
    }
  });

  return {
    getPeerBots: getPeerBots,
    getProfile: getProfile,
    getChatInviteLink: getChatInviteLink,
    getChatFull: getChatFull,
    getChannelFull: getChannelFull
  }
})

.service('AppPhotosManager', function ($modal, $window, $rootScope, MtpApiManager, MtpApiFileManager, AppUsersManager, FileManager) {
  var photos = {},
      windowW = $(window).width(),
      windowH = $(window).height();

  function savePhoto (apiPhoto, context) {
    if (context) {
      angular.extend(apiPhoto, context);
    }
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

  function getUserPhotos (userID, maxID, limit) {
    var inputUser = AppUsersManager.getUserInput(userID);
    return MtpApiManager.invokeApi('photos.getUserPhotos', {
      user_id: inputUser,
      offset: 0,
      limit: limit || 20,
      max_id: maxID || 0
    }).then(function (photosResult) {
      AppUsersManager.saveApiUsers(photosResult.users);
      var photoIDs = [];
      var context = {user_id: userID};
      for (var i = 0; i < photosResult.photos.length; i++) {
        savePhoto(photosResult.photos[i], context);
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

  function wrapForHistory (photoID, options) {
    options = options || {};
    var photo = angular.copy(photos[photoID]) || {_: 'photoEmpty'},
        width = options.website ? 100 : Math.min(windowW - 80, Config.Mobile ? 210 : 260),
        height = options.website ? 100 : Math.min(windowH - 100, Config.Mobile ? 210 : 260),
        thumbPhotoSize = choosePhotoSize(photo, width, height),
        thumb = {
          placeholder: 'img/placeholders/PhotoThumbConversation.gif',
          width: width,
          height: height
        };

    if (options.website && Config.Mobile) {
      width = 50;
      height = 50;
    }

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
      if (list.w) {
        scope.webpageID = list.w;
      }
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

.service('AppWebPagesManager', function ($modal, $sce, $window, $rootScope, MtpApiManager, AppPhotosManager, AppDocsManager, RichTextProcessor) {

  var webpages = {};
  var pendingWebPages = {};

  function saveWebPage (apiWebPage, messageID, mediaContext) {
    if (apiWebPage.photo && apiWebPage.photo._ === 'photo') {
      AppPhotosManager.savePhoto(apiWebPage.photo, mediaContext);
    } else {
      delete apiWebPage.photo;
    }
    if (apiWebPage.document && apiWebPage.document._ === 'document') {
      AppDocsManager.saveDoc(apiWebPage.document, mediaContext);
    } else {
      delete apiWebPage.document;
    }

    apiWebPage.rTitle = RichTextProcessor.wrapRichText(
      apiWebPage.title || apiWebPage.author,
      {noLinks: true, noLinebreaks: true}
    );
    var contextHashtag = '';
    if (apiWebPage.site_name == 'GitHub') {
      var matches = apiWebPage.url.match(/(https?:\/\/github\.com\/[^\/]+\/[^\/]+)/);
      if (matches) {
        contextHashtag = matches[0] + '/issues/{1}';
      }
    }
    apiWebPage.rDescription = RichTextProcessor.wrapRichText(
      apiWebPage.description, {
        contextSite: apiWebPage.site_name || 'external',
        contextHashtag: contextHashtag
      }
    );

    if (messageID) {
      if (pendingWebPages[apiWebPage.id] === undefined) {
        pendingWebPages[apiWebPage.id] = {};
      }
      pendingWebPages[apiWebPage.id][messageID] = true;
      webpages[apiWebPage.id] = apiWebPage;
    }

    if (webpages[apiWebPage.id] === undefined) {
      webpages[apiWebPage.id] = apiWebPage;
    } else {
      safeReplaceObject(webpages[apiWebPage.id], apiWebPage);
    }

    if (!messageID &&
        pendingWebPages[apiWebPage.id] !== undefined) {
      var msgs = [];
      angular.forEach(pendingWebPages[apiWebPage.id], function (t, msgID) {
        msgs.push(msgID);
      });
      $rootScope.$broadcast('webpage_updated', {
        id: apiWebPage.id,
        msgs: msgs
      });

    }
  };

  function openEmbed (webpageID, messageID) {
    var scope = $rootScope.$new(true);

    scope.webpageID = webpageID;
    scope.messageID = messageID;

    $modal.open({
      templateUrl: templateUrl('embed_modal'),
      windowTemplateUrl: templateUrl('media_modal_layout'),
      controller: 'EmbedModalController',
      scope: scope,
      windowClass: 'photo_modal_window'
    });
  }

  function wrapForHistory (webPageID) {
    var webPage = angular.copy(webpages[webPageID]) || {_: 'webPageEmpty'};

    if (webPage.photo && webPage.photo.id) {
      webPage.photo = AppPhotosManager.wrapForHistory(webPage.photo.id, {website: webPage.type != 'photo' && webPage.type != 'video'});
    }
    if (webPage.document && webPage.document.id) {
      webPage.document = AppDocsManager.wrapForHistory(webPage.document.id);
    }

    return webPage;
  }

  function wrapForFull (webPageID) {
    var webPage = wrapForHistory(webPageID);

    if (!webPage.embed_url) {
      return webPage;
    }

    var fullWidth = $(window).width() - (Config.Mobile ? 0 : 10);
    var fullHeight = $($window).height() - (Config.Mobile ? 92 : 150);

    if (!Config.Mobile && fullWidth > 800) {
      fullWidth -= 208;
    }

    var full = {
          width: fullWidth,
          height: fullHeight,
        };

    if (!webPage.embed_width || !webPage.embed_height) {
      full.height = full.width = Math.min(fullWidth, fullHeight);
    } else {
      var wh = calcImageInBox(webPage.embed_width, webPage.embed_height, fullWidth, fullHeight);
      full.width = wh.w;
      full.height = wh.h;
    }

    var embedTag = Config.Modes.chrome_packed ? 'webview' : 'iframe';

    var embedType = webPage.embed_type != 'iframe' ? webPage.embed_type || 'text/html' : 'text/html';

    var embedHtml = '<' + embedTag + ' src="' + encodeEntities(webPage.embed_url) + '" type="' + encodeEntities(embedType) + '" frameborder="0" border="0" webkitallowfullscreen mozallowfullscreen allowfullscreen width="' + full.width + '" height="' + full.height + '" style="width: ' + full.width + 'px; height: ' + full.height + 'px;"></' + embedTag + '>';

    full.html = $sce.trustAs('html', embedHtml);

    webPage.full = full;

    return webPage;
  }

  $rootScope.$on('apiUpdate', function (e, update) {
    switch (update._) {
      case 'updateWebPage':
        saveWebPage(update.webpage);
        break;
    }
  });

  return {
    saveWebPage: saveWebPage,
    openEmbed: openEmbed,
    wrapForFull: wrapForFull,
    wrapForHistory: wrapForHistory
  }
})


.service('AppVideoManager', function ($sce, $rootScope, $modal, $window, MtpApiFileManager, AppUsersManager, FileManager, qSync) {
  var videos = {},
      videosForHistory = {},
      windowW = $(window).width(),
      windowH = $(window).height();

  function saveVideo (apiVideo, context) {
    if (context) {
      angular.extend(apiVideo, context);
    }
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

.service('AppDocsManager', function ($sce, $rootScope, $modal, $window, $q, $timeout, RichTextProcessor, MtpApiFileManager, FileManager, qSync) {
  var docs = {},
      docsForHistory = {},
      windowW = $(window).width(),
      windowH = $(window).height();

  function saveDoc (apiDoc, context) {
    docs[apiDoc.id] = apiDoc;

    if (context) {
      angular.extend(apiDoc, context);
    }
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
        case 'documentAttributeAudio':
          apiDoc.duration = attribute.duration;
          apiDoc.audioTitle = attribute.title;
          apiDoc.audioPerformer = attribute.performer;
          break;
        case 'documentAttributeVideo':
          apiDoc.duration = attribute.duration;
          apiDoc.w = attribute.w;
          apiDoc.h = attribute.h;
          break;
        case 'documentAttributeSticker':
          apiDoc.sticker = true;
          if (attribute.alt !== undefined) {
            apiDoc.stickerEmojiRaw = attribute.alt;
            apiDoc.stickerEmoji = RichTextProcessor.wrapRichText(apiDoc.stickerEmojiRaw, {noLinks: true, noLinebreaks: true});
          }
          if (attribute.stickerset) {
            if (attribute.stickerset._ == 'inputStickerSetEmpty') {
              delete attribute.stickerset;
            }
            else if (attribute.stickerset._ == 'inputStickerSetID') {
              apiDoc.stickerSetInput = attribute.stickerset;
            }
          }
          break;
        case 'documentAttributeImageSize':
          apiDoc.w = attribute.w;
          apiDoc.h = attribute.h;
          break;
        case 'documentAttributeAnimated':
          apiDoc.animated = true;
          break;
      }
    });

    apiDoc.mime_type = apiDoc.mime_type || '';
    apiDoc.file_name = apiDoc.file_name || 'file';
    if (apiDoc._ == 'documentEmpty') {
      apiDoc.file_name = 'DELETED';
      apiDoc.size = 0;
    }

    if ((apiDoc.mime_type == 'image/gif' || apiDoc.animated && apiDoc.mime_type == 'video/mp4') && apiDoc.thumb && apiDoc.thumb._ == 'photoSize') {
      apiDoc.isSpecial = 'gif';
    }
    else if (apiDoc.mime_type == 'image/webp' && apiDoc.sticker) {
      apiDoc.isSpecial = 'sticker';
    }
    else if (apiDoc.mime_type.substr(0, 6) == 'audio/') {
      apiDoc.isSpecial = 'audio';
    }


  };

  function getDoc (docID) {
    return docs[docID] || {_: 'documentEmpty'};
  }

  function hasDoc (docID) {
    return docs[docID] !== undefined;
  }

  function wrapForHistory (docID) {
    if (docsForHistory[docID] !== undefined) {
      return docsForHistory[docID];
    }

    var doc = angular.copy(docs[docID]),
        isGif = doc.isSpecial == 'gif',
        isSticker = doc.isSpecial == 'sticker',
        thumbPhotoSize = doc.thumb,
        width, height, thumb, dim;

    if (isGif) {
      width = Math.min(windowW - 80, Config.Mobile ? 210 : 260);
      height = Math.min(windowH - 100, Config.Mobile ? 210 : 260);
    }
    else if (isSticker) {
      width = Math.min(windowW - 80, Config.Mobile ? 128 : 192);
      height = Math.min(windowH - 100, Config.Mobile ? 128 : 192);
    } else {
      width = height = 100;
    }

    thumb = {
      width: width,
      height: height
    };

    if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
      if (isGif && doc.w && doc.h) {
        dim = calcImageInBox(doc.w, doc.h, width, height);
      } else {
        dim = calcImageInBox(thumbPhotoSize.w, thumbPhotoSize.h, width, height);
      }
      thumb.width = dim.w;
      thumb.height = dim.h;
      thumb.location = thumbPhotoSize.location;
      thumb.size = thumbPhotoSize.size;
    }
    else if (isSticker) {
      dim = calcImageInBox(doc.w, doc.h, width, height);
      thumb.width = dim.w;
      thumb.height = dim.h;
    }
    else {
      thumb = false;
    }
    doc.thumb = thumb;

    doc.withPreview = !Config.Mobile && doc.mime_type.match(/^image\/(gif|png|jpeg|jpg|bmp|tiff)/) ? 1 : 0;

    return docsForHistory[docID] = doc;
  }

  function updateDocDownloaded (docID) {
    var doc = docs[docID],
        historyDoc = docsForHistory[docID] || doc || {},
        inputFileLocation = {
          _: 'inputDocumentFileLocation',
          id: docID,
          access_hash: doc.access_hash,
          file_name: doc.file_name
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
          access_hash: doc.access_hash,
          file_name: doc.file_name
        };

    if (doc._ == 'documentEmpty') {
      return $q.reject();
    }

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
      if (blob) {
        FileManager.getFileCorrectUrl(blob, doc.mime_type).then(function (url) {
          historyDoc.url = $sce.trustAsResourceUrl(url);
        })
        historyDoc.downloaded = true;
      }
      historyDoc.progress.percent = 100;
      $timeout(function () {
        delete historyDoc.progress;
      });
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
    hasDoc: hasDoc,
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

.service('AppStickersManager', function ($q, $rootScope, $modal, _, FileManager, MtpApiManager, AppDocsManager, Storage, ApiUpdatesManager) {

  var started = false;
  var applied = false;
  var currentStickerSets = [];

  $rootScope.$on('apiUpdate', function (e, update) {
    if (update._ != 'updateStickerSets' &&
        update._ != 'updateNewStickerSet' &&
        update._ != 'updateDelStickerSet' &&
        update._ != 'updateStickerSetsOrder') {
      return false;
    }

    return Storage.get('all_stickers').then(function (stickers) {
      if (!stickers ||
          stickers.layer != Config.Schema.API.layer) {
        $rootScope.$broadcast('stickers_changed');
      }
      switch (update._) {
        case 'updateNewStickerSet':
          var fullSet = update.stickerset;
          var set = fullSet.set;
          var pos = false;
          for (var i = 0, len = stickers.sets.length; i < len; i++) {
            if (stickers.sets[i].id == set.id) {
              pos = i;
              break;
            }
          }
          if (pos !== false) {
            stickers.sets.splice(pos, 1);
          }
          set.pFlags.installed = true;
          stickers.sets.unshift(set);
          stickers.fullSets[set.id] = fullSet;
          break;

        case 'updateDelStickerSet':
          var set;
          for (var i = 0, len = stickers.sets.length; i < len; i++) {
            set = stickers.sets[i];
            if (set.id == update.id) {
              set.pFlags.installed = false;
              stickers.sets.splice(i, 1);
              break;
            }
          }
          delete stickers.fullSets[update.id];
          break;

        case 'updateStickerSetsOrder':
          var order = update.order;
          stickers.sets.sort(function (a, b) {
            return order.indexOf(a.id) - order.indexOf(b.id);
          });
          break;
      }
      stickers.hash = getStickerSetsHash(stickers.sets);
      stickers.date = 0;
      Storage.set({all_stickers: stickers}).then(function () {
        $rootScope.$broadcast('stickers_changed');
      });
    });

  });

  return {
    start: start,
    getStickers: getStickers,
    openStickersetLink: openStickersetLink,
    openStickerset: openStickerset,
    installStickerset: installStickerset,
    pushPopularSticker: pushPopularSticker,
    getStickerset: getStickerset
  };

  function start () {
    if (!started) {
      started = true;
      setTimeout(getStickers, 1000);
    }
  }

  function getStickers (force) {
    return Storage.get('all_stickers').then(function (stickers) {
      var layer = Config.Schema.API.layer;
      if (stickers.layer != layer) {
        stickers = false;
      }
      if (stickers && stickers.date > tsNow(true) && !force) {
        return processRawStickers(stickers);
      }
      return MtpApiManager.invokeApi('messages.getAllStickers', {
        hash: stickers && stickers.hash || ''
      }).then(function (newStickers) {
        var notModified = newStickers._ == 'messages.allStickersNotModified';
        if (notModified) {
          newStickers = stickers;
        }
        newStickers.date = tsNow(true) + 3600;
        newStickers.layer = layer;
        delete newStickers._;

        if (notModified) {
          Storage.set({all_stickers: newStickers});
          return processRawStickers(newStickers);
        }

        return getStickerSets(newStickers, stickers && stickers.fullSets).then(function () {
          Storage.set({all_stickers: newStickers});
          return processRawStickers(newStickers);
        });

      });
    })
  }

  function processRawStickers(stickers) {
    if (applied !== stickers.hash) {
      applied = stickers.hash;
      var i, j, len1, len2, doc, set, docIDs, documents;

      currentStickerSets = [];
      len1 = stickers.sets.length;
      for (i = 0; i < len1; i++) {
        set = stickers.sets[i];
        if (set.pFlags.disabled) {
          continue;
        }
        documents = stickers.fullSets[set.id].documents;
        len2 = documents.length;
        docIDs = [];
        for (j = 0; j < len2; j++) {
          doc = documents[j];
          AppDocsManager.saveDoc(doc);
          docIDs.push(doc.id);
        }
        set.docIDs = docIDs;
        currentStickerSets.push(set);
      }
    }

    return getPopularStickers().then(function (popularStickers) {
      var resultStickersets = currentStickerSets;
      if (popularStickers.length) {
        resultStickersets = currentStickerSets.slice();
        var docIDs = [];
        var i, len;
        for (i = 0, len = popularStickers.length; i < len; i++) {
          docIDs.push(popularStickers[i].id);
        }
        resultStickersets.unshift({
          id: 0,
          title: _('im_stickers_tab_recent_raw'),
          short_name: '',
          docIDs: docIDs
        });
      }
      return resultStickersets;
    });
  }

  function getStickerSets (allStickers, prevCachedSets) {
    var promises = [];
    var cachedSets = prevCachedSets || allStickers.fullSets || {};
    allStickers.fullSets = {};
    angular.forEach(allStickers.sets, function (shortSet) {
      var fullSet = cachedSets[shortSet.id];
      if (fullSet && fullSet.set.hash == shortSet.hash) {
        allStickers.fullSets[shortSet.id] = fullSet;
      } else {
        var promise = MtpApiManager.invokeApi('messages.getStickerSet', {
          stickerset: {
            _: 'inputStickerSetID',
            id: shortSet.id,
            access_hash: shortSet.access_hash
          }
        }).then(function (fullSet) {
          allStickers.fullSets[shortSet.id] = fullSet;
        });
        promises.push(promise);
      }
    });
    return $q.all(promises);
  }

  function getPopularStickers () {
    return Storage.get('stickers_popular').then(function (popStickers) {
      var result = [];
      var i, len, docID;
      if (popStickers && popStickers.length) {
        for (i = 0, len = popStickers.length; i < len; i++) {
          docID = popStickers[i][0];
          if (AppDocsManager.hasDoc(docID)) {
            result.push({id: docID, rate: popStickers[i][1]});
          }
        }
      };
      return result;
    });
  }

  function pushPopularSticker (id) {
    getPopularStickers().then(function (popularStickers) {
      var exists = false;
      var count = popularStickers.length;
      var result = [];
      for (var i = 0; i < count; i++) {
        if (popularStickers[i].id == id) {
          exists = true;
          popularStickers[i].rate++;
        }
        result.push([popularStickers[i].id, popularStickers[i].rate]);
      }
      if (exists) {
        result.sort(function (a, b) {
          return b[1] - a[1];
        });
      } else {
        if (result.length > 15) {
          result = result.slice(0, 15);
        }
        result.push([id, 1]);
      }
      ConfigStorage.set({stickers_popular: result});
    });
  }

  function getStickerset (inputStickerset) {
    return MtpApiManager.invokeApi('messages.getStickerSet', {
      stickerset: inputStickerset
    }).then(function (result) {
      for (var i = 0; i < result.documents.length; i++) {
        AppDocsManager.saveDoc(result.documents[i]);
      }
      return result;
    });
  }

  function installStickerset (fullSet, uninstall) {
    var method = uninstall
      ? 'messages.uninstallStickerSet'
      : 'messages.installStickerSet';
    var inputStickerset = {
      _: 'inputStickerSetID',
      id: fullSet.set.id,
      access_hash: fullSet.set.access_hash
    };
    return MtpApiManager.invokeApi(method, {
      stickerset: inputStickerset,
      disabled: false
    }).then(function (result) {
      var update;
      if (uninstall) {
        update = {_: 'updateDelStickerSet', id: fullSet.set.id};
      } else {
        update = {_: 'updateNewStickerSet', stickerset: fullSet};
      }
      ApiUpdatesManager.processUpdateMessage({
        _: 'updateShort',
        update: update
      });
    });
  }

  function openStickersetLink (shortName) {
    return openStickerset({
      _: 'inputStickerSetShortName',
      short_name: shortName
    });
  }

  function openStickerset (inputStickerset) {
    var scope = $rootScope.$new(true);
    scope.inputStickerset = inputStickerset;
    var modal = $modal.open({
      templateUrl: templateUrl('stickerset_modal'),
      controller: 'StickersetModalController',
      scope: scope,
      windowClass: 'stickerset_modal_window mobile_modal'
    });
  }

  function getStickerSetsHash (stickerSets) {
    var acc = 0, set;
    for (var i = 0; i < stickerSets.length; i++) {
      set = stickerSets[i];
      if (set.pFlags.disabled || !set.pFlags.installed) {
        continue;
      }
      acc = ((acc * 20261) + 0x80000000 + set.hash) % 0x80000000;
    }
    return acc;
  }
})

.service('AppInlineBotsManager', function (MtpApiManager, AppMessagesManager, AppDocsManager, AppPhotosManager, RichTextProcessor, AppUsersManager) {

  var inlineResults = {};

  return {
    sendInlineResult: sendInlineResult,
    getInlineResults: getInlineResults
  };

  function getInlineResults (botID, query, offset) {
    return MtpApiManager.invokeApi('messages.getInlineBotResults', {
      bot: AppUsersManager.getUserInput(botID),
      query: query,
      offset: offset
    }).then(function(botResults) {
      var queryID = botResults.query_id;
      delete botResults._;
      delete botResults.flags;
      delete botResults.query_id;
      angular.forEach(botResults.results, function (result) {
        var qID = queryID + '_' + result.id;
        result.qID = qID;
        result.botID = botID;

        result.rTitle = RichTextProcessor.wrapRichText(result.title, {noLinebreaks: true, noLinks: true});
        result.rDescription = RichTextProcessor.wrapRichText(result.description, {noLinebreaks: true, noLinks: true});
        result.initials = (result.url || result.title || result.type || '').substr(0, 1)

        if (result._ == 'botInlineMediaResultDocument') {
          AppDocsManager.saveDoc(result.document);
        }
        else if (result._ == 'botInlineMediaResultPhoto') {
          AppPhotosManager.savePhoto(result.photo);
        }

        inlineResults[qID] = result;
      });
      return botResults;
    });
  }

  function sendInlineResult (peerID, qID, options) {
    var inlineResult = inlineResults[qID];
    if (inlineResult === undefined) {
      return false;
    }
    var splitted = qID.split('_');
    var queryID = splitted.shift();
    var resultID = splitted.join('_');
    options = options || {};
    options.viaBotID = inlineResult.botID;
    options.queryID = queryID;
    options.resultID = resultID;

    if (inlineResult.send_message._ == 'botInlineMessageText') {
      options.entities = inlineResult.send_message.entities;
      AppMessagesManager.sendText(peerID, inlineResult.send_message.message, options);
    } else {
      var caption = '';
      if (inlineResult.send_message._ == 'botInlineMessageMediaAuto') {
        caption = inlineResult.send_message.caption;
      }
      var inputMedia = false;
      if (inlineResult._ == 'botInlineMediaResultDocument') {
        var doc = inlineResult.document;
        inputMedia = {
          _: 'inputMediaDocument',
          id: {_: 'inputDocument', id: doc.id, access_hash: doc.access_hash},
          caption: caption
        };
      }
      else if (inlineResult._ == 'botInlineMediaResultPhoto') {
        var photo = inlineResult.photo;
        inputMedia = {
          _: 'inputMediaPhoto',
          id: {_: 'inputPhoto', id: photo.id, access_hash: photo.access_hash},
          caption: caption
        };
      }
      if (!inputMedia) {
        inputMedia = {
          _: 'messageMediaPending',
          type: inlineResult.type,
          file_name: inlineResult.title || inlineResult.content_url || inlineResult.url,
          size: 0,
          progress: {percent: 30, total: 0}
        };
      }
      AppMessagesManager.sendOther(peerID, inputMedia, options);
    }
  }

})

.service('ApiUpdatesManager', function ($rootScope, MtpNetworkerFactory, AppUsersManager, AppChatsManager, AppPeersManager, MtpApiManager) {

  var updatesState = {
    pendingPtsUpdates: [],
    pendingSeqUpdates: {},
    syncPending: false,
    syncLoading: true
  };
  var channelStates = {};

  var myID = 0;
  MtpApiManager.getUserID().then(function (id) {
    myID = id;
  });


  function popPendingSeqUpdate () {
    var nextSeq = updatesState.seq + 1,
        pendingUpdatesData = updatesState.pendingSeqUpdates[nextSeq];
    if (!pendingUpdatesData) {
      return false;
    }
    var updates = pendingUpdatesData.updates;
    var i, length;
    for (var i = 0, length = updates.length; i < length; i++) {
      saveUpdate(updates[i]);
    }
    updatesState.seq = pendingUpdatesData.seq;
    if (pendingUpdatesData.date && updatesState.date < pendingUpdatesData.date) {
      updatesState.date = pendingUpdatesData.date;
    }
    delete updatesState.pendingSeqUpdates[nextSeq];

    if (!popPendingSeqUpdate() &&
        updatesState.syncPending &&
        updatesState.syncPending.seqAwaiting &&
        updatesState.seq >= updatesState.syncPending.seqAwaiting) {
      if (!updatesState.syncPending.ptsAwaiting) {
        clearTimeout(updatesState.syncPending.timeout);
        updatesState.syncPending = false;
      } else {
        delete updatesState.syncPending.seqAwaiting;
      }
    }

    return true;
  }

  function popPendingPtsUpdate (channelID) {
    var curState = channelID ? getChannelState(channelID) : updatesState;
    if (!curState.pendingPtsUpdates.length) {
      return false;
    }
    curState.pendingPtsUpdates.sort(function (a, b) {
      return a.pts - b.pts;
    });

    var curPts = curState.pts;
    var goodPts = false;
    var goodIndex = false;
    var update;
    for (var i = 0, length = curState.pendingPtsUpdates.length; i < length; i++) {
      update = curState.pendingPtsUpdates[i];
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
      update = curState.pendingPtsUpdates[i];
      saveUpdate(update);
    }
    curState.pendingPtsUpdates.splice(0, goodIndex + 1);

    if (!curState.pendingPtsUpdates.length && curState.syncPending) {
      if (!curState.syncPending.seqAwaiting) {
        clearTimeout(curState.syncPending.timeout);
        curState.syncPending = false;
      } else {
        delete curState.syncPending.ptsAwaiting;
      }
    }

    return true;
  }

  function forceGetDifference () {
    if (!updatesState.syncLoading) {
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
            pFlags: updateMessage.pFlags,
            id: updateMessage.id,
            from_id: fromID,
            to_id: AppPeersManager.getOutputPeer(toID),
            date: updateMessage.date,
            message: updateMessage.message,
            fwd_from_id: updateMessage.fwd_from_id,
            fwd_date: updateMessage.fwd_date,
            reply_to_msg_id: updateMessage.reply_to_msg_id,
            entities: updateMessage.entities
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
    // console.trace(dT(), 'Get full diff');
    if (!updatesState.syncLoading) {
      updatesState.syncLoading = true;
      updatesState.pendingSeqUpdates = {};
      updatesState.pendingPtsUpdates = [];
    }

    if (updatesState.syncPending) {
      clearTimeout(updatesState.syncPending.timeout);
      updatesState.syncPending = false;
    }

    MtpApiManager.invokeApi('updates.getDifference', {pts: updatesState.pts, date: updatesState.date, qts: -1}).then(function (differenceResult) {
      if (differenceResult._ == 'updates.differenceEmpty') {
        console.log(dT(), 'apply empty diff', differenceResult.seq);
        updatesState.date = differenceResult.date;
        updatesState.seq = differenceResult.seq;
        updatesState.syncLoading = false;
        $rootScope.$broadcast('stateSynchronized');
        return false;
      }

      AppUsersManager.saveApiUsers(differenceResult.users);
      AppChatsManager.saveApiChats(differenceResult.chats);

      // Should be first because of updateMessageID
      // console.log(dT(), 'applying', differenceResult.other_updates.length, 'other updates');
      angular.forEach(differenceResult.other_updates, function(update) {
        if (update._ == 'updateChannelTooLong') {
          var channelID = update.channel_id;
          var channelState = channelStates[channelID];
          if (channelState !== undefined && !channelState.syncLoading) {
            getChannelDifference(channelID);
          }
          return;
        }
        saveUpdate(update);
      });

      // console.log(dT(), 'applying', differenceResult.new_messages.length, 'new messages');
      angular.forEach(differenceResult.new_messages, function (apiMessage) {
        saveUpdate({
          _: 'updateNewMessage',
          message: apiMessage,
          pts: updatesState.pts,
          pts_count: 0
        });
      });

      var nextState = differenceResult.intermediate_state || differenceResult.state;
      updatesState.seq = nextState.seq;
      updatesState.pts = nextState.pts;
      updatesState.date = nextState.date;

      // console.log(dT(), 'apply diff', updatesState.seq, updatesState.pts);

      if (differenceResult._ == 'updates.differenceSlice') {
        getDifference();
      } else {
        // console.log(dT(), 'finished get diff');
        $rootScope.$broadcast('stateSynchronized');
        updatesState.syncLoading = false;
      }
    });
  }

  function getChannelDifference (channelID) {
    var channelState = getChannelState(channelID);
    if (!channelState.syncLoading) {
      channelState.syncLoading = true;
      channelState.pendingPtsUpdates = [];
    }
    if (channelState.syncPending) {
      clearTimeout(channelState.syncPending.timeout);
      channelState.syncPending = false;
    }
    // console.log(dT(), 'Get channel diff', AppChatsManager.getChat(channelID), channelState.pts);
    MtpApiManager.invokeApi('updates.getChannelDifference', {
      channel: AppChatsManager.getChannelInput(channelID),
      filter: {_: 'channelMessagesFilterEmpty'},
      pts: channelState.pts,
      limit: 30
    }).then(function (differenceResult) {
      // console.log(dT(), 'channel diff result', differenceResult);
      channelState.pts = differenceResult.pts;

      if (differenceResult._ == 'updates.channelDifferenceEmpty') {
        console.log(dT(), 'apply channel empty diff', differenceResult);
        channelState.syncLoading = false;
        $rootScope.$broadcast('stateSynchronized');
        return false;
      }

      if (differenceResult._ == 'updates.channelDifferenceTooLong') {
        console.log(dT(), 'channel diff too long', differenceResult);
        channelState.syncLoading = false;
        delete channelStates[channelID];
        saveUpdate({_: 'updateChannelReload', channel_id: channelID});
        return false;
      }

      AppUsersManager.saveApiUsers(differenceResult.users);
      AppChatsManager.saveApiChats(differenceResult.chats);

      // Should be first because of updateMessageID
      console.log(dT(), 'applying', differenceResult.other_updates.length, 'channel other updates');
      angular.forEach(differenceResult.other_updates, function(update){
        saveUpdate(update);
      });

      console.log(dT(), 'applying', differenceResult.new_messages.length, 'channel new messages');
      angular.forEach(differenceResult.new_messages, function (apiMessage) {
        saveUpdate({
          _: 'updateNewChannelMessage',
          message: apiMessage,
          pts: channelState.pts,
          pts_count: 0
        });
      });

      console.log(dT(), 'apply channel diff', channelState.pts);

      if (differenceResult._ == 'updates.channelDifference' &&
          !differenceResult.pFlags['final']) {
        getChannelDifference(channelID);
      } else {
        console.log(dT(), 'finished channel get diff');
        $rootScope.$broadcast('stateSynchronized');
        channelState.syncLoading = false;
      }
    });
  }

  function addChannelState (channelID, pts) {
    if (!pts) {
      throw new Error('Add channel state without pts ' + channelID);
    }
    if (channelStates[channelID] === undefined) {
      channelStates[channelID] = {
        pts: pts,
        pendingPtsUpdates: [],
        syncPending: false,
        syncLoading: false
      };
      return true;
    }
    return false;
  }

  function getChannelState (channelID, pts) {
    if (channelStates[channelID] === undefined) {
      addChannelState(channelID, pts);
    }
    return channelStates[channelID];
  }

  function processUpdate (update, options) {
    var channelID = false;
    switch (update._) {
      case 'updateNewChannelMessage':
        channelID = -AppPeersManager.getPeerID(update.message.to_id);
        break;
      case 'updateDeleteChannelMessages':
        channelID = update.channel_id;
        break;
    }
    if (channelID && !AppChatsManager.hasChat(channelID)) {
      // console.log(dT(), 'skip update, missing channel', channelID, update);
      return false;
    }
    var curState = channelID ? getChannelState(channelID, update.pts) : updatesState;

    // console.log(dT(), 'process', channelID, curState, update);

    if (curState.syncLoading) {
      return false;
    }

    if (update._ == 'updateNewMessage') {
      var message = update.message;
      var fwdPeerID = message.fwd_from_id ? AppPeersManager.getPeerID(message.fwd_from_id) : 0;
      var toPeerID = AppPeersManager.getPeerID(message.to_id);
      if (message.from_id && !AppUsersManager.hasUser(message.from_id) ||
          fwdPeerID > 0 && !AppUsersManager.hasUser(fwdPeerID) ||
          fwdPeerID < 0 && !AppChatsManager.hasChat(-fwdPeerID) ||
          toPeerID > 0 && !AppUsersManager.hasUser(toPeerID) ||
          toPeerID < 0 && !AppChatsManager.hasChat(-toPeerID)) {
        console.warn(dT(), 'Short update not enough data', message);
        forceGetDifference();
        return false;
      }
    }

    var popPts, popSeq;

    if (update.pts) {
      var newPts = curState.pts + (update.pts_count || 0);
      if (newPts < update.pts) {
        console.warn(dT(), 'Pts hole', curState, update, channelID && AppChatsManager.getChat(channelID));
        curState.pendingPtsUpdates.push(update);
        if (!curState.syncPending) {
          curState.syncPending = {
            timeout: setTimeout(function () {
              if (channelID) {
                getChannelDifference(channelID);
              } else {
                getDifference();
              }
            }, 5000)
          };
        }
        curState.syncPending.ptsAwaiting = true;
        return false;
      }
      if (update.pts > curState.pts) {
        curState.pts = update.pts;
        popPts = true;
      }
      if (channelID && options.date && updatesState.date < options.date) {
        updatesState.date = options.date;
      }
    }
    else if (!channelID && options.seq > 0) {
      var seq = options.seq;
      var seqStart = options.seqStart || seq;

      if (seqStart != curState.seq + 1) {
        if (seqStart > curState.seq) {
          console.warn(dT(), 'Seq hole', curState, curState.syncPending && curState.syncPending.seqAwaiting);

          if (curState.pendingSeqUpdates[seqStart] === undefined) {
            curState.pendingSeqUpdates[seqStart] = {seq: seq, date: options.date, updates: []};
          }
          curState.pendingSeqUpdates[seqStart].updates.push(update);

          if (!curState.syncPending) {
            curState.syncPending = {
              timeout: setTimeout(function () {
                getDifference();
              }, 5000)
            };
          }
          if (!curState.syncPending.seqAwaiting ||
              curState.syncPending.seqAwaiting < seqStart) {
            curState.syncPending.seqAwaiting = seqStart;
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

    saveUpdate(update);

    if (popPts) {
      popPendingPtsUpdate(channelID);
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
      updatesState.seq = stateResult.seq;
      updatesState.pts = stateResult.pts;
      updatesState.date = stateResult.date;
      setTimeout(function () {
        updatesState.syncLoading = false;
      }, 1000);

      // updatesState.seq = 1;
      // updatesState.pts = stateResult.pts - 5000;
      // updatesState.date = 1;
      // getDifference();
    })
  }


  return {
    processUpdateMessage: processUpdateMessage,
    addChannelState: addChannelState,
    attach: attach
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

.service('NotificationsManager', function ($rootScope, $window, $interval, $q, _, MtpApiManager, AppPeersManager, IdleManager, Storage, AppRuntimeManager, FileManager) {

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
  var soundsPlayed = {};
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
  var stopped = false;

  var settings = {};

  $rootScope.$watch('idle.deactivated', function (newVal) {
    if (newVal) {
      stop();
    }
  });

  $rootScope.$watch('idle.isIDLE', function (newVal) {
    if (stopped) {
      return;
    }
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
          if (titleChanged || !notificationsCount) {
            titleChanged = false;
            document.title = titleBackup;
            setFavicon();
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
    soundReset: notificationSoundReset,
    getPeerSettings: getPeerSettings,
    getPeerMuted: getPeerMuted,
    savePeerSettings: savePeerSettings,
    updatePeerSettings: updatePeerSettings,
    updateNotifySettings: updateNotifySettings,
    getNotifySettings: getNotifySettings,
    getVibrateSupport: getVibrateSupport,
    testSound: playSound
  };

  function updateNotifySettings () {
    Storage.get('notify_nodesktop', 'notify_volume', 'notify_novibrate', 'notify_nopreview').then(function (updSettings) {

      settings.nodesktop = updSettings[0];
      settings.volume = updSettings[1] === false
                          ? 0.5
                          : updSettings[1];

      settings.novibrate = updSettings[2];
      settings.nopreview = updSettings[3];
    });
  }

  function getNotifySettings () {
    return settings;
  }

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

    prevFavicon = href;
  }

  function savePeerSettings (peerID, settings) {
    // console.trace(dT(), 'peer settings', peerID, settings);
    peerSettings[peerID] = $q.when(settings);
    $rootScope.$broadcast('notify_settings', {peerID: peerID});
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
    updateNotifySettings();
    $rootScope.$on('settings_changed', updateNotifySettings);
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

  function stop () {
    notificationsClear();
    $interval.cancel(titlePromise);
    setFavicon();
    stopped = true;
  }

  function requestPermission() {
    Notification.requestPermission();
    $($window).off('click', requestPermission);
  }

  function notify (data) {
    if (stopped) {
      return;
    }
    // console.log('notify', $rootScope.idle.isIDLE, notificationsUiSupport);

    // FFOS Notification blob src bug workaround
    if (Config.Navigator.ffos && !Config.Navigator.ffos2p) {
      data.image = 'https://telegram.org/img/t_logo.png';
    }
    else if (data.image && !angular.isString(data.image)) {
      if (Config.Navigator.ffos2p) {
        FileManager.getDataUrl(data.image, 'image/jpeg').then(function (url) {
          data.image = url;
          notify(data);
        });
        return false;
      } else {
        data.image = FileManager.getUrl(data.image, 'image/jpeg');
      }
    }
    else if (!data.image) {
      data.image = 'img/icons/icon60.png';
    }
    // console.log('notify image', data.image);

    notificationsCount++;

    var now = tsNow();
    if (settings.volume > 0 &&
        (
          !data.tag ||
          !soundsPlayed[data.tag] ||
          now > soundsPlayed[data.tag] + 60000
        )
    ) {
      playSound(settings.volume);
      soundsPlayed[data.tag] = now;
    }

    if (!notificationsUiSupport ||
        'Notification' in window && Notification.permission !== 'granted') {
      return false;
    }

    if (settings.nodesktop) {
      if (vibrateSupport && !settings.novibrate) {
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
      if (!notification.hidden) {
        delete notificationsShown[key];
        notificationsClear();
      }
    };

    if (notification.show) {
      notification.show();
    }
    notificationsShown[key] = notification;

    if (!Config.Navigator.mobile) {
      setTimeout(function () {
        notificationHide(key)
      }, 8000);
    }
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

  function notificationHide (key) {
    var notification = notificationsShown[key];
    if (notification) {
      try {
        if (notification.close) {
          notification.hidden = true;
          notification.close();
        }
      } catch (e) {}
      delete notificationsCount[key];
    }
  }

  function notificationSoundReset (tag) {
    delete soundsPlayed[tag];
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

.service('PasswordManager', function ($timeout, $q, $rootScope, MtpApiManager, CryptoWorker, MtpSecureRandom) {

  return {
    check: check,
    getState: getState,
    requestRecovery: requestRecovery,
    recover: recover,
    updateSettings: updateSettings
  };

  function getState (options) {
    return MtpApiManager.invokeApi('account.getPassword', {}, options).then(function (result) {
      return result;
    });
  }

  function updateSettings (state, settings) {
    var currentHashPromise;
    var newHashPromise;
    var params = {
      new_settings: {
        _: 'account.passwordInputSettings',
        flags: 0,
        hint: settings.hint || ''
      }
    };

    if (typeof settings.cur_password === 'string' &&
        settings.cur_password.length > 0) {
      currentHashPromise = makePasswordHash(state.current_salt, settings.cur_password);
    } else {
      currentHashPromise = $q.when([]);
    }

    if (typeof settings.new_password === 'string' &&
        settings.new_password.length > 0) {
      var saltRandom = new Array(8);
      var newSalt = bufferConcat(state.new_salt, saltRandom);
      MtpSecureRandom.nextBytes(saltRandom);
      newHashPromise = makePasswordHash(newSalt, settings.new_password);
      params.new_settings.new_salt = newSalt;
      params.new_settings.flags |= 1;
    } else {
      if (typeof settings.new_password === 'string') {
        params.new_settings.flags |= 1;
        params.new_settings.new_salt = [];
      }
      newHashPromise = $q.when([]);
    }

    if (typeof settings.email === 'string') {
      params.new_settings.flags |= 2;
      params.new_settings.email = settings.email || '';
    }

    return $q.all([currentHashPromise, newHashPromise]).then(function (hashes) {
      params.current_password_hash = hashes[0];
      params.new_settings.new_password_hash = hashes[1];

      return MtpApiManager.invokeApi('account.updatePasswordSettings', params);
    });

  }

  function check (state, password, options) {
    return makePasswordHash(state.current_salt, password).then(function (passwordHash) {
      return MtpApiManager.invokeApi('auth.checkPassword', {
        password_hash: passwordHash
      }, options);
    });
  }

  function requestRecovery (state, options) {
    return MtpApiManager.invokeApi('auth.requestPasswordRecovery', {}, options);
  }

  function recover (code, options) {
    return MtpApiManager.invokeApi('auth.recoverPassword', {
      code: code
    }, options);
  }



  function makePasswordHash (salt, password) {
    var passwordUTF8 = unescape(encodeURIComponent(password));

    var buffer   = new ArrayBuffer(passwordUTF8.length);
    var byteView = new Uint8Array(buffer);
    for (var i = 0, len = passwordUTF8.length; i < len; i++) {
      byteView[i] = passwordUTF8.charCodeAt(i);
    }

    buffer = bufferConcat(bufferConcat(salt, byteView), salt);

    return CryptoWorker.sha256Hash(buffer);
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
    scope.noMessages = true;
    if (options) {
      angular.extend(scope, options);
    }

    return $modal.open({
      templateUrl: templateUrl('peer_select'),
      controller: 'PeerSelectController',
      scope: scope,
      windowClass: 'peer_select_window mobile_modal',
      backdrop: 'single'
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
    scope.noMessages = true;
    if (options) {
      angular.extend(scope, options);
    }

    return $modal.open({
      templateUrl: templateUrl('peer_select'),
      controller: 'PeerSelectController',
      scope: scope,
      windowClass: 'peer_select_window mobile_modal',
      backdrop: 'single'
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
      windowClass: 'contacts_modal_window mobile_modal',
      backdrop: 'single'
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
            location.href = 'https://web.telegram.org';
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


.service('LocationParamsService', function ($rootScope, $routeParams, AppPeersManager, AppUsersManager, AppMessagesManager, PeersSelectService, AppStickersManager, ErrorService) {

  var tgAddrRegExp = /^(web\+)?tg:(\/\/)?(.+)/;

  function checkLocationTgAddr () {
    var tgaddr = $routeParams.tgaddr;
    if (tgaddr) {
      try {
        tgaddr = decodeURIComponent(tgaddr);
      } catch (e) {};
      var matches = tgaddr.match(tgAddrRegExp);
      if (matches) {
        handleTgProtoAddr(matches[3]);
      }
    }
  }

  function handleTgProtoAddr (url, inner) {
    var matches;

    if (matches = url.match(/^resolve\?domain=(.+?)(?:&(start|startgroup)=(.+))?$/)) {
      AppPeersManager.resolveUsername(matches[1]).then(function (peerID) {

        if (peerID > 0 && AppUsersManager.isBot(peerID) && matches[2] == 'startgroup') {
          PeersSelectService.selectPeer({
            confirm_type: 'INVITE_TO_GROUP',
            noUsers: true
          }).then(function (toPeerString) {
            var toPeerID = AppPeersManager.getPeerID(toPeerString);
            var toChatID = toPeerID < 0 ? -toPeerID : 0;
            AppMessagesManager.startBot(peerID, toChatID, matches[3]).then(function () {
              $rootScope.$broadcast('history_focus', {peerString: toPeerString});
            });
          });
          return true;
        }

        $rootScope.$broadcast('history_focus', {
          peerString: AppPeersManager.getPeerString(peerID),
          startParam: matches[3]
        });
      });
      return true;
    }

    if (matches = url.match(/^join\?invite=(.+)$/)) {
      AppMessagesManager.openChatInviteLink(matches[1]);
      return true;
    }

    if (matches = url.match(/^addstickers\?set=(.+)$/)) {
      AppStickersManager.openStickersetLink(matches[1]);
      return true;
    }

    if (matches = url.match(/^msg_url\?url=([^&]+)(?:&text=(.*))?$/)) {
      PeersSelectService.selectPeer().then(function (toPeerString) {
        var url = decodeURIComponent(matches[1]);
        var text = matches[2] ? decodeURIComponent(matches[2]) : '';
        shareUrl(url, text);
      });
      return true;
    }

    if (inner &&
        (matches = url.match(/^unsafe_url\?url=([^&]+)/))) {
      var url = decodeURIComponent(matches[1]);
      ErrorService.confirm({
        type: 'JUMP_EXT_URL',
        url: url
      }).then(function () {
        window.open(url, '_blank');
      });
      return true;
    }

    if (matches = url.match(/^search_hashtag\?hashtag=(.+?)$/)) {
      $rootScope.$broadcast('dialogs_search', {query: '#' + decodeURIComponent(matches[1])});
      if (Config.Mobile) {
        $rootScope.$broadcast('history_focus', {
          peerString: ''
        });
      }
      return true;
    }

    if (inner &&
        (matches = url.match(/^bot_command\?command=(.+?)(?:&bot=(.+))?$/))) {

      var peerID = $rootScope.selectedPeerID;
      var text = '/' + matches[1];
      if (peerID < 0 && matches[2]) {
        text += '@' + matches[2];
      }
      AppMessagesManager.sendText(peerID, text);

      $rootScope.$broadcast('history_focus', {
        peerString: AppPeersManager.getPeerString(peerID)
      });
      return true;
    }

    return false;
  }

  function handleActivityMessage (name, data) {
    console.log(dT(), 'Received activity', name, data);

    if (name == 'share' && data.url) {
      shareUrl(data.url, '');
    }
    else if (name == 'view' && data.url) {
      var matches = data.url.match(tgAddrRegExp);
      if (matches) {
        handleTgProtoAddr(matches[3]);
      }
    }
    else if (name == 'webrtc-call' && data.contact) {
      var contact = data.contact;
      var phones = [];
      if (contact.tel != undefined) {
        for (var i = 0; i < contact.tel.length; i++) {
          phones.push(contact.tel[i].value);
        }
      }
      var firstName = (contact.givenName || []).join(' ');
      var lastName = (contact.familyName || []).join(' ');

      if (phones.length) {
        AppUsersManager.importContact(phones[0], firstName, lastName).then(function (foundUserID) {
          if (foundUserID) {
            var peerString = AppPeersManager.getPeerString(foundUserID);
            $rootScope.$broadcast('history_focus', {peerString: peerString});
          } else {
            ErrorService.show({
              error: {code: 404, type: 'USER_NOT_USING_TELEGRAM'}
            });
          }
        });
      }
    }
    else if (name === 'share' && data.blobs && data.blobs.length > 0) {
      PeersSelectService.selectPeers({confirm_type: 'EXT_SHARE_PEER'}).then(function (peerStrings) {
        angular.forEach(peerStrings, function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          angular.forEach(data.blobs, function (blob) {
            AppMessagesManager.sendFile(peerID, blob, {isMedia: true});
          });
        })
        if (peerStrings.length == 1) {
          $rootScope.$broadcast('history_focus', {peerString: peerStrings[0]});
        }
      });
    }
  }

  var started = false;
  function start () {
    if (started) {
      return;
    }
    started = true;

    if ('registerProtocolHandler' in navigator) {
      try {
        navigator.registerProtocolHandler('tg', '#im?tgaddr=%s', 'Telegram Web');
      } catch (e) {}
      try {
        navigator.registerProtocolHandler('web+tg', '#im?tgaddr=%s', 'Telegram Web');
      } catch (e) {}
    }

    if (window.navigator.mozSetMessageHandler) {
      console.log(dT(), 'Set activity message handler');
      window.navigator.mozSetMessageHandler('activity', function(activityRequest) {
        handleActivityMessage(activityRequest.source.name, activityRequest.source.data);
      });
    }

    $(document).on('click', function (event) {
      var target = event.target;
      if (target &&
          target.tagName == 'A' &&
          !target.onclick &&
          !target.onmousedown) {
        var href = $(target).attr('href') || target.href || '';
        var match = href.match(tgAddrRegExp);
        if (match) {
          if (handleTgProtoAddr(match[3], true)) {
            return cancelEvent(event);
          }
        }
      }
    });

    $rootScope.$on('$routeUpdate', checkLocationTgAddr);
    checkLocationTgAddr();
  };

  function shareUrl (url, text) {
    PeersSelectService.selectPeer().then(function (toPeerString) {
      $rootScope.$broadcast('history_focus', {
        peerString: toPeerString,
        attachment: {
          _: 'share_url',
          url: url,
          text: text
        }
      });
    });
  }

  return {
    start: start,
    shareUrl: shareUrl
  };
})