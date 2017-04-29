'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('myDate filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.myDateFilter = this.$filter('myDate')

    // https://stackoverflow.com/questions/4676195/why-do-i-need-to-multiply-unix-timestamps-by-1000-in-javascript
    this.miliSecondsToSeconds = 1000
    this.dateFilter = this.$filter('date')
  })

  it('can create a date based on timestamp', function () {
    var input = 1222222222
    var expected = this.dateFilter(input * this.miliSecondsToSeconds, 'fullDate') // For CEST: 'Wednesday, September 24, 2008'
    var result = this.myDateFilter(input)

    expect(result).toBe(expected)
  })

  it('can recollect a date based on timestamp', function () {
    var input = 12111114111
    var expected = this.dateFilter(input * this.miliSecondsToSeconds, 'fullDate') // For CEST: 'Thursday, October 15, 2353'
    var result1 = this.myDateFilter(input)

    expect(result1).toBe(expected)

    var result2 = this.myDateFilter(input)

    expect(result2).toBe(expected)
  })
})
