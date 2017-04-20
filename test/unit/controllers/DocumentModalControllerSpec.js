/* global describe, it, inject, expect, beforeEach, jasmine */

describe('DocumentModalController', function () {
  var $controller, $scope, $rootScope, $docManager, $errService, $input, $messManager, $pSelectService, $modalI, createController

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    $docManager = {}
    $docManager.wrapForHistory = jasmine.createSpy('wrapForHistory')
    $docManager.saveDocFile = jasmine.createSpy('saveDocFile')

    $input = {}
    $errService = {
      confirm: function (message) {
        $input = message
        return {
          then: function (f) {
            f()
          }
        }
      }
    }

    $pSelectService = {
      selectPeer: function (options) {
        $input = options
        return {
          then: function (f) {
            f('Peerselected')
          }
        }
      }
    }

    createController = function (spyBroadcast, spyOn) {
      if (spyBroadcast) {
        $rootScope.$broadcast = jasmine.createSpy('$broadcast')
      }
      if (spyOn) {
        $scope.$on = jasmine.createSpy('$on')
      }
      $controller('DocumentModalController', {
        $scope: $scope,
        $rootScope: $rootScope,
        $modalInstance: $modalI,
        PeersSelectService: $pSelectService,
        AppMessagesManager: $messManager,
        AppDocsManager: $docManager,
        AppPeersManager: {},
        ErrorService: $errService
      })
    }

    $messManager = {}
    $messManager.deleteMessages = jasmine.createSpy('deleteMessages')

    $modalI = {}
    $modalI.dismiss = jasmine.createSpy('dismissModal')

    inject(function (_$controller_, _$rootScope_) {
      $rootScope = _$rootScope_
      $scope = $rootScope.$new()
      $scope.docID = 'randomdoc'

      $controller = _$controller_
    })
  })

  // define tests
  it('sets the document in the scope', function (done) {
    createController(false, false)

    expect($docManager.wrapForHistory).toHaveBeenCalledWith($scope.docID)
    done()
  })

  it('forwards a message with a document', function (done) {
    createController(true, false)
    $scope.messageID = 'id039'

    $scope.forward()
    expect($input).toEqual({canSend: true})
    expect($scope.$broadcast).toHaveBeenCalledWith('history_focus', {
      peerString: 'Peerselected',
      attachment: {
        _: 'fwd_messages',
        id: [$scope.messageID]
      }
    })
    done()
  })

  it('deletes a message with a document', function (done) {
    createController(false, false)
    $scope.messageID = 'id123'

    $scope.delete()
    expect($input).toEqual({type: 'MESSAGE_DELETE'})
    expect($messManager.deleteMessages).toHaveBeenCalledWith([$scope.messageID])
    done()
  })

  it('downloads the document', function (done) {
    createController(false, false)

    $scope.download()
    expect($docManager.saveDocFile).toHaveBeenCalledWith($scope.docID)
    done()
  })

  it('delete a document linked to a message', function (done) {
    createController(false, true)
    $scope.messageID = 'id33'

    $rootScope.$broadcast('history_delete')
    expect($scope.$on).toHaveBeenCalledWith('history_delete', jasmine.any(Function))
    expect($modalI.dismiss).not.toHaveBeenCalled()
    done()
  })

  it('delete a document linked to a modal instance', function (done) {
    createController(false, false)
    $scope.messageID = 'id876'

    var $msgs = {}
    $msgs[$scope.messageID] = {message: 'some non-empty message'}
    $rootScope.$broadcast('history_delete', {msgs: $msgs})
    expect($modalI.dismiss).toHaveBeenCalled()
    done()
  })
})
