'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('ImportContactModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.modalInstance = {
      close: jasmine.createSpy('close'),
      dismiss: jasmine.createSpy('dismiss')
    }

    this.randomID = 123456852

    function thenFinallyFactory (input) {
      return {
        then: function (callback) {
          callback(input)
          return {
            finally: function (callback) {
              callback()
            }
          }
        }
      }
    }

    this.AppUsersManager = {
      thenValue: null,
      importContact: function (phone, first, last) {
        this.input = {
          phone: phone,
          first: first,
          last: last
        }
        return thenFinallyFactory(this.thenValue)
      }
    }

    this.ErrorService = {
      show: jasmine.createSpy('show')
    }

    this.PhonebookContactsService = {
      thenValue: false,
      isAvailable: function () {
        return false
      },
      openPhonebookImport: function () {
        var then = thenFinallyFactory(this.thenValue)
        return {
          result: then
        }
      }
    }

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_
      this.$rootScope = _$rootScope_

      this.$scope = _$rootScope_.$new()
      this.createController = function () {
        this.$controller('ImportContactModalController', {
          $scope: this.$scope,
          $modalInstance: this.modalInstance,
          $rootScope: this.$rootScope,
          AppUsersManager: this.AppUsersManager,
          ErrorService: this.ErrorService,
          PhonebookContactsService: this.PhonebookContactsService
        })
      }
    })
  })

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

    it('does nothing when no phonenumber was entered', function (done) {
      this.$scope.doImport()

      expect(this.$scope.progress).not.toBeDefined()

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

        expect(this.ErrorService.show).toHaveBeenCalledWith({ error: {code: 404, type: 'USER_NOT_USING_TELEGRAM'} })
        expect(this.modalInstance.close).toHaveBeenCalledWith(null)
        expect(this.$scope.progress.enabled).not.toBeDefined()
        done()
      })

      it('can import contacts that are telegram users', function (done) {
        this.AppUsersManager.thenValue = this.randomID
        this.$scope.doImport()

        expect(this.ErrorService.show).not.toHaveBeenCalled()
        expect(this.modalInstance.close).toHaveBeenCalledWith(this.randomID)
        expect(this.$scope.progress.enabled).not.toBeDefined()
        expect(this.AppUsersManager.input).toEqual({phone: '+316132465798', first: '', last: ''})
        done()
      })

      it('can handle contacts with first and last name', function (done) {
        this.$scope.importContact.first_name = 'jan'
        this.$scope.importContact.last_name = 'wandelaar'
        this.$scope.doImport()

        expect(this.AppUsersManager.input).toEqual({phone: '+316132465798', first: 'jan', last: 'wandelaar'})
        done()
      })
    })

    it('can not import contacts from a phonebook if none were found', function (done) {
      this.$scope.importPhonebook()

      expect(this.modalInstance.dismiss).toHaveBeenCalled()
      done()
    })

    it('can import contacts from a phonebook', function (done) {
      this.PhonebookContactsService.thenValue = {0: 'dummy'}
      this.$scope.importPhonebook()

      expect(this.modalInstance.close).toHaveBeenCalledWith('dummy')
      done()
    })
  })
})
