const env = {
   exec: window.nativeIpc?.exec
};

async function getStore(txMode, storeName) {}

function get(key) {
   return new Promise(function (r, e) {
      env.exec(r, e, 'db', { act: 'get', k: key });
   });
}

function getMany(keys) {
   return Promise.all(keys.map(function (key) {
      return get(key);
   }));
}

function set(key, value) {
   return new Promise(function (r, e) {
      env.exec(r, e, 'db', { act: 'set', k: key, v: value });
   });
}

function setMany(keyvals) {
   return Promise.all(keyvals.map(function (kv) {
      if (!kv || !kv[0] || !kv[1]) return;
      return set(kv[0], kv[1]);
   }));
}

function del(key) {
   return new Promise(function (r, e) {
      env.exec(r, e, 'db', { act: 'del', k: key });
   });
}

function delMany(keys) {
   return Promise.all(keys.map(function (key) {
      return del(key);
   }));
}

function clr() {
   return new Promise(function (r, e) {
      env.exec(r, e, 'db', { act: 'clr' });
   });
}


export default {
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
