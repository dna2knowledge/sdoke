import databox from '$/service/databox';
import { lr } from '$/analysis/math/mse';
import ft from '$/analysis/math/fourier';
import { polylineize } from '$/analysis/math/polyline';
import dailyToWeekly from '$/analysis/transform/weekly';
import dailyToMonthly from '$/analysis/transform/monthly';
import smaIndex from '$/analysis/index/sma';
import rsiIndex from '$/analysis/index/rsi';
import cciIndex from '$/analysis/index/cci';
import wrIndex from '$/analysis/index/wr';

export const version = '0.1';
const dayms = 24 * 3600 * 1000;

function getDateTs(date) {
   const ts = date.getTime();
   return ts - ts % dayms;
}
function pad0(num) {
   if (num >= 10) return `${num}`;
   return `0${num}`;
}
function nextMonthTs(date) {
   const y = date.getFullYear();
   const m = date.getMonth();
   if (m === 11) {
      return new Date(`${y+1}-01-01}`).getTime();
   } else {
      return new Date(`${y}-${pad0(m+1)}-01`).getTime();
   }
}
function flatList(list) {
   if (!Array.isArray(list)) return list;
   const r = [];
   list.forEach(z => {
      if (Array.isArray(z)) {
         const x = flatList(z);
         x.forEach(zz => r.push(zz));
      } else {
         r.push(z);
      }
   });
   return r;
}
/*
 * <T> = open/O, close/C, high/H, low/L, vol/volume/V
 * .<T>.today, .<T>.at(day(-1)), .<T>.at(yyyymmdd), .<T>.range(week), .<T>.range(day(-10), day(-1)), .<T>.range(thisweek(-1)), .<T>.range(thisyear)
 * math.sin, math.cos, math.pi, math.floor, math.ceil, math.round, math.e, math.ln, math.random, math.exp, math.pow
 * math.sum, math.average, math.max, math.min
 * +, -, *, /, >, <, =, and, or, not, (, ), ^
 */
const stops = ['(', ')', ',', '+', '-', '*', '/', '<', '>', '=', '^'];
const stops2 = ['and', 'or', 'not'];
function tokenize(query) {
   const tokens = query.split(/\s+/).reduce(
      (a, x) => {
         const n = x.length;
         let j = 0;
         for (let i = 0; i < n; i++) {
            const ch = x.charAt(i);
            if (stops.includes(ch)) {
               const prev = x.substring(j, i).trim();
               j = i+1;
               if (prev) a.push(prev);
               a.push(ch);
            }
         }
         if (j < n) {
            const remain = x.substring(j, n).trim();
            if (remain) a.push(remain);
         }
         return a;
      }, []
   );
   return tokens;
}

const priority = [['^'], ['*', '/'], ['+', '-'], ['<', '>', '='], ['not'], ['and', 'or']];
function getPriority(op) {
   if (!op) return Infinity;
   for (let i = 0, n = priority.length; i < n; i++) {
      const pr = priority[i];
      if (pr.includes(op)) return i;
   }
   return Infinity;
}

function tokenIsNumber(x) {
   return `${parseFloat(x)}` === x;
}

function compile(tokens, opt) {
   opt = opt || {};
   const obj = { V: [] };
   const stat = { cache: {}, i: 1, err: [] };

   // enable signature share between multiple expressions
   if (opt.importSignature) {
      let maxI = 1;
      Object.keys(opt.importSignature).forEach(sig => {
         const v = opt.importSignature[sig];
         const i0 = v && v.startsWith('_') ? parseInt(v.substring(1)) : 0;
         if (i0 > maxI) maxI = i0;
         stat.cache[sig] = v;
      });
      stat.i = maxI + 1;
   }

   compileSub(tokens, 0, obj, stat);

   if (stat.err.length) return { err: stat.err };
   if (opt.exportSignature) obj._signature = stat.cache;
   return obj;
}
function compileMergeOp(op, opS, valS, stat) {
   let lastOp = opS[opS.length-1];
   let pr0 = getPriority(lastOp);
   const pr1 = getPriority(op);
   while (lastOp && pr0 <= pr1) {
      if (lastOp === 'not') {
         const opnot = valS.pop();
         const sig = `not@${opnot.id || opnot.v}`;
         const id = stat.cache[sig] || `_${stat.i++}`;
         stat.cache[sig] = id;
         valS.push({ op: 'not', V: [opnot], id });
      } else {
         const op2 = valS.pop();
         const op1 = valS.pop();
         // -@2@1, -@@1, +@@2
         /* TODO
         if ((lastOp !== '-' || lastOp !== '+') && !(op1?.id || op1?.v)) {
            // compile error
            stat.err.push({ i, m: 'x o y, required x and y' });
            return;
         }
         */
         const sig = `${lastOp}@${op1?.id || op1?.v || ''}@${op2?.id || op2?.v}`;
         let id = stat.cache[sig];
         if (id) {
            valS.push({ ref: true, id });
         } else {
            id = `_${stat.i++}`;
            stat.cache[sig] = id;
            valS.push({ op: lastOp, V: [op1, op2], id });
         }
      }
      opS.pop();
      lastOp = opS[opS.length-1];
      pr0 = getPriority(lastOp);
   }
   if (op) opS.push(op);
}
function compileSub(tokens, i, out, stat) {
   const opS = [];
   const valS = [];
   const commaS = [];
   let ms = -1;
   for (let n = tokens.length; i < n; i++) {
      const t = tokens[i];
      if (t === '(') {
         const sub = { V: [] };
         const last = valS[valS.length-1];
         if (ms === 1) { // func
            last.F = true;
            last.A = sub;
         }
         i = compileSub(tokens, i+1, sub, stat);
         if (ms === 1) { // func
            const sig = `${last.v}@${sub.V.map(z => `${z.id || z.v}`).join('@')}`;
            let id = stat.cache[sig];
            if (id) {
               valS.pop();
               valS.push({ ref: true, id });
            } else {
               id = `_${stat.i ++}`;
               stat.cache[sig] = id;
               last.id = id;
            }
         } else {
            const sig = `()@${sub.V.map(z => `${z.id || z.v}`).join('@')}`;
            let id = stat.cache[sig];
            if (id) {
               valS.push({ ref: true, id });
            } else {
               id = `_${stat.i ++}`;
               stat.cache[sig] = id;
               sub.id = id;
               valS.push(sub);
            }
         }
         ms = 1;
      } else if (t === ')') {
         if (ms === 0) {
            // compile error
            stat.err.push({ i, m: '... operator )' });
            return tokens.length;
         }
         compileMergeOp(null, opS, valS, stat);
         if (valS.length) commaS.push(valS.pop());
         commaS.forEach(z => out.V.push(z));
         return i;
      } else if (t === ',') {
         ms = -1;
         compileMergeOp(null, opS, valS, stat);
         commaS.push(valS.pop());
      } else if (stops.includes(t) || stops2.includes(t)) {
         const lastOp = opS[opS.length-1];
         if (ms === 0) {
            // allow: and not, or not
            // disallow: + not, + +, and and, not not
            // XXX: a > = b --> not a < b, a not < b
            if (t !== 'not' || (lastOp !== 'and' || lastOp !== 'or')) {
               // compile error
               stat.err.push({ i, m: 'operator operator' });
               return tokens.length;
            }
         }
         ms = 0;
         compileMergeOp(t, opS, valS, stat);
      } else {
         if (ms === 1) {
            // compile error
            stat.err.push({ i, m: 'oprand oprand' });
            return tokens.length;
         }
         ms = 1;
         const isNumber = tokenIsNumber(t);
         const obj = {};
         if (isNumber) {
            obj.v = parseFloat(t);
         } else {
            if (t.startsWith('_')) {
               // compile error
               stat.err.push({ i, m: 'oprand name should not start with _' });
               return tokens.length;
            }
            obj.v = t.trim();
         }
         valS.push(obj);
      }
   }
   compileMergeOp(null, opS, valS, stat);
   out.V.push(valS.pop());
   return i;
}

async function evaluate(expr, data, opt) {
   opt = opt || {};
   return await evaluateNode(expr.V[0], data, opt.cache || {});
}
async function evaluateNode(expr, data, cache) {
   if (!expr) return null;
   if (expr.op) { // operator
      const args = [];
      for (let i = 0, n = expr.V.length; i < n; i++) {
         args.push(await evaluateNode(expr.V[i], data, cache));
      }
      expr.r = await evaluateOp(expr.op, args, data, cache, expr.id);
      return expr.r;
   } else if (expr.ref) { // ref
      expr.r = await evaluateRef(cache, expr.id);
      return expr.r;
   } else if (expr.F) { // function
      const args = [];
      for (let i = 0, n = expr.A.V.length; i < n; i++) {
         args.push(await evaluateNode(expr.A.V[i], data, cache));
      }
      expr.r = await evaluateFuncCall(expr.v, args, data, cache, expr.id);
      return expr.r;
   } else if ('v' in expr) { // literal
      if (typeof(expr.v) === 'number') {
         expr.r = expr.v;
         return expr.r;
      } else {
         expr.r = evaluateConstant(expr.v, cache);
         return expr.r;
      }
   } else if ('V' in expr) { // (...)
      expr.r = await evaluateNode(expr.V[0], data, cache);
      if (expr.id) cache[expr.id] = expr.r;
      return expr.r;
   } else return null;
}
function evaluateConstant(name, cache) {
   if (cache[name]) return cache[name];
   let v = null;
   switch(name) {
      case 'pi':
      case 'math.pi':
         v = Math.PI; break;
      case 'e':
      case 'math.e':
         v = Math.E; break;
      case 'inf':
      case 'math.inf':
         v = Infinity; break;
      case 'today':
         v = new Date().getTime(); break;
      default:
         v = null;
   }
   cache[name] = v;
   return v;
}
async function evaluateRef(cache, id) {
   if (cache[id]) return cache[id];
   return null;
}
function evaluateFlatFuncCallArgs(args) {
   const r = [];
   args.forEach(z => {
      if (Array.isArray(z)) {
         z.forEach(x => r.push(x));
      } else {
         r.push(z);
      }
   });
   return r;
}
const allowedBasicKey = ['C', 'O', 'H', 'L', 'V'];
const keyMap = {
   close: 'C',
   open: 'O',
   high: 'H',
   low: 'L',
   volume: 'V',
   vol: 'V',
   c: 'C',
   o: 'O',
   h: 'H',
   l: 'L',
   v: 'V',
};
async function evaluateQualifier(name, data, cache) {
   const qualified = {};
   const ps = name.split('.');
   const code = ps.shift();
   if (code) {
      const stockList = cache._stockList || (await databox.stock.getStockList()) || [];
      cache._stockList = stockList;
      const stock = stockList.find(z => z.code === code);
      if (stock) {
         qualified.data = cache[`_stock_${code}`] || (await databox.stock.getStockHistoryRaw(code)) || [];
         cache[`_stock_${code}`] = qualified.data;
      } else {
         qualified.data = [];
      }
   } else {
      qualified.data = data;
   }
   let cmd = ps.shift();
   switch(cmd) {
      case 'w':
      case 'weekly': {
         const k = `_stock_${code}_w`;
         qualified.data = cache[k] || dailyToWeekly(qualified.data);
         cache[k] = qualified.data;
         break; }
      case 'm':
      case 'monthly': {
         k = `_stock_${code}_m`;
         qualified.data = cache[k] || dailyToMonthly(qualified.data);
         cache[k] = qualified.data;
         break; }
      default: ps.unshift(cmd);
   }
   cmd = ps[0];
   if (!allowedBasicKey.includes(cmd)) cmd = keyMap[cmd];
   if (!allowedBasicKey.includes(cmd)) {
      qualified.err = `invalid "${ps[0]}"`;
      return qualified;
   }
   qualified.col = cmd;
   ps.shift();
   cmd = ps.shift();

   if (cmd) {
      // support .C.rsi6() > .C.rsi9()
      // rsiN, smaN
      let tr = false;
      if (cmd.startsWith('rsi')) {
         const win = parseInt(cmd.substring(3)) || 5;
         const key = `_stock_${code}_rsi${win}`;
         if (cache[key]) {
            qualified.data = cache[key];
         } else {
            const n = data.length;
            qualified.data = rsiIndex(data.map(z => z[qualified.col]), win);
            qualified.data = qualified.data.map((z, i) => ({ v: z, T: data[n-i-1]?.T }));
            qualified.data.reverse();
            cache[key] = qualified.data;
         }
         qualified.col = 'v';
         tr = true;
      } else if (cmd.startsWith('sma')) {
         const win = parseInt(cmd.substring(3)) || 5;
         const key = `_stock_${code}_sma${win}`;
         if (cache[key]) {
            qualified.data = cache[key];
         } else {
            const n = data.length;
            qualified.data = smaIndex(data.map(z => z[qualified.col]), win);
            qualified.data = qualified.data.map((z, i) => ({ v: z, T: data[n-i-1]?.T }));
            qualified.data.reverse();
            cache[key] = qualified.data;
         }
         cache[key] = qualified.data;
         qualified.col = 'v';
         tr = true;
      } else if (cmd.startsWith('cci')) {
         const win = parseInt(cmd.substring(3)) || 14;
         const key = `_stock_${code}_cci${win}`;
         if (cache[key]) {
            qualified.data = cache[key];
         } else {
            const n = data.length;
            qualified.data = cciIndex(
               data.map(z => z[qualified.col]),
               data.map(z => z.H),
               data.map(z => z.L),
               win
            );
            qualified.data = qualified.data.map((z, i) => ({ v: z, T: data[n-i-1]?.T }));
            qualified.data.reverse();
            cache[key] = qualified.data;
         }
         cache[key] = qualified.data;
         qualified.col = 'v';
         tr = true;
      } else if (cmd.startsWith('wr')) {
         const win = parseInt(cmd.substring(2)) || 6;
         const key = `_stock_${code}_wr${win}`;
         if (cache[key]) {
            qualified.data = cache[key];
         } else {
            const n = data.length;
            qualified.data = wrIndex(data.map(z => z[qualified.col]), win);
            qualified.data = qualified.data.map((z, i) => ({ v: z, T: data[n-i-1]?.T }));
            qualified.data.reverse();
            cache[key] = qualified.data;
         }
         cache[key] = qualified.data;
         qualified.col = 'v';
         tr = true;
      }
      if (tr) cmd = ps.shift();
   }

   qualified.func = cmd || `get${qualified.col}`;
   return qualified;
}
async function evaluateFuncCall(name, args, data, cache, id) {
   if (cache[id]) return cache[id];
   let v = null;
   if (!name) return null;
   let qualified = null;
   if (name.indexOf('.') >= 0 && !name.startsWith('math.')) {
      // .C(...) = .C.at(...), .close.at(...), .close.atrange(...), .weekly.close()
      // sh600001.C.at(...)
      qualified = await evaluateQualifier(name, data, cache);
      if (qualified.err) {
         // TODO handle evaulate error
         cache[id] = null;
         return null;
      }
      data = qualified.data || [];
      name = qualified.func;
   }
   switch(name) {
      case 'at':
      case 'getC': // = .C.at
      case 'getO': // = .O.at
      case 'getH': // = .H.at
      case 'getL': // = .L.at
      case 'getV': // = .V.at
      case 'getv': // = .v.at
      {
         // args = [ts1, ts2, ...], args = [["i", i1, i2], ts1, ...]
         v = [];
         if (!args.length) args = [["i", 0]];
         args.forEach(z => {
            if (Array.isArray(z)) {
               if (z[0] === 'i') {
                  const n = data.length;
                  z.forEach((y, i) => {
                     if (i === 0) return;
                     const item = n > y ? data[n+y-1] : null;
                     v.push(item ? item[qualified.col] : NaN);
                  });
               } else {
                  z.forEach(y => {
                     const item = data.find(x => x.T === y);
                     v.push(item ? item[qualified.col] : NaN);
                  });
               }
            } else {
               const item = data.find(x => x.T === z);
               v.push(item ? item[qualified.col] : NaN);
            }
         });
         break; }
      case 'atrange':
      {
         // args = [[ts1, ts2], ...], args = [["i", i1, i2], ...]
         if (args.length === 2) args = [[args[0], args[1]]];
         v = [];
         args.forEach(pair => {
            if (!Array.isArray(pair)) {
               // TODO evaulate error;
               cache[id] = null;
               return null;
            }
            if (pair[0] === "i") {
               const n = data.length;
               const ia = n - 1 + pair[1];
               const ib = n - 1 + pair[2];
               data.slice(ia, ib+1).forEach(x => v.push(x ? x[qualified.col] : NaN));
            } else {
               const tsa = pair[0];
               const tsb = pair[1];
               // XXX should we pad NaN if for example tsa no data
               // [tsa, tsb] = [1 2 3 4 5 6 7 8 9]
               //            =     [3 4 5 6 7 8]   <-- currently we implement as this
               //            = [x x 3 4 5 6 7 8 x]
               data.filter(x => x.T >= tsa && x.T <= tsb).forEach(x => v.push(x ? x[qualified.col] : NaN));
            }
         });
         break; }
      // 0
      case 'pi':
      case 'math.pi':
         v = Math.PI;
         cache[name] = v;
         break;
      case 'e':
      case 'math.e':
         v = Math.E;
         cache[name] = v;
         break;
      case 'rnd':
      case 'random':
      case 'math.rnd':
      case 'math.random':
         return Math.random(); // no cache
      case 'today':
         args = evaluateFlatFuncCallArgs(args);
         v = getDateTs(new Date());
         if (args.length) v = args.map(z => v + dayms * z);
         break;
      case 'day': {
         const d = new Date();
         v = getDateTs(d);
         if (!args.length) args = [0];
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => v + z * dayms);
         break; }
      case 'thisweek': {
         const d = new Date();
         const wd = d.getDay();
         v = getDateTs(d);
         v = [0, 0];
         v[0] = v - wd * dayms;
         v[1] = v[0] + 7 * dayms;
         if (!args.length) args = [0];
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => [v[0] + 7 * dayms * z, v[1] + 7 * dayms * (z + 1)]);
         break; }
      case 'week': {
         const d = new Date();
         v = getDateTs(d);
         v = [v - 7 * dayms, v];
         if (!args.length) args = [0];
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => [v[0] + 7 * dayms * z, v[1] + 7 * dayms * (z + 1)]);
         break; }
      case 'thismonth': {
         const d = new Date();
         const wd = d.getDate();
         v = getDateTs(d);
         v = [0, 0];
         v[0] = v - (wd - 1) * dayms;
         v[1] = nextMonthTs(d);
         if (!args.length) args = [0];
         args = evaluateFlatFuncCallArgs(args);
         const y = d.getFullYear();
         const m = d.getMonth()+1;
         v = args.map(z => {
            const dy = Math.floor(z/12);
            const dm = z % 12;
            const td = new Date(`${y+dy}-${pad0(m+dm)}-01`);
            return [td.getTime(), nextMonthTs(td)];
         });
         break; }
      case 'month': {
         const d = new Date();
         v = getDateTs(d);
         v = [v - 30 * dayms, v];
         if (!args.length) args = [0];
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => [v[0] + 30 * dayms * z, v[1] + 30 * dayms * (z + 1)]);
         break; }
      case 'thisyear': {
         const d = new Date();
         const y = d.getFullYear();
         v = getDateTs(d);
         v = [0, 0];
         v[0] = new Date(`${y}-01-01`).getTime();
         v[1] = new Date(`${y+1}-01-01`).getTime();
         if (!args.length) args = [0];
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => {
            const L = new Date(`${y+z}-01-01`).getTime();
            const H = new Date(`${y+z+1}-01-01`).getTime();
            return [L, H];
         });
         break; }
      case 'year': {
         const d = new Date();
         v = getDateTs(d);
         v = [v - 365 * dayms, v];
         if (!args.length) args = [0];
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => [v[0] + 365 * dayms * z, v[1] + 365 * dayms * (z + 1)]);
         break; }
      case 'index': {
         // .close.atrange(index(-20, 0)) -20 = about trade month, 0 = latest trade day
         args = evaluateFlatFuncCallArgs(args);
         v = args.slice();
         v.unshift('i');
         break; }
      case 'flat':
         v = flatList(args); break;
      // 1
      case 'sum':
      case 'math.sum':
         args = evaluateFlatFuncCallArgs(args);
         v = args.reduce((a, b) => a+b, 0); break;
      case 'avg':
      case 'math.avg':
      case 'average':
      case 'math.average':
         args = evaluateFlatFuncCallArgs(args);
         v = args.reduce((a, b) => a+b, 0)/args.length; break;
      case 'norm':
      case 'math.norm': {
         args = evaluateFlatFuncCallArgs(args);
         const max = Math.max(...args);
         const min = Math.min(...args);
         const dm = max - min;
         if (dm === 0) {
            v = args.map(_ => 1.0);
         } else {
            v = args.map(z => (z - min) / dm);
         }
         break;
      }
      case 'softmax':
      case 'math.softmax':
         args = evaluateFlatFuncCallArgs(args);
         v = args.reduce((a, b) => a+b, 0);
         v = args.map(z => z / v); break;
      case 'abs':
      case 'math.abs':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.abs(z)); break;
      case 'round':
      case 'math.round':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.round(z)); break;
      case 'ceil':
      case 'math.ceil':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.ceil(z)); break;
      case 'floor':
      case 'math.floor':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.floor(z)); break;
      case 'max':
      case 'math.max':
         args = evaluateFlatFuncCallArgs(args);
         v = Math.max(...args); break;
      case 'min':
      case 'math.min':
         args = evaluateFlatFuncCallArgs(args);
         v = Math.min(...args); break;
      case 'count':
      case 'math.count':
         args = evaluateFlatFuncCallArgs(args);
         v = args.length; break;
      case 'count1':
      case 'math.count1':
         args = evaluateFlatFuncCallArgs(args);
         v = args.filter(z => !!z).length; break;
      case 'count0':
      case 'math.count0':
         args = evaluateFlatFuncCallArgs(args);
         v = args.filter(z => !z).length; break;
      case 'sin':
      case 'math.sin':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.sin(z)); break;
      case 'cos':
      case 'math.cos':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.cos(z)); break;
      case 'sqrt':
      case 'math.sqrt':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.sqrt(z)); break;
      case 'exp':
      case 'math.exp':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.exp(z)); break;
      case 'ln':
      case 'math.ln':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.log(z) / Math.log(Math.E)); break;
      case 'arctan':
      case 'math.arctan':
         args = evaluateFlatFuncCallArgs(args);
         v = args.map(z => Math.atan(z)); break;
      case 'dft':
      case 'math.dft':
         args = evaluateFlatFuncCallArgs(args);
         v = ft.dft(args).map(z => ft.complex.magnitude(z)); break;
      case 'leastsquare':
      case 'math.leastsquare':
         args = evaluateFlatFuncCallArgs(args);
         const kb = lr(args);
         v = kb ? [kb.k, kb.b] : null;
         break;
      // 2
      case 'slice': {
         const list = Array.isArray(args[0]) ? args[0] : [];
         const stI = isNaN(args[1]) ? 0 : args[1];
         const edI = isNaN(args[2]) ? list.length : args[2];
         v = list.slice(stI, edI);
         break; }
      case 'polylineize': {
         const list = Array.isArray(args[0]) ? args[0] : [];
         const win = isNaN(args[1]) ? 20 : args[1];
         v = polylineize(list, win);
         break; }
      case 'threshold': {
         const list = Array.isArray(args[0]) ? args[0] : [];
         const downv = isNaN(args[1]) ? 0 : args[1];
         const upv = isNaN(args[2]) ? 1 : args[2];
         v = list.map(z => z < downv ? downv : (z > upv ? upv : z) );
         break; }
      case 'pow':
      case 'math.pow':
         v = evaluateOp('^', [args[0], args[1]], data, cache, id); break;
      case 'log':
      case 'math.log':
         v = evaluateOp('_log', [args[0], args[1]], data, cache, id); break;
      case 'debug':
         console.log('[debug] calc -', args);
         v = args; break;
      default:
         v = null;
   }
   if (Array.isArray(v)) {
      if (v.length === 0) v = null;
      else if (v.length === 1) v = v[0];
   }
   cache[id] = v;
   return v;
}
function evaluateOp(op, vals, data, cache, id) {
   if (cache[id]) return cache[id];
   const op1 = vals[0];
   const op2 = vals[1];
   const op1isArr = Array.isArray(op1);
   const op2isArr = Array.isArray(op2);
   let v = null;
   if (!op1isArr && !op2isArr) {
      // TODO check +/-, not
      v = evaluateOpVal(op, op1, op2);
   } else if (op1isArr && op2isArr) {
      v = evaluateOpArr(op, op1, op2);
   } else if (op1isArr && !op2isArr) {
      v = evaluateOp1Arr(op, op1, op2);
   } else /*if (!op1isArr && op2isArr)*/ {
      v = evaluateOp2Arr(op, op1, op2);
   }
   cache[id] = v;
   return v;
}
function evaluateOpVal(op, op1, op2) {
   switch(op) {
      case '+': return op1 === null ? op2 : (op1 + op2);
      case '-': return op1 === null ? (-op2) : (op1 - op2);
      case '*': return op1 * op2;
      case '/': return op1 / op2;
      case '^': return Math.pow(op1, op2);
      case '>': return op1 > op2;
      case '<': return op1 < op2;
      case '=': return op1 === op2;
      case 'and': return (!!op1 && !!op2);
      case 'or': return (!!op1 || !!op2);
      case 'not':  return !op2;
      case '_log': return Math.log(op1, op2);
      default: return null;
   }
}
function evaluateOp1Arr(op, op1arr, op2) {
   switch(op) {
      case '+': return op1arr.map(z => z + op2);
      case '-': return op1arr.map(z => z - op2);
      case '*': return op1arr.map(z => z * op2);
      case '/': return op1arr.map(z => z / op2);
      case '^': return op1arr.map(z => Math.pow(z, op2));
      case '>': return op1arr.map(z => z > op2);
      case '<': return op1arr.map(z => z < op2);
      case '=': return op1arr.map(z => z === op2);
      case 'and': return op1arr.map(z => !!(z && op2));
      case 'or': return op1arr.map(z => !!(z || op2));
      case 'not':  return op1arr.map(z => !z);
      case '_log': return op1arr.map(z => Math.log(z, op2));
      default: return null;
   }
}
function evaluateOp2Arr(op, op1, op2arr) {
   switch(op) {
      case '+': return op2arr.map(z => op1 + z);
      case '-': return op2arr.map(z => op1 - z);
      case '*': return op2arr.map(z => op1 * z);
      case '/': return op2arr.map(z => op1 / z);
      case '^': return op2arr.map(z => Math.pow(op1, z));
      case '>': return op2arr.map(z => op1 > z);
      case '<': return op2arr.map(z => op1 < z);
      case '=': return op2arr.map(z => op1 === z);
      case 'and': return op2arr.map(z => !!(op1 && z));
      case 'or': return op2arr.map(z => !!(op1 || z));
      case 'not':  return op2arr.map(z => !z);
      case '_log': return op1arr.map(z => Math.log(op1, z));
      default: return null;
   }
}
function evaluateOpArr(op, op1arr, op2arr) {
   const r = [];
   const n1m1 = op1arr.length-1;
   const n2m1 = op2arr.length-1;
   switch(op) {
      case '+': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(op1arr[i] + op2arr[j]); break; }
      case '-': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(op1arr[i] - op2arr[j]); break; }
      case '*': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(op1arr[i] * op2arr[j]); break; }
      case '/': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(op1arr[i] / op2arr[j]); break; }
      case '^': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(Math.pow(op1arr[i], op2arr[j])); break; }
      case '>': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(op1arr[i] > op2arr[j]); break; }
      case '<': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(op1arr[i] < op2arr[j]); break; }
      case '=': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(op1arr[i] === op2arr[j]); break; }
      case 'and': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(!!(op1arr[i] && op2arr[j])); break; }
      case 'or': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(!!(op1arr[i] || op2arr[j])); break; }
      case 'not': return op2arr.map(z => !z);
      case '_log': { for (let i = n1m1, j = n2m1; i >= 0 && j >= 0; i--, j--) r.unshift(Math.log(op1arr[i], op2arr[j])); break; }
      default: return null;
   }
   return r;
}

// type = 0: unknown, 1: single, 2: array, 3: daily, 4: weekly, 5: monthly, 6: yearly
const TYPE = {
   UNKNOWN: 0,
   SINGLE: 1,
   ARRAY: 2,
   DAILY: 3,
   WEEKLY: 4,
   MONTHLY: 5,
   YEARLY: 6,
}
async function evaluateType(expr, opt) {
   opt = opt || {};
   return await evaluateNodeType(expr.V[0],opt.cache || {});
}
async function evaluateNodeType(expr, cache) {
   if (!expr) return TYPE.UNKNOWN;
   if (expr.op) { // operator
      const args = [];
      for (let i = 0, n = expr.V.length; i < n; i++) {
         args.push(await evaluateNodeType(expr.V[i], cache));
      }
      expr.r = await evaluateOpType(expr.op, args, cache, expr.id);
      return expr.r;
   } else if (expr.ref) { // ref
      expr.r = await evaluateRefType(cache, expr.id);
      return expr.r;
   } else if (expr.F) { // function
      const args = [];
      for (let i = 0, n = expr.A.V.length; i < n; i++) {
         args.push(await evaluateNodeType(expr.A.V[i], cache));
      }
      expr.r = await evaluateFuncCallType(expr.v, args, cache, expr.id);
      return expr.r;
   } else if ('v' in expr) { // literal
      expr.r = TYPE.SINGLE;
      return expr.r;
   } else if ('V' in expr) { // (...)
      expr.r = await evaluateNodeType(expr.V[0], cache);
      if (expr.id) cache[expr.id] = expr.r;
      return expr.r;
   } else return TYPE.UNKNOWN;
}
async function evaluateRefType(cache, id) {
   if (cache[id]) return cache[id];
   return TYPE.UNKNOWN;
}
async function evaluateQualifierType(name, cache) {
   const qualified = {};
   const ps = name.split('.');
   ps.shift(); // code
   let cmd = ps.shift();
   switch(cmd) {
      case 'w':
      case 'weekly':
         qualified.data = TYPE.WEEKLY; break;
      case 'm':
      case 'monthly':
         qualified.data = TYPE.MONTHLY; break;
      default:
         qualified.data = TYPE.DAILY;
         ps.unshift(cmd);
   }
   cmd = ps[0];
   if (!allowedBasicKey.includes(cmd)) cmd = keyMap[cmd];
   if (!allowedBasicKey.includes(cmd)) {
      qualified.err = `invalid "${ps[0]}"`;
      return qualified;
   }
   ps.shift();
   cmd = ps.shift();

   if (cmd) {
      // support .C.rsi6() > .C.rsi9()
      // rsiN, smaN, cciN, wrN
      let tr = false;
      if (cmd.startsWith('rsi')) {
         tr = true;
      } else if (cmd.startsWith('sma')) {
         tr = true;
      } else if (cmd.startsWith('cci')) {
         tr = true;
      } else if (cmd.startsWith('wr')) {
         tr = true;
      }
      if (tr) cmd = ps.shift();
   }

   qualified.func = cmd || `get${qualified.col}`;
   return qualified;
}
async function evaluateFuncCallType(name, args, cache, id) {
   if (cache[id]) return cache[id];
   let v = TYPE.UNKNOWN;
   if (!name) return TYPE.UNKNOWN;
   let qualified = null;
   if (name.indexOf('.') >= 0 && !name.startsWith('math.')) {
      // .C(...) = .C.at(...), .close.at(...), .close.atrange(...), .weekly.close()
      // sh600001.C.at(...)
      qualified = await evaluateQualifierType(name, cache);
      if (qualified.err) {
         // TODO handle evaulate error
         cache[id] = TYPE.UNKNOWN;
         return TYPE.UNKNOWN;
      }
      name = qualified.func;
      switch (name) {
      case 'at':
      case 'getC': // = .C.at
      case 'getO': // = .O.at
      case 'getH': // = .H.at
      case 'getL': // = .L.at
      case 'getV': // = .V.at
      case 'getv': // = .v.at
         cache[id] = TYPE.ARRAY;
         return TYPE.ARRAY;
      case 'atrange':
         cache[id] = qualified.data;
         return qualified.data;
      }
   }
   switch(name) {
      case 'day':
      case 'thisweek':
      case 'week':
      case 'thismonth':
      case 'month':
      case 'thisyear':
      case 'year':
      case 'index':
      case 'leastsquare':
      case 'math.leastsquare':
         v = TYPE.ARRAY; break;
      case 'flat':
         v = Math.max(...args); if (v < 0) v = TYPE.UNKNOWN; break;
      case 'pi':
      case 'math.pi':
      case 'e':
      case 'math.e':
      case 'rnd':
      case 'random':
      case 'math.rnd':
      case 'math.random':
      case 'today':
      case 'sum':
      case 'math.sum':
      case 'avg':
      case 'math.avg':
      case 'average':
      case 'math.average':
      case 'max':
      case 'math.max':
      case 'min':
      case 'math.min':
      case 'count':
      case 'math.count':
      case 'count1':
      case 'math.count1':
      case 'count0':
      case 'math.count0':
         v = TYPE.SINGLE; break;
      case 'norm':
      case 'math.norm':
      case 'softmax':
      case 'math.softmax':
      case 'abs':
      case 'math.abs':
      case 'round':
      case 'math.round':
      case 'ceil':
      case 'math.ceil':
      case 'floor':
      case 'math.floor':
      case 'sin':
      case 'math.sin':
      case 'cos':
      case 'math.cos':
      case 'sqrt':
      case 'math.sqrt':
      case 'exp':
      case 'math.exp':
      case 'ln':
      case 'math.ln':
      case 'arctan':
      case 'math.arctan':
      case 'dft':
      case 'math.dft':
         args = evaluateFlatFuncCallArgs(args);
         v = Math.max(...args); if (v < 0) v = TYPE.UNKNOWN; break;
      case 'slice':
      case 'polylineize':
      case 'threshold':
         v = args[0] || TYPE.UNKNOWN; break;
      case 'pow':
      case 'math.pow':
         v = evaluateOpType('^', [args[0], args[1]], cache, id); break;
      case 'log':
      case 'math.log':
         v = evaluateOpType('_log', [args[0], args[1]], cache, id); break;
      case 'debug':
         v = args; break;
      default:
         v = TYPE.UNKNOWN;
   }
   cache[id] = v;
   return v;
}
function evaluateOpType(op, vals, cache, id) {
   if (cache[id]) return cache[id];
   const op1T = vals[0];
   const op2T = vals[1];
   if (op === 'not') {
      return op2T;
   } else {
      return op1T > op2T ? op1T : op2T;
   }
}

const api = {
   tokenize,
   compile,
   evaluate,
   evaluateType,
};
window._debugCalc = api;
export default api;
