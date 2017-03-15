/* global describe, it, inject, expect, beforeEach */

describe('myHead directive', function () {
  var $compile, $rootScope

  beforeEach(module('myApp.templates'))
  beforeEach(module('myApp.directives'))

  beforeEach(inject(function (_$compile_, _$rootScope_) {
    $compile = _$compile_
    $rootScope = _$rootScope_
  }))

  it('compiles a my-head attribute', function () {
    var compiledElement = $compile('<div my-head></div>')($rootScope)
    $rootScope.$digest()  // Fire watchers
    expect(compiledElement.html()).toContain('tg_page_head')
  })

  it('compiles a my-head element', function () {
    var compiledElement = $compile('<my-head></my-head>')($rootScope)
    $rootScope.$digest()  // Fire watchers
    expect(compiledElement.html()).toContain('tg_page_head')
  })
})
