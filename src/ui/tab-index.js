const { o } = require('./dom');

function TabIndex() {
   const dom = o('div');
   dom.textContent = 'TabIndex';
   this.dom = dom;
}

module.exports = TabIndex;
