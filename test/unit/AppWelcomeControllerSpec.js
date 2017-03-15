/* global describe, it, inject, expect, beforeEach */

describe('AppWelcomeController', function () {
  var $controller, $rootScope, $scope, $location, MtpApiManager, ErrorService,
    ChangelogNotifyService, LayoutSwitchService

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    ChangelogNotifyService = {
      checkUpdate: function () {}
    }

    LayoutSwitchService = {
      start: function () {}
    }

    MtpApiManager = {
      getUserID: function () {
        return {
          then: function () {}
        }
      }
    }

    module(function ($provide) {
      $provide.value('MtpApiManager', MtpApiManager)
    })

    inject(function (_$controller_, _$rootScope_, _$location_) {
      $controller = _$controller_
      $rootScope = _$rootScope_
      $location = _$location_

      $scope = $rootScope.$new()
      $controller('AppWelcomeController', {
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
