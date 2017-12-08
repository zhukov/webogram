'use strict'
/* global describe, it, inject, expect, beforeEach, Config */

describe('ChangeLogModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.modal = {
      modalFlag: false,
      open: function (data) {
        this.modalFlag = true
      }
    }

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_

      this.$scope = _$rootScope_.$new()

      this.$controller('ChangelogModalController', {
        $scope: this.$scope,
        $modal: this.modal
      })
    })
  })

  // define tests
  it('will have standard data when no function is called', function (done) {
    expect(this.$scope.changelogHidden).toBe(false)
    expect(this.$scope.changelogShown).toBe(false)
    expect(this.$scope.currentVersion).toBe(Config.App.version)
    done()
  })

  it('will show the changelog', function (done) {
    this.$scope.showAllVersions()
    expect(this.$scope.changelogHidden).toBe(false)
    expect(this.$scope.changelogShown).toBe(true)
    done()
  })

  it('will allow to show any version when "changelogShown" is true', function (done) {
    this.$scope.changelogShown = true
    expect(this.$scope.canShowVersion(null)).toBe(true)
    expect(this.$scope.canShowVersion('0.0.1')).toBe(true)
    expect(this.$scope.canShowVersion('0.1.0')).toBe(true)
    expect(this.$scope.canShowVersion('1.0.0')).toBe(true)
    done()
  })

  it('will allow the version to be shown when the current verion is bigger than the last function', function (done) {
    expect(this.$scope.canShowVersion('100.100.100')).toBe(true)
    done()
  })

  it('won\'t allow the version to be shown when it is smaller than the current version', function (done) {
    expect(this.$scope.changelogHidden).toBe(false)
    expect(this.$scope.canShowVersion('0.0.0')).toBe(false)
    expect(this.$scope.changelogHidden).toBe(true)
    done()
  })

  it('will call modal when the changeUsername function is called', function (done) {
    expect(this.modal.modalFlag).toBe(false)
    this.$scope.changeUsername()
    expect(this.modal.modalFlag).toBe(true)
    done()
  })
})
