import smaIndex from '$/analysis/index/sma';

export default function boll_md(vals, win) {
   const r = [];
   const n = vals.length;
   if (n < win || win < 1) return r;
   const wm1 = win-1;
   let avg = 0;
   for (let i = n-1, m = n-win; i >= m && i >= 0; i--) {
      avg += vals[i];
   }
   for (let i = n-1; i >= wm1 && i-win >= 0; i--) {
      const ma = avg / win;
      let md = 0;
      for (let j = 1; j < win; j++) {
         const d = vals[i-j] - ma;
         md += d * d;
      }
      r.push(Math.sqrt(md/win));
      avg += vals[i-win] - vals[i];
   }
   return r;
}

export function boll_val(vals, win, k) {
   const r = [];
   const n = vals.length;
   if (n < win || win < 1) return r;
   const wm1 = win-1;
   let avg = 0;
   for (let i = n-1, m = n-win; i >= m && i >= 0; i--) {
      avg += vals[i];
   }
   for (let i = n-1; i >= wm1 && i-win >= 0; i--) {
      const ma = avg / win;
      let md = 0;
      for (let j = 1; j < win; j++) {
         const d = vals[i-j] - ma;
         md += d * d;
      }
      const mb = (avg - vals[i]) / (win - 1);
      r.push(mb + k * Math.sqrt(md/win));
      avg += vals[i-win] - vals[i];
   }
   return r;
}