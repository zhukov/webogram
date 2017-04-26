'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('durationRemains filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    this.$filter = _$filter_
  }))

  beforeEach(function () {
    this.durationRemainsFilter = this.$filter('durationRemains')
  })

  it('creates a readable string based on time and total time', function () {
    var totalTime = 120  // two minutes
    var currentTime = 100
    var expected = '-0:20'
    var result = this.durationRemainsFilter(currentTime, totalTime)

    expect(result).toBe(expected)
  })

  // Other behaviour is tested in durationFilterSpec.js
})
