const { o, kp } = require('./dom');

function TabCalendar() {
   const dom = o('div');
   dom.textContent = 'TabCalendar';
   kp(dom, 's-tab');
   this.dom = dom;
}

module.exports = TabCalendar;
