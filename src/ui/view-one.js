const { o, kp, $p, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const NavIconButton = require('./nav-icon-button');
const stat = require('../ctrl/stat-view');

function ViewOne() {
   const dom = o('div');
   const bar = o('div');
   const back = new NavIconButton('af-arrow-left.svg', 'Back');
   const refresh = new NavIconButton('af-rotate.svg', 'Refresh');
   kp(bar, 's-flex');
   $p(bar, back.dom);
   $p(bar, refresh.dom);
   $p(dom, bar);
   this.dom = dom;
   this.ui = {
      bar: {
         back: back,
         refresh: refresh
      }
   };
   this.defer = {};
   this.init();
}

ViewOne.prototype = {
   init: function () {
      this.defer.onBackClick = onBackClick.bind(this);
      this.defer.onUpdate = onUpdate.bind(this);
      this.defer.onRender = onRender.bind(this);
      eb.on('update.stock-chart', this.defer.onUpdate);
      eb.on('render.view-one', this.defer.onRender);
      on(this.ui.bar.back.dom, 'click', this.defer.onBackClick);
   },
   dispose: function () {
      eb.off('update.stock-chart', this.defer.onUpdate);
      eb.off('render.view-one', this.defer.onRender);
      off(this.ui.bar.back.dom, 'click', this.defer.onBackClick);
   }
};

function onBackClick() {
   if (stat.prevTab) {
      const targetTab = stat.prevTab;
      stat.prevTab = null;
      eb.emit(`tab.show.${targetTab}`);
   } else {
      stat.uri = '';
      eb.emit('tab.show.view');
   }
}

async function onUpdate(item) {
   // { code, name, data }
   if (item.code !== stat.one.code) return;
   // TODO: calc index + draw charts
}

async function onRender(item) {
   // { code, name, latest }
   if (item.code === stat.one.code) return;
   stat.one.code = item.code;
   const historyItem = {
      code: item.code,
      name: item.name,
      data: stat.one.data
   };
   if (!stat.one.data) {
      // TODO: read from db
      // if has data, eb.emit('update.stock-chart', historyItem);
      eb.emit('network.fetch.stock-one', item);
      return;
   }
   onUpdate(historyItem);
}

module.exports = ViewOne;
