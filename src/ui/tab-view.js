const { o, $p, kp, km, t } = require('./dom');
const eb = require('../ctrl/eventbus');
const ViewNoData = require('./view-nodata');
const ViewList = require('./view-list');
const ViewOne = require('./view-one');
const Loading = require('./loading');

const stat = require('../ctrl/stat-view');

function TabView() {
   const dom = o('div');
   const loading = new Loading('tab-view');
   const nodata = new ViewNoData();
   const list = new ViewList();
   const one = new ViewOne();
   kp(dom, 's-tab');
   kp(nodata.dom, 'hide');
   kp(list.dom, 'hide');
   kp(one.dom, 'hide');
   $p(dom, loading.dom);
   $p(dom, nodata.dom);
   $p(dom, list.dom);
   $p(dom, one.dom);
   this.dom = dom;
   this.ui = {
      list: list,
      one: one,
      nodata: nodata
   };
   this.defer = {};

   this.init();
}
TabView.prototype = {
   init: function () {
      this.defer.onShow = onShow.bind(this);
      eb.on('tab.show.view', this.defer.onShow);
   },
   dispose: function () {
      eb.off('tab.show.view', this.defer.onShow);
   }
};

function onShow() {
   if (stat.prevUri === stat.uri) return;
   stat.prevUri = stat.uri;
   kp(this.ui.list.dom, 'hide');
   kp(this.ui.one.dom, 'hide');
   kp(this.ui.nodata.dom, 'hide');
   if (!stat.list.length) {
      km(this.ui.nodata.dom, 'hide');
      return;
   }
   if (!stat.uri || stat.uri === '/') {
      km(this.ui.list.dom, 'hide');
   } else {
      km(this.ui.one.dom, 'hide');
   }
}

module.exports = TabView;
