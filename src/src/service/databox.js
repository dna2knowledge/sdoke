import db from '$/service/db';
import stockNet from '$/service/stock-network-data';
import makePromise from '$/util/make-promise';

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
        try {
            const history = (await db.get(key)) || [];
            let startDate = null;
            if (history.length) {
                const last = history[history.length-1];
                startDate = last.T;
            }
            const h = stockNet.tencent.getHistory(code, startDate);
            h.forEach((z) => z && history.push(z));
            history.sort((a, b) => a.T - b.T);
            let dupT;
            const newh = history.reduce((a, z) => {
                if (!z || !z.T || z.T === dupT) return a;
                dupT = z.T;
                newh.push(z);
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
        if (!history) return await stockApi.updateStockHistory(code);
        return history;
    },
};

const api = {
    stock: stockApi,
};

export default api;