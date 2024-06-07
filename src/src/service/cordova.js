import { multipleOnce } from "$/util/event-once";

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

export default function initCordova() {
   return inject('./cordova.js');
}
