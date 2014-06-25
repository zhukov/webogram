/*!
 * Webogram v0.1.7 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'pasvaz.bindonce',
  'izhukov.utils',
  'izhukov.mtproto',
  'izhukov.mtproto.wrapper',
  'myApp.filters',
  'myApp.services',
  /*PRODUCTION_ONLY_BEGIN
  'myApp.templates',
  PRODUCTION_ONLY_END*/
  'myApp.directives',
  'myApp.controllers'
]).
config(['$locationProvider', '$routeProvider', '$compileProvider', 'StorageProvider', function($locationProvider, $routeProvider, $compileProvider, StorageProvider) {

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

  if (Config.Modes.test) {
    StorageProvider.setPrefix('t_');
  }

  $routeProvider.when('/', {templateUrl: 'partials/welcome.html', controller: 'AppWelcomeController'});
  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'AppLoginController'});
  $routeProvider.when('/im', {templateUrl: 'partials/im.html', controller: 'AppIMController', reloadOnSearch: false});
  $routeProvider.otherwise({redirectTo: '/'});

}]);


(function () {
  var classes = [
    Config.Navigator.osX ? 'osx' : 'non_osx',
    Config.Navigator.retina ? 'is_2x' : 'is_1x'
  ];
  if (Config.Modes.ios_standalone) {
    classes.push('ios_standalone');
  }
  $(document.body).addClass(classes.join(' '));
})();