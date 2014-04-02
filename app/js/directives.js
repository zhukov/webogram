/*!
 * Webogram v0.0.21 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Directives */


angular.module('myApp.directives', ['myApp.filters'])
  .directive('myDialog', function() {
    return {
      restrict: 'AE',
      scope: true,
      translude: false,
      templateUrl: 'partials/dialog.html'
    };
  })

  .directive('myMessage', function() {
    return {
      restrict: 'AE',
      scope: true,
      translude: false,
      templateUrl: 'partials/message.html'
    };
  })

  .directive('myDialogsList', function($window, $timeout) {

    return {
      link: link
    };


    function link ($scope, element, attrs) {
      var dialogsWrap = $('.im_dialogs_wrap', element)[0],
          scrollableWrap = $('.im_dialogs_scrollable_wrap', element)[0],
          headWrap = $('.tg_page_head')[0],
          footer = $('.im_page_footer')[0],
          moreNotified = false;

      onContentLoaded(function () {
        $(dialogsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
      });

      var updateScroller = function () {
        onContentLoaded(function () {
          $(dialogsWrap).nanoScroller();
        });
      }

      $scope.$on('ui_dialogs_prepend', updateScroller);


      $scope.$on('ui_dialogs_append', function () {
        onContentLoaded(function () {
          updateScroller();
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          updateScroller();
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $(scrollableWrap).on('scroll', function (e) {
        // console.log('scroll', moreNotified);
        if (!moreNotified && scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          // console.log('emit need more');
          $scope.$emit('dialogs_need_more');
          moreNotified = true;
        }
      });


      function updateSizes () {
        if (attrs.modal) {
          $(element).css({
            height: $($window).height() - 200
          });
          updateScroller();
          return;
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0];
        }
        if (!footer || !footer.offsetHeight) {
          footer = $('.im_page_footer')[0];
        }
        $(element).css({
          height: $($window).height() - footer.offsetHeight - (headWrap ? headWrap.offsetHeight : 44) - 72
        });

        updateScroller();
      }

      $($window).on('resize', updateSizes);

      updateSizes();
      setTimeout(updateSizes, 1000);
    };

  })

  .directive('myContactsList', function($window, $timeout) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var searchWrap = $('.contacts_modal_search')[0],
          panelWrap = $('.contacts_modal_panel')[0],
          contactsWrap = $('.contacts_wrap', element)[0];

      onContentLoaded(function () {
        $(contactsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
        updateSizes();
      });

      function updateSizes () {
        $(element).css({
          height: $($window).height() - (panelWrap && panelWrap.offsetHeight || 0) - (searchWrap && searchWrap.offsetHeight || 0) - 200
        });
        $(contactsWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);
      $scope.$on('contacts_change', function () {
        onContentLoaded(updateSizes)
      });
    };

  })

  .directive('myHistory', function ($window, $timeout, $transition) {

    return {
      link: link
    };

    function link ($scope, element, attrs) {
      var historyWrap = $('.im_history_wrap', element)[0],
          historyMessagesEl = $('.im_history_messages', element)[0],
          historyEl = $('.im_history', element)[0],
          scrollableWrap = $('.im_history_scrollable_wrap', element)[0],
          scrollable = $('.im_history_scrollable', element)[0],
          panelWrap = $('.im_history_panel_wrap', element)[0],
          bottomPanelWrap = $('.im_bottom_panel_wrap', element)[0],
          sendFormWrap = $('.im_send_form_wrap', element)[0],
          headWrap = $('.tg_page_head')[0],
          footer = $('.im_page_footer')[0],
          sendForm = $('.im_send_form', element)[0],
          moreNotified = false;

      onContentLoaded(function () {
        scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
        $(historyWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1, iOSNativeScrolling: true});
      });

      var updateScroller = function (delay) {
        $timeout(function () {
          if (!$(scrollableWrap).hasClass('im_history_to_bottom')) {
            $(historyWrap).nanoScroller();
          }
        }, delay || 0);
      }

      var transform = false,
          trs = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'OTransform'],
          i;
      for (i = 0; i < trs.length; i++) {
        if (trs[i] in historyMessagesEl.style) {
          transform = trs[i];
          break;
        }
      }

      var animated = transform ? true : false,
          curAnimation = false;

      $scope.$on('ui_history_append', function (e, options) {
        if (!atBottom && !options.my) {
          return;
        }
        if (!animated) {
          $(scrollable).css({bottom: 0});
          $(scrollableWrap).addClass('im_history_to_bottom');
        }

        var wasH = scrollableWrap.scrollHeight;
        onContentLoaded(function () {
          if (animated) {
            curAnimation = true;
            $(historyMessagesEl).removeClass('im_history_appending');
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
            $(historyMessagesEl).css(transform, 'translate(0px, ' + (scrollableWrap.scrollHeight - wasH) + 'px)');
            $(historyWrap).nanoScroller();
            var styles = {};
            styles[transform] = 'translate(0px, 0px)';
            $(historyMessagesEl).addClass('im_history_appending');
            $transition($(historyMessagesEl), styles).then(function () {
              curAnimation = false;
              $(historyMessagesEl).removeClass('im_history_appending');
              updateBottomizer();
            });
          } else {
            $(scrollableWrap).removeClass('im_history_to_bottom');
            $(scrollable).css({bottom: ''});
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
            updateBottomizer();
            $(historyWrap).nanoScroller();
          }
        });
      });

      $scope.$on('ui_history_change', function () {
        $(scrollableWrap).addClass('im_history_to_bottom');
        $(scrollable).css({bottom: 0});
        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: ''});
          updateSizes(true);

          var unreadSplit = $('.im_message_unread_split', scrollableWrap);
          if (unreadSplit[0]) {
            scrollableWrap.scrollTop = Math.max(0, unreadSplit[0].offsetTop - 52);
            atBottom = false;
          } else {
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
          }

          updateScroller();
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $scope.$on('ui_history_focus', function () {
        if (!atBottom) {
          scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
          updateScroller();
          atBottom = true;
        }
      });

      $scope.$on('ui_history_prepend', function () {
        var sh = scrollableWrap.scrollHeight,
            st = scrollableWrap.scrollTop,
            ch = scrollableWrap.clientHeight;

        $(scrollableWrap).addClass('im_history_to_bottom');
        scrollableWrap.scrollHeight; // Some strange Chrome bug workaround
        $(scrollable).css({bottom: -(sh - st - ch)});

        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: ''});
          scrollableWrap.scrollTop = st + scrollableWrap.scrollHeight - sh;

          updateBottomizer();
          moreNotified = false;

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $scope.$on('ui_panel_update', function () {
        onContentLoaded(function () {
          updateSizes();
          $scope.$broadcast('ui_message_send');

          $timeout(function () {
            $(scrollableWrap).trigger('scroll');
          });
        });
      });

      $scope.$on('ui_editor_resize', updateSizes);

      var atBottom = true;
      $(scrollableWrap).on('scroll', function (e) {
        if ($(scrollableWrap).hasClass('im_history_to_bottom')) {
          return cancelEvent(e);
        }
        if (curAnimation) {
          return;
        }
        atBottom = scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight;

        if (!moreNotified && scrollableWrap.scrollTop <= 300) {
          moreNotified = true;
          $scope.$emit('history_need_more');
        }
      });

      function updateSizes (heightOnly) {
        if (!element.is(':visible') || !$(element[0].parentNode).is(':visible')) {
          return;
        }
        if ($(sendFormWrap).is(':visible')) {
          $(sendFormWrap).css({
            height: $(sendForm).height()
          });
        }

        if (!headWrap || !headWrap.offsetHeight) {
          headWrap = $('.tg_page_head')[0];
        }
        if (!footer || !footer.offsetHeight) {
          footer = $('.im_page_footer')[0];
        }
        var historyH = $($window).height() - panelWrap.offsetHeight - bottomPanelWrap.offsetHeight - (headWrap ? headWrap.offsetHeight : 44) - footer.offsetHeight;
        $(historyWrap).css({
          height: historyH
        });
        $(historyEl).css({
          minHeight: historyH - 44
        });

        updateBottomizer();


        if (heightOnly === true) return;
        if (atBottom) {
          onContentLoaded(function () {
            scrollableWrap.scrollTop = scrollableWrap.scrollHeight;
            updateScroller();
          });
        }
        updateScroller(100);
      }

      function updateBottomizer () {
        $(historyMessagesEl).css({marginTop: 0});
        if (historyMessagesEl.offsetHeight > 0 && historyMessagesEl.offsetHeight <= scrollableWrap.offsetHeight) {
          $(historyMessagesEl).css({marginTop: (scrollableWrap.offsetHeight - historyMessagesEl.offsetHeight - 20 - 44) + 'px'});
        }
        $(historyWrap).nanoScroller();
      }

      $($window).on('resize', updateSizes);

      updateSizes();
      onContentLoaded(updateSizes);
    }

  })

  .directive('mySendForm', function ($timeout, AppConfigManager) {

    return {
      link: link,
      scope: {
        draftMessage: '='
      }
    };

    function link ($scope, element, attrs) {
      var messageField = $('textarea', element)[0],
          fileSelects = $('input', element),
          dropbox = $('.im_send_dropbox_wrap', element)[0],
          emojiButton = $('.im_emoji_btn', element)[0],
          editorElement = messageField,
          dragStarted, dragTimeout,
          emojiArea = $(messageField).emojiarea({button: emojiButton, norealTime: true}),
          emojiMenu = $('.emoji-menu', element)[0],
          richTextarea = $('.emoji-wysiwyg-editor', element)[0];

      if (richTextarea) {
        editorElement = richTextarea;
        $(richTextarea).addClass('form-control');
        $(richTextarea).attr('placeholder', $(messageField).attr('placeholder'));

        var updatePromise;
        $(richTextarea).on('keyup', function (e) {
          updateHeight();

          $scope.draftMessage.text = richTextarea.innerText;

          $timeout.cancel(updatePromise);
          updatePromise = $timeout(updateValue, 1000);
        });
      }

      fileSelects.on('change', function () {
        var self = this;
        $scope.$apply(function () {
          $scope.draftMessage.files = Array.prototype.slice.call(self.files);
          $scope.draftMessage.isMedia = $(self).hasClass('im_media_attach_input');
          setTimeout(function () {
            try {
              self.value = '';
            } catch (e) {};
          }, 1000);
        });
      });

      var sendOnEnter = true,
          updateSendSettings = function () {
            AppConfigManager.get('send_ctrlenter').then(function (sendOnCtrl) {
              sendOnEnter = !sendOnCtrl;
            });
          };

      $scope.$on('settings_changed', updateSendSettings);
      updateSendSettings();

      $(editorElement).on('keydown', function (e) {
        if (richTextarea) {
          updateHeight();
        }

        if (e.keyCode == 13) {
          var submit = false;
          if (sendOnEnter && !e.shiftKey) {
            submit = true;
          } else if (!sendOnEnter && (e.ctrlKey || e.metaKey)) {
            submit = true;
          }

          if (submit) {
            $(element).trigger('submit');
            return cancelEvent(e);
          }
        }

      });

      var lastTyping = 0;
      $(editorElement).on('keyup', function (e) {
        var now = tsNow();
        if (now - lastTyping < 5000) {
          return;
        }
        lastTyping = now;
        $scope.$emit('ui_typing');
      });

      function updateField () {
        if (richTextarea) {
          $timeout.cancel(updatePromise);
          var html = $('<div>').text($scope.draftMessage.text || '').html();
          html = html.replace(/\n/g, '<br/>');
          $(richTextarea).html(html);
          updateHeight();
        }
      }

      function updateValue () {
        if (richTextarea) {
          $(richTextarea).trigger('change');
          updateHeight();
        }
      }

      var height = richTextarea.offsetHeight;
      function updateHeight () {
        var newHeight = richTextarea.offsetHeight;
        if (height != newHeight) {
          height = newHeight;
          $scope.$emit('ui_editor_resize');
        }
      };

      $('body').on('dragenter dragleave dragover drop', onDragDropEvent);
      $(document).on('paste', onPasteEvent);
      if (richTextarea) {
        $(richTextarea).on('DOMNodeInserted', onPastedImageEvent);
      }

      $scope.$on('ui_peer_change', focusField);
      $scope.$on('ui_history_focus', focusField);
      $scope.$on('ui_history_change', focusField);
      $scope.$on('ui_message_send', focusField);
      $scope.$on('ui_peer_draft', updateField);
      $scope.$on('ui_message_before_send', updateValue);


      $scope.$on('$destroy', function cleanup() {
        $('body').off('dragenter dragleave dragover drop', onDragDropEvent);
        $(document).off('paste', onPasteEvent);
        if (richTextarea) {
          $(richTextarea).off('DOMNodeInserted', onPastedImageEvent);
        }
      });

      focusField();

      function focusField () {
        onContentLoaded(function () {
          editorElement.focus();
        });
      }

      function onPastedImageEvent (e) {
        var element = e && e.target;
        var src;
        if (element && (src = element.src) && src.indexOf('data') === 0) {
          element.parentNode.removeChild(element);
          src = src.substr(5).split(';');
          var contentType = src[0];
          var base64 = atob(src[1].split(',')[1]);
          var array = new Uint8Array(base64.length);

          for (var i = 0; i < base64.length; i++) {
            array[i] = base64.charCodeAt(i);
          }

          var blob = new Blob([array], {type: contentType});

          if (safeConfirm('Are you sure to send file(s) from clipboard?')) {
            $scope.$apply(function () {
              $scope.draftMessage.files = [blob];
              $scope.draftMessage.isMedia = true;
            });
          }
        }
      };

      function onPasteEvent (e) {
        var cData = (e.originalEvent || e).clipboardData,
            items = cData && cData.items || [],
            files = [],
            i;

        for (i = 0; i < items.length; i++) {
          if (items[i].kind == 'file') {
            files.push(items[i].getAsFile());
          }
        }

        if (files.length && safeConfirm('Are you sure to send file(s) from clipboard?')) {
          $scope.$apply(function () {
            $scope.draftMessage.files = files;
            $scope.draftMessage.isMedia = true;
          });
        }
      }

      function onDragDropEvent(e) {
        var dragStateChanged = false;
        if (!dragStarted || dragStarted == 1) {
          dragStarted = checkDragEvent(e) ? 2 : 1;
          dragStateChanged = true;
        }
        if (dragStarted == 2) {
          if (dragTimeout) {
            setTimeout(function () {
              clearTimeout(dragTimeout);
              dragTimeout = false;
            }, 0);
          }

          if (e.type == 'dragenter' || e.type == 'dragover') {
            if (dragStateChanged) {
              $(dropbox)
                .css({height: $(editorElement).height() + 12, width: $(editorElement).width() + 12})
                .show();
            }
          } else {
            if (e.type == 'drop') {
              $scope.$apply(function () {
                $scope.draftMessage.files = Array.prototype.slice.call(e.originalEvent.dataTransfer.files);
                $scope.draftMessage.isMedia = true;
              });
            }
            dragTimeout = setTimeout(function () {
              $(dropbox).hide();
              dragStarted = false;
              dragTimeout = false;
            }, 300);
          }
        }

        return cancelEvent(e);
      };
    }

  })

  .directive('myLoadThumb', function(MtpApiFileManager) {

    return {
      link: link,
      scope: {
        thumb: '='
      }
    };

    function link ($scope, element, attrs) {
      var counter = 0;

      var cachedSrc = MtpApiFileManager.getCachedFile(
        $scope.thumb &&
        $scope.thumb.location &&
        !$scope.thumb.location.empty &&
        $scope.thumb.location
      );

      if (cachedSrc) {
        element.attr('src', cachedSrc);
      }
      if ($scope.thumb && $scope.thumb.width && $scope.thumb.height) {
        element.attr('width', $scope.thumb.width);
        element.attr('height', $scope.thumb.height);
      }

      var stopWatching = $scope.$watchCollection('thumb.location', function (newLocation) {
        if ($scope.thumb && $scope.thumb.width && $scope.thumb.height) {
          element.attr('width', $scope.thumb.width);
          element.attr('height', $scope.thumb.height);
        }
        // console.log('new loc', newLocation, arguments);
        var counterSaved = ++counter;
        if (!newLocation || newLocation.empty) {
          element.attr('src', $scope.thumb && $scope.thumb.placeholder || 'img/blank.gif');
          cleanup();
          return;
        }

        var cachedSrc = MtpApiFileManager.getCachedFile(newLocation);
        if (cachedSrc) {
          element.attr('src', cachedSrc);
          cleanup();
          return;
        }

        if (!element.attr('src')) {
          element.attr('src', $scope.thumb.placeholder || 'img/blank.gif');
        }

        MtpApiFileManager.downloadSmallFile($scope.thumb.location).then(function (url) {
          if (counterSaved == counter) {
            element.attr('src', url);
            cleanup();
          }
        }, function (e) {
          console.log('Download image failed', e, $scope.thumb.location, element[0]);
          if (counterSaved == counter) {
            element.attr('src', $scope.thumb.placeholder || 'img/blank.gif');
            cleanup();
          }
        });
      })

      var cleanup = angular.noop;
      // function () {
      //   setTimeout(function () {
      //     $scope.$destroy()
      //     stopWatching();
      //   }, 0);
      // };
    }

  })

  .directive('myLoadFullPhoto', function(MtpApiFileManager) {

    return {
      link: link,
      transclude: true,
      template:
        '<div class="img_fullsize_with_progress_wrap" ng-style="{width: fullPhoto.width + \'px\', height: fullPhoto.height + \'px\'}">\
          <div class="img_fullsize_progress_overlay" ng-show="progress.enabled">\
            <div class="img_fullsize_progress_wrap" ng-style="{width: fullPhoto.width + \'px\', height: fullPhoto.height + \'px\'}">\
              <div class="img_fullsize_progress progress tg_progress">\
                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="{{progress.percent}}" aria-valuemin="0" aria-valuemax="100" style="width: {{progress.percent}}%">\
                  <span class="sr-only">{{progress.percent}}% Complete (success)</span>\
                </div>\
              </div>\
            </div>\
          </div>\
          <div class="photo_full_wrap">\
            <a class="photo_modal_image">\
              <img class="photo_modal_image" width="{{fullPhoto.width}}" height="{{fullPhoto.height}}" />\
            </a>\
          </div>\
          <div class="photo_modal_error_wrap" ng-if="error">\
            <div class="photo_modal_error" ng-if="error.html" ng-bind-html="error.html"></div>\
            <div class="photo_modal_error" ng-if="error.text">{{error.text}}</div>\
          </div>\
        </div>',
      scope: {
        fullPhoto: '=',
        thumbLocation: '='
      }
    };

    function link ($scope, element, attrs) {

      var imgElement = $('img', element);

      imgElement
          .attr('src', MtpApiFileManager.getCachedFile($scope.thumbLocation) || 'img/blank.gif')
          .addClass('thumb_blurred')
          .addClass('thumb_blur_animation');

      if (!$scope.fullPhoto.location) {
        return;
      }


      var apiPromise;
      if ($scope.fullPhoto.size) {
        var inputLocation = {
          _: 'inputFileLocation',
          volume_id: $scope.fullPhoto.location.volume_id,
          local_id: $scope.fullPhoto.location.local_id,
          secret: $scope.fullPhoto.location.secret
        };
        apiPromise = MtpApiFileManager.downloadFile($scope.fullPhoto.location.dc_id, inputLocation, $scope.fullPhoto.size);
      } else {
        apiPromise = MtpApiFileManager.downloadSmallFile($scope.fullPhoto.location);
      }

      $scope.progress = {enabled: true, percent: 1};

      apiPromise.then(function (url) {
        $scope.progress.enabled = false;
        imgElement
          .attr('src', url)
          .removeClass('thumb_blurred');

      }, function (e) {
        console.log('Download image failed', e, $scope.fullPhoto.location);
        $scope.progress.enabled = false;

        if (e && e.type == 'FS_BROWSER_UNSUPPORTED') {
          $scope.error = {html: 'Your browser doesn\'t support <a href="https://developer.mozilla.org/en-US/docs/Web/API/LocalFileSystem" target="_blank">LocalFileSystem</a> feature which is needed to display this image.<br/>Please, install <a href="http://google.com/chrome" target="_blank">Google Chrome</a> or use <a href="https://telegram.org/" target="_blank">mobile app</a> instead.'};
        } else {
          $scope.error = {text: 'Download failed', error: e};
        }
      }, function (progress) {
        $scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      });
    }

  })


  .directive('myLoadVideo', function($sce, MtpApiFileManager) {

    return {
      link: link,
      transclude: true,
      template:
        '<div class="img_fullsize_with_progress_wrap" ng-style="{width: video.full.width + \'px\', height: video.full.height + \'px\'}">\
          <div class="img_fullsize_progress_overlay" ng-show="progress.enabled">\
            <div class="img_fullsize_progress_wrap" ng-style="{width: video.full.width + \'px\', height: video.full.height + \'px\'}">\
              <div class="img_fullsize_progress progress tg_progress">\
                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="{{progress.percent}}" aria-valuemin="0" aria-valuemax="100" style="width: {{progress.percent}}%">\
                  <span class="sr-only">{{progress.percent}}% Complete (success)</span>\
                </div>\
              </div>\
            </div>\
          </div>\
          <div class="img_fullsize_wrap" ng-if="!player.src">\
            <img\
              class="img_fullsize"\
              my-load-thumb\
              thumb="video.fullThumb"\
            />\
          </div>\
          <div class="video_full_player" ng-if="player.src">\
            <embed ng-src="{{player.src}}" width="{{video.full.width}}" height="{{video.full.height}}" autoplay="true" CONTROLLER="TRUE" SHOWCONTROLS="TRUE" controller="true" loop="false" pluginspace="http://www.apple.com/quicktime/" ng-if="player.quicktime"/>\
            <video width="{{video.full.width}}" height="{{video.full.height}}" controls autoplay  ng-if="!player.quicktime">\
              <source ng-src="{{player.src}}" type="video/mp4">\
            </video>\
          </div>\
          <div class="video_full_error_wrap" ng-if="error">\
            <div class="video_full_error" ng-if="error.html" ng-bind-html="error.html"></div>\
            <div class="video_full_error" ng-if="error.text" ng-bind="error.text"></div>\
          </div>\
        </div>',
      scope: {
        video: '='
      }
    };

    function link ($scope, element, attrs) {

      $scope.progress = {enabled: true, percent: 1};
      $scope.player = {};

      var inputLocation = {
        _: 'inputVideoFileLocation',
        id: $scope.video.id,
        access_hash: $scope.video.access_hash
      };

      var hasQt = false, i;
      if (navigator.plugins) {
        for (i = 0; i < navigator.plugins.length; i++) {
          if (navigator.plugins[i].name.indexOf('QuickTime') >= 0) {
            hasQt = true;
          }
        }
      }

      var downloadPromise = MtpApiFileManager.downloadFile($scope.video.dc_id, inputLocation, $scope.video.size, null, {mime: 'video/mp4'});

      downloadPromise.then(function (url) {
        $scope.progress.enabled = false;
        // $scope.progress = {enabled: true, percent: 50};
        $scope.player.hasQuicktime = hasQt;
        $scope.player.quicktime = false;
        $scope.player.src = $sce.trustAsResourceUrl(url);
      }, function (e) {
        console.log('Download video failed', e, $scope.video);
        $scope.progress.enabled = false;
        $scope.player.src = '';

        if (e && e.type == 'FS_BROWSER_UNSUPPORTED') {
          $scope.error = {html: 'Your browser doesn\'t support <a href="https://developer.mozilla.org/en-US/docs/Web/API/LocalFileSystem" target="_blank">LocalFileSystem</a> feature which is needed to play this video.<br/>Please, install <a href="http://google.com/chrome" target="_blank">Google Chrome</a> or use <a href="https://telegram.org/" target="_blank">mobile app</a> instead.'};
        } else {
          $scope.error = {text: 'Video download failed', error: e};
        }

      }, function (progress) {
        $scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
      });

      $scope.$on('$destroy', function () {
        downloadPromise.cancel();
      });
    }

  })

  .directive('myMapPoint', function(ExternalResourcesManager) {

    return {
      link: link,
      scope: {
        point: '='
      }
    };

    function link ($scope, element, attrs) {

      var apiKey = 'AIzaSyC32ij28dCa0YzEV_HqbWfIwTZQql-RNS0';

      var src = 'https://maps.googleapis.com/maps/api/staticmap?sensor=false&center=' + $scope.point['lat'] + ',' + $scope.point['long'] + '&zoom=13&size=200x100&scale=2&key=' + apiKey;

      ExternalResourcesManager.downloadImage(src).then(function (url) {
        element.append('<img src="' + url + '" width="200" height="100"/>');
      });

      element.attr('href','https://maps.google.com/?q=' + $scope.point['lat'] + ',' + $scope.point['long']);
      element.attr('target','_blank');
    }

  })


  .directive('myLoadingDots', function($interval) {

    return {
      link: link,
    };

    function link ($scope, element, attrs) {
      element.html(isAnimationSupported(element[0])
        ? '<div class="loading_dots"><span></span><span></span><span></span></div>'
        : '...'
      );
    }

    var animationSupported;
    function isAnimationSupported (el) {
      if (animationSupported === undefined) {
        animationSupported = el.style.animationName !== undefined;
        if (animationSupported === false) {
          var domPrefixes = 'Webkit Moz O ms Khtml'.split(' '), i;
          for (i = 0; i < domPrefixes.length; i++) {
            if (el.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
              animationSupported = true;
              break;
            }
          }
        }
      }

      return animationSupported;
    }
  })

  .directive('myAudioAutoplay', function() {

    return {
      link: link,
      scope: {
        audio: '='
      }
    };

    function link ($scope, element, attrs) {
      $scope.$watch('audio.autoplay', function (autoplay) {
        if (autoplay) {
          element.autoplay = true;
          element[0].play();
        } else {
          element.autoplay = false;
        }
      });
    }
  })

  .directive('myFocused', function(){
    return {
      link: function($scope, element, attrs) {
        setTimeout(function () {
          element[0].focus();
        }, 100);
      }
    };
  })

  .directive('myFileUpload', function(){

    return {
      link: link
    };

    function link($scope, element, attrs) {
      element.on('change', function () {
        var self = this;
        $scope.$apply(function () {
          $scope.photo.file = self.files[0];
          setTimeout(function () {
            try {
              self.value = '';
            } catch (e) {};
          }, 1000);
        });
      });
    };
  })


  .directive('myModalWidth', function () {

    return {
      link: link
    };

    function link($scope, element, attrs) {
      attrs.$observe('myModalWidth', function (newW) {
        $(element[0].parentNode.parentNode).css({width: parseInt(newW) + 36});
      });
    };

  })


  .directive('myModalPosition', function ($window, $timeout) {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      var updateMargin = function () {
        var height = element[0].parentNode.offsetHeight,
            contHeight = element[0].parentNode.parentNode.parentNode.offsetHeight;

        if (height < contHeight) {
          $(element[0].parentNode).css('marginTop', (contHeight - height) / 2);
        } else {
          $(element[0].parentNode).css('marginTop', '');
        }
        $timeout(function () {
          $(element[0].parentNode).addClass('modal-content-animated');
        }, 300);
      };

      onContentLoaded(updateMargin);

      $($window).on('resize', updateMargin);

      $scope.$on('ui_height', function () {
        onContentLoaded(updateMargin);
      });

    };

  })


  .directive('myVerticalPosition', function ($window, $timeout) {

    return {
      link: link
    };

    function link($scope, element, attrs) {

      var updateMargin = function () {
        var height = element[0].offsetHeight,
            contHeight = $($window).height(),
            ratio = attrs.myVerticalPosition && parseFloat(attrs.myVerticalPosition) || 0.5,
            margin = height < contHeight ? parseInt((contHeight - height) * ratio) : '';

        element.css({marginTop: margin, marginBottom: margin});
      };

      onContentLoaded(updateMargin);

      $($window).on('resize', updateMargin);

      $scope.$on('ui_height', function () {
        onContentLoaded(updateMargin);
      });

    };

  })
