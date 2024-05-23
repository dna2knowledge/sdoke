const { o, $p, kp } = require('./dom');

function NavIconButton(icon, name) {
   const dom = o('div');
   const img = o('img');
   const title = o('div');
   img.src = `./img/${icon}`;
   title.textContent = name;
   kp(dom, 'nav-icon-button');
   $p(dom, img);
   $p(dom, title);
   this.dom = dom;
}

module.exports = NavIconButton;
