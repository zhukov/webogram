'use strict'
/* global describe, it, inject, expect, beforeEach, afterEach, spyOn, jasmine, Config, SearchIndexManager */

describe('CountrySelectModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(inject(function (_$controller_, _$rootScope_, ___) {
    this.$controller = _$controller_
    this.$rootScope = _$rootScope_
    this._ = ___

    this.$scope = _$rootScope_.$new()
    this.createController = function () {
      this.$controller('CountrySelectModalController', {
        $scope: this.$scope,
        $modalInstance: {},
        $rootScope: this.$rootScope,
        _: this._
      })
    }

    spyOn(SearchIndexManager, 'indexObject').and.callThrough()
  }))

  beforeEach(function () {
    this.ConfigCountryCodes = Config.CountryCodes
    this.testData = {
      singleCode: {
        countryCode: ['NL', 'country_select_modal_country_nl', '+31'],
        countryCode_full: 'NL Netherlands +31',
        countryPhoneSets: [{ name: 'Netherlands', code: '+31' }]
      },
      multipleCode: {
        countryCode: ['VA', 'country_select_modal_country_va', '+39 06 698', '+379'],
        countryCode_full: 'VA Vatican City +39 06 698 +379',
        countryPhoneSets: [{ name: 'Vatican City', code: '+39 06 698' }, { name: 'Vatican City', code: '+379' }]
      },
      multipleCode2: {
        countryCode: ['AB', 'country_select_modal_country_ab', '+7 840', '+7 940', '+995 44'],
        countryCode_full: 'AB Abkhazia +7 840 +7 940 +995 44',
        countryPhoneSets: [{ name: 'Abkhazia', code: '+7 840' }, { name: 'Abkhazia', code: '+7 940' }, { name: 'Abkhazia', code: '+995 44' }]
      },
      allSetsSorted: function () {
        return [].concat(this.multipleCode2.countryPhoneSets, this.singleCode.countryPhoneSets, this.multipleCode.countryPhoneSets)
      },
      allSetsUnsorted: function () {
        return [].concat(this.singleCode.countryPhoneSets, this.multipleCode2.countryPhoneSets, this.multipleCode.countryPhoneSets)
      }
    }
  })

  afterEach(function () {
    Config.CountryCodes = this.ConfigCountryCodes
  })

  // The tests before controller initiation.
  // In order to mock Config data

  it('initiates Country to select', function (done) {
    Config.CountryCodes = [this.testData.singleCode.countryCode]
    var expected = this.testData.singleCode.countryCode_full

    this.createController()

    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(0, expected, jasmine.any(Object))
    done()
  })

  it('initiates Countriy to select with 2 (or more) country codes', function (done) {
    Config.CountryCodes = [this.testData.multipleCode.countryCode]
    var expected = this.testData.multipleCode.countryCode_full

    this.createController()

    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(0, expected, jasmine.any(Object))
    done()
  })

  it('initiates Countries to select', function (done) {
    Config.CountryCodes = [this.testData.singleCode.countryCode, this.testData.multipleCode.countryCode]
    var expected1 = this.testData.singleCode.countryCode_full
    var expected2 = this.testData.multipleCode.countryCode_full

    this.createController()

    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(0, expected1, jasmine.any(Object))
    expect(SearchIndexManager.indexObject).toHaveBeenCalledWith(1, expected2, jasmine.any(Object))
    done()
  })

  describe('(after initiation)', function () {
    beforeEach(function () {
      Config.CountryCodes = [this.testData.singleCode.countryCode, this.testData.multipleCode2.countryCode, this.testData.multipleCode.countryCode]
      this.createController()
    })

    it('initiates the right values', function (done) {
      expect(this.$scope.search).toEqual({})
      expect(this.$scope.slice).toEqual({limit: 20, limitDelta: 20})
      done()
    })

    it('creates a sorted list of all selectable countries', function (done) {
      this.$rootScope.$digest()
      var expected = this.testData.allSetsSorted()

      expect(this.$scope.countries).toEqual(expected)
      done()
    })

    it('creates a sorted list of all selectable countries for an empty string-input', function (done) {
      this.$rootScope.$digest()
      this.$scope.search.query = ''
      this.$rootScope.$digest()
      var expected = this.testData.allSetsSorted()

      expect(this.$scope.countries).toEqual(expected)
      done()
    })

    describe(', when an input is given,', function () {
      beforeEach(function () {
        this.$rootScope.$digest()
        this.$scope.search.query = 'A'
      })

      it('creates a sorted list of all countries containing the input', function (done) {
        var expected = this.testData.allSetsSorted()

        expect(this.$scope.countries).toEqual(expected)

        this.$rootScope.$digest()
        expected = this.testData.multipleCode2.countryPhoneSets

        expect(this.$scope.countries).toEqual(expected)
        done()
      })

      it('restore the original list when the input is deleted', function (done) {
        this.$rootScope.$digest()
        this.$scope.search.query = ''
        this.$rootScope.$digest()

        var expected = this.testData.allSetsSorted()

        expect(this.$scope.countries).toEqual(expected)
        done()
      })

      it('restore the original list when the input is changed', function (done) {
        this.$rootScope.$digest()
        this.$scope.search.query = 'Ne'
        this.$rootScope.$digest()

        var expected = this.testData.singleCode.countryPhoneSets

        expect(this.$scope.countries).toEqual(expected)
        done()
      })
    })

    describe(', when no sorting is available,', function () {
      beforeEach(function () {
        this.StringCompare = String.prototype.localeCompare
        String.prototype.localeCompare = null
      })

      afterEach(function () {
        String.prototype.localeCompare = this.StringCompare
      })

      it('creates a list of all selectable countries', function (done) {
        this.$rootScope.$digest()
        var expected = this.testData.allSetsUnsorted()

        expect(this.$scope.countries).toEqual(expected)
        done()
      })
    })
  })
})
