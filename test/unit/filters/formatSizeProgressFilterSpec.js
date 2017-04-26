'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('formatSizeProgress filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    this.$filter = _$filter_
    this._ = ___
  }))

  beforeEach(function () {
    this.formatSizeProgressFilter = this.$filter('formatSizeProgress')
  })

  it('can handle "zero"-input', function () {
    var input = { total: 0 }
    var expected = ''
    var result = this.formatSizeProgressFilter(input)

    expect(result).toBe(expected)
  })

  it('can format progress with different scale of magnitude', function () {
    var input = { total: 1024, done: 1023 }
    var expected = this._('format_size_progress', {done: '1023 b', total: '1 KB'})
    var result = this.formatSizeProgressFilter(input)

    expect(result).toBe(expected)
  })

  it('can format progress with the same scale of size', function () {
    var input = { total: 2048, done: 1024 }
    var expected = this._('format_size_progress_mulitple', {done: '1', total: '2', parts: 'KB'})
    var result = this.formatSizeProgressFilter(input)

    expect(result).toBe(expected)
  })

  // Further testing for options is done in formatSizeFilterSpec.js
})
