'use strict'
/* global describe, it, inject, expect, beforeEach , tsNow*/

describe('userStatus filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    this.$filter = _$filter_
    this._ = ___
  }))

  beforeEach(function () {
    this.userStatusFilter = this.$filter('userStatus')
  })

  it('can recognize support users', function () {
    var input = { id: 1000 }
    var expected = this._('user_status_support')
    var result = this.userStatusFilter(input)

    expect(result).toBe(expected)
  })

  it('can recognize service notifications', function () {
    // id 777000 is the id of the service notifications channel
    var input = { id: 777000 }
    var expected = this._('user_status_service_notifications')
    var result = this.userStatusFilter(input)

    expect(result).toBe(expected)
  })

  describe('when the user is not a bot, it', function () {
    it('can handle empty user statuses', function () {
      var input = null
      var expected = this._('user_status_long_ago')
      var result = this.userStatusFilter(input)

      expect(result).toBe(expected)

      input = { id: 12321 }
      result = this.userStatusFilter(input)
      expect(result).toBe(expected)

      input = { id: 12321, status: {} }
      result = this.userStatusFilter(input)
      expect(result).toBe(expected)

      input = { id: 12321, status: {_: null} }
      result = this.userStatusFilter(input)
      expect(result).toBe(expected)

      input = { id: 12321, status: {_: null}, pFlag: {} }
      result = this.userStatusFilter(input)
      expect(result).toBe(expected)

      input = { id: 12321, status: {_: null}, pFlags: {bot: false} }
      result = this.userStatusFilter(input)
      expect(result).toBe(expected)
    })

    it('can display an online status', function () {
      var input = { id: 12321, status: {_: 'userStatusOnline'} }
      var expected = this._('user_status_online')
      var result = this.userStatusFilter(input)

      expect(result).toBe(expected)
    })

    it('can display that the user was recently online', function () {
      var input = { id: 12321, status: {_: 'userStatusRecently'} }
      var expected = this._('user_status_recently')
      var result = this.userStatusFilter(input)

      expect(result).toBe(expected)
    })

    it('can display that the user was offline since a certain time', function () {
      var time = tsNow(true) - 360000 // 100 hours ago
      var relativeTimeFilter = this.$filter('relativeTime')
      var input = { id: 12321, status: {_: 'userStatusOffline', was_online: time} }
      var expected = this._('user_status_last_seen', relativeTimeFilter(time))
      var result = this.userStatusFilter(input)

      expect(result).toBe(expected)
    })

    // Further testing of relativeTimeFilter is done in relativeTimeFilterSpec.js

    it('can display that the user was online last week', function () {
      var input = { id: 12321, status: {_: 'userStatusLastWeek'} }
      var expected = this._('user_status_last_week')
      var result = this.userStatusFilter(input)

      expect(result).toBe(expected)
    })

    it('can display that the user was online last month', function () {
      var input = { id: 12321, status: {_: 'userStatusLastMonth'} }
      var expected = this._('user_status_last_month')
      var result = this.userStatusFilter(input)

      expect(result).toBe(expected)
    })
  })

  describe('when the user is a bot', function () {
    beforeEach(function () {
      this.input = { id: 12321, status: {_: null}, pFlags: {bot: true} }
    })

    it('it can tell that the user is a bot', function () {
      var expected = this._('user_status_bot')
      var result = this.userStatusFilter(this.input)

      expect(result).toBe(expected)
    })

    describe('and the bot has privacy settings', function () {
      beforeEach(function () {
        this.privacySettings = true
      })

      it('it can tell that it is a bot with no acces to messages', function () {
        var expected = this._('user_status_bot_privacy')
        var result = this.userStatusFilter(this.input, this.privacySettings)

        expect(result).toBe(expected)
      })

      it('it can tell that it is a bot with acces to messages', function () {
        // Flags indicate true/false
        this.input.pFlags.bot_chat_history = true
        var expected = this._('user_status_bot_noprivacy')
        var result = this.userStatusFilter(this.input, this.privacySettings)

        expect(result).toBe(expected)
      })
    })
  })
})
