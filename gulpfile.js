var gulp = require('gulp');
var es = require('event-stream');
var pj = require('./package.json');
var $ = require('gulp-load-plugins')();
var concat = require('gulp-concat');
var path = require('path');

// The generated file is being created at src
// so it can be fetched by usemin.
gulp.task('templates', function() {
  return gulp.src('app/partials/*.html')
    .pipe($.angularTemplatecache('templates.js', {
      root: 'partials',
      module: 'myApp.templates',
      standalone: true
    }))
    .pipe(gulp.dest('app/js'));
});

gulp.task('usemin', ['templates', 'enable-production'], function() {
  return gulp.src('app/index.html')
    .pipe($.usemin({
      html: [$.minifyHtml({empty: true})],
      js: ['concat', $.ngmin(), $.uglify({outSourceMap: true})],
      css: [$.minifyCss(), 'concat']
    }))
    .pipe(gulp.dest('dist'));
});

// ulimit -n 10240 on OS X
gulp.task('imagemin', function() {
  return gulp.src(['app/img/**/*', '!app/img/screenshot*', '!app/img/*.wav'])
    .pipe($.imagemin())
    .pipe(gulp.dest('dist/img'));
});

gulp.task('copy-images', function() {
  return gulp.src(['app/img/**/*', '!app/img/screenshot*', '!app/img/*.wav'])
    .pipe(gulp.dest('dist/img'));
});

gulp.task('copy', function() {
  return es.concat(
    gulp.src(['app/favicon.ico', 'app/favicon_unread.ico', 'app/manifest.webapp', 'app/manifest.json', 'app/**/*worker.js', 'CHANGELOG.mdown'])
      .pipe(gulp.dest('dist')),
    gulp.src(['app/img/**/*.wav'])
      .pipe(gulp.dest('dist/img')),
    gulp.src('app/vendor/console-polyfill/console-polyfill.js')
      .pipe(gulp.dest('dist/vendor/console-polyfill')),
    gulp.src('app/js/lib/bin_utils.js')
      .pipe(gulp.dest('dist/js/lib')),
    gulp.src('app/vendor/closure/long.js')
      .pipe(gulp.dest('dist/vendor/closure')),
    gulp.src('app/vendor/jsbn/jsbn_combined.js')
      .pipe(gulp.dest('dist/vendor/jsbn')),
    gulp.src('app/vendor/cryptoJS/crypto.js')
      .pipe(gulp.dest('dist/vendor/cryptoJS')),
    gulp.src('app/vendor/bootstrap/fonts/*')
      .pipe(gulp.dest('dist/fonts')),
    gulp.src('app/js/background.js')
      .pipe(gulp.dest('dist/js'))
  );
});

gulp.task('compress-dist', ['add-csp'], function() {
  return gulp.src('**/*', {cwd:  path.join(process.cwd(), '/dist')})
    .pipe($.zip('webogram_v' + pj.version + '.zip'))
    .pipe(gulp.dest('releases'));
});

gulp.task('cleanup-dist', ['compress-dist'], function() {
  return gulp.src(['releases/**/*', '!releases/*.zip']).pipe($.clean());
});

gulp.task('add-csp', ['build'], function() {
  return gulp.src('dist/index.html')
    .pipe($.replace(/<html(.*?)>/, '<html$1 ng-csp="">'))
    .pipe(gulp.dest('dist'));
});

gulp.task('update-version-manifests', function() {
 return gulp.src(['app/manifest.webapp', 'app/manifest.json'])
    .pipe($.replace(/"version": ".*",/, '"version": "' + pj.version + '",'))
    .pipe(gulp.dest('app'));
});

gulp.task('update-version-config', function() {
 return gulp.src('app/js/lib/config.js')
    .pipe($.replace(/version: '.*?'/, 'version: \'' + pj.version  + '\''))
    .pipe(gulp.dest('app/js/lib'));
});

gulp.task('update-version-comments', function() {
 return gulp.src('app/**/*.js')
  .pipe($.replace(/Webogram v[0-9.]*/, 'Webogram v' +  pj.version))
  .pipe(gulp.dest('app'));
});


gulp.task('enable-production', function() {
 return es.concat(
  gulp.src('app/**/*.html')
    .pipe($.replace(/PRODUCTION_ONLY_BEGIN/g, 'PRODUCTION_ONLY_BEGIN-->'))
    .pipe($.replace(/PRODUCTION_ONLY_END/, '<!--PRODUCTION_ONLY_END'))
    .pipe(gulp.dest('app')),
  gulp.src('app/**/*.js')
    .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN*/'))
    .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, '/*PRODUCTION_ONLY_END'))
    .pipe(gulp.dest('app'))
  );
});

gulp.task('disable-production', function() {
 return es.concat(
  gulp.src('app/index.html')
    .pipe($.replace(/PRODUCTION_ONLY_BEGIN-->/g, 'PRODUCTION_ONLY_BEGIN'))
    .pipe($.replace(/<!--PRODUCTION_ONLY_END/g, 'PRODUCTION_ONLY_END'))
    .pipe(gulp.dest('app')),
  gulp.src('app/**/*.js')
    .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN'))
    .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, 'PRODUCTION_ONLY_END'))
    .pipe(gulp.dest('app'))
  );
});

gulp.task('add-appcache-manifest', function() {

  var sources = [
    './dist/**/*',
    '!dist/manifest.*',
    '!dist/index.html',
    '!dist/fonts/*',
    '!dist/img/icons/icon*.png',
    '!dist/js/background.js'
  ];

  return es.concat(
    gulp.src(sources)
      .pipe($.manifest({
          timestamp: true,
          network: ['http://*', 'https://*', '*'],
          filename: 'webogram.appcache',
          exclude: ['webogram.appcache', 'app.manifest']
        })
      )
      .pipe(gulp.dest('./dist')),

    gulp.src(sources)
      .pipe($.manifest({
          timestamp: true,
          network: ['http://*', 'https://*', '*'],
          filename: 'app.manifest',
          exclude: ['webogram.appcache', 'app.manifest']
        })
      )
      .pipe(gulp.dest('./dist'))
  );
});


gulp.task('clean', function() {
  return gulp.src(['dist/*', 'app/js/templates.js', '!dist/.git']).pipe($.clean());
});

gulp.task('bump', ['update-version-manifests', 'update-version-config'], function () {
  gulp.start('update-version-comments');
});

gulp.task('build', ['usemin', 'copy', 'copy-images'], function () {
  gulp.start('disable-production');
});
gulp.task('package', ['cleanup-dist']);

gulp.task('publish', ['build'], function() {
  gulp.start('add-appcache-manifest');
});

gulp.task('default', ['clean'], function() {
  gulp.start('build');
});
