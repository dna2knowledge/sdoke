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
      on(this.ui.bar.back.dom, 'click', this.defer.onBackClick);
   },
   dispose: function () {
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

module.exports = ViewOne;
