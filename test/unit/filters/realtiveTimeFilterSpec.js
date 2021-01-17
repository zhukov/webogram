'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine, tsNow*/

describe('relativeTime filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    this.$filter = _$filter_
    this._ = ___
  }))

  beforeEach(function () {
    this.minuteSpy = jasmine.createSpy()
    this.hourSpy = jasmine.createSpy()
    // local vars are used to prevent scoping problems
    var ms = this.minuteSpy
    var hs = this.hourSpy
    this._.pluralize = function (msgid) {
      if (msgid === 'relative_time_pluralize_minutes_ago') {
        return ms
      } else if (msgid === 'relative_time_pluralize_hours_ago') {
        return hs
      }
    }

    this.relativeTimeFilter = this.$filter('relativeTime', {$filter: this.$filter, _: this._})
  })

  it('can mark time as "just now"', function () {
    var input = tsNow(true)
    var expected = this._('relative_time_just_now')
    var result = this.relativeTimeFilter(input)

    expect(result).toBe(expected)
  })

  // because the exact of tsNow in hard to estimate, a Spy is used instead of checking the return value
  it('can convert time that is max. 1 hour away', function () {
    var input = tsNow(true) - 3500
    this.relativeTimeFilter(input)

    expect(this.minuteSpy).toHaveBeenCalled()
  })

  // because the exact of tsNow in hard to estimate, a Spy is used instead of checking the return value
  it('can convert time that is max. 24 hours away', function () {
    var input = tsNow(true) - 86000
    this.relativeTimeFilter(input)

    expect(this.hourSpy).toHaveBeenCalled()
  })

  it('can convert time after 24 hours based on timestamp', function () {
    var input = tsNow(true) - 1000000
    var expected = this.$filter('dateOrTime')(input, true)
    var result = this.relativeTimeFilter(input)

    expect(result).toBe(expected)
  })

  // Further testing on the dateOrTimeFilter is present in dateOrTimeFilterSpec.js
})
