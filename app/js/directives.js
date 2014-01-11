/*!
 * Webogram v0.1 - messaging web application for MTProto
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
      templateUrl: 'partials/message.html?1'
    };
  })

  .directive('myDialogsList', function($window, $timeout) {

    return {
      link: link
    };

    function link (scope, element, attrs) {
      var dialogsWrap = $('.im_dialogs_wrap')[0],
          scrollableWrap = $('.im_dialogs_scrollable_wrap')[0],
          // dialogsSearch = $('im_dialogs_search')[0],
          moreNotified = false;

      onContentLoaded(function () {
        $(dialogsWrap).nanoScroller({preventPageScrolling: true, tabIndex: -1});
      });

      var updateScroller = function () {
        onContentLoaded(function () {
          $(dialogsWrap).nanoScroller();
        });
      }

      scope.$on('ui_dialogs_prepend', updateScroller);


      scope.$on('ui_dialogs_append', function () {
        onContentLoaded(function () {
          updateScroller();
          moreNotified = false;
        });
      });

      scope.$on('ui_dialogs_change', function () {
        onContentLoaded(function () {
          updateScroller();
          moreNotified = false;
        });
      });

      $(scrollableWrap).on('scroll', function (e) {
        if (!moreNotified && scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight - 300) {
          scope.$emit('dialogs_need_more');
          moreNotified = true;
        }
      });


      function updateSizes () {
        $(element).css({
          height: $($window).height() - 162
        });
      }

      $($window).on('resize', updateSizes);

      updateSizes();
    };

  })

  .directive('myHistory', function ($window, $timeout) {

    return {
      link: link
    };

    function link (scope, element, attrs) {
      var historyWrap = $('.im_history_wrap')[0],
          scrollableWrap = $('.im_history_scrollable_wrap')[0],
          scrollable = $('.im_history_scrollable')[0],
          panelWrap = $('.im_history_panel_wrap', element)[0],
          sendFormWrap = $('.im_send_form_wrap', element)[0],
          moreNotified = false;

      onContentLoaded(function () {
        $(historyWrap).nanoScroller({preventPageScrolling: true, scroll: 'bottom', tabIndex: -1});
      });

      var updateScroller = function (delay) {
        $timeout(function () {
          $(historyWrap).nanoScroller();
        }, delay || 0);
      }

      scope.$on('ui_history_append', function () {
        // var st = scrollableWrap.scrollTop;
        $(scrollableWrap).addClass('im_history_to_bottom');
        $(scrollable).css({bottom: 0});

        if (atBottom) {
          onContentLoaded(function () {
            $(scrollableWrap).removeClass('im_history_to_bottom');
            $(scrollable).css({bottom: ''});
            // updateSizes(true);
            $(historyWrap).nanoScroller({scrollBottom: 0});
            // scrollableWrap.scrollTop = st;
            // $(scrollableWrap).animate({
            //   scrollTop: scrollableWrap.scrollHeight - scrollableWrap.clientHeight
            // }, 200);
            updateScroller();
          });
        }
      });

      scope.$on('ui_history_change', function () {
        $(scrollableWrap).addClass('im_history_to_bottom');
        $(scrollable).css({bottom: 0});
        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: ''});
          updateSizes();
          $(historyWrap).nanoScroller();
          $(historyWrap).nanoScroller({scrollBottom: 0});
          updateScroller(100);
          moreNotified = false;
        });
      });


      scope.$on('ui_history_prepend', function () {
        var sh = scrollableWrap.scrollHeight,
            st = scrollableWrap.scrollTop,
            ch = scrollableWrap.clientHeight;

        $(scrollableWrap).addClass('im_history_to_bottom');
        $(scrollable).css({bottom: -(sh - st - ch)});

        onContentLoaded(function () {
          $(scrollableWrap).removeClass('im_history_to_bottom');
          $(scrollable).css({bottom: ''});
          $(historyWrap).nanoScroller();
          $(historyWrap).nanoScroller({scrollTop: st + scrollableWrap.scrollHeight - sh});

          // updateScroller();
          updateScroller(50);
          moreNotified = false;
        });
      });

      var atBottom = true;
      $(scrollableWrap).on('scroll', function (e) {
        atBottom = scrollableWrap.scrollTop >= scrollableWrap.scrollHeight - scrollableWrap.clientHeight;

        if (!moreNotified && scrollableWrap.scrollTop <= 300) {
          moreNotified = true;
          scope.$emit('history_need_more');
        }
      });

      function updateSizes (heightOnly) {
        $(historyWrap).css({
          height: $($window).height() - panelWrap.offsetHeight - sendFormWrap.offsetHeight - 90
        });

        if (heightOnly) return;
        if (atBottom) {
          onContentLoaded(function () {
            $(historyWrap).nanoScroller({scroll: 'bottom'});
          });
        }
        updateScroller(100);
      }

      $($window).on('resize', updateSizes);

      onContentLoaded(updateSizes);
    }

  })

  .directive('mySendForm', function ($timeout) {

    return {
      link: link,
      scope: {
        draftMessage: '='
      }
    };

    function link (scope, element, attrs) {
      var messageField = $('textarea', element)[0],
          fileSelect = $('input', element)[0],
          dropbox = $('.im_send_dropbox_wrap', element)[0],
          emojiButton = $('.im_emoji_btn', element)[0],
          editorElement = messageField,
          dragStarted, dragTimeout,
          emojiArea = $(messageField).emojiarea({button: emojiButton}),
          emojiMenu = $('.emoji-menu')[0],
          richTextarea = $('.emoji-wysiwyg-editor', element)[0];

      if (richTextarea) {
        editorElement = richTextarea;
        $(richTextarea).addClass('form-control');
        $(richTextarea).attr('placeholder', $(messageField).attr('placeholder'));
      }

      // $(emojiMenu.firstChild).addClass('nano').nanoScroller({preventPageScrolling: true, tabIndex: -1});


      $(fileSelect).on('change', function () {
        scope.$apply(function () {
          scope.draftMessage.files = Array.prototype.slice.call(fileSelect.files);
        });
      });

      var sendOnEnter = true;
      $(editorElement).on('keydown', function (e) {
        if (e.keyCode != 13) {
          return;
        }
        var submit = false;
        if (sendOnEnter && !e.shiftKey) {
          submit = true;
        } else if (!sendOnEnter && (e.ctrlKey || e.metaKey)) {
          submit = true;
        }

        if (submit) {
          $(element).trigger('submit');
          // dLog('after submit');
          return cancelEvent(e);
        }
      });

      if (richTextarea) {
        scope.$watch('draftMessage.text', function (newVal) {
          if (!newVal.length && !messageField.value.length) {
            $timeout(function () {
              $(richTextarea).html('');
            }, 0);
          }
        });
      }


      $('body').on('dragenter dragleave dragover drop', onDragDropEvent);

      scope.$on('ui_peer_change ui_history_change ui_message_send', focusField);
      scope.$on('$destroy', function cleanup() {
        $('body').off('dragenter dragleave dragover drop', onDragDropEvent);
      });

      focusField();

      function focusField () {
        onContentLoaded(function () {
          $(editorElement).focus();
        });
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
              scope.$apply(function () {
                scope.draftMessage.files = Array.prototype.slice.call(e.originalEvent.dataTransfer.files);
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

    function link (scope, element, attrs) {

      scope.$watch('thumb.location', function (newVal) {
        if (!scope.thumb || !scope.thumb.location) {
          element.attr('src', scope.thumb.placeholder || '');
          return;
        }

        MtpApiFileManager.downloadSmallFile(scope.thumb.location, scope.thumb.size).then(function (url) {
          element.attr('src', url);
        }, function (e) {
          dLog('Download image failed', e, scope.thumb.location);
          element.attr('src', scope.thumb.placeholder || '');
        });
      })

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
        </div>',
      scope: {
        fullPhoto: '=',
        thumbLocation: '='
      }
    };

    function link (scope, element, attrs) {
      var imgElement = $('img', element),
          fullLoaded = false;


      if (!scope.fullPhoto.location) {
        imgElement.attr('src', scope.fullPhoto.placeholder || '');
        return;
      }

      MtpApiFileManager.getCachedFile(scope.thumbLocation).then(function (url) {
        if (!fullLoaded) {
          imgElement
            .attr('src', url)
            .addClass('thumb_blurred')
            .addClass('thumb_blur_animation');
        }
      });

      var apiPromise;
      if (scope.fullPhoto.size) {
        var inputLocation = {
          _: 'inputFileLocation',
          volume_id: scope.fullPhoto.location.volume_id,
          local_id: scope.fullPhoto.location.local_id,
          secret: scope.fullPhoto.location.secret
        };
        apiPromise = MtpApiFileManager.downloadFile(scope.fullPhoto.location.dc_id, inputLocation, scope.fullPhoto.size);
      } else {
        apiPromise = MtpApiFileManager.downloadSmallFile(scope.fullPhoto.location);
      }

      scope.progress = {enabled: true, percent: 1};

      apiPromise.then(function (url) {
        fullLoaded = true;
        scope.progress.enabled = false;
        imgElement
          .attr('src', url)
          .removeClass('thumb_blurred');

      }, function (e) {
        dLog('Download image failed', e, scope.fullPhoto.location);
        scope.progress.enabled = false;
        imgElement
          .attr('src', scope.fullPhoto.placeholder || '')
          .removeClass('thumb_blurred');

      }, function (progress) {
        scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
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
            <img class="img_fullsize" my-load-thumb thumb="video.thumb" width="{{video.full.width}}" height="{{video.full.height}}" />\
          </div>\
          <div class="video_full_player" ng-if="player.src">\
            <embed ng-src="{{player.src}}" width="{{video.full.width}}" height="{{video.full.height}}" autoplay="true" CONTROLLER="TRUE" loop="false" pluginspace="http://www.apple.com/quicktime/" ng-if="player.quicktime"/>\
            <video width="{{video.full.width}}" height="{{video.full.height}}" controls autoplay  ng-if="!player.quicktime">\
              <source ng-src="{{player.src}}" type="video/mp4">\
            </video>\
          </div>\
        </div>',
      scope: {
        video: '='
      }
    };

    function link (scope, element, attrs) {

      scope.progress = {enabled: true, percent: 1};
      scope.player = {};

      var inputLocation = {
        _: 'inputVideoFileLocation',
        id: scope.video.id,
        access_hash: scope.video.access_hash
      };

      var hasQt = false, i;
      // if (navigator.plugins) {
      //   for (i = 0; i < navigator.plugins.length; i++) {
      //     if (navigator.plugins[i].name.indexOf('QuickTime') >= 0) {
      //       hasQt = true;
      //     }
      //   }
      // }

      MtpApiFileManager.downloadFile(scope.video.dc_id, inputLocation, scope.video.size).then(function (url) {
        scope.progress.enabled = false;
        // scope.progress = {enabled: true, percent: 50};
        scope.player.quicktime = hasQt;
        scope.player.src = $sce.trustAsResourceUrl(url);
      }, function (e) {
        dLog('Download image failed', e, scope.fullPhoto.location);
        scope.progress.enabled = false;
        scope.player.src = '';
      }, function (progress) {
        scope.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total));
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

    function link (scope, element, attrs) {

      var apiKey = 'AIzaSyC32ij28dCa0YzEV_HqbWfIwTZQql-RNS0';

      var src = 'https://maps.googleapis.com/maps/api/staticmap?sensor=false&center=' + scope.point['lat'] + ',' + scope.point['long'] + '&zoom=13&size=200x100&scale=2&key=' + apiKey;

      ExternalResourcesManager.downloadImage(src).then(function (url) {
        element.append('<img src="' + url + '" width="200" height="100"/>');
      });

      element.attr('href','https://maps.google.com/?q=' + scope.point['lat'] + ',' + scope.point['long']);
      element.attr('target','_blank');
    }

  })


  .directive('myTypingDots', function($interval) {

    return {
      link: link,
    };

    var interval;

    function link (scope, element, attrs) {
      var promise = $interval(function () {
        var time = +new Date(),
            cnt = 3;

        if (time % 1000 <= 200) {
          cnt = 0;
        } else if (time % 1000 <= 400) {
          cnt = 1;
        } else if (time % 1000 <= 600) {
          cnt = 2;
        }
        element.html((new Array(cnt + 1)).join('.'));
      }, 200);

      scope.$on('$destroy', function cleanup() {
        $interval.cancel(promise);
      });
    }
  })
