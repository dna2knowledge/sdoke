const { o, kp, km, $p, $m, $c, t, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const stat = require('../ctrl/stat-index');

const db = require('../service/db');

function IndexListItem(item) {
   this.data = item;
   const dom = o('div');
   const remove = o('button');
   const name = o('div');
   const desc = o('div');
   const test = o('div');
   kp(remove, 's-remove');
   name.textContent = item.name;
   desc.textContent = item.desc;
   kp(name, 's-text');
   kp(desc, 's-code');
   kp(test, 's-flex');
   kp(test, 's-list-item-overview-data');
   if (item.test) {
   }
   kp(dom, 's-list-item');
   kp(dom, 's-flex');
   $p(dom, remove);
   $p(dom, name);
   $p(dom, desc);
   $p(dom, test);
   this.dom = dom;
   this.ui = {
      name: name,
      desc: desc,
      remove: remove,
      test: test
   };
   this.defer = {};
   this.init();
}
IndexListItem.prototype = {
   update: function () {
   },
   init: function () {
      this.defer.onClick = onClick.bind(this);
      this.defer.onRemoveClick = onRemoveClick.bind(this);
      on(this.ui.name, 'click', this.defer.onClick);
      on(this.ui.remove, 'click', this.defer.onRemoveClick);
   },
   dispose: function () {
      off(this.ui.name, 'click', this.defer.onClick);
      off(this.ui.remove, 'click', this.defer.onRemoveClick);
      if (this.dom.parentNode) $m(this.dom.parentNode, this.dom);
   }
};

function onClick() {
   const uri = this.data.name;
   if (stat.uri === uri) return;
   stat.uri = uri;
   eb.emit('render.index-one', this.data);
   eb.emit('tab.show.index');
}

async function onRemoveClick() {
}

module.exports = IndexListItem;
