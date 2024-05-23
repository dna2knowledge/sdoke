const { o, kp, km, $p, $m, $c, t, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const stat = require('../ctrl/stat-view');

function ViewListItem(item) {
   this.data = item;
   const dom = o('div');
   const fav = o('button');
   const code = o('div');
   const name = o('div');
   const latest = o('div');
   kp(fav, 's-fav');
   if (item.fav) kp(fav, 'fav-ed');
   code.textContent = item.code;
   name.textContent = item.name;
   kp(code, 's-code');
   kp(name, 's-text');
   kp(latest, 's-flex');
   if (item.latest) {
      const spanL = o('div');
      const spanO = o('div');
      const spanC = o('div');
      const spanH = o('div');
      const spanV = o('div');
      const spanRate = o('div');
      spanL.textContent = item.latest.L.toFixed(2);
      spanO.textContent = item.latest.O.toFixed(2);
      spanC.textContent = item.latest.C.toFixed(2);
      spanH.textContent = item.latest.H.toFixed(2);
      spanV.textContent = item.latest.V.toFixed(0);
      spanRate.textContent = `${(Math.round((item.latest.C - item.latest.O)/item.latest.O*10000)/100).toFixed(2)}%`;
      const kcolor = item.latest.O < item.latest.C ? 'red' : (item.latest.O > item.latest.C ? 'green' : 'gray');
      kp(spanL, 's-number');
      kp(spanO, 's-number');
      kp(spanC, 's-number');
      kp(spanH, 's-number');
      kp(spanV, 's-number');
      kp(spanRate, 's-number-rate');
      kp(spanL, kcolor);
      kp(spanO, kcolor);
      kp(spanC, kcolor);
      kp(spanH, kcolor);
      kp(spanV, 'gray');
      kp(spanRate, kcolor);
      $p(latest, spanL);
      $p(latest, t('['));
      $p(latest, spanO);
      $p(latest, t('|'));
      $p(latest, spanRate);
      $p(latest, t('|'));
      $p(latest, spanC);
      $p(latest, t(']'));
      $p(latest, spanH);
      $p(latest, spanV);
   }
   kp(dom, 's-list-item');
   kp(dom, 's-flex');
   $p(dom, fav);
   $p(dom, code);
   $p(dom, name);
   $p(dom, latest);
   this.dom = dom;
   this.ui = {
      code: code,
      name: name,
      fav: fav,
      latest: latest
   };
   this.defer = {};
   this.init();
}
ViewListItem.prototype = {
   update: function () {
      if (this.data.fav) kp(this.ui.fav, 'fav-ed'); else km(this.ui.fav, 'fav-ed');
      this.ui.code.textContent = this.data.code;
      this.ui.name.textContent = this.data.name;
      if (this.data.latest) {
         $c(this.ui.latest);
         const spanL = o('div');
         const spanO = o('div');
         const spanC = o('div');
         const spanH = o('div');
         const spanV = o('div');
         const spanRate = o('div');
         spanL.textContent = this.data.latest.L.toFixed(2);
         spanO.textContent = this.data.latest.O.toFixed(2);
         spanC.textContent = this.data.latest.C.toFixed(2);
         spanH.textContent = this.data.latest.H.toFixed(2);
         spanV.textContent = this.data.latest.V.toFixed(0);
         spanRate.textContent = `${(Math.round((this.data.latest.C - this.data.latest.O)/this.data.latest.O*10000)/100).toFixed(2)}%`;
         const kcolor = this.data.latest.O < this.data.latest.C ? 'red' : (this.data.latest.O > this.data.latest.C ? 'green' : 'gray');
         kp(spanL, 's-number');
         kp(spanO, 's-number');
         kp(spanC, 's-number');
         kp(spanH, 's-number');
         kp(spanV, 's-number');
         kp(spanRate, 's-number-rate');
         kp(spanL, kcolor);
         kp(spanO, kcolor);
         kp(spanC, kcolor);
         kp(spanH, kcolor);
         kp(spanV, 'gray');
         kp(spanRate, kcolor);
         $p(this.ui.latest, spanL);
         $p(this.ui.latest, t('['));
         $p(this.ui.latest, spanO);
         $p(this.ui.latest, t('|'));
         $p(this.ui.latest, spanRate);
         $p(this.ui.latest, t('|'));
         $p(this.ui.latest, spanC);
         $p(this.ui.latest, t(']'));
         $p(this.ui.latest, spanH);
         $p(this.ui.latest, spanV);
      }
   },
   init: function () {
      this.defer.onClick = onClick.bind(this);
      on(this.ui.code, 'click', this.defer.onClick);
      on(this.ui.name, 'click', this.defer.onClick);
   },
   dispose: function () {
      off(this.ui.code, 'click', this.defer.onClick);
      off(this.ui.name, 'click', this.defer.onClick);
      if (this.dom.parentNode) $m(this.dom.parentNode, this.dom);
   }
};

function onClick() {
   stat.uri = `/${this.data.code}`;
   eb.emit('tab.show.view');
}

module.exports = ViewListItem;
