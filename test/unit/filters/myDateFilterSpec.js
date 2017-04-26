'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('myDate filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.myDateFilter = this.$filter('myDate')
  })

  it('can create a date based on timestamp', function () {
    var input = 1222222222
    var expected = 'Wednesday, September 24, 2008'
    var result = this.myDateFilter(input)

    expect(result).toBe(expected)
  })

  it('can recollect a date based on timestamp', function () {
    var input = 12111114111
    var expected = 'Thursday, October 15, 2353'
    var result1 = this.myDateFilter(input)

    expect(result1).toBe(expected)

    var result2 = this.myDateFilter(input)

    expect(result2).toBe(expected)
  })
})
