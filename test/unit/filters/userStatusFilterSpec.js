/* global describe, it, inject, expect, beforeEach , tsNow*/

describe('userStatus filter', function () {
  var $filter, _, userStatusFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    $filter = _$filter_
    _ = ___
  }))

  beforeEach(function () {
    userStatusFilter = $filter('userStatus')
  })

  it('can handle null values', function () {
    var input = { id: 1000 }
    var expected = _('user_status_support')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })

  it('can handle null values', function () {
    var input = { id: 777000 }
    var expected = _('user_status_service_notifications')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })

  it('can handle null values', function () {
    var input = { id: 777000 }
    var expected = _('user_status_service_notifications')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })

  it('can handle empty user statuses (when it is not a bot)', function () {
    var input = null
    var expected = _('user_status_long_ago')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)

    input = { id: 12321 }
    result = userStatusFilter(input)
    expect(result).toBe(expected)

    input = { id: 12321, status: {} }
    result = userStatusFilter(input)
    expect(result).toBe(expected)

    input = { id: 12321, status: {_: null} }
    result = userStatusFilter(input)
    expect(result).toBe(expected)

    input = { id: 12321, status: {_: null}, pFlag: {} }
    result = userStatusFilter(input)
    expect(result).toBe(expected)

    input = { id: 12321, status: {_: null}, pFlags: {bot: false} }
    result = userStatusFilter(input)
    expect(result).toBe(expected)
  })

  it('can handle empty user statuses when it is a bot', function () {
    var input = { id: 12321, status: {_: null}, pFlags: {bot: true} }
    var expected = _('user_status_bot')
    var result = userStatusFilter(input, false)

    expect(result).toBe(expected)
  })

  it('can handle empty user statuses when it is a bot with privacy settings', function () {
    var input = { id: 12321, status: {_: null}, pFlags: {bot: true} }
    var expected = _('user_status_bot_privacy')
    var result = userStatusFilter(input, true)

    expect(result).toBe(expected)

    // Flags indicate true/false
    input.pFlags.bot_chat_history = true
    expected = _('user_status_bot_noprivacy')
    result = userStatusFilter(input, true)

    expect(result).toBe(expected)
  })

  it('can display a online status', function () {
    var input = { id: 12321, status: {_: 'userStatusOnline'} }
    var expected = _('user_status_online')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })

  it('can display that the user was recently online', function () {
    var input = { id: 12321, status: {_: 'userStatusRecently'} }
    var expected = _('user_status_recently')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })

  it('can display that the user was offline since a certain time', function () {
    var time = tsNow(true) - 360000 // 100 hours ago
    var relativeTimeFilter = $filter('relativeTime')
    var input = { id: 12321, status: {_: 'userStatusOffline', was_online: time} }
    var expected = _('user_status_last_seen', relativeTimeFilter(time))
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })

  // Further testing of relativeTimeFilter is done in relativeTimeFilterSpec.js

  it('can display that the user was online last week', function () {
    var input = { id: 12321, status: {_: 'userStatusLastWeek'} }
    var expected = _('user_status_last_week')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })

  it('can display that the user was online last month', function () {
    var input = { id: 12321, status: {_: 'userStatusLastMonth'} }
    var expected = _('user_status_last_month')
    var result = userStatusFilter(input)

    expect(result).toBe(expected)
  })
})
