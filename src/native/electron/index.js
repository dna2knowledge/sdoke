// const i_lv = require('level');

async function exec(cmd, data, platformInfo) {
   console.log(cmd, data, platformInfo.appDir);
   return 'hello world';
}

module.exports = exec;
