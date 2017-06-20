'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('PeerSelectController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    // The modalInstance will propably usually give a boolean as return.
    // However, for testing purposes it is important to gain knowledge about the input of the function
    this.$modalInstance = {
      close: function (arr) {
        return arr
      }
    }

    this.waitOneSecond = 1000

    this.AppPeersManager = {
      getPeerString: function (str) {
        return 'P'.concat(str)
      },
      getPeerID: function (str) {
        return str.slice(-1)
      },
      getPeer: function (id) {
        return id.concat('peer')
      }
    }

    this.promise = {
      promiseFlag: false,
      then: function (f) {
        this.$promiseFlag = true
        f()
      }
    }

    var promise = this.promise

    this.$q = {
      when: function () {
        return promise
      }
    }

    this.ErrorService = {
      $promiseData: {},
      confirm: function (data) {
        this.$promiseData = data
        return promise
      }
    }

    var $q = this.$q
    var AppPeersManager = this.AppPeersManager
    var $modalInstance = this.$modalInstance
    var ErrorService = this.ErrorService

    inject(function (_$controller_, _$rootScope_) {
      this.$controller = _$controller_
      this.$scope = _$rootScope_.$new()
      var $scope = this.$scope
      var $controller = this.$controller

      // The controller is created in the test in order to test different initial content of scope variables.
      this.createController = function () {
        $controller('PeerSelectController', {
          $scope: $scope,
          $modalInstance: $modalInstance,
          $q: $q,
          AppPeersManager: AppPeersManager,
          ErrorService: ErrorService
        })
      }
    })
  })

  it('initialises properties', function (done) {
    this.createController()

    // Set timer to give the controller time to resolve.
    setTimeout(function () {
      expect(this.$scope.selectedPeers).toBeDefined()
      expect(this.$scope.selectedPeersIDs).toBeDefined()
      expect(this.$scope.selectedCount).toBeDefined()
    }, this.waitOneSecond)

    done()
  })

  it('compiles with a shareLinkPromise that resolves', function (done) {
    var expected = 'testURL'
    var waitOneSecond = this.waitOneSecond
    this.$scope.shareLinkPromise = {
      then: function (resolve, reject) {
        setTimeout(resolve(expected), waitOneSecond)
      }
    }
    this.createController()

    setTimeout(function () {
      expect(this.$scope.shareLink.loading).toBe(true)
      expect(this.$scope.shareLink.url).not.toBeDefined()
      setTimeout(function () {
        expect(this.$scope.shareLink.url).toBe(expected)
      }, waitOneSecond)
    }, waitOneSecond)
    done()
  })

  it('compiles with a shareLinkPromise that doesn\'t resolve', function (done) {
    var waitOneSecond = this.waitOneSecond
    this.$scope.shareLinkPromise = {
      then: function (resolve, reject) {
        setTimeout(reject(), waitOneSecond)
      }
    }
    this.createController()

    setTimeout(function () {
      expect(this.$scope.shareLink.loading).toBe(true)
      setTimeout(function () {
        expect(this.$scope.shareLink).not.toBeDefined()
      }, waitOneSecond)
    }, waitOneSecond)
    done()
  })

  describe('after initialisation', function () {
    beforeEach(function () {
      this.createController()
    })

    it('can select and submit a single dialog without confirmed type', function (done) {
      this.$scope.dialogSelect('dialogX')

      expect(this.ErrorService.$promiseData).toEqual({})
      expect(this.promise.$promiseFlag).toBe(true)

      done()
    })

    it('can select and submit a single dialog with confirmed type', function (done) {
      this.$scope.confirm_type = 'INVITE_TO_GROUP'
      this.$scope.dialogSelect('dialogX')

      var expected = {
        type: 'INVITE_TO_GROUP',
        peer_id: 'X',
        peer_data: 'Xpeer'
      }

      expect(this.ErrorService.$promiseData).toEqual(expected)
      expect(this.promise.$promiseFlag).toBe(true)

      done()
    })

    it('can select a dialog', function (done) {
      this.$scope.multiSelect = true
      this.$scope.dialogSelect('dialogX')

      var expected = ['X']

      expect(this.$scope.selectedPeers['X']).toBe('Xpeer')
      expect(this.$scope.selectedCount).toBe(1)
      expect(this.$scope.selectedPeerIDs).toEqual(expected)

      done()
    })

    it('can select multiple dialogs', function (done) {
      this.$scope.multiSelect = true
      this.$scope.dialogSelect('dialogX')
      this.$scope.dialogSelect('dialogZ')
      this.$scope.dialogSelect('dialogY')

      var expected = ['Y', 'Z', 'X']

      expect(this.$scope.selectedCount).toBe(3)
      expect(this.$scope.selectedPeerIDs).toEqual(expected)

      done()
    })

    it('can unselect a dialog', function (done) {
      this.$scope.multiSelect = true
      this.$scope.selectedCount = 1
      this.$scope.selectedPeers['Y'] = 'aYPeer'
      this.$scope.selectedPeerIDs.unshift('Y')

      this.$scope.dialogSelect('dialogY')

      var expected = []

      expect(this.$scope.selectedPeers['Y']).not.toBeDefined()
      expect(this.$scope.selectedCount).toBe(0)
      expect(this.$scope.selectedPeerIDs).toEqual(expected)

      done()
    })

    it('can select multiple dialogs', function (done) {
      this.$scope.multiSelect = true
      this.$scope.dialogSelect('dialogX')
      this.$scope.dialogSelect('dialogZ')
      this.$scope.dialogSelect('dialogY')
      this.$scope.dialogSelect('dialogZ')

      var expected = ['Y', 'X']

      expect(this.$scope.selectedCount).toBe(2)
      expect(this.$scope.selectedPeerIDs).toEqual(expected)

      done()
    })

    it('can\'t submit a empty set of dialogs', function (done) {
      expect(this.$scope.submitSelected()).not.toBeDefined()

      done()
    })

    it('can submit one dialog', function (done) {
      this.$scope.selectedCount = 1
      this.$scope.selectedPeers['test'] = 'peer'
      var expected = ['Ptest']
      expect(this.$scope.submitSelected()).toEqual(expected)

      done()
    })

    it('can submit multiple dialogs', function (done) {
      this.$scope.selectedCount = 3
      this.$scope.selectedPeers['test1'] = this.$scope.selectedPeers['test2'] = this.$scope.selectedPeers['test4'] = 'peer'

      var expected = ['Ptest4', 'Ptest2', 'Ptest1']
      expect(this.$scope.submitSelected()).toEqual(expected)

      done()
    })

    it('can toggle', function (done) {
      var broadcastFlag = ''
      this.$scope.$broadcast = function (input) { broadcastFlag = input }

      this.$scope.toggleSearch()
      expect(broadcastFlag).toBe('dialogs_search_toggle')

      done()
    })
  })
})
