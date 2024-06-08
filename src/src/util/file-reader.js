import { once, multipleOnce } from '$/util/event-once';

export function triggerFileSelect() {
   return new Promise((r) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.visibility = 'hidden';
      multipleOnce(input, [{
         name: 'change', fn: async function (evt) {
            const file = evt.target.files[0];
            readText(file).then(r);
         }
      }, {
         name: 'cancel', fn: function (evt) {
            r(null);
         }
      }]);
      input.click();
   });
}

export function readText(file) {
   return new Promise((r) => {
      const reader = new FileReader();
      once(reader, 'load', (evt) => {
         r(evt.target.result);
      });
      reader.readAsText(file);
   });
}