'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('ProfileEditModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    var id = 42
    this.randomID = id

    this.MtpApiManager = {
      errorField: null,
      getUserID: function () {
        return {
          then: function (callback) {
            callback(id)
          }
        }
      },
      invokeApi: function (action, params) {
        return this
      },
      then: function (callback, error) {
        if (!this.errorField) {
          callback({})
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
      getUser: function (userId) {
        return {
          first_name: 'John',
          last_name: 'Doe'
        }
      },
      saveApiUser: jasmine.createSpy('saveApiUser')
    }
    this.$modalInstance = { close: jasmine.createSpy('close') }

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_
      this.$scope = _$rootScope_.$new()

      this.$controller('ProfileEditModalController', {
        $scope: this.$scope,
        $modalInstance: this.$modalInstance,
        AppUsersManager: this.AppUsersManager,
        MtpApiManager: this.MtpApiManager
      })
    })
  })

  it('should initiate the right scope', function (done) {
    expect(this.$scope.profile).toEqual({first_name: 'John', last_name: 'Doe'})
    expect(this.$scope.error).toEqual({})
    done()
  })

  it('can send a successful profile update request', function (done) {
    this.$scope.updateProfile()

    expect(this.AppUsersManager.saveApiUser).toHaveBeenCalled()
    expect(this.$modalInstance.close).toHaveBeenCalled()
    done()
  })

  it('can handle empty name/surname', function (done) {
    delete this.$scope.profile.first_name
    delete this.$scope.profile.last_name
    this.$scope.updateProfile()

    expect(this.AppUsersManager.saveApiUser).toHaveBeenCalled()
    expect(this.$modalInstance.close).toHaveBeenCalled()
    done()
  })

  it('can handle an invalid first name error', function (done) {
    this.MtpApiManager.errorField = {type: 'FIRSTNAME_INVALID'}
    this.$scope.updateProfile()

    expect(this.$scope.error.field).toEqual('first_name')
    done()
  })

  it('can handle an invalid last name error', function (done) {
    this.MtpApiManager.errorField = {type: 'LASTNAME_INVALID'}
    this.$scope.updateProfile()

    expect(this.$scope.error.field).toEqual('last_name')
    done()
  })

  it('can handle an unmodified name error', function (done) {
    this.MtpApiManager.errorField = {type: 'NAME_NOT_MODIFIED'}
    this.$scope.updateProfile()

    expect(this.$modalInstance.close).toHaveBeenCalled()
    done()
  })
})
