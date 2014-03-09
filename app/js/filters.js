/*!
 * Webogram v0.0.19 - messaging web application for MTProto
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

  .filter('userStatus', ['$filter', 'documentL10n', function($filter, documentL10n) {
    var l10n, isReady = false;
    documentL10n.ready(function () {
      isReady = true;
      l10n = {
        online: documentL10n.getSync('online'),
        offline: documentL10n.getSync('offline')
      };
    });

    return function (user) {
      if (!isReady) return '';
      if (!user || !user.status || user.status._ == 'userStatusEmpty') {
        return l10n.offline;
      }
      if (user.status._ == 'userStatusOnline') {
        return l10n.online;
      }

      documentL10n.updateData({date: $filter('relativeTime')(user.status.was_online)});
      return documentL10n.getSync('last_seen');
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
    var cachedDates = {};

    return function (timestamp) {

      if (cachedDates[timestamp]) {
        return cachedDates[timestamp];
      }

      var ticks = timestamp * 1000,
          diff = Math.abs(tsNow() - ticks),
          format = 'HH:mm';

      if (diff > 518400000) { // 6 days
        format = 'shortDate';
      }
      else if (diff > 43200000) { // 12 hours
        format = 'EEE';
      }
      return cachedDates[timestamp] = $filter('date')(ticks, format);
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
      phoneRaw = (phoneRaw || '').replace(/\D/g, '');
      if (phoneRaw.charAt(0) == '7' && phoneRaw.length == 11) {
        return '+' + phoneRaw.charAt(0) + ' (' + phoneRaw.substr(1, 3) + ') ' + phoneRaw.substr(4, 3) + '-' + phoneRaw.substr(7, 2) + '-' + phoneRaw.substr(9, 2);
      }
      return '+' + phoneRaw;
    }
  }])

  .filter('formatSize', [function () {
    return function (size) {
      if (!size) {
        return '0';
      }
      else if (size < 1024) {
        return size + ' b';
      }
      else if (size < 1048576) {
        return (Math.round(size / 1024 * 10) / 10) + ' Kb';
      }

      return (Math.round(size / 1048576 * 100) / 100) + ' Mb';
    }
  }])

  .filter('formatSizeProgress', ['$filter', function ($filter) {
    return function (progress) {
      var done = $filter('formatSize')(progress.done),
          doneParts = done.split(' '),
          total = $filter('formatSize')(progress.total),
          totalParts = total.split(' ');

      if (totalParts[1] === doneParts[1]) {
        return doneParts[0] + ' of ' + totalParts[0] + ' ' + (doneParts[1] || '');
      }
      return done + ' of ' + total;
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

  .filter('relativeTime', ['$filter', 'documentL10n', function($filter, documentL10n) {
    var l10n, isReady = false;
    documentL10n.ready(function () {
      isReady = true;
      l10n = {
        just_now: documentL10n.getSync('just_now')
      };
    });

    return function (timestamp) {
      if (!isReady) return false;

      var ticks = timestamp * 1000,
          diff = Math.abs(tsNow() - ticks);

      if (diff < 60000) {
        return l10n.just_now;
      }
      if (diff < 3000000) {
        documentL10n.updateData({count: Math.ceil(diff / 60000)});
        return documentL10n.getSync('minutes_ago');
      }
      if (diff < 10000000) {
        documentL10n.updateData({count: Math.ceil(diff / 3600000)});
        return documentL10n.getSync('hours_ago');
      }
      return $filter('dateOrTime')(timestamp);
    }
  }])
