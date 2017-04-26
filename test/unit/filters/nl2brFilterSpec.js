'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('nl2br filter', function () {
  var $filter, nl2brFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    $filter = _$filter_
  }))

  beforeEach(function () {
    nl2brFilter = $filter('nl2br')
  })

  it('replaces an enter by a break-tag', function () {
    var input = 'Line one \n Line 2'
    var expected = 'Line one <br/> Line 2'
    var result = nl2brFilter(input)

    expect(result).toBe(expected)
  })

  it('replaces enters by break-tags', function () {
    var input = 'Line one \n Line 2 \n Line 3'
    var expected = 'Line one <br/> Line 2 <br/> Line 3'
    var result = nl2brFilter(input)

    expect(result).toBe(expected)
  })

  it('does not change the text if no enter is present', function () {
    var input, expected
    input = expected = 'Some random line with no enters'
    var result = nl2brFilter(input)

    expect(result).toBe(expected)
  })
})
