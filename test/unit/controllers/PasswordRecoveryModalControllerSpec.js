'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('PasswordRecoveryModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.PasswordManager = {
      errorField: null,
      recover: function () {
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

    this.ErrorService = { alert: jasmine.createSpy('alert') }
    this.modalInstance = {
      close: jasmine.createSpy('close'),
      dismiss: jasmine.createSpy('dismiss')
    }

    inject(function (_$controller_, _$rootScope_, ___) {
      this.$controller = _$controller_
      this.$scope = _$rootScope_.$new()
      this.$scope.recovery = {}

      this.$controller('PasswordRecoveryModalController', {
        $scope: this.$scope,
        $q: {},
        _: ___,
        PasswordManager: this.PasswordManager,
        MtpApiManager: {},
        ErrorService: this.ErrorService,
        $modalInstance: this.modalInstance
      })
    })
  })

  it('can handle a successful password change', function (done) {
    this.$scope.checkCode()

    expect(this.$scope.recovery.updating).toBe(true)
    expect(this.ErrorService.alert).toHaveBeenCalledWith('Password deactivated', 'You have disabled Two-Step Verification.')
    expect(this.modalInstance.close).toHaveBeenCalled()
    done()
  })

  describe('when an error occurs', function () {
    beforeEach(function () {
      this.PasswordManager.errorField = {}
    })

    it('cancels the recovery', function (done) {
      this.$scope.checkCode()

      expect(this.$scope.recovery.updating).not.toBeDefined()
      expect(this.ErrorService.alert).not.toHaveBeenCalled()
      expect(this.modalInstance.close).not.toHaveBeenCalled()
      done()
    })

    it('can handle the error for an empty code', function (done) {
      this.PasswordManager.errorField.type = 'CODE_EMPTY'
      this.$scope.checkCode()

      expect(this.$scope.recovery.error_field).toEqual('code')
      done()
    })

    it('can handle the error for an invalid code', function (done) {
      this.PasswordManager.errorField.type = 'CODE_INVALID'
      this.$scope.checkCode()

      expect(this.$scope.recovery.error_field).toEqual('code')
      done()
    })

    it('can handle the error for an empty password', function (done) {
      this.PasswordManager.errorField.type = 'PASSWORD_EMPTY'
      this.$scope.checkCode()

      expect(this.modalInstance.dismiss).toHaveBeenCalled()
      done()
    })

    it('can handle the error for the unavailability of the recovery', function (done) {
      this.PasswordManager.errorField.type = 'PASSWORD_RECOVERY_NA'
      this.$scope.checkCode()

      expect(this.modalInstance.dismiss).toHaveBeenCalled()
      done()
    })

    it('can handle the error for an expired recovery', function (done) {
      this.PasswordManager.errorField.type = 'PASSWORD_RECOVERY_EXPIRED'
      this.$scope.checkCode()

      expect(this.modalInstance.dismiss).toHaveBeenCalled()
      done()
    })
  })
})
