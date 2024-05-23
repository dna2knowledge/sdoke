const { o, kp } = require('./dom');

function TabSettings() {
   const dom = o('div');
   dom.textContent = 'TabSettings';
   kp(dom, 's-tab');
   this.dom = dom;
}

module.exports = TabSettings;
