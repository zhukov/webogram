[![Stories in Ready](https://badge.waffle.io/zhukov/webogram.png?label=ready&title=Ready)](https://waffle.io/zhukov/webogram)
## [Webogram](https://web.telegram.org) – Telegram Web App

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
* Black list and blocking user
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

## Contribute

You can help this project by reporting problems, suggestions, localizing it or contributing to the code.

### Report a problem or suggestion

Go to our [issue tracker](https://github.com/zhukov/webogram/issues) and check if your problem/suggestion is already reported. If not, create a new issue with a descriptive title and detail your suggestion or steps to reproduce the problem.

### Localization

If you don't see your native language available for Webogram and you can help with translation, please consult the [Telegram Translations Manual](core.telegram.org/translating_telegram).

To test your translation live, use [Localization guide](/app/js/locales/README.md).

### Contribute to the code

If you know how to code, we welcome you to send fixes and new features, but in order to be efficient we ask you to follow the following procedure:

* Fork this repo using the button at the top.
* Clone your forked repo locally.

``$ git clone git@github.com:yourname/webogram.git``

* Don't modify or work on the master branch, we'll use it to always be in sync with webogram upstream.

```
$ git remote add upstream git@github.com:zhukov/webogram.git
$ git fetch upstream
```

* Always create a new issue when you plan to work on a bug or new feature and wait for other devs input before start coding.
* Once the new feature is approved or the problem confirmed, go to your local copy and create a new branch to work on it. Use a descriptive name for it, include the issue number for reference.

``$ git checkout -b improve-contacts-99``

* Do your coding and push it to your fork. Include as few commits as possible (one should be enough) and a good description. Always include a reference to the issue with "Fix #number".

```
$ git add .
$ git commit -m "Improved contact list. Fix #99"
$ git push origin improve-contacts-99
```

* Do a new pull request from your "improve-contacts-99" branch to webogram "master".

#### How do changes suggested on a pull request

Some times when you do a PR, you will be asked to correct some code. You can do it on your work branch and commit normally, PR will be automatically updated.

``$ git commit -am "Ops, fixing typo"``

Once everything is OK, you will be asked to merge all commit messages into one to keep history clean.

``$ git rebase -i master``

Edit the file and mark as fixup (f) all commits you want to merge with the first one:

```
pick 1c85e07 Improved contact list. Fix #99
f c595f79 Ops, fixing typo
```

Once rebased you can force a push to your fork branch and the PR will be automatically updated.

``$ git push origin improve-contacts-99 --force``

#### How to keep your local branches updated

To keep your local master branch updated with upstream master, regularly do:

```
$ git fetch upstream
$ git checkout master
$ git pull --rebase upstream master
```

To update the branch you are coding in:

```
$ git checkout improve-contacts-99
$ git rebase master
```
