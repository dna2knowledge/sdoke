import { lr } from '$/analysis/math/mse';
import { evaluateStrategy } from '$/analysis/strategy/framework';

const sp = {
   predict_history: 15,
}; // super param

async function analyzeOne(item) {
   const eds = item.raw.map(z => z.C);
   const n = eds.length;
   const win = sp.predict_history;
   if (n < win) return { signal: { mode: '-', act: '-', score: 50 }, kb: { k: 0, b: 0 } };
   let avggain = 0, avgloss = 0;
   for (let i = n-1, m = n-win+1; i >= m; i--) {
      const d = eds[i] - eds[i-1];
      if (d > 0) avggain += d; else avgloss -= d;
   }
   avggain /= win-1;
   avgloss /= win-1;
   const rsi = 100 * (1 - 1/(1+avggain/avgloss));
   if (rsi < 30) {
      return { signal: { mode: 'buy', act: 'prepare', score: rsi }, kb: { k: 0, b: 0 } };
   } else if (rsi < 40) {
      return { signal: { mode: 'buy', act: 'lookonce', score: rsi }, kb: { k: 0, b: 0 } };
   } else if (rsi > 70) {
      return { signal: { mode: 'sell', act: 'prepare', score: rsi }, kb: { k: 0, b: 0 } };
   } else if (rsi > 60) {
      return { signal: { mode: 'sell', act: 'lookonce', score: rsi }, kb: { k: 0, b: 0 } };
   } else {
      return { signal: { mode: '-', act: '-', score: rsi }, kb: { k: 0, b: 0 } };
   }
}

export async function analyze(items, opt) {
   // items = [{ meta, raw: [row...] }]
   if (!items) return null;
   const candidates = [];
   for (let i = 0, n = items.length; i < n; i++) {
      const item = items[i];
      const candidate = await analyzeOne(item, opt);
      candidates.push(candidate);
   }
   return candidates;
}

export async function suggest(items) {
   // items = [{ meta, raw: [row...] }]
   if (!items) return null;
   const candidates = [];
   for (let j = 0, n = items.length; j < n; j++) {
      const item = items[j];
      const history = [];
      const ai = item.raw.length - sp.predict_history;
      const h1st = (await analyze([{ raw: item.raw.slice(ai) }]))[0];
      history.push(h1st);
      for (let i = item.raw.length-1, j = 1; ai - j >= 0 && i >= 0; i--, j++) {
         const di = (await analyze([{ raw: item.raw.slice(ai-j, i) }]))[0];
         history.push(di);
      }
      const stat = { longestx: 0, longestxp: 0, continuex: true, continuexp: true };
      if (h1st) {
         for (let i = 1; i < 20; i++) {
            const hi = history[i];
            if (!hi) break;
            if (hi.signal.mode === h1st.signal.mode && stat.continuex) {
               stat.longestx ++;
               if (hi.signal.act === h1st.signal.act && stat.continuexp) {
                  stat.longestxp ++;
               } else stat.continuexp = false;
            } else stat.continuex = false;
         }
      }
      const kb = { k: 0, b: 0 };
      if (stat.continuexp > 1) {
         if (h1st.signal.mode === 'buy') {
            const buykb = lr(history.slice(0, stat.continuexp).map(z => z.signal.score));
            kb.k = buykb.k;
            kb.b = buykb.b;
         } else {
            const sellkb = lr(history.slice(0, stat.continuexp).map(z => z.signal.score));
            kb.k = -sellkb.k;
            kb.b = -sellkb.b;
         }
      }
      candidates.push({
         mode: h1st?.signal?.mode,
         act: h1st?.signal?.act,
         kb,
         lv0: stat.longestxp, lv1: stat.longestx,
         history: history.map(z => z.signal.mode === '-' ? '-' : `${z.signal.mode === 'buy' ? 'B' : 'S'}${z.signal.act === 'prepare' ? 'P' : 'L'}`),
      });
   }
   return candidates;
}

export async function rsiEvaluateStrategy(item) {
   // item = {meta, raw}
   let ret;
   try {
      const rows = item.raw;
      const stat_all = await evaluateStrategy(rows, analyze);
      const xts = new Date(new Date().getTime() - 3600 * 1000 * 24 * 365 * 3).getTime();
      const stat_3y = await evaluateStrategy(rows.filter(z => z.T >= xts), analyze);

      const ats = new Date(new Date().getTime() - 3600 * 1000 * 24 * 365).getTime();
      const ai = rows.filter(z => z.T < ats).length;
      const c0 = (await analyze([{ raw: rows.slice(ai), }]))[0];
      c0.stat = {
         d250: [],
         all: stat_all,
         y3: stat_3y,
      };
      for (let i = rows.length-1, j = 1; i >= rows.length-250 && i >= 0; i--, j++) {
         const di = (await analyze([{ raw: rows.slice(ai-j, i) }]))[0];
         c0.stat.d250.push(di);
      }
      c0.kb.k = (100 - c0.signal.score)/100;
      ret = c0;
   } catch(_) { ret = {}; }
   return ret;
}