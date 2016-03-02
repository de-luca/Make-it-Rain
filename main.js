'use strict';

const app = require('app');
const windowStateKeeper = require('electron-window-state');
const BrowserWindow = require('browser-window');

let win;

app.on('ready', function () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 500
  });

  win = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height
  });

  mainWindowState.manage(win);

  win.loadURL('file://'+__dirname+'/static/index.html');

  win.on('closed', function () {
    win = null;
  });
});

app.on('window-all-closed', function () {
  app.quit();
});
