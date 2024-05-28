const { o, $p, $m, k_, kp, km, on, off } = require('./dom');
const { once, multipleOnce } = require('../util/event-once');
const eb = require('../ctrl/eventbus');
const NavIconButton = require('./nav-icon-button');
const IndexListItem = require('./index-list-item');
const stat = require('../ctrl/stat-index');

const db = require('../service/db');

function IndexList() {
   const dom = o('div');
   const bar = o('div');
   const list = o('div');
   const nodata = o('div');
   const refresh = new NavIconButton('af-circle-plus.svg', 'Add');
   nodata.textContent = 'No index items.';
   kp(bar, 's-flex');
   kp(list, 's-scrollable');
   kp(nodata, 's-text-center');
   kp(nodata, 'hide');
   kp(dom, 's-flex');
   kp(dom, 'col');
   kp(dom, 's-full-h');
   $p(bar, refresh.dom);
   $p(list, nodata);
   $p(dom, bar);
   $p(dom, list);
   this.dom = dom;
   this.ui = {
      bar: {
         refresh: refresh
      },
      nodata: nodata,
      list: list,
      items: [],
   };
   this.defer = {};
   this.filtered = [];

   this.init();
}
IndexList.prototype = {
   init: function () {
      this.defer.onRenderIndexList = onRenderIndexList.bind(this);
      this.defer.onUpdateItemData = onUpdateItemData.bind(this);
      eb.on('render.index-list', this.defer.onRenderIndexList);
      eb.on('update.index-item', this.defer.onUpdateItemData);

      this.defer.onRefreshClick = onRefreshClick.bind(this);
      on(this.ui.bar.refresh.dom, 'click', this.defer.onRefreshClick);
   },
   dispose: function () {
      eb.off('render.index-list', this.defer.onRenderIndexList);
      eb.off('update.index-item', this.defer.onUpdateItemList);
      off(this.ui.bar.refresh.dom, 'click', this.defer.onRefreshClick);
   },
   buildList: async function () {
      this.ui.items.forEach(function (z) {
         z.dispose();
      });
      this.ui.items.splice(0, this.ui.items.length);

      this.filtered = stat.list.slice();

      if (this.filtered.length) {
         kp(this.ui.nodata, 'hide');
         for (let i = 0, n = this.filtered.length; i < n; i++) {
            const item = this.filtered[i];
            const itemui = new IndexListItem(item);
            this.ui.items.push(itemui);
            $p(this.ui.list, itemui.dom);
         }
      } else {
         km(this.ui.nodata, 'hide');
      }
   }
};

async function onRenderIndexList() {
   if (!stat.dirty) return;
   await this.buildList();
   stat.dirty = false;
}

function onUpdateItemData(item) {
}
function onRefreshClick() {
}

module.exports = IndexList;
