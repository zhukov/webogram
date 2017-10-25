/**
 * MDN references for hackers:
 * ===========================
 * Media events on <audio> and <video> tags:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
 * Properties and Methods:
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
 * Internet Exploder version:
 * http://msdn.microsoft.com/en-us/library/ff975061(v=vs.85).aspx
 *
 * Understanding TimeRanges objects:
 * http://html5doctor.com/html5-audio-the-state-of-play/
 */
angular.module('mediaPlayer', ['mediaPlayer.helpers'])
.constant('mp.playerDefaults', {
  // general properties
  currentTrack: 0,
  ended: undefined,
  network: undefined,
  playing: false,
  seeking: false,
  tracks: 0,
  volume: 1,

  // formatted properties
  formatDuration: '00:00',
  formatTime: '00:00',
  loadPercent: 0
})

.directive('mediaPlayer', ['$rootScope', '$interpolate', '$timeout', 'mp.throttle', 'mp.playerDefaults',
  function ($rootScope, $interpolate, $timeout, throttle, playerDefaults) {

    var playerMethods = {
      /**
       * @usage load([mediaElement], [autoplay]);
       *
       * @param  {mediaElement Obj} mediaElement a single mediaElement, may contain multiple <source>(s)
       * @param  {boolean} autoplay: flag to autostart loaded element
       */
      load: function (mediaElement, autoplay) {
        // method overloading
        if (typeof mediaElement === 'boolean') {
          autoplay = mediaElement;
          mediaElement = null;
        } else if (typeof mediaElement === 'object') {
          this.$clearSourceList();
          this.$addSourceList(mediaElement);
        }
        this.$domEl.load();
        this.ended = undefined;
        if (autoplay) {
          // ogv.js doesn't have support for canplay event yet
          var canPlayEvent = this.$domEl.tagName == 'OGVJS' ? 'loadeddata' : 'canplay'
          this.$element.one(canPlayEvent, this.play.bind(this));
        }
      },
      /**
       * resets the player (clear the <source>s) and reloads the playlist
       *
       * @usage reset([autoplay]);
       * @param {boolean} autoplay: flag to autoplay once resetted
       */
      reset: function (autoplay) {
        angular.extend(this, playerDefaults);
        this.$clearSourceList();
        this.load(this.$playlist, autoplay);
      },
      /**
       * @usage play([index], [selectivePlay])
       * @param {integer} index: playlist index (0...n), to start playing from
       * @param {boolean} selectivePlay: only correct value is `true`, in which case will only play the specified,
       *                                 or current, track. The default is to continue playing the next one.
       */
      play: function (index, selectivePlay) {
        // method overloading
        if (typeof index === 'boolean') {
          selectivePlay = index;
          index = undefined;
        }
        if (selectivePlay) {
          this.$selective = true;
        }

        if (this.$playlist.length > index) {
          this.currentTrack = index + 1;
          return this.load(this.$playlist[index], true);
        }
        // readyState = HAVE_NOTHING (0) means there's nothing into the <audio>/<video> tag
        if (!this.currentTrack && this.$domEl.readyState) { this.currentTrack++; }

        // In case the stream is completed, reboot it with a load()
        if (this.ended) {
          this.load(true);
        } else {
          this.$domEl.play();
        }
      },
      playPause: function (index, selectivePlay) {
        // method overloading
        if (typeof index === 'boolean') {
          selectivePlay = index;
          index = undefined;
        }
        if (selectivePlay) {
          this.$selective = true;
        }

        if (typeof index === 'number' && index + 1 !== this.currentTrack) {
          this.play(index);
        } else if (this.playing) {
          this.pause();
        } else {
          this.play();
        }
      },
      pause: function () {
        this.$domEl.pause();
      },
      stop: function () {
        this.reset();
      },
      toggleMute: function () {
        this.muted = this.$domEl.muted = !this.$domEl.muted;
      },
      next: function (autoplay) {
        var self = this;
        if (self.currentTrack && self.currentTrack < self.tracks) {
          var wasPlaying = autoplay || self.playing;
          self.pause();
          $timeout(function () {
            self.$clearSourceList();
            self.$addSourceList(self.$playlist[self.currentTrack]);
            self.load(wasPlaying); // setup autoplay here.
            self.currentTrack++;
          });
        }
      },
      prev: function (autoplay) {
        var self = this;
        if (self.currentTrack && self.currentTrack - 1) {
          var wasPlaying = autoplay || self.playing;
          self.pause();
          $timeout(function () {
            self.$clearSourceList();
            self.$addSourceList(self.$playlist[self.currentTrack - 2]);
            self.load(wasPlaying); // setup autoplay here.
            self.currentTrack--;
          });
        }
      },
      setPlaybackRate: function (value) {
        this.$domEl.playbackRate = value;
      },
      setVolume: function (value) {
        this.$domEl.volume = value;
      },
      seek: function (value) {
        var doubleval = 0, valuesArr;
        if (typeof value === 'string') {
          valuesArr = value.split(':');
          doubleval += parseInt(valuesArr.pop(), 10);
          if (valuesArr.length) { doubleval += parseInt(valuesArr.pop(), 10) * 60; }
          if (valuesArr.length) { doubleval += parseInt(valuesArr.pop(), 10) * 3600; }
          if (!isNaN(doubleval)) {
            return this.$domEl.currentTime = doubleval;
          }
        } else {
          return this.$domEl.currentTime = value;
        }
      },
      /**
       * binds a specific event directly to the element
       * @param  {string}   type   event name
       * @param  {function} fn     callback
       * @return {function}        unbind function, call it in order to remove the listener
       */
      on: function (type, fn) {
        return this.$element.on(type, fn);
      },
      off: function (type, fn) {
        return this.$element.off(type, fn);
      },
      one: function (type, fn) {
        return this.$element.one(type, fn);
      },
      $addSourceList: function (sourceList) {
        var self = this;
        if (angular.isArray(sourceList)) {
          angular.forEach(sourceList, function (singleElement, index) {
            var sourceElem = document.createElement('SOURCE');
            ['src', 'type', 'media'].forEach(function (key) { // use only a subset of the properties
              if (singleElement[key] !== undefined) { // firefox is picky if you set undefined attributes
                sourceElem.setAttribute(key, singleElement[key]);
              }
            });
            self.$element.append(sourceElem);
          });
        } else if (angular.isObject(sourceList)) {
          var sourceElem = document.createElement('SOURCE');
          ['src', 'type', 'media'].forEach(function (key) {
            if (sourceList[key] !== undefined) {
              sourceElem.setAttribute(key, sourceList[key]);
            }
          });
          self.$element.append(sourceElem);
        }
      },
      $clearSourceList: function () {
        this.$element.contents().remove();
      },
      $formatTime: function (seconds) {
        if (seconds === Infinity) {
          return '∞'; // If the data is streaming
        }
        var hours = parseInt(seconds / 3600, 10) % 24,
            minutes = parseInt(seconds / 60, 10) % 60,
            secs = parseInt(seconds % 60, 10),
            result,
            fragment = (minutes < 10 ? '0' + minutes : minutes) + ':' + (secs  < 10 ? '0' + secs : secs);
        if (hours > 0) {
          result = (hours < 10 ? '0' + hours : hours) + ':' + fragment;
        } else {
          result = fragment;
        }
        return result;
      },
      $attachPlaylist: function (pl) {
        if (pl === undefined || pl === null) {
          this.playlist = [];
        } else {
          this.$playlist = pl;
        }
      }
    };

    /**
     * Binding function that gives life to AngularJS scope
     * @param  {Scope}  au        Player Scope
     * @param  {HTMLMediaElement} HTML5 element
     * @param  {jQlite} element   <audio>/<video> element
     * @return {function}
     *
     * Returns an unbinding function
     */
    var bindListeners = function (au, al, element) {
      var updateTime = function (scope) {
        scope.currentTime = al.currentTime;
        scope.formatTime = scope.$formatTime(scope.currentTime);
      }
      var listeners = {
        playing: function () {
          au.$apply(function (scope) {
            scope.playing = true;
            scope.ended = false;
          });
        },
        pause: function () {
          au.$apply(function (scope) {
            scope.playing = false;
          });
        },
        ended: function () {
          if (!au.$selective && au.currentTrack < au.tracks) {
            au.next(true);
          } else {
            au.$apply(function (scope) {
              scope.ended = true;
              scope.playing = false; // IE9 does not throw 'pause' when file ends
              updateTime(scope)
            });
          }
        },
        timeupdate: throttle(1000, false, function () {
          au.$apply(function (scope) {
            updateTime(scope)
          });
        }),
        loadedmetadata: function () {
          au.$apply(function (scope) {
            if (!scope.currentTrack) { scope.currentTrack++; } // This is triggered *ONLY* the first time a <source> gets loaded.
            scope.duration = al.duration;
            scope.formatDuration = scope.$formatTime(scope.duration);
            if (al.buffered.length) {
              scope.loadPercent = Math.round((al.buffered.end(al.buffered.length - 1) / scope.duration) * 100);
            }
            updateTime(scope)
          });
        },
        progress: function () {
          if (au.$domEl.buffered.length) {
            au.$apply(function (scope) {
              scope.loadPercent = Math.round((al.buffered.end(al.buffered.length - 1) / scope.duration) * 100);
              scope.network = 'progress';
            });
          }
        },
        volumechange: function () { // Sent when volume changes (both when the volume is set and when the muted attribute is changed).
          au.$apply(function (scope) {
            // scope.volume = Math.floor(al.volume * 100);
            scope.volume = al.volume;
            scope.muted = al.muted;
          });
        },
        seeked: function () {
          au.$apply(function (scope) {
            scope.seeking = false;
          });
        },
        seeking: function () {
          au.$apply(function (scope) {
            scope.seeking = true;
          });
        },
        ratechange: function () {
          au.$apply(function (scope) {
            // scope.playbackRate = Math.floor(al.playbackRate * 100);
            scope.playbackRate = al.playbackRate;
          });
        },
        stalled: function () {
          au.$apply(function (scope) {
            scope.network = 'stalled';
          });
        },
        suspend: function () {
          au.$apply(function (scope) {
            scope.network = 'suspend';
          });
        }
      };

      angular.forEach(listeners, function (f, listener) {
        element.on(listener, f);
      });
    };

    var MediaPlayer = function (element) {
      var mediaScope = angular.extend($rootScope.$new(true), {
        $element: element,
        $domEl: element[0],
        $playlist: undefined,

        // bind TimeRanges structures to actual MediaElement
        buffered: element[0].buffered,
        played: element[0].played,
        seekable: element[0].seekable,
      }, playerDefaults, playerMethods);
      bindListeners(mediaScope, element[0], element);
      return mediaScope;
    };

    // creates a watch function bound to the specific player
    // optimizable: closures eats ram
    function playlistWatch(player) {
      return function (playlistNew, playlistOld, watchScope) {
        var currentTrack,
            newTrackNum = null;

        // on every playlist change, it refreshes the reference, safer/shorter approach
        // than using multiple ifs and refresh only if it changed; there's no benefit in that
        player.$attachPlaylist(playlistNew);
        if (playlistNew === undefined && playlistOld !== undefined) {
          return player.pause();
        }

        /**
         * Playlist update logic:
         * If the player has started ->
         *   Check if the playing track is in the new Playlist [EXAMPLE BELOW]
         *   If it is ->
         *     Assign to it the new tracknumber
         *   Else ->
         *     If the new Playlist has some song ->
         *       Pause the player, and get the new Playlist
         *     Else ->
         *       Reset the player, and await for orders
         *
         * Else (if the player hasn't started yet)
         *   Just replace the <src> tags
         *
         * Example
         * playlist: [a,b,c], playing: c, trackNum: 2
         * ----delay 5 sec-----
         * playlist: [f,a,b,c], playing: c, trackNum: 3
         *
         */
        if (player.currentTrack) {
          currentTrack = playlistOld ? playlistOld[player.currentTrack - 1] : -1;
          for (var i = 0; i < playlistNew.length; i++) {
            if (angular.equals(playlistNew[i], currentTrack)) { newTrackNum = i; break; }
          }
          if (newTrackNum !== null) { // currentTrack it's still in the new playlist, update trackNumber
            player.currentTrack = newTrackNum + 1;
            player.tracks = playlistNew.length;
          } else { // currentTrack has been removed.
            player.pause();
            if (playlistNew.length) { // if the new playlist has some elements, replace actual.
              $timeout(function () { // need $timeout because the mediaTag needs a little time to launch the 'pause' event
                player.$clearSourceList();
                player.$addSourceList(playlistNew[0]);
                player.load();
                player.tracks = playlistNew.length;
              });
            } else { // the new playlist has no elements, clear actual
              player.reset();
            }
          }
        } else if (playlistNew.length) { // new playlist has elements, load them
          player.$clearSourceList();
          player.$addSourceList(playlistNew[0]);
          player.load();
          player.tracks = playlistNew.length;
        } else { // new playlist has no elements, clear actual
          player.reset();
        }
      };
    }

    return {
      /**
       * The directive uses the Scope in which gets declared,
       * so it can read/write it with ease.
       * The only isolated Scope here gets created for the MediaPlayer.
       */
      scope: false,
      link: function (scope, element, attrs, ctrl) {
        var playlistName = attrs.playlist,
            mediaName = attrs.mediaPlayer || attrs.playerControl;

        var player = new MediaPlayer(element), playlist = scope[playlistName];
        // create data-structures in the father Scope
        if (playlistName === undefined) {
          playlist = []; // local playlist gets defined as new
        } else if (scope[playlistName] === undefined) {
          playlist = scope[playlistName] = []; // define playlist on father scope
        } else {
          playlist = scope[playlistName];
        }
        if (mediaName !== undefined) {
          scope.$eval(mediaName + ' = player', {player: player});
        }

        if (element[0].tagName !== 'AUDIO' && element[0].tagName !== 'VIDEO' && element[0].tagName !== 'OGVJS') {
          return new Error('player directive works only when attached to an <audio>/<video> type tag');
        }
        var mediaElement = [],
            sourceElements = element.find('source');

        // create a single playlist element from <source> tag(s).
        // if the <source> tag is one, use object notation...
        if (sourceElements.length === 1) {
          playlist.unshift({ src: sourceElements[0].src, type: sourceElements[0].type, media: sourceElements[0].media });
        } else if (sourceElements.length > 1) { // otherwise use array notation
          angular.forEach(sourceElements, function (sourceElement) {
            mediaElement.push({ src: sourceElement.src, type: sourceElement.type, media: sourceElement.media });
          });
          // put mediaElement as first element in the playlist
          playlist.unshift(mediaElement);
        }

        /**
         * If the user wants to keep track of the playlist changes
         * has to use data-playlist="variableName" in the <audio>/<video> tag
         *
         * Otherwise: it will be created an empty playlist and attached to the player.
         */
        if (playlistName === undefined) {
          player.$attachPlaylist(playlist); // empty playlist case
        } else if (playlist.length) {
          playlistWatch(player)(playlist, undefined, scope); // playlist already populated gets bootstrapped
          scope.$watch(playlistName, playlistWatch(player), true); // then watch gets applied
        } else {
          scope.$watch(playlistName, playlistWatch(player), true); // playlist empty, only watch
        }
      }
    };

  }]
);

angular.module('mediaPlayer.helpers', [])
.factory('mp.throttle', ['$timeout', function ($timeout) {
  return function (delay, no_trailing, callback, debounce_mode) {
    var timeout_id,
    last_exec = 0;

    if (typeof no_trailing !== 'boolean') {
      debounce_mode = callback;
      callback = no_trailing;
      no_trailing = undefined;
    }

    var wrapper = function () {
      var that = this,
          elapsed = +new Date() - last_exec,
          args = arguments,
          exec = function () {
            last_exec = +new Date();
            callback.apply(that, args);
          },
          clear = function () {
            timeout_id = undefined;
          };

      if (debounce_mode && !timeout_id) { exec(); }
      if (timeout_id) { $timeout.cancel(timeout_id); }
      if (debounce_mode === undefined && elapsed > delay) {
        exec();
      } else if (no_trailing !== true) {
        timeout_id = $timeout(debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay);
      }
    };

    return wrapper;
  };
}]);