import calc from '$/analysis/math/calc';
import { evaluateStrategy } from '$/analysis/strategy/framework';

/*
strategy object {
   name, desc,
   rule: [{C, F}, ...],
   vis: [{G, V}, ...],
   e.g. rule: [{ C: '.C.rsi15() < 30', F: '1' }, { C: '.C.rsi15() > 70', F: '-1' }, { C: '', F: '1 - 2 * (.C.rsi15() - 30) / (70 - 30)' }],
   e.g. vis: [{ G: 'rsi.rsi15', F: '.C.rsi15.atrange(index(-250, 0))' }],
             30 -> const value, always show
             fft(.C.atrange(index(-250, 0))) -> not related to time, always show
             .C.rsi15.atrange(index(-250, 0)) -> it only show in Daily view
             .w.C.rsi15.atrange(index(-250, 0)) -> it only show in Weekly view
             .m.C.rsi15.atrange(index(-250, 0)) -> it only show in Monthly view
}
 */

export async function compileVis(stg) {
   if (!stg) return null;
   if (!stg.vis.length) return [];
   let signature = {};
   const r = [];
   const groupIdMap = {};
   for (let i = 0, n = stg.vis.length; i < n; i++) {
      const compiled = {};
      r.push(compiled);
      const vis = stg.vis[i];
      let group = '', id = null;
      if (vis.G) {
         const ps = vis.G.split('.');
         group = ps[0];
         if (ps.length > 1) id = ps.slice(1).join('.');
      }
      if (!groupIdMap[group]) groupIdMap[group] = 1;
      if (!id) id = `_${groupIdMap[group]}`;
      groupIdMap[group] ++;
      compiled.group = group;
      compiled.id = id;
      compiled.c = vis.c;
      if (vis.F) {
         compiled.F = calc.compile(calc.tokenize(vis.F), {
            importSignature: signature,
            exportSignature: true,
         });
         if (!compiled.F.err) {
            signature = compiled.F._signature;
            delete compiled.F._signature;
         }
      } else {
         compiled.F = 0;
      }
   }
   return r;
}

export async function customEvaluateStrategyForVisualization(item, stg) {
   if (!stg) return null;
   const compiledVis = await compileVis(stg);
   const r = [];
   const typeopt = { cache: {} };
   const opt = { cache: {} };
   for (let i = 0, n = compiledVis.length; i < n; i++) {
      const vis = compiledVis[i];
      if (vis.F === 0) {
         vis.val = [];
         vis.type = 0;
      } else {
         vis.type = await calc.evaluateType(vis.F, typeopt);
         vis.val = await calc.evaluate(vis.F, item.raw, opt);
         if (!vis.val && vis.val !== 0) vis.val = [];
      }
      r.push(vis);
   }
   return r;
}

export async function compileRule(stg) {
   if (!stg) return null;
   if (!stg.rule.length) return [];
   let signature = {};
   const r = [];
   for (let i = 0, n = stg.rule.length; i < n; i++) {
      const compiled = {};
      r.push(compiled);
      const rule = stg.rule[i];
      if (rule.C) {
         compiled.C = calc.compile(calc.tokenize(rule.C), {
            importSignature: signature,
            exportSignature: true,
         });
         if (!compiled.C.err) {
            signature = compiled.C._signature;
            delete compiled.C._signature;
         }
      } else {
         // empty formula, always true
         compiled.C = true;
      }
      if (rule.F) {
         compiled.F = calc.compile(calc.tokenize(rule.F), {
            importSignature: signature,
            exportSignature: true,
         });
         if (!compiled.F.err) {
            signature = compiled.F._signature;
            delete compiled.F._signature;
         }
      } else {
         compiled.F = 0;
      }
   }
   return r;
}

export async function analyzeOne(item, compiledRule) {
   const data = item.raw;
   if (!compiledRule || !compiledRule.length) return 0;
   const opt = { cache: {} };
   let r = { val: null, err: null };
   let rule;
   for (let i = 0, n = compiledRule.length; i < n; i++) {
      rule = compiledRule[i];
      if (!rule.C || rule.C === true) {
         // go through
      } else if (rule.C.err) {
         r.err = rule.C.err;
         r.val = null;
         break;
      } else if (!(await calc.evaluate(rule.C, data, opt))) {
         continue;
      }
      if (!rule.F || rule.F === 0) {
         r.val = 0;
      } else if (rule.F.err) {
         r.err = ruleF.err;
         r.val = null;
         break;
      } else {
         r.val = await calc.evaluate(rule.F, data, opt);
         break;
      }
   }
   if (r.err) return { score: 0, err: r.err };
   if (typeof(r.val) !== 'number') return { score: 0 };
   if (r.val < -1) return { score: -1 };
   if (r.val > 1) return { score: 1 };
   return { score: r.val };
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

export async function customEvaluateStrategy(item, stg) {
   // item = {meta, raw}
   let ret;
   try {
      const compiledRule = await compileRule(stg);
      const analyzeWrap = (item) => analyze(item, compiledRule);
      const rows = item.raw;
      const stat_all = await evaluateStrategy(rows, analyzeWrap);
      const xts = new Date(new Date().getTime() - 3600 * 1000 * 24 * 365 * 3).getTime();
      const stat_3y = await evaluateStrategy(rows.filter(z => z.T >= xts), analyzeWrap);

      const ats = new Date(new Date().getTime() - 3600 * 1000 * 24 * 365).getTime();
      const ai = rows.filter(z => z.T < ats).length;
      const c0 = (await analyzeWrap([{ raw: rows.slice(ai) }]))[0];
      c0.stat = {
         d250: [],
         all: stat_all,
         y3: stat_3y,
      };
      for (let i = rows.length-1, j = 1; i >= rows.length-250 && i >= 0; i--, j++) {
         const k = ai < j ? 0 : ai-j;
         const di = (await analyzeWrap([{ raw: rows.slice(k, i) }]))[0];
         c0.stat.d250.push(di);
      }
      ret = c0;
   } catch(_) { ret = {}; }
   return ret;
}

export async function customEvaluateStrategyPureHistory(item, stg, opt) {
   // item = {meta, raw}
   opt = opt || {};
   try {
      const compiledRule = await compileRule(stg);
      const analyzeWrap = (item) => analyze(item, compiledRule);
      const rows = item.raw;
      opt.n = opt.n || rows.length;
      const ats = new Date(new Date().getTime() - 3600 * 1000 * 24 * 365).getTime();
      const ai = rows.filter(z => z.T < ats).length;
      const edI = rows.length <= opt.n ? 0 : (rows.length-opt.n);
      const history = [];
      for (let i = rows.length-1, j = 0; i >= edI; i--, j++) {
         const day = rows[i];
         const k = ai < j ? 0 : ai-j;
         const di = (await analyzeWrap([{ raw: rows.slice(k, i) }]))[0];
         di.T = day.T;
         history.push(di);
      }
      return history;
   } catch {
      return [];
   }
}