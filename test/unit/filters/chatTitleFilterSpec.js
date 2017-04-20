/* global describe, it, inject, expect, beforeEach */

describe('chatTitle filter', function () {
  var $filter, _, chatTitleFilter

  beforeEach(module('myApp.filters'))

  beforeEach(inject(function (_$filter_, ___) {
    $filter = _$filter_
    _ = ___
  }))

  beforeEach(function () {
    chatTitleFilter = $filter('chatTitle')
  })

  it('displays chat title deleted', function () {
    var expected = _('chat_title_deleted')
    var actual = chatTitleFilter(null)

    expect(actual).toEqual(expected)
  })

  it('displays the chat title', function () {
    var chat = {
      title: 'Telegraph is hot!'
    }
    var expected = chat.title
    var actual = chatTitleFilter(chat)

    expect(actual).toEqual(expected)
  })
})
