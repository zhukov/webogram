'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('PeerSelectController', function () {
  var $controller, $scope, $q, $mod, $APManager, $EService, createController, timeoutTime, $promiseData, $promise, $promiseFlag

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    // The modalInstance will propably usually give a boolean as return.
    // However, for testing purposes it is important to gain knowledge about the input of the function
    $mod = {
      close: function (arr) {
        return arr
      }
    }

    timeoutTime = 1000

    $APManager = {
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

    // The controller is created in the test in order to test different initial content of scope variables.
    createController = function () {
      $controller('PeerSelectController', {
        $scope: $scope,
        $modalInstance: $mod,
        $q: $q,
        AppPeersManager: $APManager,
        ErrorService: $EService
      })
    }

    $promiseFlag = false
    $promise = {
      then: function (f) {
        $promiseFlag = true
        f()
      }
    }

    $EService = {
      confirm: function (data) {
        $promiseData = data
        return $promise
      }
    }

    $q = {
      when: function () {
        return $promise
      }
    }

    inject(function (_$controller_, _$rootScope_) {
      $controller = _$controller_
      $scope = _$rootScope_.$new()
    })
  })

  it('initialises properties', function (done) {
    createController()

    // Set timer to give the controller time to resolve.
    setTimeout(function () {
      expect($scope.selectedPeers).toBeDefined()
      expect($scope.selectedPeersIDs).toBeDefined()
      expect($scope.selectedCount).toBeDefined()
    }, timeoutTime)

    done()
  })

  it('compiles with a shareLinkPromise that resolves', function (done) {
    var expected = 'testURL'
    $scope.shareLinkPromise = {
      then: function (resolve, reject) {
        setTimeout(resolve(expected), timeoutTime)
      }
    }
    createController()

    setTimeout(function () {
      expect($scope.shareLink.loading).toBe(true)
      expect($scope.shareLink.url).not.toBeDefined()
      setTimeout(function () {
        expect($scope.shareLink.url).toBe(expected)
      }, timeoutTime)
    }, timeoutTime)
    done()
  })

  it('compiles with a shareLinkPromise that doesn\'t resolve', function (done) {
    $scope.shareLinkPromise = {
      then: function (resolve, reject) {
        setTimeout(reject(), timeoutTime)
      }
    }
    createController()

    setTimeout(function () {
      expect($scope.shareLink.loading).toBe(true)
      setTimeout(function () {
        expect($scope.shareLink).not.toBeDefined()
      }, timeoutTime)
    }, timeoutTime)
    done()
  })

  it('can select and submit a single dialog without confirmed type', function (done) {
    createController()

    $scope.dialogSelect('dialogX')

    expect($promiseData).not.toBeDefined()
    expect($promiseFlag).toBe(true)

    done()
  })

  it('can select and submit a single dialog with confirmed type', function (done) {
    createController()

    $scope.confirm_type = 'INVITE_TO_GROUP'
    $scope.dialogSelect('dialogX')

    var expected = {
      type: 'INVITE_TO_GROUP',
      peer_id: 'X',
      peer_data: 'Xpeer'
    }

    expect($promiseData).toEqual(expected)
    expect($promiseFlag).toBe(true)

    done()
  })

  it('can select a dialog', function (done) {
    createController()

    $scope.multiSelect = true
    $scope.dialogSelect('dialogX')

    var expected = ['X']

    expect($scope.selectedPeers['X']).toBe('Xpeer')
    expect($scope.selectedCount).toBe(1)
    expect($scope.selectedPeerIDs).toEqual(expected)

    done()
  })

  it('can select multiple dialogs', function (done) {
    createController()

    $scope.multiSelect = true
    $scope.dialogSelect('dialogX')
    $scope.dialogSelect('dialogZ')
    $scope.dialogSelect('dialogY')

    var expected = ['Y', 'Z', 'X']

    expect($scope.selectedCount).toBe(3)
    expect($scope.selectedPeerIDs).toEqual(expected)

    done()
  })

  it('can unselect a dialog', function (done) {
    createController()

    $scope.multiSelect = true
    $scope.selectedCount = 1
    $scope.selectedPeers['Y'] = 'aYPeer'
    $scope.selectedPeerIDs.unshift('Y')

    $scope.dialogSelect('dialogY')

    var expected = []

    expect($scope.selectedPeers['Y']).not.toBeDefined()
    expect($scope.selectedCount).toBe(0)
    expect($scope.selectedPeerIDs).toEqual(expected)

    done()
  })

  it('can select multiple dialogs', function (done) {
    createController()

    $scope.multiSelect = true
    $scope.dialogSelect('dialogX')
    $scope.dialogSelect('dialogZ')
    $scope.dialogSelect('dialogY')
    $scope.dialogSelect('dialogZ')

    var expected = ['Y', 'X']

    expect($scope.selectedCount).toBe(2)
    expect($scope.selectedPeerIDs).toEqual(expected)

    done()
  })

  it('can\'t submit a empty set of dialogs', function (done) {
    createController()

    expect($scope.submitSelected()).not.toBeDefined()

    done()
  })

  it('can submit one dialog', function (done) {
    createController()

    $scope.selectedCount = 1
    $scope.selectedPeers['test'] = 'peer'
    var expected = ['Ptest']
    expect($scope.submitSelected()).toEqual(expected)

    done()
  })

  it('can submit multiple dialogs', function (done) {
    createController()

    $scope.selectedCount = 3
    $scope.selectedPeers['test1'] = $scope.selectedPeers['test2'] = $scope.selectedPeers['test4'] = 'peer'

    var expected = ['Ptest4', 'Ptest2', 'Ptest1']
    expect($scope.submitSelected()).toEqual(expected)

    done()
  })

  it('can toggle', function (done) {
    createController()

    var broadcastFlag = ''
    $scope.$broadcast = function (input) { broadcastFlag = input }

    $scope.toggleSearch()
    expect(broadcastFlag).toBe('dialogs_search_toggle')

    done()
  })
})
