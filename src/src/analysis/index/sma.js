export default function sma(vals, win) {
   const r = [];
   const n = vals.length;
   if (n < win || win < 1) return r;
   const wm1 = win-1;
   const wp1 = win+1;
   let avg = 0;
   for (let i = n-1, m = n-win; i >= m; i--) {
      avg += vals[i];
   }
   for (let i = n-1; i >= wm1; i--) {
      const x = avg / win;
      r.push(x);
      avg += vals[i-win] - vals[i];
   }
   return r;
}
