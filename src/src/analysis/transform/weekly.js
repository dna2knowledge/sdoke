function dailyToWeekly(data, cap) {
   if (!data || !data.length) return [];
   if (!cap) cap = Infinity;
   const transformed = [];
   let ts = new Date(data[data.length-1].T);
   let last = {
      T: new Date(
         ts.getTime() - ts.getDay() * 24 * 3600 * 1000
      ).getTime(),
      O: undefined, C: undefined, H: undefined, L: undefined, V: 0, m: 0
   };
   transformed.push(last);
   for (let i = data.length-1; i >= 0; i--) {
      const one = data[i];
      if (one.T <= last.T) {
         if (transformed.length >= cap) break;
         last = { T: last.T, O: undefined, C: undefined, H: undefined, L: undefined, V: 0, m: 0 };
         transformed.push(last);
         while (one.T <= last.T) last.T -= 24 * 3600 * 1000 * 7;
      }
      last.O = one.O;
      if (isNaN(last.C)) last.C = one.C;
      if (isNaN(last.H) || last.H < one.H) last.H = one.H;
      if (isNaN(last.L) || last.L > one.L) last.L = one.L;
      last.V += one.V;
      last.m += one.m;
   }
   transformed.reverse();
   return transformed;
}

module.exports = dailyToWeekly;