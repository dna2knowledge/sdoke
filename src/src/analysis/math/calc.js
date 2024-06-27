//import databox from '$/service/databox';

export const version = '0.1';

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

function compile(tokens) {
   const obj = { V: [] };
   const stat = { cache: {}, i: 1, err: [] };
   compileSub(tokens, 0, obj, stat);
   if (stat.err.length) return { err: stat.err };
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
            valS.push({ op: 'ref', id });
         } else {
            id = `_${stat.i++}`;
            stat.cache[sig] = id;
            valS.push({ op: lastOp, V: [op1, op2], id });
         }
      }
      opS.pop();
      lastOp = opS[opS.length-1];
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
         const sub = { func: ms === 1, V: [] };
         const last = valS[valS.length-1];
         if (ms === 1) { // func
            last.F = true;
            last.A = sub;
         }
         ms = 1;
         i = compileSub(tokens, i+1, sub, stat);
         if (ms === 1) { // func
            const sig = `${last.v}@${sub.V.map(z => `${z.id || z.v}`).join('@')}`;
            let id = stat.cache[sig];
            if (id) {
               valS.pop();
               valS.push({ op: 'ref', id });
            } else {
               id = `_${stat.i ++}`;
               stat.cache[sig] = id;
               last.id = id;
            }
         } else {
            const sig = `()@${sub.V.map(z => `${z.id || z.v}`).join('@')}`;
            let id = stat.cache[sig];
            if (id) {
               valS.push({ op: 'ref', id });
            } else {
               id = `_${stat.i ++}`;
               stat.cache[sig] = id;
               sub.id = id;
               valS.push(sub);
            }
         }
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

async function evaluate(expr, data) {
   return await evaluateNode(expr.V[0], data, {});
}
async function evaluateNode(expr, data, cache) {
   if (!expr) return null;
   if (expr.op) {
      const args = [];
      for (let i = 0, n = expr.V.length; i < n; i++) {
         args.push(await evaluateNode(expr.V[i], data, cache));
      }
      expr.r = await evaluateOp(expr.op, args, data, cache, expr.id);
      return expr.r;
   } else if (expr.ref) {
      expr.r = await evaluateRef(cache, expr.id);
      return expr.r;
   } else if (expr.F) {
      const args = [];
      for (let i = 0, n = expr.A.length; i < n; i++) {
         args.push(await evaluateNode(expr.A[i], data, cache));
      }
      expr.r = await evaluateFuncCall(expr.v, args, data, cache, expr.id);
      return expr.r;
   } else if ('v' in expr) {
      if (typeof(expr.v) === 'number') {
         expr.r = expr.v;
         return expr.r;
      } else {
         expr.r = evaluateConstant(expr.v, cache);
         return expr.r;
      }
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
async function evaluateFuncCall(name, args, data, cache, id) {
   if (cache[id]) return cache[id];
   let v = null;
   /* TODO:
      .C.at(day(0))
      .C.atrange(day(-20), today)
      .weekly.close.at(thisweek(-1)) # get weekly close price for last week
   */
   switch(name) {
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
      // 1
      case 'sum':
      case 'math.sum':
         args = evaluateFlatFuncCallArgs(args);
         v = args.reduce((a, b) => a+b, 0); break;
      case 'avg':
      case 'math.avg':
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
      // 2
      case 'pow':
      case 'math.pow':
         v = evaluateOp('^', [args[0], args[1]], data, cache, id); break;
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
      evaluateOpArr(op, op1, op2);
   } else if (op1isArr && !op2isArr) {
      evaluateOp1Arr(op, op1, op2);
   } else /*if (!op1isArr && op2isArr)*/ {
      evaluateOp2Arr(op, op1, op2);
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
      default: return null;
   }
   return r;
}

const api = {
   tokenize,
   compile,
   evaluate,
};
export default api;
