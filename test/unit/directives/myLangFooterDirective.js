'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('myLangFooter directive', function () {
  beforeEach(module('ui.bootstrap'))
  beforeEach(module('myApp.templates'))
  // ErrorServiceProvider in myApp.services is needed by
  // AppLangSelectController in myApp.controllers
  beforeEach(module('myApp.services'))
  beforeEach(module('myApp.controllers'))
  beforeEach(module('myApp.directives'))

  beforeEach(inject(function (_$compile_, _$rootScope_) {
    this.$compile = _$compile_
    this.$rootScope = _$rootScope_
  }))

  it('compiles a my-lang-footer attribute', function () {
    var compiledElement = this.$compile('<div my-lang-footer></div>')(this.$rootScope)
    this.$rootScope.$digest()
    expect(compiledElement.html()).toContain('footer_lang_link')
    expect(compiledElement.html()).toContain('AppLangSelectController')
  })

  it('compiles a my-lang-footer element', function () {
    var compiledElement = this.$compile('<my-lang-footer></my-lang-footer>')(this.$rootScope)
    this.$rootScope.$digest()
    expect(compiledElement.html()).toContain('footer_lang_link')
    expect(compiledElement.html()).toContain('AppLangSelectController')
  })
})
