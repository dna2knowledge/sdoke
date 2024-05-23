const { o, kp } = require('./dom');

function TabSearch() {
   const dom = o('div');
   dom.textContent = 'TabSearch';
   kp(dom, 's-tab');
   this.dom = dom;
}

module.exports = TabSearch;
