const sp = {
   x: 0.015
};

export default function wr(vals, win) {
   const r = [];
   const n = vals.length;
   if (n < win || win < 1) return r;
   const wm1 = win - 1;
   for (let i = n-1; i >= wm1 && i-win >= 0; i--) {
      const dr = vals.slice(i-win, i+1);
      let min = Infinity, max = -Infinity;
      dr.forEach(z => {
         if (z < min) min = z;
         if (z > max) max = z;
      });
      if (min === max) {
         r.push(50);
      } else {
         r.push(100 - (vals[i] - min) / (max - min) * 100);
      }
   }
   return r;
}