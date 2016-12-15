describe('myLangFooter directive', function () {
  var $compile, $rootScope;

  beforeEach(module('ui.bootstrap'));
  beforeEach(module('myApp.partialCache'));
  beforeEach(module('myApp.i18n'));
  beforeEach(module('myApp.controllers'));
  beforeEach(module('myApp.filters'));
  beforeEach(module('myApp.directives'));
  beforeEach(module('myApp.services'));

  beforeEach(inject(function (_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('compiles a my-lang-footer attribute', function () {
    var compiledElement = $compile('<div my-lang-footer></div>')($rootScope);
    $rootScope.$digest();  // Fire watchers
    expect(compiledElement.html()).toContain('footer_lang_link');
  });

  it('compiles a my-lang-footer element', function () {
    var compiledElement = $compile('<my-lang-footer></my-lang-footer>')($rootScope);
    $rootScope.$digest();  // Fire watchers
    expect(compiledElement.html()).toContain('footer_lang_link');
  });
});
