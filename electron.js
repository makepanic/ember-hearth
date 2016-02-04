/* jshint node: true */
'use strict';

var electron = require('electron'),
  hearth /* = require('./hearth') */;

(function(){
  //TODO: move somewhere else. Content from hearth.js inlined because of electrons missing relative require
  'use strict';

  var Datastore = require('nedb'),
    uuid = require('node-uuid'),
    Promise = require('bluebird'),
    jsonminify = require("jsonminify"),
    spawn = require('child_process').spawn,
    fs = Promise.promisifyAll(require('fs')),
    path = require('path');

  const EMBER_BIN = path.join(__dirname, 'node_modules', 'ember-cli', 'bin', 'ember');

  let processes = {},
    db = {
      apps: new Datastore({filename: path.resolve(__dirname, 'hearth.nedb.json'), autoload: true})
    };

  function addMetadata(app) {
    // get some app metadata (could probably be cached, but avoids old entries if stored in db on add)
    console.log('stat', path.resolve(app.path, 'package.json'));
    const packagePath = path.resolve(app.path, 'package.json');
    const cliPath = path.resolve(app.path, '.ember-cli');

    return Promise.props({
      'package': fs.statAsync(packagePath),
      'cli': fs.statAsync(cliPath)
    }).then((stats) => {
      return Promise.props({
        'package': stats.package.isFile() && fs.readFileAsync(packagePath),
        cli: stats.cli.isFile() && fs.readFileAsync(cliPath)
      }).then(data => {
        if (data.package) app.package = JSON.parse(data.package);
        if (data.cli) app.cli = JSON.parse(jsonminify(data.cli.toString('utf8')));

        // TODO: read default ports
        if (!app.cli) app.cli = {};
        if (!app.cli.testPort) app.cli.testPort = 7357;
        if (!app.cli.port) app.cli.port = 4200;

        return app;
      });
    });
  }

  function emitApps(ev) {
    db.apps.find({}, function (err, apps) {
      Promise.all(apps.map(doc => addMetadata(doc)))
        .then((apps) => {
          // send jsonapi list of apps
          ev.sender.send('app-list', {
            data: apps.map(app => {
              return {
                id: app.id,
                type: 'project',
                attributes: app
              };
            })
          });
        }).catch(e => console.error(e));
    });
  }

  function addApp(ev, appPath) {
    db.apps.insert({
      id: uuid.v4(),
      path: appPath,
      name: path.basename(appPath)
    }, function (err, data) {
      emitApps(ev);
    });
  }

  function initApp(ev, app) {
    var ember = spawn(EMBER_BIN, ['init'], {
      cwd: path.normalize(app.path),
      detached: true
    });
    ember.stdout.on('data', (data) => {
      ev.sender.send('app-stdout', app, data.toString('utf8'));
      console.log(`${app.path} stdout: ${data}`);
    });
    ember.stderr.on('data', (data) => {
      ev.sender.send('app-stderr', app, data.toString('utf8'));
      console.log(`${app.path} stderr: ${data}`);
    });
    ember.on('close', (code) => {
      ev.sender.send('app-init-end', path);
      addApp(ev, app.path);
      console.log(`${app.path} child process exited with code ${code}`);
    });
    ev.sender.send('app-init-start', app);
    processes[app.id] = ember;
  }

  function startApp(ev, app) {
    var ember = spawn(EMBER_BIN, ['s'], {
      cwd: path.normalize(app.path),
      detached: true
    });
    ember.stdout.on('data', (data) => {
      ev.sender.send('app-stdout', app, data);
      console.log(`${app.name} stdout: ${data}`);
    });
    ember.stderr.on('data', (data) => {
      ev.sender.send('app-stderr', app, data);
      console.log(`${app.name} stderr: ${data}`);
    });
    ember.on('close', (code) => {
      ev.sender.send('app-close', app, code);
      console.log(`${app.name} child process exited with code ${code}`);
    });
    ev.sender.send('app-start', app);
    processes[app.id] = ember;
  }

  function stopApp(ev, app) {
    processes[app.id].kill();
  }

  function stopAllApps() {
    Object.keys(processes).forEach(appId =>
      processes[appId].kill());
  }

  hearth = {
    initApp,
    stopAllApps,
    stopApp,
    emitApps,
    addApp,
    startApp
  };
}());


var app = electron.app;
var ipc = electron.ipcMain;
var mainWindow = null;
var BrowserWindow = electron.BrowserWindow;

electron.crashReporter.start();

app.on('window-all-closed', function onWindowAllClosed() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function onReady() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });

  delete mainWindow.module;

  // If you want to open up dev tools programmatically, call
  // mainWindow.openDevTools();

  // By default, we'll open the Ember App by directly going to the
  // file system.
  //
  // Please ensure that you have set the locationType option in the
  // config/environment.js file to 'hash'. For more information,
  // please consult the ember-electron readme.
  mainWindow.loadURL('file://' + __dirname + '/dist/index.html');

  mainWindow.on('closed', function onClosed() {
    hearth.stopAllApps();
    mainWindow = null;
  });
});

var mapping = {
  'hearth-add-app': 'addApp',
  'hearth-ready': 'emitApps',
  'hearth-start-app': 'startApp',
  'hearth-stop-app': 'stopApp',
  'hearth-init-app': 'initApp'
};

Object.keys(mapping).forEach((evName) => {
  ipc.on(evName, (ev, data) => {
    console.log('ipc', evName, ...data);
    hearth[mapping[evName]](ev, ...data);
  });
});
