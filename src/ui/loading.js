const { o, kp, km } = require('./dom');
const eb = require('../ctrl/eventbus');

function Loading(name) {
   const dom = o('div');
   kp(dom, 'loading');
   kp(dom, 'hide');
   this.name = name || '';
   this.dom = dom;
   this.defer = {};
   this.init();
}
Loading.prototype = {
   init: function () {
      this.defer.onLoading = onLoading.bind(this);
      this.defer.onLoaded = onLoaded.bind(this);
      eb.on(`loading.${this.name}`, this.defer.onLoading);
      eb.on(`loaded.${this.name}`, this.defer.onLoaded)
   },
   dispose: function () {
      eb.off(`loading.${this.name}`, this.defer.onLoading);
      eb.off(`loaded.${this.name}`, this.defer.onLoaded)
   }
};

function onLoading() {
   km(this.dom, 'hide');
}

function onLoaded() {
   kp(this.dom, 'hide');
}

module.exports = Loading;
