## [Telegram for Devs](https://web.telegram.org) — Unofficial Webogram-based client

This is a web app based on Webogram, the official Telegram client. This is a modified
version that aims to help client and bot developers develop faster.

It includes several useful features:

- Display chat IDs
- Display message IDs
- API Playground
  - In the playground, you can mess around with the MTProto API without needing to
  set up your own client
- Evaluator
  - Simply evaluates a JS statement inside of a Angular `$scope`d controller
- Bot sign in
  - Log in with your bot's API token and see what it sees. Useful for getting bot-specific
  message IDs and testing access to certain groups.

### Coming soon

- Auto-fill/suggest methods on API playground
- Show field for each payload parameter on API playground instead of raw JSON input

### Screenshots

![Chat IDs](http://i.imgur.com/fA7guUx.png)

![API Playground](http://i.imgur.com/FnRMnV0.png0)

![Evaluator](http://i.imgur.com/sIPCQQG.png)

### Third party libraries

Besides the frameworks mentioned above, other libraries are used for protocol and UI needs. Here is the short list:

* [JSBN](http://www-cs-students.stanford.edu/~tjw/jsbn/)
* [CryptoJS](https://code.google.com/p/crypto-js/)
* [zlib.js](https://github.com/imaya/zlib.js)
* [UI Bootstrap](http://angular-ui.github.io/bootstrap/)
* [jQuery Emojiarea](https://github.com/diy/jquery-emojiarea)
* [nanoScrollerJS](https://github.com/jamesflorentino/nanoScrollerJS)
* [gemoji](https://github.com/github/gemoji)
* [emoji-data](https://github.com/iamcal/emoji-data)

Many thanks to all these libraries' authors and contributors. A detailed list with descriptions and licenses is available [here](/app/vendor).

### Licensing

The source code is licensed under GPL v3. License is available [here](/LICENSE).
