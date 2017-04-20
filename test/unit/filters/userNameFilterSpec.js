/* global describe, it, inject, expect, beforeEach */

describe('userName filter', function () {
  var $filter, _, userNameFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    $filter = _$filter_
    _ = ___
  }))

  beforeEach(function () {
    userNameFilter = $filter('userName')
  })

  it('displays user name deleted', function () {
    var expected = _('user_name_deleted')
    var actual = userNameFilter(null)

    expect(actual).toEqual(expected)
  })

  it('displays the first name', function () {
    var user = {
      first_name: 'John'
    }
    var expected = user.first_name
    var actual = userNameFilter(user)

    expect(actual).toEqual(expected)
  })

  it('displays both, the first and the last name', function () {
    var user = {
      first_name: 'John',
      last_name: 'Doe'
    }
    var expected = user.first_name + ' ' + user.last_name
    var actual = userNameFilter(user)

    expect(actual).toEqual(expected)
  })
})
