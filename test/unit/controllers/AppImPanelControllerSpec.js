/* global describe, it, inject, expect, beforeEach, jasmine */

describe('AppImPanelController', function () {
  var $scope

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    inject(function (_$controller_, _$rootScope_) {
      $scope = _$rootScope_.$new()
      $scope.$on = jasmine.createSpy('$on')
      _$controller_('AppImPanelController', { $scope: $scope })
    })
  })

  // define tests
  it('sets $on(user_update) to no-operation function', function (done) {
    expect($scope.$on).toHaveBeenCalledWith('user_update', angular.noop)
    done()
  })
})
