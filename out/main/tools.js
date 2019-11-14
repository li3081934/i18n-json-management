"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
function saveFile(dir, fileName, file) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    fs.writeFile(path.join(dir, fileName), file, (err) => {
        if (err)
            throw err;
        console.log(fileName + ' has been saved! In ' + dir);
    });
}
exports.saveFile = saveFile;
function readJSONSync(path) {
    let pathArr = path.split('\\');
    return {
        name: pathArr[pathArr.length - 1],
        json: JSON.parse(fs.readFileSync(path))
    };
}
exports.readJSONSync = readJSONSync;
function flatObject(obj) {
    let res = [];
    f(obj);
    function f(obj, preKey = '') {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                f(obj[key], key);
            }
            else {
                res.push({
                    key: preKey ? preKey + '.' + key : key,
                    value: obj[key]
                });
            }
        }
    }
    return res;
}
exports.flatObject = flatObject;
function getValueByKey(obj, key) {
    let keyArr = key.split('.');
    let currentObj = obj;
    let res = '';
    while (keyArr.length) {
        let key = keyArr.shift();
        if (!currentObj[key]) {
            break;
        }
        if (typeof currentObj[key] === 'string' || typeof currentObj[key] === 'number') {
            res = currentObj[key];
            break;
        }
        if (typeof currentObj[key] === 'object') {
            currentObj = currentObj[key];
        }
    }
    return res;
}
exports.getValueByKey = getValueByKey;
function parseToJsonObj(keyVal) {
    let res = {};
    keyVal.forEach(item => {
        p(res, item.key.split('.'), item.value);
    });
    function p(obj, keyArr, value) {
        let key = keyArr.shift();
        if (!keyArr.length) {
            obj[key] = value;
        }
        else {
            if (!obj[key]) {
                obj[key] = {};
            }
            obj = obj[key];
            p(obj, keyArr, value);
        }
    }
    return res;
}
exports.parseToJsonObj = parseToJsonObj;
//# sourceMappingURL=tools.js.map