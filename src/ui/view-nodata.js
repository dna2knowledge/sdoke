const { o, $p, kp } = require('./dom');

function ViewNoData() {
   const dom = o('div');
   const label = o('div');
   const btn = o('div');
   const btnIcon = o('img');
   const btnLabel = o('div');
   label.textContent = 'No Data';
   btnLabel.textContent = 'Getting Start ...';
   btnIcon.src = './img/af-flag-blue.svg';
   $p(btn, btnIcon);
   $p(btn, btnLabel);
   kp(dom, 's-tab-view-nodata');
   kp(label, 's-gray');
   kp(btn, 'nodata-icon-button');
   $p(dom, label);
   $p(dom, btn);
   this.dom = dom;
}

module.exports = ViewNoData;
