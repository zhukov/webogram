/*!
 * Webogram v0.0.21 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

window._testMode = location.search.indexOf('test=1') > 0;
window._debugMode = location.search.indexOf('debug=1') > 0;
window._osX = (navigator.platform || '').toLowerCase().indexOf('mac') != -1 ||
              (navigator.userAgent || '').toLowerCase().indexOf('mac') != -1;
window._retina = window.devicePixelRatio > 1;

if (!window._osX) {
  $('body').addClass('non_osx');
}
$('body').addClass(window._retina ? 'is_2x' : 'is_1x');

$(window).on('load', function () {
  setTimeout(function () {
    window.scrollTo(0,1);
  }, 0);
});

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'pasvaz.bindonce',
  'mtproto.services',
  'myApp.filters',
  'myApp.services',
  /*PRODUCTION_ONLY_BEGIN
  'myApp.templates',
  PRODUCTION_ONLY_END*/
  'myApp.directives',
  'myApp.controllers'
]).
config(['$locationProvider', '$routeProvider', '$compileProvider', function($locationProvider, $routeProvider, $compileProvider) {

  var icons = {}, reverseIcons = {}, i, j, hex, name, dataItem, row, column, totalColumns;

  for (j = 0; j < Config.EmojiCategories.length; j++) {
    totalColumns = Config.EmojiCategorySpritesheetDimens[j][1];
    for (i = 0; i < Config.EmojiCategories[j].length; i++) {
      dataItem = Config.Emoji[Config.EmojiCategories[j][i]];
      name = dataItem[1][0];
      row = Math.floor(i / totalColumns);
      column = (i % totalColumns);
      icons[':' + name + ':'] = [j, row, column, ':'+name+':'];
      reverseIcons[name] = dataItem[0];
    }
  }

  $.emojiarea.spritesheetPath = 'img/emojisprite_!.png';
  $.emojiarea.spritesheetDimens = Config.EmojiCategorySpritesheetDimens;
  $.emojiarea.iconSize = 20;
  $.emojiarea.icons = icons;
  $.emojiarea.reverseIcons = reverseIcons;

  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|filesystem|chrome-extension|app):|data:image\//);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|mailto|blob|filesystem|chrome-extension|app):|data:image\//);


  // $locationProvider.html5Mode(true);
  $routeProvider.when('/', {templateUrl: 'partials/welcome.html', controller: 'AppWelcomeController'});
  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'AppLoginController'});
  $routeProvider.when('/im', {templateUrl: 'partials/im.html', controller: 'AppIMController', reloadOnSearch: false});
  $routeProvider.otherwise({redirectTo: '/'});

}]);
