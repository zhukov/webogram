'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine, spyOn */

describe('DocumentModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.AppDocsManager = {
      wrapForHistory: jasmine.createSpy('wrapForHistory'),
      saveDocFile: jasmine.createSpy('saveDocFile')
    }

    this.ErrorService = {
      $input: {},
      confirm: function (message) {
        this.$input = message
        return {
          then: function (f) {
            f()
          }
        }
      }
    }

    this.PeersSelectService = {
      $input: {},
      selectPeer: function (options) {
        this.$input = options
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

    var AppDocsManager = this.AppDocsManager
    var ErrorService = this.ErrorService
    var PeersSelectService = this.PeersSelectService
    var AppMessagesManager = this.AppMessagesManager
    var $modalInstance = this.$modalInstance

    inject(function (_$controller_, _$rootScope_) {
      this.$rootScope = _$rootScope_
      this.$scope = this.$rootScope.$new()
      this.$scope.docID = 'randomdoc'

      this.$controller = _$controller_

      spyOn(this.$rootScope, '$broadcast').and.callThrough()
      spyOn(this.$scope, '$on').and.callThrough()

      var $scope = this.$scope
      var $rootScope = this.$rootScope

      this.$controller('DocumentModalController', {
        $scope: $scope,
        $rootScope: $rootScope,
        $modalInstance: $modalInstance,
        PeersSelectService: PeersSelectService,
        AppMessagesManager: AppMessagesManager,
        AppDocsManager: AppDocsManager,
        AppPeersManager: {},
        ErrorService: ErrorService
      })
    })
  })

  // define tests
  it('sets the document in the scope', function (done) {
    expect(this.AppDocsManager.wrapForHistory).toHaveBeenCalledWith(this.$scope.docID)
    done()
  })

  it('forwards a message with a document', function (done) {
    this.$scope.messageID = 'id039'
    var messageID = this.$scope.messageID

    this.$scope.forward()
    expect(this.PeersSelectService.$input).toEqual({canSend: true})
    expect(this.$scope.$broadcast).toHaveBeenCalledWith('history_focus', {
      peerString: 'Peerselected',
      attachment: {
        _: 'fwd_messages',
        id: [messageID]
      }
    })
    done()
  })

  it('deletes a message with a document', function (done) {
    this.$scope.messageID = 'id123'

    this.$scope.delete()
    expect(this.ErrorService.$input).toEqual({type: 'MESSAGE_DELETE'})
    expect(this.AppMessagesManager.deleteMessages).toHaveBeenCalledWith([this.$scope.messageID])
    done()
  })

  it('downloads the document', function (done) {
    this.$scope.download()
    expect(this.AppDocsManager.saveDocFile).toHaveBeenCalledWith(this.$scope.docID)
    done()
  })

  it('can not delete a document not linked to a message', function (done) {
    this.$scope.messageID = 'id42'

    var update = {}
    this.$rootScope.$broadcast('history_delete', update)
    expect(this.$scope.$on).toHaveBeenCalledWith('history_delete', jasmine.any(Function))
    expect(this.$modalInstance.dismiss).not.toHaveBeenCalled()

    update.msgs = {}
    this.$rootScope.$broadcast('history_delete', update)
    expect(this.$scope.$on).toHaveBeenCalledWith('history_delete', jasmine.any(Function))
    expect(this.$modalInstance.dismiss).not.toHaveBeenCalled()
    done()
  })

  describe('when the document is related to the message', function () {
    beforeEach(function () {
      this.update = {
        msgs: {}
      }
    })
    it('delete that document', function (done) {
      this.$scope.messageID = 'id33'
      this.update.msgs[this.$scope.messageID] = 'an update for id33'

      this.$rootScope.$broadcast('history_delete', this.update)
      expect(this.$scope.$on).toHaveBeenCalledWith('history_delete', jasmine.any(Function))
      expect(this.$modalInstance.dismiss).toHaveBeenCalled()
      done()
    })
  })
})
