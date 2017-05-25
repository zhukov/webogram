'use strict'
/* global describe, it, inject, expect, beforeEach, Config */

describe('ChangeLogModalController', function () {
  var $controller, $scope, modal, modalFlag

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    modalFlag = false
    modal = {
      open: function (data) {
        modalFlag = true
      }
    }

    inject(function (_$controller_, _$rootScope_) {
      $controller = _$controller_

      $scope = _$rootScope_.$new()
      $controller('ChangelogModalController', {
        $scope: $scope,
        $modal: modal
      })
    })
  })

  // define tests
  it('will have standard data when no function is called', function (done) {
    expect($scope.changelogHidden).toBe(false)
    expect($scope.changelogShown).toBe(false)
    expect($scope.currentVersion).toBe(Config.App.version)
    done()
  })

  it('will show the changelog', function (done) {
    $scope.showAllVersions()
    expect($scope.changelogHidden).toBe(false)
    expect($scope.changelogShown).toBe(true)
    done()
  })

  it('will allow to show any version when "changelogShown" is true', function (done) {
    $scope.changelogShown = true
    expect($scope.canShowVersion(null)).toBe(true)
    expect($scope.canShowVersion('0.0.1')).toBe(true)
    expect($scope.canShowVersion('0.1.0')).toBe(true)
    expect($scope.canShowVersion('1.0.0')).toBe(true)
    done()
  })

  it('will allow the version to be shown when the current verion is bigger than the last function', function (done) {
    expect($scope.canShowVersion('100.100.100')).toBe(true)
    done()
  })

  it('won\'t allow the version to be shown when it is smaller than the current version', function (done) {
    expect($scope.changelogHidden).toBe(false)
    expect($scope.canShowVersion('0.0.0')).toBe(false)
    expect($scope.changelogHidden).toBe(true)
    done()
  })

  it('will call modal when the changeUsername function is called', function (done) {
    expect(modalFlag).toBe(false)
    $scope.changeUsername()
    expect(modalFlag).toBe(true)
    done()
  })
})
