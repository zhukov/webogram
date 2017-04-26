'use strict'
/* global describe, it, inject, expect, beforeEach, tsNow*/

describe('dateOrTime filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.dateOrTimeFilter = this.$filter('dateOrTime')
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
    var expected = this.$filter('date')(input * 1000, 'shortTime')
    var result = this.dateOrTimeFilter(input, false)

    expect(result).toBe(expected)
  })

  it('can display the short date based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expected: (M or MM)/(D or DD)/YY
    var expected = this.$filter('date')(input * 1000 - 518400000, 'shortDate')
    var result = this.dateOrTimeFilter(input - 518400, false)

    expect(result).toBe(expected)
  })

  it('can display the medium-size date based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expected: Month(3 letters) Day, Year
    var expected = this.$filter('date')(input * 1000 - 518400000, 'mediumDate')
    var result = this.dateOrTimeFilter(input - 518400, true)

    expect(result).toBe(expected)
  })

  it('can display the day of the week (in short) based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expcected: Day of week in three letters (Mon, Tue, etc.)
    var expected = this.$filter('date')(input * 1000 - 43200000, 'EEE')
    var result = this.dateOrTimeFilter(input - 43200, false)

    expect(result).toBe(expected)
  })

  it('can display the day of the week based on timestamp', function () {
    var input = tsNow(true)
    // Outcome format expcected: Day of week (Monday, Tuesday, etc.)
    var expected = this.$filter('date')(input * 1000 - 43200000, 'EEEE')
    var result = this.dateOrTimeFilter(input - 43200, true)

    expect(result).toBe(expected)
  })
})
