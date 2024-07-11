export default function shallowDupObjectList(list) {
   if (!list) return [];
   return list.map(z => z && Object.assign({}, z));
}