/**
 * @license AngularJS v1.7.8
 * (c) 2010-2018 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/**
 * @ngdoc module
 * @name ngTouch
 * @description
 *
 * The `ngTouch` module provides helpers for touch-enabled devices.
 * The implementation is based on jQuery Mobile touch event handling
 * ([jquerymobile.com](http://jquerymobile.com/)). *
 *
 * See {@link ngTouch.$swipe `$swipe`} for usage.
 *
 * @deprecated
 * sinceVersion="1.7.0"
 * The ngTouch module with the {@link ngTouch.$swipe `$swipe`} service and
 * the {@link ngTouch.ngSwipeLeft} and {@link ngTouch.ngSwipeRight} directives are
 * deprecated. Instead, stand-alone libraries for touch handling and gesture interaction
 * should be used, for example [HammerJS](https://hammerjs.github.io/) (which is also used by
 * Angular).
 */

// define ngTouch module
/* global ngTouch */
var ngTouch = angular.module('ngTouch', []);

ngTouch.info({ angularVersion: '1.7.8' });

function nodeName_(element) {
  return angular.$$lowercase(element.nodeName || (element[0] && element[0].nodeName));
}

/* global ngTouch: false */

    /**
     * @ngdoc service
     * @name $swipe
     *
     * @deprecated
     * sinceVersion="1.7.0"
     *
     * See the {@link ngTouch module} documentation for more information.
     *
     * @description
     * The `$swipe` service is a service that abstracts the messier details of hold-and-drag swipe
     * behavior, to make implementing swipe-related directives more convenient.
     *
     * Requires the {@link ngTouch `ngTouch`} module to be installed.
     *
     * `$swipe` is used by the `ngSwipeLeft` and `ngSwipeRight` directives in `ngTouch`.
     *
     * # Usage
     * The `$swipe` service is an object with a single method: `bind`. `bind` takes an element
     * which is to be watched for swipes, and an object with four handler functions. See the
     * documentation for `bind` below.
     */

ngTouch.factory('$swipe', [function() {
  // The total distance in any direction before we make the call on swipe vs. scroll.
  var MOVE_BUFFER_RADIUS = 10;

  var POINTER_EVENTS = {
    'mouse': {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup'
    },
    'touch': {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend',
      cancel: 'touchcancel'
    },
    'pointer': {
      start: 'pointerdown',
      move: 'pointermove',
      end: 'pointerup',
      cancel: 'pointercancel'
    }
  };

  function getCoordinates(event) {
    var originalEvent = event.originalEvent || event;
    var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
    var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

    return {
      x: e.clientX,
      y: e.clientY
    };
  }

  function getEvents(pointerTypes, eventType) {
    var res = [];
    angular.forEach(pointerTypes, function(pointerType) {
      var eventName = POINTER_EVENTS[pointerType][eventType];
      if (eventName) {
        res.push(eventName);
      }
    });
    return res.join(' ');
  }

  return {
    /**
     * @ngdoc method
     * @name $swipe#bind
     *
     * @description
     * The main method of `$swipe`. It takes an element to be watched for swipe motions, and an
     * object containing event handlers.
     * The pointer types that should be used can be specified via the optional
     * third argument, which is an array of strings `'mouse'`, `'touch'` and `'pointer'`. By default,
     * `$swipe` will listen for `mouse`, `touch` and `pointer` events.
     *
     * The four events are `start`, `move`, `end`, and `cancel`. `start`, `move`, and `end`
     * receive as a parameter a coordinates object of the form `{ x: 150, y: 310 }` and the raw
     * `event`. `cancel` receives the raw `event` as its single parameter.
     *
     * `start` is called on either `mousedown`, `touchstart` or `pointerdown`. After this event, `$swipe` is
     * watching for `touchmove`, `mousemove` or `pointermove` events. These events are ignored until the total
     * distance moved in either dimension exceeds a small threshold.
     *
     * Once this threshold is exceeded, either the horizontal or vertical delta is greater.
     * - If the horizontal distance is greater, this is a swipe and `move` and `end` events follow.
     * - If the vertical distance is greater, this is a scroll, and we let the browser take over.
     *   A `cancel` event is sent.
     *
     * `move` is called on `mousemove`, `touchmove` and `pointermove` after the above logic has determined that
     * a swipe is in progress.
     *
     * `end` is called when a swipe is successfully completed with a `touchend`, `mouseup` or `pointerup`.
     *
     * `cancel` is called either on a `touchcancel` or `pointercancel`  from the browser, or when we begin scrolling
     * as described above.
     *
     */
    bind: function(element, eventHandlers, pointerTypes) {
      // Absolute total movement, used to control swipe vs. scroll.
      var totalX, totalY;
      // Coordinates of the start position.
      var startCoords;
      // Last event's position.
      var lastPos;
      // Whether a swipe is active.
      var active = false;

      pointerTypes = pointerTypes || ['mouse', 'touch', 'pointer'];
      element.on(getEvents(pointerTypes, 'start'), function(event) {
        startCoords = getCoordinates(event);
        active = true;
        totalX = 0;
        totalY = 0;
        lastPos = startCoords;
        if (eventHandlers['start']) {
          eventHandlers['start'](startCoords, event);
        }
      });
      var events = getEvents(pointerTypes, 'cancel');
      if (events) {
        element.on(events, function(event) {
          active = false;
          if (eventHandlers['cancel']) {
            eventHandlers['cancel'](event);
          }
        });
      }

      element.on(getEvents(pointerTypes, 'move'), function(event) {
        if (!active) return;

        // Android will send a touchcancel if it thinks we're starting to scroll.
        // So when the total distance (+ or - or both) exceeds 10px in either direction,
        // we either:
        // - On totalX > totalY, we send preventDefault() and treat this as a swipe.
        // - On totalY > totalX, we let the browser handle it as a scroll.

        if (!startCoords) return;
        var coords = getCoordinates(event);

        totalX += Math.abs(coords.x - lastPos.x);
        totalY += Math.abs(coords.y - lastPos.y);

        lastPos = coords;

        if (totalX < MOVE_BUFFER_RADIUS && totalY < MOVE_BUFFER_RADIUS) {
          return;
        }

        // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
        if (totalY > totalX) {
          // Allow native scrolling to take over.
          active = false;
          if (eventHandlers['cancel']) {
            eventHandlers['cancel'](event);
          }
          return;
        } else {
          // Prevent the browser from scrolling.
          event.preventDefault();
          if (eventHandlers['move']) {
            eventHandlers['move'](coords, event);
          }
        }
      });

      element.on(getEvents(pointerTypes, 'end'), function(event) {
        if (!active) return;
        active = false;
        if (eventHandlers['end']) {
          eventHandlers['end'](getCoordinates(event), event);
        }
      });
    }
  };
}]);

/* global ngTouch: false */

/**
 * @ngdoc directive
 * @name ngSwipeLeft
 *
 * @deprecated
 * sinceVersion="1.7.0"
 *
 * See the {@link ngTouch module} documentation for more information.
 *
 * @description
 * Specify custom behavior when an element is swiped to the left on a touchscreen device.
 * A leftward swipe is a quick, right-to-left slide of the finger.
 * Though ngSwipeLeft is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * To disable the mouse click and drag functionality, add `ng-swipe-disable-mouse` to
 * the `ng-swipe-left` or `ng-swipe-right` DOM Element.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeLeft {@link guide/expression Expression} to evaluate
 * upon left swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeLeftExample" deps="angular-touch.js" name="ng-swipe-left">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeLeftExample', ['ngTouch']);
      </file>
    </example>
 */

/**
 * @ngdoc directive
 * @name ngSwipeRight
 *
 * @deprecated
 * sinceVersion="1.7.0"
 *
 * See the {@link ngTouch module} documentation for more information.
 *
 * @description
 * Specify custom behavior when an element is swiped to the right on a touchscreen device.
 * A rightward swipe is a quick, left-to-right slide of the finger.
 * Though ngSwipeRight is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeRight {@link guide/expression Expression} to evaluate
 * upon right swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeRightExample" deps="angular-touch.js" name="ng-swipe-right">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeRightExample', ['ngTouch']);
      </file>
    </example>
 */

function makeSwipeDirective(directiveName, direction, eventName) {
  ngTouch.directive(directiveName, ['$parse', '$swipe', function($parse, $swipe) {
    // The maximum vertical delta for a swipe should be less than 75px.
    var MAX_VERTICAL_DISTANCE = 75;
    // Vertical distance should not be more than a fraction of the horizontal distance.
    var MAX_VERTICAL_RATIO = 0.3;
    // At least a 30px lateral motion is necessary for a swipe.
    var MIN_HORIZONTAL_DISTANCE = 30;

    return function(scope, element, attr) {
      var swipeHandler = $parse(attr[directiveName]);

      var startCoords, valid;

      function validSwipe(coords) {
        // Check that it's within the coordinates.
        // Absolute vertical distance must be within tolerances.
        // Horizontal distance, we take the current X - the starting X.
        // This is negative for leftward swipes and positive for rightward swipes.
        // After multiplying by the direction (-1 for left, +1 for right), legal swipes
        // (ie. same direction as the directive wants) will have a positive delta and
        // illegal ones a negative delta.
        // Therefore this delta must be positive, and larger than the minimum.
        if (!startCoords) return false;
        var deltaY = Math.abs(coords.y - startCoords.y);
        var deltaX = (coords.x - startCoords.x) * direction;
        return valid && // Short circuit for already-invalidated swipes.
            deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaX > MIN_HORIZONTAL_DISTANCE &&
            deltaY / deltaX < MAX_VERTICAL_RATIO;
      }

      var pointerTypes = ['touch'];
      if (!angular.isDefined(attr['ngSwipeDisableMouse'])) {
        pointerTypes.push('mouse');
      }
      $swipe.bind(element, {
        'start': function(coords, event) {
          startCoords = coords;
          valid = true;
        },
        'cancel': function(event) {
          valid = false;
        },
        'end': function(coords, event) {
          if (validSwipe(coords)) {
            scope.$apply(function() {
              element.triggerHandler(eventName);
              swipeHandler(scope, {$event: event});
            });
          }
        }
      }, pointerTypes);
    };
  }]);
}

// Left is negative X-coordinate, right is positive.
makeSwipeDirective('ngSwipeLeft', -1, 'swipeleft');
makeSwipeDirective('ngSwipeRight', 1, 'swiperight');

// Wrapper to abstract over using touch events or mouse events.
var swipeTests = function(description, restrictBrowsers, startEvent, moveEvent, endEvent) {
  describe('ngSwipe with ' + description + ' events', function() {
    var element;

    if (restrictBrowsers) {
      // TODO(braden): Once we have other touch-friendly browsers on CI, allow them here.
      // Currently Firefox and IE refuse to fire touch events.
      var chrome = /chrome/.test(window.navigator.userAgent.toLowerCase());
      if (!chrome) {
        return;
      }
    }

    beforeEach(function() {
      module('ngTouch');
    });

    afterEach(function() {
      dealoc(element);
    });

    it('should swipe to the left', inject(function($rootScope, $compile) {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect($rootScope.swiped).toBe(true);
    }));

    it('should swipe to the right', inject(function($rootScope, $compile) {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 90,
        y: 20
      });
      expect($rootScope.swiped).toBe(true);
    }));

    it('should only swipe given ng-swipe-disable-mouse attribute for touch events', inject(function($rootScope, $compile) {
      element = $compile('<div ng-swipe-left="swiped = true" ng-swipe-disable-mouse></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect(!!$rootScope.swiped).toBe(description !== 'mouse');
    }));

    it('should pass event object', inject(function($rootScope, $compile) {
      element = $compile('<div ng-swipe-left="event = $event"></div>')($rootScope);
      $rootScope.$digest();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect($rootScope.event).toBeDefined();
    }));

    it('should not swipe if you move too far vertically', inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 90,
        y: 20
      });
      browserTrigger(element, moveEvent, {
        keys: [],
        x: 70,
        y: 200
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should not swipe if you slide only a short distance', inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 90,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 80,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should not swipe if the swipe leaves the element', inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      browserTrigger(element, moveEvent, {
        keys: [],
        x: 40,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should not swipe if the swipe starts outside the element', inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, moveEvent, {
        keys: [],
        x: 10,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 90,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should emit "swipeleft" events for left swipes', inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();
      var eventFired = false;
      element.on('swipeleft', function() {
        eventFired = true;
      });

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect(eventFired).toEqual(true);
    }));

    it('should emit "swiperight" events for right swipes', inject(function($rootScope, $compile, $rootElement) {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();
      var eventFired = false;
      element.on('swiperight', function() {
        eventFired = true;
      });

      browserTrigger(element, startEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      expect(eventFired).toEqual(true);
    }));
  });
};

swipeTests('touch', /* restrictBrowsers */ true, 'touchstart', 'touchmove', 'touchend');
swipeTests('mouse', /* restrictBrowsers */ false, 'mousedown', 'mousemove', 'mouseup');

describe('$swipe', function() {
  var element;
  var events;

  beforeEach(function() {
    module('ngTouch');
    inject(function($compile, $rootScope) {
      element = $compile('<div></div>')($rootScope);
    });
    events = {
      start: jasmine.createSpy('startSpy'),
      move: jasmine.createSpy('moveSpy'),
      cancel: jasmine.createSpy('cancelSpy'),
      end: jasmine.createSpy('endSpy')
    };
  });

  afterEach(function() {
    dealoc(element);
  });

  describe('pointerTypes', function() {
    var usedEvents;
    var MOUSE_EVENTS = ['mousedown','mousemove','mouseup'].sort();
    var TOUCH_EVENTS = ['touchcancel','touchend','touchmove','touchstart'].sort();
    var POINTER_EVENTS = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].sort();
    var ALL_EVENTS = MOUSE_EVENTS.concat(TOUCH_EVENTS, POINTER_EVENTS).sort();

    beforeEach(function() {
      usedEvents = [];
      spyOn(element, 'on').and.callFake(function(events) {
        angular.forEach(events.split(/\s+/), function(eventName) {
          usedEvents.push(eventName);
        });
      });
    });

    it('should use mouse, touch and pointer by default', inject(function($swipe) {
      $swipe.bind(element, events);
      expect(usedEvents.sort()).toEqual(ALL_EVENTS);
    }));

    it('should only use mouse events for pointerType "mouse"', inject(function($swipe) {
      $swipe.bind(element, events, ['mouse']);
      expect(usedEvents.sort()).toEqual(MOUSE_EVENTS);
    }));

    it('should only use touch events for pointerType "touch"', inject(function($swipe) {
      $swipe.bind(element, events, ['touch']);
      expect(usedEvents.sort()).toEqual(TOUCH_EVENTS);
    }));

    it('should only use pointer events for pointerType "pointer"', inject(function($swipe) {
      $swipe.bind(element, events, ['pointer']);
      expect(usedEvents.sort()).toEqual(POINTER_EVENTS);
    }));

    it('should use mouse and touch if both are specified', inject(function($swipe) {
      $swipe.bind(element, events, ['touch', 'mouse']);
      expect(usedEvents.sort()).toEqual(MOUSE_EVENTS.concat(TOUCH_EVENTS).sort());
    }));

    it('should use mouse and pointer if both are specified', inject(function($swipe) {
      $swipe.bind(element, events, ['mouse', 'pointer']);
      expect(usedEvents.sort()).toEqual(MOUSE_EVENTS.concat(POINTER_EVENTS).sort());
    }));

    it('should use touch and pointer if both are specified', inject(function($swipe) {
      $swipe.bind(element, events, ['touch', 'pointer']);
      expect(usedEvents.sort()).toEqual(TOUCH_EVENTS.concat(POINTER_EVENTS).sort());
    }));

    it('should use mouse, touch and pointer if they are specified', inject(function($swipe) {
      $swipe.bind(element, events, ['mouse', 'touch', 'pointer']);
      expect(usedEvents.sort()).toEqual(ALL_EVENTS);
    }));

  });

  swipeTests('touch', /* restrictBrowsers */ true, 'touchstart', 'touchmove', 'touchend');
  swipeTests('pointer', /* restrictBrowsers */ true, 'pointerdown', 'pointermove', 'pointerup');
  swipeTests('mouse', /* restrictBrowsers */ false, 'mousedown',  'mousemove', 'mouseup');

  // Wrapper to abstract over using touch events or mouse events.
  function swipeTests(description, restrictBrowsers, startEvent, moveEvent, endEvent) {
    describe('$swipe with ' + description + ' events', function() {
      if (restrictBrowsers) {
        // TODO(braden): Once we have other touch-friendly browsers on CI, allow them here.
        // Currently Firefox and IE refuse to fire touch events.
        // Enable iPhone for manual testing.
        if (!/chrome|iphone/i.test(window.navigator.userAgent)) {
          return;
        }
      }

      it('should trigger the "start" event', inject(function($swipe) {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 20
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should trigger the "move" event after a "start"', inject(function($swipe) {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 20
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 140,
          y: 20
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalled();

        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should not trigger a "move" without a "start"', inject(function($swipe) {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should not trigger an "end" without a "start"', inject(function($swipe) {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should trigger a "start", many "move"s and an "end"', inject(function($swipe) {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 120,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 130,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 140,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 150,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 160,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 170,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 180,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(7);

        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 200,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(7);
        expect(events.end).toHaveBeenCalled();

        expect(events.cancel).not.toHaveBeenCalled();
      }));

      it('should not start sending "move"s until enough horizontal motion is accumulated', inject(function($swipe) {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 101,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 105,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 110,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 115,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 120,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(3);

        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 200,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(3);
        expect(events.end).toHaveBeenCalled();

        expect(events.cancel).not.toHaveBeenCalled();
      }));

      it('should stop sending anything after vertical motion dominates', inject(function($swipe) {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 101,
          y: 41
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 105,
          y: 55
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 110,
          y: 60
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 115,
          y: 70
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 120,
          y: 80
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.cancel).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 200,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.cancel).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));
    });
  }

});


})(window, window.angular);
