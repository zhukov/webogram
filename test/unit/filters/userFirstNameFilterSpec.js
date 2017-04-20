/* global describe, it, inject, expect, beforeEach */

describe('userFirstName filter', function () {
  var $filter, _, userFirstNameFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    $filter = _$filter_
    _ = ___
  }))

  beforeEach(function () {
    userFirstNameFilter = $filter('userFirstName')
  })

  it('displays user first name deleted', function () {
    var expected = _('user_first_name_deleted')
    var actual = userFirstNameFilter(null)

    expect(actual).toEqual(expected)
  })

  it('displays the first name', function () {
    var user = {
      first_name: 'John'
    }
    var expected = user.first_name
    var actual = userFirstNameFilter(user)

    expect(actual).toEqual(expected)
  })

  it('displays the last name alternatively', function () {
    var user = {
      last_name: 'Doe'
    }
    var expected = user.last_name
    var actual = userFirstNameFilter(user)

    expect(actual).toEqual(expected)
  })
})
