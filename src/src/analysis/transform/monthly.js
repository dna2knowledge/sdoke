export default function dailyToMonthly(data, cap) {
   if (!data || !data.length) return [];
   if (!cap) cap = Infinity;
   const transformed = [];
   let tsm0 = new Date(data[data.length-1].T).getMonth();
   let last = { T: undefined, O: undefined, C: undefined, H: undefined, L: undefined, V: 0, m: 0 };
   transformed.push(last);
   for (let i = data.length-1; i >= 0; i--) {
      const one = data[i];
      const tsm = new Date(one.T).getMonth();
      if (tsm !== tsm0) {
         if (transformed.length >= cap) break;
         tsm0 = tsm;
         last = { T: undefined, O: undefined, C: undefined, H: undefined, L: undefined, V: 0, m: 0 };
         transformed.push(last);
      }
      last.T = one.T;
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