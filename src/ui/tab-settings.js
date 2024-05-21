const { o } = require('./dom');

function TabSettings() {
   const dom = o('div');
   dom.textContent = 'TabSettings';
   this.dom = dom;
}

module.exports = TabSettings;
