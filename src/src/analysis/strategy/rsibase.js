import { lr } from '$/analysis/math/mse';
import { evaluateStrategy } from '$/analysis/strategy/framework';

const sp = {
   predict_history: 15,
}; // super param

async function analyzeOne(item) {
   const eds = item.raw.map(z => z.C);
   const n = eds.length;
   const win = sp.predict_history;
   if (n < win) return { score: 0.0, kb: { k: 0, b: 0 } };
   let avggain = 0, avgloss = 0;
   for (let i = n-1, m = n-win+1; i >= m; i--) {
      const d = eds[i] - eds[i-1];
      if (d > 0) avggain += d; else avgloss -= d;
   }
   avggain /= win-1;
   avgloss /= win-1;
   const rsi = 100 * (1 - 1/(1+avggain/avgloss));
   if (rsi < 30) {
      return { score: 1.0, kb: { k: 0, b: 0 } };
   } else if (rsi < 40) {
      return { score: 0.5, kb: { k: 0, b: 0 } };
   } else if (rsi > 70) {
      return { score: -1.0, kb: { k: 0, b: 0 } };
   } else if (rsi > 60) {
      return { score: -0.5, kb: { k: 0, b: 0 } };
   } else {
      return { score: 0.0, kb: { k: 0, b: 0 } };
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
      c0.kb.k = (100 - c0.score)/100;
      ret = c0;
   } catch(_) { ret = {}; }
   return ret;
}