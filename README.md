## [Webogram](http://zhukov.github.io/webogram) – UNOFFICIAL Telegram Web App

Telegram offers great [apps for mobile communication](https://www.telegram.org). It is based on the [MTProto protocol](https://core.telegram.org/protocol) and has an [Open API](http://core.telegram.org/api). I personally like Telegram for its speed and cloud-support (that makes a web app possible, unlike in the case of WA and others).

MTProto data can be carried over HTTP, but no official web-version for Telegram exists for the time being. So this project is my take at creating one.


> **Disclaimer**:
> This is an alpha version of the Telegram **UNOFFICIAL** web application. It may have undetected security issues, and there is definitely a load of bugs to fix, features to add and so on. So if you want 200% secure and fully functional communication, don't use this yet! You can always find Telegram official mobile applications here: https://telegram.org

That said, I'm using this app myself and I'd like to share its sources, so anyone can contribute to the development. Any help is welcome!


### Interface


Here are some screenshots of the interface:

![Sample screenshot 1](/app/img/screenshot1.png)


### Implemented functionality list

* Sign in by phone number + SMS code (no calls supported yet)
* View list of existings chats (up-posting) with infinite scrolling
* View messages history for each chat/group (bottom-posting) with infinite scrolling
* View brief profile info
* View group info, members list
* View media in messages: photo, video
* Download documents from messages
* Emoji display in all browsers (Chrome, non-OSX ones)
* Emoji keyboard
* Send plain-text messages to user or group
* Send files (photos or documents) via attach icon or drag'n'drop
* Desktop notifications


### Unsupported at the moment

* Secret chats
* Create new group
* Edit group photo/title/participants
* Settings
* Edit profile/userpic
* Contacts
* Edit, delete, forward messsages
* a lot more...


## Technical details

The app is based on AngularJS JavaScript framework, written in pure JavaScript (migration to CoffeeScript is planned for the future). jQuery is used for DOM manipulations, and Bootstrap is the CSS-framework.


### Running locally


#### Running web-server

Project repository is based on angularjs-seed and includes a simple web-server, so it's easy to launch the app locally on your desktop.
Install [node.js](http://nodejs.org/) and run `node server.js`. Open page http://localhost:8000/app/index.html in your browser.

#### Running as Chrome Packaged App

It is possible to run this application in Chrome browser as a packaged app. In order to do this, open this URL in Chrome: `chrome://extensions/`, then tick "Developer mode" and press "Load unpacked extension...". Select the downloaded `app` folder and Webogram application should appear in the list.
Also it's necessary to replace following line in index.html:
```<html lang="en" ng-app="myApp"><!-- ng-csp=""-->```
with:
```<html lang="en" ng-app="myApp" ng-csp="">```


You can also download this application from Chrome Web Store: [chrome.google.com/webstore/detail/telegram-unofficial/clhhggbfdinjmjhajaheehoeibfljjno](https://chrome.google.com/webstore/detail/telegram-unofficial/clhhggbfdinjmjhajaheehoeibfljjno). This is more secure way to use app than plain HTTP in web, because sources are downloaded only once and via HTTPS.


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
