/*!
 * Webogram v0.3.9 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Controllers */

angular.module('myApp.controllers', ['myApp.i18n'])

  .controller('AppWelcomeController', function($scope, $location, MtpApiManager, ErrorService, ChangelogNotifyService, LayoutSwitchService) {
    MtpApiManager.getUserID().then(function (id) {
      if (id) {
        $location.url('/im');
        return;
      }
      if (location.protocol == 'http:' &&
          !Config.Modes.http &&
          Config.App.domains.indexOf(location.hostname) != -1) {
        location.href = location.href.replace(/^http:/, 'https:');
        return;
      }
      $location.url('/login');
    });

    ChangelogNotifyService.checkUpdate();
    LayoutSwitchService.start();
  })

  .controller('AppLoginController', function ($scope, $rootScope, $location, $timeout, $modal, $modalStack, MtpApiManager, ErrorService, NotificationsManager, ChangelogNotifyService, IdleManager, LayoutSwitchService, TelegramMeWebService, _) {

    $modalStack.dismissAll();
    IdleManager.start();

    MtpApiManager.getUserID().then(function (id) {
      if (id) {
        $location.url('/im');
        return;
      }
      if (location.protocol == 'http:' &&
          !Config.Modes.http &&
          Config.App.domains.indexOf(location.hostname) != -1) {
        location.href = location.href.replace(/^http:/, 'https:');
        return;
      }
      TelegramMeWebService.setAuthorized(false);
    });

    var options = {dcID: 2, createNetworker: true},
        countryChanged = false,
        selectedCountry = false;

    $scope.credentials = {phone_country: '', phone_country_name: '', phone_number: '', phone_full: ''};
    $scope.progress = {};
    $scope.callPending = {};
    $scope.about = {};

    $scope.chooseCountry = function () {
      var modal = $modal.open({
        templateUrl: templateUrl('country_select_modal'),
        controller: 'CountrySelectModalController',
        windowClass: 'countries_modal_window mobile_modal'
      });

      modal.result.then(selectCountry);
    };

    function initPhoneCountry () {
      var langCode = (navigator.language || '').toLowerCase(),
          countryIso2 = Config.LangCountries[langCode],
          shouldPregenerate = !Config.Navigator.mobile;

      if (['en', 'en-us', 'en-uk'].indexOf(langCode) == -1) {
        if (countryIso2 !== undefined) {
          selectPhoneCountryByIso2(countryIso2);
        } else if (langCode.indexOf('-') > 0) {
          selectPhoneCountryByIso2(langCode.split('-')[1].toUpperCase());
        } else {
          selectPhoneCountryByIso2('US');
        }
      } else {
        selectPhoneCountryByIso2('US');
      }

      if (!shouldPregenerate) {
        return;
      }
      var wasCountry = $scope.credentials.phone_country;
      MtpApiManager.invokeApi('help.getNearestDc', {}, {dcID: 2, createNetworker: true}).then(function (nearestDcResult) {
        if (wasCountry == $scope.credentials.phone_country) {
          selectPhoneCountryByIso2(nearestDcResult.country);
        }
        if (nearestDcResult.nearest_dc != nearestDcResult.this_dc) {
          MtpApiManager.getNetworker(nearestDcResult.nearest_dc, {createNetworker: true});
        }
      });
    }

    function selectPhoneCountryByIso2 (countryIso2) {
      var i, country;
      for (i = 0; i < Config.CountryCodes.length; i++) {
        country = Config.CountryCodes[i];
        if (country[0] == countryIso2) {
          return selectCountry({name: _(country[1] + '_raw'), code: country[2]});
        }
      }
      return selectCountry({name: _('country_select_modal_country_us_raw'), code: '+1'});
    }

    function selectCountry (country) {
      selectedCountry = country;
      if ($scope.credentials.phone_country != country.code) {
        $scope.credentials.phone_country = country.code;
      } else {
        updateCountry();
      }
      $scope.$broadcast('country_selected');
      $scope.$broadcast('value_updated');
    }

    function updateCountry () {
      var phoneNumber = (
            ($scope.credentials.phone_country || '') +
            ($scope.credentials.phone_number || '')
          ).replace(/\D+/g, ''),
          i, j, code,
          maxLength = 0,
          maxName = false;

      if (phoneNumber.length) {
        if (selectedCountry && !phoneNumber.indexOf(selectedCountry.code.replace(/\D+/g, ''))) {
          maxName = selectedCountry.name;
        } else {
          for (i = 0; i < Config.CountryCodes.length; i++) {
            for (j = 2; j < Config.CountryCodes[i].length; j++) {
              code = Config.CountryCodes[i][j].replace(/\D+/g, '');
              if (code.length > maxLength && !phoneNumber.indexOf(code)) {
                maxLength = code.length;
                maxName = _(Config.CountryCodes[i][1] + '_raw');
              }
            }
          }
        }
      }

      $scope.credentials.phone_full = phoneNumber;
      $scope.credentials.phone_country_name = maxName || _('login_controller_unknown_country_raw');
    };

    $scope.$watch('credentials.phone_country', updateCountry);
    $scope.$watch('credentials.phone_number', updateCountry);
    initPhoneCountry();


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
      if ($scope.credentials.viaApp) {
        return;
      }
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

        onContentLoaded(function () {
          $scope.$broadcast('ui_height');
        });

        var authKeyStarted = tsNow();
        MtpApiManager.invokeApi('auth.sendCode', {
          phone_number: $scope.credentials.phone_full,
          // sms_type: 5,
          api_id: Config.App.id,
          api_hash: Config.App.hash
        }, options).then(function (sentCode) {
          $scope.progress.enabled = false;

          $scope.credentials.phone_code_hash = sentCode.phone_code_hash;
          $scope.credentials.phone_occupied = sentCode.phone_registered;
          $scope.credentials.viaApp = sentCode._ == 'auth.sentAppCode';
          $scope.callPending.remaining = sentCode.send_call_timeout || 60;
          $scope.error = {};
          $scope.about = {};

          callCheck();

          onContentLoaded(function () {
            $scope.$broadcast('ui_height');
          });

        }, function (error) {
          $scope.progress.enabled = false;
          console.log('sendCode error', error);
          switch (error.type) {
            case 'PHONE_NUMBER_INVALID':
              $scope.error = {field: 'phone'};
              error.handled = true;
              break;
          }
        })['finally'](function () {
          if ($rootScope.idle.isIDLE || tsNow() - authKeyStarted > 60000) {
            NotificationsManager.notify({
              title: 'Telegram',
              message: 'Your authorization key was successfully generated! Open the app to log in.',
              tag: 'auth_key'
            });
          }
        });
      });
    }

    $scope.sendSms = function () {
      if (!$scope.credentials.viaApp) {
        return;
      }
      delete $scope.credentials.viaApp;
      MtpApiManager.invokeApi('auth.sendSms', {
        phone_number: $scope.credentials.phone_full,
        phone_code_hash: $scope.credentials.phone_code_hash
      }, options).then(callCheck);
    }

    $scope.editPhone = function () {
      $timeout.cancel(callTimeout);

      delete $scope.credentials.phone_code_hash;
      delete $scope.credentials.phone_unoccupied;
      delete $scope.credentials.phone_code_valid;
      delete $scope.credentials.viaApp;
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
          $scope.about = {};
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
    LayoutSwitchService.start();
  })

  .controller('AppIMController', function ($scope, $location, $routeParams, $modal, $rootScope, $modalStack, MtpApiManager, AppUsersManager, AppChatsManager, AppPeersManager, ContactsSelectService, ChangelogNotifyService, ErrorService, AppRuntimeManager, HttpsMigrateService, LayoutSwitchService, LocationParamsService) {

    $scope.$on('$routeUpdate', updateCurDialog);

    $scope.$on('history_focus', function (e, peerData) {
      $modalStack.dismissAll();
      if (peerData.peerString == $scope.curDialog.peer && peerData.messageID == $scope.curDialog.messageID) {
        $scope.$broadcast(peerData.messageID ? 'ui_history_change_scroll' : 'ui_history_focus');
      } else {
        var peerID = AppPeersManager.getPeerID(peerData.peerString);
        var peer = peerData.peerString;
        if (peerID > 0) {
          var username = AppUsersManager.getUser(peerID).username;
          if (username) {
            peer = '@' + username;
          }
        }
        $location.url('/im?p=' + peer + (peerData.messageID ? '&m=' + peerData.messageID : ''));
      }
    });

    $scope.$on('esc_no_more', function () {
      $rootScope.$apply(function () {
        $location.url('/im');
      })
    });


    $scope.isLoggedIn = true;
    $scope.isEmpty = {};
    $scope.search = {};
    $scope.historyFilter = {mediaType: false};
    $scope.historyPeer = {};
    $scope.historyState = {selectActions: false, typing: [], missedCount: 0};

    $scope.openSettings = function () {
      $modal.open({
        templateUrl: templateUrl('settings_modal'),
        controller: 'SettingsModalController',
        windowClass: 'settings_modal_window mobile_modal'
      });
    };

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
            templateUrl: templateUrl('chat_create_modal'),
            controller: 'ChatCreateModalController',
            scope: scope,
            windowClass: 'md_simple_modal_window mobile_modal'
          });
        }

      });
    };

    $scope.importContact = function () {
      AppUsersManager.openImportContact().then(function (foundContact) {
        if (foundContact) {
          $rootScope.$broadcast('history_focus', {
            peerString: AppUsersManager.getUserString(foundContact)
          });
        }
      });
    };

    $scope.searchClear = function () {
      $scope.search.query = '';
      $scope.search.messages = false;
      $scope.$broadcast('search_clear');
    }

    $scope.dialogSelect = function (peerString, messageID) {
      var params = {peerString: peerString};
      if (messageID) {
        params.messageID = messageID;
      }
      else if ($scope.search.query) {
        $scope.searchClear();
      }
      $rootScope.$broadcast('history_focus', params);
    };

    $scope.logOut = function () {
      ErrorService.confirm({type: 'LOGOUT'}).then(function () {
        MtpApiManager.logOut().then(function () {
          location.hash = '/login';
          AppRuntimeManager.reload();
        });
      })
    };

    $scope.openChangelog = function () {
      ChangelogNotifyService.showChangelog(false);
    }

    $scope.showPeerInfo = function () {
      if ($scope.curDialog.peerID > 0) {
        AppUsersManager.openUser($scope.curDialog.peerID)
      } else if ($scope.curDialog.peerID < 0) {
        AppChatsManager.openChat(-$scope.curDialog.peerID)
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
      if ($routeParams.p && $routeParams.p.charAt(0) == '@') {
        if ($scope.curDialog === undefined) {
          $scope.curDialog = {};
        }
        AppUsersManager.resolveUsername($routeParams.p.substr(1)).then(function (userID) {
          $scope.curDialog = {
            peer: AppUsersManager.getUserString(userID),
            messageID: $routeParams.m || false
          };
        });
      } else {
        $scope.curDialog = {
          peer: $routeParams.p || false,
          messageID: $routeParams.m || false
        };
      }
    }

    ChangelogNotifyService.checkUpdate();
    HttpsMigrateService.start();
    LayoutSwitchService.start();
    LocationParamsService.start();
  })

  .controller('AppImDialogsController', function ($scope, $location, $q, $timeout, $routeParams, MtpApiManager, AppUsersManager, AppChatsManager, AppMessagesManager, AppPeersManager, PhonebookContactsService, ErrorService, AppRuntimeManager) {

    $scope.dialogs = [];
    $scope.contacts = [];
    $scope.foundUsers = [];
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
      delete $scope.isEmpty.dialogs;

      if (!peersInDialogs[dialog.peerID]) {
        peersInDialogs[dialog.peerID] = true;
        if (contactsShown) {
          showMoreContacts();
        }
      }

    });

    $scope.$on('dialog_flush', function (e, dialog) {
      for (var i = 0; i < $scope.dialogs.length; i++) {
        if ($scope.dialogs[i].peerID == dialog.peerID) {
          $scope.dialogs.splice(i, 1);
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

    if (Config.Mobile) {
      $scope.$watch('curDialog.peer', function () {
        $scope.$broadcast('ui_dialogs_update')
      });
    }

    $scope.importPhonebook = function () {
      PhonebookContactsService.openPhonebookImport();
    };

    $scope.$on('contacts_update', function () {
      if (contactsShown) {
        showMoreContacts();
      }
    });

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
          return AppMessagesManager.getSearch({_: 'inputPeerEmpty'}, $scope.search.query, {_: 'inputMessagesFilterEmpty'}, maxID);
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
              unread_count: -1
            });
          });

          result = {
            count: result.count,
            dialogs: dialogs
          };
        }

        return result;
      }, function (error) {
        if (error.code == 401) {
          MtpApiManager.logOut()['finally'](function () {
            if (location.protocol == 'http:' &&
                !Config.Modes.http &&
                Config.App.domains.indexOf(location.hostname) != -1) {
              location.href = location.href.replace(/^http:/, 'https:');
            } else {
              location.hash = '/login';
              AppRuntimeManager.reload();
            }
          });
          error.handled = true;
        }

        return $q.reject();
      });
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
        $scope.foundUsers = [];

        if (dialogsResult.dialogs.length) {
          offset += dialogsResult.dialogs.length;

          maxID = dialogsResult.dialogs[dialogsResult.dialogs.length - 1].top_message;
          hasMore = dialogsResult.count === null || offset < dialogsResult.count;

          angular.forEach(dialogsResult.dialogs, function (dialog) {
            peersInDialogs[dialog.peerID] = true;
            var wrappedDialog = AppMessagesManager.wrapForDialog(dialog.top_message, dialog.unread_count);
            $scope.dialogs.push(wrappedDialog);
          });
          delete $scope.isEmpty.dialogs;
        }

        $scope.$broadcast('ui_dialogs_change');

        if (!$scope.search.query) {
          AppMessagesManager.getDialogs('', maxID, 100);
          if (!dialogsResult.dialogs.length) {
            $scope.isEmpty.dialogs = true;
            showMoreDialogs();
          }
        } else {
          showMoreDialogs();
        }

      });
    }

    function showMoreContacts () {
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
              peerString: AppUsersManager.getUserString(userID)
            });
          }
        });

        if (contactsList.length) {
          delete $scope.isEmpty.contacts;
        } else if (!$scope.search.query) {
          $scope.isEmpty.contacts = true;
        }
        $scope.$broadcast('ui_dialogs_append');
      });

      if ($scope.search.query && $scope.search.query.length >= 5) {
        $timeout(function() {
          if (curJump != jump) return;
          MtpApiManager.invokeApi('contacts.search', {q: $scope.search.query, limit: 10}).then(function (result) {
            AppUsersManager.saveApiUsers(result.users);
            if (curJump != jump) return;
            $scope.foundUsers = [];
            angular.forEach(result.results, function(contactFound) {
              var userID = contactFound.user_id;
              if (peersInDialogs[userID] === undefined) {
                $scope.foundUsers.push({
                  userID: userID,
                  user: AppUsersManager.getUser(userID),
                  peerString: AppUsersManager.getUserString(userID)
                });
              }
            });
          }, function (error) {
            if (error.code == 400) {
              error.handled = true;
            }
          });
        }, 500);
      }
    }

    function showMoreDialogs () {
      if (contactsShown && (!hasMore || !offset)) {
        return;
      }

      if (!hasMore && !$scope.search.messages && ($scope.search.query || !$scope.dialogs.length)) {
        showMoreContacts();
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

    $scope.peerHistories = [];
    $scope.skippedHistory = false;
    $scope.selectedMsgs = {};
    $scope.selectedCount = 0;
    $scope.historyState.selectActions = false;
    $scope.historyState.missedCount = 0;
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
        peerHistory = false,
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
        moreActive = false,
        morePending = false,
        lessJump = 0,
        lessActive = false,
        lessPending = false;

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

    function historiesQueuePush (peerID) {
      var pos = -1,
          maxLen = 10,
          i,
          history,
          diff;

      for (i = 0; i < $scope.peerHistories.length; i++) {
        if ($scope.peerHistories[i].peerID == peerID) {
          pos = i;
          break;
        }
      }
      if (pos > -1) {
        history = $scope.peerHistories[pos];
        // if (pos) {
        //   $scope.peerHistories.splice(pos, 1);
        //   $scope.peerHistories.unshift(history);
        // }
        return history;
      }
      history = {peerID: peerID, messages: []};
      $scope.peerHistories.unshift(history);
      diff = $scope.peerHistories.length - maxLen;
      if (diff > 0) {
        $scope.peerHistories.splice(maxLen - 1, diff);
      }

      return history;
    }

    function historiesQueueFind (peerID) {
      var i;
      for (i = 0; i < $scope.peerHistories.length; i++) {
        if ($scope.peerHistories[i].peerID == peerID) {
          return $scope.peerHistories[i];
        }
      }
      return false;
    }

    function updateHistoryPeer(preload) {
      var peerData = AppPeersManager.getPeer(peerID);
      // console.log('update', preload, peerData);
      if (!peerData || peerData.deleted) {
        safeReplaceObject($scope.state, {loaded: false});
        return false;
      }

      peerHistory = historiesQueuePush(peerID);

      safeReplaceObject($scope.historyPeer, {
        id: peerID,
        data: peerData,
        photo: AppPeersManager.getPeerPhoto(peerID, 'User', 'Group')
      });

      MtpApiManager.getUserID().then(function (id) {
        $scope.ownID = id;
        $scope.ownPhoto = AppUsersManager.getUserPhoto(id, 'User');
      });

      if (preload) {
        $scope.historyState.typing.splice(0, $scope.historyState.typing.length);
        $scope.$broadcast('ui_peer_change');
        $scope.$broadcast('ui_history_change');
        safeReplaceObject($scope.state, {loaded: true, empty: !peerHistory.messages.length});
      }
    }

    function messageFocusHistory () {
      var i,
          found = false,
          history = historiesQueueFind();

      if (history) {
        for (i = 0; i < history.messages.length; i++) {
          if ($scope.curDialog.messageID == history.messages[i].id) {
            found = true;
            break;
          }
        }
      }

      if (found) {
        $scope.historyUnread = {};
        $scope.$broadcast('messages_focus', $scope.curDialog.messageID);
        $scope.$broadcast('ui_history_change_scroll');
      } else {
        loadHistory();
      }
    }

    function showLessHistory () {
      if (!hasLess) {
        return;
      }
      if (moreActive) {
        lessPending = true;
        return;
      }
      lessPending = false;
      lessActive = true;

      var curJump = jump,
          curLessJump = ++lessJump,
          limit = 0,
          backLimit = 20;
      AppMessagesManager.getHistory($scope.curDialog.inputPeer, minID, limit, backLimit).then(function (historyResult) {
        lessActive = false;
        if (curJump != jump || curLessJump != lessJump) return;

        var i, id;
        for (i = historyResult.history.length - 1; i >= 0; i--) {
          id = historyResult.history[i];
          if (id > minID) {
            peerHistory.messages.push(AppMessagesManager.wrapForHistory(id));
          }
        }

        if (historyResult.history.length) {
          minID = historyResult.history.length >= backLimit
                    ? historyResult.history[0]
                    : 0;
          if (AppMessagesManager.regroupWrappedHistory(peerHistory.messages, -backLimit)) {
            $scope.$broadcast('messages_regroup');
          }
          delete $scope.state.empty;
          $scope.$broadcast('ui_history_append');
        } else {
          minID = 0;
        }
        $scope.skippedHistory = hasLess = minID > 0;

        if (morePending) {
          showMoreHistory();
        }
      });
    }

    function showMoreHistory () {
      if (!hasMore) {
        return;
      }
      if (lessActive) {
        morePending = true;
        return;
      }
      morePending = false;
      moreActive = true;

      var curJump = jump,
          curMoreJump = moreJump,
          inputMediaFilter = $scope.historyFilter.mediaType && {_: inputMediaFilters[$scope.historyFilter.mediaType]},
          limit = Config.Mobile ? 20 : 0,
          getMessagesPromise = inputMediaFilter
        ? AppMessagesManager.getSearch($scope.curDialog.inputPeer, '', inputMediaFilter, maxID, limit)
        : AppMessagesManager.getHistory($scope.curDialog.inputPeer, maxID, limit);

      getMessagesPromise.then(function (historyResult) {
        moreActive = false;
        if (curJump != jump || curMoreJump != moreJump) return;

        angular.forEach(historyResult.history, function (id) {
          peerHistory.messages.unshift(AppMessagesManager.wrapForHistory(id));
        });

        hasMore = historyResult.count === null ||
                  historyResult.history.length && peerHistory.messages.length < historyResult.count;

        if (historyResult.history.length) {
          delete $scope.state.empty;
          maxID = historyResult.history[historyResult.history.length - 1];
          $scope.$broadcast('ui_history_prepend');
          if (AppMessagesManager.regroupWrappedHistory(peerHistory.messages, historyResult.history.length + 1)) {
            $scope.$broadcast('messages_regroup');
          }
        }

        if (lessPending) {
          showLessHistory();
        }
      });
    };

    function loadHistory (forceRecent) {
      $scope.historyState.missedCount = 0;

      hasMore = false;
      $scope.skippedHistory = hasLess = false;
      maxID = 0;
      minID = 0;
      peerHistory = historiesQueuePush(peerID);


      var limit = 0, backLimit = 0;

      if ($scope.curDialog.messageID) {
        maxID = parseInt($scope.curDialog.messageID);
        limit = 10;
        backLimit = 10;
      }
      else if (forceRecent) {
        limit = 10;
      }

      moreActive = false;
      morePending = false;
      lessActive = false;
      lessPending = false;

      var prerenderedLen = peerHistory.messages.length;
      if (prerenderedLen && (maxID || backLimit)) {
        prerenderedLen = 0;
        peerHistory.messages = [];
      }

      var curJump = ++jump,
          inputMediaFilter = $scope.historyFilter.mediaType && {_: inputMediaFilters[$scope.historyFilter.mediaType]},
          getMessagesPromise = inputMediaFilter
        ? AppMessagesManager.getSearch($scope.curDialog.inputPeer, '', inputMediaFilter, maxID)
        : AppMessagesManager.getHistory($scope.curDialog.inputPeer, maxID, limit, backLimit, prerenderedLen);


      $scope.state.mayBeHasMore = true;
      getMessagesPromise.then(function (historyResult) {
        if (curJump != jump) return;

        var fetchedLength = historyResult.history.length;

        minID = (historyResult.unreadSkip || maxID && historyResult.history.indexOf(maxID) >= backLimit - 1)
                  ? historyResult.history[0]
                  : 0;
        maxID = historyResult.history[historyResult.history.length - 1];

        $scope.skippedHistory = hasLess = minID > 0;
        hasMore = historyResult.count === null ||
                  fetchedLength && fetchedLength < historyResult.count;

        updateHistoryPeer();
        safeReplaceObject($scope.state, {loaded: true, empty: !fetchedLength});

        peerHistory.messages = [];
        angular.forEach(historyResult.history, function (id) {
          var message = AppMessagesManager.wrapForHistory(id);
          if ($scope.skippedHistory) {
            delete message.unread;
          }
          if (historyResult.unreadOffset) {
            message.unreadAfter = true;
          }
          peerHistory.messages.push(message);
        });
        peerHistory.messages.reverse();

        if (AppMessagesManager.regroupWrappedHistory(peerHistory.messages)) {
          $scope.$broadcast('messages_regroup');
        }

        if (historyResult.unreadOffset) {
          $scope.historyUnreadAfter = historyResult.history[historyResult.unreadOffset - 1];
        }
        else if ($scope.historyUnreadAfter) {
          delete $scope.historyUnreadAfter;
        }
        $scope.$broadcast('messages_unread_after');
        onContentLoaded(function () {
          $scope.$broadcast('messages_focus', $scope.curDialog.messageID || 0);
        });
        $scope.$broadcast('ui_history_change');

        AppMessagesManager.readHistory($scope.curDialog.inputPeer);

      }, function () {
        safeReplaceObject($scope.state, {error: true});
      });
    }

    function showEmptyHistory () {
      jump++;
      safeReplaceObject($scope.historyPeer, {});
      safeReplaceObject($scope.state, {notSelected: true});
      peerHistory = false;
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

          for (i = 0; i < peerHistory.messages.length; i++) {
            if (peerHistory.messages[i].id == lastSelectID) {
              startPos = i;
              break;
            }
          }

          i = startPos;
          while (peerHistory.messages[i] &&
                 (curMessageID = peerHistory.messages[i].id) != messageID) {
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
      $scope.$broadcast('messages_select');
    }

    function selectedCancel (noBroadcast) {
      $scope.selectedMsgs = {};
      $scope.selectedCount = 0;
      $scope.historyState.selectActions = false;
      lastSelectID = false;
      if (!noBroadcast) {
        $scope.$broadcast('ui_panel_update');
      }
      $scope.$broadcast('messages_select');
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
        if (selectedMessageIDs.length) {
          ErrorService.confirm({type: 'MESSAGES_DELETE', count: selectedMessageIDs.length}).then(function () {
            AppMessagesManager.deleteMessages(selectedMessageIDs).then(function () {
              selectedCancel();
            });
          });
        }
      }
    }


    function selectedForward () {
      if ($scope.selectedCount > 0) {
        var selectedMessageIDs = [];
        angular.forEach($scope.selectedMsgs, function (t, messageID) {
          selectedMessageIDs.push(messageID);
        });

        PeersSelectService.selectPeers({confirm_type: 'FORWARD_PEER'}).then(function (peerStrings) {
          angular.forEach(peerStrings, function (peerString) {
            var peerID = AppPeersManager.getPeerID(peerString);
            AppMessagesManager.forwardMessages(peerID, selectedMessageIDs).then(function () {
              selectedCancel();
              if (peerStrings.length == 1) {
                $rootScope.$broadcast('history_focus', {peerString: peerString});
              }
            });
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
      peerHistory.messages = [];
      $scope.state.empty = true;
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
      var history = historiesQueueFind(addedMessage.peerID);
      if (!history) {
        return;
      }
      var curPeer = addedMessage.peerID == $scope.curDialog.peerID;
      if (curPeer) {
        if ($scope.historyFilter.mediaType || $scope.skippedHistory) {
          if (addedMessage.my) {
            returnToRecent();
          } else {
            $scope.historyState.missedCount++;
          }
          return;
        }
        delete $scope.state.empty;
      }
      // console.log('append', addedMessage);
      // console.trace();
      history.messages.push(AppMessagesManager.wrapForHistory(addedMessage.messageID));
      if (AppMessagesManager.regroupWrappedHistory(history.messages, -3)) {
        $scope.$broadcast('messages_regroup');
      }

      if (curPeer) {
        $scope.historyState.typing.splice(0, $scope.historyState.typing.length);
        $scope.$broadcast('ui_history_append_new', {my: addedMessage.my});
        if (addedMessage.my && $scope.historyUnreadAfter) {
          delete $scope.historyUnreadAfter;
          $scope.$broadcast('messages_unread_after');
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
      var history = historiesQueueFind(historyUpdate.peerID);
      if (!history) {
        return;
      }
      var newMessages = [],
          i;

      for (i = 0; i < history.messages.length; i++) {
        if (!historyUpdate.msgs[history.messages[i].id]) {
          newMessages.push(history.messages[i]);
        }
      };
      history.messages = newMessages;
      AppMessagesManager.regroupWrappedHistory(history.messages);
      $scope.$broadcast('messages_regroup');
      if (historyUpdate.peerID == $scope.curDialog.peerID) {
        $scope.state.empty = !newMessages.length;
      }
    });

    $scope.$on('dialog_flush', function (e, dialog) {
      var history = historiesQueueFind(dialog.peerID);
      if (history) {
        history.messages = [];
        if (dialog.peerID == $scope.curDialog.peerID) {
          $scope.state.empty = true;
        }
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
          AppUsersManager.forceUserOnline(update.user_id);
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

    $scope.draftMessage = {text: '', send: sendMessage};
    $scope.$watch('draftMessage.text', onMessageChange);
    $scope.$watch('draftMessage.files', onFilesSelected);

    function sendMessage (e) {
      $scope.$broadcast('ui_message_before_send');

      $timeout(function () {
        var text = $scope.draftMessage.text;

        if (angular.isString(text) && text.length > 0) {
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
        }

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
        action: {_: 'sendMessageTypingAction'}
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

  .controller('AppLangSelectController', function ($scope, _, Storage, ErrorService, AppRuntimeManager) {
    $scope.supportedLocales = Config.I18n.supported;
    $scope.langNames = Config.I18n.languages;
    $scope.curLocale = Config.I18n.locale;
    $scope.form = {locale: Config.I18n.locale};

    $scope.localeSelect = function localeSelect (newLocale) {
      newLocale = newLocale || $scope.form.locale;
      if ($scope.curLocale !== newLocale) {
        ErrorService.confirm({type: 'APPLY_LANG_WITH_RELOAD'}).then(function () {
          Storage.set({i18n_locale: newLocale}).then(function () {
            AppRuntimeManager.reload();
          });
        }, function () {
          $scope.form.locale = $scope.curLocale;
        });
      }
    };
  })

  .controller('AppFooterController', function ($scope, LayoutSwitchService) {
    $scope.switchLayout = function (mobile) {
      LayoutSwitchService.switchLayout(mobile);
    }
  })

  .controller('PhotoModalController', function ($q, $scope, $rootScope, $modalInstance, AppPhotosManager, AppMessagesManager, AppPeersManager, PeersSelectService, ErrorService) {

    $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);
    $scope.nav = {};

    $scope.download = function () {
      AppPhotosManager.downloadPhoto($scope.photoID);
    };

    if (!$scope.messageID) {
      return;
    }


    $scope.forward = function () {
      var messageID = $scope.messageID;
      PeersSelectService.selectPeers({confirm_type: 'FORWARD_PEER'}).then(function (peerStrings) {
        angular.forEach(peerStrings, function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          AppMessagesManager.forwardMessages(peerID, [messageID]).then(function () {
            if (peerStrings.length == 1) {
              $rootScope.$broadcast('history_focus', {peerString: peerString});
            }
          });
        });
      });
    };

    $scope.goToMessage = function () {
      var messageID = $scope.messageID;
      var peerID = AppMessagesManager.getMessagePeer(AppMessagesManager.getMessage(messageID));
      var peerString = AppPeersManager.getPeerString(peerID);
      $modalInstance.dismiss();
      $rootScope.$broadcast('history_focus', {peerString: peerString, messageID: messageID});
    };

    $scope['delete'] = function () {
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
        preloaded = {},
        maxID = $scope.messageID,
        hasMore = true;

    preloaded[$scope.messageID] = true;

    updatePrevNext();

    AppMessagesManager.getSearch(inputPeer, inputQuery, inputFilter, 0, 1000).then(function (searchCachedResult) {
      if (searchCachedResult.history.indexOf($scope.messageID) >= 0) {
        list = searchCachedResult.history;
        maxID = list[list.length - 1];

        updatePrevNext();
        preloadPhotos(+1);
      }
      loadMore();
    }, loadMore);


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

        var messageID = list[index];
        var message = AppMessagesManager.getMessage(messageID);
        if (!message ||
            !message.media ||
            !message.media.photo ||
            !message.media.photo.id) {
          console.error('Invalid photo message', index, list, messageID, message);
          return;
        }

        $scope.messageID = messageID;
        $scope.photoID = message.media.photo.id;
        $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);

        preloaded[$scope.messageID] = true;

        updatePrevNext();

        if (sign > 0 && hasMore && list.indexOf(messageID) + 1 >= list.length) {
          loadMore();
        } else {
          preloadPhotos(sign);
        }
      });
    };

    function preloadPhotos (sign) {
      // var preloadOffsets = sign < 0 ? [-1,-2,1,-3,2] : [1,2,-1,3,-2];
      var preloadOffsets = sign < 0 ? [-1,-2] : [1,2];
      var index = list.indexOf($scope.messageID);
      angular.forEach(preloadOffsets, function (offset) {
        var messageID = list[index + offset];
        if (messageID !== undefined && preloaded[messageID] === undefined) {
          preloaded[messageID] = true;
          var message = AppMessagesManager.getMessage(messageID);
          var photoID = message.media.photo.id;
          AppPhotosManager.preloadPhoto(photoID);
        }
      })
    }

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

        updatePrevNext(searchResult.count);
        loadingPromise = false;

        if (searchResult.history.length) {
          return $q.reject();
        }

        preloadPhotos(+1);
      });
    };

    function updatePrevNext (count) {
      var index = list.indexOf($scope.messageID);
      if (hasMore) {
        if (count) {
          $scope.count = Math.max(count, list.length);
        }
      } else {
        $scope.count = list.length;
      }
      $scope.pos = $scope.count - index;
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

  .controller('UserpicModalController', function ($q, $scope, $rootScope, $modalInstance, MtpApiManager, AppPhotosManager, AppUsersManager, AppPeersManager, AppMessagesManager, ApiUpdatesManager, PeersSelectService, ErrorService) {

    $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);
    $scope.photo.thumb = {
      location: AppPhotosManager.choosePhotoSize($scope.photo, 0, 0).location
    };

    $scope.nav = {};
    $scope.canForward = true;

    var inputUser = AppUsersManager.getUserInput($scope.userID),
        list = [$scope.photoID],
        maxID = $scope.photoID,
        preloaded = {},
        myID = 0,
        hasMore = true;

    updatePrevNext();

    AppPhotosManager.getUserPhotos(inputUser, 0, 1000).then(function (userpicCachedResult) {
      if (userpicCachedResult.photos.indexOf($scope.photoID) >= 0) {
        list = userpicCachedResult.photos;
        maxID = list[list.length - 1];
      }
      hasMore = list.length < userpicCachedResult.count;
      updatePrevNext();
    });

    MtpApiManager.getUserID().then(function (id) {
      myID = id;
      $scope.canDelete = $scope.photo.user_id == myID;
    });


    var jump = 0;
    function movePosition (sign, deleteCurrent) {
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
        $scope.photo.thumb = {
          location: AppPhotosManager.choosePhotoSize($scope.photo, 0, 0).location
        };

        var newCount;
        if (deleteCurrent) {
          list.splice(curIndex, 1);
          newCount = $scope.count - 1;
        }

        updatePrevNext(newCount);

        preloaded[$scope.photoID] = true;

        updatePrevNext();

        if (sign > 0 && hasMore && list.indexOf($scope.photoID) + 1 >= list.length) {
          loadMore();
        } else {
          preloadPhotos(sign);
        }
      });
    };

    function preloadPhotos (sign) {
      var preloadOffsets = sign < 0 ? [-1,-2] : [1,2];
      var index = list.indexOf($scope.photoID);
      angular.forEach(preloadOffsets, function (offset) {
        var photoID = list[index + offset];
        if (photoID !== undefined && preloaded[photoID] === undefined) {
          preloaded[photoID] = true;
          AppPhotosManager.preloadPhoto(photoID);
        }
      })
    }

    var loadingPromise = false;
    function loadMore () {
      if (loadingPromise) return loadingPromise;

      return loadingPromise = AppPhotosManager.getUserPhotos(inputUser, maxID).then(function (userpicResult) {
        if (userpicResult.photos.length) {
          maxID = userpicResult.photos[userpicResult.photos.length - 1];
          list = list.concat(userpicResult.photos);

          hasMore = list.length < userpicResult.count;
        } else {
          hasMore = false;
        }

        updatePrevNext(userpicResult.count);
        loadingPromise = false;

        if (userpicResult.photos.length) {
          return $q.reject();
        }

        preloadPhotos(+1);
      });
    };

    function updatePrevNext (count) {
      var index = list.indexOf($scope.photoID);
      if (hasMore) {
        if (count) {
          $scope.count = Math.max(count, list.length);
        }
      } else {
        $scope.count = list.length;
      }
      $scope.pos = $scope.count - index;
      $scope.nav.hasNext = index > 0;
      $scope.nav.hasPrev = hasMore || index < list.length - 1;
      $scope.canDelete = $scope.photo.user_id == myID;
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
      PeersSelectService.selectPeers({confirm_type: 'FORWARD_PEER'}).then(function (peerStrings) {
        angular.forEach(peerStrings, function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          AppMessagesManager.sendOther(peerID, {
            _: 'inputMediaPhoto',
            id: {
              _: 'inputPhoto',
              id: $scope.photoID,
              access_hash: $scope.photo.access_hash,
            }
          });
          if (peerStrings.length == 1) {
            $rootScope.$broadcast('history_focus', {peerString: peerStrings[0]});
          }
        });
      });
    };

    $scope['delete'] = function () {
      var photoID = $scope.photoID;
      var myUser = AppUsersManager.getUser(myID);
      var onDeleted = function () {
        if (!$scope.nav.hasNext && !$scope.nav.hasPrev) {
          return $modalInstance.dismiss();
        }
        movePosition($scope.nav.hasNext ? -1 : +1, true);
      };

      ErrorService.confirm({type: 'PHOTO_DELETE'}).then(function () {
        if (myUser && myUser.photo && myUser.photo.photo_id == photoID) {
          MtpApiManager.invokeApi('photos.updateProfilePhoto', {
            id: {_: 'inputPhotoEmpty'},
            crop: {_: 'inputPhotoCropAuto'}
          }).then(function (updateResult) {
            ApiUpdatesManager.processUpdateMessage({
              _: 'updateShort',
              update: {
                _: 'updateUserPhoto',
                user_id: myID,
                date: tsNow(true),
                photo: updateResult,
                previous: true
              }
            });
            onDeleted();
          });
        }
        else {
          MtpApiManager.invokeApi('photos.deletePhotos', {
            id: [{_: 'inputPhoto', id: photoID, access_hash: 0}]
          }).then(onDeleted);
        }
      });
    };

    $scope.download = function () {
      AppPhotosManager.downloadPhoto($scope.photoID);
    };

  })

  .controller('ChatpicModalController', function ($q, $scope, $rootScope, $modalInstance, MtpApiManager, AppPhotosManager, AppChatsManager, AppPeersManager, AppMessagesManager, PeersSelectService, ErrorService) {

    $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);
    $scope.photo.thumb = {
      location: AppPhotosManager.choosePhotoSize($scope.photo, 0, 0).location
    };

    $scope.canForward = true;
    $scope.canDelete = true;

    $scope.forward = function () {
      PeersSelectService.selectPeers({confirm_type: 'FORWARD_PEER'}).then(function (peerStrings) {
        angular.forEach(peerStrings, function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          AppMessagesManager.sendOther(peerID, {
            _: 'inputMediaPhoto',
            id: {
              _: 'inputPhoto',
              id: $scope.photoID,
              access_hash: $scope.photo.access_hash,
            }
          });
          if (peerStrings.length == 1) {
            $rootScope.$broadcast('history_focus', {peerString: peerStrings[0]});
          }
        });
      });
    };

    $scope['delete'] = function () {
      ErrorService.confirm({type: 'PHOTO_DELETE'}).then(function () {
        $scope.photo.updating = true;
        MtpApiManager.invokeApi('messages.editChatPhoto', {
          chat_id: $scope.chatID,
          photo: {_: 'inputChatPhotoEmpty'}
        }).then(function (updateResult) {
          AppMessagesManager.onStatedMessage(updateResult);
          $modalInstance.dismiss();
          $rootScope.$broadcast('history_focus', {peerString: AppChatsManager.getChatString($scope.chatID)});
        })['finally'](function () {
          $scope.photo.updating = false;
        });
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
      PeersSelectService.selectPeers({confirm_type: 'FORWARD_PEER'}).then(function (peerStrings) {
        angular.forEach(peerStrings, function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          AppMessagesManager.forwardMessages(peerID, [messageID]).then(function () {
            if (peerStrings.length == 1) {
              $rootScope.$broadcast('history_focus', {peerString: peerString});
            }
          });
        });
      });
    };

    $scope['delete'] = function () {
      var messageID = $scope.messageID;
      ErrorService.confirm({type: 'MESSAGE_DELETE'}).then(function () {
        AppMessagesManager.deleteMessages([messageID]);
      });
    };

    $scope.download = function () {
      AppVideoManager.saveVideoFile($scope.videoID);
    };

    $scope.$on('history_delete', function (e, historyUpdate) {
      if (historyUpdate.msgs[$scope.messageID]) {
        $modalInstance.dismiss();
      }
    });
  })

  .controller('DocumentModalController', function ($scope, $rootScope, $modalInstance, PeersSelectService, AppMessagesManager, AppDocsManager, AppPeersManager, ErrorService) {

    $scope.document = AppDocsManager.wrapForHistory($scope.docID);

    $scope.forward = function () {
      var messageID = $scope.messageID;
      PeersSelectService.selectPeers({confirm_type: 'FORWARD_PEER'}).then(function (peerStrings) {
        angular.forEach(peerStrings, function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          AppMessagesManager.forwardMessages(peerID, [messageID]).then(function () {
            if (peerStrings.length == 1) {
              $rootScope.$broadcast('history_focus', {peerString: peerString});
            }
          });
        });
      });
    };

    $scope['delete'] = function () {
      var messageID = $scope.messageID;
      ErrorService.confirm({type: 'MESSAGE_DELETE'}).then(function () {
        AppMessagesManager.deleteMessages([messageID]);
      });
    };

    $scope.download = function () {
      AppDocsManager.saveDocFile($scope.docID);
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
    $scope.blocked = false;

    $scope.settings = {notifications: true};

    MtpApiManager.invokeApi('users.getFullUser', {
      id: AppUsersManager.getUserInput($scope.userID)
    }).then(function (userFullResult) {
      if ($scope.override && $scope.override.phone_number) {
        userFullResult.user.phone = $scope.override.phone_number;
        if ($scope.override.first_name || $scope.override.last_name) {
          userFullResult.user.first_name = $scope.override.first_name;
          userFullResult.user.last_name = $scope.override.last_name;
        }
        AppUsersManager.saveApiUser(userFullResult.user);
      } else {
        AppUsersManager.saveApiUser(userFullResult.user, true);
      }
      AppPhotosManager.savePhoto(userFullResult.profile_photo);
      $scope.blocked = userFullResult.blocked;

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
        templateUrl: templateUrl(edit ? 'edit_contact_modal' : 'import_contact_modal'),
        controller: 'ImportContactModalController',
        windowClass: 'md_simple_modal_window mobile_modal',
        scope: scope
      }).result.then(function (foundUserID) {
        if ($scope.userID == foundUserID) {
          $scope.user = AppUsersManager.getUser($scope.userID);
        }
      });
    };

    $scope.deleteContact = function () {
      AppUsersManager.deleteContacts([$scope.userID]).then(function () {
        $scope.user = AppUsersManager.getUser($scope.userID);
      });
    };

    $scope.toggleBlock = function (block) {
      MtpApiManager.invokeApi(block ? 'contacts.block' : 'contacts.unblock', {
        id: AppUsersManager.getUserInput($scope.userID)
      }).then(function () {
        $scope.blocked = block;
      });
    };

    $scope.shareContact = function () {
      PeersSelectService.selectPeers({confirm_type: 'SHARE_CONTACT_PEER'}).then(function (peerStrings) {
        angular.forEach(peerStrings, function (peerString) {
          var peerID = AppPeersManager.getPeerID(peerString);
          AppMessagesManager.sendOther(peerID, {
            _: 'inputMediaContact',
            phone_number: $scope.user.phone,
            first_name: $scope.user.first_name,
            last_name: $scope.user.last_name,
            user_id: $scope.user.id
          });
          if (peerStrings.length == 1) {
            $rootScope.$broadcast('history_focus', {peerString: peerStrings[0]});
          }
        });
      });
    }

  })

  .controller('ChatModalController', function ($scope, $timeout, $rootScope, $modal, AppUsersManager, AppChatsManager, AppPhotosManager, MtpApiManager, MtpApiFileManager, NotificationsManager, AppMessagesManager, AppPeersManager, ApiUpdatesManager, ContactsSelectService, ErrorService) {

    $scope.chatFull = AppChatsManager.wrapForFull($scope.chatID, {});

    MtpApiManager.invokeApi('messages.getFullChat', {
      chat_id: $scope.chatID
    }).then(function (result) {
      AppChatsManager.saveApiChats(result.chats);
      AppUsersManager.saveApiUsers(result.users);
      if (result.full_chat && result.full_chat.chat_photo.id) {
        AppPhotosManager.savePhoto(result.full_chat.chat_photo);
      }

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
      AppMessagesManager.onStatedMessage(statedMessage);
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
            user_id: AppUsersManager.getUserInput(userID),
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
        templateUrl: templateUrl('chat_edit_modal'),
        controller: 'ChatEditModalController',
        scope: scope,
        windowClass: 'md_simple_modal_window mobile_modal'
      });
    }

  })

  .controller('SettingsModalController', function ($rootScope, $scope, $timeout, $modal, AppUsersManager, AppChatsManager, AppPhotosManager, MtpApiManager, Storage, NotificationsManager, MtpApiFileManager, ApiUpdatesManager, ChangelogNotifyService, AppRuntimeManager, ErrorService, _) {

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
    });

    $scope.notify = {volume: 0.5};
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
          AppPhotosManager.savePhoto(updateResult.photo);
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
        delete $scope.photo.updating;
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
        templateUrl: templateUrl('profile_edit_modal'),
        controller: 'ProfileEditModalController',
        windowClass: 'md_simple_modal_window mobile_modal'
      });
    };

    $scope.changeUsername = function () {
      $modal.open({
        templateUrl: templateUrl('username_edit_modal'),
        controller: 'UsernameEditModalController',
        windowClass: 'md_simple_modal_window mobile_modal'
      });
    };

    $scope.terminateSessions = function () {
      ErrorService.confirm({type: 'TERMINATE_SESSIONS'}).then(function () {
        MtpApiManager.invokeApi('auth.resetAuthorizations', {});
      });
    };

    Storage.get('notify_nodesktop', 'notify_nosound', 'send_ctrlenter', 'notify_volume', 'notify_novibrate').then(function (settings) {
      $scope.notify.desktop = !settings[0];
      $scope.send.enter = settings[2] ? '' : '1';

      if (settings[1]) {
        $scope.notify.volume = 0;
      } else if (settings[3] !== false) {
        $scope.notify.volume = settings[3] > 0 && settings[3] <= 1.0 ? settings[3] : 0;
      } else {
        $scope.notify.volume = 0.5;
      }

      $scope.notify.canVibrate = NotificationsManager.getVibrateSupport();
      $scope.notify.vibrate = !settings[4];

      $scope.notify.volumeOf4 = function () {
        return 1 + Math.ceil(($scope.notify.volume - 0.1) / 0.33);
      };

      $scope.toggleSound = function () {
        if ($scope.notify.volume) {
          $scope.notify.volume = 0;
        } else {
          $scope.notify.volume = 0.5;
        }
      }

      var testSoundPromise;
      $scope.$watch('notify.volume', function (newValue, oldValue) {
        if (newValue !== oldValue) {
          Storage.set({notify_volume: newValue});
          Storage.remove('notify_nosound');
          NotificationsManager.clear();

          if (testSoundPromise) {
            $timeout.cancel(testSoundPromise);
          }
          testSoundPromise = $timeout(function () {
            NotificationsManager.testSound(newValue);
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

      $scope.toggleVibrate = function () {
        $scope.notify.vibrate = !$scope.notify.vibrate;

        if ($scope.notify.vibrate) {
          Storage.remove('notify_novibrate');
        } else {
          Storage.set({notify_novibrate: true});
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
    };

    $scope.logOut = function () {
      ErrorService.confirm({type: 'LOGOUT'}).then(function () {
        MtpApiManager.logOut().then(function () {
          location.hash = '/login';
          AppRuntimeManager.reload();
        });
      })
    };
  })

  .controller('ChangelogModalController', function ($scope, $modal) {

    $scope.currentVersion = Config.App.version;
    if (!$scope.lastVersion) {
      var versionParts = $scope.currentVersion.split('.');
      $scope.lastVersion = versionParts[0] + '.' + versionParts[1] + '.' + Math.max(0, versionParts[2] - 1);
    }

    $scope.changelogHidden = false;
    $scope.changelogShown = false;

    $scope.canShowVersion = function (curVersion) {
      if ($scope.changelogShown) {
        return true;
      }

      var show = versionCompare(curVersion, $scope.lastVersion) >= 0;
      if (!show) {
        $scope.changelogHidden = true;
      }

      return show;
    };

    $scope.showAllVersions = function () {
      $scope.changelogShown = true;
      $scope.changelogHidden = false;
      $scope.$emit('ui_height');
      $scope.$broadcast('ui_height');
    };

    $scope.changeUsername = function () {
      $modal.open({
        templateUrl: templateUrl('username_edit_modal'),
        controller: 'UsernameEditModalController',
        windowClass: 'md_simple_modal_window mobile_modal'
      });
    };
  })

  .controller('ProfileEditModalController', function ($scope,  $modalInstance, AppUsersManager, MtpApiManager) {

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

  .controller('UsernameEditModalController', function ($scope,  $modalInstance, AppUsersManager, MtpApiManager) {

    $scope.profile = {};
    $scope.error = {};

    MtpApiManager.getUserID().then(function (id) {
      $scope.profile = angular.copy(AppUsersManager.getUser(id));
    });

    $scope.updateUsername = function () {
      $scope.profile.updating = true;

      MtpApiManager.invokeApi('account.updateUsername', {
        username: $scope.profile.username || ''
      }).then(function (user) {
        $scope.checked = {};
        AppUsersManager.saveApiUser(user);
        $modalInstance.close();
      }, function (error) {
        if (error.type == 'USERNAME_NOT_MODIFIED') {
          error.handled = true;
          $modalInstance.close();
        }
      })['finally'](function () {
        delete $scope.profile.updating;
      });
    }

    $scope.$watch('profile.username', function (newVal) {
      if (!newVal.length) {
        $scope.checked = {};
        return;
      }
      MtpApiManager.invokeApi('account.checkUsername', {
        username: newVal || ''
      }).then(function (valid) {
        if ($scope.profile.username != newVal) {
          return;
        }
        if (valid) {
          $scope.checked = {success: true};
        } else {
          $scope.checked = {error: true};
        }
      }, function (error) {
        if ($scope.profile.username != newVal) {
          return;
        }
        switch (error.type) {
          case 'USERNAME_INVALID':
            $scope.checked = {error: true};
            error.handled = true;
            break;
        }
      });
    })
  })

  .controller('ContactsModalController', function ($scope, $timeout, $modal, $modalInstance, MtpApiManager, AppUsersManager, ErrorService) {

    $scope.contacts = [];
    $scope.foundUsers = [];
    $scope.search = {};
    $scope.slice = {limit: 20, limitDelta: 20};

    var jump = 0;

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
      var curJump = ++jump;
      var doneIDs = [];
      AppUsersManager.getContacts(query).then(function (contactsList) {
        if (curJump != jump) return;
        $scope.contacts = [];
        $scope.slice.limit = 20;

        angular.forEach(contactsList, function(userID) {
          var contact = {
            userID: userID,
            user: AppUsersManager.getUser(userID),
            userPhoto: AppUsersManager.getUserPhoto(userID, 'User')
          }
          doneIDs.push(userID);
          $scope.contacts.push(contact);
        });
        $scope.contactsEmpty = query ? false : !$scope.contacts.length;
        $scope.$broadcast('contacts_change');
      });

      if (query && query.length >= 5) {
        $timeout(function() {
          if (curJump != jump) return;
          MtpApiManager.invokeApi('contacts.search', {q: query, limit: 10}).then(function (result) {
            AppUsersManager.saveApiUsers(result.users);
            if (curJump != jump) return;
            angular.forEach(result.results, function(contactFound) {
              var userID = contactFound.user_id;
              if (doneIDs.indexOf(userID) != -1) return;
              $scope.contacts.push({
                userID: userID,
                user: AppUsersManager.getUser(userID),
                peerString: AppUsersManager.getUserString(userID),
                found: true
              });
            });
          }, function (error) {
            if (error.code == 400) {
              error.handled = true;
            }
          });
        }, 500);
      }
    };

    $scope.$watch('search.query', updateContacts);
    $scope.$on('contacts_update', function () {
      updateContacts($scope.search && $scope.search.query || '');
    });

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
          $scope.toggleEdit(false);
        });
      }
    };

    $scope.importContact = function () {
      AppUsersManager.openImportContact();
    };

  })

  .controller('PeerSelectController', function ($scope, $modalInstance, $q, AppPeersManager, ErrorService) {

    $scope.selectedPeers = {};
    $scope.selectedPeerIDs = [];
    $scope.selectedCount = 0;

    $scope.dialogSelect = function (peerString) {
      if (!$scope.multiSelect) {
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
        return;
      }

      var peerID = AppPeersManager.getPeerID(peerString);
      if ($scope.selectedPeers[peerID]) {
        delete $scope.selectedPeers[peerID];
        $scope.selectedCount--;
        var pos = $scope.selectedPeerIDs.indexOf(peerID);
        if (pos >= 0) {
          $scope.selectedPeerIDs.splice(pos, 1);
        }
      } else {
        $scope.selectedPeers[peerID] = AppPeersManager.getPeer(peerID);
        $scope.selectedCount++;
        $scope.selectedPeerIDs.unshift(peerID);
      }
    };

    $scope.submitSelected = function () {
      if ($scope.selectedCount > 0) {
        var selectedPeerStrings = [];
        angular.forEach($scope.selectedPeers, function (t, peerID) {
          selectedPeerStrings.push(AppPeersManager.getPeerString(peerID));
        });
        return $modalInstance.close(selectedPeerStrings);
      }
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
        inputUsers.push(AppUsersManager.getUserInput(userID));
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

  .controller('CountrySelectModalController', function ($scope, $modalInstance, $rootScope, SearchIndexManager, _) {

    $scope.search = {};
    $scope.slice = {limit: 20, limitDelta: 20}

    var searchIndex = SearchIndexManager.createIndex();

    for (var i = 0; i < Config.CountryCodes.length; i++) {
      var searchString = Config.CountryCodes[i][0];
      searchString += ' ' + _(Config.CountryCodes[i][1] + '_raw');
      searchString += ' ' + Config.CountryCodes[i].slice(2).join(' ');
      SearchIndexManager.indexObject(i, searchString, searchIndex);
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
          for (j = 2; j < Config.CountryCodes[i].length; j++) {
            $scope.countries.push({name: _(Config.CountryCodes[i][1] + '_raw'), code: Config.CountryCodes[i][j]});
          }
        }
      }
      if (String.prototype.localeCompare) {
        $scope.countries.sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
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
