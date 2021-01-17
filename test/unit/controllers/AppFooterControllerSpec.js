'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('AppFooterController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.LayoutSwitchService = {
      serviceFlag: false,
      switchLayout: function (parameter) {
        this.serviceFlag = true
      }
    }

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_

      this.$scope = _$rootScope_.$new()
      this.$controller('AppFooterController', {
        $scope: this.$scope,
        LayoutSwitchService: this.LayoutSwitchService
      })
    })
  })

  // define tests
  it('calls the right function', function (done) {
    expect(this.LayoutSwitchService.serviceFlag).toBe(false)
    this.$scope.switchLayout(true)
    expect(this.LayoutSwitchService.serviceFlag).toBe(true)
    done()
  })
})
