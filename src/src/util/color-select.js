export default function selectColor(elem, color) {
   return new Promise(r => {
      if (!elem) elem = document.body;
      const env = { color };
      const box = elem.getBoundingClientRect();
      const div = document.createElement('div');
      div.style.position = 'fixed';
      div.style.top = '0';
      div.style.left = '0';
      div.style.width = '100vw';
      div.style.height = '100vh';
      div.style.zIndex = '9000';
      div.style.backgroundColor = 'white';
      div.style.opacity = '0.5';
      const input = document.createElement('input');
      input.type = 'color';
      input.style.display = 'block';
      input.style.opacity = '0';
      input.style.position = 'fixed';
      input.style.left = `${box.left}px`;
      input.style.top = `${box.top}px`;
      if (color) input.value = color;
      document.body.appendChild(div);
      document.body.appendChild(input);

      input.addEventListener('input', onChange);
      input.addEventListener('change', onChange);
      input.addEventListener('keydown', onKeypress);
      div.addEventListener('click', onClose);
      input.focus();
      input.click();

      function onChange(evt) {
         env.color = evt.target.value;
      }
      function onKeypress(evt) {
         if (evt.key !== 'Escape') return;
         env.color = null;
         onClose(evt);
      }
      function onClose(evt) {
         input.removeEventListener('input', onChange);
         input.removeEventListener('change', onChange);
         div.removeEventListener('click', onClose);
         input.removeEventListener('keydown', onKeypress);
         document.body.removeChild(div);
         document.body.removeChild(input);
         r(env.color);
      }
   });
}