const stat = {
   // - read list from db, filtered as list
   // - click one in the list displayed, read one data from db, populated to data
   // - read index settings, calc index
   // - draw data and index in canvas
   list: [],
   one: {
      code: null,
      data: null
   },
   // { name: 'group', type: 'rsi', params: [{ window: 6 }, ...], data: [[...], ...] }
   index: [],
   // fetch data from internet
   network: {},
   filter: {
      bj: true,
      sh: true,
      sz: true,
      primary: false,
      fav: false
   },
   view: {
      unit: 'd', // d = day, w = week, m = month
   },
   prevUri: null,
   uri: '',
   dirty: true,
};

module.exports = stat;
