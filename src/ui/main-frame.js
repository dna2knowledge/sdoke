const {o, $p, kp} = require('./dom');

function App() {
   const dom = o('div');
   const menubar = o('div');
   const appbar = o('div');
   const statusbar = o('div');
   const navbar = o('div');
   const viewdiv = o('div');
   const view = o('div');
   let div;
   kp(dom, 's-app');
   kp(menubar, 's-menu-bar');
   kp(appbar, 's-app-bar');
   kp(statusbar, 's-status-bar');
   kp(navbar, 's-nav-bar');
   kp(viewdiv, 's-view');
   kp(view, 's-view-inner');
   $p(viewdiv, view);
   $p(appbar, navbar);
   $p(appbar, viewdiv);
   $p(dom, menubar);
   $p(dom, appbar);
   $p(dom, statusbar);
   this.dom = dom;
   this.ui = {
      menu: menubar,
      status: statusbar,
      nav: navbar,
      view: view
   };
}

module.exports = App;
