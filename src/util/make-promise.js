module.exports = function makePromise() {
   const obj = {};
   obj.promise = new Promise(function (r, e) {
      obj.r = r;
      obj.e = e;
   });
   return obj;
}
