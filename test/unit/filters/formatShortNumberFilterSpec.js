/* global describe, it, inject, expect, beforeEach */

describe('formatShortNumber filter', function () {
  var $filter, formatShortNumberFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    $filter = _$filter_
  }))

  beforeEach(function () {
    formatShortNumberFilter = $filter('formatShortNumber')
  })

  it('converts zero', function () {
    var input = 0
    var expected = '0'
    var result = formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts numbers below 1000 to string with same value', function () {
    var input = 127
    var expected = '127'
    var result = formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 999
    expected = '999'
    result = formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts numbers between 1000 and 900000 to string with shorten value', function () {
    var input = 1276
    var expected = '1.3K'
    var result = formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 35444
    expected = '35K'
    result = formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 899999
    expected = '900K'
    result = formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts numbers above 900000 to string with shorten value', function () {
    var input = 900000
    var expected = '0.9M'
    var result = formatShortNumberFilter(input)

    expect(result).toBe(expected)

    input = 76785646867
    expected = '76786M'
    result = formatShortNumberFilter(input)

    expect(result).toBe(expected)
  })
})
