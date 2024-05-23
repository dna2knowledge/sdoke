const stat = {
   // - read list from db, filtered as list
   // - click one in the list displayed, read one data from db, populated to data
   // - read index settings, calc index
   // - draw data and index in canvas
   list: [],
listx: [
   { fav: true, code: 'sh000000', name: 'test', latest: { O: 23.23, C: 34.13, H: 35.3, L: 22.5, V: 23459, m: 1111 } },
   { fav: false, code: 'sh000001', name: 'test2', latest: { O: 53.23, C: 34.13, H: 55.3, L: 22.5, V: 323459, m: 1111 } },
],
   data: [],
   // { name: 'group', type: 'rsi', params: [{ window: 6 }, ...], data: [[...], ...] }
   index: [],
   // fetch data from internet
   network: {},
   filter: {
      bj: true,
      sh: true,
      sz: true,
      primary: false,
      fav: false,
   },
   prevUri: null,
   uri: '',
   dirty: true,
};

module.exports = stat;
