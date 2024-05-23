const { o, $p, $m, k_, kp, km, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const NavIconButton = require('./nav-icon-button');
const ViewListItem = require('./view-list-item');
const stat = require('../ctrl/stat-view');

function ViewList() {
   const dom = o('div');
   const bar = o('div');
   const list = o('div');
   const refresh = new NavIconButton('af-rotate.svg', 'Refresh');
   const bjswitch = new NavIconButton('af-city.svg', 'Beijing');
   const shswitch = new NavIconButton('af-city.svg', 'Shanghai');
   const szswitch = new NavIconButton('af-city.svg', 'Shenzhen');
   const primaryswitch = new NavIconButton('af-city.svg', 'Primary');
   const favswitch = new NavIconButton('af-star.svg', 'Favorite');
   kp(bar, 's-flex');
   kp(list, 's-scrollable');
   kp(bjswitch.dom, 'active');
   kp(shswitch.dom, 'active');
   kp(szswitch.dom, 'active');
   kp(primaryswitch.dom, 'active');
   kp(dom, 's-flex');
   kp(dom, 'col');
   kp(dom, 's-full-h');
   $p(bar, refresh.dom);
   $p(bar, bjswitch.dom);
   $p(bar, shswitch.dom);
   $p(bar, szswitch.dom);
   $p(bar, primaryswitch.dom);
   $p(bar, favswitch.dom);
   $p(dom, bar);
   $p(dom, list);
   this.dom = dom;
   this.ui = {
      bar: {
         refresh: refresh,
         bj: bjswitch,
         sh: shswitch,
         sz: szswitch,
         primary: primaryswitch,
         fav: favswitch,
      },
      list: list,
      items: [],
   };
   this.defer = {};
   this.filtered = [];

   this.init();
}
ViewList.prototype = {
   init: function () {
      this.defer.onRenderViewList = onRenderViewList.bind(this);
      this.defer.onUpdateItemData = onUpdateItemData.bind(this);
      eb.on('render.view-list', this.defer.onRenderViewList);
      eb.on('update.stock-item', this.defer.onUpdateItemData);

      this.defer.onFilterClick = {};
      this.defer.onFilterClick.bj = genOnFilterSwitchChange(this, 'bj');
      this.defer.onFilterClick.bj = genOnFilterSwitchChange(this, 'bj');
      this.defer.onFilterClick.sh = genOnFilterSwitchChange(this, 'sh');
      this.defer.onFilterClick.sz = genOnFilterSwitchChange(this, 'sz');
      this.defer.onFilterClick.primary = genOnFilterSwitchChange(this, 'primary');
      this.defer.onFilterClick.fav = genOnFilterSwitchChange(this, 'fav');
      this.defer.onRefreshClick = onRefreshClick.bind(this);
      on(this.ui.bar.bj.dom, 'click', this.defer.onFilterClick.bj);
      on(this.ui.bar.sh.dom, 'click', this.defer.onFilterClick.sh);
      on(this.ui.bar.sz.dom, 'click', this.defer.onFilterClick.sz);
      on(this.ui.bar.primary.dom, 'click', this.defer.onFilterClick.primary);
      on(this.ui.bar.fav.dom, 'click', this.defer.onFilterClick.fav);
   },
   dispose: function () {
      eb.off('render.view-list', this.defer.onRenderViewList);
      off(this.ui.bar.bj.dom, 'click', this.defer.onFilterClick.bj);
      off(this.ui.bar.sh.dom, 'click', this.defer.onFilterClick.sh);
      off(this.ui.bar.sz.dom, 'click', this.defer.onFilterClick.sz);
      off(this.ui.bar.primary.dom, 'click', this.defer.onFilterClick.primary);
      off(this.ui.bar.fav.dom, 'click', this.defer.onFilterClick.fav);
   },
   buildList: function () {
      this.ui.items.forEach(function (z) {
         z.dispose();
      });
      // TODO: work with filters
      this.filtered = stat.list.slice();
      this.ui.items.splice(0, this.ui.items.length);
      for (let i = 0, n = this.filtered.length; i < n; i++) {
         const item = this.filtered[i];
         const itemui = new ViewListItem(item);
         this.ui.items.push(itemui);
         $p(this.ui.list, itemui.dom);
      }
   }
};

function onRenderViewList() {
   const keys = Object.keys(this.ui.bar);
   for (let i = 0, n = keys.length; i < n; i++) {
      const key = keys[i];
      const val = stat.filter[key];
      if (val === undefined) continue;
      const target = this.ui.bar[key];
      if (val && !k_(target.dom, 'active')) {
         kp(target.dom, 'active');
      } else if (!val && k_(target.dom, 'active')) {
         km(target.dom, 'active');
      }
   }
   if (!stat.dirty) return;
   this.buildList();
   stat.dirty = false;
}
function genOnFilterSwitchChange(self, key) {
   return (function () {
      stat.filter[key] = !stat.filter[key];
      const target = this.ui.bar[key];
      if (!target) return;
      stat.dirty = true;
      // TODO: persist filter config data
      eb.emit('render.view-list');
   }).bind(self);
}
function onUpdateItemData(item) {
   if (!item) return;
   const m = this.ui.items.find(function (z) { return z.data.code === item.code; });
   if (!m) return;
   m.data = Object.assign(m.data || {}, item);
   m.update();
}
function onRefreshClick() {
   eb.emit('network.fetch.stock-all', stat.list);
}

module.exports = ViewList;
