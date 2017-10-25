# Localization guide for Webogram

## Adding/updating a new locale/language

Adding a new locale is pretty easy, all you got to do is:

1. ensure that the angular-locale file `vendor/angular/i18n/angular-locale_<locale>.js` exists. If not copy one of the others being most similar to your target locale and adapt it accordingly. See also the [angular docs](https://docs.angularjs.org/guide/i18n).
2. copy `js/locales/en-us.json` to `js/locales/<locale>.json`
3. without changing the key strings translate and change the value strings into your target locale
4. add your locale to `Config.I18n` in `js/lib/config.js` with locale and its native name so it will be listed in the settings
5. enjoy your awesome new Webogram in your own language!

You may also want to join the project on [transifex](https://www.transifex.com/projects/p/telegram-web/).

### Details
#### The locale string
The locale string which is also part of the filenames consists of the lower case two character language code and the two character country code separated by a hyphen with the country code being optional, e.g:
* en-us
* en-au
* de-de

#### Step 1: the angular locale
The files in `vendor/angular/i18n/` contain the `ngLocale` module in its various localizations which provides the `$locale` service which in turn is used by many angular functions especially for formatting times and dates and a little pluralization.
There should already be a file for almost every language so you most probably won't have to create your own.
For more see the [angular docs](https://docs.angularjs.org/guide/i18n).

#### Step 2: copy the template
`js/locales/en-us.json` should provide you with all the localization strings currently in use in webogram and therefore be a complete template to begin with.
It's basically just a json-encoded javascript object with the keys being the message ids and the values being the corresponding translations.

#### Step 3: adjusting the translations
The values may contain very simple markdown syntax, numbered and named parameters depending on how and where the messages are used (see also below).
Parameters are enclosed in curly braces and can be numbered (starting with 0) and/or named, but the order in the strings doesn't matter.
Here a few examples:
> "user_status_last_seen": "last seen {0}",
> "settings_modal_recent_updates": "Recent updates (ver. {version})"

The parameters can be parameterized too in which case the parameter name/number is followed by a colon and its parameters which are delimited by a pipe (`|`).

Example:

> Please, install {chrome-link: http://google.com/chrome | Google Chrome} or use {telegram-link: https://telegram.org/ | mobile app} instead.

which would end up as

> Please, install <a href="http://google.com/chrome" target="_blank">Google Chrome</a> or use <a href="https://telegram.org/" target="_blank">mobile app</a> instead.

You could alter the url in this example to point to the language specific version of the original url.

Then there are some strings like this:
> "contacts_modal_pluralize_new_group_members": "{'one': '1 participant', 'other': '{} participants'}",

which are used in the `when` attributes of elements compiled by the [ngPluralize](https://docs.angularjs.org/api/ng/directive/ngPluralize) module and allow for different strings depending on the (number) value of the bound parameter and there must be valid json syntax.
Here again see the [angular docs](https://docs.angularjs.org/guide/i18n).
Such strings will have the word _pluralize_ in their key.

And finally: strings which keys have a `_md` suffix get parsed by a simple markdown parser that places everything between `**`s in `<strong/>` tags and replaces newlines with `<br/>` e.g.:
> "welcome_text_1_md": "This is a web-client for the **Telegram Messenger**.",

becomes
```html
This is a web-client for the <strong>Telegram Messenger</strong>.
```

Including html markup in the messages directly isn't supported and any contained markup will be escaped before inserting.

#### Step 4: adding the newly created locale
The final step is to add the new locale to the list with supported (i.e. existing) locales for Webogram in `Config.I18n` object in `js/lib/config.js`.
Add the locale to the `Config.I18n.supported` array and to `Config.I18n.languages` with the locale as key and the native name of the language as value.
After adding to the list (and perhaps restarting the app) it appears in the footer.

Additionally you can add your locale to `Config.I18n.aliases`. This object is used when there is no locale configured yet and we're trying to guess the best fit from the browsers current language.
Since we're retrieving the browser language through `navigator.language` which may contain a locale with or without country code, we use `Config.I18n.aliases` here to map between these and our supported locales whereby the keys are the lookup values and the values a locale we support, e.g:
```javascript
Config.I18n.aliases= {
	'en': 'en-us'
}
```
This maps a `navigator.language == 'en'` to `en-us` as locale to use.


## Using the i18n module while developing

All the i18n functionality is located in the `myApp.i18n` module in `js/lib/i18n.js` and exposed via various ways whereby all the localization is done by the `_` service.
It takes a message key and optional parameters for that key and returns the localized string with parameters incorporated.

When adding new messages the key for that messages should be prefixed with the view name it appears in. If the message (should) contain(s) markdown-like markup (see above) it should additionally have a `_md` suffix.

### The service: call the localization function (`_`) directly
The Service `_` can be injected into other modules and offers some ways to interact:

```javascript
_('welcome_text_1_md'); // get a simple string
_('user_status_last_seen', '1 minute ago', ...); // with numbered parameters or
_('format_size_progress', {done: '10kB', total: '2048kB'}); // with named parameters
_.locale(); // retrieve the currently active locale, e.g. "en-us"
_.locale("en-us"); // set and load a new locale
_.supported(); // get the list of all supported locales
```

Note that `_` escapes any html entities appearing in the messages strings. If you want to retrieve an unmasked message - e.g. because it will be inserted in a way that escapes html again like `text()` - you can add a `_raw` suffix to the message key:
```javascript
_('welcome_text_1_md_raw'); // get a simple unmasked string
```

### The i18n filter
The i18n filter is basically just an alias/other way to call `_` and can be used in attributes and text nodes:

```html
<input placeholder="{{'modal_serach' | i18n}}" />
<span>{{"user_status_last_seen" | i18n:relativeTime}}</span>
<div>{{"format_size_progress" | i18n:{done: bytesLoaded, total: totalSize} }}</div>
```

### Together with `ngPluralize`
`myApp.i18n` automatically intercepts the compilation of the [ngPluralize](https://docs.angularjs.org/api/ng/directive/ngPluralize) directive and pipes the value of the `when` attribute through `_` before `ngPluralize` evaluates it.
Therefore you have to replace the content of the `when` attribute with the key of the corresponding message for `ngPluralize`. The key should contain the word `pluralize` to indicate its usage.

```html
<ng-pluralize count="selectedCount" when="contacts_modal_pluralize_new_group_members">
</ng-pluralize>
```
may evaluate to
```html
<ng-pluralize count="selectedCount" when="{'one': '1 participant', 'other': '{} participants'}">
	5 participants
</ng-pluralize>
```

### The my-i18n directive
The `my-i18n` directive can be used as attribute or as element and replaces the contents of the element with the localized message.

Simple usage:
```html
<div my-i18n="modal_done"></div>
<my-i18n msgid="modal_done"></my-i18n>
become
<div my-i18n="modal_done">Done</div>
<my-i18n msgid="modal_done">Done</my-i18n>
```

For messages which take parameters these are provided via (direct) child elements with a `my-i18n-param` directive. The params can be named or numbered if no name is provided.

Simple formats:
> "settings_modal_recent_updates": "Recent updates (ver. {version})",
> "user_status_last_seen": "last seen {0}",

```html
<a ng-click="openChangelog()" my-i18n="settings_modal_recent_updates">
	<my-i18n-param name="version" ng-bind="version"></my-i18n-param>
</a>

<my-i18n msgid="settings_modal_recent_updates">
	<span my-i18n-param="version" ng-bind="version"></span>
</my-i18n>

<my-i18n msgid="user_status_last_seen">
	<my-i18n-param>1 minute ago</my-i18n-param>
</my-i18n>

evaluate to

<a ng-click="openChangelog()" my-i18n="settings_modal_recent_updates">
	Recent updates (ver. <my-i18n-param name="version" ng-bind="version"></my-i18n-param>)
</a>

<my-i18n msgid="settings_modal_recent_updates">
	Recent updates (ver. <span my-i18n-param="version" ng-bind="version"></span>)
</my-i18n>

<my-i18n msgid="user_status_last_seen">
	last seen <my-i18n-param>1 minute ago</my-i18n-param>
</my-i18n>
```

As you see any other directives applied to the elements are preserved.

Finally, if there is no message key passed to the `my-i18n` directive it looks for (direct) child elements with a `my-i18n-format` directive and takes the msgid of that instead, e.g.:

> "im_one_typing": "{name1} is typing{dots}",

```html
<div class="im_history_typing"  my-i18n>
	<span ng-switch-when="1" my-i18n-format="im_one_typing"></span>
	<my-i18n-param name="name1"><a class="im_history_typing_author" my-peer-link="historyState.typing[0]"></a></my-i18n-param>
	<my-i18n-param name="dots"><span my-loading-dots></span></my-i18n-param>
</div>
```

This way it is even possible to group together several formats which take (mostly) the same parameters:

> "im_one_typing": "{name1} is typing{dots}",
> "im_two_typing": "{name1} and {name2} are typing{dots}",
> "im_many_typing": "{name1}, {name2} and {count} more are typing{dots}",

```html
<div class="im_history_typing" my-i18n>
	<span ng-switch-when="1" my-i18n-format="im_one_typing"></span>
	<span ng-switch-when="2" my-i18n-format="im_two_typing"></span>
	<span ng-switch-default my-i18n-format="im_many_typing"></span>
	<my-i18n-param name="name1"><a class="im_history_typing_author" my-peer-link="historyState.typing[0]"></a></my-i18n-param>
	<my-i18n-param name="name2"><a class="im_history_typing_author" my-peer-link="historyState.typing[1]"></a></my-i18n-param>
	<my-i18n-param name="count">{{historyState.typing.length - 2}}</my-i18n-param>
	<my-i18n-param name="dots"><span my-loading-dots></span></my-i18n-param>
</div>

will evaluate to (whitespace added for readability):

<div class="im_history_typing" my-i18n>
	<span ng-switch-when="1" my-i18n-format="im_one_typing">
		<my-i18n-param name="name1"><a class="im_history_typing_author" my-peer-link="historyState.typing[0]"></a></my-i18n-param>
		is typing
		<my-i18n-param name="dots"><span my-loading-dots></span></my-i18n-param>
	</span>
	<span ng-switch-when="2" my-i18n-format="im_two_typing">
		<my-i18n-param name="name1"><a class="im_history_typing_author" my-peer-link="historyState.typing[0]"></a></my-i18n-param>
		and
		<my-i18n-param name="name2"><a class="im_history_typing_author" my-peer-link="historyState.typing[1]"></a></my-i18n-param>
		are typing
		<my-i18n-param name="dots"><span my-loading-dots></span></my-i18n-param>
	</span>
	<span ng-switch-default my-i18n-format="im_many_typing">
		<my-i18n-param name="name1"><a class="im_history_typing_author" my-peer-link="historyState.typing[0]"></a></my-i18n-param>,
		<my-i18n-param name="name2"><a class="im_history_typing_author" my-peer-link="historyState.typing[1]"></a></my-i18n-param>
		and
		<my-i18n-param name="count">{{historyState.typing.length - 2}}</my-i18n-param>
		more are typing
		<my-i18n-param name="dots"><span my-loading-dots></span></my-i18n-param>
	</span>
</div>
```

Also note the `ng-switch` directives on the `my-i18n-format` elements here so only one of the  `<span>`s is visible at a time.
