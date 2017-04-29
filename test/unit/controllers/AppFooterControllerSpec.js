'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('AppFooterController', function () {
  var $controller, $scope, service, serviceFlag

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    serviceFlag = false
    service = {
      switchLayout: function (parameter) {
        serviceFlag = true
      }
    }

    inject(function (_$controller_, _$rootScope_) {
      $controller = _$controller_

      $scope = _$rootScope_.$new()
      $controller('AppFooterController', {
        $scope: $scope,
        LayoutSwitchService: service
      })
    })
  })

  // define tests
  it('calls the right function', function (done) {
    expect(serviceFlag).toBe(false)
    $scope.switchLayout(null)
    expect(serviceFlag).toBe(true)
    done()
  })
})
