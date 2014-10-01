var fs = require('fs'), path = require('path');
var uaList = fs.readFileSync(path.join(__dirname, 'ua.txt'));


uaList = uaList.toString().split('\n');


var OSs = {};
var browsers = {};
var browserVersions = {};
var unknown = [];

var osMatch = {
	ios: /iOS|iPhone OS/i,
	android: /Android/i,
	linux: /Linux/i,
	win: /Windows/i,
	osx: /Mac|OS X/i,
	blackberry: /BlackBerry|BB10/i,
	series60: /Series 60|Series60/i,
	series40: /Series 40|Series40/i,
	j2me: /J2ME|MIDP/i
};

var browserMatch = {
	opera: /opera/i,
	ie: /msie|trident\//i,
	chrome: /chrome/i,
	chromium: /chromium/i,
	safari: /safari|AppleWebKit/i,
	firefox: /firefox/i,
	blackberry: /BlackBerry/i
};

var featureMatch = {
	ipad: /ipad/i,
	opera_mobile: /opera mini|opera mobi/i,
  opera_mini: /opera mini/i,
  blackberry: /blackberry/i
};

uaList.forEach(function (uaName) {
	var os = 'unknown';
	for (var curOs in osMatch) {
		if (uaName.match(osMatch[curOs])) {
			os = curOs;
			break;
		}
	}

	var browser = 'unknown';
	for (var curBrowser in browserMatch) {
		if (uaName.match(browserMatch[curBrowser])) {
			browser = curBrowser;
			break;
		}
	}

	var version = (
		uaName.match(/MSIE ([\d.]+)/) ||
		uaName.match( /.+(?:me|ox|on|rv|it|era|opr|ie)[\/: ]([\d.]+)/) ||
		[0,'0']
	)[1];

	if (!OSs[os]) {
		OSs[os] = 1;
	} else {
		OSs[os]++;
	}

	if (!browsers[os + ' ' + browser]) {
		browsers[os + ' ' + browser] = 1;
	} else {
		browsers[os + ' ' + browser]++;
	}

	if (os == 'unknown' || browser == 'unknown') {
		unknown.push(uaName);
	}

	if (!browserVersions[os + ' ' + browser + ' ' + version]) {
		browserVersions[os + ' ' + browser + ' ' + version] = 1;
	} else {
		browserVersions[os + ' ' + browser + ' ' + version]++;
	}

})


console.log(OSs);
console.log(browsers);
console.log(browserVersions);
// console.log(unknown);

