import { wait } from '$/util/wait';

const stat = {
   progress: {
      list: {
      },
   },
};

function dateDayGate(date) {
   const t = date || new Date();
   return t - t % (24 * 3600 * 1000);
}

async function getHistoryFromTencent(code, startDate) {
   let t = dateDayGate(startDate) - 600 * 3600 * 1000 * 24;
   const today = dateDayGate();
   const r = [];
   let last = { O: Math.random() * 200 };
   last.C = last.O * (1 + Math.random() * 0.2 - 0.1);
   for (let i = 0; t <= today; i++) {
      const wd = new Date(t).getDay();
      if (wd === 0 || wd === 6) {
         t += 3600 * 1000 * 24;
         continue;
      }
      const item = { T: t, O: last.C * (1 + Math.random() * 0.05 - 0.025), C: 0, H: 0, L: 0, V: Math.round(10000 * Math.random()), m: 0 };
      const rate = Math.random() * 0.2 - 0.1;
      item.C = item.O * (1 + rate);
      item.H = Math.max(item.O, item.C) * (1 + rate + Math.random() * (0.1-rate));
      item.L = Math.min(item.O, item.C) * (1 + rate + Math.random() * (-0.1-rate));
      if (item.H < Math.max(item.O, item.C)) item.H = Math.max(item.O, item.C);
      if (item.L > Math.min(item.O, item.C)) item.L = Math.min(item.O, item.C);
      item.s = Math.random() * 100;
      item.m = (item.H + item.L) / 2 * item.V;
      t += 3600 * 1000 * 24;
      last = item;
      r.push(item);
   }
   //await wait(Math.round(Math.random() * 3) * 1000);
   return r;
}

async function getRtFromTencent(codes) {
   try {
      if (!codes || !codes.length) return [];
      await wait(Math.round(Math.random() * 3) * 1000);
      const ts = dateDayGate();
      const O = 100*Math.random()
      const C = 100*Math.random()
      return codes.map(z => {
         return {
            code: z,
            name: '????',
            T: ts,
            O, C,
            L: Math.min(O, C) * (1 - Math.random() * 0.1),
            H: Math.min(O, C) * (1 + Math.random() * 0.1),
            V: Math.random() * 10000,
            s: Math.random() * 100,
         };
      });
   } catch(_) {
      return [];
   }
}

async function getPopularRankingFromEastmoney(code) {
   if (code) {
      return [{
         sc: code.toUpperCase(), rk: 1, rc: 0, histRc: 0,
         history: [
            { calcTime: '2024-11-01', rank: 5 },
            { calcTime: '2024-11-02', rank: 4 },
            { calcTime: '2024-11-03', rank: 3 },
            { calcTime: '2024-11-04', rank: 2 },
            { calcTime: '2024-11-05', rank: 1 },
         ]
      },]
   }
   return [
      {
         sc: 'SH000001', rk: 1, rc: 0, histRc: 0,
         label: [
            { labelType: 1, indicatorType: '', boardCodeBK: null, labelName: '3天3板' },
            { labelType: 2, indicatorType: null, boardCodeBK: 'BK1115', labelName: '跨境电商' }
         ]
      },
      {
         sc: 'SH000002', rk: 1, rc: 0, histRc: 0,
         label: [
            { labelType: 1, indicatorType: '', boardCodeBK: null, labelName: '3天3板' },
            { labelType: 2, indicatorType: null, boardCodeBK: 'BK1115', labelName: '跨境电商' }
         ]
      },
      {
         sc: 'SH000003', rk: 1, rc: 0, histRc: 0,
         label: [
            { labelType: 1, indicatorType: '', boardCodeBK: null, labelName: '3天3板' },
            { labelType: 2, indicatorType: null, boardCodeBK: 'BK1115', labelName: '跨境电商' }
         ]
      },
   ];
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
   eastmoney: {
      getPopularRanking: getPopularRankingFromEastmoney,
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
