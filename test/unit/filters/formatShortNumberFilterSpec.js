'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('formatShortNumber filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.formatShortNumberFilter = this.$filter('formatShortNumber')
  })

  it('converts zero or undefined', function () {
    var input = 0
    var expected = '0'
    var result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = undefined
    result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts numbers below 1000 to string with same value', function () {
    var input = 127
    var expected = '127'
    var result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 999
    expected = '999'
    result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts numbers between 1000 and 900000 to string with shortened value', function () {
    var input = 1276
    var expected = '1.3K'
    var result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 35444
    expected = '35K'
    result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 899999
    expected = '900K'
    result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts numbers above 900000 to string with shortened value', function () {
    var input = 900000
    var expected = '0.9M'
    var result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 76785646867
    expected = '76786M'
    result = this.formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })
})
