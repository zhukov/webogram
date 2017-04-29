'use strict'
/* global describe, it, inject, expect, beforeEach */

describe('chatTitle filter', function () {
  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    this.$filter = _$filter_
    this._ = ___
  }))

  beforeEach(function () {
    this.chatTitleFilter = this.$filter('chatTitle')
  })

  it('displays chat title deleted', function () {
    var expected = this._('chat_title_deleted')
    var actual = this.chatTitleFilter(null)

    expect(actual).toEqual(expected)
  })

  it('displays the chat title', function () {
    var chat = {
      title: 'Telegraph is hot!'
    }
    var expected = chat.title
    var actual = this.chatTitleFilter(chat)

    expect(actual).toEqual(expected)
  })
})
