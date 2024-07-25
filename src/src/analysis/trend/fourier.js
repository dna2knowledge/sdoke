import ft from '$/analysis/math/fourier';
import norm from '$/analysis/math/norm';
import { lineSmooth } from '$/analysis/math/polyline';
import sma from '$/analysis/index/sma';
import databox from '$/service/databox';

const dayms = 3600 * 24 * 1000;

function dayTrim(ts) { return ts - ts % dayms; }

function findSencondPeek(data, i, up) {
   up = up || 5;
   let j = i-1, last = data[i];
   for (; j >= 0; j--) {
      // confine at least 1w by default as a cycle
      if (data[j] > last && i - j >= up) break;
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

function buildVis(r) {
   // r = report
   r.vis = {};
   const st = r.origin.length - r.phi - 1;
   const visPhiTs = r.origin[st].T;
   r.vis.phi = new Date(visPhiTs).toISOString().split('T')[0];
   const visNextPhiTs = dayTrim(visPhiTs + r.w / 5 * 7 * dayms);
   r.vis.nextPhi = new Date(visNextPhiTs);
   let wd = r.vis.nextPhi.getDay();
   if (wd === 6 || wd === 0) {
      r.vis.nextPhi = new Date(visNextPhiTs + 2 * dayms);
   }
   r.vis.nextPhi = r.vis.nextPhi.toISOString().split('T')[0];
   const visNextHalfPhiTs = dayTrim(visPhiTs + r.w / 2 / 5 * 7 * dayms);
   const ts = new Date().getTime();
   if (ts >= visNextHalfPhiTs) r.vis.watch = true; else r.vis.watch = false;
   r.vis.nextHalfPhi = new Date(visNextHalfPhiTs);
   wd = r.vis.nextHalfPhi.getDay();
   if (wd === 6 || wd === 0) {
      r.vis.nextHalfPhi = new Date(visNextHalfPhiTs + 2 * dayms);
   }
   r.vis.nextHalfPhi = r.vis.nextHalfPhi.toISOString().split('T')[0];
}

function buildTest(r) {
   r.test = { rate: 0 };
   let count = 0;
   const i = r.V.length - r.phi - 1 + Math.floor(r.origin.length/2);
   const halfw = Math.floor(r.w/2);
   // XXX: halfw start to monitor not buy-in, so it is not accurate evaluating
   for (let j = i; j >= halfw; j -= r.w) {
      const edp = r.origin[i];
      const stp = r.origin[i - halfw];
      const rate = (edp.C - stp.C)/stp.C;
      r.test.rate += rate;
      count ++;
   }
   if (count === 0) r.test.rate = NaN; else r.test.rate /= count;
}

export async function analyzeOneCol(data, col, win) {
   const n = Math.floor(data.length/2);
   const Ds0 = data.map(z => z[col]);
   // prev, use polylineize() to reduce noise const P = polylineize(Ds0, win);
   const P = sma(Ds0, win); P.reverse();
   if (P.length < Ds0.length) Ds0.splice(0, Ds0.length - P.length);
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
   if (F.length - 6 <= maxi) {
      maxi = findSencondPeek(F, maxi);
   }
   let fn = F.length - maxi - 1;
   if (fn <= 0) fn = 1;

   const Dfns = lineSmooth(norm(Df), 3).slice(n);
   const Dssmooth = lineSmooth(Ds0, 10).slice(n);
   const maxci = findSencondPeek(Dssmooth, Dssmooth.length-1, 1);
   const phi = Dfns.length - maxci - 1;
   const phis = [maxci];
   let esum = 0, cycn = 0, st = phi;
   for (let i = maxci+fn, ni = Dfns.length; i < ni; i += fn) {
      cycn ++;
      const upj = Math.floor(i+fn/2);
      const dnj = Math.ceil(i-fn/2);
      let mj = i, m = Dssmooth[i];
      for (let j = dnj < 0 ? 0 : dnj; j < upj && j < ni; j++) {
         const mx = Dssmooth[j];
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
      st = Dfns.length - i - 1;
   }
   const r =  {
      F, V: Dfns, origin: data, A, w: fn,
      cyc: phis.map(z => Dfns.length - z - 1),
      base: phi, phi: st,
      err: cycn === 0 ? 0: (esum / cycn),
   };
   buildVis(r);
   buildTest(r);
   return r;
}

export async function analyzeOne(data, win) {
   const Fc = await analyzeOneCol(data, 'C', win);
   const Fv = await analyzeOneCol(data, 'V', win);
   return { c: Fc, v: Fv };
}

export async function act(stockList, win, opt) {
   if (!stockList || !stockList.length) return null;
   opt = opt || {};
   const progressFn = opt.progressFn || (() => {});
   const r = [];
   progressFn(0, stockList.length);
   for (let i = 0, n = stockList.length; i < n; i++) {
      const meta = stockList[i];
      progressFn(i, n, meta);
      let hdata = (await databox.stock.getStockHistoryRaw(meta.code)) || [];
      if (hdata.length < 100) {
         r.push({ meta, err: 'tooNew' });
         continue;
      }
      if (hdata.length > 500) hdata = hdata.slice(hdata.length-500);
      const report = await analyzeOne(hdata, win);
      r.push({ meta, cycle: report });
   }
   progressFn(0, 0);
   return r;
}