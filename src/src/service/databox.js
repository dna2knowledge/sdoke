import db from '$/service/db';
import stockNet from '$/service/stock-network-data';
import makePromise from '$/util/make-promise';
import { getDateTodayTs } from '$/util/date';

const stat = {
    progress: {},
};

const stockApi = {
    getStockList: () => db.get("stock.list"),
    setStockList: (list) => db.set("stock.list", list),
    getPinnedStockList: () => db.get("stock.list.pinned"),
    setPinnedStockList: (list) => db.set("stock.list.pinned", list),
    getStockRealtime: (codes) => stockNet.stock.tencent.getRt(codes),
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
    getStockHistory: async (code) => {
        const key = `stock.one.${code}.history`;
        const history = await db.get(key);

        // if history is empty
        if (!history || !history.length) return await stockApi.updateStockHistory(code);

        // if history is behind the date
        const last = history[history.length-1];
        const ts = new Date(getDateTodayTs());
        const wd = ts.getDate();
        if (wd !== 0 && wd !== 6 && wd > last.T) return await stockApi.updateStockHistory(code);

        return history;
    },
    getStockStrategyList: () => db.get("stock.strategy.list"),
    setStockStrategyList: (list) => db.set("stock.strategy.list", list),
};

const api = {
    stock: stockApi,
};

export default api;