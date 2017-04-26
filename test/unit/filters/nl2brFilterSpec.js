'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('nl2br filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.nl2brFilter = this.$filter('nl2br')
  })

  it('replaces an enter by a break-tag', function () {
    var input = 'Line one \n Line 2'
    var expected = 'Line one <br/> Line 2'
    var result = this.nl2brFilter(input)

    expect(result).toBe(expected)
  })

  it('replaces enters by break-tags', function () {
    var input = 'Line one \n Line 2 \n Line 3'
    var expected = 'Line one <br/> Line 2 <br/> Line 3'
    var result = this.nl2brFilter(input)

    expect(result).toBe(expected)
  })

  it('does not change the text if no enter is present', function () {
    var input, expected
    input = expected = 'Some random line with no enters'
    var result = this.nl2brFilter(input)

    expect(result).toBe(expected)
  })
})
