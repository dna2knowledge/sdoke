import { useState, useRef, useEffect } from 'react';
import UpdateIcon from '@mui/icons-material/Update';
import InsightsIcon from '@mui/icons-material/Insights';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton } from '@mui/material';
import {
   Autocomplete, TextField, ButtonGroup, Button, LinearProgress,
   Tooltip,
} from '@mui/material';
import NoData from '$/component/shared/no-data';
import StockOne from '$/component/stock/stock-one';
import StockOneStrategy from '$/component/stock/stock-one-strategy';
import StockCapitalTrend from '$/component/stock/stock-capital-trend';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import { triggerFileSelect, readText } from '$/util/file-reader';
import useLongPress from '$/component/util/long-press';

import { useTranslation } from 'react-i18next';

function StockUpdateProgressBar(props) {
   const [i, setI] = useState(0);
   const [n, setN] = useState(0);

   useEffect(() => {
      eventbus.on('stock.update.progress', onStockUpdateProgress);
      return () => {
         eventbus.off('stock.update.progress', onStockUpdateProgress);
      };

      function onStockUpdateProgress(data) {
         setI(data.i || 0);
         setN(data.n || 0);
      }
   }, []);

   if (n === 0) return null;
   const value = Math.floor(i / n * 100);
   return <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
         <LinearProgress variant="determinate" value={value} />
      </Box>
      <Box sx={{ whiteSpace: 'nowrap', fontSize: '10px' }}>{`${i} / ${n}`}</Box>
   </Box>;
}

const sp = {
   autocompleteN: 10,
};
export default function StockPanel() {
   const { t } = useTranslation('viewer');

   const [data, setData] = useState(null);
   const [query, setQuery] = useState('');
   const [selected, setSelected] = useState(null);
   const statRef = useRef({});
   statRef.current.pinnedStocks = statRef.current.pinnedStocks || [];
   const [pinnedStocks, setPinnedStocks] = useState([]);
   const updateButtonRef = useRef(null);
   const delegateClick = useLongPress(updateButtonRef);

   useEffect(() => {
      databox.stock.getStockList().then(rawList => {
         if (!rawList) return;
         statRef.current.stockList = rawList || [];
         setData(statRef.current.stockList.slice(0, sp.autocompleteN));
      });
      databox.stock.getPinnedStockList().then(rawList => {
         if (!rawList) return;
         statRef.current.pinnedStocks = rawList;
         setPinnedStocks([...rawList]);
      });
   }, []);

   useEffect(() => {
      eventbus.comp.register('comp.stock.stock-panel');
      eventbus.on('stock.pinned.add', onStockPinnedAdd);
      eventbus.on('stock.pinned.remove', onStockPinnedRemove);
      eventbus.on('stock.pinned.click', onStockPinnedClick);
      eventbus.on('stock.data.redownload', onStockDataRedownload);

      return () => {
         eventbus.comp.unregister('comp.stock.stock-panel');
         eventbus.off('stock.pinned.add', onStockPinnedAdd);
         eventbus.off('stock.pinned.remove', onStockPinnedRemove);
         eventbus.off('stock.pinned.click', onStockPinnedClick);
         eventbus.off('stock.data.redownload', onStockDataRedownload);
      };

      function onStockPinnedAdd(data) {
         if (!data) return;
         const one = statRef.current.pinnedStocks.find(z => z.code === data.code);
         if (!one) {
            statRef.current.pinnedStocks.push(data);
            setPinnedStocks([...statRef.current.pinnedStocks]);
            databox.stock.setPinnedStockList(statRef.current.pinnedStocks);
         }
      }
      function onStockPinnedRemove(data) {
         const one = statRef.current.pinnedStocks.find(z => z.code === data.code);
         if (!one) return;
         const i = statRef.current.pinnedStocks.indexOf(one);
         statRef.current.pinnedStocks.splice(i, 1);
         setPinnedStocks([...statRef.current.pinnedStocks]);
         databox.stock.setPinnedStockList(statRef.current.pinnedStocks);
      }
      function onStockPinnedClick(data) {
         setSelected(data && data.code);
         if (local.data.view) {
            local.data.view.strategy = null;
            local.data.view.strategyAll = null;
            local.data.view.index = null;
         }
         eventbus.emit('stock.one', data);
         eventbus.emit('stock.strategy.one', { meta: data });
      }
      async function onStockDataRedownload(data) {
         eventbus.emit('loading');
         if (!data || !data.code) return;
         await databox.stock.setStockHistoryRaw(data.code, null);
         await databox.stock.getStockHistory(data.code);
         eventbus.emit('loaded');
         onStockPinnedClick(data);
      }
   }, [data, pinnedStocks, selected]);

   const onUpdateClick = async () => {
      if (!local.data.updateStockProgress) local.data.updateStockProgress = {};
      const stat = local.data.updateStockProgress;
      if (stat.ts) {
         const ts = new Date().getTime();
         if (ts - stat.ts < 12 * 3600 * 1000) {
            if (!confirm(`${t(
               'history.warn.refetch',
               'Are you sure to update the history for stocks again in 12h? Last updated time is'
            )} ${new Date(stat.ts).toString()}.`)) return;
         }
      }
      let fetchErrorOnly = false;
      if (stat.error?.length > 0 && confirm(
         `${t(
            'history.warn.refatch.fromerror',
            'Last time there are {{v,number}} failures to fetch stock history. Do you want to only fetch history for stocks?',
            { v: stat.error.length }
         )}`
      )) {
         fetchErrorOnly = true;
      }
      let rawList = fetchErrorOnly ? stat.error.map(z => ({ code: z })) : await databox.stock.getStockList();
      if (!rawList || !rawList.length) {
         eventbus.emit('toast', {
            severity: 'error',
            content: t('viewer:history.warn.nostock', 'There is no stock in the list. Please update your stock list first.')
         });
         return;
      }
      const error = [];
      stat.ts = new Date().getTime();
      stat.n = rawList.length;
      for (let i = 0, n = rawList.length; i < n; i ++) {
         eventbus.emit('stock.update.progress', { i, n });
         const item = rawList[i];
         if (!item.code) continue;
         try {
            await databox.stock.getStockHistory(item.code);
         } catch(_) {
            error.push(item.code);
            eventbus.emit('toast', {
               severity: 'error',
               content: `${t(
                  'history.warn.partial.fail', 'Failed to get stock history for'
               )} ${error.slice(0, 10).join(', ')} ${error.length >= 10 ? '...' : ''}.`
            });
         }
      }
      stat.error = error;
      if (!error.length) {
         eventbus.emit('toast', {
            severity: 'success',
            content: t('viewer:history.all.updated', 'All stock history are up-to-date now.')
         });
      }
      stat.n = 0;
      eventbus.emit('stock.update.progress', { i: 0, n: 0 });
   };
   const onQuickUpdateClick = async () => {
      if (!local.data.updateStockProgress) local.data.updateStockProgress = {};
      const today = new Date();
      const ts = today.getTime();
      const stat = local.data.updateStockProgress;
      const rawCodeList = ((await databox.stock.getStockList()) || []).map(z => z.code).filter(z => !!z);
      if (!rawCodeList.length) {
         eventbus.emit('toast', {
            severity: 'error',
            content: t('viewer:history.warn.nostock', 'There is no stock in the list. Please update your stock list first.')
         });
         return;
      }
      const firstH = await databox.stock.getStockHistoryRaw(rawCodeList[0]);
      if (firstH?.length) {
         const dayms = 24 * 3600 * 1000;
         const todayTs = ts - ts % dayms;
         const tsH = firstH[firstH.length-1].T;
         const dd = Math.floor((todayTs - tsH) / dayms);
         if (dd <= 1) {
            // ok; pass
         } else if (dd === 3 && today.getDay() === 1) {
            // ok; pass
         } else {
            if (!confirm(t(
               'history.quick.warn.cause.datamissing',
               'Are you sure to do quick updating history data? It may cause data missing for {{v,number}} days.',
               { v: dd }
            ))) return;
         }
         if (today.getHours() < 15) {
            if (!confirm(t(
               'history.quick.warn.trade.active',
               `Are you sure to do quick updating history data? The data may be changed in near future.`
            ))) return;
         }
      } else {
         if (!confirm(t(
            'history.quick.warn.recommendfull',
            `Are you sure to do quick updating history data? It is recommended to do common updating to fetch full history.`
         ))) return;
      }
      eventbus.emit('toast', {
         severity: 'info',
         content: t('history.quick.start', `Doing quick update on history data ...`)
      });
      stat.error = [];
      let count = 0;
      for (let i = 0, n = rawCodeList.length; i < n; i += 50) {
         const codes = rawCodeList.slice(i, i+50);
         try {
            const rts = await databox.stock.getStockRealtime(codes);
            for (let j = 0; j < rts.length; j++) {
               const rt = rts[j];
               try {
                  const h = (await databox.stock.getStockHistoryRaw(rt.code)) || [];
                  const last = h[h.length-1];
                  if (last?.T === rt.T) {
                     last.O = rt.O;
                     last.C = rt.C;
                     last.L = rt.L;
                     last.H = rt.H;
                     last.V = rt.V;
                     last.m = rt.m;
                     last.s = rt.s;
                  } else {
                     h.push({
                        T: rt.T,
                        O: rt.O,
                        C: rt.C,
                        L: rt.L,
                        H: rt.H,
                        V: rt.V,
                        m: rt.m,
                        s: rt.s,
                     });
                  }
                  await databox.stock.setStockHistoryRaw(rt.code, h);
                  eventbus.emit('stock.update.progress', { i: i+j, n });
                  count ++;
               } catch(_) {
                  stat.error.push(rt.code);
                  eventbus.emit('toast', {
                     severity: 'error',
                     content: `${t(
                        'history.warn.partial.fail',
                        'Failed to update stock history for'
                     )} ${error.slice(0, 10).join(', ')} ${error.length >= 10 ? '...' : ''}.`
                  });
               }
            }
         } catch(_) {
            codes.forEach(z => stat.error.push(z));
            eventbus.emit('toast', {
               severity: 'error',
               content: `${t(
                  'history.warn.partial.fail',
                  'Failed to update stock history for'
               )} ${error.slice(0, 10).join(', ')} ${error.length >= 10 ? '...' : ''}.`
            });
         }
      }

      if (!stat.error.length) {
         if (count === rawCodeList.length) {
            eventbus.emit('toast', {
               severity: 'success',
               content: t('viewer:history.all.updated', 'All stock history are up-to-date now.')
            });
         } else {
            eventbus.emit('toast', {
               severity: 'warn',
               content: t(
                  'history.quick.partial.fail',
                  `Almost stock history are up-to-date now; {{v,number}} stocks cannot be quickly updated.`,
                  { v: rawCodeList.length - count }
               )
            });
         }
      }
      stat.n = 0;
      eventbus.emit('stock.update.progress', { i: 0, n: 0 });
      if (selected) {
         eventbus.emit('stock.pinned.click', data.find(z => z.code === selected));
      }
   };
   const onInsightClick = () => {
      if (local.data.updateStockProgress?.n) {
         eventbus.emit('toast', { severity: 'warning', content: t(
            'insight.warn.history.updating', 'Stock data are upadating. Please try later after it is complete.'
         ) });
         return;
      }
      eventbus.emit('stock.analysis.captr');
   };
   const onUpdateStockList = () => triggerFileSelect().then(async (files) => {
      if (!files || !files.length) return; // user cancel
      const raw = await readText(files[0]);
      if (!raw) return eventbus.emit('toast', { severity: 'error', content: t('stock.list.warn.fail', 'Cannot load stock list') });
      const list = raw.split('\n').reduce((a, z) => {
         if (!z) return a;
         const ps = z.split(',');
         if (!ps[0] || !ps[1]) return a;
         const item = { code: ps[0], name: ps[1], area: ps[2] || null, latest: null };
         a.push(item);
         return a;
      }, []);
      statRef.current.stockList = list;
      await databox.stock.setStockList(list);
      setData(list.slice(0, sp.autocompleteN));
   });
   const onSearch = (evt) => {
      const val = evt.target.value;
      const list = statRef.current.stockList || [];
      setQuery(val);
      if (val) {
         const filtered = list.filter(z => {
            return z && ( z.code.indexOf(val) >= 0 || z.name.indexOf(val) >= 0);
         }).slice(0, 20);
         setData(filtered);
      } else {
         setData(list.slice(0, sp.autocompleteN));
      }
   };

   delegateClick(() => {
      onUpdateClick();
   }, () => {
      onQuickUpdateClick();
   });

   return <Box sx={{ height: '100%' }}>
      <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
         <Box sx={{ display: 'flex', width: '100%', mb: '10px' }}>
            <Tooltip title={t('t.update.history', 'Update history')}><IconButton ref={updateButtonRef} type="button" sx={{ p: '10px' }}><UpdateIcon /></IconButton></Tooltip>
            <Tooltip title={t('t.do.captr', 'Capital Trend')}><IconButton onClick={onInsightClick} type="button" sx={{ p: '10px' }}><InsightsIcon /></IconButton></Tooltip>
            <Autocomplete sx={{ ml: 1, flex: '1 0 auto', '.MuiInputBase-input': { height: '10px' } }} disablePortal
               options={data || []}
               getOptionLabel={option => `${option.code} ${option.name}${option.area ? ` (${option.area})` : ''}`}
               onChange={(_, val) => {
                  eventbus.emit('stock.pinned.click', val);
               }}
               renderInput={params =>
                  <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder={t('tip.stock.autocomplete', 'Stock Code / Name')}
                     {...params} value={query} onChange={onSearch}
                  />
               }
               noOptionsText={<Box>
                  {t('tip.stock.list.empty', 'No available stocks.')} <Button sx={{ marginLeft: '5px' }} variant="contained" startIcon={<EditIcon />} onClick={onUpdateStockList}>
                     {t('btn.update.stock.list', 'Update your Stock List')}
                  </Button>
               </Box>}
            />
         </Box>
         <Box><StockUpdateProgressBar/></Box>
         <Box sx={{ maxHeight: '100px', overflowY: 'auto' }}>
            {pinnedStocks.map((meta, i) => <StockButton key={i} data={meta} isStarred={true} />)}
         </Box>
         {selected ? null : <NoData>
            {t('tip.stock.no.selected', 'No Data; please search and select one stock or')} <Button
               sx={{ marginLeft: '5px' }} variant="contained"
               startIcon={<EditIcon />} onClick={onUpdateStockList}>
            {t('btn.update.stock.list', 'Update your Stock List')}
         </Button></NoData>}
         <StockOne />
         <StockOneStrategy />
         <StockCapitalTrend />
       </Box>
   </Box>;
}

function StockButton(props) {
   const { data, isStarred } = props;
   return <ButtonGroup size="small">
      <Button size="small" onClick={() => eventbus.emit('stock.pinned.click', data)}>
         {data.code} - {data.name}
      </Button>
      <Button size="small" onClick={() => eventbus.emit('stock.pinned.remove', data)}>
         <CloseIcon />
      </Button>
   </ButtonGroup>;
}
