function UixComponentRegistry() {
   this.comp = {};
   this.autoid = 1;
}
UixComponentRegistry.prototype = {
   nextId: function () {
      const id = this.autoid ++;
      // XXX: asume in one view, there is no more than 10e8 named components
      this.autoid %= 10e8;
      return id;
   },
   register: function (name, obj) { this.comp[name] = obj || true; },
   unregister: function (name) { delete this.comp[name]; },
   exist: function (name) { return name in this.comp; },
   get: function (name) { return this.comp[name]; },
   waitUntil: function(name) {
      const that = this;
      return new Promise(r => {
         waitFor(that, name, r);
         function waitFor(obj, name, r) {
            if (obj[name]) return r();
            setTimeout(waitFor, 0, obj, name, r);
         }
      });
   },
   waitMs: function(name, ms) {
      const that = this;
      const ts = new Date().getTime();
      return new Promise((r, e) => {
         waitFor(that, name, r);
         function waitFor(obj, name, r, e) {
            if (obj[name]) return r();
            const tsnow = new Date().getTime();
            if (tsnow - ts > ms) return e('timeout');
            setTimeout(waitFor, 100, obj, name, r, e);
         }
      });
   },
   waitCount: function(name, count) {
      const that = this;
      return new Promise((r, e) => {
         waitFor(that, name, r);
         function waitFor(obj, name, count, r, e) {
            if (obj[name]) return r();
            if (count <= 0) return e('tickout');
            setTimeout(waitFor, 100, obj, name, count-1, r, e);
         }
      });
   },
};

function UixEventBus() { this._events = {}; }
UixEventBus.prototype = {
   emit: function(evt, data) {
      if (!this._events[evt]) return;
      this._events[evt].forEach(function (cb) { cb(data, evt); })
   },
   on: function(evt, cb) {
      if (!this._events[evt]) this._events[evt] = [];
      if (this._events[evt].indexOf(cb) >= 0) return;
      this._events[evt].push(cb);
   },
   off: function(evt, cb) {
      const i = this._events[evt]?.indexOf(cb);
      if (i >= 0) this._events[evt].splice(i, 1);
      if (!this._events[evt].length) delete this._events[evt];
   },
};
const eventbus = new UixEventBus();
eventbus.EventBus = UixEventBus;
eventbus.ComponentRegistry = UixComponentRegistry;
eventbus.comp = new UixComponentRegistry();
// XXX for debug purpose only
if (typeof(window) !== 'undefined') window._eventbus = eventbus;

export default eventbus;
