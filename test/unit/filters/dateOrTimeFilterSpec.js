'use strict'
/* global describe, it, inject, expect, beforeEach, tsNow*/

describe('dateOrTime filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.dateOrTimeFilter = this.$filter('dateOrTime')

    // https://stackoverflow.com/questions/4676195/why-do-i-need-to-multiply-unix-timestamps-by-1000-in-javascript
    this.miliSecondsToSeconds = 1000
    this.sevenDaysAgo = -3600 * 24 * 7
    this.thirteenHoursAgo = -3600 * 13
  })

  it('can handle "zero"-values', function () {
    var input = 0
    var expected = ''
    var result = this.dateOrTimeFilter(input, false)

    expect(result).toBe(expected)
  })

  it('can display the time based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expected: HH:MM AM/PM
    var expected = this.$filter('date')(input * this.miliSecondsToSeconds, 'shortTime')
    var result = this.dateOrTimeFilter(input, false)

    expect(result).toBe(expected)
  })

  it('can display the short date based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expected: (M or MM)/(D or DD)/YY
    var expected = this.$filter('date')((input + this.sevenDaysAgo) * this.miliSecondsToSeconds, 'shortDate')
    var result = this.dateOrTimeFilter(input + this.sevenDaysAgo, false)

    expect(result).toBe(expected)
  })

  it('can display the medium-size date based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expected: Month(3 letters) Day, Year
    var expected = this.$filter('date')((input + this.sevenDaysAgo) * this.miliSecondsToSeconds, 'mediumDate')
    var result = this.dateOrTimeFilter(input + this.sevenDaysAgo, true)

    expect(result).toBe(expected)
  })

  it('can display the day of the week (in short) based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expcected: Day of week in three letters (Mon, Tue, etc.)
    var expected = this.$filter('date')((input + this.thirteenHoursAgo) * this.miliSecondsToSeconds, 'EEE')
    var result = this.dateOrTimeFilter(input + this.thirteenHoursAgo, false)

    expect(result).toBe(expected)
  })

  it('can display the day of the week based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expcected: Day of week (Monday, Tuesday, etc.)
    var expected = this.$filter('date')((input + this.thirteenHoursAgo) * this.miliSecondsToSeconds, 'EEEE')
    var result = this.dateOrTimeFilter(input + this.thirteenHoursAgo, true)

    expect(result).toBe(expected)
  })
})
