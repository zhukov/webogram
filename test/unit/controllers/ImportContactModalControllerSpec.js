'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('ImportContactModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(inject(function (_$controller_, _$rootScope_) {
    this.$controller = _$controller_
    this.$rootScope = _$rootScope_

    this.pcs = {
      importSwitch: false,
      isAvailable: function () {
        return false
      },
      openPhonebookImport: function () {
        if (this.importSwitch) {
          return this.importTrue
        } else {
          return this.importFalse
        }
      },
      importFalse: {
        result: {
          then: function (f) {
            f(false)
          }
        }
      },
      importTrue: {
        result: {
          then: function (f) {
            f({0: 'dummy'})
          }
        }
      }
    }

    var pcs = this.pcs

    this.modalInst = {}
    this.modalInst.dismiss = jasmine.createSpy('dismiss')
    this.modalInst.close = jasmine.createSpy('close')
    var mi = this.modalInst

    var fin = {
      finally: function (f) {
        f()
      }
    }
    this.randomID = 123456852
    var rID = this.randomID
    this.aum = {
      importSwitch: false,
      importContact: function (phone, first, last) {
        this.input = {
          phone: phone,
          first: first,
          last: last
        }
        if (this.importSwitch) {
          return this.importTrue
        } else {
          return this.importFalse
        }
      },
      importFalse: {
        then: function (f) {
          f(null)
          return this.finally
        },
        finally: fin
      },
      importTrue: {
        then: function (f) {
          f(rID)
          return this.finally
        },
        finally: fin
      }
    }
    var aum = this.aum

    this.errs = {}
    this.errs.show = jasmine.createSpy('show')
    var errs = this.errs

    this.$scope = _$rootScope_.$new()
    var scope = this.$scope
    this.createController = function () {
      this.$controller('ImportContactModalController', {
        $scope: scope,
        $modalInstance: mi,
        $rootScope: _$rootScope_,
        AppUsersManager: aum,
        ErrorService: errs,
        PhonebookContactsService: pcs
      })
    }
  }))

  // define tests

  it('can create a controller when no imported contacts are defined', function (done) {
    this.createController()

    expect(this.$scope.importContact).toEqual({})
    done()
  })

  it('can create a controller when imported contacts are defined', function (done) {
    this.$scope.importContact = { non_empty: true }
    this.createController()
    var expected = { non_empty: true }

    expect(this.$scope.importContact).toEqual(expected)
    done()
  })

  describe('(when the controller is created), ', function () {
    beforeEach(function () {
      this.createController()
    })

    it('does nothing when no information was entered', function (done) {
      this.$scope.doImport()

      expect(this.$scope.progress).not.toBeDefined()

      // no Phonenumber
      this.$scope.importContact = {
        first_name: 'bob'
      }
      expect(this.$scope.progress).not.toBeDefined()
      done()
    })

    describe('when contact-information is added, it', function () {
      beforeEach(function () {
        this.$scope.importContact = {
          phone: '+316132465798'
        }
      })

      it('can handle phoneNumber that are not telegram users', function (done) {
        this.$scope.doImport()

        expect(this.errs.show).toHaveBeenCalledWith({ error: {code: 404, type: 'USER_NOT_USING_TELEGRAM'} })
        expect(this.modalInst.close).toHaveBeenCalledWith(null)
        expect(this.$scope.progress.enabled).not.toBeDefined()
        done()
      })

      it('can import contacts that are telegram users', function (done) {
        this.aum.importSwitch = true
        this.$scope.doImport()

        expect(this.errs.show).not.toHaveBeenCalled()
        expect(this.modalInst.close).toHaveBeenCalledWith(this.randomID)
        expect(this.$scope.progress.enabled).not.toBeDefined()
        expect(this.aum.input).toEqual({phone: '+316132465798', first: '', last: ''})
        done()
      })

      it('can handle contacts with first and last name', function (done) {
        this.$scope.importContact.first_name = 'jan'
        this.$scope.importContact.last_name = 'wandelaar'
        this.$scope.doImport()

        expect(this.aum.input).toEqual({phone: '+316132465798', first: 'jan', last: 'wandelaar'})
        done()
      })
    })

    it('can\'t import contacts from a phonebook if none were found', function (done) {
      this.$scope.importPhonebook()

      expect(this.modalInst.dismiss).toHaveBeenCalled()
      done()
    })

    it('can import contacts from a phonebook', function (done) {
      this.pcs.importSwitch = true
      this.$scope.importPhonebook()

      expect(this.modalInst.close).toHaveBeenCalledWith('dummy')
      done()
    })
  })
})
