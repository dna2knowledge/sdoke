const makePromise = require('../util/make-promise');
const { once, multipleOnce } = require('../util/event-once');

const env = {
   name: 'sdoke',
   version: 20240520,
   db: makePromise(),
   db_: null,
};

async function getStore(txMode, storeName) {
   // readonly / readwrite
   storeName = storeName || 'sdoke';
   txMode = txMode || 'readwrite';
   if (env.db_) return getStoreApi();
   const req = window.indexedDB.open(env.name, env.version);
   once(req, 'upgradeneeded', function (evt) {
      const db = evt.target.result;
      db.createObjectStore(storeName);
   });
   multipleOnce(req, [{
      name: 'error',
      fn: function (evt) {
         env.db_ = null;
         env.db.e(evt.target.error);
      }
   }, {
      name: 'success',
      fn: function (evt) {
         env.db_ = evt.target.result;
         env.db.r(env.db_);
      }
   }]);
   await env.db.promise;
   return getStoreApi();

   function getStoreApi() {
      return env.db_.transaction([storeName], txMode).objectStore(storeName);
   }
}

function get(key) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      multipleOnce(store.get(key), [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt.target.result); }
      }]);
   });
}

function getMany(keys) {
   return Promise.all(keys.map(function (key) {
      return get(key);
   }));
}

function set(key, value) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      store.put(value, key);
      r();
      /*
      multipleOnce(store.transaction, [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt); }
      }]);
      */
   });
}

function setMany(keyvals) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      keyvals.forEach(function (kv) {
         store.put(kv[1], kv[0]);
      });
      multipleOnce(store.transaction, [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt); }
      }]);
   });
}

function del(key) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      store.delete(key);
      multipleOnce(store.transaction, [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt); }
      }]);
   });
}

function delMany(keys) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      keys.forEach(function (key) { store.delete(key); });
      multipleOnce(store.transaction, [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt); }
      }]);
   });
}

function clr() {
   return new Promise(async function (r, e) {
      const store = await getStore();
      store.clear();
      multipleOnce(store.transaction, [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt); }
      }]);
   });
}

if (window.DEBUG) {
console.log('[DEBUG mode] for db - faked');
module.exports = require('../debug/faked-db');
} else if (window.nativeIpc && window.nativeIpc.platform === 'electron') {
module.exports = require('./db-electron');
} else {
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
}
