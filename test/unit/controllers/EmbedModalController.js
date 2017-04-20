/* global describe, it, inject, expect, beforeEach, jasmine */

describe('EmbedModalController', function () {
  var $scope, $rootScope, $webpageManager, $errService, $input, $messManager, $pSelectService, $modalI

  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    $webpageManager = {}
    $webpageManager.wrapForFull = jasmine.createSpy('wrapForFull')

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

    $messManager = {}
    $messManager.deleteMessages = jasmine.createSpy('deleteMessages')

    $modalI = {}
    $modalI.dismiss = jasmine.createSpy('dismissModal')

    inject(function (_$controller_, _$rootScope_) {
      $rootScope = _$rootScope_
      $rootScope.$broadcast = jasmine.createSpy('$broadcast')
      $scope = $rootScope.$new()
      $scope.webpageID = 'www.notRelevant.com'
      _$controller_('EmbedModalController', {
        $q: {},
        $scope: $scope,
        $rootScope: $rootScope,
        $modalInstance: $modalI,
        PeersSelectService: $pSelectService,
        AppMessagesManager: $messManager,
        AppPeersManager: {},
        AppPhotosManager: {},
        AppWebPagesManager: $webpageManager,
        ErrorService: $errService
      })
    })
  })

  // define tests
  it('sets the embeded webpage in the scope', function (done) {
    expect($scope.nav).toEqual({})
    expect($webpageManager.wrapForFull).toHaveBeenCalledWith($scope.webpageID)
    done()
  })

  it('forwards a message with an embeded link', function (done) {
    $scope.messageID = 'id1234234'

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

  it('deletes a message with an embeded link', function (done) {
    $scope.messageID = 'id979565673'

    $scope.delete()
    expect($input).toEqual({type: 'MESSAGE_DELETE'})
    expect($messManager.deleteMessages).toHaveBeenCalledWith([$scope.messageID])
    done()
  })
})
