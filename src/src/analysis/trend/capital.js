import databox from '$/service/databox';

async function getData(datePoint, range) {
   if (!datePoint) datePoint = new Date();
   const ts = datePoint.getTime();
   const todo = ((await databox.stock.getStockList()) || []).filter(item => (
      !item.code.startsWith('bj') &&
      !item.code.startsWith('sz2') &&
      !item.code.startsWith('sz14') &&
      !item.code.startsWith('sh9')
   ));
   const first = todo[0];
   if (!first) return null;
   let alignedTs = null, rangen = 0;
   switch(range) {
      case 'weekly': rangen = 5; break;
      case 'monthly': rangen = 20; break;
      case 'yearly': rangen = 242; break;
      default: rangen = 1;
   }
   const last = {};
   for (let i = 0, n = todo.length; i < n; i++) {
      const item = todo[i];
      const H = await databox.stock.getStockHistory(item.code);
      if (!H) continue;
      let j = H.length-1;
      for (; j >= 0; j--) {
         const it = H[j];
         if (it.T <= ts) break;
      }
      if (j < rangen) continue;
      if (alignedTs === null) alignedTs = H[j].T;
      if (alignedTs !== H[j].T) continue; // the stock may quit
      const Cs = j < rangen+242 ? H.slice(0, j+1) : H.slice(j-range-242, j+1);
      Cs.reverse();
      last[item.code] = { tag: item.area, name: item.name, code: item.code, C: Cs.map(z => z.C) };
   }
   last._ = alignedTs;

   return last;
}

function initbucket() {
   const b = [];
   for (let i = 0; i < 201; i++) {
      b.push(0);
   }
   return b;
}
function calcRate(a, b) {
   return (b - a) / a;
}
function aggregate(data, range) {
   let rangen = 0;
   switch(range) {
      case 'weekly': rangen = 5; break;
      case 'monthly': rangen = 20; break;
      case 'yearly': rangen = 242; break;
      default: rangen = 1;
   }
   const Sareas = {};
   const Kareas = {};
   Object.values(data).forEach(z => {
      if (z.C.length <= 1) return; // new stock
      let areas = Sareas;
      if (!z.code) return;
      if (z.code.startsWith('sh688') || z.code.startsWith('sz3')) areas = Kareas;
      if (!areas[z.tag]) areas[z.tag] = { t: z.tag, n: 0, avg: 0, b: initbucket(), h: [], c: [], L: [] };
      const a = areas[z.tag];
      a.n ++;
      for (let i = rangen, n = z.C.length; i < n; i++) {
         const hr = calcRate(z.C[i], z.C[i-rangen]);
         a.h[i-rangen] = (a.h[i] || 0) + hr;
         a.c[i-rangen] = (a.c[i] || 0) + 1;
      }
      let rate = calcRate(z.C[rangen], z.C[0]);
      a.L.push({ code: z.code, name: z.name, rate: rate });
      a.avg += rate;
      if (rate < -0.1) rate = -0.1;
      else if (rate > 0.1) rate = 0.1;
      const i = Math.floor((rate + 0.1) * 1000);
      a.b[i] ++;
   });
   Object.keys(Sareas).forEach(area => {
      const a = Sareas[area];
      a.avg /= a.n;
      a.h.forEach((z, i) => {
         if (!a.c[i]) { a.h[i] = null; return; }
         a.h[i] = z/a.c[i];
      });
      a.h = a.h.slice(0, 201);
      a.h.reverse();
      delete a.c;
   });
   Object.keys(Kareas).forEach(area => {
      const a = Kareas[area];
      a.avg /= a.n;
      a.h.forEach((z, i) => {
         if (!a.c[i]) { a.h[i] = null; return; }
         a.h[i] = z/a.c[i];
      });
      a.h = a.h.slice(0, 201);
      a.h.reverse();
      delete a.c;
   });
   return { S: Sareas, K: Kareas };
}

async function act(pointDate, range) {
   const data = await getData(pointDate, range);
   if (!data) return null;
   let lastts = data._;
   delete data._;
   const ret = aggregate(data, range);
   ret.ts = lastts;
   return ret;
}

export default {
   act
};
