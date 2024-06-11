function rsi(vals, win) {
   const r = [];
   const n = vals.length;
   if (n < win || win < 2) return r;
   const wm1 = win-1;
   let avggain = 0, avgloss = 0;
   for (let i = n-1, m = n-win+1; i >= m; i--) {
      const d = vals[i] - vals[i-1];
      if (d > 0) avggain += d; else avgloss -= d;
   }
   for (let i = n-1; i >= wm1; i--) {
      const ag = avggain / wm1;
      const al = avgloss / wm1;
      const x = 100 * (1 - 1/(1+ag/al));
      r.push(x);
      const last = vals[i] - vals[i-1];
      if (last > 0) avggain -= last; else avgloss += last;
      const d = vals[i-wm1] - vals[i-win];
      if (d > 0) avggain += d; else avgloss -= d;
   }
   return r;
}

module.exports = {
   rsi,
};