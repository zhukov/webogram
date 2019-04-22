/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict'

/* Services */

angular.module('myApp.services', ['myApp.i18n', 'izhukov.utils'])

  .service('AppUsersManager', function ($rootScope, $modal, $modalStack, $filter, $q, qSync, MtpApiManager, RichTextProcessor, ServerTimeManager, Storage, _) {
    var users = {}
    var usernames = {}
    var userAccess = {}
    var cachedPhotoLocations = {}
    var contactsIndex = SearchIndexManager.createIndex()
    var contactsFillPromise
    var contactsList
    var myID

    MtpApiManager.getUserID().then(function (id) {
      myID = id
    })

    function fillContacts () {
      if (contactsFillPromise) {
        return contactsFillPromise
      }
      return contactsFillPromise = MtpApiManager.invokeApi('contacts.getContacts', {
        hash: 0
      }).then(function (result) {
        var userID, searchText
        var i
        contactsList = []
        saveApiUsers(result.users)

        for (var i = 0; i < result.contacts.length; i++) {
          userID = result.contacts[i].user_id
          contactsList.push(userID)
          SearchIndexManager.indexObject(userID, getUserSearchText(userID), contactsIndex)
        }

        return contactsList
      })
    }

    function getUserSearchText (id) {
      var user = users[id]
      if (!user) {
        return false
      }
      var serviceText = ''
      if (user.pFlags.self) {
        serviceText = _('user_name_saved_msgs_raw')
      }

      return (user.first_name || '') +
              ' ' + (user.last_name || '') +
              ' ' + (user.phone || '') +
              ' ' + (user.username || '') +
              ' ' + serviceText
    }

    function getContacts (query) {
      return fillContacts().then(function (contactsList) {
        if (angular.isString(query) && query.length) {
          var results = SearchIndexManager.search(query, contactsIndex)
          var filteredContactsList = []

          for (var i = 0; i < contactsList.length; i++) {
            if (results[contactsList[i]]) {
              filteredContactsList.push(contactsList[i])
            }
          }
          contactsList = filteredContactsList
        }

        contactsList.sort(function (userID1, userID2) {
          var sortName1 = (users[userID1] || {}.sortName) || ''
          var sortName2 = (users[userID2] || {}.sortName) || ''
          if (sortName1 == sortName2) {
            return 0
          }
          return sortName1 > sortName2 ? 1 : -1
        })

        return contactsList
      })
    }

    function resolveUsername (username) {
      return usernames[username] || 0
    }

    function saveApiUsers (apiUsers) {
      angular.forEach(apiUsers, saveApiUser)
    }

    function saveApiUser (apiUser, noReplace) {
      if (!angular.isObject(apiUser) ||
        noReplace && angular.isObject(users[apiUser.id]) && users[apiUser.id].first_name) {
        return
      }

      var userID = apiUser.id
      var result = users[userID]

      if (apiUser.pFlags === undefined) {
        apiUser.pFlags = {}
      }

      if (apiUser.pFlags.min) {
        if (result !== undefined) {
          return
        }
      }

      if (apiUser.phone) {
        apiUser.rPhone = $filter('phoneNumber')(apiUser.phone)
      }

      apiUser.num = (Math.abs(userID) % 8) + 1

      if (apiUser.first_name) {
        apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.first_name, {noLinks: true, noLinebreaks: true})
        apiUser.rFullName = apiUser.last_name ? RichTextProcessor.wrapRichText(apiUser.first_name + ' ' + (apiUser.last_name || ''), {noLinks: true, noLinebreaks: true}) : apiUser.rFirstName
      } else {
        apiUser.rFirstName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || apiUser.rPhone || _('user_first_name_deleted')
        apiUser.rFullName = RichTextProcessor.wrapRichText(apiUser.last_name, {noLinks: true, noLinebreaks: true}) || apiUser.rPhone || _('user_name_deleted')
      }

      if (apiUser.username) {
        var searchUsername = SearchIndexManager.cleanUsername(apiUser.username)
        usernames[searchUsername] = userID
      }

      apiUser.sortName = apiUser.pFlags.deleted ? '' : SearchIndexManager.cleanSearchText(apiUser.first_name + ' ' + (apiUser.last_name || ''))

      var nameWords = apiUser.sortName.split(' ')
      var firstWord = nameWords.shift()
      var lastWord = nameWords.pop()
      apiUser.initials = firstWord.charAt(0) + (lastWord ? lastWord.charAt(0) : firstWord.charAt(1))

      if (apiUser.status) {
        if (apiUser.status.expires) {
          apiUser.status.expires -= ServerTimeManager.serverTimeOffset
        }
        if (apiUser.status.was_online) {
          apiUser.status.was_online -= ServerTimeManager.serverTimeOffset
        }
      }
      if (apiUser.pFlags.bot) {
        apiUser.sortStatus = -1
      } else {
        apiUser.sortStatus = getUserStatusForSort(apiUser.status)
      }

      var result = users[userID]
      if (result === undefined) {
        result = users[userID] = apiUser
      } else {
        safeReplaceObject(result, apiUser)
      }
      $rootScope.$broadcast('user_update', userID)

      if (cachedPhotoLocations[userID] !== undefined) {
        safeReplaceObject(cachedPhotoLocations[userID], apiUser && apiUser.photo && apiUser.photo.photo_small || {empty: true})
      }
    }

    function saveUserAccess (id, accessHash) {
      userAccess[id] = accessHash
    }

    function getUserStatusForSort (status) {
      if (status) {
        var expires = status.expires || status.was_online
        if (expires) {
          return expires
        }
        var timeNow = tsNow(true)
        switch (status._) {
          case 'userStatusRecently':
            return timeNow - 86400 * 3
          case 'userStatusLastWeek':
            return timeNow - 86400 * 7
          case 'userStatusLastMonth':
            return timeNow - 86400 * 30
        }
      }

      return 0
    }

    function getUser (id) {
      if (angular.isObject(id)) {
        return id
      }
      return users[id] || {id: id, deleted: true, num: 1, access_hash: userAccess[id]}
    }

    function getSelf () {
      return getUser(myID)
    }

    function isBot (id) {
      return users[id] && users[id].pFlags.bot
    }

    function hasUser (id, allowMin) {
      var user = users[id]
      return angular.isObject(user) && (allowMin || !user.pFlags.min)
    }

    function getUserPhoto (id) {
      var user = getUser(id)

      if (id == 333000) {
        return {
          placeholder: 'img/placeholders/DialogListAvatarSystem@2x.png'
        }
      }

      if (cachedPhotoLocations[id] === undefined) {
        cachedPhotoLocations[id] = user && user.photo && user.photo.photo_small || {empty: true}
      }

      return {
        num: user.num,
        placeholder: 'img/placeholders/UserAvatar' + user.num + '@2x.png',
        location: cachedPhotoLocations[id]
      }
    }

    function getUserString (id) {
      var user = getUser(id)
      return 'u' + id + (user.access_hash ? '_' + user.access_hash : '')
    }

    function getUserInput (id) {
      var user = getUser(id)
      if (user.pFlags.self) {
        return {_: 'inputUserSelf'}
      }
      return {
        _: 'inputUser',
        user_id: id,
        access_hash: user.access_hash || 0
      }
    }

    function updateUsersStatuses () {
      var timestampNow = tsNow(true)
      angular.forEach(users, function (user) {
        if (user.status &&
          user.status._ == 'userStatusOnline' &&
          user.status.expires < timestampNow) {
          user.status = user.status.wasStatus ||
          {_: 'userStatusOffline', was_online: user.status.expires}
          delete user.status.wasStatus
          $rootScope.$broadcast('user_update', user.id)
        }
      })
    }

    function forceUserOnline (id) {
      if (isBot(id)) {
        return
      }
      var user = getUser(id)
      if (user &&
        user.status &&
        user.status._ != 'userStatusOnline' &&
        user.status._ != 'userStatusEmpty') {
        var wasStatus
        if (user.status._ != 'userStatusOffline') {
          delete user.status.wasStatus
          wasStatus = angular.copy(user.status)
        }
        user.status = {
          _: 'userStatusOnline',
          expires: tsNow(true) + 60,
          wasStatus: wasStatus
        }
        user.sortStatus = getUserStatusForSort(user.status)
        $rootScope.$broadcast('user_update', id)
      }
    }

    function wrapForFull (id) {
      var user = getUser(id)

      return user
    }

    function openUser (userID, override) {
      var scope = $rootScope.$new()
      scope.userID = userID
      scope.override = override || {}

      var modalInstance = $modal.open({
        templateUrl: templateUrl('user_modal'),
        controller: 'UserModalController',
        scope: scope,
        windowClass: 'user_modal_window mobile_modal',
        backdrop: 'single'
      })
    }

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
        saveApiUsers(importedContactsResult.users)

        var foundUserID = false
        angular.forEach(importedContactsResult.imported, function (importedContact) {
          onContactUpdated(foundUserID = importedContact.user_id, true)
        })

        return foundUserID || false
      })
    }

    function importContacts (contacts) {
      var inputContacts = [],
        i
      var j

      for (i = 0; i < contacts.length; i++) {
        for (j = 0; j < contacts[i].phones.length; j++) {
          inputContacts.push({
            _: 'inputPhoneContact',
            client_id: (i << 16 | j).toString(10),
            phone: contacts[i].phones[j],
            first_name: contacts[i].first_name,
            last_name: contacts[i].last_name
          })
        }
      }

      return MtpApiManager.invokeApi('contacts.importContacts', {
        contacts: inputContacts,
        replace: false
      }).then(function (importedContactsResult) {
        saveApiUsers(importedContactsResult.users)

        var result = []
        angular.forEach(importedContactsResult.imported, function (importedContact) {
          onContactUpdated(importedContact.user_id, true)
          result.push(importedContact.user_id)
        })

        return result
      })
    }

    function deleteContacts (userIDs) {
      var ids = []
      angular.forEach(userIDs, function (userID) {
        ids.push(getUserInput(userID))
      })
      return MtpApiManager.invokeApi('contacts.deleteContacts', {
        id: ids
      }).then(function () {
        angular.forEach(userIDs, function (userID) {
          onContactUpdated(userID, false)
        })
      })
    }

    function onContactUpdated (userID, isContact) {
      userID = parseInt(userID)
      if (angular.isArray(contactsList)) {
        var curPos = curIsContact = contactsList.indexOf(userID)
        var curIsContact = curPos != -1

        if (isContact != curIsContact) {
          if (isContact) {
            contactsList.push(userID)
            SearchIndexManager.indexObject(userID, getUserSearchText(userID), contactsIndex)
          } else {
            contactsList.splice(curPos, 1)
          }
          $rootScope.$broadcast('contacts_update', userID)
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
          return $q.reject()
        }
        return foundUserID
      })
    }

    function setUserStatus (userID, offline) {
      if (isBot(userID)) {
        return
      }
      var user = users[userID]
      if (user) {
        var status = offline ? {
          _: 'userStatusOffline',
          was_online: tsNow(true)
        } : {
          _: 'userStatusOnline',
          expires: tsNow(true) + 500
        }

        user.status = status
        user.sortStatus = getUserStatusForSort(user.status)
        $rootScope.$broadcast('user_update', userID)
      }
    }

    $rootScope.$on('apiUpdate', function (e, update) {
      // console.log('on apiUpdate', update)
      switch (update._) {
        case 'updateUserStatus':
          var userID = update.user_id
          var user = users[userID]
          if (user) {
            user.status = update.status
            if (user.status) {
              if (user.status.expires) {
                user.status.expires -= ServerTimeManager.serverTimeOffset
              }
              if (user.status.was_online) {
                user.status.was_online -= ServerTimeManager.serverTimeOffset
              }
            }
            user.sortStatus = getUserStatusForSort(user.status)
            $rootScope.$broadcast('user_update', userID)
          }
          break

        case 'updateUserPhoto':
          var userID = update.user_id
          var user = users[userID]
          if (user) {
            forceUserOnline(userID)
            if (!user.photo) {
              user.photo = update.photo
            } else {
              safeReplaceObject(user.photo, update.photo)
            }

            if (cachedPhotoLocations[userID] !== undefined) {
              safeReplaceObject(cachedPhotoLocations[userID], update.photo && update.photo.photo_small || {empty: true})
            }

            $rootScope.$broadcast('user_update', userID)
          }
          break

        case 'updateContactLink':
          onContactUpdated(update.user_id, update.my_link._ == 'contactLinkContact')
          break
      }
    })

    $rootScope.$on('user_auth', function (e, userAuth) {
      myID = userAuth && userAuth.id || 0
    })

    setInterval(updateUsersStatuses, 60000)

    $rootScope.$on('stateSynchronized', updateUsersStatuses)

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
    }

    function isAvailable () {
      if (Config.Mobile && Config.Navigator.ffos && Config.Modes.packed) {
        try {
          return navigator.mozContacts && navigator.mozContacts.getAll
        } catch (e) {
          console.error(dT(), 'phonebook n/a', e)
          return false
        }
      }
      return false
    }

    function openPhonebookImport () {
      return $modal.open({
        templateUrl: templateUrl('phonebook_modal'),
        controller: 'PhonebookModalController',
        windowClass: 'phonebook_modal_window mobile_modal'
      })
    }

    function getPhonebookContacts () {
      try {
        var request = window.navigator.mozContacts.getAll({})
      } catch (e) {
        return $q.reject(e)
      }

      var deferred = $q.defer()
      var contacts = []
      var count = 0

      request.onsuccess = function () {
        if (this.result) {
          var contact = {
            id: count,
            first_name: (this.result.givenName || []).join(' '),
            last_name: (this.result.familyName || []).join(' '),
            phones: []
          }

          if (this.result.tel != undefined) {
            for (var i = 0; i < this.result.tel.length; i++) {
              contact.phones.push(this.result.tel[i].value)
            }
          }
          if (this.result.photo && this.result.photo[0]) {
            try {
              contact.photo = FileManager.getUrl(this.result.photo[0])
            } catch (e) {}
          }
          if (!contact.photo) {
            contact.photo = 'img/placeholders/UserAvatar' + ((Math.abs(count) % 8) + 1) + '@2x.png'
          }
          contact.photo = $sce.trustAsResourceUrl(contact.photo)

          count++
          contacts.push(contact)
        }

        if (!this.result || count >= 1000) {
          deferred.resolve(contacts)
          return
        }

        this['continue']()
      }

      request.onerror = function (e) {
        console.log('phonebook error', e, e.type, e.message)
        deferred.reject(e)
      }

      return deferred.promise
    }
  })

  .service('AppChatsManager', function ($q, $rootScope, $modal, _, MtpApiManager, AppUsersManager, AppPhotosManager, RichTextProcessor) {
    var chats = {}
    var usernames = {}
    var channelAccess = {}
    var megagroups = {}
    var cachedPhotoLocations = {}

    function saveApiChats (apiChats) {
      angular.forEach(apiChats, saveApiChat)
    }

    function saveApiChat (apiChat) {
      if (!angular.isObject(apiChat)) {
        return
      }
      apiChat.rTitle = RichTextProcessor.wrapRichText(apiChat.title, {noLinks: true, noLinebreaks: true}) || _('chat_title_deleted')

      var result = chats[apiChat.id]
      var titleWords = SearchIndexManager.cleanSearchText(apiChat.title || '').split(' ')
      var firstWord = titleWords.shift()
      var lastWord = titleWords.pop()
      apiChat.initials = firstWord.charAt(0) + (lastWord ? lastWord.charAt(0) : firstWord.charAt(1))

      apiChat.num = (Math.abs(apiChat.id >> 1) % 8) + 1

      if (apiChat.pFlags === undefined) {
        apiChat.pFlags = {}
      }
      if (apiChat.pFlags.min) {
        if (result !== undefined) {
          return
        }
      }
      if (apiChat._ == 'channel' &&
          apiChat.participants_count === undefined &&
          result !== undefined &&
          result.participants_count) {
        apiChat.participants_count = result.participants_count
      }

      if (apiChat.username) {
        var searchUsername = SearchIndexManager.cleanUsername(apiChat.username)
        usernames[searchUsername] = apiChat.id
      }

      if (result === undefined) {
        result = chats[apiChat.id] = apiChat
      } else {
        safeReplaceObject(result, apiChat)
        $rootScope.$broadcast('chat_update', apiChat.id)
      }

      if (cachedPhotoLocations[apiChat.id] !== undefined) {
        safeReplaceObject(cachedPhotoLocations[apiChat.id], apiChat && apiChat.photo && apiChat.photo.photo_small || {empty: true})
      }
    }

    function getChat (id) {
      return chats[id] || {id: id, deleted: true, access_hash: channelAccess[id]}
    }

    function hasRights (id, action) {
      if (chats[id] === undefined) {
        return false
      }
      var chat = getChat(id)
      if (chat._ == 'chatForbidden' ||
          chat._ == 'channelForbidden' ||
          chat.pFlags.kicked ||
          chat.pFlags.left) {
        return false
      }
      if (chat.pFlags.creator) {
        return true
      }

      switch (action) {
        case 'send':
          if (chat._ == 'channel' &&
              !chat.pFlags.megagroup &&
              !chat.pFlags.editor) {
            return false
          }
          break

        case 'edit_title':
        case 'edit_photo':
        case 'invite':
          if (chat._ == 'channel') {
            if (chat.pFlags.megagroup) {
              if (!chat.pFlags.editor &&
                  !(action == 'invite' && chat.pFlags.democracy)) {
                return false
              }
            } else {
              return false
            }
          } else {
            if (chat.pFlags.admins_enabled &&
                !chat.pFlags.admin) {
              return false
            }
          }
          break
      }
      return true
    }

    function resolveUsername (username) {
      return usernames[username] || 0
    }

    function saveChannelAccess (id, accessHash) {
      channelAccess[id] = accessHash
    }

    function saveIsMegagroup (id) {
      megagroups[id] = true
    }

    function isChannel (id) {
      var chat = chats[id]
      if (chat && (chat._ == 'channel' || chat._ == 'channelForbidden') ||
        channelAccess[id]) {
        return true
      }
      return false
    }

    function isMegagroup (id) {
      if (megagroups[id]) {
        return true
      }
      var chat = chats[id]
      if (chat && chat._ == 'channel' && chat.pFlags.megagroup) {
        return true
      }
      return false
    }

    function isBroadcast (id) {
      return isChannel(id) && !isMegagroup(id)
    }

    function getChatInput (id) {
      return id || 0
    }

    function getChannelInput (id) {
      if (!id) {
        return {_: 'inputChannelEmpty'}
      }
      return {
        _: 'inputChannel',
        channel_id: id,
        access_hash: getChat(id).access_hash || channelAccess[id] || 0
      }
    }

    function hasChat (id, allowMin) {
      var chat = chats[id]
      return angular.isObject(chat) && (allowMin || !chat.pFlags.min)
    }

    function getChatPhoto (id) {
      var chat = getChat(id)

      if (cachedPhotoLocations[id] === undefined) {
        cachedPhotoLocations[id] = chat && chat.photo && chat.photo.photo_small || {empty: true}
      }

      return {
        placeholder: 'img/placeholders/GroupAvatar' + Math.ceil(chat.num / 2) + '@2x.png',
        location: cachedPhotoLocations[id]
      }
    }

    function getChatString (id) {
      var chat = getChat(id)
      if (isChannel(id)) {
        return (isMegagroup(id) ? 's' : 'c') + id + '_' + chat.access_hash
      }
      return 'g' + id
    }

    function wrapForFull (id, fullChat) {
      var chatFull = angular.copy(fullChat)
      var chat = getChat(id)

      if (!chatFull.participants_count) {
        chatFull.participants_count = chat.participants_count
      }

      if (chatFull.participants &&
          chatFull.participants._ == 'chatParticipants') {
        chatFull.participants.participants = wrapParticipants(id, chatFull.participants.participants)
      }

      if (chatFull.about) {
        chatFull.rAbout = RichTextProcessor.wrapRichText(chatFull.about, {noLinebreaks: true})
      }

      chatFull.peerString = getChatString(id)
      chatFull.chat = chat

      return chatFull
    }

    function wrapParticipants(id, participants) {
      var chat = getChat(id)
      var myID = AppUsersManager.getSelf().id
      if (isChannel(id)) {
        var isAdmin = chat.pFlags.creator || chat.pFlags.editor || chat.pFlags.moderator
        angular.forEach(participants, function (participant) {
          participant.canLeave = myID == participant.user_id
          participant.canKick = isAdmin && participant._ == 'channelParticipant'

          // just for order by last seen
          participant.user = AppUsersManager.getUser(participant.user_id)
        })
      } else {
        var isAdmin = chat.pFlags.creator || chat.pFlags.admins_enabled && chat.pFlags.admin
        angular.forEach(participants, function (participant) {
          participant.canLeave = myID == participant.user_id
          participant.canKick = !participant.canLeave && (
            chat.pFlags.creator ||
            participant._ == 'chatParticipant' && (isAdmin || myID == participant.inviter_id)
          )

          // just for order by last seen
          participant.user = AppUsersManager.getUser(participant.user_id)
        })
      }
      return participants
    }

    function openChat (chatID, accessHash) {
      var scope = $rootScope.$new()
      scope.chatID = chatID

      if (isChannel(chatID)) {
        var modalInstance = $modal.open({
          templateUrl: templateUrl('channel_modal'),
          controller: 'ChannelModalController',
          scope: scope,
          windowClass: 'chat_modal_window channel_modal_window mobile_modal'
        })
      } else {
        var modalInstance = $modal.open({
          templateUrl: templateUrl('chat_modal'),
          controller: 'ChatModalController',
          scope: scope,
          windowClass: 'chat_modal_window mobile_modal'
        })
      }
    }

    $rootScope.$on('apiUpdate', function (e, update) {
      // console.log('on apiUpdate', update)
      switch (update._) {
        case 'updateChannel':
          var channelID = update.channel_id
          $rootScope.$broadcast('channel_settings', {channelID: channelID})
          break
      }
    })

    return {
      saveApiChats: saveApiChats,
      saveApiChat: saveApiChat,
      getChat: getChat,
      isChannel: isChannel,
      isMegagroup: isMegagroup,
      isBroadcast: isBroadcast,
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
      wrapParticipants: wrapParticipants,
      openChat: openChat
    }
  })

  .service('AppPeersManager', function ($q, qSync, AppUsersManager, AppChatsManager, MtpApiManager) {
    function getInputPeer (peerString) {
      var firstChar = peerString.charAt(0)
      var peerParams = peerString.substr(1).split('_')

      if (firstChar == 'u') {
        AppUsersManager.saveUserAccess(peerParams[0], peerParams[1])
        return {
          _: 'inputPeerUser',
          user_id: peerParams[0],
          access_hash: peerParams[1]
        }
      }
      else if (firstChar == 'c' || firstChar == 's') {
        AppChatsManager.saveChannelAccess(peerParams[0], peerParams[1])
        if (firstChar == 's') {
          AppChatsManager.saveIsMegagroup(peerParams[0])
        }
        return {
          _: 'inputPeerChannel',
          channel_id: peerParams[0],
          access_hash: peerParams[1] || 0
        }
      }else {
        return {
          _: 'inputPeerChat',
          chat_id: peerParams[0]
        }
      }
    }

    function getInputPeerByID (peerID) {
      if (!peerID) {
        return {_: 'inputPeerEmpty'}
      }
      if (peerID < 0) {
        var chatID = -peerID
        if (!AppChatsManager.isChannel(chatID)) {
          return {
            _: 'inputPeerChat',
            chat_id: chatID
          }
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
      }
    }

    function getPeerSearchText (peerID) {
      var text
      if (peerID > 0) {
        text = '%pu ' + AppUsersManager.getUserSearchText(peerID)
      } else if (peerID < 0) {
        var chat = AppChatsManager.getChat(-peerID)
        text = '%pg ' + (chat.title || '')
      }
      return text
    }

    function getPeerString (peerID) {
      if (peerID > 0) {
        return AppUsersManager.getUserString(peerID)
      }
      return AppChatsManager.getChatString(-peerID)
    }

    function getOutputPeer (peerID) {
      if (peerID > 0) {
        return {_: 'peerUser', user_id: peerID}
      }
      var chatID = -peerID
      if (AppChatsManager.isChannel(chatID)) {
        return {_: 'peerChannel', channel_id: chatID}
      }
      return {_: 'peerChat', chat_id: chatID}
    }

    function resolveUsername (username) {
      var searchUserName = SearchIndexManager.cleanUsername(username)
      if (searchUserName.match(/^\d+$/)) {
        return qSync.when(false)
      }
      var foundUserID
      var foundChatID, foundPeerID
      var foundUsername
      if (foundUserID = AppUsersManager.resolveUsername(searchUserName)) {
        foundUsername = AppUsersManager.getUser(foundUserID).username
        if (SearchIndexManager.cleanUsername(foundUsername) == searchUserName) {
          return qSync.when(foundUserID)
        }
      }
      if (foundChatID = AppChatsManager.resolveUsername(searchUserName)) {
        foundUsername = AppChatsManager.getChat(foundChatID).username
        if (SearchIndexManager.cleanUsername(foundUsername) == searchUserName) {
          return qSync.when(-foundChatID)
        }
      }

      return MtpApiManager.invokeApi('contacts.resolveUsername', {username: username}).then(function (resolveResult) {
        AppUsersManager.saveApiUsers(resolveResult.users)
        AppChatsManager.saveApiChats(resolveResult.chats)
        return getPeerID(resolveResult.peer)
      })
    }

    function getPeerID (peerString) {
      if (angular.isObject(peerString)) {
        return peerString.user_id
          ? peerString.user_id
          : -(peerString.channel_id || peerString.chat_id)
      }
      var isUser = peerString.charAt(0) == 'u'
      var peerParams = peerString.substr(1).split('_')

      return isUser ? peerParams[0] : -peerParams[0] || 0
    }

    function getPeer (peerID) {
      return peerID > 0
        ? AppUsersManager.getUser(peerID)
        : AppChatsManager.getChat(-peerID)
    }

    function getPeerPhoto (peerID) {
      return peerID > 0
        ? AppUsersManager.getUserPhoto(peerID)
        : AppChatsManager.getChatPhoto(-peerID)
    }

    function getPeerMigratedTo(peerID) {
      if (peerID >= 0) {
        return false
      }
      var chat = AppChatsManager.getChat(-peerID)
      if (chat && chat.migrated_to && chat.pFlags.deactivated) {
        return getPeerID(chat.migrated_to)
      }
      return false
    }

    function isChannel (peerID) {
      return (peerID < 0) && AppChatsManager.isChannel(-peerID)
    }

    function isMegagroup (peerID) {
      return (peerID < 0) && AppChatsManager.isMegagroup(-peerID)
    }

    function isAnyGroup (peerID) {
      return (peerID < 0) && !AppChatsManager.isBroadcast(-peerID)
    }

    function isBroadcast (id) {
      return isChannel(id) && !isMegagroup(id)
    }

    function isBot (peerID) {
      return (peerID > 0) && AppUsersManager.isBot(peerID)
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
      getPeerMigratedTo: getPeerMigratedTo,
      resolveUsername: resolveUsername,
      isChannel: isChannel,
      isAnyGroup: isAnyGroup,
      isMegagroup: isMegagroup,
      isBroadcast: isBroadcast,
      isBot: isBot
    }
  })

  .service('AppProfileManager', function ($q, $rootScope, AppUsersManager, AppChatsManager, AppMessagesIDsManager, AppPeersManager, AppPhotosManager, NotificationsManager, MtpApiManager, ApiUpdatesManager, RichTextProcessor, Storage) {
    var botInfos = {}
    var chatsFull = {}
    var chatFullPromises = {}
    var chatParticipantsPromises = {}

    function saveBotInfo (botInfo) {
      var botID = botInfo && botInfo.user_id
      if (!botID) {
        return false
      }
      var commands = {}
      angular.forEach(botInfo.commands, function (botCommand) {
        commands[botCommand.command] = botCommand.description
      })
      return botInfos[botID] = {
        id: botID,
        version: botInfo.version,
        shareText: botInfo.share_text,
        description: botInfo.description,
        commands: commands
      }
    }

    function getProfile (id, override) {
      return MtpApiManager.invokeApi('users.getFullUser', {
        id: AppUsersManager.getUserInput(id)
      }).then(function (userFull) {
        if (override && override.phone_number) {
          userFull.user.phone = override.phone_number
          if (override.first_name || override.last_name) {
            userFull.user.first_name = override.first_name
            userFull.user.last_name = override.last_name
          }
          AppUsersManager.saveApiUser(userFull.user)
        } else {
          AppUsersManager.saveApiUser(userFull.user, true)
        }

        if (userFull.profile_photo) {
          AppPhotosManager.savePhoto(userFull.profile_photo, {
            user_id: id
          })
        }

        if (userFull.about !== undefined) {
          userFull.rAbout = RichTextProcessor.wrapRichText(userFull.about, {noLinebreaks: true})
        }

        NotificationsManager.savePeerSettings(id, userFull.notify_settings)

        if (userFull.bot_info) {
          userFull.bot_info = saveBotInfo(userFull.bot_info)
        }

        return userFull
      })
    }

    function getPeerBots (peerID) {
      var peerBots = []
      if (peerID >= 0 && !AppUsersManager.isBot(peerID) ||
        (AppPeersManager.isChannel(peerID) && !AppPeersManager.isMegagroup(peerID))) {
        return $q.when(peerBots)
      }
      if (peerID >= 0) {
        return getProfile(peerID).then(function (userFull) {
          var botInfo = userFull.bot_info
          if (botInfo && botInfo._ != 'botInfoEmpty') {
            peerBots.push(botInfo)
          }
          return peerBots
        })
      }

      return getChatFull(-peerID).then(function (chatFull) {
        angular.forEach(chatFull.bot_info, function (botInfo) {
          peerBots.push(saveBotInfo(botInfo))
        })
        return peerBots
      })
    }

    function getChatFull (id) {
      if (AppChatsManager.isChannel(id)) {
        return getChannelFull(id)
      }
      if (chatsFull[id] !== undefined) {
        var chat = AppChatsManager.getChat(id)
        if (chat.version == chatsFull[id].participants.version ||
          chat.pFlags.left) {
          return $q.when(chatsFull[id])
        }
      }
      if (chatFullPromises[id] !== undefined) {
        return chatFullPromises[id]
      }
      // console.trace(dT(), 'Get chat full', id, AppChatsManager.getChat(id))
      return chatFullPromises[id] = MtpApiManager.invokeApi('messages.getFullChat', {
        chat_id: AppChatsManager.getChatInput(id)
      }).then(function (result) {
        AppChatsManager.saveApiChats(result.chats)
        AppUsersManager.saveApiUsers(result.users)
        var fullChat = result.full_chat
        if (fullChat && fullChat.chat_photo.id) {
          AppPhotosManager.savePhoto(fullChat.chat_photo)
        }
        NotificationsManager.savePeerSettings(-id, fullChat.notify_settings)
        delete chatFullPromises[id]
        chatsFull[id] = fullChat
        $rootScope.$broadcast('chat_full_update', id)

        return fullChat
      })
    }

    function getChatInviteLink (id, force) {
      return getChatFull(id).then(function (chatFull) {
        if (!force &&
          chatFull.exported_invite &&
          chatFull.exported_invite._ == 'chatInviteExported') {
          return chatFull.exported_invite.link
        }
        var promise
        if (AppChatsManager.isChannel(id)) {
          promise = MtpApiManager.invokeApi('channels.exportInvite', {
            channel: AppChatsManager.getChannelInput(id)
          })
        } else {
          promise = MtpApiManager.invokeApi('messages.exportChatInvite', {
            chat_id: AppChatsManager.getChatInput(id)
          })
        }
        return promise.then(function (exportedInvite) {
          if (chatsFull[id] !== undefined) {
            chatsFull[id].exported_invite = exportedInvite
          }
          return exportedInvite.link
        })
      })
    }

    function getChannelParticipants (id, filter, limit, offset) {
      filter = filter || {_: 'channelParticipantsRecent'}
      limit = limit || 200
      offset = offset || 0
      var promiseKey = [id, filter._, offset, limit].join('_')
      var promiseData = chatParticipantsPromises[promiseKey]

      if (filter._ == 'channelParticipantsRecent') {
        var chat = AppChatsManager.getChat(id)
        if (chat &&
            chat.pFlags && (
              chat.pFlags.kicked ||
              chat.pFlags.broadcast && !chat.pFlags.creator && !chat.admin_rights
            )) {
          return $q.reject()
        }
      }

      var fetchParticipants = function (cachedParticipants) {
        var hash = 0
        if (cachedParticipants) {
          var userIDs = []
          angular.forEach(cachedParticipants, function (participant) {
            userIDs.push(participant.user_id)
          })
          userIDs.sort()
          angular.forEach(userIDs, function (userID) {
            hash = ((hash * 20261) + 0x80000000 + userID) % 0x80000000
          })
        }
        return MtpApiManager.invokeApi('channels.getParticipants', {
          channel: AppChatsManager.getChannelInput(id),
          filter: filter,
          offset: offset,
          limit: limit,
          hash: hash
        }).then(function (result) {
          if (result._ == 'channels.channelParticipantsNotModified') {
            return cachedParticipants
          }
          AppUsersManager.saveApiUsers(result.users)
          return result.participants
        })
      }

      var maybeAddSelf = function (participants) {
        var chat = AppChatsManager.getChat(id)
        var selfMustBeFirst = filter._ == 'channelParticipantsRecent' &&
                              !offset &&
                              !chat.pFlags.kicked &&
                              !chat.pFlags.left

        if (selfMustBeFirst) {
          participants = angular.copy(participants)
          var myID = AppUsersManager.getSelf().id
          var myIndex = false
          var myParticipant
          for (var i = 0, len = participants.length; i < len; i++) {
            if (participants[i].user_id == myID) {
              myIndex = i
              break
            }
          }
          if (myIndex !== false) {
            myParticipant = participants[i]
            participants.splice(i, 1)
          } else {
            myParticipant = {_: 'channelParticipantSelf', user_id: myID}
          }
          participants.unshift(myParticipant)
        }
        return participants
      }

      var timeNow = tsNow()
      if (promiseData !== undefined) {
        var promise = promiseData[1]
        if (promiseData[0] > timeNow - 60000) {
          return promise
        }
        var newPromise = promise.then(function (cachedParticipants) {
          return fetchParticipants(cachedParticipants).then(maybeAddSelf)
        })
        chatParticipantsPromises[promiseKey] = [timeNow, newPromise]
        return newPromise
      }

      var newPromise = fetchParticipants().then(maybeAddSelf)
      chatParticipantsPromises[promiseKey] = [timeNow, newPromise]
      return newPromise
    }

    function getChannelFull (id, force) {
      if (chatsFull[id] !== undefined && !force) {
        return $q.when(chatsFull[id])
      }
      if (chatFullPromises[id] !== undefined) {
        return chatFullPromises[id]
      }

      return chatFullPromises[id] = MtpApiManager.invokeApi('channels.getFullChannel', {
        channel: AppChatsManager.getChannelInput(id)
      }).then(function (result) {
        AppChatsManager.saveApiChats(result.chats)
        AppUsersManager.saveApiUsers(result.users)
        var fullChannel = result.full_chat
        if (fullChannel && fullChannel.chat_photo.id) {
          AppPhotosManager.savePhoto(fullChannel.chat_photo)
        }
        NotificationsManager.savePeerSettings(-id, fullChannel.notify_settings)

        if (fullChannel.pinned_msg_id) {
          fullChannel.pinned_msg_id = AppMessagesIDsManager.getFullMessageID(fullChannel.pinned_msg_id, id)
        }

        delete chatFullPromises[id]
        chatsFull[id] = fullChannel
        $rootScope.$broadcast('chat_full_update', id)

        return fullChannel

      }, function (error) {
        switch (error.type) {
          case 'CHANNEL_PRIVATE':
            var channel = AppChatsManager.getChat(id)
            channel = {_: 'channelForbidden', access_hash: channel.access_hash, title: channel.title}
            ApiUpdatesManager.processUpdateMessage({
              _: 'updates',
              updates: [{
                _: 'updateChannel',
                channel_id: id
              }],
              chats: [channel],
              users: []
            })
            break
        }
        return $q.reject(error)
      })
    }

    function invalidateChannelParticipants(id) {
      delete chatsFull[id]
      delete chatFullPromises[id]
      angular.forEach(chatParticipantsPromises, function (val, key) {
        if (key.split('_')[0] == id) {
          delete chatParticipantsPromises[key]
        }
      })
      $rootScope.$broadcast('chat_full_update', id)
    }

    function getChannelPinnedMessage(id) {
      return getChannelFull(id).then(function (fullChannel) {
        var pinnedMessageID = fullChannel && fullChannel.pinned_msg_id
        if (!pinnedMessageID) {
          return false
        }
        return Storage.get('pinned_hidden' + id).then(function (hiddenMessageID) {
          if (AppMessagesIDsManager.getMessageLocalID(pinnedMessageID) == hiddenMessageID) {
            return false
          }
          return pinnedMessageID
        })
      })
    }

    function hideChannelPinnedMessage(id, pinnedMessageID) {
      var setKeys = {}
      setKeys['pinned_hidden' + id] = AppMessagesIDsManager.getMessageLocalID(pinnedMessageID)
      Storage.set(setKeys)
      $rootScope.$broadcast('peer_pinned_message', -id)      
    }

    $rootScope.$on('apiUpdate', function (e, update) {
      // console.log('on apiUpdate', update)
      switch (update._) {
        case 'updateChatParticipants':
          var participants = update.participants
          var chatFull = chatsFull[participants.id]
          if (chatFull !== undefined) {
            chatFull.participants = update.participants
            $rootScope.$broadcast('chat_full_update', chatID)
          }
          break

        case 'updateChatParticipantAdd':
          var chatFull = chatsFull[update.chat_id]
          if (chatFull !== undefined) {
            var participants = chatFull.participants.participants || []
            for (var i = 0, length = participants.length; i < length; i++) {
              if (participants[i].user_id == update.user_id) {
                return
              }
            }
            participants.push({
              _: 'chatParticipant',
              user_id: update.user_id,
              inviter_id: update.inviter_id,
              date: tsNow(true)
            })
            chatFull.participants.version = update.version
            $rootScope.$broadcast('chat_full_update', update.chat_id)
          }
          break

        case 'updateChatParticipantDelete':
          var chatFull = chatsFull[update.chat_id]
          if (chatFull !== undefined) {
            var participants = chatFull.participants.participants || []
            for (var i = 0, length = participants.length; i < length; i++) {
              if (participants[i].user_id == update.user_id) {
                participants.splice(i, 1)
                chatFull.participants.version = update.version
                $rootScope.$broadcast('chat_full_update', update.chat_id)
                return
              }
            }
          }
          break

        case 'updateChannelPinnedMessage':
          var channelID = update.channel_id
          var fullChannel = chatsFull[channelID]
          if (fullChannel !== undefined) {
            fullChannel.pinned_msg_id = AppMessagesIDsManager.getFullMessageID(update.id, channelID)
            $rootScope.$broadcast('peer_pinned_message', -channelID)
          }
          break

      }
    })

    $rootScope.$on('chat_update', function (e, chatID) {
      var fullChat = chatsFull[chatID]
      var chat = AppChatsManager.getChat(chatID)
      if (!chat.photo || !fullChat) {
        return
      }
      var emptyPhoto = chat.photo._ == 'chatPhotoEmpty'
      if (emptyPhoto != (fullChat.chat_photo._ == 'photoEmpty')) {
        delete chatsFull[chatID]
        $rootScope.$broadcast('chat_full_update', chatID)
        return
      }
      if (emptyPhoto) {
        return
      }
      var smallUserpic = chat.photo.photo_small
      var smallPhotoSize = AppPhotosManager.choosePhotoSize(fullChat.chat_photo, 0, 0)
      if (!angular.equals(smallUserpic, smallPhotoSize.location)) {
        delete chatsFull[chatID]
        $rootScope.$broadcast('chat_full_update', chatID)
      }
    })

    return {
      getPeerBots: getPeerBots,
      getProfile: getProfile,
      getChatInviteLink: getChatInviteLink,
      getChatFull: getChatFull,
      getChannelFull: getChannelFull,
      getChannelParticipants: getChannelParticipants,
      invalidateChannelParticipants: invalidateChannelParticipants,
      getChannelPinnedMessage: getChannelPinnedMessage,
      hideChannelPinnedMessage: hideChannelPinnedMessage
    }
  })

  .service('AppPhotosManager', function ($modal, $window, $rootScope, MtpApiManager, MtpApiFileManager, AppUsersManager, FileManager) {
    var photos = {}
    var windowW = $(window).width()
    var windowH = $(window).height()

    function savePhoto (apiPhoto, context) {
      if (context) {
        angular.extend(apiPhoto, context)
      }
      photos[apiPhoto.id] = apiPhoto

      angular.forEach(apiPhoto.sizes, function (photoSize) {
        if (photoSize._ == 'photoCachedSize') {
          MtpApiFileManager.saveSmallFile(photoSize.location, photoSize.bytes)

          // Memory
          photoSize.size = photoSize.bytes.length
          delete photoSize.bytes
          photoSize._ = 'photoSize'
        }
      })
    }

    function choosePhotoSize (photo, width, height) {
      if (Config.Navigator.retina) {
        width *= 2
        height *= 2
      }
      var bestPhotoSize = {_: 'photoSizeEmpty'}
      var bestDiff = 0xFFFFFF

      angular.forEach(photo.sizes, function (photoSize) {
        var diff = Math.abs(photoSize.w * photoSize.h - width * height)
        if (diff < bestDiff) {
          bestPhotoSize = photoSize
          bestDiff = diff
        }
      })

      // console.log('choosing', photo, width, height, bestPhotoSize)

      return bestPhotoSize
    }

    function getUserPhotos (userID, maxID, limit) {
      var inputUser = AppUsersManager.getUserInput(userID)
      return MtpApiManager.invokeApi('photos.getUserPhotos', {
        user_id: inputUser,
        offset: 0,
        limit: limit || 20,
        max_id: maxID || 0
      }).then(function (photosResult) {
        AppUsersManager.saveApiUsers(photosResult.users)
        var photoIDs = []
        var context = {user_id: userID}
        for (var i = 0; i < photosResult.photos.length; i++) {
          savePhoto(photosResult.photos[i], context)
          photoIDs.push(photosResult.photos[i].id)
        }

        return {
          count: photosResult.count || photosResult.photos.length,
          photos: photoIDs
        }
      })
    }

    function preloadPhoto (photoID) {
      if (!photos[photoID]) {
        return
      }
      var photo = photos[photoID]
      var fullWidth = $(window).width() - (Config.Mobile ? 20 : 32)
      var fullHeight = $($window).height() - (Config.Mobile ? 150 : 116)
      if (fullWidth > 800) {
        fullWidth -= 208
      }
      var fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight)

      if (fullPhotoSize && !fullPhotoSize.preloaded) {
        fullPhotoSize.preloaded = true
        if (fullPhotoSize.size) {
          MtpApiFileManager.downloadFile(fullPhotoSize.location.dc_id, {
            _: 'inputFileLocation',
            volume_id: fullPhotoSize.location.volume_id,
            local_id: fullPhotoSize.location.local_id,
            secret: fullPhotoSize.location.secret
          }, fullPhotoSize.size)
        } else {
          MtpApiFileManager.downloadSmallFile(fullPhotoSize.location)
        }
      }
    }
    $rootScope.preloadPhoto = preloadPhoto

    function getPhoto (photoID) {
      return photos[photoID] || {_: 'photoEmpty'}
    }

    function wrapForHistory (photoID, options) {
      options = options || {}
      var photo = angular.copy(photos[photoID]) || {_: 'photoEmpty'}
      var width = options.website ? 64 : Math.min(windowW - 80, Config.Mobile ? 210 : 260)
      var height = options.website ? 64 : Math.min(windowH - 100, Config.Mobile ? 210 : 260)
      var thumbPhotoSize = choosePhotoSize(photo, width, height)
      var thumb = {
        placeholder: 'img/placeholders/PhotoThumbConversation.gif',
        width: width,
        height: height
      }

      if (options.website && Config.Mobile) {
        width = 50
        height = 50
      }

      // console.log('chosen photo size', photoID, thumbPhotoSize)
      if (thumbPhotoSize && thumbPhotoSize._ != 'photoSizeEmpty') {
        var dim = calcImageInBox(thumbPhotoSize.w, thumbPhotoSize.h, width, height)
        thumb.width = dim.w
        thumb.height = dim.h
        thumb.location = thumbPhotoSize.location
        thumb.size = thumbPhotoSize.size
      } else {
        thumb.width = 100
        thumb.height = 100
      }

      photo.thumb = thumb

      return photo
    }

    function wrapForFull (photoID) {
      var photo = wrapForHistory(photoID)
      var fullWidth = $(window).width() - (Config.Mobile ? 0 : 32)
      var fullHeight = $($window).height() - (Config.Mobile ? 0 : 116)
      if (!Config.Mobile && fullWidth > 800) {
        fullWidth -= 208
      }
      var fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight)
      var full = {
        placeholder: 'img/placeholders/PhotoThumbModal.gif'
      }

      full.width = fullWidth
      full.height = fullHeight

      if (fullPhotoSize && fullPhotoSize._ != 'photoSizeEmpty') {
        var wh = calcImageInBox(fullPhotoSize.w, fullPhotoSize.h, fullWidth, fullHeight, true)
        full.width = wh.w
        full.height = wh.h

        full.modalWidth = Math.max(full.width, Math.min(400, fullWidth))

        full.location = fullPhotoSize.location
        full.size = fullPhotoSize.size
      }

      photo.full = full

      return photo
    }

    function openPhoto (photoID, list) {
      if (!photoID || photoID === '0') {
        return false
      }

      var scope = $rootScope.$new(true)

      scope.photoID = photoID

      var controller = 'PhotoModalController'
      if (list && list.p > 0) {
        controller = 'UserpicModalController'
        scope.userID = list.p
      }
      else if (list && list.p < 0) {
        controller = 'ChatpicModalController'
        scope.chatID = -list.p
      }
      else if (list && list.m > 0) {
        scope.messageID = list.m
        if (list.w) {
          scope.webpageID = list.w
        }
      }

      var modalInstance = $modal.open({
        templateUrl: templateUrl('photo_modal'),
        windowTemplateUrl: templateUrl('media_modal_layout'),
        controller: controller,
        scope: scope,
        windowClass: 'photo_modal_window'
      })
    }

    function downloadPhoto (photoID) {
      var photo = photos[photoID]
      var ext = 'jpg'
      var mimeType = 'image/jpeg'
      var fileName = 'photo' + photoID + '.' + ext
      var fullWidth = Math.max(screen.width || 0, $(window).width() - 36, 800)
      var fullHeight = Math.max(screen.height || 0, $($window).height() - 150, 800)
      var fullPhotoSize = choosePhotoSize(photo, fullWidth, fullHeight)
      var inputFileLocation = {
        _: 'inputFileLocation',
        volume_id: fullPhotoSize.location.volume_id,
        local_id: fullPhotoSize.location.local_id,
        secret: fullPhotoSize.location.secret
      }

      FileManager.chooseSave(fileName, ext, mimeType).then(function (writableFileEntry) {
        if (writableFileEntry) {
          MtpApiFileManager.downloadFile(
            fullPhotoSize.location.dc_id, inputFileLocation, fullPhotoSize.size, {
              mime: mimeType,
              toFileEntry: writableFileEntry
            }).then(function () {
            // console.log('file save done')
          }, function (e) {
            console.log('photo download failed', e)
          })
        }
      }, function () {
        var cachedBlob = MtpApiFileManager.getCachedFile(inputFileLocation)
        if (cachedBlob) {
          return FileManager.download(cachedBlob, mimeType, fileName)
        }

        MtpApiFileManager.downloadFile(
          fullPhotoSize.location.dc_id, inputFileLocation, fullPhotoSize.size, {mime: mimeType}
        ).then(function (blob) {
          FileManager.download(blob, mimeType, fileName)
        }, function (e) {
          console.log('photo download failed', e)
        })
      })
    }

    $rootScope.openPhoto = openPhoto

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
    var webpages = {}
    var pendingWebPages = {}

    function saveWebPage (apiWebPage, messageID, mediaContext) {
      if (apiWebPage.photo && apiWebPage.photo._ === 'photo') {
        AppPhotosManager.savePhoto(apiWebPage.photo, mediaContext)
      } else {
        delete apiWebPage.photo
      }
      if (apiWebPage.document && apiWebPage.document._ === 'document') {
        AppDocsManager.saveDoc(apiWebPage.document, mediaContext)
      } else {
        if (apiWebPage.type == 'document') {
          delete apiWebPage.type
        }
        delete apiWebPage.document
      }

      var siteName = apiWebPage.site_name
      var shortTitle = apiWebPage.title || apiWebPage.author || siteName || ''
      if (siteName &&
        shortTitle == siteName) {
        delete apiWebPage.site_name
      }
      if (shortTitle.length > 100) {
        shortTitle = shortTitle.substr(0, 80) + '...'
      }
      apiWebPage.rTitle = RichTextProcessor.wrapRichText(shortTitle, {noLinks: true, noLinebreaks: true})
      var contextHashtag = ''
      if (siteName == 'GitHub') {
        var matches = apiWebPage.url.match(/(https?:\/\/github\.com\/[^\/]+\/[^\/]+)/)
        if (matches) {
          contextHashtag = matches[0] + '/issues/{1}'
        }
      }
      // delete apiWebPage.description
      var shortDescriptionText = (apiWebPage.description || '')
      if (shortDescriptionText.length > 180) {
        shortDescriptionText = shortDescriptionText.substr(0, 150).replace(/(\n|\s)+$/, '') + '...'
      }
      apiWebPage.rDescription = RichTextProcessor.wrapRichText(
        shortDescriptionText, {
          contextSite: siteName || 'external',
          contextHashtag: contextHashtag
        }
      )

      if (apiWebPage.type != 'photo' &&
        apiWebPage.type != 'video' &&
        apiWebPage.type != 'gif' &&
        apiWebPage.type != 'document' &&
        !apiWebPage.description &&
        apiWebPage.photo) {
        apiWebPage.type = 'photo'
      }

      if (messageID) {
        if (pendingWebPages[apiWebPage.id] === undefined) {
          pendingWebPages[apiWebPage.id] = {}
        }
        pendingWebPages[apiWebPage.id][messageID] = true
        webpages[apiWebPage.id] = apiWebPage
      }

      if (webpages[apiWebPage.id] === undefined) {
        webpages[apiWebPage.id] = apiWebPage
      } else {
        safeReplaceObject(webpages[apiWebPage.id], apiWebPage)
      }

      if (!messageID &&
        pendingWebPages[apiWebPage.id] !== undefined) {
        var msgs = []
        angular.forEach(pendingWebPages[apiWebPage.id], function (t, msgID) {
          msgs.push(msgID)
        })
        $rootScope.$broadcast('webpage_updated', {
          id: apiWebPage.id,
          msgs: msgs
        })
      }
    }

    function openEmbed (webpageID, messageID) {
      var scope = $rootScope.$new(true)

      scope.webpageID = webpageID
      scope.messageID = messageID

      $modal.open({
        templateUrl: templateUrl('embed_modal'),
        windowTemplateUrl: templateUrl('media_modal_layout'),
        controller: 'EmbedModalController',
        scope: scope,
        windowClass: 'photo_modal_window'
      })
    }

    function wrapForHistory (webPageID) {
      var webPage = angular.copy(webpages[webPageID]) || {_: 'webPageEmpty'}

      if (webPage.photo && webPage.photo.id) {
        webPage.photo = AppPhotosManager.wrapForHistory(webPage.photo.id, {website: webPage.type != 'photo' && webPage.type != 'video'})
      }
      if (webPage.document && webPage.document.id) {
        webPage.document = AppDocsManager.wrapForHistory(webPage.document.id)
      }

      return webPage
    }

    function wrapForFull (webPageID) {
      var webPage = wrapForHistory(webPageID)

      if (!webPage.embed_url) {
        return webPage
      }

      var fullWidth = $(window).width() - (Config.Mobile ? 0 : 10)
      var fullHeight = $($window).height() - (Config.Mobile ? 92 : 150)

      if (!Config.Mobile && fullWidth > 800) {
        fullWidth -= 208
      }

      var full = {
        width: fullWidth,
        height: fullHeight
      }

      if (!webPage.embed_width || !webPage.embed_height) {
        full.height = full.width = Math.min(fullWidth, fullHeight)
      } else {
        var wh = calcImageInBox(webPage.embed_width, webPage.embed_height, fullWidth, fullHeight)
        full.width = wh.w
        full.height = wh.h
      }

      var embedTag = Config.Modes.chrome_packed ? 'webview' : 'iframe'

      var embedType = webPage.embed_type != 'iframe' ? webPage.embed_type || 'text/html' : 'text/html'

      var embedHtml = '<' + embedTag + ' src="' + encodeEntities(webPage.embed_url) + '" type="' + encodeEntities(embedType) + '" frameborder="0" border="0" webkitallowfullscreen mozallowfullscreen allowfullscreen width="' + full.width + '" height="' + full.height + '" style="width: ' + full.width + 'px; height: ' + full.height + 'px;"></' + embedTag + '>'

      full.html = $sce.trustAs('html', embedHtml)

      webPage.full = full

      return webPage
    }

    $rootScope.$on('apiUpdate', function (e, update) {
      switch (update._) {
        case 'updateWebPage':
          saveWebPage(update.webpage)
          break
      }
    })

    return {
      saveWebPage: saveWebPage,
      openEmbed: openEmbed,
      wrapForFull: wrapForFull,
      wrapForHistory: wrapForHistory
    }
  })

  .service('AppGamesManager', function ($modal, $sce, $window, $rootScope, MtpApiManager, AppPhotosManager, AppDocsManager, RichTextProcessor) {
    var games = {}

    function saveGame (apiGame, messageID, mediaContext) {
      if (apiGame.photo && apiGame.photo._ === 'photo') {
        AppPhotosManager.savePhoto(apiGame.photo, mediaContext)
      } else {
        delete apiGame.photo
      }
      if (apiGame.document && apiGame.document._ === 'document') {
        AppDocsManager.saveDoc(apiGame.document, mediaContext)
      } else {
        delete apiGame.document
      }

      apiGame.rTitle = RichTextProcessor.wrapRichText(apiGame.title, {noLinks: true, noLinebreaks: true})
      apiGame.rDescription = RichTextProcessor.wrapRichText(
        apiGame.description || '', {}
      )

      if (games[apiGame.id] === undefined) {
        games[apiGame.id] = apiGame
      } else {
        safeReplaceObject(games[apiGame.id], apiGame)
      }
    }

    function openGame (gameID, messageID, embedUrl) {
      var scope = $rootScope.$new(true)

      scope.gameID = gameID
      scope.messageID = messageID
      scope.embedUrl = embedUrl

      $modal.open({
        templateUrl: templateUrl('game_modal'),
        windowTemplateUrl: templateUrl('media_modal_layout'),
        controller: 'GameModalController',
        scope: scope,
        windowClass: 'photo_modal_window mobile_modal'
      })
    }

    function wrapForHistory (gameID) {
      var game = angular.copy(games[gameID]) || {_: 'gameEmpty'}

      if (game.photo && game.photo.id) {
        game.photo = AppPhotosManager.wrapForHistory(game.photo.id)
      }
      if (game.document && game.document.id) {
        game.document = AppDocsManager.wrapForHistory(game.document.id)
      }

      return game
    }

    function wrapForFull (gameID, msgID, embedUrl) {
      var game = wrapForHistory(gameID)

      var fullWidth = $(window).width() - (Config.Mobile ? 0 : 10)
      var fullHeight = $($window).height() - (Config.Mobile ? 51 : 150)

      if (!Config.Mobile && fullWidth > 800) {
        fullWidth -= 208
      }

      var full = {
        width: fullWidth,
        height: fullHeight
      }

      var embedTag = Config.Modes.chrome_packed ? 'webview' : 'iframe'

      var embedType = 'text/html'

      var embedHtml = '<' + embedTag + ' src="' + encodeEntities(embedUrl) + '" type="' + encodeEntities(embedType) + '" frameborder="0" border="0" webkitallowfullscreen mozallowfullscreen allowfullscreen width="' + full.width + '" height="' + full.height + '" style="width: ' + full.width + 'px; height: ' + full.height + 'px;" sandbox="allow-scripts allow-same-origin"></' + embedTag + '>'

      full.html = $sce.trustAs('html', embedHtml)

      game.full = full

      return game
    }

    return {
      saveGame: saveGame,
      openGame: openGame,
      wrapForFull: wrapForFull,
      wrapForHistory: wrapForHistory
    }
  })

  .service('AppDocsManager', function ($sce, $rootScope, $modal, $window, $q, $timeout, RichTextProcessor, MtpApiFileManager, FileManager, qSync) {
    var docs = {}
    var docsForHistory = {}
    var windowW = $(window).width()
    var windowH = $(window).height()

    function saveDoc (apiDoc, context) {
      docs[apiDoc.id] = apiDoc

      if (context) {
        angular.extend(apiDoc, context)
      }
      if (apiDoc.thumb && apiDoc.thumb._ == 'photoCachedSize') {
        MtpApiFileManager.saveSmallFile(apiDoc.thumb.location, apiDoc.thumb.bytes)

        // Memory
        apiDoc.thumb.size = apiDoc.thumb.bytes.length
        delete apiDoc.thumb.bytes
        apiDoc.thumb._ = 'photoSize'
      }
      if (apiDoc.thumb && apiDoc.thumb._ == 'photoSizeEmpty') {
        delete apiDoc.thumb
      }
      angular.forEach(apiDoc.attributes, function (attribute) {
        switch (attribute._) {
          case 'documentAttributeFilename':
            apiDoc.file_name = attribute.file_name
            break
          case 'documentAttributeAudio':
            apiDoc.duration = attribute.duration
            apiDoc.audioTitle = attribute.title
            apiDoc.audioPerformer = attribute.performer
            apiDoc.type = attribute.pFlags.voice ? 'voice' : 'audio'
            break
          case 'documentAttributeVideo':
            apiDoc.duration = attribute.duration
            apiDoc.w = attribute.w
            apiDoc.h = attribute.h
            if (apiDoc.thumb &&
                attribute.pFlags.round_message) {
              apiDoc.type = 'round'
            }
            else if (apiDoc.thumb) {
              apiDoc.type = 'video'
            }
            break
          case 'documentAttributeSticker':
            apiDoc.sticker = true
            if (attribute.alt !== undefined) {
              apiDoc.stickerEmojiRaw = attribute.alt
              apiDoc.stickerEmoji = RichTextProcessor.wrapRichText(apiDoc.stickerEmojiRaw, {noLinks: true, noLinebreaks: true})
            }
            if (attribute.stickerset) {
              if (attribute.stickerset._ == 'inputStickerSetEmpty') {
                delete attribute.stickerset
              }
              else if (attribute.stickerset._ == 'inputStickerSetID') {
                apiDoc.stickerSetInput = attribute.stickerset
              }
            }
            if (apiDoc.thumb && apiDoc.mime_type == 'image/webp') {
              apiDoc.type = 'sticker'
            }
            break
          case 'documentAttributeImageSize':
            apiDoc.w = attribute.w
            apiDoc.h = attribute.h
            break
          case 'documentAttributeAnimated':
            if ((apiDoc.mime_type == 'image/gif' || apiDoc.mime_type == 'video/mp4') &&
              apiDoc.thumb) {
              apiDoc.type = 'gif'
            }
            apiDoc.animated = true
            break
        }
      })

      if (!apiDoc.mime_type) {
        switch (apiDoc.type) {
          case 'gif':
            apiDoc.mime_type = 'video/mp4'
            break
          case 'video':
          case 'round':
            apiDoc.mime_type = 'video/mp4'
            break
          case 'sticker':
            apiDoc.mime_type = 'image/webp'
            break
          case 'audio':
            apiDoc.mime_type = 'audio/mpeg'
            break
          case 'voice':
            apiDoc.mime_type = 'audio/ogg'
            break
          default:
            apiDoc.mime_type = 'application/octet-stream'
            break
        }
      }

      if (!apiDoc.file_name) {
        apiDoc.file_name = ''
      }

      if (apiDoc._ == 'documentEmpty') {
        apiDoc.size = 0
      }
    }

    function getDoc (docID) {
      return docs[docID] || {_: 'documentEmpty'}
    }

    function hasDoc (docID) {
      return docs[docID] !== undefined
    }

    function getFileName (doc) {
      if (doc.file_name) {
        return doc.file_name
      }
      var fileExt = '.' + doc.mime_type.split('/')[1]
      if (fileExt == '.octet-stream') {
        fileExt = ''
      }
      return 't_' + (doc.type || 'file') + doc.id + fileExt
    }

    function wrapForHistory (docID) {
      if (docsForHistory[docID] !== undefined) {
        return docsForHistory[docID]
      }

      var doc = angular.copy(docs[docID])
      var thumbPhotoSize = doc.thumb
      var inlineImage = false,
        boxWidth
      var boxHeight, thumb
      var dim

      switch (doc.type) {
        case 'video':
          boxWidth = Math.min(windowW - 80, Config.Mobile ? 210 : 150),
          boxHeight = Math.min(windowH - 100, Config.Mobile ? 210 : 150)
          break

        case 'sticker':
          inlineImage = true
          boxWidth = Math.min(windowW - 80, Config.Mobile ? 128 : 192)
          boxHeight = Math.min(windowH - 100, Config.Mobile ? 128 : 192)
          break

        case 'gif':
          inlineImage = true
          boxWidth = Math.min(windowW - 80, Config.Mobile ? 210 : 260)
          boxHeight = Math.min(windowH - 100, Config.Mobile ? 210 : 260)
          break

        case 'round':
          inlineImage = true
          boxWidth = Math.min(windowW - 80, 200)
          boxHeight = Math.min(windowH - 100, 200)
          break

        default:
          boxWidth = boxHeight = 100
      }

      if (inlineImage && doc.w && doc.h) {
        dim = calcImageInBox(doc.w, doc.h, boxWidth, boxHeight)
      }
      else if (thumbPhotoSize) {
        dim = calcImageInBox(thumbPhotoSize.w, thumbPhotoSize.h, boxWidth, boxHeight)
      }

      if (dim) {
        thumb = {
          width: dim.w,
          height: dim.h
        }
        if (thumbPhotoSize) {
          thumb.location = thumbPhotoSize.location
          thumb.size = thumbPhotoSize.size
        }
      } else {
        thumb = false
      }
      doc.thumb = thumb

      doc.withPreview = !Config.Mobile && doc.mime_type.match(/^image\/(gif|png|jpeg|jpg|bmp|tiff)/) ? 1 : 0

      return docsForHistory[docID] = doc
    }

    function updateDocDownloaded (docID) {
      var doc = docs[docID]
      var historyDoc = docsForHistory[docID] || doc || {}
      var inputFileLocation = {
        _: 'inputDocumentFileLocation',
        id: docID,
        access_hash: doc.access_hash,
        version: doc.version,
        file_name: getFileName(doc)
      }

      if (historyDoc.downloaded === undefined) {
        MtpApiFileManager.getDownloadedFile(inputFileLocation, doc.size).then(function () {
          historyDoc.downloaded = true
        }, function () {
          historyDoc.downloaded = false
        })
      }
    }

    function downloadDoc (docID, toFileEntry) {
      var doc = docs[docID]
      var historyDoc = docsForHistory[docID] || doc || {}
      var inputFileLocation = {
        _: 'inputDocumentFileLocation',
        id: docID,
        access_hash: doc.access_hash,
        version: doc.version,
        file_name: getFileName(doc)
      }

      if (doc._ == 'documentEmpty') {
        return $q.reject()
      }

      if (historyDoc.downloaded && !toFileEntry) {
        var cachedBlob = MtpApiFileManager.getCachedFile(inputFileLocation)
        if (cachedBlob) {
          return qSync.when(cachedBlob)
        }
      }

      historyDoc.progress = {enabled: !historyDoc.downloaded, percent: 1, total: doc.size}

      var downloadPromise = MtpApiFileManager.downloadFile(doc.dc_id, inputFileLocation, doc.size, {
        mime: doc.mime_type || 'application/octet-stream',
        toFileEntry: toFileEntry
      })

      downloadPromise.then(function (blob) {
        if (blob) {
          FileManager.getFileCorrectUrl(blob, doc.mime_type).then(function (url) {
            var trustedUrl = $sce.trustAsResourceUrl(url)
            historyDoc.url = trustedUrl
            doc.url = trustedUrl
          })
          historyDoc.downloaded = true
        }
        historyDoc.progress.percent = 100
        $timeout(function () {
          delete historyDoc.progress
        })
      // console.log('file save done')
      }, function (e) {
        console.log('document download failed', e)
        historyDoc.progress.enabled = false
      }, function (progress) {
        console.log('dl progress', progress)
        historyDoc.progress.enabled = true
        historyDoc.progress.done = progress.done
        historyDoc.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total))
        $rootScope.$broadcast('history_update')
      })

      historyDoc.progress.cancel = downloadPromise.cancel

      return downloadPromise
    }

    function openDoc (docID, messageID) {
      var scope = $rootScope.$new(true)
      scope.docID = docID
      scope.messageID = messageID

      var modalInstance = $modal.open({
        templateUrl: templateUrl('document_modal'),
        windowTemplateUrl: templateUrl('media_modal_layout'),
        controller: 'DocumentModalController',
        scope: scope,
        windowClass: 'document_modal_window'
      })
    }

    function saveDocFile (docID) {
      var doc = docs[docID]
      var historyDoc = docsForHistory[docID] || doc || {}
      var mimeType = doc.mime_type
      var fileName = getFileName(doc)
      var ext = (fileName.split('.', 2) || [])[1] || ''

      FileManager.chooseSave(getFileName(doc), ext, doc.mime_type).then(function (writableFileEntry) {
        if (writableFileEntry) {
          downloadDoc(docID, writableFileEntry)
        }
      }, function () {
        downloadDoc(docID).then(function (blob) {
          FileManager.download(blob, doc.mime_type, fileName)
        })
      })
    }

    function wrapVideoForFull (docID) {
      var doc = wrapForHistory(docID)
      var fullWidth = Math.min($(window).width() - (Config.Mobile ? 0 : 60), 542)
      var fullHeight = $(window).height() - (Config.Mobile ? 92 : 150)
      var full = {
        placeholder: 'img/placeholders/docThumbModal.gif',
        width: fullWidth,
        height: fullHeight
      }

      if (!doc.w || !doc.h) {
        full.height = full.width = Math.min(fullWidth, fullHeight)
      } else {
        var dim = calcImageInBox(doc.w, doc.h, fullWidth, fullHeight)
        full.width = dim.w
        full.height = dim.h
      }

      doc.full = full
      doc.fullThumb = angular.copy(doc.thumb)
      doc.fullThumb.width = full.width
      doc.fullThumb.height = full.height

      return doc
    }

    function openVideo (docID, messageID) {
      var scope = $rootScope.$new(true)
      scope.docID = docID
      scope.messageID = messageID

      return $modal.open({
        templateUrl: templateUrl('video_modal'),
        windowTemplateUrl: templateUrl('media_modal_layout'),
        controller: 'VideoModalController',
        scope: scope,
        windowClass: 'video_modal_window'
      })
    }

    return {
      saveDoc: saveDoc,
      getDoc: getDoc,
      hasDoc: hasDoc,
      wrapForHistory: wrapForHistory,
      wrapVideoForFull: wrapVideoForFull,
      updateDocDownloaded: updateDocDownloaded,
      downloadDoc: downloadDoc,
      openDoc: openDoc,
      openVideo: openVideo,
      saveDocFile: saveDocFile
    }
  })

  .service('AppStickersManager', function ($q, $rootScope, $modal, _, FileManager, MtpApiManager, AppDocsManager, Storage, ApiUpdatesManager) {
    var started = false
    var applied = false
    var currentStickerSets = []
    var emojiIndex = {}

    $rootScope.$on('apiUpdate', function (e, update) {
      if (update._ != 'updateStickerSets' &&
        update._ != 'updateNewStickerSet' &&
        update._ != 'updateDelStickerSet' &&
        update._ != 'updateStickerSetsOrder') {
        return false
      }

      return Storage.get('all_stickers').then(function (stickers) {
        if (!stickers ||
            stickers.layer != Config.Schema.API.layer) {
          $rootScope.$broadcast('stickers_changed')
        }
        switch (update._) {
          case 'updateNewStickerSet':
            var fullSet = update.stickerset
            var set = fullSet.set
            if (set.pFlags.masks) {
              return false
            }
            var pos = false
            for (var i = 0, len = stickers.sets.length; i < len; i++) {
              if (stickers.sets[i].id == set.id) {
                pos = i
                break
              }
            }
            if (pos !== false) {
              stickers.sets.splice(pos, 1)
            }
            set.pFlags.installed = true
            stickers.sets.unshift(set)
            stickers.fullSets[set.id] = fullSet
            indexStickerSetEmoticons(fullSet)
            break

          case 'updateDelStickerSet':
            var set
            for (var i = 0, len = stickers.sets.length; i < len; i++) {
              set = stickers.sets[i]
              if (set.id == update.id) {
                set.pFlags.installed = false
                stickers.sets.splice(i, 1)
                break
              }
            }
            delete stickers.fullSets[update.id]
            break

          case 'updateStickerSetsOrder':
            if (update.pFlags.masks) {
              return
            }
            var order = update.order
            stickers.sets.sort(function (a, b) {
              return order.indexOf(a.id) - order.indexOf(b.id)
            })
            break
        }
        stickers.hash = getStickerSetsHash(stickers.sets)
        stickers.date = 0
        Storage.set({all_stickers: stickers}).then(function () {
          $rootScope.$broadcast('stickers_changed')
        })
      })
    })

    return {
      start: start,
      getStickers: getStickers,
      openStickersetLink: openStickersetLink,
      openStickerset: openStickerset,
      installStickerset: installStickerset,
      pushPopularSticker: pushPopularSticker,
      searchStickers: searchStickers,
      getStickerset: getStickerset
    }

    function start () {
      if (!started) {
        started = true
        setTimeout(getStickers, 1000)
      }
    }

    function getStickers (force) {
      return Storage.get('all_stickers').then(function (stickers) {
        var layer = Config.Schema.API.layer
        if (stickers.layer != layer ||
            stickers.emojiIndex === undefined) {
          stickers = false
        }
        if (stickers && stickers.date > tsNow(true) && !force) {
          emojiIndex = stickers.emojiIndex
          return processRawStickers(stickers)
        }
        return MtpApiManager.invokeApi('messages.getAllStickers', {
          hash: stickers && stickers.hash || ''
        }).then(function (newStickers) {
          var notModified = newStickers._ == 'messages.allStickersNotModified'
          if (notModified) {
            newStickers = stickers
          }
          newStickers.date = tsNow(true) + 3600
          newStickers.layer = layer
          delete newStickers._

          if (notModified) {
            Storage.set({all_stickers: newStickers})
            emojiIndex = newStickers.emojiIndex
            return processRawStickers(newStickers)
          }

          return getStickerSets(newStickers, stickers && stickers.fullSets).then(function () {
            Storage.set({all_stickers: newStickers})
            return processRawStickers(newStickers)
          })
        })
      })
    }

    function processRawStickers (stickers) {
      if (applied !== stickers.hash) {
        applied = stickers.hash
        var i
        var j, len1
        var len2, doc
        var set, docIDs
        var documents

        currentStickerSets = []
        len1 = stickers.sets.length
        for (i = 0; i < len1; i++) {
          set = stickers.sets[i]
          if (set.pFlags.disabled) {
            continue
          }
          documents = stickers.fullSets[set.id].documents
          len2 = documents.length
          docIDs = []
          for (j = 0; j < len2; j++) {
            doc = documents[j]
            AppDocsManager.saveDoc(doc)
            docIDs.push(doc.id)
          }
          set.docIDs = docIDs
          currentStickerSets.push(set)
        }
      }

      return getPopularStickers().then(function (popularStickers) {
        var resultStickersets = currentStickerSets
        if (popularStickers.length) {
          resultStickersets = currentStickerSets.slice()
          var docIDs = []
          var i
          var len
          for (i = 0, len = popularStickers.length; i < len; i++) {
            docIDs.push(popularStickers[i].id)
          }
          resultStickersets.unshift({
            id: 0,
            title: _('im_stickers_tab_recent_raw'),
            short_name: '',
            docIDs: docIDs
          })
        }
        return resultStickersets
      })
    }

    function indexStickerSetEmoticons(fullSet) {
      angular.forEach(fullSet.packs, function (pack) {
        var emoji = pack.emoticon
        var emojiCode = false
        while (emoji.length) {
          emojiCode = EmojiHelper.emojiMap[emoji]
          if (emojiCode !== undefined) {
            break
          }
          emoji = emoji.substr(0, -1)
        }
        // console.warn('index', fullSet, pack, emojiCode)
        if (emojiCode === undefined) {
          return
        }
        var stickersList = emojiIndex[emojiCode]
        if (stickersList === undefined) {
          emojiIndex[emojiCode] = stickersList = []
        }
        angular.forEach(pack.documents, function (docID) {
          if (stickersList.indexOf(docID) === -1) {
            stickersList.push(docID)
          }
        })
      })
    }

    function searchStickers(emojiCode) {
      return getPopularStickers().then(function () {
        // console.warn('search', emojiCode, emojiIndex, emojiIndex[emojiCode])
        var stickersList = emojiIndex[emojiCode]
        var result = []
        if (stickersList === undefined) {
          return result
        }
        var setIDs = []
        angular.forEach(currentStickerSets, function (set) {
          setIDs.push(set.id)
        })
        angular.forEach(stickersList, function (docID) {
          var doc = AppDocsManager.getDoc(docID)
          if (!doc || !doc.stickerSetInput) {
            return
          }
          var setID = doc.stickerSetInput.id
          if (setIDs.indexOf(setID) == -1) {
            return
          }
          result.push(doc)
        })
        result.sort(function (doc1, doc2) {
          return setIDs.indexOf(doc1.stickerSetInput.id) - setIDs.indexOf(doc2.stickerSetInput.id)
        })
        return result
      })

    }

    function getStickerSets (allStickers, prevCachedSets) {
      var promises = []
      var cachedSets = prevCachedSets || allStickers.fullSets || {}
      allStickers.fullSets = {}
      emojiIndex = allStickers.emojiIndex = {}
      angular.forEach(allStickers.sets, function (shortSet) {
        var fullSet = cachedSets[shortSet.id]
        if (fullSet && fullSet.set.hash == shortSet.hash) {
          allStickers.fullSets[shortSet.id] = fullSet
          indexStickerSetEmoticons(fullSet)
        } else {
          var promise = MtpApiManager.invokeApi('messages.getStickerSet', {
            stickerset: {
              _: 'inputStickerSetID',
              id: shortSet.id,
              access_hash: shortSet.access_hash
            }
          }).then(function (fullSet) {
            allStickers.fullSets[shortSet.id] = fullSet
            indexStickerSetEmoticons(fullSet)
          })
          promises.push(promise)
        }
      })
      return $q.all(promises)
    }

    function getPopularStickers () {
      return Storage.get('stickers_popular').then(function (popStickers) {
        var result = []
        var i, len
        var docID
        if (popStickers && popStickers.length) {
          for (i = 0, len = popStickers.length; i < len; i++) {
            docID = popStickers[i][0]
            if (AppDocsManager.hasDoc(docID)) {
              result.push({id: docID, rate: popStickers[i][1]})
            }
          }
        }
        return result
      })
    }

    function pushPopularSticker (id) {
      getPopularStickers().then(function (popularStickers) {
        var exists = false
        var count = popularStickers.length
        var result = []
        for (var i = 0; i < count; i++) {
          if (popularStickers[i].id == id) {
            exists = true
            popularStickers[i].rate++
          }
          result.push([popularStickers[i].id, popularStickers[i].rate])
        }
        if (exists) {
          result.sort(function (a, b) {
            return b[1] - a[1]
          })
        } else {
          if (result.length > 15) {
            result = result.slice(0, 15)
          }
          result.push([id, 1])
        }
        ConfigStorage.set({stickers_popular: result})
      })
    }

    function getStickerset (inputStickerset) {
      return MtpApiManager.invokeApi('messages.getStickerSet', {
        stickerset: inputStickerset
      }).then(function (result) {
        for (var i = 0; i < result.documents.length; i++) {
          AppDocsManager.saveDoc(result.documents[i])
        }
        return result
      })
    }

    function installStickerset (fullSet, uninstall) {
      var method = uninstall
        ? 'messages.uninstallStickerSet'
        : 'messages.installStickerSet'
      var inputStickerset = {
        _: 'inputStickerSetID',
        id: fullSet.set.id,
        access_hash: fullSet.set.access_hash
      }
      return MtpApiManager.invokeApi(method, {
        stickerset: inputStickerset,
        disabled: false
      }).then(function (result) {
        var update
        if (uninstall) {
          update = {_: 'updateDelStickerSet', id: fullSet.set.id}
        } else {
          update = {_: 'updateNewStickerSet', stickerset: fullSet}
        }
        ApiUpdatesManager.processUpdateMessage({
          _: 'updateShort',
          update: update
        })
      })
    }

    function openStickersetLink (shortName) {
      return openStickerset({
        _: 'inputStickerSetShortName',
        short_name: shortName
      })
    }

    function openStickerset (inputStickerset) {
      var scope = $rootScope.$new(true)
      scope.inputStickerset = inputStickerset
      var modal = $modal.open({
        templateUrl: templateUrl('stickerset_modal'),
        controller: 'StickersetModalController',
        scope: scope,
        windowClass: 'stickerset_modal_window mobile_modal'
      })
    }

    function getStickerSetsHash (stickerSets) {
      var acc = 0
      var set
      for (var i = 0; i < stickerSets.length; i++) {
        set = stickerSets[i]
        if (set.pFlags.disabled || !set.pFlags.installed) {
          continue
        }
        acc = ((acc * 20261) + 0x80000000 + set.hash) % 0x80000000
      }
      return acc
    }
  })

  .service('AppInlineBotsManager', function (qSync, $q, $rootScope, toaster, Storage, ErrorService, MtpApiManager, AppMessagesManager, AppMessagesIDsManager, AppDocsManager, AppPhotosManager, AppGamesManager, RichTextProcessor, AppUsersManager, AppPeersManager, LocationParamsService, PeersSelectService, GeoLocationManager) {
    var inlineResults = {}

    return {
      resolveInlineMention: resolveInlineMention,
      getPopularBots: getPopularBots,
      sendInlineResult: sendInlineResult,
      getInlineResults: getInlineResults,
      regroupWrappedResults: regroupWrappedResults,
      switchToPM: switchToPM,
      checkSwitchReturn: checkSwitchReturn,
      switchInlineButtonClick: switchInlineButtonClick,
      callbackButtonClick: callbackButtonClick,
      gameButtonClick: gameButtonClick
    }

    function getPopularBots () {
      return Storage.get('inline_bots_popular').then(function (bots) {
        var result = []
        var i, len
        var userID
        if (bots && bots.length) {
          var now = tsNow(true)
          for (i = 0, len = bots.length; i < len; i++) {
            if ((now - bots[i][3]) > 14 * 86400) {
              continue
            }
            userID = bots[i][0]
            if (!AppUsersManager.hasUser(userID)) {
              AppUsersManager.saveApiUser(bots[i][1])
            }
            result.push({id: userID, rate: bots[i][2], date: bots[i][3]})
          }
        }
        return result
      })
    }

    function pushPopularBot (id) {
      getPopularBots().then(function (bots) {
        var exists = false
        var count = bots.length
        var result = []
        for (var i = 0; i < count; i++) {
          if (bots[i].id == id) {
            exists = true
            bots[i].rate++
            bots[i].date = tsNow(true)
          }
          var user = AppUsersManager.getUser(bots[i].id)
          result.push([bots[i].id, user, bots[i].rate, bots[i].date])
        }
        if (exists) {
          result.sort(function (a, b) {
            return b[2] - a[2]
          })
        } else {
          if (result.length > 15) {
            result = result.slice(0, 15)
          }
          result.push([id, AppUsersManager.getUser(id), 1, tsNow(true)])
        }
        ConfigStorage.set({inline_bots_popular: result})

        $rootScope.$broadcast('inline_bots_popular')
      })
    }

    function resolveInlineMention (username) {
      return AppPeersManager.resolveUsername(username).then(function (peerID) {
        if (peerID > 0) {
          var bot = AppUsersManager.getUser(peerID)
          if (bot.pFlags.bot && bot.bot_inline_placeholder !== undefined) {
            var resolvedBot = {
              username: username,
              id: peerID,
              placeholder: bot.bot_inline_placeholder
            }
            if (bot.pFlags.bot_inline_geo &&
              GeoLocationManager.isAvailable()) {
              return checkGeoLocationAccess(peerID).then(function () {
                return GeoLocationManager.getPosition().then(function (coords) {
                  resolvedBot.geo = coords
                  return qSync.when(resolvedBot)
                })
              })['catch'](function () {
                return qSync.when(resolvedBot)
              })
            }
            return qSync.when(resolvedBot)
          }
        }
        return $q.reject()
      }, function (error) {
        error.handled = true
        return $q.reject(error)
      })
    }

    function getInlineResults (peerID, botID, query, geo, offset) {
      return MtpApiManager.invokeApi('messages.getInlineBotResults', {
        flags: 0 | (geo ? 1 : 0),
        bot: AppUsersManager.getUserInput(botID),
        peer: AppPeersManager.getInputPeerByID(peerID),
        query: query,
        geo_point: geo && {_: 'inputGeoPoint', lat: geo['lat'], long: geo['long']},
        offset: offset
      }, {timeout: 1, stopTime: -1, noErrorBox: true}).then(function (botResults) {
        var queryID = botResults.query_id
        delete botResults._
        delete botResults.flags
        delete botResults.query_id

        if (botResults.switch_pm) {
          botResults.switch_pm.rText = RichTextProcessor.wrapRichText(botResults.switch_pm.text, {noLinebreaks: true, noLinks: true})
        }

        angular.forEach(botResults.results, function (result) {
          var qID = queryID + '_' + result.id
          result.qID = qID
          result.botID = botID

          result.rTitle = RichTextProcessor.wrapRichText(result.title, {noLinebreaks: true, noLinks: true})
          result.rDescription = RichTextProcessor.wrapRichText(result.description, {noLinebreaks: true, noLinks: true})
          result.initials = (result.url || result.title || result.type || '').substr(0, 1)

          if (result.document) {
            AppDocsManager.saveDoc(result.document)
          }
          if (result.photo) {
            AppPhotosManager.savePhoto(result.photo)
          }

          inlineResults[qID] = result
        })
        return botResults
      })
    }

    function regroupWrappedResults (results, rowW, rowH) {
      if (!results ||
          !results[0] ||
          ['photo', 'gif', 'sticker'].indexOf(results[0].type) == -1) {
        return
      }
      var ratios = []
      angular.forEach(results, function (result) {
        var w
        var h, doc
        var photo
        if (result._ == 'botInlineMediaResult') {
          if (doc = result.document) {
            w = result.document.w
            h = result.document.h
          }
          else if (photo = result.photo) {
            var photoSize = (photo.sizes || [])[0]
            w = photoSize && photoSize.w
            h = photoSize && photoSize.h
          }
        }else {
          w = result.w
          h = result.h
        }
        if (!w || !h) {
          w = h = 1
        }
        ratios.push(w / h)
      })

      var rows = []
      var curCnt = 0
      var curW = 0
      angular.forEach(ratios, function (ratio) {
        var w = ratio * rowH
        curW += w
        if (!curCnt || curCnt < 4 && curW < (rowW * 1.1)) {
          curCnt++
        } else {
          rows.push(curCnt)
          curCnt = 1
          curW = w
        }
      })
      if (curCnt) {
        rows.push(curCnt)
      }

      var i = 0
      var thumbs = []
      var lastRowI = rows.length - 1
      angular.forEach(rows, function (rowCnt, rowI) {
        var lastRow = rowI == lastRowI
        var curRatios = ratios.slice(i, i + rowCnt)
        var sumRatios = 0
        angular.forEach(curRatios, function (ratio) {
          sumRatios += ratio
        })
        angular.forEach(curRatios, function (ratio, j) {
          var thumbH = rowH
          var thumbW = rowW * ratio / sumRatios
          var realW = thumbH * ratio
          if (lastRow && thumbW > realW) {
            thumbW = realW
          }
          var result = results[i + j]
          result.thumbW = Math.floor(thumbW) - 2
          result.thumbH = Math.floor(thumbH) - 2
        })

        i += rowCnt
      })
    }

    function switchToPM (fromPeerID, botID, startParam) {
      var peerString = AppPeersManager.getPeerString(fromPeerID)
      var setHash = {}
      setHash['inline_switch_pm' + botID] = {peer: peerString, time: tsNow()}
      Storage.set(setHash)
      $rootScope.$broadcast('history_focus', {peerString: AppPeersManager.getPeerString(botID)})
      AppMessagesManager.startBot(botID, 0, startParam)
    }

    function checkSwitchReturn (botID) {
      var bot = AppUsersManager.getUser(botID)
      if (!bot || !bot.pFlags.bot || !bot.bot_inline_placeholder) {
        return qSync.when(false)
      }
      var key = 'inline_switch_pm' + botID
      return Storage.get(key).then(function (peerData) {
        if (peerData) {
          Storage.remove(key)
          if (tsNow() - peerData.time < 3600000) {
            return peerData.peer
          }
        }
        return false
      })
    }

    function switchInlineQuery (botID, toPeerString, query) {
      $rootScope.$broadcast('history_focus', {
        peerString: toPeerString,
        attachment: {
          _: 'inline_query',
          mention: '@' + AppUsersManager.getUser(botID).username,
          query: query
        }
      })
    }

    function switchInlineButtonClick (id, button) {
      var message = AppMessagesManager.getMessage(id)
      var botID = message.viaBotID || message.fromID
      if (button.pFlags && button.pFlags.same_peer) {
        var peerID = AppMessagesManager.getMessagePeer(message)
        var toPeerString = AppPeersManager.getPeerString(peerID)
        switchInlineQuery(botID, toPeerString, button.query)
        return
      }
      return checkSwitchReturn(botID).then(function (retPeerString) {
        if (retPeerString) {
          return switchInlineQuery(botID, retPeerString, button.query)
        }
        PeersSelectService.selectPeer({
          canSend: true
        }).then(function (toPeerString) {
          return switchInlineQuery(botID, toPeerString, button.query)
        })
      })
    }

    function callbackButtonClick (id, button) {
      var message = AppMessagesManager.getMessage(id)
      var botID = message.fromID
      var peerID = AppMessagesManager.getMessagePeer(message)

      return MtpApiManager.invokeApi('messages.getBotCallbackAnswer', {
        flags: 1,
        peer: AppPeersManager.getInputPeerByID(peerID),
        msg_id: AppMessagesIDsManager.getMessageLocalID(id),
        data: button.data
      }, {timeout: 1, stopTime: -1, noErrorBox: true}).then(function (callbackAnswer) {
        if (typeof callbackAnswer.message === 'string' &&
            callbackAnswer.message.length) {
          showCallbackMessage(callbackAnswer.message, callbackAnswer.pFlags.alert)
        }
        else if (typeof callbackAnswer.url === 'string') {
          var url = RichTextProcessor.wrapUrl(callbackAnswer.url, true)
          LocationParamsService.openUrl(url)
        }
      })
    }

    function gameButtonClick (id) {
      var message = AppMessagesManager.getMessage(id)
      var peerID = AppMessagesManager.getMessagePeer(message)

      return MtpApiManager.invokeApi('messages.getBotCallbackAnswer', {
        flags: 2,
        peer: AppPeersManager.getInputPeerByID(peerID),
        msg_id: AppMessagesIDsManager.getMessageLocalID(id)
      }, {timeout: 1, stopTime: -1, noErrorBox: true}).then(function (callbackAnswer) {
        if (typeof callbackAnswer.message === 'string' &&
            callbackAnswer.message.length) {
          showCallbackMessage(callbackAnswer.message, callbackAnswer.pFlags.alert)
        }
        else if (typeof callbackAnswer.url === 'string') {
          AppGamesManager.openGame(message.media.game.id, id, callbackAnswer.url)
        }
      })
    }

    function showCallbackMessage(message, isAlert) {
      if (typeof message != 'string' ||
        !message.length) {
        return
      }
      var html = RichTextProcessor.wrapRichText(message, {noLinks: true, noLinebreaks: true})
      if (isAlert) {
        ErrorService.show({
          title_html: html,
          alert: true
        })
      } else {
        toaster.pop({
          type: 'info',
          body: html.valueOf(),
          bodyOutputType: 'trustedHtml',
          showCloseButton: false
        })
      }
    }

    function sendInlineResult (peerID, qID, options) {
      var inlineResult = inlineResults[qID]
      if (inlineResult === undefined) {
        return false
      }
      pushPopularBot(inlineResult.botID)
      var splitted = qID.split('_')
      var queryID = splitted.shift()
      var resultID = splitted.join('_')
      options = options || {}
      options.viaBotID = inlineResult.botID
      options.queryID = queryID
      options.resultID = resultID
      if (inlineResult.send_message.reply_markup) {
        options.reply_markup = inlineResult.send_message.reply_markup
      }

      if (inlineResult.send_message._ == 'botInlineMessageText') {
        options.entities = inlineResult.send_message.entities
        AppMessagesManager.sendText(peerID, inlineResult.send_message.message, options)
      } else {
        var caption = ''
        var inputMedia = false
        switch (inlineResult.send_message._) {
          case 'botInlineMessageMediaAuto':
            caption = inlineResult.send_message.caption
            if (inlineResult._ == 'botInlineMediaResult') {
              var doc = inlineResult.document
              var photo = inlineResult.photo
              if (doc) {
                inputMedia = {
                  _: 'inputMediaDocument',
                  id: {_: 'inputDocument', id: doc.id, access_hash: doc.access_hash},
                  caption: caption
                }
              } else {
                inputMedia = {
                  _: 'inputMediaPhoto',
                  id: {_: 'inputPhoto', id: photo.id, access_hash: photo.access_hash},
                  caption: caption
                }
              }
            }
            break

          case 'botInlineMessageMediaGeo':
            inputMedia = {
              _: 'inputMediaGeoPoint',
              geo_point: {
                _: 'inputGeoPoint',
                'lat': inlineResult.send_message.geo['lat'],
                'long': inlineResult.send_message.geo['long']
              }
            }
            break

          case 'botInlineMessageMediaVenue':
            inputMedia = {
              _: 'inputMediaVenue',
              geo_point: {
                _: 'inputGeoPoint',
                'lat': inlineResult.send_message.geo['lat'],
                'long': inlineResult.send_message.geo['long']
              },
              title: inlineResult.send_message.title,
              address: inlineResult.send_message.address,
              provider: inlineResult.send_message.provider,
              venue_id: inlineResult.send_message.venue_id
            }
            break

          case 'botInlineMessageMediaContact':
            inputMedia = {
              _: 'inputMediaContact',
              phone_number: inlineResult.send_message.phone_number,
              first_name: inlineResult.send_message.first_name,
              last_name: inlineResult.send_message.last_name
            }
            break
        }
        if (!inputMedia) {
          inputMedia = {
            _: 'messageMediaPending',
            type: inlineResult.type,
            file_name: inlineResult.title || inlineResult.content_url || inlineResult.url,
            size: 0,
            progress: {percent: 30, total: 0}
          }
        }
        AppMessagesManager.sendOther(peerID, inputMedia, options)
      }
    }

    function checkGeoLocationAccess (botID) {
      var key = 'bot_access_geo' + botID
      return Storage.get(key).then(function (geoAccess) {
        if (geoAccess && geoAccess.granted) {
          return true
        }
        return ErrorService.confirm({
          type: 'BOT_ACCESS_GEO_INLINE'
        }).then(function () {
          var setHash = {}
          setHash[key] = {granted: true, time: tsNow()}
          Storage.set(setHash)
          return true
        }, function () {
          var setHash = {}
          setHash[key] = {denied: true, time: tsNow()}
          Storage.set(setHash)
          return $q.reject()
        })
      })
    }
  })

  .service('ApiUpdatesManager', function ($rootScope, MtpNetworkerFactory, AppUsersManager, AppChatsManager, AppPeersManager, MtpApiManager) {
    var updatesState = {
      pendingPtsUpdates: [],
      pendingSeqUpdates: {},
      syncPending: false,
      syncLoading: true
    }
    var channelStates = {}

    var myID = 0
    MtpApiManager.getUserID().then(function (id) {
      myID = id
    })

    function popPendingSeqUpdate () {
      var nextSeq = updatesState.seq + 1
      var pendingUpdatesData = updatesState.pendingSeqUpdates[nextSeq]
      if (!pendingUpdatesData) {
        return false
      }
      var updates = pendingUpdatesData.updates
      var i
      var length
      for (var i = 0, length = updates.length; i < length; i++) {
        saveUpdate(updates[i])
      }
      updatesState.seq = pendingUpdatesData.seq
      if (pendingUpdatesData.date && updatesState.date < pendingUpdatesData.date) {
        updatesState.date = pendingUpdatesData.date
      }
      delete updatesState.pendingSeqUpdates[nextSeq]

      if (!popPendingSeqUpdate() &&
        updatesState.syncPending &&
        updatesState.syncPending.seqAwaiting &&
        updatesState.seq >= updatesState.syncPending.seqAwaiting) {
        if (!updatesState.syncPending.ptsAwaiting) {
          clearTimeout(updatesState.syncPending.timeout)
          updatesState.syncPending = false
        } else {
          delete updatesState.syncPending.seqAwaiting
        }
      }

      return true
    }

    function popPendingPtsUpdate (channelID) {
      var curState = channelID ? getChannelState(channelID) : updatesState
      if (!curState.pendingPtsUpdates.length) {
        return false
      }
      curState.pendingPtsUpdates.sort(function (a, b) {
        return a.pts - b.pts
      })
      // console.log(dT(), 'pop update', channelID, curState.pendingPtsUpdates)

      var curPts = curState.pts
      var goodPts = false
      var goodIndex = false
      var update
      for (var i = 0, length = curState.pendingPtsUpdates.length; i < length; i++) {
        update = curState.pendingPtsUpdates[i]
        curPts += update.pts_count
        if (curPts >= update.pts) {
          goodPts = update.pts
          goodIndex = i
        }
      }

      if (!goodPts) {
        return false
      }

      console.log(dT(), 'pop pending pts updates', goodPts, curState.pendingPtsUpdates.slice(0, goodIndex + 1))

      curState.pts = goodPts
      for (i = 0; i <= goodIndex; i++) {
        update = curState.pendingPtsUpdates[i]
        saveUpdate(update)
      }
      curState.pendingPtsUpdates.splice(0, goodIndex + 1)

      if (!curState.pendingPtsUpdates.length && curState.syncPending) {
        if (!curState.syncPending.seqAwaiting) {
          clearTimeout(curState.syncPending.timeout)
          curState.syncPending = false
        } else {
          delete curState.syncPending.ptsAwaiting
        }
      }

      return true
    }

    function forceGetDifference () {
      if (!updatesState.syncLoading) {
        getDifference()
      }
    }

    function processUpdateMessage (updateMessage, fromMTProto) {
      // return forceGetDifference()
      var processOpts = {
        date: updateMessage.date,
        seq: updateMessage.seq,
        seqStart: updateMessage.seq_start
      }

      switch (updateMessage._) {
        case 'updatesTooLong':
        case 'new_session_created':
          forceGetDifference()
          break

        case 'updateShort':
          processUpdate(updateMessage.update, processOpts)
          break

        case 'updateShortMessage':
        case 'updateShortChatMessage':
          var isOut = updateMessage.flags & 2
          var fromID = updateMessage.from_id || (isOut ? myID : updateMessage.user_id)
          var toID = updateMessage.chat_id
            ? -updateMessage.chat_id
            : (isOut ? updateMessage.user_id : myID)

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
              fwd_from: updateMessage.fwd_from,
              reply_to_msg_id: updateMessage.reply_to_msg_id,
              entities: updateMessage.entities
            },
            pts: updateMessage.pts,
            pts_count: updateMessage.pts_count
          }, processOpts)
          break

        case 'updatesCombined':
        case 'updates':
          AppUsersManager.saveApiUsers(updateMessage.users)
          AppChatsManager.saveApiChats(updateMessage.chats)

          angular.forEach(updateMessage.updates, function (update) {
            processUpdate(update, processOpts)
          })
          break

        default:
          console.warn(dT(), 'Unknown update message', updateMessage)
      }
    }

    function getDifference () {
      // console.trace(dT(), 'Get full diff')
      if (!updatesState.syncLoading) {
        updatesState.syncLoading = true
        updatesState.pendingSeqUpdates = {}
        updatesState.pendingPtsUpdates = []
      }

      if (updatesState.syncPending) {
        clearTimeout(updatesState.syncPending.timeout)
        updatesState.syncPending = false
      }

      MtpApiManager.invokeApi('updates.getDifference', {pts: updatesState.pts, date: updatesState.date, qts: -1}, {
        timeout: 0x7fffffff
      }).then(function (differenceResult) {
        if (differenceResult._ == 'updates.differenceEmpty') {
          console.log(dT(), 'apply empty diff', differenceResult.seq)
          updatesState.date = differenceResult.date
          updatesState.seq = differenceResult.seq
          updatesState.syncLoading = false
          $rootScope.$broadcast('stateSynchronized')
          return false
        }

        AppUsersManager.saveApiUsers(differenceResult.users)
        AppChatsManager.saveApiChats(differenceResult.chats)

        // Should be first because of updateMessageID
        // console.log(dT(), 'applying', differenceResult.other_updates.length, 'other updates')

        var channelsUpdates = []
        angular.forEach(differenceResult.other_updates, function (update) {
          switch (update._) {
            case 'updateChannelTooLong':
            case 'updateNewChannelMessage':
            case 'updateEditChannelMessage':
              processUpdate(update)
              return
          }
          saveUpdate(update)
        })

        // console.log(dT(), 'applying', differenceResult.new_messages.length, 'new messages')
        angular.forEach(differenceResult.new_messages, function (apiMessage) {
          saveUpdate({
            _: 'updateNewMessage',
            message: apiMessage,
            pts: updatesState.pts,
            pts_count: 0
          })
        })

        var nextState = differenceResult.intermediate_state || differenceResult.state
        updatesState.seq = nextState.seq
        updatesState.pts = nextState.pts
        updatesState.date = nextState.date

        // console.log(dT(), 'apply diff', updatesState.seq, updatesState.pts)

        if (differenceResult._ == 'updates.differenceSlice') {
          getDifference()
        } else {
          // console.log(dT(), 'finished get diff')
          $rootScope.$broadcast('stateSynchronized')
          updatesState.syncLoading = false
        }
      }, function () {
        updatesState.syncLoading = false
      })
    }

    function getChannelDifference (channelID) {
      var channelState = getChannelState(channelID)
      if (!channelState.syncLoading) {
        channelState.syncLoading = true
        channelState.pendingPtsUpdates = []
      }
      if (channelState.syncPending) {
        clearTimeout(channelState.syncPending.timeout)
        channelState.syncPending = false
      }
      // console.log(dT(), 'Get channel diff', AppChatsManager.getChat(channelID), channelState.pts)
      MtpApiManager.invokeApi('updates.getChannelDifference', {
        channel: AppChatsManager.getChannelInput(channelID),
        filter: {_: 'channelMessagesFilterEmpty'},
        pts: channelState.pts,
        limit: 30
      }, {timeout: 0x7fffffff}).then(function (differenceResult) {
        // console.log(dT(), 'channel diff result', differenceResult)
        channelState.pts = differenceResult.pts

        if (differenceResult._ == 'updates.channelDifferenceEmpty') {
          console.log(dT(), 'apply channel empty diff', differenceResult)
          channelState.syncLoading = false
          $rootScope.$broadcast('stateSynchronized')
          return false
        }

        if (differenceResult._ == 'updates.channelDifferenceTooLong') {
          console.log(dT(), 'channel diff too long', differenceResult)
          channelState.syncLoading = false
          delete channelStates[channelID]
          saveUpdate({_: 'updateChannelReload', channel_id: channelID})
          return false
        }

        AppUsersManager.saveApiUsers(differenceResult.users)
        AppChatsManager.saveApiChats(differenceResult.chats)

        // Should be first because of updateMessageID
        console.log(dT(), 'applying', differenceResult.other_updates.length, 'channel other updates')
        angular.forEach(differenceResult.other_updates, function (update) {
          saveUpdate(update)
        })

        console.log(dT(), 'applying', differenceResult.new_messages.length, 'channel new messages')
        angular.forEach(differenceResult.new_messages, function (apiMessage) {
          saveUpdate({
            _: 'updateNewChannelMessage',
            message: apiMessage,
            pts: channelState.pts,
            pts_count: 0
          })
        })

        console.log(dT(), 'apply channel diff', channelState.pts)

        if (differenceResult._ == 'updates.channelDifference' &&
          !differenceResult.pFlags['final']) {
          getChannelDifference(channelID)
        } else {
          console.log(dT(), 'finished channel get diff')
          $rootScope.$broadcast('stateSynchronized')
          channelState.syncLoading = false
        }
      }, function () {
        channelState.syncLoading = false
      })
    }

    function addChannelState (channelID, pts) {
      if (!pts) {
        throw new Error('Add channel state without pts ' + channelID)
      }
      if (channelStates[channelID] === undefined) {
        channelStates[channelID] = {
          pts: pts,
          pendingPtsUpdates: [],
          syncPending: false,
          syncLoading: false
        }
        return true
      }
      return false
    }

    function getChannelState (channelID, pts) {
      if (channelStates[channelID] === undefined) {
        addChannelState(channelID, pts)
      }
      return channelStates[channelID]
    }

    function processUpdate (update, options) {
      options = options || {}
      var channelID = false
      switch (update._) {
        case 'updateNewChannelMessage':
        case 'updateEditChannelMessage':
          channelID = -AppPeersManager.getPeerID(update.message.to_id)
          break
        case 'updateDeleteChannelMessages':
          channelID = update.channel_id
          break
        case 'updateChannelTooLong':
          channelID = update.channel_id
          if (channelStates[channelID] === undefined) {
            return false
          }
          break
      }

      var curState = channelID ? getChannelState(channelID, update.pts) : updatesState

      // console.log(dT(), 'process', channelID, curState.pts, update)

      if (curState.syncLoading) {
        return false
      }

      if (update._ == 'updateChannelTooLong') {
        if (!curState.lastPtsUpdateTime ||
            curState.lastPtsUpdateTime < tsNow() - 10000) {
          // console.trace(dT(), 'channel too long, get diff', channelID, update)
          getChannelDifference(channelID)
        }
        return false
      }

      if (update._ == 'updateNewMessage' ||
          update._ == 'updateEditMessage' ||
          update._ == 'updateNewChannelMessage' ||
          update._ == 'updateEditChannelMessage') {
        var message = update.message
        var toPeerID = AppPeersManager.getPeerID(message.to_id)
        var fwdHeader = message.fwd_from || {}
        var reason = false
        if (message.from_id && !AppUsersManager.hasUser(message.from_id, message.pFlags.post/* || channelID*/) && (reason = 'author') ||
            fwdHeader.from_id && !AppUsersManager.hasUser(fwdHeader.from_id, !!fwdHeader.channel_id) && (reason = 'fwdAuthor') ||
            fwdHeader.channel_id && !AppChatsManager.hasChat(fwdHeader.channel_id, true) && (reason = 'fwdChannel') ||
            toPeerID > 0 && !AppUsersManager.hasUser(toPeerID) && (reason = 'toPeer User') ||
            toPeerID < 0 && !AppChatsManager.hasChat(-toPeerID) && (reason = 'toPeer Chat')) {
          console.warn(dT(), 'Not enough data for message update', toPeerID, reason, message)
          if (channelID && AppChatsManager.hasChat(channelID)) {
            getChannelDifference(channelID)
          } else {
            forceGetDifference()
          }
          return false
        }
      }
      else if (channelID && !AppChatsManager.hasChat(channelID)) {
        // console.log(dT(), 'skip update, missing channel', channelID, update)
        return false
      }

      var popPts
      var popSeq

      if (update.pts) {
        var newPts = curState.pts + (update.pts_count || 0)
        if (newPts < update.pts) {
          console.warn(dT(), 'Pts hole', curState, update, channelID && AppChatsManager.getChat(channelID))
          curState.pendingPtsUpdates.push(update)
          if (!curState.syncPending) {
            curState.syncPending = {
              timeout: setTimeout(function () {
                if (channelID) {
                  getChannelDifference(channelID)
                } else {
                  getDifference()
                }
              }, 5000)
            }
          }
          curState.syncPending.ptsAwaiting = true
          return false
        }
        if (update.pts > curState.pts) {
          curState.pts = update.pts
          popPts = true

          curState.lastPtsUpdateTime = tsNow()
        }
        else if (update.pts_count) {
          // console.warn(dT(), 'Duplicate update', update)
          return false
        }
        if (channelID && options.date && updatesState.date < options.date) {
          updatesState.date = options.date
        }
      }
      else if (!channelID && options.seq > 0) {
        var seq = options.seq
        var seqStart = options.seqStart || seq

        if (seqStart != curState.seq + 1) {
          if (seqStart > curState.seq) {
            console.warn(dT(), 'Seq hole', curState, curState.syncPending && curState.syncPending.seqAwaiting)

            if (curState.pendingSeqUpdates[seqStart] === undefined) {
              curState.pendingSeqUpdates[seqStart] = {seq: seq, date: options.date, updates: []}
            }
            curState.pendingSeqUpdates[seqStart].updates.push(update)

            if (!curState.syncPending) {
              curState.syncPending = {
                timeout: setTimeout(function () {
                  getDifference()
                }, 5000)
              }
            }
            if (!curState.syncPending.seqAwaiting ||
              curState.syncPending.seqAwaiting < seqStart) {
              curState.syncPending.seqAwaiting = seqStart
            }
            return false
          }
        }

        if (curState.seq != seq) {
          curState.seq = seq
          if (options.date && curState.date < options.date) {
            curState.date = options.date
          }
          popSeq = true
        }
      }

      saveUpdate(update)

      if (popPts) {
        popPendingPtsUpdate(channelID)
      }
      else if (popSeq) {
        popPendingSeqUpdate()
      }
    }

    function saveUpdate (update) {
      $rootScope.$broadcast('apiUpdate', update)
    }

    function attach () {
      MtpNetworkerFactory.setUpdatesProcessor(processUpdateMessage)
      MtpApiManager.invokeApi('updates.getState', {}, {noErrorBox: true}).then(function (stateResult) {
        updatesState.seq = stateResult.seq
        updatesState.pts = stateResult.pts
        updatesState.date = stateResult.date
        setTimeout(function () {
          updatesState.syncLoading = false
        }, 1000)

      // updatesState.seq = 1
      // updatesState.pts = stateResult.pts - 5000
      // updatesState.date = 1
      // getDifference()
      })
    }

    return {
      processUpdateMessage: processUpdateMessage,
      addChannelState: addChannelState,
      attach: attach
    }
  })

  .service('StatusManager', function ($timeout, $rootScope, MtpApiManager, AppUsersManager, IdleManager) {
    var toPromise
    var lastOnlineUpdated = 0
    var started = false
    var myID = 0
    var myOtherDeviceActive = false

    MtpApiManager.getUserID().then(function (id) {
      myID = id
    })

    $rootScope.$on('apiUpdate', function (e, update) {
      if (update._ == 'updateUserStatus' && update.user_id == myID) {
        myOtherDeviceActive = tsNow() + (update.status._ == 'userStatusOnline' ? 300000 : 0)
      }
    })

    return {
      start: start,
      isOtherDeviceActive: isOtherDeviceActive
    }

    function start () {
      if (!started) {
        started = true
        $rootScope.$watch('idle.isIDLE', checkIDLE)
        $rootScope.$watch('offline', checkIDLE)
      }
    }

    function sendUpdateStatusReq (offline) {
      var date = tsNow()
      if (offline && !lastOnlineUpdated ||
        !offline && (date - lastOnlineUpdated) < 50000 ||
        $rootScope.offline) {
        return
      }
      lastOnlineUpdated = offline ? 0 : date
      AppUsersManager.setUserStatus(myID, offline)
      return MtpApiManager.invokeApi('account.updateStatus', {
        offline: offline
      }, {noErrorBox: true})
    }

    function checkIDLE () {
      toPromise && $timeout.cancel(toPromise)
      if ($rootScope.idle.isIDLE) {
        toPromise = $timeout(function () {
          sendUpdateStatusReq(true)
        }, 5000)
      } else {
        sendUpdateStatusReq(false)
        toPromise = $timeout(checkIDLE, 60000)
      }
    }

    function isOtherDeviceActive () {
      if (!myOtherDeviceActive) {
        return false
      }
      if (tsNow() > myOtherDeviceActive) {
        myOtherDeviceActive = false
        return false
      }
      return true
    }
  })

  .service('NotificationsManager', function ($rootScope, $window, $interval, $q, $modal, _, toaster, MtpApiManager, AppPeersManager, AppChatsManager, AppUsersManager, IdleManager, Storage, AppRuntimeManager, FileManager, WebPushApiManager) {
    navigator.vibrate = navigator.vibrate || navigator.mozVibrate || navigator.webkitVibrate

    var notificationsMsSiteMode = false
    try {
      if (window.external && window.external.msIsSiteMode()) {
        notificationsMsSiteMode = true
      }
    } catch (e) {}

    var notificationsUiSupport = notificationsMsSiteMode ||
      ('Notification' in window) ||
      ('mozNotification' in navigator)
    var notificationsShown = {}
    var notificationIndex = 0
    var notificationsCount = 0
    var soundsPlayed = {}
    var vibrateSupport = !!navigator.vibrate
    var nextSoundAt = false
    var prevSoundVolume = false
    var peerSettings = {}
    var faviconEl = $('link[rel="icon"]:first')[0]
    var langNotificationsPluralize = _.pluralize('page_title_pluralize_notifications')

    var titleBackup = document.title
    var titleChanged = false
    var titlePromise
    var prevFavicon
    var stopped = false

    var settings = {}

    $rootScope.$watch('idle.deactivated', function (newVal) {
      if (newVal) {
        stop()
      }
    })

    $rootScope.$watch('idle.isIDLE', function (newVal) {
      if (stopped) {
        return
      }
      if (!newVal) {
        notificationsClear()
      }
      if (!Config.Navigator.mobile) {
        $interval.cancel(titlePromise)
        if (!newVal) {
          titleChanged = false
          document.title = titleBackup
          setFavicon()
        } else {
          titleBackup = document.title

          titlePromise = $interval(function () {
            if (titleChanged || !notificationsCount) {
              titleChanged = false
              document.title = titleBackup
              setFavicon()
            } else {
              titleChanged = true
              document.title = langNotificationsPluralize(notificationsCount)
              setFavicon('favicon_unread.ico')
            }
          }, 1000)
        }
      }
    })

    $rootScope.$on('apiUpdate', function (e, update) {
      // console.log('on apiUpdate', update)
      switch (update._) {
        case 'updateNotifySettings':
          if (update.peer._ == 'notifyPeer') {
            var peerID = AppPeersManager.getPeerID(update.peer.peer)
            savePeerSettings(peerID, update.notify_settings)
          }
          break
      }
    })

    var registeredDevice = false
    var pushInited = false
    $rootScope.$on('push_init', function (e, tokenData) {
      pushInited = true
      if (!settings.nodesktop && !settings.nopush) {
        if (tokenData) {
          registerDevice(tokenData)
        } else {
          WebPushApiManager.subscribe()
        }
      } else {
        unregisterDevice(tokenData)
      }
    })
    $rootScope.$on('push_subscribe', function (e, tokenData) {
      registerDevice(tokenData)
    })
    $rootScope.$on('push_unsubscribe', function (e, tokenData) {
      unregisterDevice(tokenData)
    })

    var topMessagesDeferred = $q.defer()
    var unregisterTopMsgs = $rootScope.$on('dialogs_multiupdate', function () {
      unregisterTopMsgs()
      topMessagesDeferred.resolve()
    })
    var topMessagesPromise = topMessagesDeferred.promise

    $rootScope.$on('push_notification_click', function (e, notificationData) {
      if (notificationData.action == 'push_settings') {
        topMessagesPromise.then(function () {
          $modal.open({
            templateUrl: templateUrl('settings_modal'),
            controller: 'SettingsModalController',
            windowClass: 'settings_modal_window mobile_modal',
            backdrop: 'single'
          })
        })
        return
      }
      if (notificationData.action == 'mute1d') {
        MtpApiManager.invokeApi('account.updateDeviceLocked', function () {
          period: 86400
        }).then(function () {
          var toastData = toaster.pop({
            type: 'info',
            body: _('push_action_mute1d_success'),
            bodyOutputType: 'trustedHtml',
            clickHandler: function () {
              toaster.clear(toastData)
            },
            showCloseButton: false
          })
        })
        return
      }
      var peerID = notificationData.custom && notificationData.custom.peerID
      console.log('click', notificationData, peerID)
      if (peerID) {
        topMessagesPromise.then(function () {
          if (notificationData.custom.channel_id &&
              !AppChatsManager.hasChat(notificationData.custom.channel_id)) {
            return
          }
          if (peerID > 0 && !AppUsersManager.hasUser(peerID)) {
            return
          }
          $rootScope.$broadcast('history_focus', {
            peerString: AppPeersManager.getPeerString(peerID)
          })
        })
      }
    })
    

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
    }

    function updateNotifySettings () {
      Storage.get('notify_nodesktop', 'notify_volume', 'notify_novibrate', 'notify_nopreview', 'notify_nopush').then(function (updSettings) {
        settings.nodesktop = updSettings[0]
        settings.volume = updSettings[1] === false
          ? 0.5
          : updSettings[1]

        settings.novibrate = updSettings[2]
        settings.nopreview = updSettings[3]
        settings.nopush = updSettings[4]


        if (pushInited) {
          var needPush = !settings.nopush && !settings.nodesktop && WebPushApiManager.isAvailable || false
          var hasPush = registeredDevice !== false
          if (needPush != hasPush) {
            if (needPush) {
              WebPushApiManager.subscribe()
            } else {
              WebPushApiManager.unsubscribe()
            }
          }
        }
        WebPushApiManager.setSettings(settings)
      })
    }

    function getNotifySettings () {
      return settings
    }

    function getPeerSettings (peerID) {
      if (peerSettings[peerID] !== undefined) {
        return peerSettings[peerID]
      }

      return peerSettings[peerID] = MtpApiManager.invokeApi('account.getNotifySettings', {
        peer: {
          _: 'inputNotifyPeer',
          peer: AppPeersManager.getInputPeerByID(peerID)
        }
      })
    }

    function setFavicon (href) {
      href = href || 'favicon.ico'
      if (prevFavicon === href) {
        return
      }
      var link = document.createElement('link')
      link.rel = 'shortcut icon'
      link.type = 'image/x-icon'
      link.href = href
      faviconEl.parentNode.replaceChild(link, faviconEl)
      faviconEl = link

      prevFavicon = href
    }

    function savePeerSettings (peerID, settings) {
      // console.trace(dT(), 'peer settings', peerID, settings)
      peerSettings[peerID] = $q.when(settings)
      $rootScope.$broadcast('notify_settings', {peerID: peerID})
    }

    function updatePeerSettings (peerID, settings) {
      savePeerSettings(peerID, settings)

      var inputSettings = angular.copy(settings)
      inputSettings._ = 'inputPeerNotifySettings'

      return MtpApiManager.invokeApi('account.updateNotifySettings', {
        peer: {
          _: 'inputNotifyPeer',
          peer: AppPeersManager.getInputPeerByID(peerID)
        },
        settings: inputSettings
      })
    }

    function getPeerMuted (peerID) {
      return getPeerSettings(peerID).then(function (peerNotifySettings) {
        return peerNotifySettings._ == 'peerNotifySettings' &&
          peerNotifySettings.mute_until * 1000 > tsNow()
      })
    }

    function start () {
      updateNotifySettings()
      $rootScope.$on('settings_changed', updateNotifySettings)
      WebPushApiManager.start()

      if (!notificationsUiSupport) {
        return false
      }

      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        $($window).on('click', requestPermission)
      }

      try {
        if ('onbeforeunload' in window) {
          $($window).on('beforeunload', notificationsClear)
        }
      } catch (e) {}
    }

    function stop () {
      notificationsClear()
      $interval.cancel(titlePromise)
      setFavicon()
      stopped = true
    }

    function requestPermission () {
      Notification.requestPermission()
      $($window).off('click', requestPermission)
    }

    function notify (data) {
      console.log('notify', data, $rootScope.idle.isIDLE, notificationsUiSupport, stopped)
      if (stopped) {
        return
      }

      // FFOS Notification blob src bug workaround
      if (Config.Navigator.ffos && !Config.Navigator.ffos2p) {
        data.image = 'https://telegram.org/img/t_logo.png'
      }
      else if (data.image && !angular.isString(data.image)) {
        if (Config.Navigator.ffos2p) {
          FileManager.getDataUrl(data.image, 'image/jpeg').then(function (url) {
            data.image = url
            notify(data)
          })
          return false
        } else {
          data.image = FileManager.getUrl(data.image, 'image/jpeg')
        }
      }
      else if (!data.image) {
        data.image = 'img/icons/icon60.png'
      }
      // console.log('notify image', data.image)

      notificationsCount++

      var now = tsNow()
      if (settings.volume > 0 &&
        (
        !data.tag ||
        !soundsPlayed[data.tag] ||
        now > soundsPlayed[data.tag] + 60000
        )
      ) {
        playSound(settings.volume)
        soundsPlayed[data.tag] = now
      }

      if (!notificationsUiSupport ||
        'Notification' in window && Notification.permission !== 'granted') {
        return false
      }

      if (settings.nodesktop) {
        if (vibrateSupport && !settings.novibrate) {
          navigator.vibrate([200, 100, 200])
          return
        }
        return
      }

      var idx = ++notificationIndex
      var key = data.key || 'k' + idx
      var notification

      if ('Notification' in window) {
        try {
          if (data.tag) {
            angular.forEach(notificationsShown, function (notification) {
              if (notification &&
                  notification.tag == data.tag) {
                notification.hidden = true
              }
            })
          }
          notification = new Notification(data.title, {
            icon: data.image || '',
            body: data.message || '',
            tag: data.tag || '',
            silent: data.silent || false
          })
        } catch (e) {
          notificationsUiSupport = false
          WebPushApiManager.setLocalNotificationsDisabled()
          return
        }
      }
      else if ('mozNotification' in navigator) {
        notification = navigator.mozNotification.createNotification(data.title, data.message || '', data.image || '')
      }
      else if (notificationsMsSiteMode) {
        window.external.msSiteModeClearIconOverlay()
        window.external.msSiteModeSetIconOverlay('img/icons/icon16.png', data.title)
        window.external.msSiteModeActivate()
        notification = {
          index: idx
        }
      } else {
        return
      }

      notification.onclick = function () {
        notification.close()
        AppRuntimeManager.focus()
        notificationsClear()
        if (data.onclick) {
          data.onclick()
        }
      }

      notification.onclose = function () {
        if (!notification.hidden) {
          delete notificationsShown[key]
          notificationsClear()
        }
      }

      if (notification.show) {
        notification.show()
      }
      notificationsShown[key] = notification

      if (!Config.Navigator.mobile) {
        setTimeout(function () {
          notificationHide(key)
        }, 8000)
      }
    }

    function playSound (volume) {
      var now = tsNow()
      if (nextSoundAt && now < nextSoundAt && prevSoundVolume == volume) {
        return
      }
      nextSoundAt = now + 1000
      prevSoundVolume = volume
      var filename = 'img/sound_a.mp3'
      var obj = $('#notify_sound').html('<audio autoplay="autoplay" mozaudiochannel="notification">' +
        '<source src="' + filename + '" type="audio/mpeg" />' +
        '<embed hidden="true" autostart="true" loop="false" volume="' + (volume * 100) + '" src="' + filename + '" />' +
        '</audio>')
      obj.find('audio')[0].volume = volume
    }

    function notificationCancel (key) {
      var notification = notificationsShown[key]
      if (notification) {
        if (notificationsCount > 0) {
          notificationsCount--
        }
        try {
          if (notification.close) {
            notification.hidden = true
            notification.close()
          }
          else if (notificationsMsSiteMode &&
            notification.index == notificationIndex) {
            window.external.msSiteModeClearIconOverlay()
          }
        } catch (e) {}
        delete notificationsCount[key]
      }
    }

    function notificationHide (key) {
      var notification = notificationsShown[key]
      if (notification) {
        try {
          if (notification.close) {
            notification.hidden = true
            notification.close()
          }
        } catch (e) {}
        delete notificationsCount[key]
      }
    }

    function notificationSoundReset (tag) {
      delete soundsPlayed[tag]
    }

    function notificationsClear () {
      if (notificationsMsSiteMode) {
        window.external.msSiteModeClearIconOverlay()
      } else {
        angular.forEach(notificationsShown, function (notification) {
          try {
            if (notification.close) {
              notification.close()
            }
          } catch (e) {}
        })
      }
      notificationsShown = {}
      notificationsCount = 0

      WebPushApiManager.hidePushNotifications()
    }

    function registerDevice (tokenData) {
      if (registeredDevice &&
          angular.equals(registeredDevice, tokenData)) {
        return false
      }
      MtpApiManager.invokeApi('account.registerDevice', {
        token_type: tokenData.tokenType,
        token: tokenData.tokenValue,
        other_uids: []
      }).then(function () {
        registeredDevice = tokenData
      }, function (error) {
        error.handled = true
      })
    }

    function unregisterDevice (tokenData) {
      if (!registeredDevice) {
        return false
      }
      MtpApiManager.invokeApi('account.unregisterDevice', {
        token_type: tokenData.tokenType,
        token: tokenData.tokenValue,
        other_uids: []
      }).then(function () {
        registeredDevice = false
      }, function (error) {
        error.handled = true
      })
    }

    function getVibrateSupport () {
      return vibrateSupport
    }
  })

  .service('PasswordManager', function ($timeout, $q, $rootScope, MtpApiManager, CryptoWorker, MtpSecureRandom) {
    return {
      check: check,
      getState: getState,
      requestRecovery: requestRecovery,
      recover: recover,
      updateSettings: updateSettings
    }

    function getState (options) {
      return MtpApiManager.invokeApi('account.getPassword', {}, options).then(function (result) {
        return result
      })
    }

    function updateSettings (state, settings) {
      var currentHashPromise
      var newHashPromise
      var params = {
        new_settings: {
          _: 'account.passwordInputSettings',
          flags: 0,
          hint: settings.hint || ''
        }
      }

      if (typeof settings.cur_password === 'string' &&
        settings.cur_password.length > 0) {
        currentHashPromise = makePasswordHash(state.current_salt, settings.cur_password)
      } else {
        currentHashPromise = $q.when([])
      }

      if (typeof settings.new_password === 'string' &&
        settings.new_password.length > 0) {
        var saltRandom = new Array(8)
        var newSalt = bufferConcat(state.new_salt, saltRandom)
        MtpSecureRandom.nextBytes(saltRandom)
        newHashPromise = makePasswordHash(newSalt, settings.new_password)
        params.new_settings.new_salt = newSalt
        params.new_settings.flags |= 1
      } else {
        if (typeof settings.new_password === 'string') {
          params.new_settings.flags |= 1
          params.new_settings.new_salt = []
        }
        newHashPromise = $q.when([])
      }

      if (typeof settings.email === 'string') {
        params.new_settings.flags |= 2
        params.new_settings.email = settings.email || ''
      }

      return $q.all([currentHashPromise, newHashPromise]).then(function (hashes) {
        params.current_password_hash = hashes[0]
        params.new_settings.new_password_hash = hashes[1]

        return MtpApiManager.invokeApi('account.updatePasswordSettings', params)
      })
    }

    function check (state, password, options) {
      return makePasswordHash(state.current_salt, password).then(function (passwordHash) {
        return MtpApiManager.invokeApi('auth.checkPassword', {
          password_hash: passwordHash
        }, options)
      })
    }

    function requestRecovery (state, options) {
      return MtpApiManager.invokeApi('auth.requestPasswordRecovery', {}, options)
    }

    function recover (code, options) {
      return MtpApiManager.invokeApi('auth.recoverPassword', {
        code: code
      }, options)
    }

    function makePasswordHash (salt, password) {
      var passwordUTF8 = unescape(encodeURIComponent(password))

      var buffer = new ArrayBuffer(passwordUTF8.length)
      var byteView = new Uint8Array(buffer)
      for (var i = 0, len = passwordUTF8.length; i < len; i++) {
        byteView[i] = passwordUTF8.charCodeAt(i)
      }

      buffer = bufferConcat(bufferConcat(salt, byteView), salt)

      return CryptoWorker.sha256Hash(buffer)
    }
  })

  .service('ErrorService', function ($rootScope, $modal, $window) {
    var shownBoxes = 0

    function show (params, options) {
      if (shownBoxes >= 1) {
        console.log('Skip error box, too many open', shownBoxes, params, options)
        return false
      }

      options = options || {}
      var scope = $rootScope.$new()
      angular.extend(scope, params)

      shownBoxes++
      var modal = $modal.open({
        templateUrl: templateUrl('error_modal'),
        scope: scope,
        windowClass: options.windowClass || 'error_modal_window'
      })

      modal.result['finally'](function () {
        shownBoxes--
      })

      return modal
    }

    function alert (title, description) {
      return show({
        title: title,
        description: description
      })
    }

    function confirm (params, options, data) {
      options = options || {}
      data = data || {}
      var scope = $rootScope.$new()
      angular.extend(scope, params)
      angular.extend(scope, { data: data })

      var modal = $modal.open({
        templateUrl: templateUrl('confirm_modal'),
        scope: scope,
        windowClass: options.windowClass || 'confirm_modal_window'
      })

      return modal.result
    }

    $window.safeConfirm = function (params, callback) {
      if (typeof params === 'string') {
        params = {message: params}
      }
      confirm(params).then(function (result) {
        callback(result || true)
      }, function () {
        callback(false)
      })
    }

    return {
      show: show,
      alert: alert,
      confirm: confirm
    }
  })

  .service('PeersSelectService', function ($rootScope, $modal) {
    function selectPeer (options) {
      var scope = $rootScope.$new()
      scope.multiSelect = false
      scope.noMessages = true
      scope.forPeerSelect = true
      if (options) {
        angular.extend(scope, options)
      }

      return $modal.open({
        templateUrl: templateUrl('peer_select'),
        controller: 'PeerSelectController',
        scope: scope,
        windowClass: 'peer_select_window mobile_modal',
        backdrop: 'single'
      }).result
    }

    function selectPeers (options) {
      if (Config.Mobile) {
        return selectPeer(options).then(function (peerString) {
          return [peerString]
        })
      }

      var scope = $rootScope.$new()
      scope.multiSelect = true
      scope.noMessages = true
      scope.forPeerSelect = true
      if (options) {
        angular.extend(scope, options)
      }

      return $modal.open({
        templateUrl: templateUrl('peer_select'),
        controller: 'PeerSelectController',
        scope: scope,
        windowClass: 'peer_select_window mobile_modal',
        backdrop: 'single'
      }).result
    }

    return {
      selectPeer: selectPeer,
      selectPeers: selectPeers
    }
  })

  .service('ContactsSelectService', function ($rootScope, $modal) {
    function select (multiSelect, options) {
      options = options || {}

      var scope = $rootScope.$new()
      scope.multiSelect = multiSelect
      angular.extend(scope, options)
      if (!scope.action && multiSelect) {
        scope.action = 'select'
      }

      return $modal.open({
        templateUrl: templateUrl('contacts_modal'),
        controller: 'ContactsModalController',
        scope: scope,
        windowClass: 'contacts_modal_window mobile_modal',
        backdrop: 'single'
      }).result
    }

    return {
      selectContacts: function (options) {
        return select(true, options)
      },
      selectContact: function (options) {
        return select(false, options)
      }
    }
  })

  .service('ChangelogNotifyService', function (Storage, $rootScope, $modal, $timeout, MtpApiManager, ApiUpdatesManager) {

    var checked = false

    function checkUpdate () {
      if (checked) {
        return
      }
      checked = true
      MtpApiManager.getUserID().then(function (userID) {
        if (!userID) {
          return
        }
        $timeout(function () {
          Storage.get('last_version').then(function (lastVersion) {
            if (lastVersion != Config.App.version) {
              if (!lastVersion) {
                Storage.set({last_version: Config.App.version})
              } else {
                MtpApiManager.invokeApi('help.getAppChangelog', {
                  prev_app_version: lastVersion
                }, {
                  noErrorBox: true,
                }).then(function (updates) {
                  if (updates._ == 'updates' && !updates.updates.length) {
                    return false
                  }
                  ApiUpdatesManager.processUpdateMessage(updates)
                  Storage.set({last_version: Config.App.version})
                })
              }
            }
          })
        }, 5000)
      })
    }

    function showChangelog (lastVersion) {
      var $scope = $rootScope.$new()
      $scope.lastVersion = lastVersion

      $modal.open({
        controller: 'ChangelogModalController',
        templateUrl: templateUrl('changelog_modal'),
        scope: $scope,
        windowClass: 'changelog_modal_window mobile_modal'
      })
    }

    return {
      checkUpdate: checkUpdate,
      showChangelog: showChangelog
    }
  })

  .service('HttpsMigrateService', function (ErrorService, Storage) {
    var started = false

    function check () {
      Storage.get('https_dismiss').then(function (ts) {
        if (!ts || tsNow() > ts + 43200000) {
          ErrorService.confirm({
            type: 'MIGRATE_TO_HTTPS'
          }).then(function () {
            var popup
            try {
              popup = window.open('https://web.telegram.org', '_blank')
            } catch (e) {}
            if (!popup) {
              location.href = 'https://web.telegram.org'
            }
          }, function () {
            Storage.set({https_dismiss: tsNow()})
          })
        }
      })
    }

    function start () {
      if (started ||
        location.protocol != 'http:' ||
        Config.Modes.http ||
        Config.App.domains.indexOf(location.hostname) == -1) {
        return
      }
      started = true
      setTimeout(check, 120000)
    }

    return {
      start: start,
      check: check
    }
  })

  .service('LayoutSwitchService', function (ErrorService, Storage, AppRuntimeManager, $window) {
    var started = false
    var confirmShown = false

    function switchLayout (mobile) {
      ConfigStorage.noPrefix()
      Storage.set({
        layout_selected: mobile ? 'mobile' : 'desktop',
        layout_width: $(window).width()
      }).then(function () {
        AppRuntimeManager.reload()
      })
    }

    function layoutCheck (e) {
      if (confirmShown) {
        return
      }
      var width = $(window).width()
      var newMobile = width < 600
      if (!width ||
        !e && (Config.Navigator.mobile ? width <= 800 : newMobile)) {
        return
      }
      if (newMobile != Config.Mobile) {
        ConfigStorage.noPrefix()
        Storage.get('layout_width').then(function (confirmedWidth) {
          if (width == confirmedWidth) {
            return false
          }
          confirmShown = true
          ErrorService.confirm({
            type: newMobile ? 'SWITCH_MOBILE_VERSION' : 'SWITCH_DESKTOP_VERSION'
          }).then(function () {
            switchLayout(newMobile)
          }, function () {
            ConfigStorage.noPrefix()
            Storage.set({layout_width: width})
            confirmShown = false
          })
        })
      }
    }

    function start () {
      if (started || Config.Navigator.mobile) {
        return
      }
      started = true
      layoutCheck()
      $($window).on('resize', layoutCheck)
    }

    return {
      start: start,
      switchLayout: switchLayout
    }
  })

  .service('TelegramMeWebService', function (Storage) {
    var disabled = Config.Modes.test ||
      Config.App.domains.indexOf(location.hostname) == -1 ||
      location.protocol != 'http:' && location.protocol != 'https:' ||
      location.protocol == 'https:' && location.hostname != 'web.telegram.org'

    function sendAsyncRequest (canRedirect) {
      if (disabled) {
        return false
      }
      Storage.get('tgme_sync').then(function (curValue) {
        var ts = tsNow(true)
        if (canRedirect &&
          curValue &&
          curValue.canRedirect == canRedirect &&
          curValue.ts + 86400 > ts) {
          return false
        }
        Storage.set({tgme_sync: {canRedirect: canRedirect, ts: ts}})

        var script1 = $('<script>').appendTo('body')
          .on('load error', function () {
            script1.remove()
          })
          .attr('src', '//telegram.me/_websync_?authed=' + (canRedirect ? '1' : '0'))

        var script2 = $('<script>').appendTo('body')
          .on('load error', function () {
            script2.remove()
          })
          .attr('src', '//t.me/_websync_?authed=' + (canRedirect ? '1' : '0'))
      })
    }

    return {
      setAuthorized: sendAsyncRequest
    }
  })

  .service('LocationParamsService', function (qSync, $rootScope, $routeParams, AppPeersManager, AppUsersManager, AppChatsManager, AppMessagesManager, AppMessagesIDsManager, MtpApiManager, ApiUpdatesManager, PeersSelectService, AppStickersManager, ErrorService) {
    var tgAddrRegExp = /^(web\+)?tg:(\/\/)?(.+)/

    function checkLocationTgAddr () {
      var tgaddr = $routeParams.tgaddr
      if (tgaddr) {
        if (!tgaddr.match(/[=&?]/)) {
          try {
            tgaddr = decodeURIComponent(tgaddr)
          } catch (e) {}
        }
        var matches = tgaddr.match(tgAddrRegExp)
        if (matches) {
          handleTgProtoAddr(matches[3])
        }
      }
    }

    function handleTgProtoAddr (url, inner) {
      var matches

      if (matches = url.match(/^resolve\?domain=(.+?)(?:&(start|startgroup|post|game)=(.+))?$/)) {
        AppPeersManager.resolveUsername(matches[1]).then(function (peerID) {
          if (peerID > 0 && AppUsersManager.isBot(peerID) &&
              (matches[2] == 'startgroup' || matches[2] == 'game')) {
            var isStartGroup = matches[2] == 'startgroup'
            PeersSelectService.selectPeer({
              confirm_type: isStartGroup ? 'INVITE_TO_GROUP' : 'INVITE_TO_GAME',
              noUsers: isStartGroup
            }).then(function (toPeerString) {
              var toPeerID = AppPeersManager.getPeerID(toPeerString)
              var sendPromise
              if (isStartGroup) {
                var toChatID = toPeerID < 0 ? -toPeerID : 0
                sendPromise = AppMessagesManager.startBot(peerID, toChatID, matches[3])
              } else {
                inputGame = {
                  _: 'inputGameShortName',
                  bot_id: AppUsersManager.getUserInput(peerID),
                  short_name: matches[3]
                }
                sendPromise = AppMessagesManager.shareGame(peerID, toPeerID, inputGame)
              }
              sendPromise.then(function () {
                $rootScope.$broadcast('history_focus', {peerString: toPeerString})
              })
            })
            return true
          }

          var params = {
            peerString: AppPeersManager.getPeerString(peerID)
          }

          if (matches[2] == 'start') {
            params.startParam = matches[3]
          }
          else if (matches[2] == 'post') {
            params.messageID = AppMessagesIDsManager.getFullMessageID(parseInt(matches[3]), -peerID)
          }

          $rootScope.$broadcast('history_focus', params)
        })
        return true
      }

      if (matches = url.match(/^join\?invite=(.+)$/)) {
        openChatInviteLink(matches[1])
        return true
      }

      if (matches = url.match(/^addstickers\?set=(.+)$/)) {
        AppStickersManager.openStickersetLink(matches[1])
        return true
      }

      if (matches = url.match(/^msg_url\?url=([^&]+)(?:&text=(.*))?$/)) {
        var url = decodeURIComponent(matches[1])
        var text = matches[2] ? decodeURIComponent(matches[2]) : ''
        shareUrl(url, text)
        return true
      }

      if (inner &&
        (matches = url.match(/^unsafe_url\?url=([^&]+)/))) {
        var url = decodeURIComponent(matches[1])
        ErrorService.confirm({
          type: 'JUMP_EXT_URL',
          url: url
        }).then(function () {
          var target = '_blank'
          if (url.search('https://telegram.me/') === 0 ||
              url.search('https://t.me/') === 0) {
            target = '_self'
          }
          else if (!url.match(/^https?:\/\//)) {
            url = 'http://' + url
          }
          var popup = window.open(url, target)
          try {
            popup.opener = null;
          } catch (e) {}
        })
        return true
      }

      if (matches = url.match(/^search_hashtag\?hashtag=(.+?)$/)) {
        $rootScope.$broadcast('dialogs_search', {query: '#' + decodeURIComponent(matches[1])})
        if (Config.Mobile) {
          $rootScope.$broadcast('history_focus', {
            peerString: ''
          })
        }
        return true
      }

      if (inner &&
        (matches = url.match(/^bot_command\?command=(.+?)(?:&bot=(.+))?$/))) {
        var peerID = $rootScope.selectedPeerID
        var text = '/' + matches[1]
        if (peerID < 0 && matches[2]) {
          text += '@' + matches[2]
        }
        AppMessagesManager.sendText(peerID, text)

        $rootScope.$broadcast('history_focus', {
          peerString: AppPeersManager.getPeerString(peerID)
        })
        return true
      }

      return false
    }

    function handleActivityMessage (name, data) {
      console.log(dT(), 'Received activity', name, data)

      if (name == 'share' && data.url) {
        shareUrl(data.url, '')
      }
      else if (name == 'view' && data.url) {
        var matches = data.url.match(tgAddrRegExp)
        if (matches) {
          handleTgProtoAddr(matches[3])
        }
      }
      else if (name == 'webrtc-call' && data.contact) {
        var contact = data.contact
        var phones = []
        if (contact.tel != undefined) {
          for (var i = 0; i < contact.tel.length; i++) {
            phones.push(contact.tel[i].value)
          }
        }
        var firstName = (contact.givenName || []).join(' ')
        var lastName = (contact.familyName || []).join(' ')

        if (phones.length) {
          AppUsersManager.importContact(phones[0], firstName, lastName).then(function (foundUserID) {
            if (foundUserID) {
              var peerString = AppPeersManager.getPeerString(foundUserID)
              $rootScope.$broadcast('history_focus', {peerString: peerString})
            } else {
              ErrorService.show({
                error: {code: 404, type: 'USER_NOT_USING_TELEGRAM'}
              })
            }
          })
        }
      }
      else if (name === 'share' && data.blobs && data.blobs.length > 0) {
        PeersSelectService.selectPeers({confirm_type: 'EXT_SHARE_PEER', canSend: true}).then(function (peerStrings) {
          angular.forEach(peerStrings, function (peerString) {
            var peerID = AppPeersManager.getPeerID(peerString)
            angular.forEach(data.blobs, function (blob) {
              AppMessagesManager.sendFile(peerID, blob, {isMedia: true})
            })
          })
          if (peerStrings.length == 1) {
            $rootScope.$broadcast('history_focus', {peerString: peerStrings[0]})
          }
        })
      }
    }

    var started = false
    function start () {
      if (started) {
        return
      }
      started = true

      if (window.navigator.mozSetMessageHandler) {
        console.log(dT(), 'Set activity message handler')
        window.navigator.mozSetMessageHandler('activity', function (activityRequest) {
          handleActivityMessage(activityRequest.source.name, activityRequest.source.data)
        })
      }

      $(document).on('click', function (event) {
        var target = event.target
        if (target &&
          target.tagName == 'A' &&
          !target.onclick &&
          !target.onmousedown) {
          var href = $(target).attr('href') || target.href || ''
          var match = href.match(tgAddrRegExp)
          if (match) {
            if (handleTgProtoAddr(match[3], true)) {
              return cancelEvent(event)
            }
          }
        }
      })

      $(document).on('mousedown', function (event) {
        var target = event.target
        if (target &&
            target.tagName == 'A') {
          var href = $(target).attr('href') || target.href || ''
          if (Config.Modes.chrome_packed && 
              href.length &&
              $(target).attr('target') == '_blank') {
            $(target).attr('rel', '')
          }
        }
      })

      $rootScope.$on('$routeUpdate', checkLocationTgAddr)
      checkLocationTgAddr()
    }

    function openUrl(url) {
      var match = url.match(tgAddrRegExp)
      if (match) {
        if (handleTgProtoAddr(match[3], true)) {
          return true
        }
      }
      var popup = window.open(url, '_blank')
      try {
        popup.opener = null;
      } catch (e) {}
      return popup ? true : false
    }

    function shareUrl (url, text, shareLink) {
      var options = {}
      if (shareLink) {
        options.shareLinkPromise = qSync.when(url)
      }
      PeersSelectService.selectPeer(options).then(function (toPeerString) {
        $rootScope.$broadcast('history_focus', {
          peerString: toPeerString,
          attachment: {
            _: 'share_url',
            url: url,
            text: text
          }
        })
      })
    }

    function openChatInviteLink (hash) {
      return MtpApiManager.invokeApi('messages.checkChatInvite', {
        hash: hash
      }).then(function (chatInvite) {
        var chatTitle
        if (chatInvite._ == 'chatInviteAlready') {
          AppChatsManager.saveApiChat(chatInvite.chat)
          var canJump = !chatInvite.chat.pFlags.left ||
            AppChatsManager.isChannel(chatInvite.chat.id) && chatInvite.chat.username
          if (canJump) {
            return $rootScope.$broadcast('history_focus', {
              peerString: AppChatsManager.getChatString(chatInvite.chat.id)
            })
          }
          chatTitle = chatInvite.chat.title
        } else {
          chatTitle = chatInvite.title
        }
        ErrorService.confirm({
          type: (chatInvite.pFlags.channel && !chatInvite.pFlags.megagroup) ? 'JOIN_CHANNEL_BY_LINK' : 'JOIN_GROUP_BY_LINK',
          title: chatTitle
        }).then(function () {
          return MtpApiManager.invokeApi('messages.importChatInvite', {
            hash: hash
          }).then(function (updates) {
            ApiUpdatesManager.processUpdateMessage(updates)

            if (updates.chats && updates.chats.length == 1) {
              $rootScope.$broadcast('history_focus', {peerString: AppChatsManager.getChatString(updates.chats[0].id)
              })
            }
            else if (updates.updates && updates.updates.length) {
              for (var i = 0, len = updates.updates.length, update; i < len; i++) {
                update = updates.updates[i]
                if (update._ == 'updateNewMessage') {
                  $rootScope.$broadcast('history_focus', {peerString: AppChatsManager.getChatString(update.message.to_id.chat_id)
                  })
                  break
                }
              }
            }
          })
        })
      })
    }

    return {
      start: start,
      shareUrl: shareUrl,
      openUrl: openUrl
    }
  })

  .service('DraftsManager', function ($rootScope, qSync, MtpApiManager, ApiUpdatesManager, AppMessagesIDsManager, AppChatsManager, AppPeersManager, RichTextProcessor, Storage, ServerTimeManager) {
    var cachedServerDrafts = {}

    $rootScope.$on('apiUpdate', function (e, update) {
      if (update._ != 'updateDraftMessage') {
        return
      }
      var peerID = AppPeersManager.getPeerID(update.peer)
      saveDraft(peerID, update.draft, {notify: true, local: update.local})
    })

    return {
      getDraft: getDraft,
      getServerDraft: getServerDraft,
      saveDraft: saveDraft,
      changeDraft: changeDraft,
      clearDraft: clearDraft,
      syncDraft: syncDraft
    }

    function getDraft (peerID, unsyncOnly) {
      // console.warn(dT(), 'get draft', peerID, unsyncOnly)
      return Storage.get('draft' + peerID).then(function (draft) {
        if (typeof draft === 'string') {
          if (draft.length > 0) {
            draft = {
              text: draft
            }
          } else {
            draft = false
          }
        }
        if (!draft && !unsyncOnly) {
          draft = getServerDraft(peerID)
          // console.warn(dT(), 'server', draft)
        } else {
          // console.warn(dT(), 'local', draft)
        }
        var replyToMsgID = draft && draft.replyToMsgID
        if (replyToMsgID) {
          var channelID = AppPeersManager.isChannel(peerID) ? -peerID : false
          draft.replyToMsgID = AppMessagesIDsManager.getFullMessageID(replyToMsgID, channelID)
        }
        return draft
      })
    }

    function getServerDraft (peerID) {
      var cached = cachedServerDrafts[peerID]
      if (cached !== undefined) {
        return cached
      }
      return false
    }

    function saveDraft (peerID, apiDraft, options) {
      options = options || {}
      var draft = processApiDraft(apiDraft)
      cachedServerDrafts[peerID] = draft

      if (options.notify) {
        // console.warn(dT(), 'save draft', peerID, apiDraft, options)
        changeDraft(peerID, draft)
        $rootScope.$broadcast('draft_updated', {
          peerID: peerID,
          draft: draft,
          local: options.local
        })
      }

      return draft
    }

    function changeDraft (peerID, draft) {
      // console.warn(dT(), 'change draft', peerID, draft)
      if (!peerID) {
        console.trace('empty peerID')
      }
      if (peerID < 0 &&
          !AppChatsManager.hasRights(-peerID, 'send')) {
        draft = false
      }
      if (!draft) {
        draft = {
          text: '',
          replyToMsgID: 0
        }
      }
      draft.replyToMsgID = draft.replyToMsgID
        ? AppMessagesIDsManager.getMessageLocalID(draft.replyToMsgID)
        : 0

      var draftKey = 'draft' + peerID

      if (!isEmptyDraft(draft)) {
        var backupDraftObj = {}
        backupDraftObj[draftKey] = draft
        Storage.set(backupDraftObj)
      } else {
        Storage.remove(draftKey)
      }
    }

    function clearDraft (peerID, alsoSync) {
      changeDraft(peerID)
      ApiUpdatesManager.processUpdateMessage({
        _: 'updateShort',
        update: {
          _: 'updateDraftMessage',
          peer: AppPeersManager.getOutputPeer(peerID),
          draft: {_: 'draftMessageEmpty'},
          local: true
        }
      })
      if (alsoSync) {
        syncDraft(peerID)
      }
    }

    function draftsAreEqual (draft1, draft2) {
      var isEmpty1 = isEmptyDraft(draft1)
      var isEmpty2 = isEmptyDraft(draft2)
      if (isEmpty1 && isEmpty2) {
        return true
      }
      if (isEmpty1 != isEmpty2) {
        return false
      }
      if (draft1.replyToMsgID != draft2.replyToMsgID) {
        return false
      }
      if (draft1.text != draft2.text) {
        return false
      }
      return true
    }

    function isEmptyDraft (draft) {
      if (!draft) {
        return true
      }
      if (draft.replyToMsgID > 0) {
        return false
      }
      if (typeof draft.text !== 'string' || !draft.text.length) {
        return true
      }
      return false
    }

    function processApiDraft (draft) {
      if (!draft || draft._ != 'draftMessage') {
        return false
      }

      var entities = RichTextProcessor.parseEntities(draft.message)
      var serverEntities = draft.entities || []
      entities = RichTextProcessor.mergeEntities(entities, serverEntities)

      var text = RichTextProcessor.wrapDraftText(draft.message, {entities: entities})
      var richMessage = RichTextProcessor.wrapRichText(draft.message, {noLinks: true, noLinebreaks: true})

      return {
        text: text,
        richMessage: richMessage,
        replyToMsgID: draft.reply_to_msg_id || 0,
        date: draft.date - ServerTimeManager.serverTimeOffset
      }
    }

    function syncDraft (peerID) {
      // console.warn(dT(), 'sync draft', peerID)
      getDraft(peerID, true).then(function (localDraft) {
        var serverDraft = cachedServerDrafts[peerID]
        if (draftsAreEqual(serverDraft, localDraft)) {
          // console.warn(dT(), 'equal drafts', localDraft, serverDraft)
          return
        }
        // console.warn(dT(), 'changed draft', localDraft, serverDraft)
        var params = {
          flags: 0,
          peer: AppPeersManager.getInputPeerByID(peerID)
        }
        var draftObj
        if (isEmptyDraft(localDraft)) {
          draftObj = {_: 'draftMessageEmpty'}
          params.message = ''
        } else {
          draftObj = {_: 'draftMessage'}
          var message = localDraft.text
          var entities = []
          message = RichTextProcessor.parseEmojis(message)
          message = RichTextProcessor.parseMarkdown(message, entities, true)
          if (localDraft.replyToMsgID > 0) {
            params.flags |= 1
            params.reply_to_msg_id = localDraft.replyToMsgID
            draftObj.reply_to_msg_id = localDraft.replyToMsgID
          }
          if (entities.length) {
            params.flags |= 8
            params.entities = entities
            draftObj.entities = entities
          }
          params.message = message
          draftObj.message = message
        }
        MtpApiManager.invokeApi('messages.saveDraft', params).then(function () {
          draftObj.date = tsNow(true) + ServerTimeManager.serverTimeOffset
          saveDraft(peerID, draftObj, {notify: true, local: true})
        })
      })
    }
  })
