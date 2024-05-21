function once(obj, name, fn) {
   obj.addEventListener(name, onceWrapper);
   function onceWrapper(evt) {
      obj.removeEventListener(name, onceWrapper);
      fn && fn(evt);
   }
}

function multipleOnce(obj, events) {
   const hooks = [];
   events.forEach(function (item) {
      const genFn = onceWrapperGen(item.name, item.fn);
      obj.addEventListener(item.name, genFn);
   });

   function onceWrapperGen(name, fn) {
      return function (evt) {
         hooks.forEach(function (genFn, i) {
            obj.removeEventListener(events[i].name, genFn);
         });
         fn && fn(evt);
      }
   }
}

module.exports = {
   once,
   multipleOnce,
};
