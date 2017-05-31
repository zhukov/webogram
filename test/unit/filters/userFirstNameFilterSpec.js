'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('userFirstName filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    this.$filter = _$filter_
    this._ = ___
  }))

  beforeEach(function () {
    this.userFirstNameFilter = this.$filter('userFirstName')
  })

  it('displays user first name deleted', function () {
    var expected = this._('user_first_name_deleted')
    var actual = this.userFirstNameFilter(null)

    expect(actual).toEqual(expected)
  })

  it('displays the first name', function () {
    var user = {
      first_name: 'John'
    }
    var expected = user.first_name
    var actual = this.userFirstNameFilter(user)

    expect(actual).toEqual(expected)
  })

  it('displays the last name alternatively', function () {
    var user = {
      last_name: 'Doe'
    }
    var expected = user.last_name
    var actual = this.userFirstNameFilter(user)

    expect(actual).toEqual(expected)
  })
})
