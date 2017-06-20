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

    var MtpApiManager = this.MtpApiManager
    var ErrorService = this.ErrorService
    var ChangelogNotifyService = this.ChangelogNotifyService
    var LayoutSwitchService = this.LayoutSwitchService

    module(function ($provide) {
      $provide.value('MtpApiManager', MtpApiManager)
    })

    inject(function (_$controller_, _$rootScope_, _$location_) {
      this.$controller = _$controller_
      this.$rootScope = _$rootScope_
      this.$location = _$location_
      this.$scope = _$rootScope_.$new()

      var $location = this.$location
      var $scope = this.$scope

      this.$controller('AppWelcomeController', {
        $scope: $scope,
        $location: $location,
        MtpApiManager: MtpApiManager,
        ErrorService: ErrorService,
        ChangelogNotifyService: ChangelogNotifyService,
        LayoutSwitchService: LayoutSwitchService
      })
    })
  })

  // https://stackoverflow.com/a/36460924
  it('executes a dummy spec', function (done) {
    expect(true).toBe(true)
    done()
  })
})
