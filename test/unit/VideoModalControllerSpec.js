/* global describe, it, inject, expect, beforeEach, jasmine */

describe('VideoModalController', function () {
  var $controller, $scope, $rootScope, $docManager, $errService, $input, $messManager, $pSelectService, $modalI, createController

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    $docManager = {}
    $docManager.wrapVideoForFull = jasmine.createSpy('wrapVideoForFull')
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
      $controller('VideoModalController', {
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
      $scope.docID = 'randomvideo'

      $controller = _$controller_
    })
  })

  // define tests
  it('sets the video in the scope', function (done) {
    createController(false, false)

    expect($scope.progress).toEqual({enabled: false})
    expect($scope.player).toEqual({})
    expect($docManager.wrapVideoForFull).toHaveBeenCalledWith($scope.docID)
    done()
  })

  it('forwards a message with a video', function (done) {
    createController(true, false)
    $scope.messageID = 'id68567'

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

  it('deletes a message with a video', function (done) {
    createController(false, false)
    $scope.messageID = 'id235235'

    $scope.delete()
    expect($input).toEqual({type: 'MESSAGE_DELETE'})
    expect($messManager.deleteMessages).toHaveBeenCalledWith([$scope.messageID])
    done()
  })

  it('downloads the document (video)', function (done) {
    createController(false, false)

    $scope.download()
    expect($docManager.saveDocFile).toHaveBeenCalledWith($scope.docID)
    done()
  })

  it('delete a video linked to a message', function (done) {
    createController(false, true)
    $scope.messageID = 'id2352'

    $rootScope.$broadcast('history_delete')
    expect($scope.$on).toHaveBeenCalledWith('history_delete', jasmine.any(Function))
    expect($modalI.dismiss).not.toHaveBeenCalled()
    done()
  })

  it('delete a video linked to a modal instance', function (done) {
    createController(false, false)
    $scope.messageID = 'id6234'

    var $msgs = {}
    $msgs[$scope.messageID] = {message: 'some non-empty message'}
    $rootScope.$broadcast('history_delete', {msgs: $msgs})
    expect($modalI.dismiss).toHaveBeenCalled()
    done()
  })
})
