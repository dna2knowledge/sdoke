const { o, $p, kp, km, t } = require('./dom');
const eb = require('../ctrl/eventbus');
const IndexList = require('./index-list');
const IndexOne = require('./index-one');
const Loading = require('./loading');

const stat = require('../ctrl/stat-index');

function TabIndex() {
   const dom = o('div');
   const loading = new Loading('tab-index');
   const list = new IndexList();
   const one = new IndexOne();
   kp(dom, 's-tab');
   kp(list.dom, 'hide');
   kp(one.dom, 'hide');
   $p(dom, loading.dom);
   $p(dom, list.dom);
   $p(dom, one.dom);
   this.dom = dom;
   this.ui = {
      list: list,
      one: one
   };
   this.defer = {};

   this.init();
}
TabIndex.prototype = {
   init: function () {
      this.defer.onShow = onShow.bind(this);
      eb.on('tab.show.index', this.defer.onShow);
   },
   dispose: function () {
      eb.off('tab.show.index', this.defer.onShow);
   }
};

function onShow() {
   if (stat.prevUri === stat.uri) return;
   stat.prevUri = stat.uri;
   kp(this.ui.list.dom, 'hide');
   kp(this.ui.one.dom, 'hide');
   if (!stat.uri) {
      km(this.ui.list.dom, 'hide');
   } else {
      km(this.ui.one.dom, 'hide');
   }
}

module.exports = TabIndex;
