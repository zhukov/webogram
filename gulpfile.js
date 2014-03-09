var gulp = require('gulp');
var es = require('event-stream');
var pj = require('./package.json');
var $ = require('gulp-load-plugins')();
var concat = require('gulp-concat');

// The generated file is being created at src 
// so it can be fetched by usemin.
gulp.task('templates', function() {
  return gulp.src('app/partials/*.html')
    .pipe($.angularTemplatecache('partials.js', {
      root: 'partials',
      module: 'partials',
      standalone: true
    }))
    .pipe(gulp.dest('app/js'));
});

gulp.task('copy', function() {
  return es.concat(
    gulp.src(['app/favicon.ico', 'app/favicon_unread.ico', 'app/manifest.webapp', 'app/manifest.json', 'app/**/*worker.js', 'app/img/**/*', '!app/img/screenshot*'])
      .pipe(gulp.dest('dist')),
    gulp.src('app/vendor/console-polyfill/console-polyfill.js')
      .pipe(gulp.dest('dist/vendor/console-polyfill')),
    gulp.src('app/js/lib/mtproto.js')
      .pipe(gulp.dest('dist/js/lib')),
    gulp.src('app/js/lib/config.js')
      .pipe(gulp.dest('dist/js/lib')),
    gulp.src('app/vendor/jsbn/jsbn_combined.js')
      .pipe(gulp.dest('dist/vendor/jsbn')),
    gulp.src('app/vendor/cryptoJS/crypto.js')
      .pipe(gulp.dest('dist/vendor/cryptoJS'))
  );
});

gulp.task('update-version-manifests', function() {
 return gulp.src(['app/manifest.webapp', 'app/manifest.json'])
    .pipe($.replace(/"version": ".*",/, '"version": "' + pj.version + '",'))
    .pipe(gulp.dest('app'));
});

gulp.task('update-version-settings', function() {
 return gulp.src('app/partials/settings_modal.html')
    .pipe($.replace(/<span class="settings_version">alpha .*<\/span>/, '<span class="settings_version">alpha ' + pj.version  + '<\/span>'))
    .pipe(gulp.dest('app/partials'));
});

gulp.task('update-version-comments', function() {
 return gulp.src('app/**/*')
  .pipe($.grepStream('Webogram v'))
  .pipe($.replace(/Webogram v[0-9.]*/, 'Webogram v' +  pj.version))
  .pipe(gulp.dest('app'));
});

gulp.task('usemin', ['templates'], function() {
  return gulp.src('app/index.html')
    .pipe($.usemin({
      html: [$.minifyHtml({empty: true})],
      js: ['concat', $.rev()],
      css: [$.minifyCss(), 'concat']
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function() {
  return gulp.src('dist').pipe($.clean());
});

gulp.task('compress-dist', function() {
  return es.concat( 
    gulp.src('dist/*')
      .pipe($.zip('webogram_v' + pj.version + '.zip'))
      .pipe(gulp.dest('package')),
    gulp.src('package/*.zip')
      .pipe(gulp.dest('.')),
    gulp.src('package/**/*').pipe($.clean())
  );
});

gulp.task('bump', ['update-version-manifests', 'update-version-settings', 'update-version-comments']);
gulp.task('build', ['clean', 'templates', 'usemin', 'copy']);
gulp.task('package', ['build', 'compress-dist']);

gulp.task('default', function() {
  gulp.start('build');
});
