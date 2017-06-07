'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('UsernameEditModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.mam = {
      errorField: false,
      isValid: true,
      invokeApi: function () {
        return this
      },
      getUserID: function () {
        return this
      },
      then: function (action, error) {
        if (!this.errorField) {
          action(this.isValid)
        } else {
          error(this.errorField)
        }
        return {
          finally: function (f) {
            f()
          }
        }
      }
    }

    this.aum = {
      saveApiUser: jasmine.createSpy('saveApiUser'),
      getUser: function (id) {
        return { username: 'bob' }
      }
    }

    this.mi = {
      close: jasmine.createSpy('close')
    }

    var mam = this.mam
    var aum = this.aum
    var mi = this.mi

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_
      var $scope = _$rootScope_.$new()
      this.$scope = $scope
      this.$controller('UsernameEditModalController', {
        $scope: $scope,
        $modalInstance: mi,
        AppUsersManager: aum,
        MtpApiManager: mam
      })
    })
  })

  // tests

  it('constructs the information for the modal', function (done) {
    var expected = {
      username: 'bob'
    }
    expect(this.$scope.profile).toEqual(expected)
    expect(this.$scope.error).toEqual({})
    done()
  })

  it('can handle a successful update of the username', function (done) {
    this.$scope.updateUsername()

    expect(this.$scope.checked).toEqual({})
    expect(this.aum.saveApiUser).toHaveBeenCalled()
    expect(this.mi.close).toHaveBeenCalled()
    done()
  })

  it('can handle a successful update of an empty/undefined username', function (done) {
    delete this.$scope.profile.username
    this.$scope.updateUsername()

    expect(this.$scope.checked).toEqual({})
    expect(this.aum.saveApiUser).toHaveBeenCalled()
    expect(this.mi.close).toHaveBeenCalled()
    done()
  })

  it('can handle an unsuccessful update of an unmodified username', function (done) {
    this.mam.errorField = { type: 'USERNAME_NOT_MODIFIED' }
    this.$scope.updateUsername()

    expect(this.$scope.checked).not.toBeDefined()
    expect(this.aum.saveApiUser).not.toHaveBeenCalled()
    expect(this.mi.close).toHaveBeenCalled()
    done()
  })

  it('can check an empty username on change', function (done) {
    this.$scope.profile.username = {}
    var expected = {}

    this.$scope.$digest()
    expect(this.$scope.checked).toEqual(expected)
    done()
  })

  it('can check an empty string as username', function (done) {
    this.$scope.profile.username = ''
    var expected = {}

    this.$scope.$digest()
    expect(this.$scope.checked).toEqual(expected)
    done()
  })

  it('can check the initial username', function (done) {
    // Previous username is expected to be valid
    this.$scope.$digest()
    var expected = true

    expect(this.$scope.checked.success).toBe(expected)
    done()
  })

  it('doesn\'t check anything when the name isn\'t changed', function (done) {
    this.$scope.$digest()
    delete this.$scope.checked.success
    this.$scope.$digest()

    expect(this.$scope.checked.success).not.toBeDefined()
    done()
  })

  it('can check an invalid username submission', function (done) {
    this.mam.isValid = false
    this.$scope.$digest()
    var expected = true

    expect(this.$scope.checked.error).toBe(expected)
    done()
  })

  it('can check an invalid username submission 2', function (done) {
    this.mam.errorField = { type: 'USERNAME_INVALID' }
    this.$scope.$digest()
    var expected = true

    expect(this.$scope.checked.error).toBe(expected)
    done()
  })
})
