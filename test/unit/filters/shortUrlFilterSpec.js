'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('shortUrl filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.shortUrlFilter = this.$filter('shortUrl')
  })

  it('does not do anything if the input is not a string', function () {
    var input = {}
    var expected = input
    var result = this.shortUrlFilter(input)

    expect(result).toBe(expected)

    input = []
    expected = input
    result = this.shortUrlFilter(input)

    expect(result).toBe(expected)

    input = 11
    expected = input
    result = this.shortUrlFilter(input)

    expect(result).toBe(expected)
  })

  it('removes "http(s)" from a Url', function () {
    var input = 'https://github.com'
    var expected = 'github.com'
    var result = this.shortUrlFilter(input)

    expect(result).toBe(expected)

    input = 'http://github.com'
    result = this.shortUrlFilter(input)

    expect(result).toBe(expected)
  })

  it('does not remove other protocols from a Url', function () {
    var input, expected
    input = expected = 'ftp://github.com'
    var result = this.shortUrlFilter(input)

    expect(result).toBe(expected)

    input = expected = 'irc://github.com'
    result = this.shortUrlFilter(input)

    expect(result).toBe(expected)

    input = expected = 'tg://github.com'
    result = this.shortUrlFilter(input)

    expect(result).toBe(expected)
  })

  it('removes "www." from a Url', function () {
    var input = 'www.github.com'
    var expected = 'github.com'
    var result = this.shortUrlFilter(input)

    expect(result).toBe(expected)
  })

  it('removes "https://" and "www." from a Url', function () {
    var input = 'https://www.github.com'
    var expected = 'github.com'
    var result = this.shortUrlFilter(input)

    expect(result).toBe(expected)
  })
})
