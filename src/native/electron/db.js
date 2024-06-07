const i_fs = require('fs');
const i_path = require('path');
const { Level } = require('level');

const env = {
   init: null,
   db_: null,
};

async function exec(data, pinfo) {
   if (!data || !data.act) throw 'bad data for db op';
   if (!env.init) env.init = init(pinfo);
   await env.init;
   if (!env.db_) throw 'null db';
   switch(data.act) {
   case 'get': try { return await env.db_.get(data.k) } catch (_) { return null; };
   case 'set': return await env.db_.put(data.k, data.v);
   case 'del': return await env.db_.del(data.k);
   case 'clr': return await env.db_.clear();
   default: throw 'bad db op';
   }
}

function init(pinfo) {
   return new Promise((r, e) => {
      const basedir = i_path.join(pinfo.appDir, 'data');
      console.error(`[I] database dir: ${basedir}`);
      try { i_fs.mkdirSync(basedir); } catch(_) {}
      const db = new Level(basedir, { valueEncoding: 'json' });
      env.db_ = db;
      db.open((err) => err ? e(err) : r());
   });
}

function finalize() {
   return new Promise(async (r, e) => {
      try {
         if (env.db_) await env.db_.close();
      } catch(_) {
      }
      env.db_ = null;
      r();
   });
}

module.exports = {
   exec,
   finalize,
};
