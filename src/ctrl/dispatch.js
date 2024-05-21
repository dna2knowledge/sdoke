const eb = require('./eventbus');
const { kp, km, on, off } = require('../ui/dom');
const sharedStat = require('./stat-shared');

function initEvents(ui) {
   ui.navButtons.forEach(function (navButton, i) {
      on(navButton.dom, 'click', function () { eb.emit('switch-tab', navButton.tab); });
   });
}

function initStat() {
}

function initDispatcher(ui) {
   eb.on('switch-tab', function (tab) {
      if (sharedStat.tab === tab) return;
      ui.navButtons.forEach(function (z) { km(z.dom, 'active'); });
      switch(tab) {
      case 'view': kp(ui.navButtons[0].dom, 'active'); break;
      case 'index': kp(ui.navButtons[1].dom, 'active'); break;
      case 'search': kp(ui.navButtons[2].dom, 'active'); break;
      case 'settings': kp(ui.navButtons[3].dom, 'active'); break;
      default: tab = 'view'; kp(ui.navButtons[0].dom, 'active');
      }
      sharedStat.tab.active = tab;
   });
}

function init(ui) {
   initStat();
   initDispatcher(ui);
   initEvents(ui);

   // by default, go to view tab
   eb.emit('switch-tab', 'view');
}

module.exports = {
   init,
};
