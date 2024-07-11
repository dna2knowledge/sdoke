export default function norm(list) {
   if (!list || !list.length) return list;
   const max = Math.max(...list);
   const min = Math.min(...list);
   const dm = max - min;
   if (dm === 0) {
      return list.map(_ => 1.0);
   } else {
      return list.map(z => (z - min) / dm);
   }
}