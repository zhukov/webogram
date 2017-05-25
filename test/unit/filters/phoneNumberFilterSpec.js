'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('phoneNumber filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.phoneNumberFilter = this.$filter('phoneNumber')
  })

  it('can handle "zero" values', function () {
    var input
    var expected = '+'
    var result = this.phoneNumberFilter(input)

    expect(result).toBe(expected)

    input = null
    result = this.phoneNumberFilter(input)

    expect(result).toBe(expected)

    input = 0
    result = this.phoneNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('removes all non-digits from a phoneNumber', function () {
    var input = '123nonnumber333333e3'
    var expected = '+1233333333'
    var result = this.phoneNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts phone number to a readable phone number (for Russia)', function () {
    // 7 is for russian Country calling code (https://en.wikipedia.org/wiki/Telephone_numbers_in_Europe)
    var input = '71234567890'
    var expected = '+7 (123) 456-78-90'
    var result = this.phoneNumberFilter(input)

    expect(result).toBe(expected)
  })
})
