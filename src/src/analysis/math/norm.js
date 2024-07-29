export default function norm(list, min, max) {
   if (!list || !list.length) return list;
   min = min === undefined ? Math.min(...list) : min;
   max = max === undefined ? Math.max(...list) : max;
   const dm = max - min;
   if (dm === 0) {
      return list.map(_ => 1.0);
   } else {
      return list.map(z => (z - min) / dm);
   }
}