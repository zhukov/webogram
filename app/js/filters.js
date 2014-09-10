/*!
 * Webogram v0.3.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';

/* Filters */

angular.module('myApp.filters', ['myApp.i18n'])

  .filter('userName', ['_', function(_) {
    return function (user) {
      if (!user || !user.first_name && !user.last_name) {
        return _('DELETED');
      }
      return user.first_name + ' ' + user.last_name;
    }
  }])

  .filter('userFirstName', ['_', function(_) {
    return function (user) {
      if (!user || !user.first_name && !user.last_name) {
        return _('DELETED');
      }
      return user.first_name || user.last_name;
    }
  }])

  .filter('userStatus', ['$filter', '_', function($filter, _) {
    return function (user) {
      if (!user || !user.status || user.status._ == 'userStatusEmpty') {
        return _('offline');
      }
      if (user.status._ == 'userStatusOnline') {
        return _('online');
      }

      return _('last seen {0}', $filter('relativeTime')(user.status.was_online));
    }
  }])

  .filter('chatTitle', ['_', function(_) {
    return function (chat) {
      if (!chat || !chat.title) {
        return _('DELETED');
      }
      return chat.title;
    }
  }])

  .filter('dateOrTime', ['$filter', '_', function($filter, _) {
    var cachedDates = {},
        dateFilter = $filter('date');

    return function (timestamp) {
      if (!cachedDates.hasOwnProperty(_.locale())) {
        cachedDates[_.locale()] = {};
      }

      if (cachedDates[_.locale()][timestamp]) {
        return cachedDates[_.locale()][timestamp];
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
      return cachedDates[_.locale()][timestamp] = dateFilter(ticks, format);
    }
  }])

  .filter('time', ['$filter', '_', function($filter, _) {
    var cachedDates = {},
        dateFilter = $filter('date'),
        format = Config.Navigator.mobile ? 'HH:mm' : 'HH:mm:ss';

    return function (timestamp) {
      if (!cachedDates.hasOwnProperty(_.locale())) {
        cachedDates[_.locale()] = {};
      }

      if (cachedDates[_.locale()][timestamp]) {
        return cachedDates[_.locale()][timestamp];
      }

      return cachedDates[_.locale()][timestamp] = dateFilter(timestamp * 1000, format);
    }
  }])

  .filter('myDate', ['$filter', '_', function($filter, _) {
    var cachedDates = {},
        dateFilter = $filter('date');

    return function (timestamp) {
      if (!cachedDates.hasOwnProperty(_.locale())) {
        cachedDates[_.locale()] = {};
      }

      if (cachedDates[_.locale()][timestamp]) {
        return cachedDates[_.locale()][timestamp];
      }

      return cachedDates[_.locale()][timestamp] = dateFilter(timestamp * 1000, 'fullDate');
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
      var nbsp = ' ';
      phoneRaw = (phoneRaw || '').replace(/\D/g, '');
      if (phoneRaw.charAt(0) == '7' && phoneRaw.length == 11) {
        return '+' + phoneRaw.charAt(0) + nbsp + '(' + phoneRaw.substr(1, 3) + ')' + nbsp + phoneRaw.substr(4, 3) + '-' + phoneRaw.substr(7, 2) + '-' + phoneRaw.substr(9, 2);
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

  .filter('formatSizeProgress', ['$filter', '_', function ($filter, _) {
    return function (progress) {
      var done = $filter('formatSize')(progress.done),
          doneParts = done.split(' '),
          total = $filter('formatSize')(progress.total),
          totalParts = total.split(' ');

      if (totalParts[1] === doneParts[1]) {
        return _('{done} of {total} {parts}', {done: done, total: total, parts: (doneParts[1] || '')});
      }
      return _('{done} of {total}', {done: done, total: total});
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

  .filter('relativeTime', ['$filter', '_', function($filter, _) {
    var langMinutes = {
      one: '{minutes} minute ago',
      many: '{minutes} minutes ago'
    },
      langHours = {
        one: '{hours} hour ago',
        many: '{hours} hours ago'
      };
    return function (timestamp) {
      var ticks = timestamp * 1000,
          diff = Math.abs(tsNow() - ticks);

      if (diff < 60000) {
        return _('just now');
      }
      if (diff < 3000000) {
        var minutes = Math.ceil(diff / 60000);
        return _(langMinutes[minutes > 1 ? 'many' : 'one'], {minutes: minutes});
      }
      if (diff < 10000000) {
        var hours = Math.ceil(diff / 3600000);
        return _(langHours[hours > 1 ? 'many' : 'one'], {hours: hours});
      }
      return $filter('dateOrTime')(timestamp);
    }
  }])
