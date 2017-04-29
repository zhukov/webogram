'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('duration filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.durationFilter = this.$filter('duration')
  })

  it('converts duration in seconds to a readable string', function () {
    var input = 55
    var expected = '0:55'
    var result = this.durationFilter(input)

    expect(result).toBe(expected)

    input = 147
    expected = '2:27'
    result = this.durationFilter(input)

    expect(result).toBe(expected)
  })

  it('converts hours in seconds to readable string', function () {
    var input = 7282
    var expected = '2:01:22'
    var result = this.durationFilter(input)

    expect(result).toBe(expected)

    input = 4201
    expected = '1:10:01'
    result = this.durationFilter(input)

    expect(result).toBe(expected)
  })

  it('returns "zero" when not a valid input was given', function () {
    var input = 'not a number'
    var expected = '0:00'
    var result = this.durationFilter(input)

    expect(result).toBe(expected)

    input = {}
    result = this.durationFilter(input)

    expect(result).toBe(expected)

    input = []
    result = this.durationFilter(input)

    expect(result).toBe(expected)
  })
})
