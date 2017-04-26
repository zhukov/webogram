'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('richText filter', function () {
  beforeEach(module('myApp.filters'))
  beforeEach(module('ngSanitize')) // necessary for linky filter

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.richTextFilter = this.$filter('richText')
  })

  it('changes url to actual link', function () {
    var input = 'a text that links to https://www.github.com'
    var expected = 'a text that links to <a target="_blank" href="https://www.github.com">https://www.github.com</a>'
    var result = this.richTextFilter(input)

    expect(result).toBe(expected)
  })

  it('changes urls to actual links', function () {
    var input = 'a text that links to https://www.github.com and https://www.github.com/zhukov/webogram'
    var expected = 'a text that links to <a target="_blank" href="https://www.github.com">https://www.github.com</a> and <a target="_blank" href="https://www.github.com/zhukov/webogram">https://www.github.com/zhukov/webogram</a>'
    var result = this.richTextFilter(input)

    expect(result).toBe(expected)
  })
})
