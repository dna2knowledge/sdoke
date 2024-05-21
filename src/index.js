/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    //document.getElementById('deviceready').classList.add('ready');
    window.sdokeStart();
}

(function () {
   const dom = require('./ui/dom');
   const dp = require('./ctrl/dispatch');
   const App = require('./ui/main-frame');
   const NavIconButton = require('./ui/nav-icon-button');
   const TabView = require('./ui/tab-view');
   const TabIndex = require('./ui/tab-index');
   const TabSearch = require('./ui/tab-search');
   const TabSettings = require('./ui/tab-settings');

   function sdokeStart() {
      while (document.body.children.length) {
         const c = document.body.children[0];
         if (c.tagName === 'SCRIPT') break;
         dom.$m(document.body, c);
      }
      const app = new App();
      dom.$p(document.body, app.dom);
      const navButtons = [
         new NavIconButton('af-chart.svg', 'View'),
         new NavIconButton('af-tags.svg', 'Index'),
         new NavIconButton('af-dollar-search.svg', 'Search'),
         new NavIconButton('af-gear.svg', 'Settings'),
      ];
      navButtons[0].tab = 'view';
      navButtons[1].tab = 'index';
      navButtons[2].tab = 'search';
      navButtons[3].tab = 'settings';
      const tabView = new TabView();
      const tabIndex = new TabIndex();
      const tabSearch = new TabSearch();
      const tabSettings = new TabSettings();
      navButtons[0].tabU = tabView;
      navButtons[1].tabU = tabIndex;
      navButtons[2].tabU = tabSearch;
      navButtons[3].tabU = tabSettings;
      navButtons.forEach(function (z) {
         dom.$p(app.ui.nav, z.dom);
         dom.kp(z.tabU.dom, 'hide');
         dom.$p(app.ui.view, z.tabU.dom);
      });

      const ui = {
         app,
         navButtons,
      };
      dp.init(ui);
   }

   window.sdokeStart = sdokeStart;
})();
