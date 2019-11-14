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

function readJSONSync(path) {
    let pathArr = path.split('\\')
    return {
        name: pathArr[pathArr.length - 1],
        json: JSON.parse(fs.readFileSync(path))
    }
}

function flatObject (obj) {
    let res = []
    f(obj)
    function f(obj, preKey = '') {
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
module.exports = { saveFile, readJSONSync, flatObject }
