'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine, xit */

describe('PhonebookContactsService', function () {
  beforeEach(module('ui.bootstrap'))
  beforeEach(module('myApp.services'))

  beforeEach(inject(function (_PhonebookContactsService_) {
    this.PhonebookContactsService = _PhonebookContactsService_
  }))

  describe('Public API:', function () {
    it('checks availability', function () {
      expect(this.PhonebookContactsService.isAvailable).toBeDefined()
    })

    it('open the phonebook for import', function () {
      expect(this.PhonebookContactsService.openPhonebookImport).toBeDefined()
    })

    it('get phonebook contacts', function () {
      expect(this.PhonebookContactsService.getPhonebookContacts).toBeDefined()
    })

    describe('usage', function () {
      describe('of isAvailable()', function () {
        it('returns false in most cases', function (done) {
          expect(this.PhonebookContactsService.isAvailable()).toBe(false)
          done()
        })
      })

      describe('of openPhonebookImport()', function () {
        beforeEach(function () {
          this.$modal = {
            open: jasmine.createSpy('open')
          }
        })

        xit('opens a modal', function () {
          this.PhonebookContactsService.openPhonebookImport()
          expect(this.$modal.open).toHaveBeenCalled()
        })
      })

      describe('of getPhonebookContacts()', function () {
        xit('will get rejected in most cases', function (done) {
          var promise = this.PhonebookContactsService.getPhonebookContacts()
          promise.finally(function () {
            expect(promise.isFullfilled()).toBe(true)
            done()
          })
        })
      })
    })
  })
})
