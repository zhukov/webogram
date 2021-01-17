/**
 * @license AngularJS v1.7.8
 * (c) 2010-2018 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *     Any commits to this file should be reviewed with security in mind.  *
 *   Changes to this file can potentially create security vulnerabilities. *
 *          An approval from 2 Core members with history of modifying      *
 *                         this file is required.                          *
 *                                                                         *
 *  Does the change somehow allow for arbitrary javascript to be executed? *
 *    Or allows for someone to change the prototype of built-in objects?   *
 *     Or gives undesired access to variables likes document or window?    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $sanitizeMinErr = angular.$$minErr('$sanitize');
var bind;
var extend;
var forEach;
var isArray;
var isDefined;
var lowercase;
var noop;
var nodeContains;
var htmlParser;
var htmlSanitizeWriter;

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   Sanitizes an html string by stripping all potentially dangerous tokens.
 *
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to a properly escaped HTML string. This means that no unsafe input can make
 *   it into the returned string.
 *
 *   The whitelist for URL sanitization of attribute values is configured using the functions
 *   `aHrefSanitizationWhitelist` and `imgSrcSanitizationWhitelist` of {@link $compileProvider}.
 *
 *   The input may also contain SVG markup if this is enabled via {@link $sanitizeProvider}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 * @example
   <example module="sanitizeExample" deps="angular-sanitize.js" name="sanitize-service">
   <file name="index.html">
     <script>
         angular.module('sanitizeExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */


/**
 * @ngdoc provider
 * @name $sanitizeProvider
 * @this
 *
 * @description
 * Creates and configures {@link $sanitize} instance.
 */
function $SanitizeProvider() {
  var hasBeenInstantiated = false;
  var svgEnabled = false;

  this.$get = ['$$sanitizeUri', function($$sanitizeUri) {
    hasBeenInstantiated = true;
    if (svgEnabled) {
      extend(validElements, svgElements);
    }
    return function(html) {
      var buf = [];
      htmlParser(html, htmlSanitizeWriter(buf, function(uri, isImage) {
        return !/^unsafe:/.test($$sanitizeUri(uri, isImage));
      }));
      return buf.join('');
    };
  }];


  /**
   * @ngdoc method
   * @name $sanitizeProvider#enableSvg
   * @kind function
   *
   * @description
   * Enables a subset of svg to be supported by the sanitizer.
   *
   * <div class="alert alert-warning">
   *   <p>By enabling this setting without taking other precautions, you might expose your
   *   application to click-hijacking attacks. In these attacks, sanitized svg elements could be positioned
   *   outside of the containing element and be rendered over other elements on the page (e.g. a login
   *   link). Such behavior can then result in phishing incidents.</p>
   *
   *   <p>To protect against these, explicitly setup `overflow: hidden` css rule for all potential svg
   *   tags within the sanitized content:</p>
   *
   *   <br>
   *
   *   <pre><code>
   *   .rootOfTheIncludedContent svg {
   *     overflow: hidden !important;
   *   }
   *   </code></pre>
   * </div>
   *
   * @param {boolean=} flag Enable or disable SVG support in the sanitizer.
   * @returns {boolean|$sanitizeProvider} Returns the currently configured value if called
   *    without an argument or self for chaining otherwise.
   */
  this.enableSvg = function(enableSvg) {
    if (isDefined(enableSvg)) {
      svgEnabled = enableSvg;
      return this;
    } else {
      return svgEnabled;
    }
  };


  /**
   * @ngdoc method
   * @name $sanitizeProvider#addValidElements
   * @kind function
   *
   * @description
   * Extends the built-in lists of valid HTML/SVG elements, i.e. elements that are considered safe
   * and are not stripped off during sanitization. You can extend the following lists of elements:
   *
   * - `htmlElements`: A list of elements (tag names) to extend the current list of safe HTML
   *   elements. HTML elements considered safe will not be removed during sanitization. All other
   *   elements will be stripped off.
   *
   * - `htmlVoidElements`: This is similar to `htmlElements`, but marks the elements as
   *   "void elements" (similar to HTML
   *   [void elements](https://rawgit.com/w3c/html/html5.1-2/single-page.html#void-elements)). These
   *   elements have no end tag and cannot have content.
   *
   * - `svgElements`: This is similar to `htmlElements`, but for SVG elements. This list is only
   *   taken into account if SVG is {@link ngSanitize.$sanitizeProvider#enableSvg enabled} for
   *   `$sanitize`.
   *
   * <div class="alert alert-info">
   *   This method must be called during the {@link angular.Module#config config} phase. Once the
   *   `$sanitize` service has been instantiated, this method has no effect.
   * </div>
   *
   * <div class="alert alert-warning">
   *   Keep in mind that extending the built-in lists of elements may expose your app to XSS or
   *   other vulnerabilities. Be very mindful of the elements you add.
   * </div>
   *
   * @param {Array<String>|Object} elements - A list of valid HTML elements or an object with one or
   *   more of the following properties:
   *   - **htmlElements** - `{Array<String>}` - A list of elements to extend the current list of
   *     HTML elements.
   *   - **htmlVoidElements** - `{Array<String>}` - A list of elements to extend the current list of
   *     void HTML elements; i.e. elements that do not have an end tag.
   *   - **svgElements** - `{Array<String>}` - A list of elements to extend the current list of SVG
   *     elements. The list of SVG elements is only taken into account if SVG is
   *     {@link ngSanitize.$sanitizeProvider#enableSvg enabled} for `$sanitize`.
   *
   * Passing an array (`[...]`) is equivalent to passing `{htmlElements: [...]}`.
   *
   * @return {$sanitizeProvider} Returns self for chaining.
   */
  this.addValidElements = function(elements) {
    if (!hasBeenInstantiated) {
      if (isArray(elements)) {
        elements = {htmlElements: elements};
      }

      addElementsTo(svgElements, elements.svgElements);
      addElementsTo(voidElements, elements.htmlVoidElements);
      addElementsTo(validElements, elements.htmlVoidElements);
      addElementsTo(validElements, elements.htmlElements);
    }

    return this;
  };


  /**
   * @ngdoc method
   * @name $sanitizeProvider#addValidAttrs
   * @kind function
   *
   * @description
   * Extends the built-in list of valid attributes, i.e. attributes that are considered safe and are
   * not stripped off during sanitization.
   *
   * **Note**:
   * The new attributes will not be treated as URI attributes, which means their values will not be
   * sanitized as URIs using `$compileProvider`'s
   * {@link ng.$compileProvider#aHrefSanitizationWhitelist aHrefSanitizationWhitelist} and
   * {@link ng.$compileProvider#imgSrcSanitizationWhitelist imgSrcSanitizationWhitelist}.
   *
   * <div class="alert alert-info">
   *   This method must be called during the {@link angular.Module#config config} phase. Once the
   *   `$sanitize` service has been instantiated, this method has no effect.
   * </div>
   *
   * <div class="alert alert-warning">
   *   Keep in mind that extending the built-in list of attributes may expose your app to XSS or
   *   other vulnerabilities. Be very mindful of the attributes you add.
   * </div>
   *
   * @param {Array<String>} attrs - A list of valid attributes.
   *
   * @returns {$sanitizeProvider} Returns self for chaining.
   */
  this.addValidAttrs = function(attrs) {
    if (!hasBeenInstantiated) {
      extend(validAttrs, arrayToMap(attrs, true));
    }
    return this;
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Private stuff
  //////////////////////////////////////////////////////////////////////////////////////////////////

  bind = angular.bind;
  extend = angular.extend;
  forEach = angular.forEach;
  isArray = angular.isArray;
  isDefined = angular.isDefined;
  lowercase = angular.$$lowercase;
  noop = angular.noop;

  htmlParser = htmlParserImpl;
  htmlSanitizeWriter = htmlSanitizeWriterImpl;

  nodeContains = window.Node.prototype.contains || /** @this */ function(arg) {
    // eslint-disable-next-line no-bitwise
    return !!(this.compareDocumentPosition(arg) & 16);
  };

  // Regular Expressions for parsing tags and attributes
  var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
    // Match everything outside of normal chars and " (quote character)
    NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g;


  // Good source of info about elements and attributes
  // http://dev.w3.org/html5/spec/Overview.html#semantics
  // http://simon.html5.org/html-elements

  // Safe Void Elements - HTML5
  // http://dev.w3.org/html5/spec/Overview.html#void-elements
  var voidElements = stringToMap('area,br,col,hr,img,wbr');

  // Elements that you can, intentionally, leave open (and which close themselves)
  // http://dev.w3.org/html5/spec/Overview.html#optional-tags
  var optionalEndTagBlockElements = stringToMap('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr'),
      optionalEndTagInlineElements = stringToMap('rp,rt'),
      optionalEndTagElements = extend({},
                                              optionalEndTagInlineElements,
                                              optionalEndTagBlockElements);

  // Safe Block Elements - HTML5
  var blockElements = extend({}, optionalEndTagBlockElements, stringToMap('address,article,' +
          'aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
          'h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,section,table,ul'));

  // Inline Elements - HTML5
  var inlineElements = extend({}, optionalEndTagInlineElements, stringToMap('a,abbr,acronym,b,' +
          'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,' +
          'samp,small,span,strike,strong,sub,sup,time,tt,u,var'));

  // SVG Elements
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
  // Note: the elements animate,animateColor,animateMotion,animateTransform,set are intentionally omitted.
  // They can potentially allow for arbitrary javascript to be executed. See #11290
  var svgElements = stringToMap('circle,defs,desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,' +
          'hkern,image,linearGradient,line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,' +
          'radialGradient,rect,stop,svg,switch,text,title,tspan');

  // Blocked Elements (will be stripped)
  var blockedElements = stringToMap('script,style');

  var validElements = extend({},
                                     voidElements,
                                     blockElements,
                                     inlineElements,
                                     optionalEndTagElements);

  //Attributes that have href and hence need to be sanitized
  var uriAttrs = stringToMap('background,cite,href,longdesc,src,xlink:href,xml:base');

  var htmlAttrs = stringToMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
      'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
      'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
      'scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type,' +
      'valign,value,vspace,width');

  // SVG attributes (without "id" and "name" attributes)
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
  var svgAttrs = stringToMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
      'baseProfile,bbox,begin,by,calcMode,cap-height,class,color,color-rendering,content,' +
      'cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,font-size,font-stretch,' +
      'font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,gradientUnits,hanging,' +
      'height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,keySplines,keyTimes,lang,' +
      'marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mathematical,' +
      'max,min,offset,opacity,orient,origin,overline-position,overline-thickness,panose-1,' +
      'path,pathLength,points,preserveAspectRatio,r,refX,refY,repeatCount,repeatDur,' +
      'requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,stemv,stop-color,' +
      'stop-opacity,strikethrough-position,strikethrough-thickness,stroke,stroke-dasharray,' +
      'stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,' +
      'stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,underline-position,' +
      'underline-thickness,unicode,unicode-range,units-per-em,values,version,viewBox,visibility,' +
      'width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,xlink:show,xlink:title,' +
      'xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,zoomAndPan', true);

  var validAttrs = extend({},
                                  uriAttrs,
                                  svgAttrs,
                                  htmlAttrs);

  function stringToMap(str, lowercaseKeys) {
    return arrayToMap(str.split(','), lowercaseKeys);
  }

  function arrayToMap(items, lowercaseKeys) {
    var obj = {}, i;
    for (i = 0; i < items.length; i++) {
      obj[lowercaseKeys ? lowercase(items[i]) : items[i]] = true;
    }
    return obj;
  }

  function addElementsTo(elementsMap, newElements) {
    if (newElements && newElements.length) {
      extend(elementsMap, arrayToMap(newElements));
    }
  }

  /**
   * Create an inert document that contains the dirty HTML that needs sanitizing
   * Depending upon browser support we use one of three strategies for doing this.
   * Support: Safari 10.x -> XHR strategy
   * Support: Firefox -> DomParser strategy
   */
  var getInertBodyElement /* function(html: string): HTMLBodyElement */ = (function(window, document) {
    var inertDocument;
    if (document && document.implementation) {
      inertDocument = document.implementation.createHTMLDocument('inert');
    } else {
      throw $sanitizeMinErr('noinert', 'Can\'t create an inert html document');
    }
    var inertBodyElement = (inertDocument.documentElement || inertDocument.getDocumentElement()).querySelector('body');

    // Check for the Safari 10.1 bug - which allows JS to run inside the SVG G element
    inertBodyElement.innerHTML = '<svg><g onload="this.parentNode.remove()"></g></svg>';
    if (!inertBodyElement.querySelector('svg')) {
      return getInertBodyElement_XHR;
    } else {
      // Check for the Firefox bug - which prevents the inner img JS from being sanitized
      inertBodyElement.innerHTML = '<svg><p><style><img src="</style><img src=x onerror=alert(1)//">';
      if (inertBodyElement.querySelector('svg img')) {
        return getInertBodyElement_DOMParser;
      } else {
        return getInertBodyElement_InertDocument;
      }
    }

    function getInertBodyElement_XHR(html) {
      // We add this dummy element to ensure that the rest of the content is parsed as expected
      // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the `<head>` tag.
      html = '<remove></remove>' + html;
      try {
        html = encodeURI(html);
      } catch (e) {
        return undefined;
      }
      var xhr = new window.XMLHttpRequest();
      xhr.responseType = 'document';
      xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
      xhr.send(null);
      var body = xhr.response.body;
      body.firstChild.remove();
      return body;
    }

    function getInertBodyElement_DOMParser(html) {
      // We add this dummy element to ensure that the rest of the content is parsed as expected
      // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the `<head>` tag.
      html = '<remove></remove>' + html;
      try {
        var body = new window.DOMParser().parseFromString(html, 'text/html').body;
        body.firstChild.remove();
        return body;
      } catch (e) {
        return undefined;
      }
    }

    function getInertBodyElement_InertDocument(html) {
      inertBodyElement.innerHTML = html;

      // Support: IE 9-11 only
      // strip custom-namespaced attributes on IE<=11
      if (document.documentMode) {
        stripCustomNsAttrs(inertBodyElement);
      }

      return inertBodyElement;
    }
  })(window, window.document);

  /**
   * @example
   * htmlParser(htmlString, {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * });
   *
   * @param {string} html string
   * @param {object} handler
   */
  function htmlParserImpl(html, handler) {
    if (html === null || html === undefined) {
      html = '';
    } else if (typeof html !== 'string') {
      html = '' + html;
    }

    var inertBodyElement = getInertBodyElement(html);
    if (!inertBodyElement) return '';

    //mXSS protection
    var mXSSAttempts = 5;
    do {
      if (mXSSAttempts === 0) {
        throw $sanitizeMinErr('uinput', 'Failed to sanitize html because the input is unstable');
      }
      mXSSAttempts--;

      // trigger mXSS if it is going to happen by reading and writing the innerHTML
      html = inertBodyElement.innerHTML;
      inertBodyElement = getInertBodyElement(html);
    } while (html !== inertBodyElement.innerHTML);

    var node = inertBodyElement.firstChild;
    while (node) {
      switch (node.nodeType) {
        case 1: // ELEMENT_NODE
          handler.start(node.nodeName.toLowerCase(), attrToMap(node.attributes));
          break;
        case 3: // TEXT NODE
          handler.chars(node.textContent);
          break;
      }

      var nextNode;
      if (!(nextNode = node.firstChild)) {
        if (node.nodeType === 1) {
          handler.end(node.nodeName.toLowerCase());
        }
        nextNode = getNonDescendant('nextSibling', node);
        if (!nextNode) {
          while (nextNode == null) {
            node = getNonDescendant('parentNode', node);
            if (node === inertBodyElement) break;
            nextNode = getNonDescendant('nextSibling', node);
            if (node.nodeType === 1) {
              handler.end(node.nodeName.toLowerCase());
            }
          }
        }
      }
      node = nextNode;
    }

    while ((node = inertBodyElement.firstChild)) {
      inertBodyElement.removeChild(node);
    }
  }

  function attrToMap(attrs) {
    var map = {};
    for (var i = 0, ii = attrs.length; i < ii; i++) {
      var attr = attrs[i];
      map[attr.name] = attr.value;
    }
    return map;
  }


  /**
   * Escapes all potentially dangerous characters, so that the
   * resulting string can be safely inserted into attribute or
   * element text.
   * @param value
   * @returns {string} escaped text
   */
  function encodeEntities(value) {
    return value.
      replace(/&/g, '&amp;').
      replace(SURROGATE_PAIR_REGEXP, function(value) {
        var hi = value.charCodeAt(0);
        var low = value.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
      }).
      replace(NON_ALPHANUMERIC_REGEXP, function(value) {
        return '&#' + value.charCodeAt(0) + ';';
      }).
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;');
  }

  /**
   * create an HTML/XML writer which writes to buffer
   * @param {Array} buf use buf.join('') to get out sanitized html string
   * @returns {object} in the form of {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * }
   */
  function htmlSanitizeWriterImpl(buf, uriValidator) {
    var ignoreCurrentElement = false;
    var out = bind(buf, buf.push);
    return {
      start: function(tag, attrs) {
        tag = lowercase(tag);
        if (!ignoreCurrentElement && blockedElements[tag]) {
          ignoreCurrentElement = tag;
        }
        if (!ignoreCurrentElement && validElements[tag] === true) {
          out('<');
          out(tag);
          forEach(attrs, function(value, key) {
            var lkey = lowercase(key);
            var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
            if (validAttrs[lkey] === true &&
              (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
              out(' ');
              out(key);
              out('="');
              out(encodeEntities(value));
              out('"');
            }
          });
          out('>');
        }
      },
      end: function(tag) {
        tag = lowercase(tag);
        if (!ignoreCurrentElement && validElements[tag] === true && voidElements[tag] !== true) {
          out('</');
          out(tag);
          out('>');
        }
        // eslint-disable-next-line eqeqeq
        if (tag == ignoreCurrentElement) {
          ignoreCurrentElement = false;
        }
      },
      chars: function(chars) {
        if (!ignoreCurrentElement) {
          out(encodeEntities(chars));
        }
      }
    };
  }


  /**
   * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1' attribute to declare
   * ns1 namespace and prefixes the attribute with 'ns1' (e.g. 'ns1:xlink:foo'). This is undesirable since we don't want
   * to allow any of these custom attributes. This method strips them all.
   *
   * @param node Root element to process
   */
  function stripCustomNsAttrs(node) {
    while (node) {
      if (node.nodeType === window.Node.ELEMENT_NODE) {
        var attrs = node.attributes;
        for (var i = 0, l = attrs.length; i < l; i++) {
          var attrNode = attrs[i];
          var attrName = attrNode.name.toLowerCase();
          if (attrName === 'xmlns:ns1' || attrName.lastIndexOf('ns1:', 0) === 0) {
            node.removeAttributeNode(attrNode);
            i--;
            l--;
          }
        }
      }

      var nextNode = node.firstChild;
      if (nextNode) {
        stripCustomNsAttrs(nextNode);
      }

      node = getNonDescendant('nextSibling', node);
    }
  }

  function getNonDescendant(propName, node) {
    // An element is clobbered if its `propName` property points to one of its descendants
    var nextNode = node[propName];
    if (nextNode && nodeContains.call(node, nextNode)) {
      throw $sanitizeMinErr('elclob', 'Failed to sanitize html because the element is clobbered: {0}', node.outerHTML || node.outerText);
    }
    return nextNode;
  }
}

function sanitizeText(chars) {
  var buf = [];
  var writer = htmlSanitizeWriter(buf, noop);
  writer.chars(chars);
  return buf.join('');
}


// define ngSanitize module and register $sanitize service
angular.module('ngSanitize', [])
  .provider('$sanitize', $SanitizeProvider)
  .info({ angularVersion: '1.7.8' });

/**
 * @ngdoc filter
 * @name linky
 * @kind function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports `http/https/ftp/sftp/mailto` and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} [target] Window (`_blank|_self|_parent|_top`) or named frame to open links in.
 * @param {object|function(url)} [attributes] Add custom attributes to the link element.
 *
 *    Can be one of:
 *
 *    - `object`: A map of attributes
 *    - `function`: Takes the url as a parameter and returns a map of attributes
 *
 *    If the map of attributes contains a value for `target`, it overrides the value of
 *    the target parameter.
 *
 *
 * @returns {string} Html-linkified and {@link $sanitize sanitized} text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="linkyExample" deps="angular-sanitize.js" name="linky-filter">
     <file name="index.html">
       <div ng-controller="ExampleController">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <th>Filter</th>
           <th>Source</th>
           <th>Rendered</th>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="linky-custom-attributes">
          <td>linky custom attributes</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="script.js">
       angular.module('linkyExample', ['ngSanitize'])
         .controller('ExampleController', ['$scope', function($scope) {
           $scope.snippet =
             'Pretty text with some links:\n' +
             'http://angularjs.org/,\n' +
             'mailto:us@somewhere.org,\n' +
             'another@somewhere.org,\n' +
             'and one more: ftp://127.0.0.1/.';
           $scope.snippetWithSingleURL = 'http://angularjs.org/';
         }]);
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithSingleURL | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });

       it('should optionally add custom attributes', function() {
        expect(element(by.id('linky-custom-attributes')).
            element(by.binding("snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-custom-attributes a')).getAttribute('rel')).toEqual('nofollow');
       });
     </file>
   </example>
 */
angular.module('ngSanitize').filter('linky', ['$sanitize', function($sanitize) {
  var LINKY_URL_REGEXP =
        /((s?ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"\u201d\u2019]/i,
      MAILTO_REGEXP = /^mailto:/i;

  var linkyMinErr = angular.$$minErr('linky');
  var isDefined = angular.isDefined;
  var isFunction = angular.isFunction;
  var isObject = angular.isObject;
  var isString = angular.isString;

  return function(text, target, attributes) {
    if (text == null || text === '') return text;
    if (!isString(text)) throw linkyMinErr('notstring', 'Expected string but received: {0}', text);

    var attributesFn =
      isFunction(attributes) ? attributes :
      isObject(attributes) ? function getAttributesObject() {return attributes;} :
      function getEmptyAttributesObject() {return {};};

    var match;
    var raw = text;
    var html = [];
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/www/mailto then assume mailto
      if (!match[2] && !match[4]) {
        url = (match[3] ? 'http://' : 'mailto:') + url;
      }
      i = match.index;
      addText(raw.substr(0, i));
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));
      raw = raw.substring(i + match[0].length);
    }
    addText(raw);
    return $sanitize(html.join(''));

    function addText(text) {
      if (!text) {
        return;
      }
      html.push(sanitizeText(text));
    }

    function addLink(url, text) {
      var key, linkAttributes = attributesFn(url);
      html.push('<a ');

      for (key in linkAttributes) {
        html.push(key + '="' + linkAttributes[key] + '" ');
      }

      if (isDefined(target) && !('target' in linkAttributes)) {
        html.push('target="',
                  target,
                  '" ');
      }
      html.push('href="',
                url.replace(/"/g, '&quot;'),
                '">');
      addText(text);
      html.push('</a>');
    }
  };
}]);

describe('ngBindHtml', function() {
  beforeEach(module('ngSanitize'));

  it('should set html', inject(function($rootScope, $compile) {
    var element = $compile('<div ng-bind-html="html"></div>')($rootScope);
    $rootScope.html = '<div unknown>hello</div>';
    $rootScope.$digest();
    expect(lowercase(element.html())).toEqual('<div>hello</div>');
  }));


  it('should reset html when value is null or undefined', inject(function($compile, $rootScope) {
    var element = $compile('<div ng-bind-html="html"></div>')($rootScope);

    angular.forEach([null, undefined, ''], function(val) {
      $rootScope.html = 'some val';
      $rootScope.$digest();
      expect(lowercase(element.html())).toEqual('some val');

      $rootScope.html = val;
      $rootScope.$digest();
      expect(lowercase(element.html())).toEqual('');
    });
  }));
});

describe('linky', function() {
  var linky;

  beforeEach(module('ngSanitize'));

  beforeEach(inject(function($filter) {
    linky = $filter('linky');
  }));

  it('should do basic filter', function() {
    expect(linky('http://ab/ (http://a/) <http://a/> http://1.2/v:~-123. c “http://example.com” ‘http://me.com’')).
      toEqual('<a href="http://ab/">http://ab/</a> ' +
              '(<a href="http://a/">http://a/</a>) ' +
              '&lt;<a href="http://a/">http://a/</a>&gt; ' +
              '<a href="http://1.2/v:~-123">http://1.2/v:~-123</a>. c ' +
              '&#8220;<a href="http://example.com">http://example.com</a>&#8221; ' +
              '&#8216;<a href="http://me.com">http://me.com</a>&#8217;');
    expect(linky(undefined)).not.toBeDefined();
  });

  it('should return `undefined`/`null`/`""` values unchanged', function() {
    expect(linky(undefined)).toBeUndefined();
    expect(linky(null)).toBe(null);
    expect(linky('')).toBe('');
  });

  it('should throw an error when used with a non-string value (other than `undefined`/`null`)',
    function() {
      expect(function() { linky(false); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: false');

      expect(function() { linky(true); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: true');

      expect(function() { linky(0); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: 0');

      expect(function() { linky(42); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: 42');

      expect(function() { linky({}); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: {}');

      expect(function() { linky([]); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: []');

      expect(function() { linky(noop); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: function noop()');
    }
  );

  it('should be case-insensitive', function() {
    expect(linky('WWW.example.com')).toEqual('<a href="http://WWW.example.com">WWW.example.com</a>');
    expect(linky('WWW.EXAMPLE.COM')).toEqual('<a href="http://WWW.EXAMPLE.COM">WWW.EXAMPLE.COM</a>');
    expect(linky('HTTP://www.example.com')).toEqual('<a href="HTTP://www.example.com">HTTP://www.example.com</a>');
    expect(linky('HTTP://example.com')).toEqual('<a href="HTTP://example.com">HTTP://example.com</a>');
    expect(linky('HTTPS://www.example.com')).toEqual('<a href="HTTPS://www.example.com">HTTPS://www.example.com</a>');
    expect(linky('HTTPS://example.com')).toEqual('<a href="HTTPS://example.com">HTTPS://example.com</a>');
    expect(linky('FTP://www.example.com')).toEqual('<a href="FTP://www.example.com">FTP://www.example.com</a>');
    expect(linky('FTP://example.com')).toEqual('<a href="FTP://example.com">FTP://example.com</a>');
    expect(linky('SFTP://www.example.com')).toEqual('<a href="SFTP://www.example.com">SFTP://www.example.com</a>');
    expect(linky('SFTP://example.com')).toEqual('<a href="SFTP://example.com">SFTP://example.com</a>');
  });

  it('should handle www.', function() {
    expect(linky('www.example.com')).toEqual('<a href="http://www.example.com">www.example.com</a>');
  });

  it('should handle mailto:', function() {
    expect(linky('mailto:me@example.com')).
                    toEqual('<a href="mailto:me@example.com">me@example.com</a>');
    expect(linky('me@example.com')).
                    toEqual('<a href="mailto:me@example.com">me@example.com</a>');
    expect(linky('send email to me@example.com, but')).
      toEqual('send email to <a href="mailto:me@example.com">me@example.com</a>, but');
    expect(linky('my email is "me@example.com"')).
      toEqual('my email is &#34;<a href="mailto:me@example.com">me@example.com</a>&#34;');
  });

  it('should handle quotes in the email', function() {
    expect(linky('foo@"bar".com')).toEqual('<a href="mailto:foo@&#34;bar&#34;.com">foo@&#34;bar&#34;.com</a>');
  });

  it('should handle target:', function() {
    expect(linky('http://example.com', '_blank')).
      toBeOneOf('<a target="_blank" href="http://example.com">http://example.com</a>',
                '<a href="http://example.com" target="_blank">http://example.com</a>');
    expect(linky('http://example.com', 'someNamedIFrame')).
      toBeOneOf('<a target="someNamedIFrame" href="http://example.com">http://example.com</a>',
                '<a href="http://example.com" target="someNamedIFrame">http://example.com</a>');
  });

  describe('custom attributes', function() {

    it('should optionally add custom attributes', function() {
      expect(linky('http://example.com', '_self', {rel: 'nofollow'})).
        toBeOneOf('<a rel="nofollow" target="_self" href="http://example.com">http://example.com</a>',
                  '<a href="http://example.com" target="_self" rel="nofollow">http://example.com</a>');
    });


    it('should override target parameter with custom attributes', function() {
      expect(linky('http://example.com', '_self', {target: '_blank'})).
        toBeOneOf('<a target="_blank" href="http://example.com">http://example.com</a>',
                  '<a href="http://example.com" target="_blank">http://example.com</a>');
    });


    it('should optionally add custom attributes from function', function() {
      expect(linky('http://example.com', '_self', function(url) {return {'class': 'blue'};})).
        toBeOneOf('<a class="blue" target="_self" href="http://example.com">http://example.com</a>',
                  '<a href="http://example.com" target="_self" class="blue">http://example.com</a>',
                  '<a class="blue" href="http://example.com" target="_self">http://example.com</a>');
    });


    it('should pass url as parameter to custom attribute function', function() {
      var linkParameters = jasmine.createSpy('linkParameters').and.returnValue({'class': 'blue'});
      linky('http://example.com', '_self', linkParameters);
      expect(linkParameters).toHaveBeenCalledWith('http://example.com');
    });


    it('should call the attribute function for all links in the input', function() {
      var attributeFn = jasmine.createSpy('attributeFn').and.returnValue({});
      linky('http://example.com and http://google.com', '_self', attributeFn);
      expect(attributeFn.calls.allArgs()).toEqual([['http://example.com'], ['http://google.com']]);
    });


    it('should strip unsafe attributes', function() {
      expect(linky('http://example.com', '_self', {'class': 'blue', 'onclick': 'alert(\'Hi\')'})).
        toBeOneOf('<a class="blue" target="_self" href="http://example.com">http://example.com</a>',
                  '<a href="http://example.com" target="_self" class="blue">http://example.com</a>',
                  '<a class="blue" href="http://example.com" target="_self">http://example.com</a>');
    });
  });
});

describe('HTML', function() {
  var ua = window.navigator.userAgent;
  var isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);

  var expectHTML;

  beforeEach(module('ngSanitize'));
  beforeEach(function() {
    expectHTML = function(html) {
      var sanitize;
      inject(function($sanitize) {
        sanitize = $sanitize;
      });
      return expect(sanitize(html));
    };
  });

  describe('htmlParser', function() {
    /* global htmlParser */

    var handler, start, text, comment;
    beforeEach(function() {
      text = '';
      start = null;
      handler = {
        start: function(tag, attrs) {
          start = {
            tag: tag,
            attrs: attrs
          };
          // Since different browsers handle newlines differently we trim
          // so that it is easier to write tests.
          for (var i = 0, ii = attrs.length; i < ii; i++) {
            var keyValue = attrs[i];
            var key = keyValue.key;
            var value = keyValue.value;
            attrs[key] = value.replace(/^\s*/, '').replace(/\s*$/, '');
          }
        },
        chars: function(text_) {
          text += text_;
        },
        end:function(tag) {
          expect(tag).toEqual(start.tag);
        },
        comment:function(comment_) {
          comment = comment_;
        }
      };
      // Trigger the $sanitizer provider to execute, which initializes the `htmlParser` function.
      inject(function($sanitize) {});
    });

    it('should not parse comments', function() {
      htmlParser('<!--FOOBAR-->', handler);
      expect(comment).not.toBeDefined();
    });

    it('should parse basic format', function() {
      htmlParser('<tag attr="value">text</tag>', handler);
      expect(start).toEqual({tag:'tag', attrs:{attr:'value'}});
      expect(text).toEqual('text');
    });

    it('should not treat "<" followed by a non-/ or non-letter as a tag', function() {
      expectHTML('<- text1 text2 <1 text1 text2 <{', handler).
        toBe('&lt;- text1 text2 &lt;1 text1 text2 &lt;{');
    });

    it('should accept tag delimiters such as "<" inside real tags', function() {
      // Assert that the < is part of the text node content, and not part of a tag name.
      htmlParser('<p> 10 < 100 </p>', handler);
      expect(text).toEqual(' 10 < 100 ');
    });

    it('should parse newlines in tags', function() {
      htmlParser('<tag\n attr="value"\n>text</\ntag\n>', handler);
      expect(start).toEqual({tag:'tag', attrs:{attr:'value'}});
      expect(text).toEqual('text');
    });

    it('should parse newlines in attributes', function() {
      htmlParser('<tag attr="\nvalue\n">text</tag>', handler);
      expect(start).toEqual({tag:'tag', attrs:{attr:'\nvalue\n'}});
      expect(text).toEqual('text');
    });

    it('should parse namespace', function() {
      htmlParser('<ns:t-a-g ns:a-t-t-r="\nvalue\n">text</ns:t-a-g>', handler);
      expect(start).toEqual({tag:'ns:t-a-g', attrs:{'ns:a-t-t-r':'\nvalue\n'}});
      expect(text).toEqual('text');
    });

    it('should parse empty value attribute of node', function() {
      htmlParser('<test-foo selected value="">abc</test-foo>', handler);
      expect(start).toEqual({tag:'test-foo', attrs:{selected:'', value:''}});
      expect(text).toEqual('abc');
    });
  });

  // THESE TESTS ARE EXECUTED WITH COMPILED ANGULAR
  it('should echo html', function() {
    expectHTML('hello<b class="1\'23" align=\'""\'>world</b>.').
       toBeOneOf('hello<b class="1\'23" align="&#34;&#34;">world</b>.',
                 'hello<b align="&#34;&#34;" class="1\'23">world</b>.');
  });

  it('should remove script', function() {
    expectHTML('a<SCRIPT>evil< / scrIpt >c.').toEqual('a');
    expectHTML('a<SCRIPT>evil</scrIpt>c.').toEqual('ac.');
  });

  it('should remove script that has newline characters', function() {
    expectHTML('a<SCRIPT\n>\n\revil\n\r</scrIpt\n >c.').toEqual('ac.');
  });

  it('should remove DOCTYPE header', function() {
    expectHTML('<!DOCTYPE html>').toEqual('');
    expectHTML('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"\n"http://www.w3.org/TR/html4/strict.dtd">').toEqual('');
    expectHTML('a<!DOCTYPE html>c.').toEqual('ac.');
    expectHTML('a<!DocTyPe html>c.').toEqual('ac.');
  });

  it('should escape non-start tags', function() {
    expectHTML('a< SCRIPT >A< SCRIPT >evil< / scrIpt >B< / scrIpt >c.').
      toBe('a&lt; SCRIPT &gt;A&lt; SCRIPT &gt;evil&lt; / scrIpt &gt;B&lt; / scrIpt &gt;c.');
  });

  it('should remove attrs', function() {
    expectHTML('a<div style="abc">b</div>c').toEqual('a<div>b</div>c');
  });

  it('should handle large datasets', function() {
    // Large is non-trivial to quantify, but handling ~100,000 should be sufficient for most purposes.
    var largeNumber = 17; // 2^17 = 131,072
    var result = '<div>b</div>';
    // Ideally we would use repeat, but that isn't supported in IE.
    for (var i = 0; i < largeNumber; i++) {
      result += result;
    }
    expectHTML('a' + result + 'c').toEqual('a' + result + 'c');
  });

  it('should remove style', function() {
    expectHTML('a<STyle>evil</stYle>c.').toEqual('ac.');
  });

  it('should remove style that has newline characters', function() {
    expectHTML('a<STyle \n>\n\revil\n\r</stYle\n>c.').toEqual('ac.');
  });

  it('should remove script and style', function() {
    expectHTML('a<STyle>evil<script></script></stYle>c.').toEqual('ac.');
  });

  it('should remove double nested script', function() {
    expectHTML('a<SCRIPT>ev<script>evil</sCript>il</scrIpt>c.').toEqual('ailc.');
  });

  it('should remove unknown  names', function() {
    expectHTML('a<xxx><B>b</B></xxx>c').toEqual('a<b>b</b>c');
  });

  it('should remove unsafe value', function() {
    expectHTML('<a href="javascript:alert()">').toEqual('<a></a>');
    expectHTML('<img src="foo.gif" usemap="#foomap">').toEqual('<img src="foo.gif">');
  });

  it('should handle self closed elements', function() {
    expectHTML('a<hr/>c').toEqual('a<hr>c');
  });

  it('should handle namespace', function() {
    expectHTML('a<my:hr/><my:div>b</my:div>c').toEqual('abc');
  });

  it('should handle entities', function() {
    var everything = '<div rel="!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#295;">' +
    '!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#295;</div>';
    expectHTML(everything).toEqual(everything);
  });

  it('should mangle improper html', function() {
    // This text is encoded more than a real HTML parser would, but it should render the same.
    expectHTML('< div rel="</div>" alt=abc dir=\'"\' >text< /div>').
      toBe('&lt; div rel=&#34;&#34; alt=abc dir=\'&#34;\' &gt;text&lt; /div&gt;');
  });

  it('should mangle improper html2', function() {
    // A proper HTML parser would clobber this more in most cases, but it looks reasonable.
    expectHTML('< div rel="</div>" / >').
      toBe('&lt; div rel=&#34;&#34; / &gt;');
  });

  it('should ignore back slash as escape', function() {
    expectHTML('<img alt="xxx\\" title="><script>....">').
      toBeOneOf('<img alt="xxx\\" title="&gt;&lt;script&gt;....">',
                '<img title="&gt;&lt;script&gt;...." alt="xxx\\">');
  });

  it('should ignore object attributes', function() {
    expectHTML('<a constructor="hola">:)</a>').
      toEqual('<a>:)</a>');
    expectHTML('<constructor constructor="hola">:)</constructor>').
      toEqual('');
  });

  it('should keep spaces as prefix/postfix', function() {
    expectHTML(' a ').toEqual(' a ');
  });

  it('should allow multiline strings', function() {
    expectHTML('\na\n').toEqual('&#10;a&#10;');
  });

  it('should accept tag delimiters such as "<" inside real tags (with nesting)', function() {
    //this is an integrated version of the 'should accept tag delimiters such as "<" inside real tags' test
    expectHTML('<p> 10 < <span>100</span> </p>')
    .toEqual('<p> 10 &lt; <span>100</span> </p>');
  });

  it('should accept non-string arguments', function() {
    expectHTML(null).toBe('');
    expectHTML(undefined).toBe('');
    expectHTML(42).toBe('42');
    expectHTML({}).toBe('[object Object]');
    expectHTML([1, 2, 3]).toBe('1,2,3');
    expectHTML(true).toBe('true');
    expectHTML(false).toBe('false');
  });


  it('should strip svg elements if not enabled via provider', function() {
    expectHTML('<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"></svg>')
      .toEqual('');
  });

  it('should prevent mXSS attacks', function() {
    expectHTML('<a href="&#x3000;javascript:alert(1)">CLICKME</a>').toBe('<a>CLICKME</a>');
  });

  it('should strip html comments', function() {
    expectHTML('<!-- comment 1 --><p>text1<!-- comment 2 -->text2</p><!-- comment 3 -->')
      .toEqual('<p>text1text2</p>');
  });

  describe('clobbered elements', function() {

    it('should throw on a form with an input named "parentNode"', function() {
      inject(function($sanitize) {

        expect(function() {
          $sanitize('<form><input name="parentNode" /></form>');
        }).toThrowMinErr('$sanitize', 'elclob');

        expect(function() {
          $sanitize('<form><div><div><input name="parentNode" /></div></div></form>');
        }).toThrowMinErr('$sanitize', 'elclob');
      });
    });

    if (!/Edge\/\d{2,}/.test(window.navigator.userAgent)) {
      // Skip test on Edge due to a browser bug.
      it('should throw on a form with an input named "nextSibling"', function() {
        inject(function($sanitize) {

          expect(function() {
            $sanitize('<form><input name="nextSibling" /></form>');
          }).toThrowMinErr('$sanitize', 'elclob');

          expect(function() {
            $sanitize('<form><div><div><input name="nextSibling" /></div></div></form>');
          }).toThrowMinErr('$sanitize', 'elclob');

        });
      });
    }
  });

  // See https://github.com/cure53/DOMPurify/blob/a992d3a75031cb8bb032e5ea8399ba972bdf9a65/src/purify.js#L439-L449
  it('should not allow JavaScript execution when creating inert document', inject(function($sanitize) {
    $sanitize('<svg><g onload="window.xxx = 100"></g></svg>');

    expect(window.xxx).toBe(undefined);
    delete window.xxx;
  }));

  // See https://github.com/cure53/DOMPurify/releases/tag/0.6.7
  it('should not allow JavaScript hidden in badly formed HTML to get through sanitization (Firefox bug)', inject(function($sanitize) {
    var doc = $sanitize('<svg><p><style><img src="</style><img src=x onerror=alert(1)//">');
    expect(doc).toEqual('<p><img src="x"></p>');
  }));

  describe('Custom white-list support', function() {

    var $sanitizeProvider;
    beforeEach(module(function(_$sanitizeProvider_) {
      $sanitizeProvider = _$sanitizeProvider_;

      $sanitizeProvider.addValidElements(['foo']);
      $sanitizeProvider.addValidElements({
        htmlElements: ['foo-button', 'foo-video'],
        htmlVoidElements: ['foo-input'],
        svgElements: ['foo-svg']
      });
      $sanitizeProvider.addValidAttrs(['foo']);
    }));

    it('should allow custom white-listed element', function() {
      expectHTML('<foo></foo>').toEqual('<foo></foo>');
      expectHTML('<foo-button></foo-button>').toEqual('<foo-button></foo-button>');
      expectHTML('<foo-video></foo-video>').toEqual('<foo-video></foo-video>');
    });

    it('should allow custom white-listed void element', function() {
      expectHTML('<foo-input/>').toEqual('<foo-input>');
    });

    it('should allow custom white-listed void element to be used with closing tag', function() {
      expectHTML('<foo-input></foo-input>').toEqual('<foo-input>');
    });

    it('should allow custom white-listed attribute', function() {
      expectHTML('<foo-input foo="foo"/>').toEqual('<foo-input foo="foo">');
    });

    it('should ignore custom white-listed SVG element if SVG disabled', function() {
      expectHTML('<foo-svg></foo-svg>').toEqual('');
    });

    it('should not allow add custom element after service has been instantiated', inject(function($sanitize) {
      $sanitizeProvider.addValidElements(['bar']);
      expectHTML('<bar></bar>').toEqual('');
    }));
  });

  describe('SVG support', function() {

    beforeEach(module(function($sanitizeProvider) {
      $sanitizeProvider.enableSvg(true);
      $sanitizeProvider.addValidElements({
        svgElements: ['font-face-uri']
      });
    }));

    it('should accept SVG tags', function() {
      expectHTML('<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"></svg>')
        .toBeOneOf('<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"></circle></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg" height="150px" width="400px"><circle fill="red" stroke-width="3" stroke="black" r="40" cy="50" cx="50"></circle></svg>',
                   '<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle fill="red" stroke="black" stroke-width="3" cx="50" cy="50" r="40"></circle></svg>',
                   '<svg width="400px" height="150px" xmlns="http://www.w3.org/2000/svg"><circle FILL="red" STROKE="black" STROKE-WIDTH="3" cx="50" cy="50" r="40"></circle></svg>');
    });

    it('should not ignore white-listed svg camelCased attributes', function() {
      expectHTML('<svg preserveAspectRatio="true"></svg>')
        .toBeOneOf('<svg preserveAspectRatio="true"></svg>',
                   '<svg preserveAspectRatio="true" xmlns="http://www.w3.org/2000/svg"></svg>');

    });

    it('should allow custom white-listed SVG element', function() {
      expectHTML('<font-face-uri></font-face-uri>').toEqual('<font-face-uri></font-face-uri>');
    });

    it('should sanitize SVG xlink:href attribute values', function() {
      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:alert()"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xmlns:xlink="http://www.w3.org/1999/xlink"></a></svg>');

      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="https://example.com"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="https://example.com"></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a xlink:href="https://example.com"></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xlink:href="https://example.com" xmlns:xlink="http://www.w3.org/1999/xlink"></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://example.com"></a></svg>');
    });

    it('should sanitize SVG xml:base attribute values', function() {
      expectHTML('<svg xmlns="http://www.w3.org/2000/svg"><a xml:base="javascript:alert(1)//" href="#"></a></svg>')
        .toEqual('<svg xmlns="http://www.w3.org/2000/svg"><a href="#"></a></svg>');

      expectHTML('<svg xmlns="http://www.w3.org/2000/svg"><a xml:base="https://example.com" href="#"></a></svg>')
        .toEqual('<svg xmlns="http://www.w3.org/2000/svg"><a xml:base="https://example.com" href="#"></a></svg>');

    });

    it('should sanitize unknown namespaced SVG attributes', function() {
      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:foo="javascript:alert()"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a></a></svg>');

      expectHTML('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:bar="https://example.com"></a></svg>')
        .toBeOneOf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a></a></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><a></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a></a></svg>');
    });

    it('should not accept SVG animation tags', function() {
      expectHTML('<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a><text y="1em">Click me</text><animate attributeName="xlink:href" values="javascript:alert(1)"/></a></svg>')
        .toBeOneOf('<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a><text y="1em">Click me</text></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a><text y="1em">Click me</text></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a><text y="1em">Click me</text></a></svg>');

      expectHTML('<svg><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="?"><circle r="400"></circle>' +
        '<animate attributeName="xlink:href" begin="0" from="javascript:alert(1)" to="&" /></a></svg>')
        .toBeOneOf('<svg><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="?"><circle r="400"></circle></a></svg>',
                   '<svg><a xlink:href="?" xmlns:xlink="http://www.w3.org/1999/xlink"><circle r="400"></circle></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xlink:href="?" xmlns:xlink="http://www.w3.org/1999/xlink"><circle r="400"></circle></a></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="?"><circle r="400"></circle></a></svg>');
    });

    it('should not accept SVG `use` tags', function() {
      expectHTML('<svg><use xlink:href="test.svg#xss" /></svg>')
        .toBeOneOf('<svg></svg>',
                   '<svg xmlns:xlink="http://www.w3.org/1999/xlink"></svg>',
                   '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    });
  });


  describe('htmlSanitizerWriter', function() {
    /* global htmlSanitizeWriter: false */

    var writer, html, uriValidator;
    beforeEach(function() {
      html = '';
      uriValidator = jasmine.createSpy('uriValidator');
      writer = htmlSanitizeWriter({push:function(text) {html += text;}}, uriValidator);
    });

    it('should write basic HTML', function() {
      writer.chars('before');
      writer.start('div', {rel:'123'}, false);
      writer.chars('in');
      writer.end('div');
      writer.chars('after');

      expect(html).toEqual('before<div rel="123">in</div>after');
    });

    it('should escape text nodes', function() {
      writer.chars('a<div>&</div>c');
      expect(html).toEqual('a&lt;div&gt;&amp;&lt;/div&gt;c');
    });

    it('should escape IE script', function() {
      writer.chars('&<>{}');
      expect(html).toEqual('&amp;&lt;&gt;{}');
    });

    it('should escape attributes', function() {
      writer.start('div', {rel:'!@#$%^&*()_+-={}[]:";\'<>?,./`~ \n\0\r\u0127'});
      expect(html).toEqual('<div rel="!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#10;&#0;&#13;&#295;">');
    });

    it('should ignore misformed elements', function() {
      writer.start('d>i&v', {});
      expect(html).toEqual('');
    });

    it('should ignore unknown attributes', function() {
      writer.start('div', {unknown:''});
      expect(html).toEqual('<div>');
    });

    it('should handle surrogate pair', function() {
      writer.chars(String.fromCharCode(55357, 56374));
      expect(html).toEqual('&#128054;');
    });

    describe('explicitly disallow', function() {
      it('should not allow attributes', function() {
        writer.start('div', {id:'a', name:'a', style:'a'});
        expect(html).toEqual('<div>');
      });

      it('should not allow tags', function() {
        function tag(name) {
          writer.start(name, {});
          writer.end(name);
        }
        tag('frameset');
        tag('frame');
        tag('form');
        tag('param');
        tag('object');
        tag('embed');
        tag('textarea');
        tag('input');
        tag('button');
        tag('option');
        tag('select');
        tag('script');
        tag('style');
        tag('link');
        tag('base');
        tag('basefont');
        expect(html).toEqual('');
      });
    });

    describe('uri validation', function() {
      it('should call the uri validator', function() {
        writer.start('a', {href:'someUrl'}, false);
        expect(uriValidator).toHaveBeenCalledWith('someUrl', false);
        uriValidator.calls.reset();
        writer.start('img', {src:'someImgUrl'}, false);
        expect(uriValidator).toHaveBeenCalledWith('someImgUrl', true);
        uriValidator.calls.reset();
        writer.start('someTag', {src:'someNonUrl'}, false);
        expect(uriValidator).not.toHaveBeenCalled();
      });

      it('should drop non valid uri attributes', function() {
        uriValidator.and.returnValue(false);
        writer.start('a', {href:'someUrl'}, false);
        expect(html).toEqual('<a>');

        html = '';
        uriValidator.and.returnValue(true);
        writer.start('a', {href:'someUrl'}, false);
        expect(html).toEqual('<a href="someUrl">');
      });
    });
  });

  describe('uri checking', function() {
    beforeEach(function() {
      jasmine.addMatchers({
        toBeValidUrl: function() {
          return {
            compare: function(actual) {
              var sanitize;
              inject(function($sanitize) {
                sanitize = $sanitize;
              });
              var input = '<a href="' + actual + '"></a>';
              return { pass: sanitize(input) === input };
            }
          };
        }
      });
    });

    it('should use $$sanitizeUri for a[href] links', function() {
      var $$sanitizeUri = jasmine.createSpy('$$sanitizeUri');
      module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      inject(function() {
        $$sanitizeUri.and.returnValue('someUri');

        expectHTML('<a href="someUri"></a>').toEqual('<a href="someUri"></a>');
        expect($$sanitizeUri).toHaveBeenCalledWith('someUri', false);

        $$sanitizeUri.and.returnValue('unsafe:someUri');
        expectHTML('<a href="someUri"></a>').toEqual('<a></a>');
      });
    });

    it('should use $$sanitizeUri for img[src] links', function() {
      var $$sanitizeUri = jasmine.createSpy('$$sanitizeUri');
      module(function($provide) {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      inject(function() {
        $$sanitizeUri.and.returnValue('someUri');

        expectHTML('<img src="someUri"/>').toEqual('<img src="someUri">');
        expect($$sanitizeUri).toHaveBeenCalledWith('someUri', true);

        $$sanitizeUri.and.returnValue('unsafe:someUri');
        expectHTML('<img src="someUri"/>').toEqual('<img>');
      });
    });

    it('should be URI', function() {
      expect('').toBeValidUrl();
      expect('http://abc').toBeValidUrl();
      expect('HTTP://abc').toBeValidUrl();
      expect('https://abc').toBeValidUrl();
      expect('HTTPS://abc').toBeValidUrl();
      expect('ftp://abc').toBeValidUrl();
      expect('FTP://abc').toBeValidUrl();
      expect('mailto:me@example.com').toBeValidUrl();
      expect('MAILTO:me@example.com').toBeValidUrl();
      expect('tel:123-123-1234').toBeValidUrl();
      expect('TEL:123-123-1234').toBeValidUrl();
      expect('#anchor').toBeValidUrl();
      expect('/page1.md').toBeValidUrl();
    });

    it('should not be URI', function() {
      // eslint-disable-next-line no-script-url
      expect('javascript:alert').not.toBeValidUrl();
    });

    describe('javascript URLs', function() {
      it('should ignore javascript:', function() {
        // eslint-disable-next-line no-script-url
        expect('JavaScript:abc').not.toBeValidUrl();
        expect(' \n Java\n Script:abc').not.toBeValidUrl();
        expect('http://JavaScript/my.js').toBeValidUrl();
      });

      it('should ignore dec encoded javascript:', function() {
        expect('&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;').not.toBeValidUrl();
        expect('&#106&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;').not.toBeValidUrl();
        expect('&#106 &#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;').not.toBeValidUrl();
      });

      it('should ignore decimal with leading 0 encoded javascript:', function() {
        expect('&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058').not.toBeValidUrl();
        expect('&#0000106 &#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058').not.toBeValidUrl();
        expect('&#0000106; &#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058').not.toBeValidUrl();
      });

      it('should ignore hex encoded javascript:', function() {
        expect('&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A;').not.toBeValidUrl();
        expect('&#x6A;&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A;').not.toBeValidUrl();
        expect('&#x6A &#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A;').not.toBeValidUrl();
      });

      it('should ignore hex encoded whitespace javascript:', function() {
        expect('jav&#x09;ascript:alert();').not.toBeValidUrl();
        expect('jav&#x0A;ascript:alert();').not.toBeValidUrl();
        expect('jav&#x0A ascript:alert();').not.toBeValidUrl();
        expect('jav\u0000ascript:alert();').not.toBeValidUrl();
        expect('java\u0000\u0000script:alert();').not.toBeValidUrl();
        expect(' &#14; java\u0000\u0000script:alert();').not.toBeValidUrl();
      });
    });
  });

  describe('sanitizeText', function() {
    /* global sanitizeText: false */
    it('should escape text', function() {
      expect(sanitizeText('a<div>&</div>c')).toEqual('a&lt;div&gt;&amp;&lt;/div&gt;c');
    });
  });
});

describe('decodeEntities', function() {
  var handler, text;

  beforeEach(function() {
    text = '';
    handler = {
      start: function() {},
      chars: function(text_) {
        text = text_;
      },
      end: function() {},
      comment: function() {}
    };
    module('ngSanitize');
  });

  it('should unescape text', function() {
    htmlParser('a&lt;div&gt;&amp;&lt;/div&gt;c', handler);
    expect(text).toEqual('a<div>&</div>c');
  });

  it('should preserve whitespace', function() {
    htmlParser('  a&amp;b ', handler);
    expect(text).toEqual('  a&b ');
  });
});


})(window, window.angular);
