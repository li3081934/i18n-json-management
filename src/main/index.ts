// const { app, BrowserWindow, Menu, dialog } = require('electron')
// const { readJSONSync, saveFile, flatObject } = require('./tools.js')
import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { readJSONSync, saveFile, flatObject, getValueByKey } from './tools'
import * as path from 'path'
// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭

let win
// global.sharedObject = {
//     tableData: []
// }
let tableData = []
let schema: { name: string }[] = [ { name: 'key'}]
function createWindow () {
    // 创建浏览器窗口。
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // 加载index.html文件
    win.loadFile(path.resolve(__dirname, 'index.html'))
    // 打开开发者工具
    win.webContents.openDevTools()
    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        win = null
    })
}

function initMenu () {
    let menu = Menu.buildFromTemplate([
        {
            label: '文件' ,
            submenu: [
                {
                    label:'导入基础语言',
                    click: (menuItem, browserWindow, event) => {
                        let baseJsonPath = dialog.showOpenDialogSync({
                            properties: ['openFile'],
                            filters: [
                                { name: 'Custom File Type', extensions: ['json'] },
                            ]
                        })[0]
                        let { name, json } = readJSONSync(baseJsonPath)
                        schema = [ ...schema, { name } ]
                        let res = flatObject(json)
                        tableData = res.map(item => {
                            return {
                                key: item.key,
                                [name]: item.value
                            }
                        })
                        sendDataToRender()
                    }
                },
                {
                    label: '导入其他语言',
                    click: (menuItem, browserWindow, event) => {
                        let otherJsonPath = dialog.showOpenDialogSync({
                            properties: ['openFile', 'multiSelections'],
                            filters: [
                                { name: 'Custom File Type', extensions: ['json'] },
                            ]
                        })
                        otherJsonPath.forEach(path => {
                            let { name, json } = readJSONSync(path)
                            schema.push({name})
                            tableData.forEach(item => {
                                item[name] = getValueByKey(json, item.key)
                            })
                        })
                        sendDataToRender()
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: '导出excel',
                    click: (menuItem, browserWindow, event) => {
                        let outPutFolder = dialog.showOpenDialogSync({
                            properties: ['openDirectory'],
                        })[0]
                        console.log(outPutFolder)
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
    ])
    Menu.setApplicationMenu(menu)
}

ipcMain.on('get-tableData', (event, arg) => {
    tableData = arg
})
// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', () => {
    createWindow()
    initMenu()
})

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        createWindow()
    }
})

function sendDataToRender() {
    win.webContents.send('baseJson-load', {
        table: tableData,
        schema: schema
    })
}

function printLog (log: any) {
    win.webContents.send('log', log)
}