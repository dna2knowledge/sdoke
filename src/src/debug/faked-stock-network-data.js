import { wait } from '$/util/wait';

const stat = {
   progress: {
      list: {
      },
   },
};

async function getHistoryFromTencent(code, startDate) {
   let t = (startDate || new Date()).getTime() - 600 * 3600 * 1000 * 24;
   const r = [];
   let last = { O: Math.random() * 200 };
   last.C = last.O * (1 + Math.random() * 0.2 - 0.1);
   for (let i = 0; i < 600; i++) {
      const item = { T: t, O: last.C * (1 + Math.random() * 0.05 - 0.025), C: 0, H: 0, L: 0, V: Math.round(10000 * Math.random()), m: 0 };
      const rate = Math.random() * 0.2 - 0.1;
      item.C = item.O * (1 + rate);
      item.H = Math.max(item.O, item.C) * (1 + rate + Math.random() * (0.1-rate));
      item.L = Math.min(item.O, item.C) * (1 + rate + Math.random() * (-0.1-rate));
      if (item.H < Math.max(item.O, item.C)) item.H = Math.max(item.O, item.C);
      if (item.L > Math.min(item.O, item.C)) item.L = Math.min(item.O, item.C);
      item.m = (item.H + item.L) / 2 * item.V;
      t += 3600 * 1000 * 24;
      last = item;
      r.push(item);
   }
   await wait(Math.round(Math.random() * 3) * 1000);
   return r;
}

async function getRtFromTencent(codes) {
   try {
      if (!codes || !codes.length) return [];
      await wait(Math.round(Math.random() * 3) * 1000);
      const ret = [{}];
      return ret;
   } catch(_) {
      return [];
   }
}

function utilIsShKc(code) {
   return code.startsWith('sh688');
}
function utilIsSzCy(code) {
   return code.startsWith('sz3');
}
function utilIsB(code) {
   if (code.startsWith('sz')) return code.startsWith('sz2');
   if (code.startsWith('sh')) return code.startsWith('sh9');
   return false;
}
function utilIsST(code, name) {
   return name.indexOf('ST') >= 0;
}
function utilIsD(code, name) {
   return name.indexOf('XD') >= 0 || name.indexOf('DR') >= 0;
}
function utilIsR(code, name) {
   return name.indexOf('XR') >= 0 || name.indexOf('DR') >= 0;
}

const api = {
   tencent: {
      getRt: getRtFromTencent,
      getHistory: getHistoryFromTencent,
   },
   util: {
      isKc: utilIsShKc,
      isCy: utilIsSzCy,
      isB: utilIsB,
      isST: utilIsST,
      isD: utilIsD,
      isR: utilIsR,
   }
};

window._debugStockNetworkData = api;

export default api;
