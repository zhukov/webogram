# Localization guide for Webogram

## Adding/updating a new locale/language

Adding a new locale is pretty easy, all you got to do is:

1. ensure that the angular-locale file `vendor/angular/i18n/angular-locale_<locale>.js` exists. If not copy one of the others being most similar to your target locale and adapt it accordingly. See also the [angular docs](https://docs.angularjs.org/guide/i18n).
2. copy `js/locales/en-us.json` to `js/locales/<locale>.json`
3. without changing the key strings translate and change the value strings into your target locale
4. add your locale in js/i18n.js to the object of supported languages with locale an its native name so it will be listed in the settings
5. enjoy your awesome new webogram in your own language!

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
It's basically just a json-encoded javascript object with the keys being the message ids an the values being the corresponding translations.

#### Step 3: adjusting the translations
The keys as well as the values may contain html, numbered and named parameters depending on how and where the messages are used (see also below).
While translating you shouldn't alter the contained html nor add new markup and likewise with parameters.
Parameters are enclosed in curly braces and can be numbered (starting with 0) and/or named, but the order in the strings doesn't matter.
Here a few examples for the _de-de_ locale:
> "last seen {0}": "zuletzt gesehen: {0}"

> "Recent updates (ver. {version})": "neuste Updates (ver. {version})"

> "Forward to {peer}?": "An {peer} weiterleiten?"

The parameters can be parameterized too in which case the parameter name/number is followed by a colon and its parameters which are delimited by a pipe (`|`).

Example:

> Please, install {chrome-link: http://google.com/chrome | Google Chrome} or use {telegram-link: https://telegram.org/ | mobile app} instead.

which could end up as

> Please, install <a href="http://google.com/chrome" target="_blank">Google Chrome</a> or use <a href="https://telegram.org/" target="_blank">mobile app</a> instead.

You could alter the url in this example to point to the language specific version of the original url.

Then there are some strings like this:
> "{'one': '1 participant', 'other': '{} participants'}": "{'one': '1 Teilnehmer', 'other': '{} Teilnehmer'}"

which are used in the `when` attributes of elements compiled by the [ngPluralize](https://docs.angularjs.org/api/ng/directive/ngPluralize) module and allow for different strings depending on the (number) value of the bound parameter.
Here again see the [angular docs](https://docs.angularjs.org/guide/i18n).

#### Step 4: adding the newly created locale
The final step is to add the new locale to the list with supported (i.e. existing) locales for webogram in the factory of the localization function "_" in `js/i18n.js`.
The key here is again the locale string while the value is name of the language to be displayed in the settings.
After adding to the list (and perhaps restarting the app) it appears in the select input and can be used.


## Using the i18n module while developing

All the i18n functionality is located in the `myApp.i18n` module in `js/i18n.js` and exposed via various ways:

### The service: call the localization function (`_`) directly
The Service `_` can be injected into other modules and offers some ways to interact:

```javascript
_('Welcome to Webogram'); // translate one simple string
_('Hello {0}, welcome to {1}', 'World', 'Webogram'); // with numbered parameters or
_('Hello {name}, welcome to {app}', {name: 'World', app: 'Webogramm'}); // with named parameters
_.locale(); // retrieve the currently active locale, e.g. "en-us"
_.locale("de-de"); // set and load a new locale
_.supported(); // get the list of all supported locales
```

### The i18n filter
The i18n filter is basically just an alias/other way to call `_` and can be used in attributes and text nodes:

```html
<input placeholder="{{'Search' | i18n}}" />
<button>{{"Forward {0} messages" | i18n:count}}</button>
<div>{{"{count} new messages from {name}" | i18n:{count: count, name: user.name} }}</div>
```

### Together with `ngPluralize`
`myApp.i18n` automatically intercepts the compilation of the [ngPluralize](https://docs.angularjs.org/api/ng/directive/ngPluralize) directive and pipes the value of the `when` attribute through `_` before `ngPluralize` evaluates it.
So there is nothing more to do than to use `ngPluralize` as before but a block like

```html
<ng-pluralize count="selectedCount" when="{'one': '1 participant', 'other': '{} participants'}">
</ng-pluralize>
```
may now evaluate to
```html
<ng-pluralize count="selectedCount" when="{'one': '1 participant', 'other': '{} participants'}">
	5 Teilnehmer
</ng-pluralize>
```

### The my-i18n directive
Used as attribute or as tag the `my-i18n` directive translates the whole content of the tag with `_` in the compile phase and is therefore a fast an simple way:

```html
<h3 my-i18n>Contents</h3>
<span ng-if="chatFull.chat._ != 'chatForbidden'">
	<input my-file-upload type="file" />
	<my-i18n>Update photo</my-i18n>
</span>
```

Bear in mind that the complete innerHtml of an element compile by the `my-i18n` directive is passed through `_`, i.e. if the element contains much html most of which don't has to be localized, consider a `<my-i18n/>` tag just around the very text to be localized, like in the second example.
Also note that the html is normalized before passed through `_`, i.e. unnecessary whitespace gets stripped out/trimmed away.


### The my-i18n-format directive
This directive acts in a similar way but allows to pass numbered and/or named parameters into the localization.
It does this by extracting the format string from its `my-format` children (elements or attributes) and incorporating the contents of its `my-param` children (elements only) which are number as they appear or named by their name attribute:
You can even combine several formats which use (almost) the same parameters into the same directive:

```html
<span ng-switch-when="1" class="status_online" my-i18n-format>
	<my-format>{0} is typing{1}</my-format>
	<my-param><span my-user-link="historyState.typing[0]" short="true"></span></my-param>
	<my-param><span my-loading-dots></span></my-param>
</span>
<span ng-switch-when="2" class="status_online" my-i18n-format>
	<my-format>{0}, {1}{2}</my-format>
	<my-param><span my-user-link="historyState.typing[0]" short="true"></span></my-param>
	<my-param><span my-user-link="historyState.typing[1]" short="true"></span></my-param>
	<my-param><span my-loading-dots></span></my-param>
</span>
<span ng-switch-default class="status_online" my-i18n-format>
	<my-format>{0}+{1}{2}</my-format>
	<my-param><span my-user-link="historyState.typing[0]" short="true"></span></my-param>
	<my-param>{{historyState.typing.length - 1}}</my-param>
	<my-param><span my-loading-dots></span></my-param>
</span>
```
is more or less equivalent to
```html
<my-i18n-format>
	<span ng-switch-when="1" class="status_online" my-format>
		{name1} is typing{dots}
	</span>
	<span ng-switch-when="2" class="status_online" my-format>
		{name1}, {name2}{dots}
	</span>
	<span ng-switch-default class="status_online" my-format>
		{name1}+{names}{dots}
	</span>
	<my-param name="name1"><span my-user-link="historyState.typing[0]" short="true"></span></my-param>
	<my-param name="name2"><span my-user-link="historyState.typing[1]" short="true"></span></my-param>
	<my-param name="names">{{historyState.typing.length - 1}}</my-param>
	<my-param name="dots"><span my-loading-dots></span></my-param>
</my-i18n-format>
```
