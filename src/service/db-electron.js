const env = {
   exec: window.nativeIpc.exec
};

async function getStore(txMode, storeName) {}

async function get(key) {
   return env.exec('db', { act: 'get', k: key });
}

function getMany(keys) {
   return Promise.all(keys.map(function (key) {
      return get(key);
   }));
}

async function set(key, value) {
   return env.exec('db', { act: 'set', k: key, v: value });
}

function setMany(keyvals) {
   return Promise.all(keyvals.map(function (kv) {
      if (!kv || !kv[0] || !kv[1]) return;
      return set(kv[0], kv[1]);
   }));
}

async function del(key) {
   return env.exec('db', { act: 'del', k: key });
}

function delMany(keys) {
   return Promise.all(keys.map(function (key) {
      return del(key);
   }));
}

async function clr() {
   return env.exec('db', { act: 'clr' });
}


module.exports = {
   env,
   getStore,
   get,
   getMany,
   set,
   setMany,
   del,
   delMany,
   clr,
};
