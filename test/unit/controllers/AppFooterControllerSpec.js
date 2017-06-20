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

    var LayoutSwitchService = this.LayoutSwitchService

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_

      this.$scope = _$rootScope_.$new()
      var $scope = this.$scope
      this.$controller('AppFooterController', {
        $scope: $scope,
        LayoutSwitchService: LayoutSwitchService
      })
    })
  })

  // define tests
  it('calls the right function', function (done) {
    expect(this.LayoutSwitchService.serviceFlag).toBe(false)
    this.$scope.switchLayout(null)
    expect(this.LayoutSwitchService.serviceFlag).toBe(true)
    done()
  })
})
