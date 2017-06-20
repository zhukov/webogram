'use strict'
/* global describe, it, inject, expect, beforeEach, jasmine, spyOn */

describe('VideoModalController', function () {
  beforeEach(module('myApp.controllers'))

  beforeEach(function () {
    this.AppDocsManager = {
      wrapVideoForFull: jasmine.createSpy('wrapVideoForFull'),
      saveDocFile: jasmine.createSpy('saveDocFile')
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

    var $modalInstance = this.$modalInstance
    var PeersSelectService = this.PeersSelectService
    var AppMessagesManager = this.AppMessagesManager
    var AppDocsManager = this.AppDocsManager
    var ErrorService = this.ErrorService

    inject(function (_$controller_, _$rootScope_) {
      this.$rootScope = _$rootScope_
      this.$scope = this.$rootScope.$new()
      this.$scope.docID = 'randomvideo'

      this.$controller = _$controller_

      spyOn(this.$rootScope, '$broadcast').and.callThrough()
      spyOn(this.$scope, '$on').and.callThrough()

      var $scope = this.$scope
      var $rootScope = this.$rootScope

      this.$controller('VideoModalController', {
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
  it('sets the video in the scope', function (done) {
    expect(this.$scope.progress).toEqual({enabled: false})
    expect(this.$scope.player).toEqual({})
    expect(this.AppDocsManager.wrapVideoForFull).toHaveBeenCalledWith(this.$scope.docID)
    done()
  })

  it('forwards a message with a video', function (done) {
    this.$scope.messageID = 'id68567'
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

  it('deletes a message with a video', function (done) {
    this.$scope.messageID = 'id235235'

    this.$scope.delete()
    expect(this.ErrorService.input).toEqual({type: 'MESSAGE_DELETE'})
    expect(this.AppMessagesManager.deleteMessages).toHaveBeenCalledWith([this.$scope.messageID])
    done()
  })

  it('downloads the document (video)', function (done) {
    this.$scope.download()
    expect(this.AppDocsManager.saveDocFile).toHaveBeenCalledWith(this.$scope.docID)
    done()
  })

  it('delete a video linked to a message', function (done) {
    this.$scope.messageID = 'id2352'

    this.$rootScope.$broadcast('history_delete')
    expect(this.$scope.$on).toHaveBeenCalledWith('history_delete', jasmine.any(Function))
    expect(this.$modalInstance.dismiss).not.toHaveBeenCalled()
    done()
  })

  it('can not delete a video not linked to a message', function (done) {
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

  describe('when the video is related to the message', function () {
    beforeEach(function () {
      this.update = {
        msgs: {}
      }
    })
    it('delete that video', function (done) {
      this.$scope.messageID = 'id33'
      this.update.msgs[this.$scope.messageID] = 'an update for id33'

      this.$rootScope.$broadcast('history_delete', this.update)
      expect(this.$scope.$on).toHaveBeenCalledWith('history_delete', jasmine.any(Function))
      expect(this.$modalInstance.dismiss).toHaveBeenCalled()
      done()
    })
  })
})
