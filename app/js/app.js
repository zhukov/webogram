/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict'
/* global Config, templateUrl */

var extraModules = []
if (Config.Modes.animations) {
  extraModules.push('ngAnimate')
}

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  'ui.bootstrap',
  'mediaPlayer',
  'toaster',
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
].concat(extraModules)).config(['$locationProvider', '$routeProvider', '$compileProvider', 'StorageProvider', function ($locationProvider, $routeProvider, $compileProvider, StorageProvider) {
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|filesystem|chrome-extension|app):|data:image\//)
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|tg|mailto|blob|filesystem|chrome-extension|app):|data:/)

  /*PRODUCTION_ONLY_BEGIN
  $compileProvider.debugInfoEnabled(false)
  PRODUCTION_ONLY_END*/

  if (Config.Modes.test) {
    StorageProvider.setPrefix('t_')
  }

  $routeProvider.when('/', {template: '', controller: 'AppWelcomeController'})
  $routeProvider.when('/login', {templateUrl: templateUrl('login'), controller: 'AppLoginController'})
  $routeProvider.when('/im', {templateUrl: templateUrl('im'), controller: 'AppIMController', reloadOnSearch: false})
  $routeProvider.otherwise({redirectTo: '/'})
}])
