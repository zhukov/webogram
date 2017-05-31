'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('CountrySelectModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(inject(function (_$controller_, _$rootScope_, ___) {
    this.$controller = _$controller_
    this.$rootScope = _$rootScope_
    this._ = ___

    this.$scope = _$rootScope_.$new()
    var scope = this.$scope
    this.createController = function () {
      this.$controller('CountrySelectModalController', {
        $scope: scope,
        $modalInstance: {},
        $rootScope: _$rootScope_,
        _: ___
      })
    }

    // Spy on IndexObject
    spyOn(SearchIndexManager, "indexObject").and.callThrough()
  }))

  // define tests

  // The tests before controller initiation.
  // In order to mock Config data

  it('initiates Country to select', function (done) {
    Config.CountryCodes = [['NL', 'country_select_modal_country_nl', '+31']]
    var expected = 'NL Netherlands +31'

    this.createController()

    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(0, expected, jasmine.any(Object));
    done()
  })

  it('initiates Countriy to select with 2 (or more) country codes', function (done) {
    Config.CountryCodes = [['VA', 'country_select_modal_country_va', '+39 06 698', '+379']]
    var expected = 'VA Vatican City +39 06 698 +379'

    this.createController()

    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(0, expected, jasmine.any(Object));
    done()
  })

  it('initiates Countries to select', function (done) {
    Config.CountryCodes = [['NL', 'country_select_modal_country_nl', '+31'], ['VA', 'country_select_modal_country_va', '+39 06 698', '+379']]
    var expected1 = 'NL Netherlands +31'
    var expected2 = 'VA Vatican City +39 06 698 +379'

    this.createController()

    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(0, expected1, jasmine.any(Object));
    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(1, expected2, jasmine.any(Object));
    done()
  })


  describe('(after initiation)', function () {
    beforeEach(function () {
      Config.CountryCodes = [['NL', 'country_select_modal_country_nl', '+31'], ['AB', 'country_select_modal_country_ab', '+7 840', '+7 940', '+995 44'], ['VA', 'country_select_modal_country_va', '+39 06 698', '+379']]
      this.createController()
    })

    it('initiates the right values', function (done) {
      expect(this.$scope.search).toEqual({})
      expect(this.$scope.slice).toEqual({limit: 20, limitDelta: 20})
      done()
    })

    it('creates a sorted list of all selectable countries', function (done) {
      this.$rootScope.$digest()
      var expected = [{ name: 'Abkhazia', code: '+7 840' }, { name: 'Abkhazia', code: '+7 940' }, { name: 'Abkhazia', code: '+995 44' }, { name: 'Netherlands', code: '+31' }, { name: 'Vatican City', code: '+39 06 698' }, { name: 'Vatican City', code: '+379' }]

      expect(this.$scope.countries).toEqual(expected)
      done()
    })

    it('creates a sorted list of all selectable countries for an empty string-input', function (done) {
      this.$rootScope.$digest()
      this.$scope.search.query = ''
      this.$rootScope.$digest()
      var expected = [{ name: 'Abkhazia', code: '+7 840' }, { name: 'Abkhazia', code: '+7 940' }, { name: 'Abkhazia', code: '+995 44' }, { name: 'Netherlands', code: '+31' }, { name: 'Vatican City', code: '+39 06 698' }, { name: 'Vatican City', code: '+379' }]

      expect(this.$scope.countries).toEqual(expected)
      done()
    })

    describe(', when an input is given,', function () {
      beforeEach(function () {
        this.$rootScope.$digest()
        this.$scope.search.query = 'A'
      })

      it('creates a sorted list of all countries containing the input', function (done) {
        var expected = [{ name: 'Abkhazia', code: '+7 840' }, { name: 'Abkhazia', code: '+7 940' }, { name: 'Abkhazia', code: '+995 44' }, { name: 'Netherlands', code: '+31' }, { name: 'Vatican City', code: '+39 06 698' }, { name: 'Vatican City', code: '+379' }]

        expect(this.$scope.countries).toEqual(expected)

        this.$rootScope.$digest()
        expected =[{ name: 'Abkhazia', code: '+7 840' }, { name: 'Abkhazia', code: '+7 940' }, { name: 'Abkhazia', code: '+995 44' }]

        expect(this.$scope.countries).toEqual(expected)
        done()
      })
    })

    describe(', when no sorting is available,', function () {
      beforeEach(function () {
        String.prototype.localeCompare = null
      })

      it('creates a list of all selectable countries', function (done) {
        this.$rootScope.$digest()
        var expected = [{ name: 'Netherlands', code: '+31' }, { name: 'Abkhazia', code: '+7 840' }, { name: 'Abkhazia', code: '+7 940' }, { name: 'Abkhazia', code: '+995 44' }, { name: 'Vatican City', code: '+39 06 698' }, { name: 'Vatican City', code: '+379' }]

        expect(this.$scope.countries).toEqual(expected)
        done()
      })
    })
  })
})
