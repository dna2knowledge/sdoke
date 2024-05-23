const { o } = require('./dom');
function SearchStep() {
   const dom = o('div');
   dom.textContent = 'search one step with current conditions (index)';
   this.dom = dom;
}

module.exports = SearchStep;
