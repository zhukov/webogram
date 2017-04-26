'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('userName filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    this.$filter = _$filter_
    this._ = ___
  }))

  beforeEach(function () {
    this.userNameFilter = this.$filter('userName')
  })

  it('displays user name deleted', function () {
    var expected = this._('user_name_deleted')
    var actual = this.userNameFilter(null)

    expect(actual).toEqual(expected)
  })

  it('displays the first name', function () {
    var user = {
      first_name: 'John'
    }
    var expected = user.first_name
    var actual = this.userNameFilter(user)

    expect(actual).toEqual(expected)
  })

  it('displays the last name', function () {
    var user = {
      last_name: 'Doe'
    }
    var expected = user.last_name
    var actual = this.userNameFilter(user)

    expect(actual).toEqual(expected)
  })

  it('displays both, the first and the last name', function () {
    var user = {
      first_name: 'John',
      last_name: 'Doe'
    }
    var expected = user.first_name + ' ' + user.last_name
    var actual = this.userNameFilter(user)

    expect(actual).toEqual(expected)
  })
})
