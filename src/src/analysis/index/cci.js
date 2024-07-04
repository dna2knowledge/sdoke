const sp = {
   x: 0.015
};

export default function cci(vals, valHs, valLs, win) {
   const r = [];
   const n = vals.length;
   if (n < win || win < 1) return r;
   const wm1 = win - 1;
   let sum = 0;
   for (let i = n-1, m = n-win+1; i >= m; i--) {
      sum += vals[i];
   }
   for (let i = n-1; i >= wm1; i--) {
      const dr = vals.slice(i-win, i+1);
      const ma = sum / win;
      const md = dr.map(z => Math.abs(ma - z)).reduce((a, b) => a+b, 0) / win;
      const tp = (vals[i] + valHs[i] + valLs[i]) / 3;
      r.push((tp - ma) / md / sp.x);
      sum += vals[i-1] - vals[i];
   }
   return r;
}