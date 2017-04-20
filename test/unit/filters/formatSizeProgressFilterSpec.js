/* global describe, it, inject, expect, beforeEach */

describe('formatSizeProgress filter', function () {
  var $filter, _, formatSizeProgressFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    $filter = _$filter_
    _ = ___
  }))

  beforeEach(function () {
    formatSizeProgressFilter = $filter('formatSizeProgress')
  })

  it('can handle "zero"-input', function () {
    var input = { total: 0 }
    var expected = ''
    var result = formatSizeProgressFilter(input)

    expect(result).toBe(expected)
  })

  it('can format progress with different scale of machnitude', function () {
    var input = { total: 1024, done: 1023 }
    var expected = _('format_size_progress', {done: '1023 b', total: '1 KB'})
    var result = formatSizeProgressFilter(input)

    expect(result).toBe(expected)
  })

  it('can format progress with the same scale of size', function () {
    var input = { total: 2048, done: 1024 }
    var expected = _('format_size_progress_mulitple', {done: '1', total: '2', parts: 'KB'})
    var result = formatSizeProgressFilter(input)

    expect(result).toBe(expected)
  })

  // Further testing for options is done in formatSizeFilterSpec.js
})
