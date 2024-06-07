export function once(obj, name, fn) {
   obj.addEventListener(name, onceWrapper);
   function onceWrapper(evt) {
      obj.removeEventListener(name, onceWrapper);
      fn && fn(evt);
   }
}

export function multipleOnce(obj, events) {
   const hooks = [];
   events.forEach(item => {
      const genFn = onceWrapperGen(item.name, item.fn);
      obj.addEventListener(item.name, genFn);
   });

   function onceWrapperGen(name, fn) {
      return (evt) => {
         hooks.forEach((genFn, i) => {
            obj.removeEventListener(events[i].name, genFn);
         });
         fn && fn(evt);
      }
   }
}
