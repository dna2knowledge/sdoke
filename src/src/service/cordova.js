import { once, multipleOnce } from "$/util/event-once";
import makePromise from '$/util/make-promise';

export const stat = {
   init: makePromise(),
};

export function inject(url) {
  return new Promise((resolve, reject) => {
    const script = window.document.createElement("script");
    if (!script || !url) {
      resolve(null);
      return;
    }
    script.src = url;
    script.async = true;
    multipleOnce(script, [{
       name: 'load',
       fn: eventScriptLoaded,
    }, {
       name: 'error',
       fn: eventScriptError,
    }]);
    window.document.body.appendChild(script);

    function eventScriptLoaded() {
      resolve(script);
    }

    function eventScriptError() {
      reject(new Error(`LOAD ANALYTICS SCRIPT ERROR: ${url}`));
    }
  });
}

export default async function initCordova() {
   try {
      await inject('./cordova.js');
      if (typeof(cordova) === 'undefined') throw new Error('failed to load cordova');
      once(document, 'deviceready', () => {
         stat.init.r();
      });
   } catch (_) {
      stat.init.e(_);
   }
}
