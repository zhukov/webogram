'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('formatSize filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.formatSizeFilter = this.$filter('formatSize')
  })

  it('converts zero', function () {
    var input = 0
    var expected = '0'
    var result = this.formatSizeFilter(input, false)

    expect(result).toBe(expected)
  })

  it('converts sizes below 1024 to byte', function () {
    var input = 234
    var expected = '234 b'
    var result = this.formatSizeFilter(input, false)

    expect(result).toBe(expected)

    input = 1023
    expected = '1023 b'
    result = this.formatSizeFilter(input, false)

    expect(result).toBe(expected)
  })

  it('converts sizes between 1024 and 1048576 to KB', function () {
    var input = 238994
    var expected = '233 KB'
    var result = this.formatSizeFilter(input, false)

    expect(result).toBe(expected)

    input = 1048575
    expected = '1024 KB'
    result = this.formatSizeFilter(input, false)

    expect(result).toBe(expected)
  })

  it('converts sizes above 1048576 to MB', function () {
    var input = 10485726
    var expected = '10 MB'
    var result = this.formatSizeFilter(input, false)

    expect(result).toBe(expected)

    input = 1048572676967876
    expected = '999996830.9 MB'
    result = this.formatSizeFilter(input, false)

    expect(result).toBe(expected)

    input = 10485726
    expected = '10.0 MB'
    result = this.formatSizeFilter(input, true)

    expect(result).toBe(expected)

    input = 1048572676967876
    expected = '999996830.9 MB'
    result = this.formatSizeFilter(input, true)

    expect(result).toBe(expected)
  })
})
