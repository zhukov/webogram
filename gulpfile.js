var packageJson = require('./package.json')
var gulp = require('gulp')
var $ = require('gulp-load-plugins')({ lazy: false })
var path = require('path')
var http = require('http')
var st = require('st')
var del = require('del')
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
      html: [$.minifyHtml({ empty: true })],
      js: ['concat', $.ngAnnotate(), $.uglify({ outSourceMap: false })],
      css: ['concat', $.minifyCss({ compatibility: true, keepBreaks: true })]
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('usemin-badbrowser', function () {
  return gulp.src('app/badbrowser.html')
    .pipe($.usemin({
      html: [$.minifyHtml({ empty: true })],
      css: ['concat', $.minifyCss({ compatibility: true, keepBreaks: true })]
    }))
    .pipe(gulp.dest('dist'))
})

// ulimit -n 10240 on OS X
gulp.task('imagemin', function () {
  return gulp.src(['app/img/**/*', '!app/img/screenshot*', '!app/img/*.wav'])
    .pipe($.imagemin())
    .pipe(gulp.dest('dist/img'))
})

gulp.task('standard', function () {
  return gulp.src(['app/**/*.js', '!app/vendor/**/*', 'gulpfile.js'])
    .pipe($.standard())
    .pipe($.standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('copy-images', function () {
  return gulp.src(['app/img/**/*', '!app/img/screenshot*', '!app/img/*.wav'])
    .pipe(gulp.dest('dist/img'))
})

gulp.task('copy', gulp.parallel(
  function () {
    return gulp.src(['app/favicon.ico', 'app/favicon_unread.ico', 'app/manifest.webapp', 'app/manifest.webapp.json', 'app/manifest.json', 'app/**/*worker.js'])
      .pipe(gulp.dest('dist'))
  },
  function () {
    return gulp.src(['app/img/**/*.wav'])
      .pipe(gulp.dest('dist/img'))
  },
  function () {
    return gulp.src(['app/js/lib/polyfill.js', 'app/js/lib/bin_utils.js'])
      .pipe(gulp.dest('dist/js/lib'))
  },
  function () {
    return gulp.src('app/vendor/closure/long.js')
      .pipe(gulp.dest('dist/vendor/closure'))
  },
  function () {
    return gulp.src(['app/css/desktop.css', 'app/css/mobile.css'])
      .pipe(gulp.dest('dist/css'))
  },
  function () {
    return gulp.src('app/vendor/jsbn/jsbn_combined.js')
      .pipe(gulp.dest('dist/vendor/jsbn'))
  },
  function () {
    return gulp.src('app/vendor/leemon_bigint/bigint.js')
      .pipe(gulp.dest('dist/vendor/leemon_bigint'))
  },
  function () {
    return gulp.src('app/vendor/rusha/rusha.js')
      .pipe(gulp.dest('dist/vendor/rusha'))
  },
  function () {
    return gulp.src('app/vendor/cryptoJS/crypto.js')
      .pipe(gulp.dest('dist/vendor/cryptoJS'))
  },
  function () {
    return gulp.src(['app/nacl/mtproto_crypto.pexe', 'app/nacl/mtproto_crypto.nmf'])
      .pipe(gulp.dest('dist/nacl/'))
  },
  function () {
    return gulp.src('app/js/background.js')
      .pipe(gulp.dest('dist/js'))
  }
))

gulp.task('copy-locales', function (callback) {
  var langpackSrc = []
  var ngSrc = []

  packageJson.locales.forEach(function (locale) {
    langpackSrc.push('app/js/locales/' + locale + '.json')
    ngSrc.push('app/vendor/angular/i18n/angular-locale_' + locale + '.js')
  })
  gulp.parallel(
    function () {
      return gulp.src(langpackSrc)
        .pipe(gulp.dest('dist/js/locales/'))
    },
    function () {
      return gulp.src(ngSrc)
        .pipe(gulp.dest('dist/vendor/angular/i18n/'))
    }
  )(callback)
})

gulp.task('clean', function () {
  return del(['dist/*', 'app/js/templates.js', 'app/css/*', '!dist/.git'])
})

gulp.task('less', function () {
  return gulp.src('app/less/*.less')
    .pipe($.less({
      paths: [path.join(__dirname, 'less', 'includes')],
      javascriptEnabled: true
    }))
    .pipe(gulp.dest('app/css'))
})

gulp.task('disable-production', gulp.parallel(
  function () {
    return gulp.src('app/index.html')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN-->/g, 'PRODUCTION_ONLY_BEGIN'))
      .pipe($.replace(/<!--PRODUCTION_ONLY_END/g, 'PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app'))
  },
  function () {
    return gulp.src('app/**/*.js')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN'))
      .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, 'PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app'))
  }
))

gulp.task('enable-production', gulp.parallel(
  function () {
    return gulp.src('app/**/*.html')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN/g, 'PRODUCTION_ONLY_BEGIN-->'))
      .pipe($.replace(/PRODUCTION_ONLY_END/, '<!--PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app'))
  },
  function () {
    return gulp.src('app/**/*.js')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN*/'))
      .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, '/*PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('app'))
  }
))

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('less', 'templates'),
  'enable-production',
  'usemin-index',
  'usemin-badbrowser',
  gulp.parallel('copy', 'copy-locales', 'copy-images', 'disable-production'),
  'clean-templates'
))

gulp.task('compress-dist', gulp.series('build', function () {
  return gulp.src('**/*', { cwd: path.join(process.cwd(), '/dist') })
    .pipe($.zip('webogram_v' + packageJson.version + '.zip'))
    .pipe(gulp.dest('releases'))
}))

gulp.task('cleanup-dist', gulp.series('compress-dist', function () {
  return del(['releases/**/*', '!releases/*.zip'])
}))

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
    staticFileGlobs: fileGlobs,
    stripPrefix: './' + rootDir + '/',
    importScripts: ['js/lib/push_worker.js'],
    verbose: true,
    maximumFileSizeToCacheInBytes: 3004152, // about 3MB, default is "2097152" 2MB,
    navigateFallback: 'index.html'
  }
  swPrecache.write(path.join(rootDir, 'service_worker.js'), config, callback)
}

gulp.task('generate-service-worker', gulp.series('build', function (callback) {
  writeServiceWorkerFile('dist', true, callback)
}))

gulp.task('add-appcache-manifest', gulp.series('build', function () {
  return gulp.src(fileGlobs)
    .pipe($.manifest3({
      timestamp: false,
      hash: true,
      network: ['http://*', 'https://*', '*'],
      filename: 'webogram.appcache',
      exclude: ['webogram.appcache', 'app.manifest']
    })
    )
    .pipe(gulp.dest('./dist'))
}))

gulp.task('package-dev', gulp.parallel(
  function () {
    return gulp.src('app/partials/*.html')
      .pipe($.angularTemplatecache('templates.js', {
        root: 'partials',
        module: 'myApp.templates',
        standalone: true
      }))
      .pipe(gulp.dest('dist_package/js'));
  },
  function () {
    return gulp.src(['app/favicon.ico', 'app/favicon_unread.ico', 'app/manifest.webapp', 'app/manifest.json'])
      .pipe(gulp.dest('dist_package'));
  },
  function () {
    return gulp.src(['app/css/**/*'])
      .pipe(gulp.dest('dist_package/css'));
  },
  function () {
    return gulp.src(['app/img/**/*'])
      .pipe(gulp.dest('dist_package/img'));
  },
  function () {
    return gulp.src('app/vendor/**/*')
      .pipe(gulp.dest('dist_package/vendor'));
  },
  function () {
    return gulp.src('app/**/*.json')
      .pipe(gulp.dest('dist_package'));
  },
  function () {
    return gulp.src('app/**/*.html')
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN/g, 'PRODUCTION_ONLY_BEGIN-->'))
      .pipe($.replace(/PRODUCTION_ONLY_END/, '<!--PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('dist_package'));
  },

  function () {
    return gulp.src('app/**/*.js')
      .pipe($.ngAnnotate())
      .pipe($.replace(/PRODUCTION_ONLY_BEGIN(\*\/)?/g, 'PRODUCTION_ONLY_BEGIN*/'))
      .pipe($.replace(/(\/\*)?PRODUCTION_ONLY_END/g, '/*PRODUCTION_ONLY_END'))
      .pipe(gulp.dest('dist_package'));
  }
)
)

gulp.task('watchcss', function () {
  return gulp.src('app/css/*.css')
    .pipe($.livereload())
})

gulp.task('watchhtml', function () {
  return gulp.src('app/partials/**/*.html')
    .pipe($.livereload())
})

gulp.task('server', function (done) {
  http.createServer(
    st({ path: __dirname, index: 'index.html', cache: false })
  ).listen(8000, done)
})

gulp.task('watch', gulp.series(gulp.parallel('server', 'less'), function () {
  $.livereload.listen({ basePath: 'app' })
  gulp.watch('app/css/*.css', gulp.series('watchcss'))
  gulp.watch('app/less/**/*.less', gulp.series('less'))
  gulp.watch('app/partials/**/*.html', gulp.series('watchhtml'))
}))

gulp.task('bump', gulp.series(gulp.parallel('bump-version-manifests', 'bump-version-config'), function () {
  gulp.start('bump-version-comments')
}))

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

gulp.task('test', gulp.series('templates', 'karma-single', 'clean-templates'))

gulp.task('tdd', gulp.series('templates', 'karma-tdd'))

gulp.task('package', gulp.series('cleanup-dist'))

gulp.task('publish', gulp.series('add-appcache-manifest', 'generate-service-worker'))

gulp.task('default', gulp.series('build'))
