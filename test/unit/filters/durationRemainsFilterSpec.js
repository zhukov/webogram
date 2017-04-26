'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('durationRemains filter', function () {
  var $filter, durationRemainsFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_) {
    $filter = _$filter_
  }))

  beforeEach(function () {
    durationRemainsFilter = $filter('durationRemains')
  })

  it('creates a readable string based on time and total time', function () {
    var totalTime = 120  // two minutes
    var currentTime = 100
    var expected = '-0:20'
    var result = durationRemainsFilter(currentTime, totalTime)

    expect(result).toBe(expected)
  })

  // Other behaviour is tested in durationFilterSpec.js
})
