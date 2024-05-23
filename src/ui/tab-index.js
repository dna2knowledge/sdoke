const { o, kp } = require('./dom');

function TabIndex() {
   const dom = o('div');
   dom.textContent = 'TabIndex';
   kp(dom, 's-tab');
   this.dom = dom;
}

module.exports = TabIndex;
