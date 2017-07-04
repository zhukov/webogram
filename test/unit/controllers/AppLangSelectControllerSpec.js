'use strict'
/* global describe, it, inject, expect, beforeEach, xit */

describe('AppLangSelectController', function () {
  beforeEach(module('ui.bootstrap'))
  beforeEach(module('myApp.services'))
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    inject(function (_$controller_, _$rootScope_, _, Storage, ErrorService, AppRuntimeManager) {
      this.$controller = _$controller_
      this.$scope = _$rootScope_.$new()

      this.$controller('AppLangSelectController', {
        $scope: this.$scope,
        _: _,
        Storage: Storage,
        ErrorService: ErrorService,
        AppRuntimeManager: AppRuntimeManager
      })
    })
  })

  it('holds the supportedLocales', function () {
    expect(this.$scope.supportedLocales).toBeDefined()
  })

  it('holds langNames', function () {
    expect(this.$scope.langNames).toBeDefined()
  })

  it('holds the current locale', function () {
    expect(this.$scope.curLocale).toBeDefined()
  })

  it('has a locale form', function () {
    expect(this.$scope.form).toBeDefined()
    expect(this.$scope.form.locale).toBeDefined()
  })

  it('allows to select a locale', function () {
    expect(this.$scope.localeSelect).toBeDefined()
  })

  describe('when the user switches the locale', function () {
    describe('and confirms the dialogue', function () {
      xit('reloads the app', function (done) {
        done()
      })
    })
  })
})
