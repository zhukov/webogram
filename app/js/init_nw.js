;(function () {
  if (typeof require !== 'function') {
    return;
  }

  var Webogram = window.Webogram = global.Webogram = {

    gui: require('nw.gui'),
    Window: require('nw.gui').Window.get(),
    openWindow: require('nw.gui').Window.open,

    PLATFORM_WINDOWS: process.platform === 'win32',
    PLATFORM_MAC: process.platform === 'darwin',
    PLATFORM_LINUX: process.platform === 'linux'

  };

  //Tray icon
  var trayOptions = {
    icon: 'app/img/icons/icon16.png', //Relative to package.json file
    title: 'Webogram'
  };

  var tray_icon = new Webogram.gui.Tray(trayOptions);

  //Tray Icon Right Click Menu
  var tray_menu = new Webogram.gui.Menu();

  tray_menu.append(new Webogram.gui.MenuItem({
    label: 'Show Window',
    click: function () {
      Webogram.Window.show();
      Webogram.Window.focus();
    }
  }));

  tray_menu.append(new Webogram.gui.MenuItem({
    label: 'Hide Window',
    click: function () {
      Webogram.Window.hide();
    }
  }));

  tray_menu.append(new Webogram.gui.MenuItem({
    label: 'Exit Webogram',
    click: function () {
      Webogram.Window.close();
    }
  }));

  tray_icon.menu = tray_menu;
  tray_icon.on('click', function () {
    Webogram.Window.show();
    Webogram.Window.focus();
  });

  //Push tray icon to global window to tell garbage collector that tray icon is not garbage
  Webogram._trayIcon = tray_icon;

  if (Webogram.PLATFORM_WINDOWS) {
    Webogram.Window.on('minimize', function () {
      Webogram.Window.hide();
    });
  }

  //Devtools for developers
  //Allow anyone to open dev tools for error reporting
  window.addEventListener('keydown', function (e) {
    if (e.keyIdentifier === 'F12') {
      Webogram.Window.showDevTools();
    }
  });
})();
