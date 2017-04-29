'use strict'
/* global describe, it, inject, expect, beforeEach, Config */

describe('time filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  describe('on the mobile website', function () {
    beforeEach(function () {
      Config.Mobile = true
      this.timeFilter = this.$filter('time')
    })

    it('can create a short time based on timestamp', function () {
      var input = 1222
      var expected = '1:20 AM'
      var result = this.timeFilter(input)

      expect(result).toBe(expected)
    })

    it('can recollect a short time based on timestamp', function () {
      var input = 121155
      var expected = '10:39 AM'
      var result1 = this.timeFilter(input)

      expect(result1).toBe(expected)

      var result2 = this.timeFilter(input)

      expect(result2).toBe(expected)
    })
  })

  describe('on the desktop website', function () {
    beforeEach(function () {
      Config.Mobile = false
      this.timeFilter = this.$filter('time')
    })

    it('can create a medium-size time based on timestamp', function () {
      var input = 1222
      var expected = '1:20:22 AM'
      var result = this.timeFilter(input)

      expect(result).toBe(expected)
    })

    it('can recollect a medium-size time on timestamp', function () {
      var input = 121155
      var expected = '10:39:15 AM'
      var result1 = this.timeFilter(input)

      expect(result1).toBe(expected)

      var result2 = this.timeFilter(input)

      expect(result2).toBe(expected)
    })
  })
})
