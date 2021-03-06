const electron = require("electron");
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const { Menu, protocol, ipcMain} = require('electron');
//const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

const settings = require("./config.json");

//const request = require("request")
/*autoUpdater.logger= log;
autoUpdater.logger.transports.file.level = 'info';
log('App starting...');*/



var bunyan = require("bunyan");
var logBuffer = [];

function DataLogger() {}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function sendStatusToWindow(text) {
  //log(text);
  mainWindow.webContents.send('message', text);
}


function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({ width: 1200, height: 680, resize: true});
	mainWindow.once("focus", () => mainWindow.flashFrame(false));
	mainWindow.flashFrame(true);
	createLogger();
	// and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html#v${app.getVersion()}`);

	/*mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "index.html"),
		protocol: "file:",
		slashes: true
	}));*/

	// Open the DevTools.
	if (settings.debug)
		mainWindow.webContents.openDevTools();

	mainWindow.on("close", function() {
		//Send logs to API Server 
		var dataLogger = new DataLogger();
		dataLogger.sendLogs();
	});

	// Emitted when the window is closed.
	mainWindow.on("closed", function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on('ready', function()  {
  autoUpdater.checkForUpdatesAndNotify();
});

app.on("activate", function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// Check log length and send to server

function createLogger() {
	DataLogger.prototype.write = function write(record) {
		mainWindow.webContents.executeJavaScript("localStorage.getItem(\"user\")")
			.then((result) => {
				record.user = result;
				record.message = record.msg;
				delete record.msg;
				delete record.pid;
				delete record.hostname;
				delete record.time;
				delete record.v;
				var trace = record.trace.split("\n");
				record.trace = trace[1].trim();
				logBuffer.push(record);
				if (logBuffer.length > 5) {
					this.sendLogs();
				}
			})
			.catch((err) => {
				console.log(err);
			});
	};

	DataLogger.prototype.sendLogs = function sendLogs() {
		console.log("sending request");
		mainWindow.webContents.executeJavaScript("localStorage.getItem(\"token\")").then((token) => {
			if (logBuffer.length > 0) {
				var data = {
					messages: logBuffer,
					user_token: token
				};

				var request = require("request");

				var options = {
					method: "POST",
					url: `${settings.urls.API}/upload_pacs_log`,
					headers: {
						"content-type": "application/json"
					},
					body: data,
					json: true
				};
				//Send logs to API Server 
				request(options, function(error, response, body) {
					if (error) throw new Error(error);
					console.log("Response");
					if( response.statusCode === 200 ) {
						console.log("clearing buffer");
						logBuffer = [];
					}
					console.log(body);
				});
				return;
			}
			
			console.log("Log is empty");
		}).catch((err) => {
			console.log("Error");
			console.log(err);
		});
	};

	var log = bunyan.createLogger({
		name: "PredEx",
		trace: [],
		streams: [{
			type: "raw",
			level: 20,
			stream: new DataLogger()
		}],
	});

	global.logObject = log;
	global.logBuffer = logBuffer;
	global.random = {prop1: null};
	return;
}


// Handles visibility of webapp and local predex
global.predexViewHandler = function() {
	mainWindow.webContents.executeJavaScript("\
		var liverFrame = document.getElementById('liverFrame');\
		liverFrame.style.zIndex='-1';\
		liverFrame.src = 'about:blank';\
		document.getElementsByClassName('content')[0].style.zIndex = '-1';\
		document.getElementsByClassName('footer')[0].style.zIndex = '-1';\
		document.body.style.overflowY = 'auto';\
		");
};

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.