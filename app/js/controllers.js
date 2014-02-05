/*!
 * Webogram v0.1 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Controllers */

angular.module('myApp.controllers', [])

  .controller('AppWelcomeController', function($scope, $location, MtpApiManager) {
    MtpApiManager.getUserID().then(function (id) {
      if (id) {
        $location.url('/im');
      } else {
        $scope.showWelcome = true;
      }
    });
  })

  .controller('AppLoginController', function ($scope, $location, $timeout, MtpApiManager, ErrorService) {
    var options = {dcID: 1};

    $scope.credentials = {};
    $scope.progress = {};
    $scope.callPending = {};

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
          phone_number: $scope.credentials.phone_number,
          phone_code_hash: $scope.credentials.phone_code_hash
        }).then(function () {
          $scope.callPending.success = true;
        });
      } else {
        callTimeout = $timeout(callCheck, 1000);
      }
    }

    $scope.sendCode = function () {
      $timeout.cancel(callTimeout);
      $scope.progress.enabled = true;
      MtpApiManager.invokeApi('auth.checkPhone', {
        phone_number: $scope.credentials.phone_number
      }, options).then(function (result) {
        $scope.progress.enabled = false;
        if (!result.phone_registered) {
          ErrorService.showSimpleError('No account', 'Sorry, there is no Telegram account for ' + $scope.credentials.phone_number + '. Please sign up using our mobile apps.');
          return false;
        }

        $scope.progress.enabled = true;
        MtpApiManager.invokeApi('auth.sendCode', {
          phone_number: $scope.credentials.phone_number,
          sms_type: 0,
          api_id: 2496,
          api_hash: '8da85b0d5bfe62527e5b244c209159c3'
        }, options).then(function (sentCode) {
          $scope.progress.enabled = false;

          $scope.credentials.phone_code_hash = sentCode.phone_code_hash;
          $scope.credentials.phone_occupied = sentCode.phone_registered;
          $scope.error = {};

          $scope.callPending.remaining = 60;
          callCheck();

        }, function (error) {
          $scope.progress.enabled = false;
          console.log('sendCode error', error);
          switch (error.type) {
            case 'PHONE_NUMBER_INVALID':
              $scope.error = {field: 'phone'};
              break;
          }
        });
      }, function (error) {
        $scope.progress.enabled = false;
        switch (error.type) {
          case 'PHONE_NUMBER_INVALID':
            $scope.error = {field: 'phone'};
            break;

          default:
            ErrorService.showSimpleError('Unknown error occured', 'Please check your internet connection or install the latest version of Google Chrome browser.');
        }
      });
    }

    $scope.logIn = function (forceSignUp) {
      var method = 'auth.signIn', params = {
        phone_number: $scope.credentials.phone_number,
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
          return $scope.logIn(true);
        } else if (error.code == 400 && error.type == 'PHONE_NUMBER_OCCUPIED') {
          return $scope.logIn(false);
        }


        switch (error.type) {
          case 'FIRSTNAME_INVALID':
            $scope.error = {field: 'first_name'};
            break;
          case 'LASTNAME_INVALID':
            $scope.error = {field: 'last_name'};
            break;
          case 'PHONE_CODE_INVALID':
            $scope.error = {field: 'phone_code'};
            break;
        }
      });

    };
  })

  .controller('AppIMController', function ($scope, $location, $routeParams, $modal, $rootScope, $modalStack, MtpApiManager) {

    $scope.$on('$routeUpdate', updateCurDialog);

    $scope.$on('history_focus', function (e, peerData) {
      $modalStack.dismissAll();
      if (peerData.peerString == $scope.curDialog.peer) {
        $scope.$broadcast('ui_history_focus');
      } else {
        $location.url('/im?p=' + peerData.peerString);
      }
    });


    $scope.isLoggedIn = true;
    $scope.openSettings = function () {
      $modal.open({
        templateUrl: 'partials/settings_modal.html?2',
        controller: 'SettingsModalController',
        scope: $rootScope.$new(),
        windowClass: 'settings_modal_window'
      });
    }

    updateCurDialog();

    function updateCurDialog() {
      $scope.curDialog = {
        peer: $routeParams.p || false
      };
    }
  })

  .controller('AppImDialogsController', function ($scope, $location, MtpApiManager, AppUsersManager, AppChatsManager, AppMessagesManager, AppPeersManager) {

    // console.log('init controller');

    $scope.dialogs = [];
    $scope.search = {};

    var offset = 0,
        maxID = 0,
        hasMore = false,
        startLimit = 20,
        limit = 100;

    MtpApiManager.invokeApi('account.updateStatus', {offline: false});
    $scope.$on('dialogs_need_more', function () {
      // console.log('on need more');
      showMoreDialogs();
    });

    $scope.$on('dialog_unread', function (e, dialog) {
      angular.forEach($scope.dialogs, function(curDialog) {
        if (curDialog.peerID == dialog.peerID) {
          curDialog.unreadCount = dialog.unread_count;
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
        // wrappedDialog = angular.extend(prev[0], wrappedDialog);
        offset++;
      }
      $scope.dialogs.unshift(wrappedDialog);
    });

    $scope.$watch('search.query', loadDialogs);

    function loadDialogs () {
      offset = 0;
      maxID = 0;
      hasMore = false;

      AppMessagesManager.getDialogs($scope.search.query, maxID, startLimit).then(function (dialogsResult) {
        $scope.dialogs = [];

        if (dialogsResult.dialogs.length) {
          offset += startLimit;

          maxID = dialogsResult.dialogs[dialogsResult.dialogs.length - 1].top_message;
          hasMore = offset < dialogsResult.count;

          angular.forEach(dialogsResult.dialogs, function (dialog) {
            $scope.dialogs.push(AppMessagesManager.wrapForDialog(dialog.top_message, dialog.unread_count));
          });
        }

        $scope.$broadcast('ui_dialogs_change');

        if (!$scope.search.query) {
          AppMessagesManager.getDialogs('', maxID, limit);
        }

      }, function (error) {
        if (error.code == 401) {
          $location.url('/login');
        }
      });
    }

    function showMoreDialogs () {
      if (!hasMore || !offset) {
        return;
      }

      AppMessagesManager.getDialogs($scope.search.query, maxID, limit).then(function (dialogsResult) {
        offset += limit;
        maxID = dialogsResult.dialogs[dialogsResult.dialogs.length - 1].top_message;
        hasMore = offset < dialogsResult.count;

        angular.forEach(dialogsResult.dialogs, function (dialog) {
          $scope.dialogs.push(AppMessagesManager.wrapForDialog(dialog.top_message, dialog.unread_count));
        });

        $scope.$broadcast('ui_dialogs_append');
      });
    }

  })

  .controller('AppImHistoryController', function ($scope, $location, $timeout, $rootScope, MtpApiManager, AppUsersManager, AppChatsManager, AppMessagesManager, AppPeersManager, ApiUpdatesManager, IdleManager, StatusManager) {

    $scope.$watch('curDialog.peer', applyDialogSelect);

    ApiUpdatesManager.attach();

    IdleManager.start();
    StatusManager.start();

    $scope.history = [];
    $scope.typing = {};

    var peerID,
        offset = 0,
        hasMore = false,
        maxID = 0,
        startLimit = 20,
        limit = 50;

    function applyDialogSelect (newPeer) {
      newPeer = newPeer || $scope.curDialog.peer || '';

      peerID = AppPeersManager.getPeerID(newPeer);

      $scope.curDialog.peerID = peerID;
      $scope.curDialog.inputPeer = AppPeersManager.getInputPeer(newPeer);

      if (peerID) {
        updateHistoryPeer(true);
        loadHistory(peerID);
      } else {
        showEmptyHistory();
      }
    }

    function updateHistoryPeer(preload) {
      var peerData = AppPeersManager.getPeer(peerID);
      // console.log('update', preload, peerData);
      if (!peerData || peerData.deleted) {
        return false;
      }

      $scope.history = [];

      $scope.historyPeer = {
        id: peerID,
        data: peerData,
        photo: AppPeersManager.getPeerPhoto(peerID, 'User', 'Group')
      };

      MtpApiManager.getUserID().then(function (id) {
        $scope.ownPhoto = AppUsersManager.getUserPhoto(id, 'User');
      });

      if (preload) {
        $scope.typing = {};
        $scope.state = {loaded: true};
        $scope.$broadcast('ui_peer_change');
        $scope.$broadcast('ui_history_change');
      }
    }

    function showMoreHistory () {
      if (!hasMore || !offset) {
        return;
      }

      // console.trace('load history');
      AppMessagesManager.getHistory($scope.curDialog.inputPeer, maxID, limit).then(function (historyResult) {
        offset += limit;
        hasMore = offset < historyResult.count;
        maxID = historyResult.history[historyResult.history.length - 1];

        angular.forEach(historyResult.history, function (id) {
          $scope.history.unshift(AppMessagesManager.wrapForHistory(id));
        });

        $scope.$broadcast('ui_history_prepend');
      }, function () {
        $scope.state = {error: true};
      });
    }

    function loadHistory () {
      hasMore = false;
      offset = 0;
      maxID = 0;

      AppMessagesManager.getHistory($scope.curDialog.inputPeer, maxID, startLimit).then(function (historyResult) {
        offset += startLimit;
        hasMore = offset < historyResult.count;
        maxID = historyResult.history[historyResult.history.length - 1];

        updateHistoryPeer();
        angular.forEach(historyResult.history, function (id) {
          $scope.history.push(AppMessagesManager.wrapForHistory(id));
        });
        $scope.history.reverse();

        $scope.state = {loaded: true};

        $scope.$broadcast('ui_history_change');

        AppMessagesManager.readHistory($scope.curDialog.inputPeer);

      }, function () {
        $scope.state = {error: true};
      });
    }

    function showEmptyHistory () {
      $scope.state = {notSelected: true};
      $scope.history = [];

      $scope.$broadcast('ui_history_change');
    }



    var typingTimeouts = {};

    $scope.$on('history_update', angular.noop);

    $scope.$on('history_append', function (e, addedMessage) {
      if (addedMessage.peerID == $scope.curDialog.peerID) {
        // console.log('append', addedMessage);
        // console.trace();
        $scope.history.push(AppMessagesManager.wrapForHistory(addedMessage.messageID));
        $scope.typing = {};
        $scope.$broadcast('ui_history_append', {my: addedMessage.my});
        offset++;

        // console.log('append check', $rootScope.idle.isIDLE, addedMessage.peerID, $scope.curDialog.peerID);
        if (!$rootScope.idle.isIDLE) {
          $timeout(function () {
            AppMessagesManager.readHistory($scope.curDialog.inputPeer);
          });
        }
      }
    });

    $scope.$on('apiUpdate', function (e, update) {
      // console.log('on apiUpdate inline', update);
      switch (update._) {
        case 'updateUserTyping':
          if (update.user_id == $scope.curDialog.peerID && AppUsersManager.hasUser(update.user_id)) {
            $scope.typing = {user: AppUsersManager.getUser(update.user_id)};

            $timeout.cancel(typingTimeouts[update.user_id]);

            typingTimeouts[update.user_id] = $timeout(function () {
              $scope.typing = {};
            }, 6000);
          }
          break;

        case 'updateChatUserTyping':
          if (-update.chat_id == $scope.curDialog.peerID && AppUsersManager.hasUser(update.user_id)) {
            $scope.typing = {user: AppUsersManager.getUser(update.user_id)};

            $timeout.cancel(typingTimeouts[update.user_id]);

            typingTimeouts[update.user_id] = $timeout(function () {
              $scope.typing = {};
            }, 6000);
          }
          break;
      }
    });

    $scope.$on('history_need_more', function () {
      showMoreHistory();
    });

    $rootScope.$watch('idle.isIDLE', function (newVal) {
      if (!newVal && $scope.curDialog && $scope.curDialog.peerID) {
        AppMessagesManager.readHistory($scope.curDialog.inputPeer);
      }
    });

  })

  .controller('AppImPanelController', function($scope) {
    $scope.$on('user_update', angular.noop);
  })

  .controller('AppImSendController', function ($scope, $timeout, MtpApiManager, AppConfigManager, AppPeersManager, AppMessagesManager, ApiUpdatesManager, MtpApiFileManager) {

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

        if (!text.length) {
          return false;
        }

        text = text.replace(/:([a-z0-9\-\+\*_]+?):/gi, function (all, name) {
          var utfChar = $.emojiarea.reverseIcons[name];
          if (utfChar !== undefined) {
            return utfChar;
          }
          return all;
        });

        do {
          AppMessagesManager.sendText($scope.curDialog.peerID, text.substr(0, 4096));
          text = text.substr(4096);
        } while (text.length);

        resetDraft();
        $scope.$broadcast('ui_message_send');
      });

      return cancelEvent(e);
    }


    function resetDraft (newPeer) {
      if (newPeer) {
        AppConfigManager.get('draft' + $scope.curDialog.peerID).then(function (draftText) {
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
      AppMessagesManager.readHistory($scope.curDialog.inputPeer);

      if (newVal.length) {
        var backupDraftObj = {};
        backupDraftObj['draft' + $scope.curDialog.peerID] = newVal;
        AppConfigManager.set(backupDraftObj);
        // console.log('draft save', backupDraftObj);
      } else {
        AppConfigManager.remove('draft' + $scope.curDialog.peerID);
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

  .controller('PhotoModalController', function ($scope, AppPhotosManager) {
    $scope.photo = AppPhotosManager.wrapForFull($scope.photoID);
  })

  .controller('VideoModalController', function ($scope, AppVideoManager) {
    $scope.video = AppVideoManager.wrapForFull($scope.videoID);
  })

  .controller('UserModalController', function ($scope, $location, $rootScope, $modalStack, AppUsersManager) {
    $scope.user = AppUsersManager.wrapForFull($scope.userID);
    $scope.goToHistory = function () {
      $rootScope.$broadcast('history_focus', {peerString: $scope.user.peerString});
    };
  })

  .controller('ChatModalController', function ($scope, $timeout, AppUsersManager, AppChatsManager, MtpApiManager) {
    $scope.chatFull = AppChatsManager.wrapForFull($scope.chatID, {});

    MtpApiManager.invokeApi('messages.getFullChat', {
      chat_id: $scope.chatID
    }).then(function (result) {
      AppChatsManager.saveApiChats(result.chats);
      AppUsersManager.saveApiUsers(result.users);

      $scope.chatFull = AppChatsManager.wrapForFull($scope.chatID, result.full_chat);
    });
  })

  .controller('SettingsModalController', function ($rootScope, $scope, $timeout, AppUsersManager, AppChatsManager, MtpApiManager, AppConfigManager, NotificationsManager) {

    $scope.profile = {};

    MtpApiManager.getUserID().then(function (id) {
      var user = AppUsersManager.getUser(id);
      $scope.profile.first_name = user.first_name;
      $scope.profile.last_name = user.last_name;

      $scope.phone = user.phone;
    });

    $scope.notify = {};
    $scope.send = {};

    AppConfigManager.get('notify_nodesktop', 'notify_nosound', 'send_ctrlenter').then(function (settings) {
      $scope.notify.desktop = !settings[0];
      $scope.notify.sound = !settings[1];
      $scope.send.enter = settings[2] ? '' : '1';
    });

    $scope.$watch('notify.sound', function(newValue) {
      if (newValue) {
        AppConfigManager.remove('notify_nosound');
      } else {
        AppConfigManager.set({notify_nosound: true});
        NotificationsManager.clear();
      }
    });

    $scope.$watch('notify.desktop', function(newValue) {
      if (newValue) {
        AppConfigManager.remove('notify_nodesktop');
      } else {
        AppConfigManager.set({notify_nodesktop: true});
      }
    });

    $scope.$watch('send.enter', function(newValue) {
      if (newValue) {
        AppConfigManager.remove('send_ctrlenter');
      } else {
        AppConfigManager.set({send_ctrlenter: true});
      }
      $rootScope.$broadcast('settings_changed');
    });

    $scope.error = {};
    $scope.save = function () {
      MtpApiManager.invokeApi('account.updateProfile', {
        first_name: $scope.profile.first_name || '',
        last_name: $scope.profile.last_name || ''
      }).then(function (user) {
        $scope.error = {};
        AppUsersManager.saveApiUser(user);
      }, function (error) {
        switch (error.type) {
          case 'FIRSTNAME_INVALID':
            $scope.error = {field: 'first_name'};
            break;

          case 'LASTNAME_INVALID':
            $scope.error = {field: 'last_name'};
            break;

          case 'NAME_NOT_MODIFIED':
            $scope.error = {};
            break;
        }
      });
    }

    $scope.logOut = function () {
      MtpApiManager.logOut().then(function () {
        location.hash = '/login';
        location.reload();
      });
    }
  })



