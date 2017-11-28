const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const request = require('request');
var bunyan = require('bunyan');
var logBuffer = [];
var user = user;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 1200, height: 680 })
    mainWindow.once('focus', () => mainWindow.flashFrame(false))
    mainWindow.flashFrame(true)
    createLogger();
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        console.log(logBuffer)
        //Send a logs to API Server 
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// Check log length and send to server

function createLogger(user) {

    function DataLogger() {
    }

    DataLogger.prototype.write = function write(record) {
        mainWindow.webContents.executeJavaScript('localStorage.getItem("user")', true)
        .then((result) => {
            record.user = result;
            delete record.pid;
            logBuffer.push(record);
        })
        if (logBuffer.length > 5) {
            //Send a logs to API Server 
            this.clear();
        }
    };

    DataLogger.prototype.clear = function end() {
        logBuffer = [];
    };

    var log = bunyan.createLogger({
        name: 'pacs-explorer',
        streams: [{
            type: 'raw',
            level: 20,
            stream: new DataLogger(),
        }],
    });

    global.logObject = log;
    global.logBuffer = logBuffer;
    return;
}


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.