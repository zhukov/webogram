'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine */

describe('EmbedModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.AppWebPagesManager = {
      wrapForFull: jasmine.createSpy('wrapForFull')
    }

    this.ErrorService = {
      input: {},
      confirm: function (message) {
        this.input = message
        return {
          then: function (f) {
            f()
          }
        }
      }
    }

    this.PeersSelectService = {
      input: {},
      selectPeer: function (options) {
        this.input = options
        return {
          then: function (f) {
            f('Peerselected')
          }
        }
      }
    }

    this.AppMessagesManager = {
      deleteMessages: jasmine.createSpy('deleteMessages')
    }

    this.$modalInstance = {
      dismiss: jasmine.createSpy('dismissModal')
    }

    inject(function (_$controller_, _$rootScope_) {
      this.$rootScope = _$rootScope_
      this.$rootScope.$broadcast = jasmine.createSpy('$broadcast')
      this.$scope = this.$rootScope.$new()
      this.$scope.webpageID = 'www.notRelevant.com'

      _$controller_('EmbedModalController', {
        $q: {},
        $scope: this.$scope,
        $rootScope: this.$rootScope,
        $modalInstance: this.$modalInstance,
        PeersSelectService: this.PeersSelectService,
        AppMessagesManager: this.AppMessagesManager,
        AppPeersManager: {},
        AppPhotosManager: {},
        AppWebPagesManager: this.AppWebPagesManager,
        ErrorService: this.ErrorService
      })
    })
  })

  // define tests
  it('sets the embeded webpage in the scope', function (done) {
    expect(this.$scope.nav).toEqual({})
    expect(this.AppWebPagesManager.wrapForFull).toHaveBeenCalledWith(this.$scope.webpageID)
    done()
  })

  it('forwards a message with an embeded link', function (done) {
    this.$scope.messageID = 'id1234234'
    var messageID = this.$scope.messageID

    this.$scope.forward()
    expect(this.PeersSelectService.input).toEqual({canSend: true})
    expect(this.$scope.$broadcast).toHaveBeenCalledWith('history_focus', {
      peerString: 'Peerselected',
      attachment: {
        _: 'fwd_messages',
        id: [messageID]
      }
    })
    done()
  })

  it('deletes a message with an embeded link', function (done) {
    this.$scope.messageID = 'id979565673'

    this.$scope.delete()
    expect(this.ErrorService.input).toEqual({type: 'MESSAGE_DELETE'})
    expect(this.AppMessagesManager.deleteMessages).toHaveBeenCalledWith([this.$scope.messageID])
    done()
  })
})
