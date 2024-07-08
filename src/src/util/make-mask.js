function o(tag) { return document.createElement(tag); }
function s(elem, k, v) { elem.style[k] = v; }

export default function makeMask(opt) {
   opt = opt || {};
   const div = o('div');
   s(div, 'position', 'fixed');
   s(div, 'zIndex', '9000');
   s(div, 'top', '0');
   s(div, 'left', '0');
   s(div, 'width', '100vw');
   s(div, 'height', '100vh');
   if (opt.loading) {
      s(div, 'opacity', '0.5');
      s(div, 'backgroundColor', 'white');
   }
   return div;
}