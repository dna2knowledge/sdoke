const { o, $p, $m, k_, kp, km, on, off } = require('./dom');
const { once, multipleOnce } = require('../util/event-once');
const eb = require('../ctrl/eventbus');
const NavIconButton = require('./nav-icon-button');
const ViewListItem = require('./view-list-item');
const stat = require('../ctrl/stat-view');

const db = require('../service/db');

function ViewList() {
   const dom = o('div');
   const bar = o('div');
   const list = o('div');
   const nodata = o('div');
   const refresh = new NavIconButton('af-rotate.svg', 'Refresh');
   const bjswitch = new NavIconButton('af-city.svg', 'Beijing');
   const shswitch = new NavIconButton('af-city.svg', 'Shanghai');
   const szswitch = new NavIconButton('af-city.svg', 'Shenzhen');
   const primaryswitch = new NavIconButton('af-city.svg', 'Primary');
   const favswitch = new NavIconButton('af-star.svg', 'Favorite');
   const testswitch = new NavIconButton('af-mglass-chart.svg', '3-9-21');
   const updateList = new NavIconButton('af-pen.svg', 'UpdateList');
   nodata.textContent = 'No matched items.';
   kp(bar, 's-flex');
   kp(list, 's-scrollable');
   kp(nodata, 's-text-center');
   kp(nodata, 'hide');
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
   $p(bar, testswitch.dom);
   $p(bar, updateList.dom);
   $p(list, nodata);
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
         testswitch: testswitch,
         updateList: updateList
      },
      nodata: nodata,
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
      this.defer.onTestSwitchClick = onTestSwitchClick.bind(this);
      this.defer.onRefreshClick = onRefreshClick.bind(this);
      this.defer.onUpdateListClick = onUpdateListClick.bind(this);
      on(this.ui.bar.refresh.dom, 'click', this.defer.onRefreshClick);
      on(this.ui.bar.bj.dom, 'click', this.defer.onFilterClick.bj);
      on(this.ui.bar.sh.dom, 'click', this.defer.onFilterClick.sh);
      on(this.ui.bar.sz.dom, 'click', this.defer.onFilterClick.sz);
      on(this.ui.bar.primary.dom, 'click', this.defer.onFilterClick.primary);
      on(this.ui.bar.fav.dom, 'click', this.defer.onFilterClick.fav);
      on(this.ui.bar.testswitch.dom, 'click', this.defer.onTestSwitchClick);
      on(this.ui.bar.updateList.dom, 'click', this.defer.onUpdateListClick);
   },
   dispose: function () {
      eb.off('render.view-list', this.defer.onRenderViewList);
      off(this.ui.bar.refresh.dom, 'click', this.defer.onRefreshClick);
      off(this.ui.bar.bj.dom, 'click', this.defer.onFilterClick.bj);
      off(this.ui.bar.sh.dom, 'click', this.defer.onFilterClick.sh);
      off(this.ui.bar.sz.dom, 'click', this.defer.onFilterClick.sz);
      off(this.ui.bar.primary.dom, 'click', this.defer.onFilterClick.primary);
      off(this.ui.bar.fav.dom, 'click', this.defer.onFilterClick.fav);
      off(this.ui.bar.testswitch.dom, 'click', this.defer.onTestSwitchClick);
      off(this.ui.bar.updateList.dom, 'click', this.defer.onUpdateListClick);
   },
   buildList: async function () {
      this.ui.items.forEach(function (z) {
         z.dispose();
      });
      this.ui.items.splice(0, this.ui.items.length);

      // TODO: work with filters
      this.filtered = stat.list.slice();
      if (stat.filter.fav) {
         this.filtered = this.filtered.filter(function(z) {
            return z.fav;
         });
      }
      if (stat.filter.primary) {
         this.filtered = this.filtered.filter(function (z) {
            if (z.name.indexOf('ST') >= 0) return false;
            if (z.name.indexOf('XR') >= 0) return false;
            if (z.name.indexOf('XD') >= 0) return false;
            if (z.name.indexOf('DR') >= 0) return false;
            if (z.code.startsWith('sh688')) return false;
            if (z.code.startsWith('sh9')) return false;
            if (z.code.startsWith('sz3')) return false;
            if (z.code.startsWith('sz2')) return false;
            return true;
         });
      }
      if (!stat.filter.bj) {
         this.filtered = this.filtered.filter(function (z) {
            return !z.code.startsWith('bj');
         });
      }
      if (!stat.filter.sh) {
         this.filtered = this.filtered.filter(function (z) {
            return !z.code.startsWith('sh');
         });
      }
      if (!stat.filter.sz) {
         this.filtered = this.filtered.filter(function (z) {
            return !z.code.startsWith('sz');
         });
      }

      if (testenv.on) {
         const fr = [];
         for (let i = 0, n = this.filtered.length; i < n; i++) {
            const item = this.filtered[i];
            const historyData = (await db.get(`stock.data.${item.code}`, await db.getStore())) || [];
            if (historyData.length) {
               if (checkTestItem(historyData, item)) fr.push(item);
            }
         }
         this.filtered = fr;
      }

      if (this.filtered.length) {
         kp(this.ui.nodata, 'hide');
         for (let i = 0, n = this.filtered.length; i < n; i++) {
            const item = this.filtered[i];
            const itemui = new ViewListItem(item);
            this.ui.items.push(itemui);
            $p(this.ui.list, itemui.dom);
         }
      } else {
         km(this.ui.nodata, 'hide');
      }
   }
};

async function onRenderViewList() {
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
   for (let i = 0, n = stat.list.length; i < n; i++) {
      const item = stat.list[i];
      if (item.latest) continue;
      const historyData = (await db.get(`stock.data.${item.code}`, await db.getStore())) || [];
      if (historyData && historyData.length) {
         item.latest = Object.assign({}, historyData[historyData.length-1]);
      }
   }
   await this.buildList();
   stat.dirty = false;
}

const d2w = require('../analysis/transform-week');
function checkTestItem(historyData, item) {
   const wdata = d2w(historyData, 23);
   if (wdata.length < 22) return false;
   let i = wdata.length-1;
   let avg3 = 0, avg3y = 0, avg9 = 0, avg9y = 0, avg21 = 0, avg21y = 0;
   for (let j = 0; j < 3 && i >= 0; i--, j++) {
      avg3 += wdata[i].C;
      avg3y += wdata[i-1].C;
   }
   for (let j = 0; j < 9 - 3 && i >= 0; i--, j++) {
      avg9 += wdata[i].C;
      avg9y += wdata[i-1].C;
   }
   for (let j = 0; j < 21 - 9 && i >= 0; i--, j++) {
      avg21 += wdata[i].C;
      avg21y += wdata[i-1].C;
   }
   avg3 /= 3; avg3y /= 3;
   avg9 /= 9; avg9y /= 9;
   avg21 /= 21; avg21y /= 21;
   if (avg3y < avg9y && avg3 >= avg9) {
      return true;
   } else if (avg3y < avg21y && avg3 >= avg21) {
      return true;
   }
   return false;
}

function genOnFilterSwitchChange(self, key) {
   return (async function () {
      stat.filter[key] = !stat.filter[key];
      const target = this.ui.bar[key];
      if (!target) return;
      stat.dirty = true;
      const config = (await db.get('stock.view.config', await db.getStore())) || {};
      if (!config.filter) config.filter = {};
      config.filter = Object.assign(config.filter, stat.filter);
      await db.set('stock.view.config', config, await db.getStore());
      eb.emit('render.view-list');
   }).bind(self);
}
function onUpdateItemData(item) {
   if (!item) return;
   const m0 = stat.list.find(function (z) { return z.code === item.code; });
   if (!m0) return;
   Object.assign(m0, item);
   const m = this.ui.items.find(function (z) { return z.data.code === item.code; });
   if (!m) return;
   m.data = Object.assign(m.data || {}, item);
   m.update();
}
function onRefreshClick() {
   eb.emit('network.fetch.stock-all', stat.list);
}
const testenv = { on: false };
async function onTestSwitchClick() {
   testenv.on = !testenv.on;
   if (testenv.on) {
      kp(this.ui.bar.testswitch.dom, 'active');
   } else {
      km(this.ui.bar.testswitch.dom, 'active');
   }
   stat.dirty = true;
   eb.emit('render.view-list');
}

function onUpdateListClick() {
   const file = o('input');
   file.type = 'file';
   file.style.visibility = 'hidden';
   $p(document.body, file);
   multipleOnce(file, [{
      name: 'change', fn: async function (evt) {
         const reader = new FileReader();
         once(reader, 'load', function (readevt) {
            const csv = readevt.target.result.split('\n');
            const list = [];
            csv.forEach(function (line) {
               if (!line) return;
               const parts = line.split(',');
               if (parts.length < 2) return;
               list.push({ code: parts[0], name: parts[1], latest: null });
            });
            stat.list = list;
            updateList();
            cleanup();
         });
         reader.readAsText(evt.target.files[0]);
      }
   }, {
      name: 'cancel', fn: function (evt) {
         cleanup();
      }
   }]);
   file.click();

   function cleanup() {
      $m(document.body, file);
   }

   async function updateList() {
      await db.set(`stock.list`, stat.list.map(function (z) {
         return { name: z.name, code: z.code, latest: z.latest };
      }), await db.getStore());
      eb.emit('loaded.tab-view');
      if (!stat.uri) {
         stat.prevUri = null;
         stat.dirty = true;
         eb.emit('render.view-list');
      }
   }
}

module.exports = ViewList;
