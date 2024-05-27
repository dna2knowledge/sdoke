const i_db = require('./db');

async function exec(cmd, data, platformInfo) {
   switch(cmd) {
   case 'db': return i_db.exec(data, platformInfo); break;
   default: throw 'not implemented yet';
   }
}

async function finalize() {
   await i_db.finalize();
}

module.exports = {
   exec,
   finalize,
};
