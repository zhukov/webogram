/*!
 * Webogram v0.1 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Filters */

angular.module('myApp.filters', [])

  .filter('userName', [function() {
    return function (user) {
      if (!user || !user.first_name && !user.last_name) {
        return 'DELETED';
      }
      return user.first_name + ' ' + user.last_name;
    }
  }])

  .filter('userFirstName', [function() {
    return function (user) {
      if (!user || !user.first_name && !user.last_name) {
        return 'DELETED';
      }
      return user.first_name || user.last_name;
    }
  }])

  .filter('userStatus', ['$filter', function($filter) {
    return function (user) {
      if (!user || !user.status || user.status._ == 'userStatusEmpty') {
        return 'offline';
      }
      if (user.status._ == 'userStatusOnline') {
        return 'online';
      }

      return 'last seen ' + $filter('relativeTime')(user.status.was_online);
    }
  }])

  .filter('chatTitle', [function() {
    return function (chat) {
      if (!chat || !chat.title) {
        return 'DELETED';
      }
      return chat.title;
    }
  }])

  .filter('dateOrTime', ['$filter', function($filter) {
    return function (timestamp) {
      var ticks = timestamp * 1000,
          diff = Math.abs(+new Date() - ticks),
          format = 'HH:mm';

      if (diff > 518400000) { // 6 days
        format = 'shortDate';
      }
      else if (diff > 43200000) { // 12 hours
        format = 'EEE';
      }
      return $filter('date')(ticks, format);
    }
  }])

  .filter('duration', [function() {
    return function (duration) {
      var secs = duration % 60,
          mins = Math.floor((duration - secs) / 60.0);

      if (secs < 10) {
        secs = '0' + secs;
      }

      return mins + ':' + secs;
    }
  }])

  .filter('phoneNumber', [function() {
    return function (phoneRaw) {
      if (phoneRaw.charAt(0) == '7') {
        return '+' + phoneRaw.charAt(0) + ' (' + phoneRaw.substr(1, 3) + ') ' + phoneRaw.substr(4, 3) + '-' + phoneRaw.substr(7, 2) + '-' + phoneRaw.substr(9, 2);
      }
      return '+' + phoneRaw;
    }
  }])

  .filter('formatSize', [function () {
    return function (size) {
      return Math.round(size / 1024) + 'Kb';
    }
  }])

  .filter('nl2br', [function () {
    return function (text) {
      return text.replace(/\n/g, '<br/>');
    }
  }])

  .filter('richText', ['$filter', function ($filter) {
    return function (text) {
      return $filter('linky')(text, '_blank').replace(/\n|&#10;/g, '<br/>');
    }
  }])

  .filter('relativeTime', ['$filter', function($filter) {
    return function (timestamp) {
      var ticks = timestamp * 1000,
          diff = Math.abs(+new Date() - ticks);

      if (diff < 60000) {
        return 'just now';
      }
      if (diff < 3000000) {
        return Math.ceil(diff / 60000) + ' minutes ago';
      }
      if (diff < 10000000) {
        return Math.ceil(diff / 3600000) + ' hours ago';
      }
      return $filter('dateOrTime')(timestamp);
    }
  }])