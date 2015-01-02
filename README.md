[![Stories in Ready](https://badge.waffle.io/zhukov/webogram.png?label=ready&title=Ready)](https://waffle.io/zhukov/webogram)
## [Webogram](https://web.telegram.org) — Telegram Web App

Telegram offers great [apps for mobile communication](https://www.telegram.org). It is based on the [MTProto protocol](https://core.telegram.org/mtproto) and has an [Open API](https://core.telegram.org/api). I personally like Telegram for its speed and cloud-support (that makes a web app possible, unlike in the case of WA and others).

MTProto data can be carried over HTTP (SSL is also supported), so this project is my take at creating one.

That said, I'm using this app myself and I'd like to share its sources, so anyone can contribute to the development. Any help is welcome!


### Interface


Here are some screenshots of the interface:


![Sample screenshot 1](/app/img/screenshot1.png)
![Mobile screenshot 2](/app/img/screenshot2.png)
![Mobile screenshot 3](/app/img/screenshot3.png)


### Unsupported at the moment

* Secret chats
* Black list
* ...


### Maintained locations


| Description        | URL           | Type  |
| ------------- |-------------| -----:|
| Online Web-version (hosted on Telegram servers)      | https://web.telegram.org/ | hosted
| Online Web-version (hosted on GitHub pages)      | https://zhukov.github.io/webogram | hosted
| Chrome Web Store      | [https://chrome.google.com/webstore/detail/telegram/ clhhggbfdinjmjhajaheehoeibfljjno](https://chrome.google.com/webstore/detail/telegram/clhhggbfdinjmjhajaheehoeibfljjno) |   packed
| Firefox & FirefoxOS Marketplace | https://marketplace.firefox.com/app/telegram |    packed



**Hosted version**: the app is downloaded via HTTPS as a usual website. Will be available offline due to application cache.

**Packed version**: the app is downloaded at once in a package via HTTPS. The package is updated less frequently than the Web-version.

All of the apps above are submitted and maintained by [@zhukov](https://github.com/zhukov), so feel free to use them and report bugs [here](https://github.com/zhukov/webogram/issues). Please do not report bugs which reproduce only in different locations.


## Technical details

The app is based on AngularJS JavaScript framework, written in pure JavaScript. jQuery is used for DOM manipulations, and Bootstrap is the CSS-framework.


### Running locally


#### Running web-server

Project repository is based on angularjs-seed and includes a simple web-server, so it's easy to launch the app locally on your desktop.
Install [node.js](http://nodejs.org/) and run `node server.js`. Open page http://localhost:8000/app/index.html in your browser.

#### Running as Chrome Packaged App

To run this application in Google Chrome browser as a packaged app, open this URL in Chrome: `chrome://extensions/`, then tick "Developer mode" and press "Load unpacked extension...". Select the downloaded `app` folder and Webogram application should appear in the list.

#### Running as Firefox OS App

To run this application in Firefox as a packaged app, open "Menu" -> "Developer" -> "WebIDE" (or use `Shift + F8` shortcut). Choose "Open packaged app" from Project menu and select `app` folder.


### Third party libraries

Besides frameworks mentioned above, other libraries are used for protocol and UI needs. Here is the short list:

* [JSBN](http://www-cs-students.stanford.edu/~tjw/jsbn/)
* [CryptoJS](https://code.google.com/p/crypto-js/)
* [zlib.js](https://github.com/imaya/zlib.js)
* [UI Bootstrap](http://angular-ui.github.io/bootstrap/)
* [jQuery Emojiarea](https://github.com/diy/jquery-emojiarea)
* [nanoScrollerJS](https://github.com/jamesflorentino/nanoScrollerJS)
* [gemoji](https://github.com/github/gemoji)
* [emoji-data](https://github.com/iamcal/emoji-data)

Many thanks to all these libraries' authors and contributors. Detailed list with descriptions and licenses is available [here](/app/vendor).


### Licensing

The source code is licensed under GPL v3. License is available [here](/LICENSE).


### [Contribute](CONTRIBUTING.md)
