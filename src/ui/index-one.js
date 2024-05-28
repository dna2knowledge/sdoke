const { o, kp, km, $p, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const NavIconButton = require('./nav-icon-button');
const IndexListItem = require('./index-list-item');
const stat = require('../ctrl/stat-index');

const db = require('../service/db');

function IndexOne() {
   const dom = o('div');
   const bar = o('div');
   const back = new NavIconButton('af-arrow-left.svg', 'Back');
   const refresh = new NavIconButton('af-rotate.svg', 'Refresh');
   const overview = new IndexListItem({ name: '', desc: '' });
   kp(bar, 's-flex');
   $p(bar, back.dom);
   $p(bar, refresh.dom);
   $p(dom, bar);
   $p(dom, overview.dom);
   this.dom = dom;
   this.ui = {
      bar: {
         back: back,
         refresh: refresh
      },
      overview: overview
   };
   this.defer = {};
   this.init();
}

IndexOne.prototype = {
   init: function () {
      this.defer.onBackClick = onBackClick.bind(this);
      this.defer.onRefreshClick = onRefreshClick.bind(this);
      this.defer.onRender = onRender.bind(this);
      eb.on('render.index-one', this.defer.onRender);
      on(this.ui.bar.back.dom, 'click', this.defer.onBackClick);
      on(this.ui.bar.refresh.dom, 'click', this.defer.onRefreshClick);
   },
   dispose: function () {
      eb.off('render.index-one', this.defer.onRender);
      off(this.ui.bar.back.dom, 'click', this.defer.onBackClick);
      off(this.ui.bar.refresh.dom, 'click', this.defer.onRefreshClick);
   }
};

function onBackClick() {
   if (stat.prevTab) {
      const targetTab = stat.prevTab;
      stat.prevTab = null;
      eb.emit(`tab.show.${targetTab}`);
   } else {
      stat.uri = '';
      eb.emit('tab.show.index');
   }
}

function onRefreshClick() {
}

async function onRender(item) {
}

module.exports = IndexOne;
