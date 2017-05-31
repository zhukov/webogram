'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('PasswordRecoveryModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.pwm = {
      pwmError: null,
      recover: function () {
        var pwmError = this.pwmError
        return {
          then: function (action, error) {
            if (!pwmError) {
              action({})
            } else {
              error(pwmError)
            }
          }
        }
      }
    }

    this.errs = { alert: jasmine.createSpy('alert') }
    this.mi = {
      close: jasmine.createSpy('close'),
      dismiss: jasmine.createSpy('dismiss')
    }

    var pwm = this.pwm
    var errs = this.errs
    var mi = this.mi

    inject(function (_$controller_, _$rootScope_, ___) {
      this.$controller = _$controller_
      var $scope = _$rootScope_.$new()
      $scope.recovery = {}
      this.$scope = $scope
      this.$controller('PasswordRecoveryModalController', {
        $scope: $scope,
        $q: {},
        _: ___,
        PasswordManager: pwm,
        MtpApiManager: {},
        ErrorService: errs,
        $modalInstance: mi
      })
    })
  })

  // tests

  it('can handle a successful password change', function (done) {
    this.$scope.checkCode()

    expect(this.$scope.recovery.updating).toBe(true)
    expect(this.errs.alert).toHaveBeenCalledWith('Password deactivated', 'You have disabled Two-Step Verification.')
    expect(this.mi.close).toHaveBeenCalled()
    done()
  })

  describe('when an error occurs', function () {
    beforeEach(function () {
      this.pwm.pwmError = {}
    })

    it('cancels the recovery', function (done) {
      this.$scope.checkCode()

      expect(this.$scope.recovery.updating).not.toBeDefined()
      expect(this.errs.alert).not.toHaveBeenCalled()
      expect(this.mi.close).not.toHaveBeenCalled()
      done()
    })

    it('can handle the error for an empty code', function (done) {
      this.pwm.pwmError.type = 'CODE_EMPTY'
      this.$scope.checkCode()

      expect(this.$scope.recovery.error_field).toEqual('code')
      done()
    })

    it('can handle the error for an invalid code', function (done) {
      this.pwm.pwmError.type = 'CODE_INVALID'
      this.$scope.checkCode()

      expect(this.$scope.recovery.error_field).toEqual('code')
      done()
    })

    it('can handle the error for an empty password', function (done) {
      this.pwm.pwmError.type = 'PASSWORD_EMPTY'
      this.$scope.checkCode()

      expect(this.mi.dismiss).toHaveBeenCalled()
      done()
    })

    it('can handle the error for the unavailability of the recovery', function (done) {
      this.pwm.pwmError.type = 'PASSWORD_RECOVERY_NA'
      this.$scope.checkCode()

      expect(this.mi.dismiss).toHaveBeenCalled()
      done()
    })

    it('can handle the error for an expired recovery', function (done) {
      this.pwm.pwmError.type = 'PASSWORD_RECOVERY_EXPIRED'
      this.$scope.checkCode()

      expect(this.mi.dismiss).toHaveBeenCalled()
      done()
    })
  })
})
