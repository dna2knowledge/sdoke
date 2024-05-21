const { o } = require('./dom');

function TabSearch() {
   const dom = o('div');
   dom.textContent = 'TabSearch';
   this.dom = dom;
}

module.exports = TabSearch;
