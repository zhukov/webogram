'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('ProfileEditModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    var id = 534196
    this.randomID = id

    this.API = {
      apiError: null,
      getUserID: function () {
        return {
          then: function (f) {
            f(id)
          }
        }
      },
      invokeApi: function (action, params) {
        var fin = {
          finally: function (f) {
            f()
          }
        }
        if (!this.apiError) {
          return {
            then: function (action, error) {
              action({})
              return fin
            }
          }
        } else {
          var err = this.apiError
          return {
            then: function (action, error) {
              error(err)
              return fin
            }
          }
        }
      }
    }

    this.aum = {
      getUser: function (userId) {
        return {
          first_name: 'John',
          last_name: 'Doe'
        }
      },
      saveApiUser: jasmine.createSpy('saveApiUser')
    }
    this.mi = { close: jasmine.createSpy('close') }

    var api = this.API
    var aum = this.aum
    var mi = this.mi

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_
      var $scope = _$rootScope_.$new()
      this.$scope = $scope
      this.$controller('ProfileEditModalController', {
        $scope: $scope,
        $modalInstance: mi,
        AppUsersManager: aum,
        MtpApiManager: api
      })
    })
  })

  // tests

  it('should initiate the right scope', function (done) {
    expect(this.$scope.profile).toEqual({first_name: 'John', last_name: 'Doe'})
    expect(this.$scope.error).toEqual({})
    done()
  })

  it('can send a successful profile update request', function (done) {
    this.$scope.updateProfile()

    expect(this.aum.saveApiUser).toHaveBeenCalled()
    expect(this.mi.close).toHaveBeenCalled()
    done()
  })

  it('can handle empty name/surname', function (done) {
    delete this.$scope.profile.first_name
    delete this.$scope.profile.last_name
    this.$scope.updateProfile()

    expect(this.aum.saveApiUser).toHaveBeenCalled()
    expect(this.mi.close).toHaveBeenCalled()
    done()
  })

  it('can handle an invalid first name error', function (done) {
    this.API.apiError = {type: 'FIRSTNAME_INVALID'}
    this.$scope.updateProfile()

    expect(this.$scope.error.field).toEqual('first_name')
    done()
  })

  it('can handle an invalid last name error', function (done) {
    this.API.apiError = {type: 'LASTNAME_INVALID'}
    this.$scope.updateProfile()

    expect(this.$scope.error.field).toEqual('last_name')
    done()
  })

  it('can handle an unmodified name error', function (done) {
    this.API.apiError = {type: 'NAME_NOT_MODIFIED'}
    this.$scope.updateProfile()

    expect(this.mi.close).toHaveBeenCalled()
    done()
  })
})
