/* global describe, it, inject, expect, beforeEach, jasmine, xit */

describe('PhonebookContactsService', function () {
  var PhonebookContactsService, $modal

  beforeEach(module('ui.bootstrap'))
  beforeEach(module('myApp.services'))

  beforeEach(inject(function (_PhonebookContactsService_) {
    PhonebookContactsService = _PhonebookContactsService_
  }))

  describe('Public API:', function () {
    it('checks availability', function () {
      expect(PhonebookContactsService.isAvailable).toBeDefined()
    })

    it('open the phonebook for import', function () {
      expect(PhonebookContactsService.openPhonebookImport).toBeDefined()
    })

    it('get phonebook contacts', function () {
      expect(PhonebookContactsService.getPhonebookContacts).toBeDefined()
    })

    describe('usage', function () {
      describe('of isAvailable()', function () {
        it('returns false in most cases', function (done) {
          expect(PhonebookContactsService.isAvailable()).toBe(false)
          done()
        })
      })

      describe('of openPhonebookImport()', function () {
        beforeEach(function () {
          $modal = {
            open: jasmine.createSpy('open')
          }
        })

        xit('opens a modal', function () {
          PhonebookContactsService.openPhonebookImport()
          expect($modal.open).toHaveBeenCalled()
        })
      })

      describe('of getPhonebookContacts()', function () {
        xit('will get rejected in most cases', function (done) {
          var promise = PhonebookContactsService.getPhonebookContacts()
          promise.finally(function () {
            expect(promise.isFullfilled()).toBe(true)
            done()
          })
        })
      })
    })
  })
})
