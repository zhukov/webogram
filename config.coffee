exports.config =
  # See docs at http://brunch.readthedocs.org/en/latest/config.html.
  conventions:
    assets:  /^app\/assets\//
    ignored: /^(bower_components\/bootstrap-less(-themes)?|app\/styles\/overrides|(.*?\/)?[_]\w*)/

  modules:
    definition: false
    wrapper: false

  paths:
    public: 'public'

  files:
    javascripts:
      joinTo:
        'scripts/app.js': /^app(?![\\/]workers)/
        'scripts/vendor.js': /^(bower_components|vendor)/
        'scripts/workers/aes.js': /console-polyfill|config|mtproto|jsbn.js|crypto.js|workers\/aes/
        'scripts/workers/pq.js': /console-polyfill|config|mtproto|jsbn.js|workers\/pq/
        'scripts/workers/sha.js': /console-polyfill|config|mtproto|crypto.js|workers\/sha/
      order:
        before: [
          'app/config.js'
          'app/mtproto.js'
          'app/util.js'
          'app/app.js'
          'app/services.js'
          'app/controllers.js'
          'app/filters.js'
          'app/directives.js'
        ]
    stylesheets:
      joinTo:
        'app.css': /^(app|vendor|bower_components)/
        # vendor/angular/angular-csp.css
        # bootstrap
        # nanoscroller
        # app.css
      order:
        before: [
          'app/styles/app.less'
        ]
