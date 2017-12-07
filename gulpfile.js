var packageJson = require('./package.json')
var gulp = require('gulp')
var $ = require('gulp-load-plugins')({lazy: false})
var es = require('event-stream')
var path = require('path')
var http = require('http')
var st = require('st')
var del = require('del')
var runSequence = require('run-sequence')
var swPrecache = require('sw-precache')
var Server = require('karma').Server

// The generated file is being created at src
// so it can be fetched by usemin.
gulp.task('templates', function () {
  return gulp.src('app/partials/**/*.html')
    .pipe($.angularTemplatecache('templates.js', {
      root: 'partials',
      module: 'myApp.templates',
      standalone: true
    }))
    .pipe(gulp.dest('app/js'))
})

gulp.task('clean-templates', function () {
  return del(['app/js/templates.js'])
})

gulp.task('usemin-index', function () {
  return gulp.src('app/index.html')
    .pipe($.usemin({
      html: [$.minifyHtml({empty: true})],
      js: ['concat', $.ngAnnotate(), $.uglify({outSourceMap: false})],
      css: ['concat', $.minifyCss({compatibility: true, keepBreaks: true})]
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('usemin-badbrowser', function () {
  return gulp.src('app/badbrowser.html')
    .pipe($.usemin({
      html: [$.minifyHtml({empty: true})],
      css: ['concat', $.minifyCss({compatibility: true, keepBreaks: true})]
    }))
    .pipe(gulp.dest('dist'))
})

// ulimit -n 10240 on OS X
gulp.task('imagemin', function () {
  return gulp.src(['app/img/**/*', '!app/img/screenshot*', '!app/img/*.wav'])
    .pipe($.imagemin())
    .pipe(gulp.dest('dist/img'))
})

gulp.task('less', function () {
  gulp.src('app/less/*.less')
    .pipe($.less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(gulp.dest('app/css'))
})

gulp.task('standard', function () {
  gulp.src(['app/**/*.js', '!app/vendor/**/*', 'gulpfile.js'])
    .pipe($.standard())
    .pipe($.standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('copy-images', function () {
  return gulp.src(['app/img/**/*', '!app/img/screenshot*', '!app/img/*.wav'])
    .pipe(gulp.dest('dist/img'))
})

gulp.task('copy', function () {
  return es.concat(
    gulp.src(['app/favicon.ico', 'app/favicon_unread.ico', 'app/manifest.webapp', 'app/manifest.webapp.json', 'app/manifest.json', 'app/**/*worker.js'])
      .pipe(gulp.dest('dist')),
    gulp.src(['app/img/**/*.wav'])
      .pipe(gulp.dest('dist/img')),
    // gulp.src(['app/fonts/*'])
    //   .pipe(gulp.dest('dist/fonts')),
    gulp.src(['app/js/lib/polyfill.js', 'app/js/lib/bin_utils.js'])
      .pipe(gulp.dest('dist/js/lib')),
    gulp.src('app/vendor/closure/long.js')
      .pipe(gulp.dest('dist/vendor/closure')),
    gulp.src(['app/css/desktop.css', 'app/css/mobile.css'])
      .pipe(gulp.dest('dist/css')),
    gulp.src('app/vendor/jsbn/jsbn_combined.js')
      .pipe(gulp.dest('dist/vendor/jsbn')),
    gulp.src('app/vendor/leemon_bigint/bigint.js')
      .pipe(gulp.dest('dist/vendor/leemon_bigint')),
    gulp.src('app/vendor/rusha/rusha.js')
      .pipe(gulp.dest('dist/vendor/rusha')),
    gulp.src('app/vendor/cryptoJS/crypto.js')
      .pipe(gulp.dest('dist/vendor/cryptoJS')),
    gulp.src(['app/nacl/mtproto_crypto.pexe', 'app/nacl/mtproto_crypto.nmf'])
      .pipe(gulp.dest('dist/nacl/')),
    gulp.src('app/js/background.js')
      .pipe(gulp.dest('dist/js'))
  )
})

gulp.task('copy-locales', function () {
  var langpackSrc = []
  var ngSrc = []

  packageJson.locales.forEach(function (locale) {
    langpackSrc.push('app/js/locales/' + locale + '.json')
    ngSrc.push('app/vendor/angular/i18n/angular-locale_' + locale + '.js')
  })
  return es.concat(
    gulp.src(langpackSrc)
      .pipe(gulp.dest('dist/js/locales/')),
    gulp.src(ngSrc)
      .pipe(gulp.dest('dist/vendor/angular/i18n/'))
  )
})

gulp.task('compress-dist', ['build'], function () {
  return gulp.src('**/*', {cwd: path.join(process.cwd(), '/dist')})
    .pipe($.zip('webogram_v' + packageJson.version + '.zip'))
    .pipe(gulp.dest('releases'))
})

gulp.task('cleanup-dist', ['compress-dist'], function () {
  return del(['releases/**/*', '!releases/*.zip'])
})

gulp.task('bump-version-manifests', function () {
  return gulp.src(['app/manifest.webapp', 'app/manifest.json'])
    .pipe($.replace(/"version": ".*",/, '"version": "' + packageJson.version + '",'))
    .pipe(gulp.dest('app'))
})

gulp.task('bump-version-config', function () {
  return gulp.src('app/js/lib/config.js')
    .pipe($.replace(/version: '.*?'/, "version: '" + packageJson.version + "'"))
    .pipe(gulp.dest('app/js/lib'))
})

gulp.task('bump-version-comments', function () {
  return gulp.src('app/**/*.js')
    .pipe($.replace(/Webogram v[0-9.]*/, 'Webogram v' + packageJson.version))
    .pipe(gulp.dest('app'))
})

gulp.task('enable-production', function () {
  return es.concat(
    gulp.src('app/**/*.html')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN/g, 'PRODUCTION_ONLY_BEGIN-->'))
      .pipe($.replace(/PRODUCTION_ONLY_END/, '<!--PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app')),
    gulp.src('app/**/*.js')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN*/'))
      .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, '/*PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app'))
  )
})

gulp.task('disable-production', function () {
  return es.concat(
    gulp.src('app/index.html')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN-->/g, 'PRODUCTION_ONLY_BEGIN'))
      .pipe($.replace(/<!--PRODUCTION_ONLY_END/g, 'PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app')),
    gulp.src('app/**/*.js')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN'))
      .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, 'PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app'))
  )
})

var fileGlobs = [
  './dist/**/*',
  '!dist/manifest.*',
  '!dist/*.html',
  '!dist/fonts/*',
  '!dist/img/icons/icon*.png',
  '!dist/js/background.js',
  '!dist/css/badbrowser.css'
]

function writeServiceWorkerFile (rootDir, handleFetch, callback) {
  var config = {
    cacheId: packageJson.name,
    handleFetch: handleFetch,
    logger: $.util.log,
    staticFileGlobs: fileGlobs,
    stripPrefix: './' + rootDir + '/',
    importScripts: ['js/lib/push_worker.js'],
    verbose: true,
    maximumFileSizeToCacheInBytes: 3004152, // about 3MB, default is "2097152" 2MB,
    navigateFallback: "index.html",
  }
  swPrecache.write(path.join(rootDir, 'service_worker.js'), config, callback)
}

gulp.task('generate-service-worker', ['build'], function (callback) {
  writeServiceWorkerFile('dist', true, callback)
})

gulp.task('add-appcache-manifest', ['build'], function () {
  return gulp.src(fileGlobs)
    .pipe($.manifest({
      timestamp: false,
      hash: true,
      network: ['http://*', 'https://*', '*'],
      filename: 'webogram.appcache',
      exclude: ['webogram.appcache', 'app.manifest']
    })
  )
    .pipe(gulp.dest('./dist'))
})

gulp.task('package-dev', function () {
  return es.concat(
    gulp.src('app/partials/*.html')
      .pipe($.angularTemplatecache('templates.js', {
        root: 'partials',
        module: 'myApp.templates',
        standalone: true
      }))
      .pipe(gulp.dest('dist_package/js')),

    gulp.src(['app/favicon.ico', 'app/favicon_unread.ico', 'app/manifest.webapp', 'app/manifest.json'])
      .pipe(gulp.dest('dist_package')),
    gulp.src(['app/css/**/*'])
      .pipe(gulp.dest('dist_package/css')),
    gulp.src(['app/img/**/*'])
      .pipe(gulp.dest('dist_package/img')),
    gulp.src('app/vendor/**/*')
      .pipe(gulp.dest('dist_package/vendor')),
    gulp.src('app/**/*.json')
      .pipe(gulp.dest('dist_package')),

    gulp.src('app/**/*.html')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN/g, 'PRODUCTION_ONLY_BEGIN-->'))
      .pipe($.replace(/PRODUCTION_ONLY_END/, '<!--PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('dist_package')),

    gulp.src('app/**/*.js')
      .pipe($.ngAnnotate())
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN*/'))
      .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, '/*PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('dist_package'))
  )
})

gulp.task('watchcss', function () {
  gulp.src('app/css/*.css')
    .pipe($.livereload())
})

gulp.task('watchhtml', function () {
  gulp.src('app/partials/**/*.html')
    .pipe($.livereload())
})

gulp.task('watch', ['server', 'less'], function () {
  $.livereload.listen({ basePath: 'app' })
  gulp.watch('app/css/*.css', ['watchcss'])
  gulp.watch('app/less/**/*.less', ['less'])
  gulp.watch('app/partials/**/*.html', ['watchhtml'])
})

gulp.task('server', function (done) {
  http.createServer(
    st({ path: __dirname, index: 'index.html', cache: false })
  ).listen(8000, done)
})

gulp.task('clean', function () {
  return del(['dist/*', 'app/js/templates.js', 'app/css/*', '!dist/.git'])
})

gulp.task('bump', ['bump-version-manifests', 'bump-version-config'], function () {
  gulp.start('bump-version-comments')
})

// Single run of karma
gulp.task('karma-single', function (done) {
  new Server({
    configFile: path.join(__dirname, '/karma.conf.js'),
    singleRun: true
  }, done).start()
})

// Continuous testing with karma by watching for changes
gulp.task('karma-tdd', function (done) {
  new Server({
    configFile: path.join(__dirname, '/karma.conf.js')
  }, done).start()
})

gulp.task('test', function (callback) {
  runSequence(
    'templates', 'karma-single', 'clean-templates',
    callback
  )
})

gulp.task('tdd', function (callback) {
  runSequence(
    'templates', 'karma-tdd',
    callback
  )
})

gulp.task('build', ['clean'], function (callback) {
  runSequence(
    ['less', 'templates'],
    'enable-production',
    'usemin-index',
    'usemin-badbrowser',
    ['copy', 'copy-locales', 'copy-images', 'disable-production'],
    'clean-templates',
    callback
  )
})

gulp.task('package', ['cleanup-dist'])

gulp.task('publish', ['add-appcache-manifest', 'generate-service-worker'])

gulp.task('deploy', function () {
  return gulp.src('./dist/**/*')
    .pipe($.ghPages())
})

gulp.task('default', ['build'])
