import db from '$/service/db';
import stockNet from '$/service/stock-network-data';
import makePromise from '$/util/make-promise';
import { getDateTodayTs } from '$/util/date';

const dayms = 24 * 3600 * 1000;

const stat = {
   active: false,
   activeTs: 0,
   activeBusy: false,
   progress: {},
};

function checkAcitveToday() {
   if (stat.activeBusy) return;
   stat.activeBusy = true;
   const ts = getDateTodayTs();
   const today = new Date(ts);
   const wd = today.getDay();
   if (wd === 0 || wd === 6) {
      if (stat.activeTs !== ts) {
         stat.active = false;
         stat.activeTs = ts;
      }
   } else {
      const now = new Date();
      if (
         (now.getHours() < 9 || now.getHours() >= 15) ||
         (now.getHours() === 9 && now.getMinutes() < 30) ||
         (now.getHours() > 11 && now.getHours() < 13) ||
         (now.getHours() === 11 && now.getMinutes() >= 30)
      ) {
         stat.active = false;
         stat.activeTs = now.getTime();
      } else {
         stat.active = true;
         stat.activeTs = now.getTime();
      }
   }
   setTimeout(() => {
      stat.activeBusy = false;
      checkAcitveToday();
   }, 1000 * 30);
}
// start to check active today
checkAcitveToday();

const stockApi = {
    getTradeActive: () => stat.active,
    getStockList: () => db.get("stock.list"),
    setStockList: (list) => db.set("stock.list", list),
    getPinnedStockList: () => db.get("stock.list.pinned"),
    setPinnedStockList: (list) => db.set("stock.list.pinned", list),
    getStockRealtime: (codes) => stockNet.tencent.getRt(codes),
    updateStockHistory: async (code) => {
        const key = `stock.one.${code}.history`;
        if (stat.progress[key]) return await stat.progress[key].promise;
        stat.progress[key] = makePromise();
        let newh;
        try {
            const history = (await db.get(key)) || [];
            let startDate = null;
            if (history.length) {
                const last = history[history.length-1];
                startDate = last.T;
            }
            const h = await stockNet.tencent.getHistory(code, startDate);
            h.forEach((z) => z && history.push(z));
            history.sort((a, b) => a.T - b.T);
            let dupT;
            newh = history.reduce((a, z) => {
                if (!z || !z.T || z.T === dupT) return a;
                dupT = z.T;
                a.push(z);
                return a;
            }, []);
            await db.set(key, newh);
            stat.progress[key].r(newh);
        } catch (_) {
            // XXX: handle error
            stat.progress[key].r(null);
        }
        delete stat.progress[key];
        return newh;
    },
    getStockHistoryRaw: (code) => db.get(`stock.one.${code}.history`),
    setStockHistoryRaw: (code, list) => db.set(`stock.one.${code}.history`, list),
    getStockHistory: async (code, endDateTs) => {
        if (!code) return null;
        const key = `stock.one.${code}.history`;
        const history = await db.get(key);

        // if history is empty
        if (!history || !history.length) return await stockApi.updateStockHistory(code);

        // if history is behind the date
        const last = history[history.length-1];
        const ts = endDateTs ? new Date(endDateTs) : new Date(getDateTodayTs());
        const tsv = ts.getTime();
        const wd = ts.getDay();
        if (tsv > last.T) {
           if (wd === 0 && tsv - last.T > 2 * dayms) return await stockApi.updateStockHistory(code);
           else if (wd === 6 && tsv - last.T > 1 * dayms) return await stockApi.updateStockHistory(code);
           // TODO: if update history and find no today's data, stop next update till today's end market time 15:00
           else if (wd !== 0 && wd !== 6) return await stockApi.updateStockHistory(code);
        }

        return history;
    },
    getStockStrategyList: () => db.get("stock.strategy.list"),
    setStockStrategyList: (list) => db.set("stock.strategy.list", list),
    getStockStrategy: async (name) => {
      const list = await stockApi.getStockStrategyList();
      return list.find(z => z.name === name);
    },
    setStockStrategy: async (name, stg) => {
      const list = await stockApi.getStockStrategyList();
      const item = list.find(z => z.name === name);
      if (item) {
         const i = list.indexOf(item);
         list.splice(i, 1, stg);
         await stockApi.setStockStrategyList(list);
      }
      return item;
    },
    getStockTradeYears: () => db.get('stock.trade.list.years'),
    setStockTradeYears: (list) => db.set('stock.trade.list.years', list),
    getStockTradeList: (year) => db.get(`stock.trade.list.${year}`),
    setStockTradeList: (year, list) => db.set(`stock.trade.list.${year}`, list),
    getStockTradeWatchYears: () => db.get('stock.tradewatch.list.years'),
    setStockTradeWatchYears: (list) => db.set('stock.tradewatch.list.years', list),
    getStockTradeWatchList: (year) => db.get(`stock.tradewatch.list.${year}`),
    setStockTradeWatchList: (year, list) => db.set(`stock.tradewatch.list.${year}`, list),
};

const api = {
    stock: stockApi,
};

export default api;