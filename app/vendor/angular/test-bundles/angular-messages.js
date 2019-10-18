/**
 * @license AngularJS v1.7.8
 * (c) 2010-2018 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

var forEach;
var isArray;
var isString;
var jqLite;

/**
 * @ngdoc module
 * @name ngMessages
 * @description
 *
 * The `ngMessages` module provides enhanced support for displaying messages within templates
 * (typically within forms or when rendering message objects that return key/value data).
 * Instead of relying on JavaScript code and/or complex ng-if statements within your form template to
 * show and hide error messages specific to the state of an input field, the `ngMessages` and
 * `ngMessage` directives are designed to handle the complexity, inheritance and priority
 * sequencing based on the order of how the messages are defined in the template.
 *
 * Currently, the ngMessages module only contains the code for the `ngMessages`, `ngMessagesInclude`
 * `ngMessage`, `ngMessageExp` and `ngMessageDefault` directives.
 *
 * ## Usage
 * The `ngMessages` directive allows keys in a key/value collection to be associated with a child element
 * (or 'message') that will show or hide based on the truthiness of that key's value in the collection. A common use
 * case for `ngMessages` is to display error messages for inputs using the `$error` object exposed by the
 * {@link ngModel ngModel} directive.
 *
 * The child elements of the `ngMessages` directive are matched to the collection keys by a `ngMessage` or
 * `ngMessageExp` directive. The value of these attributes must match a key in the collection that is provided by
 * the `ngMessages` directive.
 *
 * Consider the following example, which illustrates a typical use case of `ngMessages`. Within the form `myForm` we
 * have a text input named `myField` which is bound to the scope variable `field` using the {@link ngModel ngModel}
 * directive.
 *
 * The `myField` field is a required input of type `email` with a maximum length of 15 characters.
 *
 * ```html
 * <form name="myForm">
 *   <label>
 *     Enter text:
 *     <input type="email" ng-model="field" name="myField" required maxlength="15" />
 *   </label>
 *   <div ng-messages="myForm.myField.$error" role="alert">
 *     <div ng-message="required">Please enter a value for this field.</div>
 *     <div ng-message="email">This field must be a valid email address.</div>
 *     <div ng-message="maxlength">This field can be at most 15 characters long.</div>
 *   </div>
 * </form>
 * ```
 *
 * In order to show error messages corresponding to `myField` we first create an element with an `ngMessages` attribute
 * set to the `$error` object owned by the `myField` input in our `myForm` form.
 *
 * Within this element we then create separate elements for each of the possible errors that `myField` could have.
 * The `ngMessage` attribute is used to declare which element(s) will appear for which error - for example,
 * setting `ng-message="required"` specifies that this particular element should be displayed when there
 * is no value present for the required field `myField` (because the key `required` will be `true` in the object
 * `myForm.myField.$error`).
 *
 * ### Message order
 *
 * By default, `ngMessages` will only display one message for a particular key/value collection at any time. If more
 * than one message (or error) key is currently true, then which message is shown is determined by the order of messages
 * in the HTML template code (messages declared first are prioritised). This mechanism means the developer does not have
 * to prioritize messages using custom JavaScript code.
 *
 * Given the following error object for our example (which informs us that the field `myField` currently has both the
 * `required` and `email` errors):
 *
 * ```javascript
 * <!-- keep in mind that ngModel automatically sets these error flags -->
 * myField.$error = { required : true, email: true, maxlength: false };
 * ```
 * The `required` message will be displayed to the user since it appears before the `email` message in the DOM.
 * Once the user types a single character, the `required` message will disappear (since the field now has a value)
 * but the `email` message will be visible because it is still applicable.
 *
 * ### Displaying multiple messages at the same time
 *
 * While `ngMessages` will by default only display one error element at a time, the `ng-messages-multiple` attribute can
 * be applied to the `ngMessages` container element to cause it to display all applicable error messages at once:
 *
 * ```html
 * <!-- attribute-style usage -->
 * <div ng-messages="myForm.myField.$error" ng-messages-multiple>...</div>
 *
 * <!-- element-style usage -->
 * <ng-messages for="myForm.myField.$error" multiple>...</ng-messages>
 * ```
 *
 * ## Reusing and Overriding Messages
 * In addition to prioritization, ngMessages also allows for including messages from a remote or an inline
 * template. This allows for generic collection of messages to be reused across multiple parts of an
 * application.
 *
 * ```html
 * <script type="text/ng-template" id="error-messages">
 *   <div ng-message="required">This field is required</div>
 *   <div ng-message="minlength">This field is too short</div>
 * </script>
 *
 * <div ng-messages="myForm.myField.$error" role="alert">
 *   <div ng-messages-include="error-messages"></div>
 * </div>
 * ```
 *
 * However, including generic messages may not be useful enough to match all input fields, therefore,
 * `ngMessages` provides the ability to override messages defined in the remote template by redefining
 * them within the directive container.
 *
 * ```html
 * <!-- a generic template of error messages known as "my-custom-messages" -->
 * <script type="text/ng-template" id="my-custom-messages">
 *   <div ng-message="required">This field is required</div>
 *   <div ng-message="minlength">This field is too short</div>
 * </script>
 *
 * <form name="myForm">
 *   <label>
 *     Email address
 *     <input type="email"
 *            id="email"
 *            name="myEmail"
 *            ng-model="email"
 *            minlength="5"
 *            required />
 *   </label>
 *   <!-- any ng-message elements that appear BEFORE the ng-messages-include will
 *        override the messages present in the ng-messages-include template -->
 *   <div ng-messages="myForm.myEmail.$error" role="alert">
 *     <!-- this required message has overridden the template message -->
 *     <div ng-message="required">You did not enter your email address</div>
 *
 *     <!-- this is a brand new message and will appear last in the prioritization -->
 *     <div ng-message="email">Your email address is invalid</div>
 *
 *     <!-- and here are the generic error messages -->
 *     <div ng-messages-include="my-custom-messages"></div>
 *   </div>
 * </form>
 * ```
 *
 * In the example HTML code above the message that is set on required will override the corresponding
 * required message defined within the remote template. Therefore, with particular input fields (such
 * email addresses, date fields, autocomplete inputs, etc...), specialized error messages can be applied
 * while more generic messages can be used to handle other, more general input errors.
 *
 * ## Dynamic Messaging
 * ngMessages also supports using expressions to dynamically change key values. Using arrays and
 * repeaters to list messages is also supported. This means that the code below will be able to
 * fully adapt itself and display the appropriate message when any of the expression data changes:
 *
 * ```html
 * <form name="myForm">
 *   <label>
 *     Email address
 *     <input type="email"
 *            name="myEmail"
 *            ng-model="email"
 *            minlength="5"
 *            required />
 *   </label>
 *   <div ng-messages="myForm.myEmail.$error" role="alert">
 *     <div ng-message="required">You did not enter your email address</div>
 *     <div ng-repeat="errorMessage in errorMessages">
 *       <!-- use ng-message-exp for a message whose key is given by an expression -->
 *       <div ng-message-exp="errorMessage.type">{{ errorMessage.text }}</div>
 *     </div>
 *   </div>
 * </form>
 * ```
 *
 * The `errorMessage.type` expression can be a string value or it can be an array so
 * that multiple errors can be associated with a single error message:
 *
 * ```html
 *   <label>
 *     Email address
 *     <input type="email"
 *            ng-model="data.email"
 *            name="myEmail"
 *            ng-minlength="5"
 *            ng-maxlength="100"
 *            required />
 *   </label>
 *   <div ng-messages="myForm.myEmail.$error" role="alert">
 *     <div ng-message-exp="'required'">You did not enter your email address</div>
 *     <div ng-message-exp="['minlength', 'maxlength']">
 *       Your email must be between 5 and 100 characters long
 *     </div>
 *   </div>
 * ```
 *
 * Feel free to use other structural directives such as ng-if and ng-switch to further control
 * what messages are active and when. Be careful, if you place ng-message on the same element
 * as these structural directives, AngularJS may not be able to determine if a message is active
 * or not. Therefore it is best to place the ng-message on a child element of the structural
 * directive.
 *
 * ```html
 * <div ng-messages="myForm.myEmail.$error" role="alert">
 *   <div ng-if="showRequiredError">
 *     <div ng-message="required">Please enter something</div>
 *   </div>
 * </div>
 * ```
 *
 * ## Animations
 * If the `ngAnimate` module is active within the application then the `ngMessages`, `ngMessage` and
 * `ngMessageExp` directives will trigger animations whenever any messages are added and removed from
 * the DOM by the `ngMessages` directive.
 *
 * Whenever the `ngMessages` directive contains one or more visible messages then the `.ng-active` CSS
 * class will be added to the element. The `.ng-inactive` CSS class will be applied when there are no
 * messages present. Therefore, CSS transitions and keyframes as well as JavaScript animations can
 * hook into the animations whenever these classes are added/removed.
 *
 * Let's say that our HTML code for our messages container looks like so:
 *
 * ```html
 * <div ng-messages="myMessages" class="my-messages" role="alert">
 *   <div ng-message="alert" class="some-message">...</div>
 *   <div ng-message="fail" class="some-message">...</div>
 * </div>
 * ```
 *
 * Then the CSS animation code for the message container looks like so:
 *
 * ```css
 * .my-messages {
 *   transition:1s linear all;
 * }
 * .my-messages.ng-active {
 *   // messages are visible
 * }
 * .my-messages.ng-inactive {
 *   // messages are hidden
 * }
 * ```
 *
 * Whenever an inner message is attached (becomes visible) or removed (becomes hidden) then the enter
 * and leave animation is triggered for each particular element bound to the `ngMessage` directive.
 *
 * Therefore, the CSS code for the inner messages looks like so:
 *
 * ```css
 * .some-message {
 *   transition:1s linear all;
 * }
 *
 * .some-message.ng-enter {}
 * .some-message.ng-enter.ng-enter-active {}
 *
 * .some-message.ng-leave {}
 * .some-message.ng-leave.ng-leave-active {}
 * ```
 *
 * {@link ngAnimate See the ngAnimate docs} to learn how to use JavaScript animations or to learn
 * more about ngAnimate.
 *
 * ## Displaying a default message
 * If the ngMessages renders no inner ngMessage directive (i.e. when none of the truthy
 * keys are matched by a defined message), then it will render a default message
 * using the {@link ngMessageDefault} directive.
 * Note that matched messages will always take precedence over unmatched messages. That means
 * the default message will not be displayed when another message is matched. This is also
 * true for `ng-messages-multiple`.
 *
 * ```html
 * <div ng-messages="myForm.myField.$error" role="alert">
 *   <div ng-message="required">This field is required</div>
 *   <div ng-message="minlength">This field is too short</div>
 *   <div ng-message-default>This field has an input error</div>
 * </div>
 * ```
 *

 */
angular.module('ngMessages', [], function initAngularHelpers() {
  // Access helpers from AngularJS core.
  // Do it inside a `config` block to ensure `window.angular` is available.
  forEach = angular.forEach;
  isArray = angular.isArray;
  isString = angular.isString;
  jqLite = angular.element;
})
  .info({ angularVersion: '1.7.8' })

  /**
   * @ngdoc directive
   * @module ngMessages
   * @name ngMessages
   * @restrict AE
   *
   * @description
   * `ngMessages` is a directive that is designed to show and hide messages based on the state
   * of a key/value object that it listens on. The directive itself complements error message
   * reporting with the `ngModel` $error object (which stores a key/value state of validation errors).
   *
   * `ngMessages` manages the state of internal messages within its container element. The internal
   * messages use the `ngMessage` directive and will be inserted/removed from the page depending
   * on if they're present within the key/value object. By default, only one message will be displayed
   * at a time and this depends on the prioritization of the messages within the template. (This can
   * be changed by using the `ng-messages-multiple` or `multiple` attribute on the directive container.)
   *
   * A remote template can also be used (With {@link ngMessagesInclude}) to promote message
   * reusability and messages can also be overridden.
   *
   * A default message can also be displayed when no `ngMessage` directive is inserted, using the
   * {@link ngMessageDefault} directive.
   *
   * {@link module:ngMessages Click here} to learn more about `ngMessages` and `ngMessage`.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression" role="alert">
   *   <ANY ng-message="stringValue">...</ANY>
   *   <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
   *   <ANY ng-message-exp="expressionValue">...</ANY>
   *   <ANY ng-message-default>...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression" role="alert">
   *   <ng-message when="stringValue">...</ng-message>
   *   <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
   *   <ng-message when-exp="expressionValue">...</ng-message>
   *   <ng-message-default>...</ng-message-default>
   * </ng-messages>
   * ```
   *
   * @param {string} ngMessages an AngularJS expression evaluating to a key/value object
   *                 (this is typically the $error object on an ngModel instance).
   * @param {string=} ngMessagesMultiple|multiple when set, all messages will be displayed with true
   *
   * @example
   * <example name="ngMessages-directive" module="ngMessagesExample"
   *          deps="angular-messages.js"
   *          animations="true" fixBase="true">
   *   <file name="index.html">
   *     <form name="myForm">
   *       <label>
   *         Enter your name:
   *         <input type="text"
   *                name="myName"
   *                ng-model="name"
   *                ng-minlength="5"
   *                ng-maxlength="20"
   *                required />
   *       </label>
   *       <pre>myForm.myName.$error = {{ myForm.myName.$error | json }}</pre>
   *
   *       <div ng-messages="myForm.myName.$error" style="color:maroon" role="alert">
   *         <div ng-message="required">You did not enter a field</div>
   *         <div ng-message="minlength">Your field is too short</div>
   *         <div ng-message="maxlength">Your field is too long</div>
   *         <div ng-message-default>This field has an input error</div>
   *       </div>
   *     </form>
   *   </file>
   *   <file name="script.js">
   *     angular.module('ngMessagesExample', ['ngMessages']);
   *   </file>
   * </example>
   */
  .directive('ngMessages', ['$animate', function($animate) {
    var ACTIVE_CLASS = 'ng-active';
    var INACTIVE_CLASS = 'ng-inactive';

    return {
      require: 'ngMessages',
      restrict: 'AE',
      controller: ['$element', '$scope', '$attrs', function NgMessagesCtrl($element, $scope, $attrs) {
        var ctrl = this;
        var latestKey = 0;
        var nextAttachId = 0;

        this.getAttachId = function getAttachId() { return nextAttachId++; };

        var messages = this.messages = {};
        var renderLater, cachedCollection;

        this.render = function(collection) {
          collection = collection || {};

          renderLater = false;
          cachedCollection = collection;

          // this is true if the attribute is empty or if the attribute value is truthy
          var multiple = isAttrTruthy($scope, $attrs.ngMessagesMultiple) ||
                         isAttrTruthy($scope, $attrs.multiple);

          var unmatchedMessages = [];
          var matchedKeys = {};
          var truthyKeys = 0;
          var messageItem = ctrl.head;
          var messageFound = false;
          var totalMessages = 0;

          // we use != instead of !== to allow for both undefined and null values
          while (messageItem != null) {
            totalMessages++;
            var messageCtrl = messageItem.message;

            var messageUsed = false;
            if (!messageFound) {
              forEach(collection, function(value, key) {
                if (truthy(value) && !messageUsed) {
                  truthyKeys++;

                  if (messageCtrl.test(key)) {
                    // this is to prevent the same error name from showing up twice
                    if (matchedKeys[key]) return;
                    matchedKeys[key] = true;

                    messageUsed = true;
                    messageCtrl.attach();
                  }
                }
              });
            }

            if (messageUsed) {
              // unless we want to display multiple messages then we should
              // set a flag here to avoid displaying the next message in the list
              messageFound = !multiple;
            } else {
              unmatchedMessages.push(messageCtrl);
            }

            messageItem = messageItem.next;
          }

          forEach(unmatchedMessages, function(messageCtrl) {
            messageCtrl.detach();
          });

          var messageMatched = unmatchedMessages.length !== totalMessages;
          var attachDefault = ctrl.default && !messageMatched && truthyKeys > 0;

          if (attachDefault) {
            ctrl.default.attach();
          } else if (ctrl.default) {
            ctrl.default.detach();
          }

          if (messageMatched || attachDefault) {
            $animate.setClass($element, ACTIVE_CLASS, INACTIVE_CLASS);
          } else {
            $animate.setClass($element, INACTIVE_CLASS, ACTIVE_CLASS);
          }
        };

        $scope.$watchCollection($attrs.ngMessages || $attrs['for'], ctrl.render);

        this.reRender = function() {
          if (!renderLater) {
            renderLater = true;
            $scope.$evalAsync(function() {
              if (renderLater && cachedCollection) {
                ctrl.render(cachedCollection);
              }
            });
          }
        };

        this.register = function(comment, messageCtrl, isDefault) {
          if (isDefault) {
            ctrl.default = messageCtrl;
          } else {
            var nextKey = latestKey.toString();
            messages[nextKey] = {
              message: messageCtrl
            };
            insertMessageNode($element[0], comment, nextKey);
            comment.$$ngMessageNode = nextKey;
            latestKey++;
          }

          ctrl.reRender();
        };

        this.deregister = function(comment, isDefault) {
          if (isDefault) {
            delete ctrl.default;
          } else {
            var key = comment.$$ngMessageNode;
            delete comment.$$ngMessageNode;
            removeMessageNode($element[0], comment, key);
            delete messages[key];
          }
          ctrl.reRender();
        };

        function findPreviousMessage(parent, comment) {
          var prevNode = comment;
          var parentLookup = [];

          while (prevNode && prevNode !== parent) {
            var prevKey = prevNode.$$ngMessageNode;
            if (prevKey && prevKey.length) {
              return messages[prevKey];
            }

            // dive deeper into the DOM and examine its children for any ngMessage
            // comments that may be in an element that appears deeper in the list
            if (prevNode.childNodes.length && parentLookup.indexOf(prevNode) === -1) {
              parentLookup.push(prevNode);
              prevNode = prevNode.childNodes[prevNode.childNodes.length - 1];
            } else if (prevNode.previousSibling) {
              prevNode = prevNode.previousSibling;
            } else {
              prevNode = prevNode.parentNode;
              parentLookup.push(prevNode);
            }
          }
        }

        function insertMessageNode(parent, comment, key) {
          var messageNode = messages[key];
          if (!ctrl.head) {
            ctrl.head = messageNode;
          } else {
            var match = findPreviousMessage(parent, comment);
            if (match) {
              messageNode.next = match.next;
              match.next = messageNode;
            } else {
              messageNode.next = ctrl.head;
              ctrl.head = messageNode;
            }
          }
        }

        function removeMessageNode(parent, comment, key) {
          var messageNode = messages[key];

          // This message node may have already been removed by a call to deregister()
          if (!messageNode) return;

          var match = findPreviousMessage(parent, comment);
          if (match) {
            match.next = messageNode.next;
          } else {
            ctrl.head = messageNode.next;
          }
        }
      }]
    };

    function isAttrTruthy(scope, attr) {
     return (isString(attr) && attr.length === 0) || //empty attribute
            truthy(scope.$eval(attr));
    }

    function truthy(val) {
      return isString(val) ? val.length : !!val;
    }
  }])

  /**
   * @ngdoc directive
   * @name ngMessagesInclude
   * @restrict AE
   * @scope
   *
   * @description
   * `ngMessagesInclude` is a directive with the purpose to import existing ngMessage template
   * code from a remote template and place the downloaded template code into the exact spot
   * that the ngMessagesInclude directive is placed within the ngMessages container. This allows
   * for a series of pre-defined messages to be reused and also allows for the developer to
   * determine what messages are overridden due to the placement of the ngMessagesInclude directive.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression" role="alert">
   *   <ANY ng-messages-include="remoteTplString">...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression" role="alert">
   *   <ng-messages-include src="expressionValue1">...</ng-messages-include>
   * </ng-messages>
   * ```
   *
   * {@link module:ngMessages Click here} to learn more about `ngMessages` and `ngMessage`.
   *
   * @param {string} ngMessagesInclude|src a string value corresponding to the remote template.
   */
  .directive('ngMessagesInclude',
    ['$templateRequest', '$document', '$compile', function($templateRequest, $document, $compile) {

    return {
      restrict: 'AE',
      require: '^^ngMessages', // we only require this for validation sake
      link: function($scope, element, attrs) {
        var src = attrs.ngMessagesInclude || attrs.src;
        $templateRequest(src).then(function(html) {
          if ($scope.$$destroyed) return;

          if (isString(html) && !html.trim()) {
            // Empty template - nothing to compile
            replaceElementWithMarker(element, src);
          } else {
            // Non-empty template - compile and link
            $compile(html)($scope, function(contents) {
              element.after(contents);
              replaceElementWithMarker(element, src);
            });
          }
        });
      }
    };

    // Helpers
    function replaceElementWithMarker(element, src) {
      // A comment marker is placed for debugging purposes
      var comment = $compile.$$createComment ?
          $compile.$$createComment('ngMessagesInclude', src) :
          $document[0].createComment(' ngMessagesInclude: ' + src + ' ');
      var marker = jqLite(comment);
      element.after(marker);

      // Don't pollute the DOM anymore by keeping an empty directive element
      element.remove();
    }
  }])

  /**
   * @ngdoc directive
   * @name ngMessage
   * @restrict AE
   * @scope
   * @priority 1
   *
   * @description
   * `ngMessage` is a directive with the purpose to show and hide a particular message.
   * For `ngMessage` to operate, a parent `ngMessages` directive on a parent DOM element
   * must be situated since it determines which messages are visible based on the state
   * of the provided key/value map that `ngMessages` listens on.
   *
   * More information about using `ngMessage` can be found in the
   * {@link module:ngMessages `ngMessages` module documentation}.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression" role="alert">
   *   <ANY ng-message="stringValue">...</ANY>
   *   <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression" role="alert">
   *   <ng-message when="stringValue">...</ng-message>
   *   <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
   * </ng-messages>
   * ```
   *
   * @param {expression} ngMessage|when a string value corresponding to the message key.
   */
  .directive('ngMessage', ngMessageDirectiveFactory())


  /**
   * @ngdoc directive
   * @name ngMessageExp
   * @restrict AE
   * @priority 1
   * @scope
   *
   * @description
   * `ngMessageExp` is the same as {@link directive:ngMessage `ngMessage`}, but instead of a static
   * value, it accepts an expression to be evaluated for the message key.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression">
   *   <ANY ng-message-exp="expressionValue">...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression">
   *   <ng-message when-exp="expressionValue">...</ng-message>
   * </ng-messages>
   * ```
   *
   * {@link module:ngMessages Click here} to learn more about `ngMessages` and `ngMessage`.
   *
   * @param {expression} ngMessageExp|whenExp an expression value corresponding to the message key.
   */
  .directive('ngMessageExp', ngMessageDirectiveFactory())

  /**
   * @ngdoc directive
   * @name ngMessageDefault
   * @restrict AE
   * @scope
   *
   * @description
   * `ngMessageDefault` is a directive with the purpose to show and hide a default message for
   * {@link directive:ngMessages}, when none of provided messages matches.
   *
   * More information about using `ngMessageDefault` can be found in the
   * {@link module:ngMessages `ngMessages` module documentation}.
   *
   * @usage
   * ```html
   * <!-- using attribute directives -->
   * <ANY ng-messages="expression" role="alert">
   *   <ANY ng-message="stringValue">...</ANY>
   *   <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
   *   <ANY ng-message-default>...</ANY>
   * </ANY>
   *
   * <!-- or by using element directives -->
   * <ng-messages for="expression" role="alert">
   *   <ng-message when="stringValue">...</ng-message>
   *   <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
   *   <ng-message-default>...</ng-message-default>
   * </ng-messages>
   *
  */
  .directive('ngMessageDefault', ngMessageDirectiveFactory(true));

function ngMessageDirectiveFactory(isDefault) {
  return ['$animate', function($animate) {
    return {
      restrict: 'AE',
      transclude: 'element',
      priority: 1, // must run before ngBind, otherwise the text is set on the comment
      terminal: true,
      require: '^^ngMessages',
      link: function(scope, element, attrs, ngMessagesCtrl, $transclude) {
        var commentNode, records, staticExp, dynamicExp;

        if (!isDefault) {
          commentNode = element[0];
          staticExp = attrs.ngMessage || attrs.when;
          dynamicExp = attrs.ngMessageExp || attrs.whenExp;

          var assignRecords = function(items) {
            records = items
                ? (isArray(items)
                      ? items
                      : items.split(/[\s,]+/))
                : null;
            ngMessagesCtrl.reRender();
          };

          if (dynamicExp) {
            assignRecords(scope.$eval(dynamicExp));
            scope.$watchCollection(dynamicExp, assignRecords);
          } else {
            assignRecords(staticExp);
          }
        }

        var currentElement, messageCtrl;
        ngMessagesCtrl.register(commentNode, messageCtrl = {
          test: function(name) {
            return contains(records, name);
          },
          attach: function() {
            if (!currentElement) {
              $transclude(function(elm, newScope) {
                $animate.enter(elm, null, element);
                currentElement = elm;

                // Each time we attach this node to a message we get a new id that we can match
                // when we are destroying the node later.
                var $$attachId = currentElement.$$attachId = ngMessagesCtrl.getAttachId();

                // in the event that the element or a parent element is destroyed
                // by another structural directive then it's time
                // to deregister the message from the controller
                currentElement.on('$destroy', function() {
                  // If the message element was removed via a call to `detach` then `currentElement` will be null
                  // So this handler only handles cases where something else removed the message element.
                  if (currentElement && currentElement.$$attachId === $$attachId) {
                    ngMessagesCtrl.deregister(commentNode, isDefault);
                    messageCtrl.detach();
                  }
                  newScope.$destroy();
                });
              });
            }
          },
          detach: function() {
            if (currentElement) {
              var elm = currentElement;
              currentElement = null;
              $animate.leave(elm);
            }
          }
        }, isDefault);

        // We need to ensure that this directive deregisters itself when it no longer exists
        // Normally this is done when the attached element is destroyed; but if this directive
        // gets removed before we attach the message to the DOM there is nothing to watch
        // in which case we must deregister when the containing scope is destroyed.
        scope.$on('$destroy', function() {
          ngMessagesCtrl.deregister(commentNode, isDefault);
        });
      }
    };
  }];

  function contains(collection, key) {
    if (collection) {
      return isArray(collection)
          ? collection.indexOf(key) >= 0
          : collection.hasOwnProperty(key);
    }
  }
}

describe('ngMessages', function() {
  beforeEach(inject.strictDi());
  beforeEach(module('ngMessages'));

  function messageChildren(element) {
    return (element.length ? element[0] : element).querySelectorAll('[ng-message], [ng-message-exp]');
  }

  function s(str) {
    return str.replace(/\s+/g,'');
  }

  function trim(value) {
    return isString(value) ? value.trim() : value;
  }

  var element;
  afterEach(function() {
    dealoc(element);
  });

  it('should render based off of a hashmap collection', inject(function($rootScope, $compile) {
    element = $compile('<div ng-messages="col">' +
                       '  <div ng-message="val">Message is set</div>' +
                       '</div>')($rootScope);
    $rootScope.$digest();

    expect(element.text()).not.toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { val: true };
    });

    expect(element.text()).toContain('Message is set');
  }));

  it('should render the same message if multiple message keys match', inject(function($rootScope, $compile) {
    element = $compile('<div ng-messages="col">' +
                       '  <div ng-message="one, two, three">Message is set</div>' +
                       '</div>')($rootScope);
    $rootScope.$digest();

    expect(element.text()).not.toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { one: true };
    });

    expect(element.text()).toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { two: true, one: false };
    });

    expect(element.text()).toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { three: true, two: false };
    });

    expect(element.text()).toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { three: false };
    });

    expect(element.text()).not.toContain('Message is set');
  }));

  it('should use the when attribute when an element directive is used',
    inject(function($rootScope, $compile) {

    element = $compile('<ng-messages for="col">' +
                       '  <ng-message when="val">Message is set</div>' +
                       '</ng-messages>')($rootScope);
    $rootScope.$digest();

    expect(element.text()).not.toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { val: true };
    });

    expect(element.text()).toContain('Message is set');
  }));

  it('should render the same message if multiple message keys match based on the when attribute', inject(function($rootScope, $compile) {
    element = $compile('<ng-messages for="col">' +
                       '  <ng-message when=" one two three ">Message is set</div>' +
                       '</ng-messages>')($rootScope);
    $rootScope.$digest();

    expect(element.text()).not.toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { one: true };
    });

    expect(element.text()).toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { two: true, one: false };
    });

    expect(element.text()).toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { three: true, two: false };
    });

    expect(element.text()).toContain('Message is set');

    $rootScope.$apply(function() {
      $rootScope.col = { three: false };
    });

    expect(element.text()).not.toContain('Message is set');
  }));

  it('should allow a dynamic expression to be set when ng-message-exp is used',
    inject(function($rootScope, $compile) {

    element = $compile('<div ng-messages="col">' +
                       '  <div ng-message-exp="variable">Message is crazy</div>' +
                       '</div>')($rootScope);
    $rootScope.$digest();

    expect(element.text()).not.toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.variable = 'error';
      $rootScope.col = { error: true };
    });

    expect(element.text()).toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.col = { error: false, failure: true };
    });

    expect(element.text()).not.toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.variable = ['failure'];
    });

    expect(element.text()).toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.variable = null;
    });

    expect(element.text()).not.toContain('Message is crazy');
  }));

  it('should allow a dynamic expression to be set when the when-exp attribute is used',
    inject(function($rootScope, $compile) {

    element = $compile('<ng-messages for="col">' +
                       '  <ng-message when-exp="variable">Message is crazy</ng-message>' +
                       '</ng-messages>')($rootScope);
    $rootScope.$digest();

    expect(element.text()).not.toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.variable = 'error, failure';
      $rootScope.col = { error: true };
    });

    expect(element.text()).toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.col = { error: false, failure: true };
    });

    expect(element.text()).toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.variable = [];
    });

    expect(element.text()).not.toContain('Message is crazy');

    $rootScope.$apply(function() {
      $rootScope.variable = null;
    });

    expect(element.text()).not.toContain('Message is crazy');
  }));

  they('should render empty when $prop is used as a collection value',
    { 'null': null,
      'false': false,
      '0': 0,
      '[]': [],
      '[{}]': [{}],
      '': '',
      '{ val2 : true }': { val2: true } },
  function(prop) {
    inject(function($rootScope, $compile) {
      element = $compile('<div ng-messages="col">' +
                         '  <div ng-message="val">Message is set</div>' +
                         '</div>')($rootScope);
      $rootScope.$digest();

      $rootScope.$apply(function() {
        $rootScope.col = prop;
      });
      expect(element.text()).not.toContain('Message is set');
    });
  });

  they('should insert and remove matching inner elements when $prop is used as a value',
    { 'true': true,
      '1': 1,
      '{}': {},
      '[]': [],
      '[null]': [null] },
  function(prop) {
    inject(function($rootScope, $compile) {

      element = $compile('<div ng-messages="col">' +
                         '  <div ng-message="blue">This message is blue</div>' +
                         '  <div ng-message="red">This message is red</div>' +
                         '</div>')($rootScope);

      $rootScope.$apply(function() {
        $rootScope.col = {};
      });

      expect(messageChildren(element).length).toBe(0);
      expect(trim(element.text())).toEqual('');

      $rootScope.$apply(function() {
        $rootScope.col = {
          blue: true,
          red: false
        };
      });

      expect(messageChildren(element).length).toBe(1);
      expect(trim(element.text())).toEqual('This message is blue');

      $rootScope.$apply(function() {
        $rootScope.col = {
          red: prop
        };
      });

      expect(messageChildren(element).length).toBe(1);
      expect(trim(element.text())).toEqual('This message is red');

      $rootScope.$apply(function() {
        $rootScope.col = null;
      });
      expect(messageChildren(element).length).toBe(0);
      expect(trim(element.text())).toEqual('');


      $rootScope.$apply(function() {
        $rootScope.col = {
          blue: 0,
          red: null
        };
      });

      expect(messageChildren(element).length).toBe(0);
      expect(trim(element.text())).toEqual('');
    });
  });

  it('should display the elements in the order defined in the DOM',
    inject(function($rootScope, $compile) {

    element = $compile('<div ng-messages="col">' +
                       '  <div ng-message="one">Message#one</div>' +
                       '  <div ng-message="two">Message#two</div>' +
                       '  <div ng-message="three">Message#three</div>' +
                       '</div>')($rootScope);

    $rootScope.$apply(function() {
      $rootScope.col = {
        three: true,
        one: true,
        two: true
      };
    });

    angular.forEach(['one','two','three'], function(key) {
      expect(s(element.text())).toEqual('Message#' + key);

      $rootScope.$apply(function() {
        $rootScope.col[key] = false;
      });
    });

    expect(s(element.text())).toEqual('');
  }));

  it('should add ng-active/ng-inactive CSS classes to the element when errors are/aren\'t displayed',
    inject(function($rootScope, $compile) {

    element = $compile('<div ng-messages="col">' +
                       '  <div ng-message="ready">This message is ready</div>' +
                       '</div>')($rootScope);

    $rootScope.$apply(function() {
      $rootScope.col = {};
    });

    expect(element.hasClass('ng-active')).toBe(false);
    expect(element.hasClass('ng-inactive')).toBe(true);

    $rootScope.$apply(function() {
      $rootScope.col = { ready: true };
    });

    expect(element.hasClass('ng-active')).toBe(true);
    expect(element.hasClass('ng-inactive')).toBe(false);
  }));

  it('should automatically re-render the messages when other directives dynamically change them',
    inject(function($rootScope, $compile) {

    element = $compile('<div ng-messages="col">' +
                       '  <div ng-message="primary">Enter something</div>' +
                       '  <div ng-repeat="item in items">' +
                       '    <div ng-message-exp="item.name">{{ item.text }}</div>' +
                       '  </div>' +
                       '</div>')($rootScope);

    $rootScope.$apply(function() {
      $rootScope.col = {};
      $rootScope.items = [
        { text: 'Your age is incorrect', name: 'age' },
        { text: 'You\'re too tall man!', name: 'height' },
        { text: 'Your hair is too long', name: 'hair' }
      ];
    });

    expect(messageChildren(element).length).toBe(0);
    expect(trim(element.text())).toEqual('');

    $rootScope.$apply(function() {
      $rootScope.col = { hair: true };
    });

    expect(messageChildren(element).length).toBe(1);
    expect(trim(element.text())).toEqual('Your hair is too long');

    $rootScope.$apply(function() {
      $rootScope.col = { age: true, hair: true};
    });

    expect(messageChildren(element).length).toBe(1);
    expect(trim(element.text())).toEqual('Your age is incorrect');

    $rootScope.$apply(function() {
      // remove the age!
      $rootScope.items.shift();
    });

    expect(messageChildren(element).length).toBe(1);
    expect(trim(element.text())).toEqual('Your hair is too long');

    $rootScope.$apply(function() {
      // remove the hair!
      $rootScope.items.length = 0;
      $rootScope.col.primary = true;
    });

    expect(messageChildren(element).length).toBe(1);
    expect(trim(element.text())).toEqual('Enter something');
  }));


  it('should be compatible with ngBind',
    inject(function($rootScope, $compile) {

    element = $compile('<div ng-messages="col">' +
                       '        <div ng-message="required" ng-bind="errorMessages.required"></div>' +
                       '        <div ng-message="extra" ng-bind="errorMessages.extra"></div>' +
                       '</div>')($rootScope);

    $rootScope.$apply(function() {
      $rootScope.col = {
        required: true,
        extra: true
      };
      $rootScope.errorMessages = {
        required: 'Fill in the text field.',
        extra: 'Extra error message.'
      };
    });

    expect(messageChildren(element).length).toBe(1);
    expect(trim(element.text())).toEqual('Fill in the text field.');

    $rootScope.$apply(function() {
      $rootScope.col.required = false;
      $rootScope.col.extra = true;
    });

    expect(messageChildren(element).length).toBe(1);
    expect(trim(element.text())).toEqual('Extra error message.');

    $rootScope.$apply(function() {
      $rootScope.errorMessages.extra = 'New error message.';
    });

    expect(messageChildren(element).length).toBe(1);
    expect(trim(element.text())).toEqual('New error message.');
  }));


  // issue #12856
  it('should only detach the message object that is associated with the message node being removed',
    inject(function($rootScope, $compile, $animate) {

    // We are going to spy on the `leave` method to give us control over
    // when the element is actually removed
    spyOn($animate, 'leave');

    // Create a basic ng-messages set up
    element = $compile('<div ng-messages="col">' +
                       '  <div ng-message="primary">Enter something</div>' +
                       '</div>')($rootScope);

    // Trigger the message to be displayed
    $rootScope.col = { primary: true };
    $rootScope.$digest();
    expect(messageChildren(element).length).toEqual(1);
    var oldMessageNode = messageChildren(element)[0];

    // Remove the message
    $rootScope.col = { primary: undefined };
    $rootScope.$digest();

    // Since we have spied on the `leave` method, the message node is still in the DOM
    expect($animate.leave).toHaveBeenCalledOnce();
    var nodeToRemove = $animate.leave.calls.mostRecent().args[0][0];
    expect(nodeToRemove).toBe(oldMessageNode);
    $animate.leave.calls.reset();

    // Add the message back in
    $rootScope.col = { primary: true };
    $rootScope.$digest();

    // Simulate the animation completing on the node
    jqLite(nodeToRemove).remove();

    // We should not get another call to `leave`
    expect($animate.leave).not.toHaveBeenCalled();

    // There should only be the new message node
    expect(messageChildren(element).length).toEqual(1);
    var newMessageNode = messageChildren(element)[0];
    expect(newMessageNode).not.toBe(oldMessageNode);
  }));

  it('should render animations when the active/inactive classes are added/removed', function() {
    module('ngAnimate');
    module('ngAnimateMock');
    inject(function($rootScope, $compile, $animate) {
      element = $compile('<div ng-messages="col">' +
                         '  <div ng-message="ready">This message is ready</div>' +
                         '</div>')($rootScope);

      $rootScope.$apply(function() {
        $rootScope.col = {};
      });

      var event = $animate.queue.pop();
      expect(event.event).toBe('setClass');
      expect(event.args[1]).toBe('ng-inactive');
      expect(event.args[2]).toBe('ng-active');

      $rootScope.$apply(function() {
        $rootScope.col = { ready: true };
      });

      event = $animate.queue.pop();
      expect(event.event).toBe('setClass');
      expect(event.args[1]).toBe('ng-active');
      expect(event.args[2]).toBe('ng-inactive');
    });
  });

  describe('ngMessage nested nested inside elements', function() {

    it('should not crash or leak memory when the messages are transcluded, the first message is ' +
      'visible, and ngMessages is removed by ngIf', function() {

      module(function($compileProvider) {
        $compileProvider.directive('messageWrap', function() {
          return {
            transclude: true,
            scope: {
              col: '=col'
            },
            template: '<div ng-messages="col"><ng-transclude></ng-transclude></div>'
          };
        });
      });

      inject(function($rootScope, $compile) {

        element = $compile('<div><div ng-if="show"><div message-wrap col="col">' +
                           '        <div ng-message="a">A</div>' +
                           '        <div ng-message="b">B</div>' +
                           '</div></div></div>')($rootScope);

        $rootScope.$apply(function() {
          $rootScope.show = true;
          $rootScope.col = {
            a: true,
            b: true
          };
        });

        expect(messageChildren(element).length).toBe(1);
        expect(trim(element.text())).toEqual('A');

        $rootScope.$apply('show = false');

        expect(messageChildren(element).length).toBe(0);
      });
    });


    it('should not crash when the first of two nested messages is removed', function() {
      inject(function($rootScope, $compile) {

        element = $compile(
          '<div ng-messages="col">' +
            '<div class="wrapper">' +
              '<div remove-me ng-message="a">A</div>' +
              '<div ng-message="b">B</div>' +
            '</div>' +
          '</div>'
        )($rootScope);

        $rootScope.$apply(function() {
          $rootScope.col = {
            a: true,
            b: false
          };
        });

        expect(messageChildren(element).length).toBe(1);
        expect(trim(element.text())).toEqual('A');

        var ctrl = element.controller('ngMessages');
        var deregisterSpy = spyOn(ctrl, 'deregister').and.callThrough();

        var nodeA = element[0].querySelector('[ng-message="a"]');
        jqLite(nodeA).remove();
        $rootScope.$digest(); // The next digest triggers the error

        // Make sure removing the element triggers the deregistration in ngMessages
        expect(trim(deregisterSpy.calls.mostRecent().args[0].nodeValue)).toBe('ngMessage: a');
        expect(messageChildren(element).length).toBe(0);
      });
    });


    it('should not crash, but show deeply nested messages correctly after a message ' +
      'has been removed', function() {
      inject(function($rootScope, $compile) {

        element = $compile(
          '<div ng-messages="col" ng-messages-multiple>' +
            '<div class="another-wrapper">' +
              '<div ng-message="a">A</div>' +
              '<div class="wrapper">' +
                '<div ng-message="b">B</div>' +
                '<div ng-message="c">C</div>' +
              '</div>' +
              '<div ng-message="d">D</div>' +
            '</div>' +
          '</div>'
        )($rootScope);

        $rootScope.$apply(function() {
          $rootScope.col = {
            a: true,
            b: true
          };
        });

        expect(messageChildren(element).length).toBe(2);
        expect(trim(element.text())).toEqual('AB');

        var ctrl = element.controller('ngMessages');
        var deregisterSpy = spyOn(ctrl, 'deregister').and.callThrough();

        var nodeB = element[0].querySelector('[ng-message="b"]');
        jqLite(nodeB).remove();
        $rootScope.$digest(); // The next digest triggers the error

        // Make sure removing the element triggers the deregistration in ngMessages
        expect(trim(deregisterSpy.calls.mostRecent().args[0].nodeValue)).toBe('ngMessage: b');
        expect(messageChildren(element).length).toBe(1);
        expect(trim(element.text())).toEqual('A');
      });
    });
  });


  it('should clean-up the ngMessage scope when a message is removed',
    inject(function($compile, $rootScope) {

      var html =
          '<div ng-messages="items">' +
            '<div ng-message="a">{{forA}}</div>' +
          '</div>';

      element = $compile(html)($rootScope);
      $rootScope.$apply(function() {
        $rootScope.forA = 'A';
        $rootScope.items = {a: true};
      });

      expect(element.text()).toBe('A');
      var watchers = $rootScope.$countWatchers();

      $rootScope.$apply('items.a = false');

      expect(element.text()).toBe('');
      // We don't know exactly how many watchers are on the scope, only that there should be
      // one less now
      expect($rootScope.$countWatchers()).toBe(watchers - 1);
    })
  );

  it('should unregister the ngMessage even if it was never attached',
    inject(function($compile, $rootScope) {
      var html =
        '<div ng-messages="items">' +
          '<div ng-if="show"><div ng-message="x">ERROR</div></div>' +
        '</div>';

      element = $compile(html)($rootScope);

      var ctrl = element.controller('ngMessages');

      expect(messageChildren(element).length).toBe(0);
      expect(Object.keys(ctrl.messages).length).toEqual(0);

      $rootScope.$apply('show = true');
      expect(messageChildren(element).length).toBe(0);
      expect(Object.keys(ctrl.messages).length).toEqual(1);

      $rootScope.$apply('show = false');
      expect(messageChildren(element).length).toBe(0);
      expect(Object.keys(ctrl.messages).length).toEqual(0);
    })
  );


  describe('default message', function() {
    it('should render a default message when no message matches', inject(function($rootScope, $compile) {
      element = $compile('<div ng-messages="col">' +
                         '  <div ng-message="val">Message is set</div>' +
                         '  <div ng-message-default>Default message is set</div>' +
                         '</div>')($rootScope);
      $rootScope.$apply(function() {
        $rootScope.col = { unexpected: false };
      });

      $rootScope.$digest();

      expect(element.text().trim()).toBe('');
      expect(element).not.toHaveClass('ng-active');

      $rootScope.$apply(function() {
        $rootScope.col = { unexpected: true };
      });

      expect(element.text().trim()).toBe('Default message is set');
      expect(element).toHaveClass('ng-active');

      $rootScope.$apply(function() {
        $rootScope.col = { unexpected: false };
      });

      expect(element.text().trim()).toBe('');
      expect(element).not.toHaveClass('ng-active');

      $rootScope.$apply(function() {
        $rootScope.col = { val: true, unexpected: true };
      });

      expect(element.text().trim()).toBe('Message is set');
      expect(element).toHaveClass('ng-active');
    }));

    it('should not render a default message with ng-messages-multiple if another error matches',
      inject(function($rootScope, $compile) {
        element = $compile('<div ng-messages="col" ng-messages-multiple>' +
                           '  <div ng-message="val">Message is set</div>' +
                           '  <div ng-message="other">Other message is set</div>' +
                           '  <div ng-message-default>Default message is set</div>' +
                           '</div>')($rootScope);

        expect(element.text().trim()).toBe('');

        $rootScope.$apply(function() {
          $rootScope.col = { val: true, other: false, unexpected: false };
        });

        expect(element.text().trim()).toBe('Message is set');

        $rootScope.$apply(function() {
          $rootScope.col = { val: true, other: true, unexpected: true };
        });

        expect(element.text().trim()).toBe('Message is set  Other message is set');

        $rootScope.$apply(function() {
          $rootScope.col = { val: false, other: false, unexpected: true };
        });

        expect(element.text().trim()).toBe('Default message is set');
      })
    );

    it('should handle a default message with ngIf', inject(function($rootScope, $compile) {
      element = $compile('<div ng-messages="col">' +
                         '  <div ng-message="val">Message is set</div>' +
                         '  <div ng-if="default" ng-message-default>Default message is set</div>' +
                         '</div>')($rootScope);
      $rootScope.default = true;
      $rootScope.col = {unexpected: true};
      $rootScope.$digest();

      expect(element.text().trim()).toBe('Default message is set');

      $rootScope.$apply('default = false');

      expect(element.text().trim()).toBe('');

      $rootScope.$apply('default = true');

      expect(element.text().trim()).toBe('Default message is set');

      $rootScope.$apply(function() {
        $rootScope.col = { val: true };
      });

      expect(element.text().trim()).toBe('Message is set');
    }));
  });

  describe('when including templates', function() {
    they('should work with a dynamic collection model which is managed by ngRepeat',
      {'<div ng-messages-include="...">': '<div ng-messages="item">' +
                                            '<div ng-messages-include="abc.html"></div>' +
                                          '</div>',
       '<ng-messages-include src="...">': '<ng-messages for="item">' +
                                            '<ng-messages-include src="abc.html"></ng-messages-include>' +
                                          '</ng-messages>'},
    function(html) {
      inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('abc.html', '<div ng-message="a">A</div>' +
                                       '<div ng-message="b">B</div>' +
                                       '<div ng-message="c">C</div>');

        html = '<div><div ng-repeat="item in items">' + html + '</div></div>';
        $rootScope.items = [{},{},{}];

        element = $compile(html)($rootScope);
        $rootScope.$apply(function() {
          $rootScope.items[0].a = true;
          $rootScope.items[1].b = true;
          $rootScope.items[2].c = true;
        });

        var elements = element[0].querySelectorAll('[ng-repeat]');

        // all three collections should have at least one error showing up
        expect(messageChildren(element).length).toBe(3);
        expect(messageChildren(elements[0]).length).toBe(1);
        expect(messageChildren(elements[1]).length).toBe(1);
        expect(messageChildren(elements[2]).length).toBe(1);

        // this is the standard order of the displayed error messages
        expect(element.text().trim()).toBe('ABC');

        $rootScope.$apply(function() {
          $rootScope.items[0].a = false;
          $rootScope.items[0].c = true;

          $rootScope.items[1].b = false;

          $rootScope.items[2].c = false;
          $rootScope.items[2].a = true;
        });

        // with the 2nd item gone and the values changed
        // we should see both 1 and 3 changed
        expect(element.text().trim()).toBe('CA');

        $rootScope.$apply(function() {
          // add the value for the 2nd item back
          $rootScope.items[1].b = true;
          $rootScope.items.reverse();
        });

        // when reversed we get back to our original value
        expect(element.text().trim()).toBe('ABC');
      });
    });

    they('should remove the $prop element and place a comment anchor node where it used to be',
      {'<div ng-messages-include="...">': '<div ng-messages="data">' +
                                            '<div ng-messages-include="abc.html"></div>' +
                                          '</div>',
       '<ng-messages-include src="...">': '<ng-messages for="data">' +
                                            '<ng-messages-include src="abc.html"></ng-messages-include>' +
                                          '</ng-messages>'},
    function(html) {
      inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('abc.html', '<div></div>');

        element = $compile(html)($rootScope);
        $rootScope.$digest();

        var includeElement = element[0].querySelector('[ng-messages-include], ng-messages-include');
        expect(includeElement).toBeFalsy();

        var comment = element[0].childNodes[0];
        expect(comment.nodeType).toBe(8);
        expect(comment.nodeValue).toBe(' ngMessagesInclude: abc.html ');
      });
    });

    they('should load a remote template using $prop',
      {'<div ng-messages-include="...">': '<div ng-messages="data">' +
                                            '<div ng-messages-include="abc.html"></div>' +
                                          '</div>',
       '<ng-messages-include src="...">': '<ng-messages for="data">' +
                                            '<ng-messages-include src="abc.html"></ng-messages-include>' +
                                          '</ng-messages>'},
    function(html) {
      inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('abc.html', '<div ng-message="a">A</div>' +
                                       '<div ng-message="b">B</div>' +
                                       '<div ng-message="c">C</div>');

        element = $compile(html)($rootScope);
        $rootScope.$apply(function() {
          $rootScope.data = {
            'a': 1,
            'b': 2,
            'c': 3
          };
        });

        expect(messageChildren(element).length).toBe(1);
        expect(trim(element.text())).toEqual('A');

        $rootScope.$apply(function() {
          $rootScope.data = {
            'c': 3
          };
        });

        expect(messageChildren(element).length).toBe(1);
        expect(trim(element.text())).toEqual('C');
      });
    });

    it('should cache the template after download',
      inject(function($rootScope, $compile, $templateCache, $httpBackend) {

      $httpBackend.expect('GET', 'tpl').respond(201, '<div>abc</div>');

      expect($templateCache.get('tpl')).toBeUndefined();

      element = $compile('<div ng-messages="data"><div ng-messages-include="tpl"></div></div>')($rootScope);

      $rootScope.$digest();
      $httpBackend.flush();

      expect($templateCache.get('tpl')).toBeDefined();
    }));

    it('should re-render the messages after download without an extra digest',
      inject(function($rootScope, $compile, $httpBackend) {

      $httpBackend.expect('GET', 'my-messages').respond(201,
        '<div ng-message="required">You did not enter a value</div>');

      element = $compile('<div ng-messages="data">' +
                         '  <div ng-messages-include="my-messages"></div>' +
                         '  <div ng-message="failed">Your value is that of failure</div>' +
                         '</div>')($rootScope);

      $rootScope.data = {
        required: true,
        failed: true
      };

      $rootScope.$digest();

      expect(messageChildren(element).length).toBe(1);
      expect(trim(element.text())).toEqual('Your value is that of failure');

      $httpBackend.flush();
      $rootScope.$digest();

      expect(messageChildren(element).length).toBe(1);
      expect(trim(element.text())).toEqual('You did not enter a value');
    }));

    it('should allow for overriding the remote template messages within the element depending on where the remote template is placed',
      inject(function($compile, $rootScope, $templateCache) {

      $templateCache.put('abc.html', '<div ng-message="a">A</div>' +
                                     '<div ng-message="b">B</div>' +
                                     '<div ng-message="c">C</div>');

      element = $compile('<div ng-messages="data">' +
                         '  <div ng-message="a">AAA</div>' +
                         '  <div ng-messages-include="abc.html"></div>' +
                         '  <div ng-message="c">CCC</div>' +
                         '</div>')($rootScope);

      $rootScope.$apply(function() {
        $rootScope.data = {
          'a': 1,
          'b': 2,
          'c': 3
        };
      });

      expect(messageChildren(element).length).toBe(1);
      expect(trim(element.text())).toEqual('AAA');

      $rootScope.$apply(function() {
        $rootScope.data = {
          'b': 2,
          'c': 3
        };
      });

      expect(messageChildren(element).length).toBe(1);
      expect(trim(element.text())).toEqual('B');

      $rootScope.$apply(function() {
        $rootScope.data = {
          'c': 3
        };
      });

      expect(messageChildren(element).length).toBe(1);
      expect(trim(element.text())).toEqual('C');
    }));

    it('should properly detect a previous message, even if it was registered later',
      inject(function($compile, $rootScope, $templateCache) {
        $templateCache.put('include.html', '<div ng-message="a">A</div>');
        var html =
            '<div ng-messages="items">' +
              '<div ng-include="\'include.html\'"></div>' +
              '<div ng-message="b">B</div>' +
              '<div ng-message="c">C</div>' +
            '</div>';

        element = $compile(html)($rootScope);
        $rootScope.$apply('items = {b: true, c: true}');

        expect(element.text()).toBe('B');

        var ctrl = element.controller('ngMessages');
        var deregisterSpy = spyOn(ctrl, 'deregister').and.callThrough();

        var nodeB = element[0].querySelector('[ng-message="b"]');
        jqLite(nodeB).remove();

        // Make sure removing the element triggers the deregistration in ngMessages
        expect(trim(deregisterSpy.calls.mostRecent().args[0].nodeValue)).toBe('ngMessage: b');

        $rootScope.$apply('items.a = true');

        expect(element.text()).toBe('A');
      })
    );

    it('should not throw if scope has been destroyed when template request is ready',
      inject(function($rootScope, $httpBackend, $compile) {
        $httpBackend.expectGET('messages.html').respond('<div ng-message="a">A</div>');
        $rootScope.show = true;
        var html =
            '<div ng-if="show">' +
              '<div ng-messages="items">' +
                '<div ng-messages-include="messages.html"></div>' +
              '</div>' +
            '</div>';

        element = $compile(html)($rootScope);
        $rootScope.$digest();
        $rootScope.show = false;
        $rootScope.$digest();
        expect(function() {
          $httpBackend.flush();
        }).not.toThrow();
    }));

    it('should not throw if the template is empty',
      inject(function($compile, $rootScope, $templateCache) {
        var html =
            '<div ng-messages="items">' +
              '<div ng-messages-include="messages1.html"></div>' +
              '<div ng-messages-include="messages2.html"></div>' +
            '</div>';

        $templateCache.put('messages1.html', '');
        $templateCache.put('messages2.html', '   ');
        element = $compile(html)($rootScope);
        $rootScope.$digest();

        expect(element.text()).toBe('');
        expect(element.children().length).toBe(0);
        expect(element.contents().length).toBe(2);
      })
    );
  });

  describe('when multiple', function() {
    they('should show all truthy messages when the $prop attr is present',
      { 'multiple': 'multiple',
        'ng-messages-multiple': 'ng-messages-multiple' },
    function(prop) {
      inject(function($rootScope, $compile) {
        element = $compile('<div ng-messages="data" ' + prop + '>' +
                           '  <div ng-message="one">1</div>' +
                           '  <div ng-message="two">2</div>' +
                           '  <div ng-message="three">3</div>' +
                           '</div>')($rootScope);

        $rootScope.$apply(function() {
          $rootScope.data = {
            'one': true,
            'two': false,
            'three': true
          };
        });

        expect(messageChildren(element).length).toBe(2);
        expect(s(element.text())).toContain('13');
      });
    });

    it('should render all truthy messages from a remote template',
      inject(function($rootScope, $compile, $templateCache) {

      $templateCache.put('xyz.html', '<div ng-message="x">X</div>' +
                                     '<div ng-message="y">Y</div>' +
                                     '<div ng-message="z">Z</div>');

      element = $compile('<div ng-messages="data" ng-messages-multiple="true">' +
                           '<div ng-messages-include="xyz.html"></div>' +
                         '</div>')($rootScope);

      $rootScope.$apply(function() {
        $rootScope.data = {
          'x': 'a',
          'y': null,
          'z': true
        };
      });

      expect(messageChildren(element).length).toBe(2);
      expect(s(element.text())).toEqual('XZ');

      $rootScope.$apply(function() {
        $rootScope.data.y = {};
      });

      expect(messageChildren(element).length).toBe(3);
      expect(s(element.text())).toEqual('XYZ');
    }));

    it('should render and override all truthy messages from a remote template',
      inject(function($rootScope, $compile, $templateCache) {

      $templateCache.put('xyz.html', '<div ng-message="x">X</div>' +
                                     '<div ng-message="y">Y</div>' +
                                     '<div ng-message="z">Z</div>');

      element = $compile('<div ng-messages="data" ng-messages-multiple="true">' +
                            '<div ng-message="y">YYY</div>' +
                            '<div ng-message="z">ZZZ</div>' +
                            '<div ng-messages-include="xyz.html"></div>' +
                         '</div>')($rootScope);

      $rootScope.$apply(function() {
        $rootScope.data = {
          'x': 'a',
          'y': null,
          'z': true
        };
      });

      expect(messageChildren(element).length).toBe(2);
      expect(s(element.text())).toEqual('ZZZX');

      $rootScope.$apply(function() {
        $rootScope.data.y = {};
      });

      expect(messageChildren(element).length).toBe(3);
      expect(s(element.text())).toEqual('YYYZZZX');
    }));
  });
});


})(window, window.angular);
