const { o } = require('./dom');

function TabView() {
   const dom = o('div');
   dom.textContent = 'TabView';
   this.dom = dom;
}

module.exports = TabView;
