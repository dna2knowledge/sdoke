# sdoke
cordova to build stock data analysis and visualization application for desktop and mobile

### Build

```
npm install
# build electron native op native.js
webpack

# build electron UI into www
cd src
npm install
npm run build

# ensure in electron, classic level db can work
cp -r node_modules/classic-level/prebuilds platforms/electron/platform_www/prebuilds

# test in electron
cordova run electron
# test in web browser
cd src && npm run dev
```
