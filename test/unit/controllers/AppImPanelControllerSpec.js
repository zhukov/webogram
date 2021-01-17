'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('AppImPanelController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    inject(function (_$controller_, _$rootScope_) {
      this.$scope = _$rootScope_.$new()
      this.$scope.$on = jasmine.createSpy('$on')
      _$controller_('AppImPanelController', { $scope: this.$scope })
    })
  })

  // define tests
  it('sets $on(user_update) to no-operation function', function (done) {
    expect(this.$scope.$on).toHaveBeenCalledWith('user_update', angular.noop)
    done()
  })
})
