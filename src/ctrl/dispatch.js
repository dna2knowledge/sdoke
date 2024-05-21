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
      ui.navButtons.forEach(function (z) {
         km(z.dom, 'active');
         kp(z.tabU.dom, 'hide');
      });
      let navButton;
      switch(tab) {
      case 'view': navButton = ui.navButtons[0]; break;
      case 'index': navButton = ui.navButtons[1]; break;
      case 'search': navButton = ui.navButtons[2]; break;
      case 'settings': navButton = ui.navButtons[3]; break;
      default: tab = 'view'; navButton = ui.navButtons[0];
      }
      kp(navButton.dom, 'active');
      km(navButton.tabU.dom, 'hide');
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
