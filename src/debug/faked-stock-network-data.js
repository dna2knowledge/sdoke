const { wait } = require('../util/wait');
const { util } = require('../service/stock-network-data');

const stat = {
   progress: {
      list: {
      },
   },
};

async function getShList() {
   stat.progress.list.sh = { p: 0, ts: new Date().getTime() };
   stat.progress.list.sh.p = 1;
   await wait(Math.round(Math.random() * 5) * 1000);
   return [
      { code: 'sh600001', name: 'test1sh' },
      { code: 'sh600002', name: 'test2sh' },
      { code: 'sh900003', name: 'test3sh' },
      { code: 'sh688004', name: 'test4sh' },
   ];
}

async function getSzList() {
   stat.progress.list.sh = { p: 0, ts: new Date().getTime() };
   stat.progress.list.sh.p = 1;
   await wait(Math.round(Math.random() * 5) * 1000);
   return [
      { code: 'sz000001', name: 'test1sz' },
      { code: 'sz000002', name: 'test2sz' },
      { code: 'sz200003', name: 'test3sz' },
      { code: 'sz300004', name: 'test4sz' },
   ];
}

async function getBjList() {
   stat.progress.list.sh = { p: 0, ts: new Date().getTime() };
   stat.progress.list.sh.p = 1;
   await wait(Math.round(Math.random() * 5) * 1000);
   return [
      { code: 'bj600001', name: 'test1bj' },
      { code: 'bj600002', name: 'test2bj' },
      { code: 'bj900003', name: 'test3bj' },
      { code: 'bj688004', name: 'test4bj' },
   ];
}

async function getHistoryFromTencent(code, startDate) {
   let t = (startDate || new Date()).getTime();
   const r = [];
   for (let i = 0; i < 600; i++) {
      const item = { T: t, O: 4 + Math.random(), C: 4 + Math.random(), H: 0, L: 0, V: Math.round(10000 * Math.random()), m: 0 };
      item.H = Math.max(item.O, item.C) + Math.random();
      item.L = Math.min(item.O, item.C) - Math.random();
      item.m = (item.H + item.L) / 2 * item.V;
      t -= 3600 * 1000 * 24;
      r.unshift(item);
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

const api = {
   getShList,
   getSzList,
   getBjList,
   tencent: {
      getRt: getRtFromTencent,
      getHistory: getHistoryFromTencent,
   },
   util,
};

module.exports = api;
