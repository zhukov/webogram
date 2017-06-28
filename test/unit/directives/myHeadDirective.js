'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('myHead directive', function () {
  beforeEach(module('myApp.templates'))
  beforeEach(module('myApp.directives'))

  beforeEach(inject(function (_$compile_, _$rootScope_) {
    this.$compile = _$compile_
    this.$rootScope = _$rootScope_
  }))

  it('compiles a my-head attribute', function () {
    var compiledElement = this.$compile('<div my-head></div>')(this.$rootScope)
    this.$rootScope.$digest()
    expect(compiledElement.html()).toContain('tg_page_head')
  })

  it('compiles a my-head element', function () {
    var compiledElement = this.$compile('<my-head></my-head>')(this.$rootScope)
    this.$rootScope.$digest()
    expect(compiledElement.html()).toContain('tg_page_head')
  })
})
