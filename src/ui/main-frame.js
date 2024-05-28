const {o, $p, kp, km, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const sharedStat = require('../ctrl/stat-shared');
const viewStat = require('../ctrl/stat-view');
const indexStat = require('../ctrl/stat-index');

const db = require('../service/db');
const stocknet = require('../service/stock-network-data');

const NavIconButton = require('./nav-icon-button');
const TabView = require('./tab-view');
const TabIndex = require('./tab-index');
const TabSearch = require('./tab-search');
const TabSettings = require('./tab-settings');

function App() {
   const dom = o('div');
   const menubar = o('div');
   const appbar = o('div');
   const statusbar = o('div');
   const navbar = o('div');
   const viewdiv = o('div');
   const view = o('div');

   const navButtons = [
      new NavIconButton('af-chart.svg', 'View'),
      new NavIconButton('af-tags.svg', 'Index'),
      new NavIconButton('af-dollar-search.svg', 'Search'),
      new NavIconButton('af-gear.svg', 'Settings'),
   ];
   navButtons[0].tab = 'view';
   navButtons[1].tab = 'index';
   navButtons[2].tab = 'search';
   navButtons[3].tab = 'settings';
   const tabView = new TabView();
   const tabIndex = new TabIndex();
   const tabSearch = new TabSearch();
   const tabSettings = new TabSettings();
   navButtons[0].tabU = tabView;
   navButtons[1].tabU = tabIndex;
   navButtons[2].tabU = tabSearch;
   navButtons[3].tabU = tabSettings;
   navButtons.forEach(function (z) {
      $p(navbar, z.dom);
      kp(z.tabU.dom, 'hide');
      $p(view, z.tabU.dom);
   });

   let div;
   kp(dom, 's-app');
   kp(menubar, 's-menu-bar');
   kp(appbar, 's-app-bar');
   kp(statusbar, 's-status-bar');
   kp(navbar, 's-nav-bar');
   kp(viewdiv, 's-view');
   kp(view, 's-view-inner');
   $p(viewdiv, view);
   $p(appbar, navbar);
   $p(appbar, viewdiv);

   $p(dom, menubar);
   $p(dom, appbar);
   $p(dom, statusbar);
   $p(document.body, dom);
   this.dom = dom;
   this.ui = {
      menu: menubar,
      status: statusbar,
      nav: navbar,
      navButtons: navButtons,
      view: view,
      tabs: {
         view: tabView,
         index: tabIndex,
         search: tabSearch,
         settings: tabSettings
      }
   };
   this.defer = {};
   this.init();
}
App.prototype = {
   init: function () {
      this.defer.onNavClick = this.ui.navButtons.map(function (navButton) {
         return genOnNavClick(navButton);
      });
      this.defer.onSwitchTab = onSwitchTab.bind(this);
      for (let i = 0, n = this.ui.navButtons.length; i < n; i++) {
         on(this.ui.navButtons[i].dom, 'click', this.defer.onNavClick[i]);
      }
      eb.on('network.fetch.stock-all', onFetchAllStock);
      eb.on('network.fetch.stock-one', onFetchOneStock);
      eb.on('switch-tab', this.defer.onSwitchTab);

      initStat().then(function () {
         // by default, go to view tab
         eb.emit('switch-tab', 'view');
         eb.emit('render.view-list', viewStat.list);
         eb.emit('render.index-list', indexStat.list);
      });
   },
   dispose: function () {
      for (let i = 0, n = navButtons.length; i < n; i++) {
         off(navButtons[i].dom, 'click', this.defer.onNavClick[i]);
      }
      eb.off('network.fetch.stock-all', onFetchAllStock);
      eb.off('network.fetch.stock-one', onFetchOneStock);
      eb.off('switch-tab', this.defer.onSwitchTab);
   },
};

function genOnNavClick(navButton) {
   return function () {
      eb.emit('switch-tab', navButton.tab);
   };
}

async function initStat() {
   const config = (await db.get('stock.view.config')) || {};
   viewStat.filter = Object.assign(viewStat.filter, config.filter);
   viewStat.view = Object.assign(viewStat.view, config.view);
   const list = (await db.get('stock.list')) || [];
   const fav = (await db.get('stock.list.fav')) || [];
   list.forEach(function (z) {
      if (fav[z.code]) z.fav = true; else z.fav = false;
   })
   viewStat.list = list;
}


function onSwitchTab(tab) {
   if (sharedStat.tab === tab) return;
   this.ui.navButtons.forEach(function (z) {
      km(z.dom, 'active');
      kp(z.tabU.dom, 'hide');
   });
   let navButton;
   switch(tab) {
   case 'view': navButton = this.ui.navButtons[0]; break;
   case 'index': navButton = this.ui.navButtons[1]; break;
   case 'search': navButton = this.ui.navButtons[2]; break;
   case 'settings': navButton = this.ui.navButtons[3]; break;
   default: tab = 'view'; navButton = this.ui.navButtons[0];
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
      const prev = (await db.get(`stock.data.${item.code}`) || []);
      p = stocknet.tencent.getHistory(item.code, prev && prev.length > 0 ? new Date(prev[prev.length-1].T) : null);
      viewStat.network[item.code] = p;
      origin = true;
   }
   const r = await p;
   if (origin) delete viewStat.network[item.code];

   const itemHistory = {
      code: item.code,
      name: item.name,
      data: (await db.get(`stock.data.${item.code}`)) || []
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
   await db.set(`stock.data.${item.code}`, itemHistory.data);

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
      await db.set('stock.list', viewStat.list);
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


module.exports = App;
