const fs = require('fs');
const path = require('path');

function saveFile(dir, fileName, file) {
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    fs.writeFile(path.join(dir, fileName), file, (err) => {
        if (err) throw err;
        console.log(fileName + ' has been saved! In ' + dir);
    })
}

function readJSONSync(path: string) {
    let pathArr = path.split('\\')
    return {
        name: pathArr[pathArr.length - 1],
        json: JSON.parse(fs.readFileSync(path))
    }
}

function flatObject (obj: {[key: string]: any}): { key: string, value: any}[] {
    let res = []
    f(obj)
    function f(obj: {[key: string]: any}, preKey = '') {
        for(let key in obj) {
            if (typeof obj[key] === 'object') {
                f(obj[key], key)
            } else {
                res.push({
                    key: preKey ? preKey + '.' + key : key,
                    value: obj[key]
                })
            }
        }
    }
    return res
}

function getValueByKey(obj: {[key: string]: any}, key:string) {
    let keyArr = key.split('.')
    let currentObj = obj
    let res = ''
    while (keyArr.length) {
        let key = keyArr.shift()
        if (!currentObj[key]) {
            break
        }
        if (typeof currentObj[key] === 'string' || typeof currentObj[key] === 'number') {
            res = currentObj[key]
            break
        }
        if (typeof currentObj[key] === 'object') {
            currentObj = currentObj[key]
        }
    }
    return res
}
export { saveFile, readJSONSync, flatObject, getValueByKey }
