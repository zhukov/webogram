/* global describe, it, inject, expect, beforeEach */

describe('myLangFooter directive', function () {
  var $compile, $rootScope

  beforeEach(module('ui.bootstrap'))
  beforeEach(module('myApp.templates'))
  // ErrorServiceProvider in myApp.services is needed by
  // AppLangSelectController in myApp.controllers
  beforeEach(module('myApp.services'))
  beforeEach(module('myApp.controllers'))
  beforeEach(module('myApp.directives'))

  beforeEach(inject(function (_$compile_, _$rootScope_) {
    $compile = _$compile_
    $rootScope = _$rootScope_
  }))

  it('compiles a my-lang-footer attribute', function () {
    var compiledElement = $compile('<div my-lang-footer></div>')($rootScope)
    $rootScope.$digest()  // Fire watchers
    expect(compiledElement.html()).toContain('footer_lang_link')
    expect(compiledElement.html()).toContain('AppLangSelectController')
  })

  it('compiles a my-lang-footer element', function () {
    var compiledElement = $compile('<my-lang-footer></my-lang-footer>')($rootScope)
    $rootScope.$digest()  // Fire watchers
    expect(compiledElement.html()).toContain('footer_lang_link')
    expect(compiledElement.html()).toContain('AppLangSelectController')
  })
})
