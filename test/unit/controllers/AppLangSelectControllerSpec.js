/* global describe, it, inject, expect, beforeEach, xit */

describe('AppLangSelectController', function () {
  var $controller, $scope

  beforeEach(module('ui.bootstrap'))
  beforeEach(module('myApp.services'))
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    inject(function (_$controller_, _$rootScope_, _, Storage, ErrorService, AppRuntimeManager) {
      $controller = _$controller_
      $scope = _$rootScope_.$new()
      $controller('AppLangSelectController', {
        $scope: $scope,
        _: _,
        Storage: Storage,
        ErrorService: ErrorService,
        AppRuntimeManager: AppRuntimeManager
      })
    })
  })

  it('holds the supportedLocales', function () {
    expect($scope.supportedLocales).toBeDefined()
  })

  it('holds langNames', function () {
    expect($scope.langNames).toBeDefined()
  })

  it('holds the current locale', function () {
    expect($scope.curLocale).toBeDefined()
  })

  it('has a locale form', function () {
    expect($scope.form).toBeDefined()
    expect($scope.form.locale).toBeDefined()
  })

  it('allows to select a locale', function () {
    expect($scope.localeSelect).toBeDefined()
  })

  describe('when the user switches the locale', function () {
    describe('and confirms the dialogue', function () {
      xit('reloads the app', function (done) {
        done()
      })
    })
  })
})
