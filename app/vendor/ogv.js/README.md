ogv.js
======

Media decoder and player for Ogg Vorbis/Opus/Theora and (experimentally) WebM video.

Based around libogg, libvorbis, libtheora, libopus, libvpx, and libnestegg compiled to JavaScript with Emscripten.

## Updates

1.4.2 - 2017-04-24
* support 8-bit 4:2:2 and 4:4:4 subsampling in VP9

1.4.1 - 2017-04-07
* fix for seek shortly after initialization
* fix for some missing instance constants

1.4.0 - 2017-04-06
* fastSeek() is now fast; seeks to first keyframe found.
* VP9 base profile support in WebM container (8-bit 4:2:0 only).
* Safari no longer complains about missing es6-promise.map source map
* Smoother playback on low-end machines prone to lag spikes: when A/V sync lags, keep audio running smoothly and resync video at the next keyframe. To restore previous behavior, set `sync: 'delay-audio'` in options.
* Experimental Web Assembly builds of all modules; set `wasm: true` in options to force on.
* `error` property now returns an `OGVMediaError` object instead of string.
* Decode pipeline up to 3 frames deep to aid in momentary spikes.
* Experimental multithreaded JS builds for VP8 and VP9; set `threading: true` in options to force on.
* Fixed bad autodetection of files in root dir

1.3.1 - 2017-02-24
* Fix for seeking before load completes
* Fix for bisection seeking in very short Ogg files

1.3.0 - 2017-02-08
* Separated XHR and caching out to stream-file package
* more aggressive in-memory buffering should improve audio seek performance
* improved seek precision on audio files
* fix for Ogg files with stream id of 0

1.2.1 - 2016-09-24
* Performance fixed for playback of Ogg Theora with many duplicate frames ("1000fps" files from ffmpeg)
* Report actual fps (ignoring dupe frames) for Ogg Theora
* Delay loading when using preload="none"
* Fix regression in IE 10 network layer

1.2.0 - 2016-09-19
* Separated software and WebGL paths to yuv-canvas package
* fixed regression in WebM frame rate handling
* buffer up to 3 decoded frames for smoother playback
* smoother audio in the face of short delays (drop late frame if next one is already decoded)
* fixed regression in seeking non-indexed Ogg files
* updated libvpx

1.1.3 - 2016-06-27
* fix play-during-seek bug that interacted with video.js badly

1.1.2 - 2016-06-27
* better a/v sync
* muted autoplay works on iOS
* numerous seeking-related race-condition fixes
* more consistent performance on low-end machines
* supports cross-domain hosting of worker and Flash audio shim
* seeking now works in WebM as well as Ogg
* cleaner multithreading
* lots of little fixes

See more details and history in [CHANGES.md](https://github.com/brion/ogv.js/blob/master/CHANGES.md)

## Current status

Since August 2015, ogv.js can be seen in action [on Wikipedia and Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Video) in Safari and IE/Edge where native Ogg and WebM playback is not available. (See [technical details on MediaWiki integration](https://www.mediawiki.org/wiki/Extension:TimedMediaHandler/ogv.js).)

See also a standalone demo with performance metrics at https://brionv.com/misc/ogv.js/demo/

* streaming: yes (with Range header)
* seeking: yes for Ogg and WebM (with Range header)
* color: yes
* audio: yes, with a/v sync (requires Web Audio or Flash)
* background threading: yes (video, audio decoders in Workers)
* [GPU accelerated drawing: yes (WebGL)](https://github.com/brion/ogv.js/wiki/GPU-acceleration)
* GPU accelerated decoding: no
* SIMD acceleration: no
* Web Assembly: yes (experimental; set `options.wasm` to `true`)
* multithreaded VP8, VP9: yes (experimental; set `options.threading` to `true`; requires `SharedArrayBuffer`)
* controls: no (currently provided by demo or other UI harness)

Ogg files are fairly well supported, but WebM is still experimental and is disabled by default.


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 video and audio tags which can be used for basic playback of Ogg Theora and Vorbis or WebM media on browsers that don't support Ogg or WebM natively.

The API isn't quite complete, but works pretty well.


## Compatibility

ogv.js requires a fast JS engine with typed arrays, and either Web Audio or Flash for audio playback.

The primary target browsers are (testing 360p/30fps and up):
* Safari 6.1/7/8/9/10 on Mac OS X 10.7-10.11
* Safari on iOS 8/9/10 64-bit
* Edge on Windows 10 desktop/tablet
* Internet Explorer 10/11 on Windows 7/8/8.1/10 (desktop/tablet)

And for lower-resolution files (testing 160p/15fps):
* Safari on iOS 8/9/10 32-bit
* Edge on Windows 10 Mobile
* Internet Explorer 10/11 on Windows RT

Older versions of Safari have flaky JIT compilers. IE 9 and below lack typed arrays.

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS, Windows RT, or Windows 10 Mobile.)

Testing browsers (these support .ogv and .webm natively):
* Firefox 52
* Chrome 57


## Package installation

Pre-built releases of ogv.js are available as [.zip downloads from the GitHub releases page](https://github.com/brion/ogv.js/releases) and through the npm package manager.

You can load the `ogv.js` main entry point directly in a script tag, or bundle it through whatever build process you like. The other .js files and the .swf file (for audio in IE) must be made available for runtime loading, together in the same directory.

ogv.js will try to auto-detect the path to its resources based on the script element that loads ogv.js or ogv-support.js. If you load ogv.js through another bundler (such as browserify or MediaWiki's ResourceLoader) you may need to override this manually before instantiating players:

```
  // Path to ogv-demuxer-ogg.js, ogv-worker-audio.js, dynamicaudio.swf etc
  OGVLoader.base = '/path/to/resources';
```

To fetch from npm:

```
npm install ogv
```

The distribution-ready files will appear in 'node_modules/ogv/dist'.

To load the player library into your browserify or webpack project:

```
var ogv = require('ogv');

// Access public classes either as ogv.OGVPlayer or just OGVPlayer.
// Your build/lint tools may be happier with ogv.OGVPlayer!
ogv.OGVLoader.base = '/path/to/resources';
var player = new ogv.OGVPlayer();
```

## Usage

The `OGVPlayer` class implements a player, and supports a subset of the events, properties and methods from [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) and [HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement).

```
  // Create a new player with the constructor
  var player = new OGVPlayer();

  // Or with options
  var player = new OGVPlayer({
    enableWebM: true
  });

  // Now treat it just like a video or audio element
  containerElement.appendChild(player);
  player.src = 'path/to/media.ogv';
  player.play();
  player.addEventListener('ended', function() {
    // ta-da!
  });
```

To check for compatibility before creating a player, include `ogv-support.js` and use the `OGVCompat` API:

```
  if (OGVCompat.supported('OGVPlayer')) {
    // go load the full player from ogv.js and instantiate stuff
  }
```

This will check for typed arrays, audio/Flash, blacklisted iOS versions, and super-slow/broken JIT compilers.

If you need a URL versioning/cache-buster parameter for dynamic loading of `ogv.js`, you can use the `OGVVersion` symbol provided by `ogv-support.js` or the even tinier `ogv-version.js`:

```
  var script = document.createElement('script');
  script.src = 'ogv.js?version=' + encodeURIComponent(OGVVersion);
  document.querySelector('head').appendChild(script);
```

## Distribution notes

Entry points:
* `ogv.js` contains the main runtime classes, including OGVPlayer, OGVLoader, and OGVCompat.
* `ogv-support.js` contains the OGVCompat class and OGVVersion symbol, useful for checking for runtime support before loading the main `ogv.js`.
* `ogv-version.js` contains only the OGVVersion symbol.

These entry points may be loaded directly from a script element, or concatenated into a larger project, or otherwise loaded as you like.

Further code modules are loaded at runtime, which must be available with their defined names together in a directory. If the files are not hosted same-origin to the web page that includes them, you will need to set up appropriate CORS headers to allow loading of the worker JS modules.

Dynamically loaded assets:
* `ogv-worker-audio.js`, `ogv-worker-video.js`, and `pthread-main.js` are Worker entry points, used to run video and audio decoders in the background.
* `ogv-demuxer-ogg.js` is used in playing .ogg, .oga, and .ogv files.
* `ogv-demuxer-webm.js` is used in playing .webm files.
* `ogv-decoder-audio-vorbis.js` and `ogv-decoder-audio-opus.js` are used in playing both Ogg and WebM files containing audio.
* `ogv-decoder-video-theora.js` is used in playing .ogg and .ogv video files.
* `ogv-decoder-video-vp8.js` and `ogv-decoder-video-vp9.js` are used in playing .webm video files.
* `*-wasm.js` and `*-wasm.wasm` files are the Web Assembly versions of the above modules.
* `*-mt.js` are the multithreaded versions of some of the above modules.
* `dynamicaudio.swf` is the Flash audio shim, used for Internet Explorer 10/11.

If you know you will never use particular formats or codecs you can skip bundling them; for instance if you only need to play Ogg files you don't need `ogv-demuxer-webm.js` or `ogv-decoder-video-vp8.js` which are only used for WebM. Web Assembly and multithreaded modules are experimental and can be left out if not enabled in your runtime options.


## Performance

As of 2015, for SD-or-less resolution basic Ogg Theora decoding speed is reliable on desktop and newer high-end mobile devices; current high-end desktops and laptops can even reach HD resolutions. Older and low-end mobile devices may have difficulty on any but audio and the lowest-resolution video files.

WebM is much slower, and remains experimental.

*Low-res targets*

I've gotten acceptable performance for Vorbis audio and 160p/15fps Theora files on 32-bit iOS devices: iPhone 4s, iPod Touch 5th-gen and iPad 3. These have difficulty at 240p and above, and just won't keep up with higher resolutions.

Meanwhile, newer 64-bit iPhones and iPads are comparable to low-end laptops, and videos at 360p and often 480p play acceptably. Since 32-bit and 64-bit iOS devices have the same user-agent, a benchmark must be used to approximately test minimum CPU speed.

(On iOS, Safari performs significantly better than some alternative browsers that are unable to enable the JIT due to use of the old UIWebView API. Chrome 49 and Firefox for iOS are known to work using the newer WKWebView API internally. Again, a benchmark must be used to detect slow performance, as the browser remains otherwise compatible.)


Windows on 32-bit ARM platforms is similar... IE 11 on Windows RT 8.1 on a Surface tablet (NVidia Tegra 3), and Edge on Windows 10 Mobile build 10166 on a Lumia 635, perform acceptably with audio and with 160p/15fps videos but have trouble starting around 240p.


In both cases, a native application looms as a possibly better alternative. See [OGVKit ](https://github.com/brion/OGVKit) and [OgvRt](https://github.com/brion/OgvRT) projects for experiments in those directions.


Note that at these lower resolutions, Vorbis audio and Theora video decoding are about equally expensive operations -- dual-core phones and tablets should be able to eek out a little parallelism here thanks to audio and video being in separate Worker threads.


*WebGL drawing acceleration*

Accelerated YCbCr->RGB conversion and drawing is done using WebGL on supporting browsers, or through software CPU conversion if not. This is abstracted in the [yuv-canvas](https://github.com/brion/yuv-canvas) package, now separately installable.

It may be possible to do further acceleration of actual decoding operations using WebGL shaders, but this could be ... tricky. WebGL is also only available on the main thread, and there are no compute shaders yet so would have to use fragment shaders.


## Difficulties

*Threading*

Currently the video and audio codecs run in worker threads by default, while the demuxer
and player logic run on the UI thread. This seems to work pretty well.

There is some overhead in extracting data out of each emscripten module's heap and in the thread-to-thread communications, but the parallelism and smoother main thread makes up for it.

*Streaming download*

In Firefox, the 'moz-chunked-array' responseType on XHR is used to read data as ArrayBuffer chunks during download. Safari and Chrome use a 'binary string' read which requires manually converting input to ArrayBuffer chunks. In IE and Edge have an (MS-prefixed) Stream/StreamReader interface which can be used to read data on demand into ArrayBuffer objects, but it has proved problematic especially with intermediate proxies; as of 1.1.2 IE and Edge use the same chunked binary-string method as Safari and Chrome.

The Firefox and Safari/Chrome cases have been hacked up to do streaming buffering by chunking the requests at up to a megabyte each, using the HTTP Range header. For cross-site playback, this requires CORS setup to whitelist the Range header!

[Safari has a bug with Range headers](https://bugs.webkit.org/show_bug.cgi?id=82672) which is worked around as necessary with a 'cache-busting' URL string parameter. Hopefully this will be fixed in future versions of Mac OS X and iOS.


*Seeking*

Seeking is implemented via the HTTP Range: header.

For Ogg files with keyframe indices in a skeleton index, seeking is very fast. Otherwise,  a bisection search is used to locate the target frame or audio position, which is very slow over the internet as it creates a lot of short-lived HTTP requests.

For WebM files with cues, efficient seeking is supported as well as of 1.1.2.

As with chunked streaming, cross-site playback requires CORS support for the Range header.


*Audio output*

Audio output is handled through the [AudioFeeder](https://github.com/brion/audio-feeder) library, which encapsulates use of Web Audio API or Flash depending on browser support:

Firefox, Safari, Chrome, and Edge support the W3C Web Audio API.

IE doesn't support Web Audio, but does bundle the Flash player in Windows 8/8.1/RT. A small Flash shim is included here and used as a fallback -- thanks to Maik Merten for hacking some pieces together and getting this working!

A/V synchronization is performed on files with both audio and video, and seems to
actually work. Yay!

Note that autoplay with audio doesn't work on iOS Safari due to limitations with starting audio playback from event handlers; if playback is started outside an event handler, the player will hang due to broken audio.

As of 1.1.1, muting before script-triggered playback allows things to work:

```
  player = new OGVPlayer();
  player.muted = true;
  player.src = 'path/to/file-with-audio.ogv';
  player.play();
```

You can then unmute the video in response to a touch or click handler. Alternately if audio is not required, do not include an audio track in the file.


*WebM*

WebM support was added in June 2015, with some major issues finally worked out in May 2016. Initial VP9 support was added in February 2017. It remains experimental, but should be fully enabled in the future once a few more bugs are worked out.

To enable, set `enableWebM: true` in your `options` array.

Beware that performance of WebM VP8 is much slower than Ogg Theora, and VP9 is slower still.

For best WebM decode speed, consider encoding VP8 with "profile 1" (simple deblocking filter) which will sacrifice quality modestly, mainly in high-motion scenes. When encoding with ffmpeg, this is the `-profile:v 1` option to the `libvpx` codec.

It is also recommended to use the `-slices` option for VP8, or `-tile-columns` for VP9, to maximize ability to use multithreaded decoding when available.


## Upstream library notes

We've experimented with tremor (libivorbis), an integer-only variant of libvorbis. This actually does *not* decode faster, but does save about 200kb off our generated JavaScript, presumably thanks to not including an encoder in the library. However on slow devices like iPod Touch 5th-generation, it makes a significant negative impact on the decode time so we've gone back to libvorbis.

The Ogg Skeleton library (libskeleton) is a bit ... unfinished and is slightly modified here.

libvpx is slightly modified to work around emscripten threading limitations in the VP8 decoder.


## Web Assembly

Experimental Web Assembly (WASM) versions of the emscripten cross-compiled modules are also included, used if `options.wasm` is true.

The WASM versions of the modules are more compact than the cross-compiled asm.js-style JavaScript, and should download and parse faster. Some browsers may also compile the module differently, providing more consistent performance at the beginning of playback.

Currently Firefox and Chrome are the only release versions of browsers that support Web Assembly, but it's available in Safari Technical Preview and behind the 'experimental JS options' flag in Edge in Windows 10 version 1703.

If you are making a slim build and will not use the `wasm` option, you can leave out the `*-wasm.js` and `*-wasm.wasm` files.


## Multithreading

Experimental multithreaded VP8 and VP9 decoding up to 4 cores is available for VP8 and VP9 video, used if `options.threading` is true. This requires browser support for the new `SharedArrayBuffer` and `Atomics` APIs, currently available in Safari 10.1 / iOS 10.3 and in Firefox developer & nightly builds, and in Chrome behind a flag.

Threading is not currently compatible with Web Assembly.

Speedups will only be noticeable when using the "slices" or "token partitions" option for VP8 encoding, or the "tile columns" option for VP9 encoding.

Currently, getting a successful multithreaded build requires a [patch to the emscripten compiler](https://github.com/kripken/emscripten/pull/5016); without this patch, the resulting multithreaded modules will build but fail to initialize correctly.

If you are making a slim build and will not use the `threading` option, you can leave out the `*-mt.js` files, as well as `pthread-main.js`.


## Building JS components

Building ogv.js is known to work on Mac OS X and Linux (tested Ubuntu 15.04).

1. You will need autoconf, automake, libtool, pkg-config, and node (nodejs). These can be installed through Homebrew on Mac OS X, or through distribution-specific methods on Linux.
2. Install [Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/Tutorial.html); currently using the incoming branch (of what will be 1.38) for distribution builds for latest WASM support, plus [multithreading patch](https://github.com/kripken/emscripten/pull/5016)
3. `git submodule update --init`
4. Run `npm install` to install build utilities
5. Run `make js` to configure and build the libraries and the C wrapper


## Building the demo

If you did all the setup above, just run `make demo` or `make`. Look in build/demo/ and enjoy!


## License

libogg, libvorbis, libtheora, libopus, nestegg, and libvpx are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js

[AudioFeeder](https://github.com/brion/audio-feeder)'s dynamicaudio.as and other Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman.

See [AUTHORS.md](https://github.com/brion/ogv.js/blob/master/AUTHORS.md) and/or the git history for a list of contributors.
