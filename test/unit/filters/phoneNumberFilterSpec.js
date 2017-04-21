/* global describe, it, inject, expect, beforeEach */

describe('phoneNumber filter', function () {
  var $filter, phoneNumberFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    $filter = _$filter_
  }))

  beforeEach(function () {
    phoneNumberFilter = $filter('phoneNumber')
  })

  it('can handle null values', function () {
    var input = null
    var expected = '+'
    var result = phoneNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('removes all non-digits from a phoneNumber', function () {
    var input = '123nonnumber333333e3'
    var expected = '+1233333333'
    var result = phoneNumberFilter(input)

    expect(result).toBe(expected)
  })

  it('converts phone number to a readable phone number (for Russia)', function () {
    // 7 is for russian Country calling code (https://en.wikipedia.org/wiki/Telephone_numbers_in_Europe)
    var input = '71234567890'
    var expected = '+7 (123) 456-78-90'
    var result = phoneNumberFilter(input)

    expect(result).toBe(expected)
  })
})
