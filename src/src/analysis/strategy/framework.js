export async function evaluateStrategy(raw, analyzeFn) {
   const item = { raw, };
   item.stat = { count: 0, hit: 0, summinwait: 0, summaxwait: 0, sumhiwait: 0, summininc: 0, summaxinc: 0, summinlostwait: 0, summinlost: 0 };
   const payload = [{ raw: null }];
   const historyn = 250;
   const predictn = 22;
   const lastn = item.raw.length - historyn - predictn;
   for (let i = 0; i < lastn; i++) {
      const ipoint = i+historyn;
      payload[0].raw = item.raw.slice(i, ipoint);
      const c = (await analyzeFn(payload))[0];
      const signal = c;
      if (signal.score > 0 && !isNaN(signal.score)) {
         if (signal.score > 0.5) {
            const buyin = item.raw[ipoint+1];
            const ts0 = buyin.T;
            const watchduration = item.raw.slice(ipoint+2, ipoint+predictn);
            item.stat.count ++;
            let minwait = Infinity, maxwait = 0, skip = false;
            let mininc = Infinity, maxinc = 0, maxincwait = 0, minlost = 0, minlostts = 0;
            watchduration.forEach(one => {
               if (maxwait > 0 && buyin.C >= one.C) skip = true;
               if (skip) return;
               if (buyin.C < one.C) {
                  const ts = one.T;
                  if (mininc > one.C) mininc = one.C;
                  if (maxinc < one.C) { maxinc = one.C; maxincwait = one.T; }
                  if (minwait > ts) minwait = ts;
                  if (maxwait < ts) maxwait = ts;
               } else {
                  if (one.C > minlost) {
                     minlost = one.C;
                     minlostts = one.T;
                  }
               }
            });
            if (maxwait > 0 && maxinc > 0) {
               if (buyin.C > 0) { // skip price < 0
                  item.stat.hit ++;
                  item.stat.summinwait += minwait - ts0;
                  item.stat.summaxwait += maxwait - ts0;
                  item.stat.sumhiwait += maxincwait - ts0;
                  item.stat.summininc += (mininc - buyin.C) / buyin.C;
                  item.stat.summaxinc += (maxinc - buyin.C) / buyin.C;
               } else {
                  item.stat.count --;
               }
            } else if (minlost > 0) {
               item.stat.summinlost += (minlost - buyin.C) / buyin.C;
               item.stat.summinlostwait += minlostts - ts0;
            }
         } else { // 0 < score < 0.5
         }
      }
   }
   if (item.stat.count > 0) {
      return {
         count: item.stat.count,
         hit: item.stat.hit,
         rate: item.stat.hit/item.stat.count,
         gain: {
            min_wait: item.stat.summinwait/item.stat.hit/3600/1000/24,
            hi_wait: item.stat.sumhiwait/item.stat.hit/3600/1000/24,
            max_wait: item.stat.summaxwait/item.stat.hit/3600/1000/24,
            min_avg: item.stat.summininc/item.stat.hit,
            max_avg: item.stat.summaxinc/item.stat.hit,
         },
         loss: {
            best_wait: item.stat.summinlostwait/(item.stat.count-item.stat.hit)/3600/1000/24,
            avg: item.stat.summinlost/(item.stat.count-item.stat.hit),
         },
      };
   } else {
      return { gain: {}, loss: {} };
   }
}