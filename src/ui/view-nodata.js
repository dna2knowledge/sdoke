const { o, $p, kp, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const NavIconButton = require('./nav-icon-button');
const sharedStat = require('../ctrl/stat-shared');
const stat = require('../ctrl/stat-view');

const db = require('../debug/faked-db');
const stocknet = require('../debug/faked-stock-network-data');

function ViewNoData() {
   const dom = o('div');
   const container = o('div');
   const label = o('div');
   const btn = new NavIconButton('af-flag-blue.svg', 'Click to Start ...');
   label.textContent = 'No Data';
   kp(dom, 's-tab-view-nodata');
   kp(label, 's-gray');
   $p(container, label);
   $p(container, btn.dom);
   $p(dom, container);
   this.dom = dom;
   this.ui = {
      start: btn
   };
   this.defer = {};
   this.init();
}

ViewNoData.prototype = {
   init: function () {
      this.defer.onFetchList = onFetchList.bind(this);
      on(this.ui.start.dom, 'click', this.defer.onFetchList);
   },
   dispose: function () {
      off(this.ui.start.dom, 'click', this.defer.onFetchList);
   }
};

async function onFetchList() {
   eb.emit('loading.tab-view');
   const origin = !stat.network.fetch_list;
   const p = stat.network.fetch_list || Promise.all([
      stocknet.getBjList(),
      stocknet.getShList(),
      stocknet.getSzList()
   ]);
   if (!stat.network.fetch_list) stat.network.fetch_list = p;

   const r = await p;
   if (origin) stat.network.fetch_list = null;
   stat.list = r.reduce(function (a, z) {
      z.forEach(function (x) {
         x.fav = false;
         x.latest = null;
      });
      return a.concat(z);
   }, []);
   // TODO persist into db

   eb.emit('loaded.tab-view');
   // XXX: if user look into another page
   stat.prevUri = null;
   stat.uri = '';
   eb.emit('render.view-list');
   eb.emit('network.fetch.stock-all', stat.list);
   if (sharedStat.tab.active === 'view') eb.emit('tab.show.view');
}

module.exports = ViewNoData;
