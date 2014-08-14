/*!
 * Webogram v0.2.9 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Controllers */

angular.module('myApp.controllers', [])

  .controller('AppWelcomeController', function($scope, $location, MtpApiManager, ErrorService, ChangelogNotifyService) {
    MtpApiManager.getUserID().then(function (id) {
      if (id) {
        $location.url('/im');
      } else {
        $scope.showWelcome = true;
      }
    });

    ChangelogNotifyService.checkUpdate();
  })

  .controller('AppLoginController', function ($scope, $location, $timeout, $modal, $modalStack, MtpApiManager, ErrorService, ChangelogNotifyService) {

    $modalStack.dismissAll();

    MtpApiManager.getUserID().then(function (id) {
      if (id) {
        $location.url('/im');
        return;
      }
    });
    var options = {dcID: 1, createNetworker: true};

    $scope.credentials = {phone_country: '+1', phone_country_name: 'USA', phone_number: '', phone_full: ''};
    $scope.progress = {};
    $scope.callPending = {};

    $scope.selectCountry = function () {
      var tUrl = 'partials/country_select_modal.html',
          className = 'countries_modal_window page_modal';

      if (Config.Navigator.mobile) {
        tUrl = 'partials/mobile/country_select_modal.html';
        className += ' mobile_modal';
      }

      var modal = $modal.open({
        templateUrl: tUrl,
        controller: 'CountrySelectModalController',
        windowClass: className
      });

      modal.result.then(function (code) {
        $scope.credentials.phone_country = code;
        $scope.$broadcast('country_selected');
      });
    };

    $scope.$watch('credentials.phone_country', updateCountry);
    $scope.$watch('credentials.phone_number', updateCountry);

    function updateCountry () {
      var phoneNumber = (
            ($scope.credentials.phone_country || '') +
            ($scope.credentials.phone_number || '')
          ).replace(/\D+/g, ''),
          i, j, code,
          maxLength = 0,
          maxName = false;

      if (phoneNumber.length) {
        for (i = 0; i < Config.CountryCodes.length; i++) {
          for (j = 1; j < Config.CountryCodes[i].length; j++) {
            code = Config.CountryCodes[i][j].replace(/\D+/g, '');
            if (code.length >= maxLength && !phoneNumber.indexOf(code)) {
              maxLength = code.length;
              maxName = Config.CountryCodes[i][0];
            }
          }
        }
      }

      $scope.credentials.phone_full = phoneNumber;
      $scope.credentials.phone_country_name = maxName || 'Unknown';
    };

    var callTimeout;

    function saveAuth (result) {
      MtpApiManager.setUserAuth(options.dcID, {
        expires: result.expires,
        id: result.user.id
      });
      $timeout.cancel(callTimeout);

      $location.url('/im');
    };

    function callCheck () {
      $timeout.cancel(callTimeout);
      if (!(--$scope.callPending.remaining)) {
        $scope.callPending.success = false;
        MtpApiManager.invokeApi('auth.sendCall', {
          phone_number: $scope.credentials.phone_full,
          phone_code_hash: $scope.credentials.phone_code_hash
        }, options).then(function () {
          $scope.callPending.success = true;
        });
      } else {
        callTimeout = $timeout(callCheck, 1000);
      }
    }

    $scope.sendCode = function () {
      $timeout.cancel(callTimeout);

      ErrorService.confirm({
        type: 'LOGIN_PHONE_CORRECT',
        country_code: $scope.credentials.phone_country,
        phone_number: $scope.credentials.phone_number
      }).then(function () {
        $scope.progress.enabled = true;
        MtpApiManager.invokeApi('auth.sendCode', {
          phone_number: $scope.credentials.phone_full,
          sms_type: 0,
          api_id: Config.App.id,
          api_hash: Config.App.hash
        }, options).then(function (sentCode) {
          $scope.progress.enabled = false;

          $scope.credentials.phone_code_hash = sentCode.phone_code_hash;
          $scope.credentials.phone_occupied = sentCode.phone_registered;
          $scope.error = {};

          $scope.callPending.remaining = sentCode.send_call_timeout || 60;
          callCheck();

        }, function (error) {
          $scope.progress.enabled = false;
          console.log('sendCode error', error);
          switch (error.type) {
            case 'NETWORK_BAD_REQUEST':
              if (location.protocol == 'https:') {
                ErrorService.confirm({type: 'HTTPS_MIXED_FAIL'}).then(function () {
                  location = location.toString().replace(/^https:/, 'http:');
                });
                error.handled = true;
              }
              break;

            case 'PHONE_NUMBER_INVALID':
              $scope.error = {field: 'phone'};
              error.handled = true;
              break;
          }
        });
      });
    }


    $scope.editPhone = function () {
      $timeout.cancel(callTimeout);

      delete $scope.credentials.phone_code_hash;
      delete $scope.credentials.phone_unoccupied;
      delete $scope.credentials.phone_code_valid;
      delete $scope.callPending.remaining;
      delete $scope.callPending.success;
    }

    $scope.logIn = function (forceSignUp) {
      var method = 'auth.signIn', params = {
        phone_number: $scope.credentials.phone_full,
        phone_code_hash: $scope.credentials.phone_code_hash,
        phone_code: $scope.credentials.phone_code
      };
      if (forceSignUp) {
        method = 'auth.signUp';
        angular.extend(params, {
          first_name: $scope.credentials.first_name,
          last_name: $scope.credentials.last_name
        });
      }

      $scope.progress.enabled = true;
      MtpApiManager.invokeApi(method, params, options).then(saveAuth, function (error) {
        $scope.progress.enabled = false;
        if (error.code == 400 && error.type == 'PHONE_NUMBER_UNOCCUPIED') {
          error.handled = true;
          $scope.credentials.phone_code_valid = true;
          $scope.credentials.phone_unoccupied = true;
          return;
        } else if (error.code == 400 && error.type == 'PHONE_NUMBER_OCCUPIED') {
          error.handled = true;
          return $scope.logIn(false);
        }


        switch (error.type) {
          case 'FIRSTNAME_INVALID':
            $scope.error = {field: 'first_name'};
            error.handled = true;
            break;
          case 'LASTNAME_INVALID':
            $scope.error = {field: 'last_name'};
            error.handled = true;
            break;
          case 'PHONE_CODE_INVALID':
            $scope.error = {field: 'phone_code'};
            delete $scope.credentials.phone_code_valid;
            error.handled = true;
            break;
        }
      });

    };

    ChangelogNotifyService.checkUpdate();
  })

  .controller('AppIMController', function ($scope, $location, $routeParams, $modal, $rootScope, $modalStack, MtpApiManager, AppUsersManager, ContactsSelectService, ChangelogNotifyService, ErrorService) {

    $scope.$on('$routeUpdate', updateCurDialog);

    $scope.$on('history_focus', function (e, peerData) {
      $modalStack.dismissAll();
      if (peerData.peerString == $scope.curDialog.peer && peerData.messageID == $scope.curDialog.messageID) {
        $scope.$broadcast(peerData.messageID ? 'ui_history_change_scroll' : 'ui_history_focus');
      } else {
        $location.url('/im?p=' + peerData.peerString + (peerData.messageID ? '&m=' + peerData.messageID : ''));
      }
    });


    $scope.isLoggedIn = true;
    $scope.isEmpty = {};
    $scope.search = {};
    $scope.historyFilter = {mediaType: false};
    $scope.historyPeer = {};
    $scope.historyState = {selectActions: false, typing: []};

    $scope.openSettings = function () {
      var tUrl = 'partials/settings_modal.html',
          className = 'settings_modal_window page_modal';

      if (Config.Navigator.mobile) {
        tUrl = 'partials/mobile/settings_modal.html';
        className += ' mobile_modal';
      }

      $modal.open({
        templateUrl: tUrl,
        controller: 'SettingsModalController',
        windowClass: className
      });
    }

    $scope.openContacts = function () {
      ContactsSelectService.selectContact().then(function (userID) {
        $scope.dialogSelect(AppUsersManager.getUserString(userID));
      });
    };

    $scope.openGroup = function () {
      ContactsSelectService.selectContacts({action: 'new_group'}).then(function (userIDs) {

        if (userIDs.length == 1) {
          $scope.dialogSelect(AppUsersManager.getUserString(userIDs[0]));
        } else if (userIDs.length > 1) {
          var scope = $rootScope.$new();
          scope.userIDs = userIDs;

          $modal.open({
            templateUrl: 'partials/chat_create_modal.html',
            controller: 'ChatCreateModalController',
            scope: scope,
            windowClass: 'group_edit_modal_window'
          });
        }

      });
    };

    $scope.importContact = function () {
      AppUsersManager.openImportContact().then(function (foundContact) {
        if (foundContact) {
          $scope.$broadcast('contact_imported');
        }
      });
    };

    $scope.dialogSelect = function (peerString, messageID) {
      var params = {peerString: peerString};
      if (messageID) {
        params.messageID = messageID;
      }
      $rootScope.$broadcast('history_focus', params);
    };

    $scope.logOut = function () {
      ErrorService.confirm({type: 'LOGOUT'}).then(function () {
        MtpApiManager.logOut().then(function () {
          location.hash = '/login';
          location.reload();
        });
      })
    };

    $scope.showPeerInfo = function () {
      if ($scope.curDialog.peerID > 0) {
        $rootScope.openUser($scope.curDialog.peerID)
      } else if ($scope.curDialog.peerID < 0) {
        $rootScope.openChat(-$scope.curDialog.peerID)
      }
    };

    $scope.toggleEdit = function () {
      $scope.$broadcast('history_edit_toggle');
    };
    $scope.selectedFlush = function () {
      $scope.$broadcast('history_edit_flush');
    };
    $scope.toggleMedia = function (mediaType) {
      $scope.$broadcast('history_media_toggle', mediaType);
    };
    $scope.returnToRecent = function () {
      $scope.$broadcast('history_return_recent');
    };
    $scope.toggleSearch = function () {
      $scope.$broadcast('dialogs_search_toggle');
    };

    updateCurDialog();

    var lastSearch = false;
    function updateCurDialog() {
      if ($routeParams.q) {
        if ($routeParams.q !== lastSearch) {
          $scope.search.query = lastSearch = $routeParams.q;
          $scope.search.messages = true;
          if ($scope.curDialog !== undefined) {
            return false;
          }
        }
      } else {
        lastSearch = false;
      }
      $scope.curDialog = {
        peer: $routeParams.p || false,
        messageID: $routeParams.m || false
      };
    }

    ChangelogNotifyService.checkUpdate();
  })

  .controller('AppImDialogsController', function ($scope, $location, $q, $timeout, $routeParams, MtpApiManager, AppUsersManager, AppChatsManager, AppMessagesManager, AppPeersManager, PhonebookContactsService, ErrorService) {

    $scope.dialogs = [];
    $scope.contacts = [];
    $scope.contactsLoaded = false;
    if ($scope.search === undefined) {
      $scope.search = {};
    }
    if ($scope.isEmpty === undefined) {
      $scope.isEmpty = {};
    }
    $scope.phonebookAvailable = PhonebookContactsService.isAvailable();

    var offset = 0,
        maxID = 0,
        hasMore = false,
        jump = 0,
        peersInDialogs = {},
        contactsShown;

    MtpApiManager.invokeApi('account.updateStatus', {offline: false});
    $scope.$on('dialogs_need_more', function () {
      // console.log('on need more');
      showMoreDialogs();
    });

    $scope.$on('dialog_unread', function (e, dialog) {
      angular.forEach($scope.dialogs, function(curDialog) {
        if (curDialog.peerID == dialog.peerID) {
          curDialog.unreadCount = dialog.count;
        }
      });
    });

    $scope.$on('dialogs_update', function (e, dialog) {
      if ($scope.search.query !== undefined && $scope.search.query.length) {
        return false;
      }

      var pos = false;
      angular.forEach($scope.dialogs, function(curDialog, curPos) {
        if (curDialog.peerID == dialog.peerID) {
          pos = curPos;
        }
      });

      var wrappedDialog = AppMessagesManager.wrapForDialog(dialog.top_message, dialog.unread_count);
      if (pos !== false) {
        var prev = $scope.dialogs.splice(pos, 1);
        safeReplaceObject(prev, wrappedDialog);
        offset++;
      }
      $scope.dialogs.unshift(wrappedDialog);
    });

    $scope.$on('dialog_flush', function (e, dialog) {
      for (var i = 0; i < $scope.dialogs.length; i++) {
        if ($scope.dialogs[i].peerID == dialog.peerID) {
          $scope.dialogs[i].deleted = true;
          break;
        }
      }
    });

    $scope.$on('history_delete', function (e, historyUpdate) {
      for (var i = 0; i < $scope.dialogs.length; i++) {
        if ($scope.dialogs[i].peerID == historyUpdate.peerID) {
          if (historyUpdate.msgs[$scope.dialogs[i].id]) {
            $scope.dialogs[i].deleted = true;
          }
          break;
        }
      }
    });

    $scope.$on('contact_imported', function () {
      if (contactsShown) {
        loadDialogs();
      }
    })

    var prevMessages = false;
    $scope.$watchCollection('search', function () {
      if ($scope.search.messages != prevMessages) {
        prevMessages = $scope.search.messages;
        $scope.dialogs = [];
        loadDialogs(true);
      } else {
        loadDialogs();
      }

      if ($routeParams.q && (!$scope.search.messages || $scope.search.query != $routeParams.q)) {
        $timeout(function () {
          $location.url(
            '/im' +
            ($scope.curDialog.peer
              ? '?p=' + $scope.curDialog.peer +
                ($scope.curDialog.messageID ? '&m=' + $scope.curDialog.messageID : '')
              : ''
            )
          );
        });
      }
    });

    if (Config.Navigator.mobile) {
      $scope.$watch('curDialog.peer', function () {
        $scope.$broadcast('ui_dialogs_update')
      });
    }

    $scope.importPhonebook = function () {
      PhonebookContactsService.openPhonebookImport().result.then(function (foundContacts) {
        if (contactsShown && foundContacts.length) {
          loadDialogs();
        }
      })
    };

    $scope.searchClear = function () {
      $scope.search.query = '';
      $scope.search.messages = false;
      $scope.$broadcast('search_clear');
    }
    $scope.$on('ui_dialogs_search_clear', $scope.searchClear);

    var searchTimeoutPromise;
    function getDialogs(force) {
      var searchMessages = $scope.search.messages && $scope.search.query.length > 0,
          curJump = ++jump,
          promise;

      $timeout.cancel(searchTimeoutPromise);
      if (searchMessages) {
        searchTimeoutPromise = force ? $q.when() : $timeout(angular.noop, 500);
        promise = searchTimeoutPromise.then(function () {
          return AppMessagesManager.getSearch({_: 'inputPeerEmpty'}, $scope.search.query, {_: 'inputMessagesFilterEmpty'}, maxID)
        });
      } else {
        promise = AppMessagesManager.getDialogs($scope.search.query, maxID);
      }

      return promise.then(function (result) {
        if (curJump != jump) {
          return $q.reject();
        }
        if (searchMessages) {
          var dialogs = [];
          angular.forEach(result.history, function (messageID) {
            var message = AppMessagesManager.getMessage(messageID),
                peerID = AppMessagesManager.getMessagePeer(message);

            dialogs.push({
              peerID: peerID,
              top_message: messageID,
              unread_count: 0
            });
          });

          result = {
            count: result.count,
            dialogs: dialogs
          };
        }

        return result;
      }, function (error) {
        if (error.type == 'NETWORK_BAD_REQUEST') {
          if (location.protocol == 'https:') {
            ErrorService.confirm({type: 'HTTPS_MIXED_FAIL'}).then(function () {
              location = location.toString().replace(/^https:/, 'http:');
            });
            error.handled = true;
          }
        }

        if (error.code == 401) {
          MtpApiManager.logOut()['finally'](function () {
            $location.url('/login');
          });
          error.handled = true;
        }

        return $q.reject();
      });
    };

    $scope.importPhonebook = function () {
      PhonebookContactsService.openPhonebookImport().result.then(function (foundContacts) {
        if (contactsShown && foundContacts.length) {
          loadDialogs();
        }
      })
    };

    function loadDialogs (force) {
      offset = 0;
      maxID = 0;
      hasMore = false;
      peersInDialogs = {};
      contactsShown = false;

      getDialogs(force).then(function (dialogsResult) {
        $scope.dialogs = [];
        $scope.contacts = [];

        if (dialogsResult.dialogs.length) {
          offset += dialogsResult.dialogs.length;

          maxID = dialogsResult.dialogs[dialogsResult.dialogs.length - 1].top_message;
          hasMore = dialogsResult.count === null || offset < dialogsResult.count;

          angular.forEach(dialogsResult.dialogs, function (dialog) {
            peersInDialogs[dialog.peerID] = true;
            $scope.dialogs.push(AppMessagesManager.wrapForDialog(dialog.top_message, dialog.unread_count));
          });
          delete $scope.isEmpty.dialogs;
        }

        $scope.$broadcast('ui_dialogs_change');

        if (!$scope.search.query) {
          AppMessagesManager.getDialogs('', maxID, 100);
          if (!dialogsResult.dialogs.length) {
            $scope.isEmpty.dialogs = true;
          }
        } else {
          showMoreDialogs();
        }

      });
    }

    function showMoreDialogs () {
      if (contactsShown && (!hasMore || !offset)) {
        return;
      }

      if (!hasMore && !$scope.search.messages && ($scope.search.query || !$scope.dialogs.length)) {
        contactsShown = true;

        var curJump = ++jump;
        AppUsersManager.getContacts($scope.search.query).then(function (contactsList) {
          if (curJump != jump) return;
          $scope.contacts = [];
          angular.forEach(contactsList, function(userID) {
            if (peersInDialogs[userID] === undefined) {
              $scope.contacts.push({
                userID: userID,
                user: AppUsersManager.getUser(userID),
                userPhoto: AppUsersManager.getUserPhoto(userID, 'User'),
                peerString: AppUsersManager.getUserString(userID)
              });
            }
          });

          if (contactsList.length) {
            delete $scope.isEmpty.contacts;
          } else if (!$scope.search.query) {
            $scope.isEmpty.contacts = true;
          }
        });
        $scope.$broadcast('ui_dialogs_append');
        return;
      }

      getDialogs().then(function (dialogsResult) {
        if (dialogsResult.dialogs.length) {
          offset += dialogsResult.dialogs.length;
          maxID = dialogsResult.dialogs[dialogsResult.dialogs.length - 1].top_message;
          hasMore = dialogsResult.count === null || offset < dialogsResult.count;

          angular.forEach(dialogsResult.dialogs, function (dialog) {
            peersInDialogs[dialog.peerID] = true;
            $scope.dialogs.push(AppMessagesManager.wrapForDialog(dialog.top_message, dialog.unread_count));
          });

          $scope.$broadcast('ui_dialogs_append');
        }
      });
    };

  })

  .controller('AppImHistoryController', function ($scope, $location, $timeout, $rootScope, MtpApiManager, AppUsersManager, AppChatsManager, AppMessagesManager, AppPeersManager, ApiUpdatesManager, PeersSelectService, IdleManager, StatusManager, ErrorService) {

    $scope.$watch('curDialog', applyDialogSelect);

    ApiUpdatesManager.attach();
    IdleManager.start();
    StatusManager.start();

    $scope.history = [];
    $scope.skippedHistory = false;
    $scope.selectedMsgs = {};
    $scope.selectedCount = 0;
    $scope.historyState.selectActions = false;
    $scope.missedCount = 0;
    $scope.state = {};

    $scope.toggleMessage = toggleMessage;
    $scope.selectedDelete = selectedDelete;
    $scope.selectedForward = selectedForward;
    $scope.selectedCancel = selectedCancel;
    $scope.selectedFlush = selectedFlush;

    $scope.toggleEdit = toggleEdit;
    $scope.toggleMedia = toggleMedia;
    $scope.returnToRecent = returnToRecent;

    $scope.$on('history_edit_toggle', toggleEdit);
    $scope.$on('history_edit_flush', selectedFlush);
    $scope.$on('history_media_toggle', function (e, mediaType) {
      toggleMedia(mediaType);
    });


    $scope.$on('history_return_recent', returnToRecent);

    var peerID,
        hasMore = false,
        hasLess = false,
        maxID = 0,
        minID = 0,
        lastSelectID = false,
        inputMediaFilters = {
          photos: 'inputMessagesFilterPhotos',
          video: 'inputMessagesFilterVideo',
          documents: 'inputMessagesFilterDocument',
          audio: 'inputMessagesFilterAudio'
        },
        jump = 0,
        moreJump = 0,
        lessJump = 0;

    function applyDialogSelect (newDialog, oldDialog) {
      var newPeer = newDialog.peer || $scope.curDialog.peer || '';
      peerID = AppPeersManager.getPeerID(newPeer);

      if (peerID == $scope.curDialog.peerID && oldDialog.messageID == newDialog.messageID) {
        return false;
      }

      $rootScope.selectedPeerID = peerID;
      $scope.curDialog.peerID = peerID;
      $scope.curDialog.inputPeer = AppPeersManager.getInputPeer(newPeer);
      $scope.historyFilter.mediaType = false;

      selectedCancel(true);

      if (oldDialog.peer && oldDialog.peer == newDialog.peer && newDialog.messageID) {
        messageFocusHistory();
      }
      else if (peerID) {
        updateHistoryPeer(true);
        loadHistory();
      }
      else {
        showEmptyHistory();
      }
    }

    function updateHistoryPeer(preload) {
      var peerData = AppPeersManager.getPeer(peerID);
      // console.log('update', preload, peerData);
      if (!peerData || peerData.deleted) {
        safeReplaceObject($scope.state, {loaded: false});
        return false;
      }

      $scope.history = [];

      safeReplaceObject($scope.historyPeer, {
        id: peerID,
        data: peerData,
        photo: AppPeersManager.getPeerPhoto(peerID, 'User', 'Group')
      });

      MtpApiManager.getUserID().then(function (id) {
        $scope.ownPhoto = AppUsersManager.getUserPhoto(id, 'User');
      });

      if (preload) {
        $scope.historyState.typing.splice(0, $scope.historyState.typing.length);
        $scope.$broadcast('ui_peer_change');
        $scope.$broadcast('ui_history_change');
        safeReplaceObject($scope.state, {loaded: true});
      }
    }

    function messageFocusHistory () {
      var i, found = false;
      for (i = 0; i < $scope.history.length; i++) {
        if ($scope.curDialog.messageID == $scope.history[i].id) {
          found = true;
          break;
        }
      }

      if (found) {
        $scope.historyUnread = {};
        $scope.historyFocus = $scope.curDialog.messageID;
        $scope.$broadcast('ui_history_change_scroll');
      } else {
        loadHistory();
      }
    }

    function showLessHistory () {
      if (!hasLess) {
        return;
      }

      var curJump = jump,
          curLessJump = ++lessJump,
          limit = 0,
          backLimit = 20;
      AppMessagesManager.getHistory($scope.curDialog.inputPeer, minID, limit, backLimit).then(function (historyResult) {
        if (curJump != jump || curLessJump != lessJump) return;

        var i, id;
        for (i = historyResult.history.length - 1; i >= 0; i--) {
          id = historyResult.history[i];
          if (id > minID) {
            $scope.history.push(AppMessagesManager.wrapForHistory(id));
          }
        }

        if (historyResult.history.length) {
          minID = historyResult.history.length >= backLimit
                    ? historyResult.history[0]
                    : 0;
          AppMessagesManager.regroupWrappedHistory($scope.history, -backLimit);
          $scope.$broadcast('ui_history_append');
        } else {
          minID = 0;
        }
        $scope.skippedHistory = hasLess = minID > 0;
      });
    }

    function showMoreHistory () {
      if (!hasMore) {
        return;
      }

      var curJump = jump,
          curMoreJump = moreJump,
          inputMediaFilter = $scope.historyFilter.mediaType && {_: inputMediaFilters[$scope.historyFilter.mediaType]},
          limit = Config.Navigator.mobile ? 20 : 0,
          getMessagesPromise = inputMediaFilter
        ? AppMessagesManager.getSearch($scope.curDialog.inputPeer, '', inputMediaFilter, maxID, limit)
        : AppMessagesManager.getHistory($scope.curDialog.inputPeer, maxID, limit);

      getMessagesPromise.then(function (historyResult) {
        if (curJump != jump || curMoreJump != moreJump) return;

        angular.forEach(historyResult.history, function (id) {
          $scope.history.unshift(AppMessagesManager.wrapForHistory(id));
        });

        hasMore = historyResult.count === null ||
                  historyResult.history.length && $scope.history.length < historyResult.count;

        if (historyResult.history.length) {
          maxID = historyResult.history[historyResult.history.length - 1];
          AppMessagesManager.regroupWrappedHistory($scope.history, historyResult.history.length + 1);
          $scope.$broadcast('ui_history_prepend');
        }
      });
    };

    function loadHistory (forceRecent) {
      $scope.missedCount = 0;

      hasMore = false;
      $scope.skippedHistory = hasLess = false;
      maxID = 0;
      minID = 0;

      var limit = 0, backLimit = 0;

      if ($scope.curDialog.messageID) {
        maxID = parseInt($scope.curDialog.messageID);
        limit = 5;
        backLimit = 5;
      }
      else if (forceRecent) {
        limit = 10;
      }
      else if (Config.Navigator.mobile) {
        limit = 20;
      }

      var curJump = ++jump,
          inputMediaFilter = $scope.historyFilter.mediaType && {_: inputMediaFilters[$scope.historyFilter.mediaType]},
          getMessagesPromise = inputMediaFilter
        ? AppMessagesManager.getSearch($scope.curDialog.inputPeer, '', inputMediaFilter, maxID)
        : AppMessagesManager.getHistory($scope.curDialog.inputPeer, maxID, limit, backLimit);


      $scope.state.mayBeHasMore = true;
      getMessagesPromise.then(function (historyResult) {
        if (curJump != jump) return;

        minID = (historyResult.unreadSkip || maxID && historyResult.history.indexOf(maxID) >= backLimit - 1)
                  ? historyResult.history[0]
                  : 0;
        maxID = historyResult.history[historyResult.history.length - 1];

        $scope.skippedHistory = hasLess = minID > 0;
        hasMore = historyResult.count === null ||
                  historyResult.history.length && historyResult.history.length < historyResult.count;

        updateHistoryPeer();
        safeReplaceObject($scope.state, {loaded: true});

        $scope.history = [];
        angular.forEach(historyResult.history, function (id) {
          var message = AppMessagesManager.wrapForHistory(id);
          if ($scope.skippedHistory) {
            delete message.unread;
          }
          $scope.history.push(message);
        });
        $scope.history.reverse();

        AppMessagesManager.regroupWrappedHistory($scope.history);

        if (historyResult.unreadOffset) {
          $scope.historyUnreadAfter = historyResult.history[historyResult.unreadOffset - 1];
        } else {
          delete $scope.historyUnreadAfter;
        }

        $scope.historyFocus = $scope.curDialog.messageID || 0;

        $scope.$broadcast('ui_history_change');

        AppMessagesManager.readHistory($scope.curDialog.inputPeer);

      }, function () {
        safeReplaceObject($scope.state, {error: true});
      });
    }

    function showEmptyHistory () {
      safeReplaceObject($scope.state, {notSelected: true});
      $scope.history = [];
      hasMore = false;

      $scope.$broadcast('ui_history_change');
    }

    function toggleMessage (messageID, $event) {
      var target = $event.target,
          shiftClick = $event.shiftKey;

      if (shiftClick) {
        $scope.$broadcast('ui_selection_clear');
      }

      if (!$scope.historyState.selectActions && !$(target).hasClass('icon-select-tick') && !$(target).hasClass('im_content_message_select_area')) {
        return false;
      }

      if ($scope.selectedMsgs[messageID]) {
        lastSelectID = false;
        delete $scope.selectedMsgs[messageID];
        $scope.selectedCount--;
        if (!$scope.selectedCount) {
          $scope.historyState.selectActions = false;
          $scope.$broadcast('ui_panel_update');
        }
      } else {

        if (!shiftClick) {
          lastSelectID = messageID;
        } else if (lastSelectID != messageID) {
          var dir = lastSelectID > messageID,
              i, startPos, curMessageID;

          for (i = 0; i < $scope.history.length; i++) {
            if ($scope.history[i].id == lastSelectID) {
              startPos = i;
              break;
            }
          }

          i = startPos;
          while ($scope.history[i] &&
                 (curMessageID = $scope.history[i].id) != messageID) {
            if (!$scope.selectedMsgs[curMessageID]) {
              $scope.selectedMsgs[curMessageID] = true;
              $scope.selectedCount++;
            }
            i += dir ? -1 : +1;
          }
        }

        $scope.selectedMsgs[messageID] = true;
        $scope.selectedCount++;
        if (!$scope.historyState.selectActions) {
          $scope.historyState.selectActions = true;
          $scope.$broadcast('ui_panel_update');
        }
      }
    }

    function selectedCancel (noBroadcast) {
      $scope.selectedMsgs = {};
      $scope.selectedCount = 0;
      $scope.historyState.selectActions = false;
      lastSelectID = false;
      if (!noBroadcast) {
        $scope.$broadcast('ui_panel_update');
      }
    }

    function selectedFlush () {
      ErrorService.confirm({type: 'HISTORY_FLUSH'}).then(function () {
        AppMessagesManager.flushHistory($scope.curDialog.inputPeer).then(function () {
          selectedCancel();
        });
      })
    };

    function selectedDelete () {
      if ($scope.selectedCount > 0) {
        var selectedMessageIDs = [];
        angular.forEach($scope.selectedMsgs, function (t, messageID) {
          selectedMessageIDs.push(messageID);
        });
        AppMessagesManager.deleteMessages(selectedMessageIDs).then(function () {
          selectedCancel();
        });
      }
    }


    function selectedForward () {
      if ($scope.selectedCount > 0) {
        var selectedMessageIDs = [];
        angular.forEach($scope.selectedMsgs, function (t, messageID) {
          selectedMessageIDs.push(messageID);
        });

        PeersSelectService.selectPeer({confirm_type: 'FORWARD_PEER'}).then(function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          AppMessagesManager.forwardMessages(peerID, selectedMessageIDs).then(function () {
            selectedCancel();
            $rootScope.$broadcast('history_focus', {peerString: peerString});
          });
        });

      }
    }

    function toggleEdit () {
      if ($scope.historyState.selectActions) {
        selectedCancel();
      } else {
        $scope.historyState.selectActions = true;
        $scope.$broadcast('ui_panel_update');
      }
    }

    function toggleMedia (mediaType) {
      $scope.historyFilter.mediaType = mediaType || false;
      $scope.history = [];
      loadHistory();
    }

    function returnToRecent () {
      if ($scope.historyFilter.mediaType) {
        toggleMedia();
      } else {
        if ($scope.curDialog.messageID) {
          $rootScope.$broadcast('history_focus', {peerString: $scope.curDialog.peer});
        } else {
          loadHistory(true);
        }
      }
    }

    $scope.$on('history_update', angular.noop);

    var typingTimeouts = {};
    $scope.$on('history_append', function (e, addedMessage) {
      if (addedMessage.peerID == $scope.curDialog.peerID) {
        if ($scope.historyFilter.mediaType || $scope.skippedHistory) {
          if (addedMessage.my) {
            returnToRecent();
          } else {
            $scope.missedCount++;
          }
          return;
        }
        // console.log('append', addedMessage);
        // console.trace();
        $scope.history.push(AppMessagesManager.wrapForHistory(addedMessage.messageID));
        AppMessagesManager.regroupWrappedHistory($scope.history, -3);
        $scope.historyState.typing.splice(0, $scope.historyState.typing.length);
        $scope.$broadcast('ui_history_append_new', {my: addedMessage.my});
        if (addedMessage.my) {
          delete $scope.historyUnreadAfter;
        }

        // console.log('append check', $rootScope.idle.isIDLE, addedMessage.peerID, $scope.curDialog.peerID);
        if (!$rootScope.idle.isIDLE) {
          $timeout(function () {
            AppMessagesManager.readHistory($scope.curDialog.inputPeer);
          });
        }
      }
    });

    $scope.$on('history_delete', function (e, historyUpdate) {
      if (historyUpdate.peerID == $scope.curDialog.peerID) {
        var newHistory = [];

        for (var i = 0; i < $scope.history.length; i++) {
          if (!historyUpdate.msgs[$scope.history[i].id]) {
            newHistory.push($scope.history[i]);
          }
        };
        $scope.history = newHistory;
        AppMessagesManager.regroupWrappedHistory($scope.history);
      }
    });

    $scope.$on('dialog_flush', function (e, dialog) {
      if (dialog.peerID == $scope.curDialog.peerID) {
        $scope.history = [];
      }
    });

    $scope.$on('history_focus', function (e, peerData) {
      if ($scope.historyFilter.mediaType) {
        toggleMedia();
      }
    });

    $scope.$on('apiUpdate', function (e, update) {
      switch (update._) {
        case 'updateUserTyping':
        case 'updateChatUserTyping':
          if (AppUsersManager.hasUser(update.user_id) &&
              $scope.curDialog.peerID == (update._ == 'updateUserTyping'
                ? update.user_id
                : -update.chat_id
              )) {
            if ($scope.historyState.typing.indexOf(update.user_id) == -1) {
              $scope.historyState.typing.push(update.user_id);
            }
            $timeout.cancel(typingTimeouts[update.user_id]);

            typingTimeouts[update.user_id] = $timeout(function () {
              var pos = $scope.historyState.typing.indexOf(update.user_id);
              if (pos !== -1) {
                $scope.historyState.typing.splice(pos, 1);
              }
            }, 6000);
          }
          break;
      }
    });

    $scope.$on('history_need_less', showLessHistory);
    $scope.$on('history_need_more', showMoreHistory);

    $rootScope.$watch('idle.isIDLE', function (newVal) {
      if (!newVal && $scope.curDialog && $scope.curDialog.peerID && !$scope.historyFilter.mediaType && !$scope.skippedHistory) {
        AppMessagesManager.readHistory($scope.curDialog.inputPeer);
      }
    });

  })

  .controller('AppImPanelController', function($scope) {
    $scope.$on('user_update', angular.noop);
  })

  .controller('AppImSendController', function ($scope, $timeout, MtpApiManager, Storage, AppPeersManager, AppMessagesManager, ApiUpdatesManager, MtpApiFileManager) {

    $scope.$watch('curDialog.peer', resetDraft);
    $scope.$on('user_update', angular.noop);
    $scope.$on('ui_typing', onTyping);

    $scope.draftMessage = {text: ''};
    $scope.$watch('draftMessage.text', onMessageChange);
    $scope.$watch('draftMessage.files', onFilesSelected);


    $scope.sendMessage = sendMessage;

    function sendMessage (e) {
      $scope.$broadcast('ui_message_before_send');

      $timeout(function () {
        var text = $scope.draftMessage.text;

        if (!angular.isString(text) || !text.length) {
          return false;
        }

        text = text.replace(/:([a-z0-9\-\+\*_]+?):/gi, function (all, name) {
          var utfChar = $.emojiarea.reverseIcons[name];
          if (utfChar !== undefined) {
            return utfChar;
          }
          return all;
        });

        var timeout = 0;
        do {

          (function (peerID, curText, curTimeout) {
            setTimeout(function () {
              AppMessagesManager.sendText(peerID, curText);
            }, curTimeout)
          })($scope.curDialog.peerID, text.substr(0, 4096), timeout);

          text = text.substr(4096);
          timeout += 100;

        } while (text.length);

        resetDraft();
        $scope.$broadcast('ui_message_send');
      });

      return cancelEvent(e);
    }


    function resetDraft (newPeer) {
      if (newPeer) {
        Storage.get('draft' + $scope.curDialog.peerID).then(function (draftText) {
          // console.log('Restore draft', 'draft' + $scope.curDialog.peerID, draftText);
          $scope.draftMessage.text = draftText || '';
          // console.log('send broadcast', $scope.draftMessage);
          $scope.$broadcast('ui_peer_draft');
        });
      } else {
        // console.log('Reset peer');
        $scope.draftMessage.text = '';
        $scope.$broadcast('ui_peer_draft');
      }
    }

    function onMessageChange(newVal) {
      // console.log('ctrl text changed', newVal);
      // console.trace('ctrl text changed', newVal);

      if (newVal && newVal.length) {
        if (!$scope.historyFilter.mediaType && !$scope.skippedHistory) {
          AppMessagesManager.readHistory($scope.curDialog.inputPeer);
        }

        var backupDraftObj = {};
        backupDraftObj['draft' + $scope.curDialog.peerID] = newVal;
        Storage.set(backupDraftObj);
        // console.log('draft save', backupDraftObj);
      } else {
        Storage.remove('draft' + $scope.curDialog.peerID);
        // console.log('draft delete', 'draft' + $scope.curDialog.peerID);
      }
    }

    function onTyping () {
      MtpApiManager.invokeApi('messages.setTyping', {
        peer: $scope.curDialog.inputPeer,
        typing: true
      });
    }

    function onFilesSelected (newVal) {
      if (!angular.isArray(newVal) || !newVal.length) {
        return;
      }

      for (var i = 0; i < newVal.length; i++) {
        AppMessagesManager.sendFile($scope.curDialog.peerID, newVal[i], {
          isMedia: $scope.draftMessage.isMedia
        });
        $scope.$broadcast('ui_message_send');
      }
    }
  })

  .controller('PhotoModalController', function ($q, $scope, $rootScope, $modalInstance, AppPhotosManager, AppMessagesManager, AppPeersManager, PeersSelectService, ErrorService) {

    $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);
    $scope.nav = {};

    $scope.download = function () {
      AppPhotosManager.downloadPhoto($scope.photoID);
    };

    if (!$scope.messageID || Config.Navigator.mobile) {
      $scope.nav.next = function () {
        $modalInstance.close();
      }
    }

    if (!$scope.messageID) {
      return;
    }


    $scope.forward = function () {
      var messageID = $scope.messageID;
      PeersSelectService.selectPeer({confirm_type: 'FORWARD_PEER'}).then(function (peerString) {
        var peerID = AppPeersManager.getPeerID(peerString);
        AppMessagesManager.forwardMessages(peerID, [messageID]).then(function () {
          $rootScope.$broadcast('history_focus', {peerString: peerString});
        });
      });
    };


    if (Config.Navigator.mobile) {
      $scope.canForward = true;
      $scope.canDelete = true;
      return;
    }

    $scope.delete = function () {
      var messageID = $scope.messageID;
      ErrorService.confirm({type: 'MESSAGE_DELETE'}).then(function () {
        AppMessagesManager.deleteMessages([messageID]);
      });
    };

    var peerID = AppMessagesManager.getMessagePeer(AppMessagesManager.getMessage($scope.messageID)),
        inputPeer = AppPeersManager.getInputPeerByID(peerID),
        inputQuery = '',
        inputFilter = {_: 'inputMessagesFilterPhotos'},
        list = [$scope.messageID],
        maxID = $scope.messageID,
        hasMore = true;

    updatePrevNext();

    AppMessagesManager.getSearch(inputPeer, inputQuery, inputFilter, 0, 1000).then(function (searchCachedResult) {
      // console.log(dT(), 'search cache', searchCachedResult);
      if (searchCachedResult.history.indexOf($scope.messageID) >= 0) {
        list = searchCachedResult.history;
        maxID = list[list.length - 1];

        updatePrevNext();
      }
      // console.log(dT(), list, maxID);
    });


    var jump = 0;
    function movePosition (sign) {
      var curIndex = list.indexOf($scope.messageID),
          index = curIndex >= 0 ? curIndex + sign : 0,
          curJump = ++jump;

      var promise = index >= list.length ? loadMore() : $q.when();
      promise.then(function () {
        if (curJump != jump) {
          return;
        }

        $scope.messageID = list[index];
        $scope.photoID = AppMessagesManager.getMessage($scope.messageID).media.photo.id;
        $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);

        updatePrevNext();
      });
    };

    var loadingPromise = false;
    function loadMore () {
      if (loadingPromise) return loadingPromise;

      return loadingPromise = AppMessagesManager.getSearch(inputPeer, inputQuery, inputFilter, maxID).then(function (searchResult) {
        if (searchResult.history.length) {
          maxID = searchResult.history[searchResult.history.length - 1];
          list = list.concat(searchResult.history);
          hasMore = list.length < searchResult.count;
        } else {
          hasMore = false;
        }

        updatePrevNext();
        loadingPromise = false;
      });
    };

    function updatePrevNext () {
      var index = list.indexOf($scope.messageID);
      $scope.nav.hasNext = index > 0;
      $scope.nav.hasPrev = hasMore || index < list.length - 1;
      $scope.canForward = $scope.canDelete = $scope.messageID > 0;
    };

    $scope.nav.next = function () {
      if (!$scope.nav.hasNext) {
        return false;
      }

      movePosition(-1);
    };

    $scope.nav.prev = function () {
      if (!$scope.nav.hasPrev) {
        return false;
      }
      movePosition(+1);
    };

    $scope.$on('history_delete', function (e, historyUpdate) {
      console.log(dT(), 'delete', historyUpdate);
      if (historyUpdate.peerID == peerID) {
        if (historyUpdate.msgs[$scope.messageID]) {
          if ($scope.nav.hasNext) {
            $scope.nav.next();
          } else if ($scope.nav.hasPrev) {
            $scope.nav.prev();
          } else {
            return $modalInstance.dismiss();
          }
        }
        var newList = [];
        for (var i = 0; i < list.length; i++) {
          if (!historyUpdate.msgs[list[i]]) {
            newList.push(list[i]);
          }
        };
        list = newList;
      }
    });

  })

  .controller('UserpicModalController', function ($q, $scope, $rootScope, $modalInstance, AppPhotosManager, AppUsersManager, AppPeersManager, AppMessagesManager, PeersSelectService, ErrorService) {

    $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);
    $scope.nav = {};
    $scope.canForward = true;

    var inputUser = AppUsersManager.getUserInput($scope.userID),
        list = [$scope.photoID],
        maxID = $scope.photoID,
        hasMore = true;

    updatePrevNext();

    AppPhotosManager.getUserPhotos(inputUser, 0, 1000).then(function (userpicCachedResult) {
      if (userpicCachedResult.photos.indexOf($scope.photoID) >= 0) {
        list = userpicCachedResult.photos;
        maxID = list[list.length - 1];
        hasMore = list.length < userpicCachedResult.count;

        updatePrevNext();
      }
    });


    var jump = 0;
    function movePosition (sign) {
      var curIndex = list.indexOf($scope.photoID),
          index = curIndex >= 0 ? curIndex + sign : 0,
          curJump = ++jump;

      var promise = index >= list.length ? loadMore() : $q.when();
      promise.then(function () {
        if (curJump != jump) {
          return;
        }

        $scope.photoID = list[index];
        $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);

        updatePrevNext();
      });
    };

    var loadingPromise = false;
    function loadMore () {
      if (loadingPromise) return loadingPromise;

      return loadingPromise = AppPhotosManager.getUserPhotos(inputUser, maxID).then(function (userpicResult) {
        maxID = userpicResult.photos[userpicResult.photos.length - 1];
        list = list.concat(userpicResult.photos);

        hasMore = list.length < userpicResult.count;

        updatePrevNext();
        loadingPromise = false;
      }, function () {
        loadingPromise = false;
      });
    };

    function updatePrevNext () {
      var index = list.indexOf($scope.photoID);
      $scope.nav.hasNext = index > 0;
      $scope.nav.hasPrev = hasMore || index < list.length - 1;
    };

    $scope.nav.next = function () {
      if (!$scope.nav.hasNext) {
        return false;
      }

      movePosition(-1);
    };

    $scope.nav.prev = function () {
      if (!$scope.nav.hasPrev) {
        return false;
      }
      movePosition(+1);
    };

    $scope.forward = function () {
      var messageID = $scope.photoID;
      PeersSelectService.selectPeer({confirm_type: 'FORWARD_PEER'}).then(function (peerString) {
        var peerID = AppPeersManager.getPeerID(peerString);
        AppMessagesManager.sendOther(peerID, {
          _: 'inputMediaPhoto',
          id: {
            _: 'inputPhoto',
            id: $scope.photoID,
            access_hash: $scope.photo.access_hash,
          }
        });
        $rootScope.$broadcast('history_focus', {peerString: peerString});
      });
    };

    $scope.delete = function () {
      var messageID = $scope.photoID;
      ErrorService.confirm({type: 'MESSAGE_DELETE'}).then(function () {
        AppMessagesManager.deleteMessages([messageID]);
      });
    };

    $scope.download = function () {
      AppPhotosManager.downloadPhoto($scope.photoID);
    };

  })

  .controller('VideoModalController', function ($scope, $rootScope, $modalInstance, PeersSelectService, AppMessagesManager, AppVideoManager, AppPeersManager, ErrorService) {
    $scope.video = AppVideoManager.wrapForFull($scope.videoID);

    $scope.progress = {enabled: false};
    $scope.player = {};


    $scope.forward = function () {
      var messageID = $scope.messageID;
      PeersSelectService.selectPeer({confirm_type: 'FORWARD_PEER'}).then(function (peerString) {
        var peerID = AppPeersManager.getPeerID(peerString);
        AppMessagesManager.forwardMessages(peerID, [messageID]).then(function () {
          $rootScope.$broadcast('history_focus', {peerString: peerString});
        });
      });
    };

    $scope.delete = function () {
      var messageID = $scope.messageID;
      ErrorService.confirm({type: 'MESSAGE_DELETE'}).then(function () {
        AppMessagesManager.deleteMessages([messageID]);
      });
    };

    $scope.download = function () {
      $rootScope.downloadVideo($scope.videoID)
    };

    $scope.$on('history_delete', function (e, historyUpdate) {
      if (historyUpdate.msgs[$scope.messageID]) {
        $modalInstance.dismiss();
      }
    });
  })

  .controller('UserModalController', function ($scope, $location, $rootScope, $modal, AppUsersManager, MtpApiManager, NotificationsManager, AppPhotosManager, AppMessagesManager, AppPeersManager, PeersSelectService, ErrorService) {

    var peerString = AppUsersManager.getUserString($scope.userID);

    $scope.user = AppUsersManager.getUser($scope.userID);
    $scope.userPhoto = AppUsersManager.getUserPhoto($scope.userID, 'User');

    $scope.settings = {notifications: true};

    MtpApiManager.invokeApi('users.getFullUser', {
      id: AppUsersManager.getUserInput($scope.userID)
    }).then(function (userFullResult) {
      AppUsersManager.saveApiUser(userFullResult.user);
      AppPhotosManager.savePhoto(userFullResult.profile_photo);
      if (userFullResult.profile_photo._ != 'photoEmpty') {
        $scope.userPhoto.id = userFullResult.profile_photo.id;
      }

      NotificationsManager.savePeerSettings($scope.userID, userFullResult.notify_settings);
      NotificationsManager.getPeerMuted($scope.userID).then(function (muted) {
        $scope.settings.notifications = !muted;

        $scope.$watch('settings.notifications', function(newValue, oldValue) {
          if (newValue === oldValue) {
            return false;
          }
          NotificationsManager.getPeerSettings($scope.userID).then(function (settings) {
            if (newValue) {
              settings.mute_until = 0;
            } else {
              settings.mute_until = 2000000000;
            }
            NotificationsManager.updatePeerSettings($scope.userID, settings);
          });
        });
      });
    });


    $scope.goToHistory = function () {
      $rootScope.$broadcast('history_focus', {peerString: peerString});
    };

    $scope.flushHistory = function () {
      ErrorService.confirm({type: 'HISTORY_FLUSH'}).then(function () {
        AppMessagesManager.flushHistory(AppPeersManager.getInputPeerByID($scope.userID)).then(function () {
          $scope.goToHistory();
        });
      });
    };

    $scope.importContact = function (edit) {
      var scope = $rootScope.$new();
      scope.importContact = {
        phone: $scope.user.phone,
        first_name: $scope.user.first_name,
        last_name: $scope.user.last_name,
      };

      $modal.open({
        templateUrl: edit ? 'partials/edit_contact_modal.html' : 'partials/import_contact_modal.html',
        controller: 'ImportContactModalController',
        windowClass: 'import_contact_modal_window page_modal',
        scope: scope
      }).result.then(function (foundUserID) {
        if ($scope.userID == foundUserID) {
          $scope.user = AppUsersManager.getUser($scope.userID);
          console.log($scope.user);
        }
      });
    };

    $scope.deleteContact = function () {
      AppUsersManager.deleteContacts([$scope.userID]).then(function () {
        $scope.user = AppUsersManager.getUser($scope.userID);
        console.log($scope.user);
      });
    };

    $scope.shareContact = function () {
      PeersSelectService.selectPeer({confirm_type: 'SHARE_CONTACT_PEER'}).then(function (peerString) {
        var peerID = AppPeersManager.getPeerID(peerString);

        AppMessagesManager.sendOther(peerID, {
          _: 'inputMediaContact',
          phone_number: $scope.user.phone,
          first_name: $scope.user.first_name,
          last_name: $scope.user.last_name,
          user_id: $scope.user.id
        });
        $rootScope.$broadcast('history_focus', {peerString: peerString});
      })
    }

  })

  .controller('ChatModalController', function ($scope, $timeout, $rootScope, $modal, AppUsersManager, AppChatsManager, MtpApiManager, MtpApiFileManager, NotificationsManager, AppMessagesManager, AppPeersManager, ApiUpdatesManager, ContactsSelectService, ErrorService) {

    $scope.chatFull = AppChatsManager.wrapForFull($scope.chatID, {});

    MtpApiManager.invokeApi('messages.getFullChat', {
      chat_id: $scope.chatID
    }).then(function (result) {
      AppChatsManager.saveApiChats(result.chats);
      AppUsersManager.saveApiUsers(result.users);

      $scope.chatFull = AppChatsManager.wrapForFull($scope.chatID, result.full_chat);
      $scope.$broadcast('ui_height');
    });

    $scope.settings = {notifications: true};

    NotificationsManager.getPeerMuted(-$scope.chatID).then(function (muted) {
      $scope.settings.notifications = !muted;

      $scope.$watch('settings.notifications', function(newValue, oldValue) {
        if (newValue === oldValue) {
          return false;
        }
        NotificationsManager.getPeerSettings(-$scope.chatID).then(function (settings) {
          if (newValue) {
            settings.mute_until = 0;
          } else {
            settings.mute_until = 2000000000;
          }
          NotificationsManager.updatePeerSettings(-$scope.chatID, settings);
        });
      });
    });

    function onStatedMessage (statedMessage) {
      ApiUpdatesManager.processUpdateMessage({
        _: 'updates',
        users: statedMessage.users,
        chats: statedMessage.chats,
        seq: statedMessage.seq,
        updates: [{
          _: 'updateNewMessage',
          message: statedMessage.message,
          pts: statedMessage.pts
        }]
      });

      $rootScope.$broadcast('history_focus', {peerString: $scope.chatFull.peerString});
    }


    $scope.leaveGroup = function () {
      MtpApiManager.invokeApi('messages.deleteChatUser', {
        chat_id: $scope.chatID,
        user_id: {_: 'inputUserSelf'}
      }).then(onStatedMessage);
    };

    $scope.returnToGroup = function () {
      MtpApiManager.invokeApi('messages.addChatUser', {
        chat_id: $scope.chatID,
        user_id: {_: 'inputUserSelf'}
      }).then(onStatedMessage);
    };


    $scope.inviteToGroup = function () {
      var disabled = [];
      angular.forEach($scope.chatFull.participants.participants, function(participant){
        disabled.push(participant.user_id);
      });

      ContactsSelectService.selectContacts({disabled: disabled}).then(function (userIDs) {
        angular.forEach(userIDs, function (userID) {
          MtpApiManager.invokeApi('messages.addChatUser', {
            chat_id: $scope.chatID,
            user_id: {_: 'inputUserContact', user_id: userID},
            fwd_limit: 100
          }).then(function (addResult) {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updates',
              seq: addResult.seq,
              users: addResult.users,
              chats: addResult.chats,
              updates: [{
                _: 'updateNewMessage',
                message: addResult.message,
                pts: addResult.pts
              }]
            });
          });
        });

        $rootScope.$broadcast('history_focus', {peerString: $scope.chatFull.peerString});
      });
    };

    $scope.kickFromGroup = function (userID) {
      var user = AppUsersManager.getUser(userID);

      console.log({_: 'inputUserForeign', user_id: userID, access_hash: user.access_hash || '0'}, user);

      MtpApiManager.invokeApi('messages.deleteChatUser', {
        chat_id: $scope.chatID,
        user_id: {_: 'inputUserForeign', user_id: userID, access_hash: user.access_hash || '0'}
      }).then(onStatedMessage);
    };



    $scope.flushHistory = function () {
      ErrorService.confirm({type: 'HISTORY_FLUSH'}).then(function () {
        AppMessagesManager.flushHistory(AppPeersManager.getInputPeerByID(-$scope.chatID)).then(function () {
          $rootScope.$broadcast('history_focus', {peerString: $scope.chatFull.peerString});
        });
      });
    };


    $scope.photo = {};

    $scope.$watch('photo.file', onPhotoSelected);

    function onPhotoSelected (photo) {
      if (!photo || !photo.type || photo.type.indexOf('image') !== 0) {
        return;
      }
      $scope.photo.updating = true;
      MtpApiFileManager.uploadFile(photo).then(function (inputFile) {
        return MtpApiManager.invokeApi('messages.editChatPhoto', {
          chat_id: $scope.chatID,
          photo: {
            _: 'inputChatUploadedPhoto',
            file: inputFile,
            crop: {_: 'inputPhotoCropAuto'}
          }
        }).then(function (updateResult) {
          onStatedMessage(updateResult);
        });
      })['finally'](function () {
        $scope.photo.updating = false;
      });
    };

    $scope.deletePhoto = function () {
      $scope.photo.updating = true;
      MtpApiManager.invokeApi('messages.editChatPhoto', {
        chat_id: $scope.chatID,
        photo: {_: 'inputChatPhotoEmpty'}
      }).then(function (updateResult) {
        onStatedMessage(updateResult);
      })['finally'](function () {
        $scope.photo.updating = false;
      });
    };

    $scope.editTitle = function () {
      var scope = $rootScope.$new();
      scope.chatID = $scope.chatID;

      $modal.open({
        templateUrl: 'partials/chat_edit_modal.html',
        controller: 'ChatEditModalController',
        scope: scope,
        windowClass: 'group_edit_modal_window'
      });
    }

  })

  .controller('SettingsModalController', function ($rootScope, $scope, $timeout, $modal, AppUsersManager, AppChatsManager, AppPhotosManager, MtpApiManager, Storage, NotificationsManager, MtpApiFileManager, ApiUpdatesManager, ChangelogNotifyService, ErrorService) {

    $scope.profile = {};
    $scope.photo = {};
    $scope.version = Config.App.version;

    MtpApiManager.getUserID().then(function (id) {
      $scope.profile = AppUsersManager.getUser(id);
      $scope.photo = AppUsersManager.getUserPhoto(id, 'User');
    });

    MtpApiManager.invokeApi('users.getFullUser', {
      id: {_: 'inputUserSelf'}
    }).then(function (userFullResult) {
      AppUsersManager.saveApiUser(userFullResult.user);
      AppPhotosManager.savePhoto(userFullResult.profile_photo);
      if (userFullResult.profile_photo._ != 'photoEmpty') {
        $scope.photo.id = userFullResult.profile_photo.id;
      }
    });

    $scope.notify = {};
    $scope.send = {};

    $scope.$watch('photo.file', onPhotoSelected);

    function onPhotoSelected (photo) {
      if (!photo || !photo.type || photo.type.indexOf('image') !== 0) {
        return;
      }
      $scope.photo.updating = true;
      MtpApiFileManager.uploadFile(photo).then(function (inputFile) {
        MtpApiManager.invokeApi('photos.uploadProfilePhoto', {
          file: inputFile,
          caption: '',
          geo_point: {_: 'inputGeoPointEmpty'},
          crop: {_: 'inputPhotoCropAuto'}
        }).then(function (updateResult) {
          AppUsersManager.saveApiUsers(updateResult.users);
          MtpApiManager.getUserID().then(function (id) {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updateShort',
              update: {
                _: 'updateUserPhoto',
                user_id: id,
                date: tsNow(true),
                photo: AppUsersManager.getUser(id).photo,
                previous: true
              }
            });
            $scope.photo = AppUsersManager.getUserPhoto(id, 'User');
          });
        });
      })['finally'](function () {
        delete $scope.updating;
      });
    };

    $scope.deletePhoto = function () {
      $scope.photo.updating = true;
      MtpApiManager.invokeApi('photos.updateProfilePhoto', {
        id: {_: 'inputPhotoEmpty'},
        crop: {_: 'inputPhotoCropAuto'}
      }).then(function (updateResult) {
        MtpApiManager.getUserID().then(function (id) {
          ApiUpdatesManager.processUpdateMessage({
            _: 'updateShort',
            update: {
              _: 'updateUserPhoto',
              user_id: id,
              date: tsNow(true),
              photo: updateResult,
              previous: true
            }
          });
          $scope.photo = AppUsersManager.getUserPhoto(id, 'User');
        });
      })['finally'](function () {
        delete $scope.photo.updating;
      });
    };

    $scope.editProfile = function () {
      $modal.open({
        templateUrl: 'partials/profile_edit_modal.html',
        controller: 'ProfileEditModalController',
        windowClass: 'profile_edit_modal_window page_modal'
      });
    };

    $scope.terminateSessions = function () {
      ErrorService.confirm({type: 'TERMINATE_SESSIONS'}).then(function () {
        MtpApiManager.invokeApi('auth.resetAuthorizations', {});
      });
    };

    Storage.get('notify_nodesktop', 'notify_nosound', 'send_ctrlenter', 'notify_volume').then(function (settings) {
      $scope.notify.desktop = !settings[0];
      $scope.send.enter = settings[2] ? '' : '1';

      if (settings[1]) {
        $scope.notify.volume = 0;
      } else if (settings[3] !== false) {
        $scope.notify.volume = settings[3] > 0 && Math.ceil(settings[3] * 10) || 0;
      } else {
        $scope.notify.volume = 5;
      }

      $scope.notify.volumeOf4 = function () {
        return 1 + Math.ceil(($scope.notify.volume - 1) / 3.3);
      };

      $scope.toggleSound = function () {
        if ($scope.notify.volume) {
          $scope.notify.volume = 0;
        } else {
          $scope.notify.volume = 5;
        }
      }

      var testSoundPromise;
      $scope.$watch('notify.volume', function (newValue, oldValue) {
        if (newValue !== oldValue) {
          var storeVolume = newValue / 10;
          Storage.set({notify_volume: storeVolume});
          Storage.remove('notify_nosound');
          NotificationsManager.clear();

          if (testSoundPromise) {
            $timeout.cancel(testSoundPromise);
          }
          testSoundPromise = $timeout(function () {
            NotificationsManager.testSound(storeVolume);
          }, 500);
        }
      });

      $scope.toggleDesktop = function () {
        $scope.notify.desktop = !$scope.notify.desktop;

        if ($scope.notify.desktop) {
          Storage.remove('notify_nodesktop');
        } else {
          Storage.set({notify_nodesktop: true});
        }
      }

      $scope.toggleCtrlEnter = function (newValue) {
        $scope.send.enter = newValue;

        if ($scope.send.enter) {
          Storage.remove('send_ctrlenter');
        } else {
          Storage.set({send_ctrlenter: true});
        }
        $rootScope.$broadcast('settings_changed');
      }
    });

    $scope.openChangelog = function () {
      ChangelogNotifyService.showChangelog(false);
    }
  })

  .controller('ProfileEditModalController', function ($rootScope, $scope, $timeout, $modal, $modalInstance, AppUsersManager, AppChatsManager, MtpApiManager, Storage, NotificationsManager, MtpApiFileManager, ApiUpdatesManager) {

    $scope.profile = {};
    $scope.error = {};

    MtpApiManager.getUserID().then(function (id) {
      $scope.profile = AppUsersManager.getUser(id);
    });

    $scope.updateProfile = function () {
      $scope.profile.updating = true;

      MtpApiManager.invokeApi('account.updateProfile', {
        first_name: $scope.profile.first_name || '',
        last_name: $scope.profile.last_name || ''
      }).then(function (user) {
        $scope.error = {};
        AppUsersManager.saveApiUser(user);
        $modalInstance.close();
      }, function (error) {
        switch (error.type) {
          case 'FIRSTNAME_INVALID':
            $scope.error = {field: 'first_name'};
            error.handled = true;
            break;

          case 'LASTNAME_INVALID':
            $scope.error = {field: 'last_name'};
            error.handled = true;
            break;

          case 'NAME_NOT_MODIFIED':
            error.handled = true;
            $modalInstance.close();
            break;
        }
      })['finally'](function () {
        delete $scope.profile.updating;
      });
    }
  })

  .controller('ContactsModalController', function ($scope, $modal, $modalInstance, AppUsersManager, ErrorService) {

    $scope.contacts = [];
    $scope.search = {};
    $scope.slice = {limit: 20, limitDelta: 20};

    resetSelected();
    $scope.disabledContacts = {};

    if ($scope.disabled) {
      for (var i = 0; i < $scope.disabled.length; i++) {
        $scope.disabledContacts[$scope.disabled[i]] = true;
      }
    }

    if ($scope.selected) {
      for (var i = 0; i < $scope.selected.length; i++) {
        if (!$scope.selectedContacts[$scope.selected[i]]) {
          $scope.selectedContacts[$scope.selected[i]] = true;
          $scope.selectedCount++;
        }
      }
    }

    function resetSelected () {
      $scope.selectedContacts = {};
      $scope.selectedCount = 0;
    };

    function updateContacts (query) {
      AppUsersManager.getContacts(query).then(function (contactsList) {
        $scope.contacts = [];
        $scope.slice.limit = 20;

        angular.forEach(contactsList, function(userID) {
          var contact = {
            userID: userID,
            user: AppUsersManager.getUser(userID),
            userPhoto: AppUsersManager.getUserPhoto(userID, 'User')
          }
          $scope.contacts.push(contact);
        });
        $scope.contactsEmpty = query ? false : !$scope.contacts.length;
        $scope.$broadcast('contacts_change');
      });
    };

    $scope.$watch('search.query', updateContacts);

    $scope.toggleEdit = function (enabled) {
      $scope.action = enabled ? 'edit' : '';
      $scope.multiSelect = enabled;
      resetSelected();
    };

    $scope.contactSelect = function (userID) {
      if ($scope.disabledContacts[userID]) {
        return false;
      }
      if (!$scope.multiSelect) {
        return $modalInstance.close(userID);
      }
      if ($scope.selectedContacts[userID]) {
        delete $scope.selectedContacts[userID];
        $scope.selectedCount--;
      } else {
        $scope.selectedContacts[userID] = true;
        $scope.selectedCount++;
      }
    };

    $scope.submitSelected = function () {
      if ($scope.selectedCount > 0) {
        var selectedUserIDs = [];
        angular.forEach($scope.selectedContacts, function (t, userID) {
          selectedUserIDs.push(userID);
        });
        return $modalInstance.close(selectedUserIDs);
      }
    };

    $scope.deleteSelected = function () {
      if ($scope.selectedCount > 0) {
        var selectedUserIDs = [];
        angular.forEach($scope.selectedContacts, function (t, userID) {
          selectedUserIDs.push(userID);
        });
        AppUsersManager.deleteContacts(selectedUserIDs).then(function () {
          resetSelected();
          updateContacts($scope.search.query);
        });
      }
    };

    $scope.importContact = function () {
      AppUsersManager.openImportContact().then(function () {
        updateContacts($scope.search && $scope.search.query || '');
      });
    };

  })

  .controller('PeerSelectController', function ($scope, $modalInstance, $q, AppPeersManager, ErrorService) {

    $scope.dialogSelect = function (peerString) {
      var promise;
      if ($scope.confirm_type) {
        var peerID = AppPeersManager.getPeerID(peerString),
            peerData = AppPeersManager.getPeer(peerID);
        promise = ErrorService.confirm({
          type: $scope.confirm_type,
          peer_id: peerID,
          peer_data: peerData
        });
      } else {
        promise = $q.when();
      }
      promise.then(function () {
        $modalInstance.close(peerString);
      });
    };

    $scope.toggleSearch = function () {
      $scope.$broadcast('dialogs_search_toggle');
    };
  })

  .controller('ChatCreateModalController', function ($scope, $modalInstance, $rootScope, MtpApiManager, AppUsersManager, AppChatsManager, ApiUpdatesManager) {
    $scope.group = {name: ''};

    $scope.createGroup = function () {
      if (!$scope.group.name) {
        return;
      }
      $scope.group.creating = true;
      var inputUsers = [];
      angular.forEach($scope.userIDs, function(userID) {
        inputUsers.push({_: 'inputUserContact', user_id: userID});
      });
      return MtpApiManager.invokeApi('messages.createChat', {
        title: $scope.group.name,
        users: inputUsers
      }).then(function (createdResult) {
        ApiUpdatesManager.processUpdateMessage({
          _: 'updates',
          seq: createdResult.seq,
          users: createdResult.users,
          chats: createdResult.chats,
          updates: [{
            _: 'updateNewMessage',
            message: createdResult.message,
            pts: createdResult.pts
          }]
        });

        var peerString = AppChatsManager.getChatString(createdResult.message.to_id.chat_id);
        $rootScope.$broadcast('history_focus', {peerString: peerString});
      })['finally'](function () {
        delete $scope.group.creating;
      });
    };

  })

  .controller('ChatEditModalController', function ($scope, $modalInstance, $rootScope, MtpApiManager, AppUsersManager, AppChatsManager, ApiUpdatesManager) {

    var chat = AppChatsManager.getChat($scope.chatID);
    $scope.group = {name: chat.title};

    $scope.updateGroup = function () {
      if (!$scope.group.name) {
        return;
      }
      if ($scope.group.name == chat.title) {
        return $modalInstance.close();
      }

      $scope.group.updating = true;

      return MtpApiManager.invokeApi('messages.editChatTitle', {
        chat_id: $scope.chatID,
        title: $scope.group.name
      }).then(function (editResult) {
        ApiUpdatesManager.processUpdateMessage({
          _: 'updates',
          seq: editResult.seq,
          users: editResult.users,
          chats: editResult.chats,
          updates: [{
            _: 'updateNewMessage',
            message: editResult.message,
            pts: editResult.pts
          }]
        });

        var peerString = AppChatsManager.getChatString($scope.chatID);
        $rootScope.$broadcast('history_focus', {peerString: peerString});
      })['finally'](function () {
        delete $scope.group.updating;
      });
    };
  })

  .controller('ImportContactModalController', function ($scope, $modalInstance, $rootScope, AppUsersManager, ErrorService, PhonebookContactsService) {
    if ($scope.importContact === undefined) {
      $scope.importContact = {};
    }

    $scope.phonebookAvailable = PhonebookContactsService.isAvailable();

    $scope.doImport = function () {
      if ($scope.importContact && $scope.importContact.phone) {
        $scope.progress = {enabled: true};
        AppUsersManager.importContact(
          $scope.importContact.phone,
          $scope.importContact.first_name || '',
          $scope.importContact.last_name || ''
        ).then(function (foundUserID) {
          if (!foundUserID) {
            ErrorService.show({
              error: {code: 404, type: 'USER_NOT_USING_TELEGRAM'}
            });
          }
          $modalInstance.close(foundUserID);
        })['finally'](function () {
          delete $scope.progress.enabled;
        });
      }
    };

    $scope.importPhonebook = function () {
      PhonebookContactsService.openPhonebookImport().result.then(function (foundContacts) {
        if (foundContacts) {
          $modalInstance.close(foundContacts[0]);
        } else {
          $modalInstance.dismiss();
        }
      })
    };

  })

  .controller('CountrySelectModalController', function ($scope, $modalInstance, $rootScope, SearchIndexManager) {

    $scope.search = {};
    $scope.slice = {limit: 20, limitDelta: 20}

    var searchIndex = SearchIndexManager.createIndex();

    for (var i = 0; i < Config.CountryCodes.length; i++) {
      SearchIndexManager.indexObject(i, Config.CountryCodes[i].join(' '), searchIndex);
    }

    $scope.$watch('search.query', function (newValue) {
      var filtered = false,
          results = {};

      if (angular.isString(newValue) && newValue.length) {
        filtered = true;
        results = SearchIndexManager.search(newValue, searchIndex);
      }

      $scope.countries = [];
      $scope.slice.limit = 20;

      var j;
      for (var i = 0; i < Config.CountryCodes.length; i++) {
        if (!filtered || results[i]) {
          for (j = 1; j < Config.CountryCodes[i].length; j++) {
            $scope.countries.push({name: Config.CountryCodes[i][0], code: Config.CountryCodes[i][j]});
          }
        }
      }

    });
  })


  .controller('PhonebookModalController', function ($scope, $modalInstance, $rootScope, AppUsersManager, PhonebookContactsService, SearchIndexManager, ErrorService) {

    $scope.search           = {};
    $scope.phonebook        = [];
    $scope.selectedContacts = {};
    $scope.selectedCount    = 0;
    $scope.slice            = {limit: 20, limitDelta: 20};
    $scope.progress         = {enabled: false};
    $scope.multiSelect      = true;

    var searchIndex = SearchIndexManager.createIndex(),
        phonebookReady = false;

    PhonebookContactsService.getPhonebookContacts().then(function (phonebook) {
      for (var i = 0; i < phonebook.length; i++) {
        SearchIndexManager.indexObject(i, phonebook[i].first_name + ' ' + phonebook[i].last_name + ' ' + phonebook[i].phones.join(' '), searchIndex);
      }
      $scope.phonebook = phonebook;
      $scope.toggleSelection(true);
      phonebookReady = true;
      updateList();
    }, function (error) {
      ErrorService.show({
        error: {code: 403, type: 'PHONEBOOK_GET_CONTACTS_FAILED', originalError: error}
      });
    });

    function updateList () {
      var filtered = false,
          results = {};

      if (angular.isString($scope.search.query) && $scope.search.query.length) {
        filtered = true;
        results = SearchIndexManager.search($scope.search.query, searchIndex);

        $scope.contacts = [];
        delete $scope.contactsEmpty;
        for (var i = 0; i < $scope.phonebook.length; i++) {
          if (!filtered || results[i]) {
            $scope.contacts.push($scope.phonebook[i]);
          }
        }
      } else {
        $scope.contacts = $scope.phonebook;
        $scope.contactsEmpty = !$scope.contacts.length;
      }

      $scope.slice.limit = 20;
    }

    $scope.$watch('search.query', function (newValue) {
      if (phonebookReady) {
        updateList();
      }
    });

    $scope.contactSelect = function (i) {
      if (!$scope.multiSelect) {
        return $modalInstance.close($scope.phonebook[i]);
      }
      if ($scope.selectedContacts[i]) {
        delete $scope.selectedContacts[i];
        $scope.selectedCount--;
      } else {
        $scope.selectedContacts[i] = true;
        $scope.selectedCount++;
      }
    };

    $scope.toggleSelection = function (fill) {
      if (!$scope.selectedCount || fill) {
        $scope.selectedCount = $scope.phonebook.length;
        for (var i = 0; i < $scope.phonebook.length; i++) {
          $scope.selectedContacts[i] = true;
        }
      } else {
        $scope.selectedCount = 0;
        $scope.selectedContacts = {};
      }
    };

    $scope.submitSelected = function () {
      if ($scope.selectedCount <= 0) {
        $modalInstance.dismiss();
      }

      var selectedContacts = [];
      angular.forEach($scope.selectedContacts, function (t, i) {
        selectedContacts.push($scope.phonebook[i]);
      });

      ErrorService.confirm({
        type: 'CONTACTS_IMPORT_PERFORM'
      }).then(function () {
        $scope.progress.enabled = true;
        AppUsersManager.importContacts(selectedContacts).then(function (foundContacts) {
          if (!foundContacts.length) {
            ErrorService.show({
              error: {code: 404, type: 'USERS_NOT_USING_TELEGRAM'}
            });
          }
          $modalInstance.close(foundContacts);
        })['finally'](function () {
          $scope.progress.enabled = false;
        });
      });
    };

  })
