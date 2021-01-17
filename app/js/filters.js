/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict'
/* global Config, tsNow */

/* Filters */

angular.module('myApp.filters', ['myApp.i18n'])

  .filter('userName', function (_) {
    return function (user) {
      if (!user || !user.first_name && !user.last_name) {
        return _('user_name_deleted')
      }
      return user.first_name ? (user.first_name + (user.last_name ? ' ' + user.last_name : '')) : user.last_name
    }
  })

  .filter('userFirstName', function (_) {
    return function (user) {
      if (!user || !user.first_name && !user.last_name) {
        return _('user_first_name_deleted')
      }
      return user.first_name || user.last_name
    }
  })

  .filter('userStatus', function ($filter, _) {
    var relativeTimeFilter = $filter('relativeTime')
    return function (user, botChatPrivacy) {
      if (user && !(user.id % 1000)) {
        if (user.id === 777000) {
          return _('user_status_service_notifications')
        }
        return _('user_status_support')
      }
      var statusType = user && user.status && user.status._
      if (!statusType) {
        statusType = user && user.pFlags && user.pFlags.bot ? 'userStatusBot' : 'userStatusEmpty'
      }
      switch (statusType) {
        case 'userStatusOnline':
          return _('user_status_online')

        case 'userStatusOffline':
          return _('user_status_last_seen', relativeTimeFilter(user.status.was_online))

        case 'userStatusRecently':
          return _('user_status_recently')

        case 'userStatusLastWeek':
          return _('user_status_last_week')

        case 'userStatusLastMonth':
          return _('user_status_last_month')

        case 'userStatusBot':
          if (botChatPrivacy) {
            if (user.pFlags.bot_chat_history) {
              return _('user_status_bot_noprivacy')
            } else {
              return _('user_status_bot_privacy')
            }
          }
          return _('user_status_bot')

        case 'userStatusEmpty':
        default:
          return _('user_status_long_ago')
      }
    }
  })

  .filter('chatTitle', function (_) {
    return function (chat) {
      if (!chat || !chat.title) {
        return _('chat_title_deleted')
      }
      return chat.title
    }
  })

  .filter('dateOrTime', function ($filter) {
    var dateFilter = $filter('date')

    return function (timestamp, extended) {
      if (!timestamp) {
        return ''
      }
      var ticks = timestamp * 1000
      var diff = Math.abs(tsNow() - ticks)
      var format = 'shortTime'

      if (diff > 518400000) { // 6 days
        format = extended ? 'mediumDate' : 'shortDate'
      } else if (diff > 43200000) { // 12 hours
        format = extended ? 'EEEE' : 'EEE'
      }

      return dateFilter(ticks, format)
    }
  })

  .filter('dateMedium', function ($filter) {
    var dateFilter = $filter('date')
    return function (timestamp, extended) {
      var ticks = timestamp * 1000
      return dateFilter(ticks, 'medium')
    }
  })

  .filter('time', function ($filter) {
    var cachedDates = {}
    var dateFilter = $filter('date')
    var format = Config.Mobile ? 'shortTime' : 'mediumTime'

    return function (timestamp) {
      if (cachedDates[timestamp]) {
        return cachedDates[timestamp]
      }

      return cachedDates[timestamp] = dateFilter(timestamp * 1000, format)
    }
  })

  .filter('myDate', function ($filter) {
    var cachedDates = {}
    var dateFilter = $filter('date')

    return function (timestamp) {
      if (cachedDates[timestamp]) {
        return cachedDates[timestamp]
      }

      return cachedDates[timestamp] = dateFilter(timestamp * 1000, 'fullDate')
    }
  })

  .filter('duration', [function () {
    return function (duration) {
      duration = parseInt(duration)
      if (isNaN(duration)) {
        duration = 0
      }
      var hours = Math.floor(duration / 3600)
      var mins = Math.floor((duration % 3600) / 60)
      var secs = duration % 60

      var durationStr = (hours ? hours + ':' : '') + mins + ':' + secs

      durationStr = durationStr.replace(/:(\d(?::|$))/g, ':0$1')

      return durationStr
    }
  }])

  .filter('durationRemains', function ($filter) {
    var durationFilter = $filter('duration')

    return function (done, total) {
      return '-' + durationFilter(total - done)
    }
  })

  .filter('phoneNumber', [function () {
    return function (phoneRaw) {
      var nbsp = ' '
      phoneRaw = (phoneRaw || '').replace(/\D/g, '')
      if (phoneRaw.charAt(0) === '7' && phoneRaw.length === 11) {
        return '+' + phoneRaw.charAt(0) + nbsp + '(' + phoneRaw.substr(1, 3) + ')' + nbsp + phoneRaw.substr(4, 3) + '-' + phoneRaw.substr(7, 2) + '-' + phoneRaw.substr(9, 2)
      }
      return '+' + phoneRaw
    }
  }])

  .filter('formatSize', [function () {
    return function (size, progressing) {
      if (!size) {
        return '0'
      } else if (size < 1024) {
        return size + ' b'
      } else if (size < 1048576) {
        return Math.round(size / 1024) + ' KB'
      }
      var mbs = size / 1048576
      if (progressing) {
        mbs = mbs.toFixed(1)
      } else {
        mbs = (Math.round(mbs * 10) / 10)
      }
      return mbs + ' MB'
    }
  }])

  .filter('formatSizeProgress', function ($filter, _) {
    var formatSizeFilter = $filter('formatSize')
    return function (progress) {
      if (!progress.total) {
        return ''
      }
      var done = formatSizeFilter(progress.done, true)
      var doneParts = done.split(' ')
      var total = formatSizeFilter(progress.total)
      var totalParts = total.split(' ')

      if (totalParts[1] === doneParts[1]) {
        return _('format_size_progress_mulitple', {done: doneParts[0], total: totalParts[0], parts: doneParts[1]})
      }
      return _('format_size_progress', {done: done, total: total})
    }
  })

  .filter('formatShortNumber', [function () {
    return function (num) {
      var mult
      if (!num) {
        return '0'
      } else if (num < 1000) {
        return num.toString()
      } else if (num < 900000) {
        mult = num > 10000 ? 1 : 10
        return (Math.round(num / 1000 * mult) / mult) + 'K'
      }
      mult = num > 10000000 ? 1 : 10
      return (Math.round(num / 1000000 * mult) / mult) + 'M'
    }
  }])

  .filter('nl2br', [function () {
    return function (text) {
      return text.replace(/\n/g, '<br/>')
    }
  }])

  .filter('shortUrl', [function () {
    return function (text) {
      if (typeof text !== 'string') {
        return text
      }
      return text.replace(/^https?:\/\//, '').replace(/^www\./, '')
    }
  }])

  .filter('richText', function ($filter) {
    var linkyFilter = $filter('linky')
    return function (text) {
      return linkyFilter(text, '_blank').replace(/\n|&#10;/g, '<br/>')
    }
  })

  .filter('relativeTime', function ($filter, _) {
    var langMinutesPluralize = _.pluralize('relative_time_pluralize_minutes_ago')
    var langHoursPluralize = _.pluralize('relative_time_pluralize_hours_ago')
    var dateOrTimeFilter = $filter('dateOrTime')

    return function (timestamp) {
      var diff = Math.abs(tsNow(true) - timestamp)

      if (diff < 60) {
        return _('relative_time_just_now')
      }
      if (diff < 3600) {
        var minutes = Math.floor(diff / 60)
        return langMinutesPluralize(minutes)
      }
      if (diff < 86400) {
        var hours = Math.floor(diff / 3600)
        return langHoursPluralize(hours)
      }
      return dateOrTimeFilter(timestamp, true)
    }
  })
