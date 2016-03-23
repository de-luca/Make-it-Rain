'use strict';

const app = require('app');
const windowStateKeeper = require('electron-window-state');
const BrowserWindow = require('browser-window');
const fs = require('fs');
const exists = require('exists-file');

if(exists(app.getPath('userData')+'/db/accounts'))
  fs.createReadStream(app.getPath('userData')+'/db/accounts')
    .pipe(fs.createWriteStream(app.getPath('userData')+'/db/accounts_old'));
if(exists(app.getPath('userData')+'/db/posts'))
  fs.createReadStream(app.getPath('userData')+'/db/posts')
    .pipe(fs.createWriteStream(app.getPath('userData')+'/db/posts_old'));
if(exists(app.getPath('userData')+'/db/companies'))
  fs.createReadStream(app.getPath('userData')+'/db/companies')
    .pipe(fs.createWriteStream(app.getPath('userData')+'/db/companies_old'));

let win;

app.on('ready', function () {
  require(__dirname+'/menu.js').build();

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
