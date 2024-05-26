const eb = require('./eventbus');
const { kp, km, on, off } = require('../ui/dom');
const sharedStat = require('./stat-shared');
const viewStat = require('./stat-view');

const db = require('../service/db');
const stocknet = require('../service/stock-network-data');

async function initStat() {
   const config = (await db.get('stock.view.config', await db.getStore())) || {};
   viewStat.filter = Object.assign(viewStat.filter, config.filter);
   viewStat.view = Object.assign(viewStat.view, config.view);
   const list = (await db.get('stock.list', await db.getStore())) || [];
   const fav = (await db.get('stock.list.fav', await db.getStore())) || [];
   list.forEach(function (z) {
      if (fav[z.code]) z.fav = true; else z.fav = false;
   })
   viewStat.list = list;
}

async function initEvents(ui) {
   ui.navButtons.forEach(function (navButton, i) {
      on(navButton.dom, 'click', function () { eb.emit('switch-tab', navButton.tab); });
   });
}

async function initDispatcher(ui) {
   eb.on('network.fetch.stock-all', onFetchAllStock);
   eb.on('network.fetch.stock-one', onFetchOneStock);
   eb.on('switch-tab', onSwitchTab.bind(ui));
}

function onSwitchTab(tab) {
   if (sharedStat.tab === tab) return;
   this.navButtons.forEach(function (z) {
      km(z.dom, 'active');
      kp(z.tabU.dom, 'hide');
   });
   let navButton;
   switch(tab) {
   case 'view': navButton = this.navButtons[0]; break;
   case 'index': navButton = this.navButtons[1]; break;
   case 'search': navButton = this.navButtons[2]; break;
   case 'settings': navButton = this.navButtons[3]; break;
   default: tab = 'view'; navButton = this.navButtons[0];
   }
   kp(navButton.dom, 'active');
   eb.emit(`tab.show.${tab}`);
   km(navButton.tabU.dom, 'hide');
   sharedStat.tab.active = tab;
}

async function onFetchOneStock(item) {
   if (!item || !item.code) return false;
   let p, origin;
   if (viewStat.network[item.code]) {
      p = viewStat.network[item.code];
      origin = false;
   } else {
      const prev = (await db.get(`stock.data.${item.code}`, await db.getStore()) || []);
      p = stocknet.tencent.getHistory(item.code, prev && prev.length > 0 ? new Date(prev[prev.length-1].T) : null);
      viewStat.network[item.code] = p;
      origin = true;
   }
   const r = await p;
   if (origin) delete viewStat.network[item.code];

   const itemHistory = {
      code: item.code,
      name: item.name,
      data: (await db.get(`stock.data.${item.code}`, await db.getStore())) || []
   };
   const map = itemHistory.data.reduce(function (a, z) {
      a[z.T] = z;
      return a;
   }, {});
   const ts0 = new Date(new Date().toISOString().split('T')[0]).getTime();
   r.forEach(function (z) {
      // XXX ignore or update data; currently we just update today's data and ignore before
      if (z.T === ts0 && map[z.T]) Object.assign(map[z.T], z);
      if (map[z.T]) return;
      itemHistory.data.push(z);
   });
   itemHistory.data = itemHistory.data.sort(function (a, b) { return a.ts - b.ts; });
   await db.set(`stock.data.${item.code}`, itemHistory.data, await db.getStore());

   const latest = itemHistory.data[itemHistory.data.length-1];
   if (latest !== item.latest) {
      const listItem = {
         fav: !!item.fav,
         code: item.code,
         name: item.name,
         latest: latest,
      };
      eb.emit('update.stock-item', listItem);
   }
   const updatedOne = viewStat.list.find(function (z) {
      return z.code === item.code;
   });
   if (updatedOne) {
      updatedOne.latest = latest;
      await db.set('stock.list', viewStat.list, await db.getStore());
   }
   eb.emit('update.stock-chart', itemHistory);
}

async function onFetchAllStock(list) {
   for (let i = 0, n = list.length; i < n; i++) {
      try {
         await onFetchOneStock(list[i]);
      } catch(_) { /* TODO erro handling */ }
   }
}

function init(ui) {
   initDispatcher(ui);
   initEvents(ui);

   initStat().then(function () {
      // by default, go to view tab
      eb.emit('switch-tab', 'view');
      eb.emit('render.view-list', viewStat.list);
   });
}

module.exports = {
   init,
};
