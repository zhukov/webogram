/* global describe, it, inject, expect, beforeEach */

describe('shortUrl filter', function () {
  var $filter, shortUrlFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    $filter = _$filter_
  }))

  beforeEach(function () {
    shortUrlFilter = $filter('shortUrl')
  })

  it('does not do anything if the input is not a string', function () {
    var input = {}
    var expected = input
    var result = shortUrlFilter(input)

    expect(result).toBe(expected)

    input = []
    expected = input
    result = shortUrlFilter(input)

    expect(result).toBe(expected)

    input = 11
    expected = input
    result = shortUrlFilter(input)

    expect(result).toBe(expected)
  })

  it('removes "https" from a Url', function () {
    var input = 'https://github.com'
    var expected = 'github.com'
    var result = shortUrlFilter(input)

    expect(result).toBe(expected)
  })

  it('removes "www." from a Url', function () {
    var input = 'www.github.com'
    var expected = 'github.com'
    var result = shortUrlFilter(input)

    expect(result).toBe(expected)
  })

  it('removes "https://" and "www." from a Url', function () {
    var input = 'https://www.github.com'
    var expected = 'github.com'
    var result = shortUrlFilter(input)

    expect(result).toBe(expected)
  })
})
