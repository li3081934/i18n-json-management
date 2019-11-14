"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const { app, BrowserWindow, Menu, dialog } = require('electron')
// const { readJSONSync, saveFile, flatObject } = require('./tools.js')
const electron_1 = require("electron");
const tools_1 = require("./tools");
const fs = require("fs");
const path = require("path");
const node_xlsx_1 = require("node-xlsx");
// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win;
// global.sharedObject = {
//     tableData: []
// }
let tableData = [];
let schema = [{ name: 'key' }];
const appPath = electron_1.app.getPath('appData');
const appName = 'json-tools';
const configFileName = 'config.json';
let config = {
    base: {
        name: '',
        path: ''
    },
    other: []
};
function createWindow() {
    // 创建浏览器窗口。
    win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // 加载index.html文件
    win.loadFile(path.resolve(__dirname, 'index.html'));
    // 打开开发者工具
    win.webContents.openDevTools();
    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        win = null;
    });
}
function initMenu() {
    let menu = electron_1.Menu.buildFromTemplate([
        {
            label: '文件',
            submenu: [
                {
                    label: '导入基础语言',
                    click: (menuItem, browserWindow, event) => {
                        let baseJsonPath = electron_1.dialog.showOpenDialogSync({
                            properties: ['openFile'],
                            filters: [
                                { name: 'Custom File Type', extensions: ['json'] },
                            ]
                        })[0];
                        importBasejson(baseJsonPath);
                        let name = path.parse(baseJsonPath).base;
                        config.base = {
                            name,
                            path: baseJsonPath
                        };
                        saveConfig();
                    }
                },
                {
                    label: '导入其他语言',
                    click: (menuItem, browserWindow, event) => {
                        let otherJsonPath = electron_1.dialog.showOpenDialogSync({
                            properties: ['openFile', 'multiSelections'],
                            filters: [
                                { name: 'Custom File Type', extensions: ['json'] },
                            ]
                        });
                        config.other = otherJsonPath.map(jsonPath => {
                            let { base } = path.parse(jsonPath);
                            return {
                                name: base,
                                path: jsonPath
                            };
                        });
                        importOtherJson(otherJsonPath);
                        saveConfig();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: '导出excel',
                    click: (menuItem, browserWindow, event) => {
                        let outPutPath = electron_1.dialog.showSaveDialogSync({
                            // properties: ['openDirectory'],
                            filters: [
                                { name: 'excel', extensions: ['xls'] },
                            ]
                        });
                        if (outPutPath) {
                            let outPutPathArr = outPutPath.split('\\');
                            let fileName = outPutPathArr.pop();
                            let dir = outPutPathArr.join('\\');
                            let header = schema.map(item => item.name);
                            let body = tableData.map(item => {
                                return header.map(head => item[head]);
                            });
                            // printLog(outPutFolder)
                            let excelBuff = node_xlsx_1.default.build([{ name: "translation", data: [header, ...body] }]);
                            tools_1.saveFile(dir, fileName, excelBuff);
                        }
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: '退出',
                    role: 'quit'
                },
            ]
        },
        {
            label: '调试',
            role: 'viewMenu'
        }
    ]);
    electron_1.Menu.setApplicationMenu(menu);
}
electron_1.ipcMain.on('get-tableData', (event, arg) => {
    // printLog(arg)
    tableData = arg.tableData;
    saveJson(arg.updateColum);
});
electron_1.ipcMain.on('scriptReady', (event, arg) => {
    if (tableData.length) {
        sendDataToRender();
    }
});
// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
electron_1.app.on('ready', () => {
    initConfig();
    initTableData();
    initMenu();
    createWindow();
});
// 当全部窗口关闭时退出。
electron_1.app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        createWindow();
    }
});
function sendDataToRender() {
    if (win && win.webContents) {
        win.webContents.send('baseJson-load', {
            table: tableData,
            schema: schema
        });
    }
}
function printLog(log) {
    if (win && win.webContents) {
        win.webContents.send('log', log);
    }
}
function initConfig() {
    let configPath = path.join(appPath, appName, configFileName);
    if (fs.existsSync(configPath)) {
        config = tools_1.readJSONSync(configPath).json;
        return;
    }
}
function saveConfig() {
    tools_1.saveFile(path.join(appPath, appName), configFileName, Buffer.from(JSON.stringify(config)));
}
function initTableData() {
    if (config.base.path) {
        importBasejson(config.base.path);
    }
    if (config.other && config.other.length) {
        importOtherJson(config.other.map(item => item.path));
    }
}
function importBasejson(baseJsonPath) {
    let { name, json } = tools_1.readJSONSync(baseJsonPath);
    schema = [...schema, { name }];
    let res = tools_1.flatObject(json);
    tableData = res.map(item => {
        return {
            key: item.key,
            [name]: item.value
        };
    });
    sendDataToRender();
}
function importOtherJson(otherJsonPath) {
    otherJsonPath.forEach(path => {
        let { name, json } = tools_1.readJSONSync(path);
        schema.push({ name });
        tableData.forEach(item => {
            item[name] = tools_1.getValueByKey(json, item.key);
        });
    });
    sendDataToRender();
}
function saveJson(updateColum) {
    let columData = tableData.map(item => {
        return {
            key: item.key,
            value: item[updateColum]
        };
    });
    let jsonData = tools_1.parseToJsonObj(columData);
    let path = findPathByName(updateColum);
    if (path) {
        tools_1.saveFile(path, updateColum, Buffer.from(JSON.stringify(jsonData)));
    }
}
function findPathByName(name) {
    let filePath = '';
    if (name === config.base.name) {
        filePath = config.base.path;
    }
    let res = config.other.find(item => item.name === name);
    if (res) {
        filePath = res.path;
    }
    return path.parse(filePath).dir;
}
//# sourceMappingURL=index.js.map