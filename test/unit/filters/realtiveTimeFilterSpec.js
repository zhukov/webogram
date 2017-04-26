'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine, tsNow*/

describe('relativeTime filter', function () {
  var $filter, _, relativeTimeFilter, minuteSpy, hourSpy

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    $filter = _$filter_
    _ = ___
  }))

  beforeEach(function () {
    minuteSpy = jasmine.createSpy()
    hourSpy = jasmine.createSpy()
    _.pluralize = function (msgid) {
      if (msgid === 'relative_time_pluralize_minutes_ago') {
        return minuteSpy
      } else if (msgid === 'relative_time_pluralize_hours_ago') {
        return hourSpy
      }
    }

    relativeTimeFilter = $filter('relativeTime', {$filter: $filter, _: _})
  })

  it('can mark time as "just now"', function () {
    var input = tsNow(true)
    var expected = _('relative_time_just_now')
    var result = relativeTimeFilter(input)

    expect(result).toBe(expected)
  })

  // because the exact of tsNow in hard to estimate, a Spy is used instead of checking the return value
  it('can convert time that is max. 1 hour away', function () {
    var input = tsNow(true) - 3500
    relativeTimeFilter(input)

    expect(minuteSpy).toHaveBeenCalled()
  })

  // because the exact of tsNow in hard to estimate, a Spy is used instead of checking the return value
  it('can convert time that is max. 24 hours away', function () {
    var input = tsNow(true) - 86000
    relativeTimeFilter(input)

    expect(hourSpy).toHaveBeenCalled()
  })

  it('can convert time after 24 hours based on timestamp', function () {
    var input = tsNow(true) - 1000000
    var expected = $filter('dateOrTime')(input, true)
    var result = relativeTimeFilter(input)

    expect(result).toBe(expected)
  })

  // Further testing on the dateOrTimeFilter is present in dateOrTimeFilterSpec.js
})
