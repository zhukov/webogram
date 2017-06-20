'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('AppWelcomeController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.ChangelogNotifyService = {
      checkUpdate: function () {}
    }

    this.LayoutSwitchService = {
      start: function () {}
    }

    this.MtpApiManager = {
      getUserID: function () {
        return {
          then: function () {}
        }
      }
    }

    inject(function (_$controller_, _$rootScope_, _$location_) {
      this.$controller = _$controller_
      this.$rootScope = _$rootScope_
      this.$location = _$location_
      this.$scope = _$rootScope_.$new()

      this.$controller('AppWelcomeController', {
        $scope: this.$scope,
        $location: this.$location,
        MtpApiManager: this.MtpApiManager,
        ErrorService: this.ErrorService,
        ChangelogNotifyService: this.ChangelogNotifyService,
        LayoutSwitchService: this.LayoutSwitchService
      })
    })
  })

  // https://stackoverflow.com/a/36460924
  it('executes a dummy spec', function (done) {
    expect(true).toBe(true)
    done()
  })
})
