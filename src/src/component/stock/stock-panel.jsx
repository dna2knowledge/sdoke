import { useState, useRef, useEffect } from 'react';
import UpdateIcon from '@mui/icons-material/Update';
import InsightsIcon from '@mui/icons-material/Insights';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton } from '@mui/material';
import {
   Autocomplete, TextField, ButtonGroup, Button, LinearProgress,
   Tooltip, Menu, MenuItem
} from '@mui/material';
import NoData from '$/component/shared/no-data';
import StockOne from '$/component/stock/stock-one';
import StockOneStrategy from '$/component/stock/stock-one-strategy';
import StockCapitalTrend from '$/component/stock/stock-capital-trend';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import download from '$/util/file-download';
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

function SideMenu(props) {
   const buttonRef = useRef(null);
   const [anchorElem, setAnchorElem] = useState(null);
   const { t, refreshStockList } = props;
   const close = () => setAnchorElem(null);
   const downloadStockList = async () => {
      const list = (await databox.stock.getStockList()) || [];
      download(
         t('t.sidemenuitem.download-filename', `stockList.csv`),
         `${t('t.stockcode', 'Code')},${t('t.stockname', 'Name')},${t('t.stocktag', 'Tag')}
${list.length ? list.map(z => `"${z.code}","${z.name}",${z.area ? `"${z.area}"` : ''}`).join('\n') : t('tip.stock.list.empty', '"No available stocks."')}`
      );
      close();
   };
   const addOneStock = async () => {
      const line = prompt(t('tip.addonestock', 'Type in a line with stock code, name and category seperated by comma:'));
      if (!line) return close();
      const ps = line.split(',');
      const code = ps[0];
      const name = ps[1];
      if (!code || !name) return close();
      const area = ps[2];
      const list = (await databox.stock.getStockList()) || [];
      const old = list.find(z => z.code === code);
      if (old && old.name === name && (area && old.area === area)) return close();
      eventbus.emit('loading');
      if (old) {
         old.name = name;
         old.area = area;
      } else {
         const item = { code, name };
         if (area) item.area = area;
         list.push(item);
         await databox.stock.getStockHistory(item.code);
      }
      await refreshStockList(list);
      eventbus.emit('loaded');
      close();
   };
   const delOneStock = async () => {
      const line = prompt(t('tip.delonestock', 'Type code or name of a stock to be removed from stock list:'));
      if (!line) return close();
      const list = (await databox.stock.getStockList()) || [];
      const old = list.find(z => z.code === line || z.name === line);
      if (!old) return close();
      if (!confirm(`${t('tip.delonestock-confirm', 'Are you sure to remove the stock:')}: ${old.code} ${old.name}`)) return close();
      eventbus.emit('loading');
      list.splice(list.indexOf(old), 1);
      await refreshStockList(list);
      eventbus.emit('loaded');
      close();
   };
   const fixData = async () => triggerFileSelect().then(async (files) => {
      close();
      if (!files || !files.length) return; // user cancel
      const raw = await readText(files[0]);
      if (!raw) return eventbus.emit('toast', { severity: 'error', content: t('stock.fixdata.warn.fail', 'Cannot load fixed stock data') });
      eventbus.emit('loading');
      const list = raw.split('\n');
      const head = list.shift().trim();
      // code, name, tag, date, open, close, high, low, volume, amount, turnover_rate
      const colmap = {
         code: -1, name: -1, tag: -1,
         T: -1, O: -1, C: -1, H: -1, L: -1, V: -1, m: -1, s: -1
      };
      head.split(',').forEach((z, i) => {
         switch(z.toLowerCase()) {
            case 'code': colmap.code = i; break;
            case 'name': colmap.name = i; break;
            case 'tag': colmap.tag = i; break;
            case 't': case 'ts':
            case 'date': colmap.T = i; break;
            case 'o':
            case 'open': colmap.O = i; break;
            case 'c':
            case 'close': colmap.C = i; break;
            case 'h':
            case 'high': colmap.H = i; break;
            case 'l':
            case 'low': colmap.L = i; break;
            case 'v': case 'vol':
            case 'volume': colmap.V = i; break;
            case 'm':
            case 'amount': colmap.m = i; break;
            case 's':
            case 'turnover_rate': colmap.s = i; break;
         }
      });
      if (colmap.code < 0 && colmap.name < 0) {
         // TODO: pop up warning for user
         return;
      }
      const stockList = (await databox.stock.getStockList()) || [];
      const namemap = {};
      const codemap = {};
      stockList.forEach(z => {
         namemap[z.name] = z;
         codemap[z.code] = z;
      });
      // getStockHistoryRaw, setStockHistoryRaw
      // { code, name, area }
      // { T, O, C, H, L, V, m, s }
      const stat = { listUpdated: false, errors: [], lastcode: null, lastdata: null };
      for (let i = 0, n = list.length; i < n; i++) {
         const line = list[i] && list[i].trim();
         if (!line) continue;
         const ps = line.split(',');
         const name = ps[colmap.name];
         const code = ps[colmap.code];
         const tag = ps[colmap.tag];
         // TODO: handle error: no name/code
         if (!name && !code) continue;
         let item;
         if (code) {
            item = codemap[code];
            if (item && name && name !== item.name) {
               item.name = name;
               stat.listUpdated = true;
            }
         } else {
            item = namemap[name];
         }
         if (!item) {
            // TODO: handle error: no name/code
            if (!code || !name) continue;
            item = { name, code, area: null };
            namemap[name] = item;
            codemap[code] = item;
            stockList.push(item);
            stat.listUpdated = true;
            await databox.stock.getStockHistory(code);
         }
         if (tag) {
            item.area = tag;
            stat.listUpdated = true;
         }

         let data = null;
         if (item.code === stat.lastcode && stat.lastdata) {
            data = stat.lastdata;
         } else {
            data = (await databox.stock.getStockHistoryRaw(item.code)) || [];
            if (stat.lastcode && stat.lastdata) {
               await commit();
            }
            stat.lastcode = code;
            stat.lastdata = data;
         }

         const Traw = ps[colmap.T];
         if (Traw === '-') {
            stockList.splice(stockList.indexOf(item), 1);
            stat.listUpdated = true;
         }
         // if no T, it is just to update stock name/tag or add new one
         if (!Traw) continue;
         const T = new Date(Traw).getTime();
         if (!T) continue;
         const pti = binsearch(data, T);
         const ptobj = data[pti];
         const Oraw = ps[colmap.O];
         const Craw = ps[colmap.C];
         const Hraw = ps[colmap.H];
         const Lraw = ps[colmap.L];
         const Vraw = ps[colmap.V];
         const mraw = ps[colmap.m];
         const sraw = ps[colmap.s];
         if (ptobj && ptobj.T === T) {
            if (Oraw) ptobj.O = parseFloat(Oraw);
            if (Craw) ptobj.C = parseFloat(Craw);
            if (Hraw) ptobj.H = parseFloat(Hraw);
            if (Lraw) ptobj.L = parseFloat(Lraw);
            if (Vraw) ptobj.V = parseFloat(Vraw);
            if (mraw) ptobj.m = parseFloat(mraw);
            if (sraw) ptobj.s = parseFloat(sraw);
         } else {
            // required
            if (!Oraw || !Craw || !Hraw || !Lraw || !Vraw) continue;
            const newobj = {
               T, C: parseFloat(Craw), O: parseFloat(Oraw),
               H: parseFloat(Hraw), L: parseFloat(Lraw),
               V: parseInt(Vraw),
            };
            if (mraw) newobj.m = parseFloat(mraw);
            if (sraw) newobj.s = parseFloat(sraw);
            data.splice(pti, 0, newobj);
         }
      }
      if (stat.lastcode && stat.lastdata) {
         await commit();
      }
      if (stat.listUpdated) await refreshStockList(stockList);
      eventbus.emit('loaded');

      async function commit() {
         if (!stat.lastcode || !stat.lastdata) return;
         await databox.stock.setStockHistoryRaw(stat.lastcode, stat.lastdata);
         stat.lastcode = null;
         stat.lastdata = null;
      }

      function binsearch(data, T) {
         if (!data.length) return 0;
         let a = 0, b = data.length-1, m;
         while (a < b) {
            m = ~~((a + b)/2);
            const d = data[m];
            if (d.T > T) {
               b = m - 1;
            } else if (d.T < T) {
               a = m + 1;
            } else {
               return m;
            }
         }
         if (data[a].T === T) return a;
         if (data[a].T > T) return a;
         return a + 1;
      }
   });
   return <Box>
      <Tooltip title={t('t.sidemenu', 'More ...')}>
         <IconButton ref={buttonRef} onClick={() => setAnchorElem(buttonRef.current)}><MoreVertIcon /></IconButton>
      </Tooltip>
      <Menu
         anchorEl={anchorElem}
         open={!!anchorElem}
         onClose={close}
         transformOrigin={{ horizontal: 'right', vertical: 'top' }}
         anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
         <MenuItem onClick={addOneStock}>{t('t.sidemenuitem.add-stock', 'Add/update one stock ...')}</MenuItem>
         <MenuItem onClick={delOneStock}>{t('t.sidemenuitem.del-stock', 'Remove one stock ...')}</MenuItem>
         <MenuItem onClick={fixData}>{t('t.sidemenuitem.fixdata', 'Fix stock data ...')}</MenuItem>
         <MenuItem onClick={downloadStockList}>{t('t.sidemenuitem.download-list', 'Download stock list ...')}</MenuItem>
      </Menu>
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

   const refreshStockList = async (list) => {
      statRef.current.stockList = list;
      await databox.stock.setStockList(list);
      setData(list.slice(0, sp.autocompleteN));
   };

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
      await refreshStockList(list);
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
            <SideMenu t={t} refreshStockList={refreshStockList}/>
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
