'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('UsernameEditModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.MtpApiManager = {
      errorField: false,
      isValid: true,
      invokeApi: function () {
        return this
      },
      getUserID: function () {
        return this
      },
      then: function (callback, error) {
        if (!this.errorField) {
          callback(this.isValid)
        } else {
          error(this.errorField)
        }
        return {
          finally: function (final) {
            final()
          }
        }
      }
    }

    this.AppUsersManager = {
      saveApiUser: jasmine.createSpy('saveApiUser'),
      getUser: function (id) {
        return { username: 'bob' }
      }
    }

    this.modalInstance = {
      close: jasmine.createSpy('close')
    }

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_
      this.$scope = _$rootScope_.$new()

      this.$controller('UsernameEditModalController', {
        $scope: this.$scope,
        $modalInstance: this.modalInstance,
        AppUsersManager: this.AppUsersManager,
        MtpApiManager: this.MtpApiManager
      })
    })
  })

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
    expect(this.AppUsersManager.saveApiUser).toHaveBeenCalled()
    expect(this.modalInstance.close).toHaveBeenCalled()
    done()
  })

  it('can handle a successful update of an empty/undefined username', function (done) {
    delete this.$scope.profile.username
    this.$scope.updateUsername()

    expect(this.$scope.checked).toEqual({})
    expect(this.AppUsersManager.saveApiUser).toHaveBeenCalled()
    expect(this.modalInstance.close).toHaveBeenCalled()
    done()
  })

  it('can handle an unsuccessful update of an unmodified username', function (done) {
    this.MtpApiManager.errorField = { type: 'USERNAME_NOT_MODIFIED' }
    this.$scope.updateUsername()

    expect(this.$scope.checked).not.toBeDefined()
    expect(this.AppUsersManager.saveApiUser).not.toHaveBeenCalled()
    expect(this.modalInstance.close).toHaveBeenCalled()
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

  it('does not check anything when the name is not changed', function (done) {
    this.$scope.$digest()
    delete this.$scope.checked.success
    this.$scope.$digest()

    expect(this.$scope.checked.success).not.toBeDefined()
    done()
  })

  it('can check an invalid username submission', function (done) {
    this.MtpApiManager.isValid = false
    this.$scope.$digest()
    var expected = true

    expect(this.$scope.checked.error).toBe(expected)
    done()
  })

  it('can check an invalid username submission 2', function (done) {
    this.MtpApiManager.errorField = { type: 'USERNAME_INVALID' }
    this.$scope.$digest()
    var expected = true

    expect(this.$scope.checked.error).toBe(expected)
    done()
  })
})
