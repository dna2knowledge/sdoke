import ft from '$/analysis/math/fourier';
import norm from '$/analysis/math/norm';
import { lineSmooth, polylineize } from '$/analysis/math/polyline';
import databox from '$/service/databox';

const dayms = 3600 * 24 * 1000;

function findSencondPeek(data, i) {
   let j = i-1, last = data[i];
   for (; j >= 0; j--) {
      // confine at least 1w as a cycle
      if (data[j] > last && i - j >= 5) break;
      last = data[j];
   }
   let maxi = j, max = last;
   for (; j >= 0; j--) {
      const d = data[j];
      if (d > max) {
         max = d;
         maxi = j;
      }
   }
   return maxi;
}

function buildVis(report) {
   const r = report;
   r.vis = {};
   const st = r.origin.length - r.phi - 1;
   const visPhiTs = r.origin[st].T;
   r.vis.phi = new Date(visPhiTs).toISOString().split('T')[0];
   const visNextPhiTs = visPhiTs + r.w / 5 * 7 * dayms;
   r.vis.nextPhi = new Date(visNextPhiTs);
   let wd = r.vis.nextPhi.getDay();
   if (wd === 6 || wd === 0) {
      r.vis.nextPhi = new Date(visNextPhiTs + 2 * dayms);
   }
   r.vis.nextPhi = r.vis.nextPhi.toISOString().split('T')[0];
   const visNextHalfPhiTs = visPhiTs + r.w / 2 / 5 * 7 * dayms;
   const ts = new Date().getTime();
   if (ts >= visNextHalfPhiTs) r.vis.watch = true; else r.vis.watch = false;
   r.vis.nextHalfPhi = new Date(visNextHalfPhiTs);
   wd = r.vis.nextHalfPhi.getDay();
   if (wd === 6 || wd === 0) {
      r.vis.nextHalfPhi = new Date(visNextHalfPhiTs + 2 * dayms);
   }
   r.vis.nextHalfPhi = r.vis.nextHalfPhi.toISOString().split('T')[0];
}

export async function analyzeOneCol(data, col, win) {
   const n = Math.floor(data.length/2);
   const Ds0 = data.map(z => z[col]);
   const P = polylineize(Ds0, win);
   const Df = Ds0.map((z, i) => z - P[i]);
   const F0 = ft.dft(Df).map(z => ft.complex.magnitude(z));
   const A = F0[0];
   const F = lineSmooth(F0, 3).slice(n);
   let maxi = -1, max = -Infinity;
   F.forEach((z, i) => {
      if (z > max) {
         max = z;
         maxi = i;
      }
   });
   if (F.length - 1 === maxi) {
      maxi = findSencondPeek(F, maxi);
   }
   const fn = F.length - maxi - 1;

   const Dfns = lineSmooth(norm(Df), 3).slice(n);
   let maxci = -1, maxc = -Infinity;
   Dfns.forEach((z, i) => {
      if (z > maxc) {
         maxc = z;
         maxci = i;
      }
   });
   const phi = Dfns.length - maxci - 1;
   const phis = [maxci];
   let esum = 0, cycn = 0, st = phi;
   for (let i = maxci+fn, ni = Dfns.length; i < ni; i += fn) {
      cycn ++;
      const upj = Math.floor(i+fn/3);
      const dnj = Math.ceil(i-fn/3);
      let mj = i, m = Dfns[i];
      for (let j = dnj < 0 ? 0 : dnj; j < upj && j < ni; j++) {
         const mx = Dfns[j];
         if (mx > m) {
            mj = j;
            m = mx;
         }
      }
      if (mj !== i) {
         esum += mj - i;
         i = mj;
      }
      phis.push(i);
      st = i;
   }
   const r =  {
      F, V: Dfns, origin: data, A, w: fn,
      cyc: phis.map(z => Dfns.length - z - 1),
      base: phi, phi: Dfns.length - st - 1,
      err: cycn === 0 ? 0: (esum / cycn),
   };
   buildVis(r);
   return r;
}

export async function analyzeOne(data, win) {
   const Fc = await analyzeOneCol(data, 'C', win);
   const Fv = await analyzeOneCol(data, 'V', win);
   return { c: Fc, v: Fv };
}

export async function act(stockList, win) {
   if (!stockList || !stockList.length) return null;
   const r = [];
   for (let i = 0, n = stockList.length; i < n; i++) {
      const meta = stockList[i];
      let hdata = (await databox.stock.getStockHistoryRaw(meta.code)) || [];
      if (hdata.length < 100) {
         r.push({ meta, err: 'tooNew' });
         continue;
      }
      if (hdata.length > 500) hdata = hdata.slice(hdata.length-500);
      const report = await analyzeOne(hdata, win);
      r.push({ meta, cycle: report });
   }
   return r;
}