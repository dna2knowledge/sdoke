const makePromise = require('./util/make-promise');
const { once, multipleOnce } = require('./util/event-once');

const env = {
   name: 'sdoke',
   version: 20240520,
   db: makePromise(),
   db_: null,
};

async function getStore(storeName, txMode) {
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
      return env.db_.transaction(storeName, txMode).objectStore(storeName);
   }
}

function get(key, store) {
   return new Promise(function (r, e) {
      multipleOnce(store.get(key), [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt); }
      }]);
   });
}

function getMany(keys, store) {
   return Promise.all(keys.map(function (key) {
      return get(key, store);
   }));
}

function set(key, value, store) {
   return new Promise(function (r, e) {
      store.put(value, key);
      multipleOnce(store.transaction, [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt); }
      }]);
   });
}

function setMany(keyvals, store) {
   return new Promise(function (r, e) {
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

function del(key, store) {
   return new Promise(function (r, e) {
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

function delMany(keys, store) {
   return new Promise(function (r, e) {
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

function clr(key, store) {
   return new Promise(function (r, e) {
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
