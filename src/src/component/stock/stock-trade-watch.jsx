import { useState, useEffect, useRef } from 'react';
import {
   Box, Select, MenuItem, IconButton, Button, Switch, Tooltip,
   Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import RemoveRoadIcon from '@mui/icons-material/RemoveRoad';
import EditRoadIcon from '@mui/icons-material/EditRoad';
import TaskIcon from '@mui/icons-material/Task';
import CloseIcon from '@mui/icons-material/Close';
import StockTradeTimeline from '$/component/stock/stock-trade-timeline';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import config from '$/component/stock/stock-trade-config';

import { useTranslation } from 'react-i18next';

function EditDialog(props) {
   const { t } = useTranslation('trade');

   const { open, onClose, data } = props;
   const cache = useRef({
      today: new Date().toISOString().split('T')[0],
      startDate: config.util.getDateStr(new Date().getTime()),
   });
   const [stockList, setStockList] = useState(cache.current.stockList || []);
   const [selected, setSelected] = useState(cache.current.selected || null);
   const [startDate, setStartDate] = useState(cache.current.startDate || cache.current.today || '');
   const [biDate, setBiDate] = useState(cache.current.buyinDate || cache.current.today || '');

   useEffect(() => {
      databox.stock.getStockList().then(rawList => {
         if (!rawList) return;
         cache.current.stockList = rawList;
         setStockList(rawList);
      });
      eventbus.on('stock.trade.edit.select', onStockTradeEditSelect);
      return () => {
         eventbus.off('stock.trade.edit.select', onStockTradeEditSelect);
      };

      function onStockTradeEditSelect(item) {
         if (!item) {
            cache.current.selected = null;
            setSelected(cache.current.selected);
            return;
         }
         cache.current.startDate = config.util.getDateStr(item.T);
         cache.current.selected = stockList.find(z => z.code === item.code);
         setStartDate(cache.current.startDate);
         setSelected(cache.current.selected);
         cache.current.biDate = config.util.getDateStr(item.B.T);
         setBiDate(cache.current.biDate);
      }
   }, [stockList]);

   const close = () => onClose(null);
   const onSaveClick = () => {
      if (!selected) {
         eventbus.emit('toast', {
            severity: 'error',
            content: t('tip.edit.noselect.stock', 'Please select a stock for trade track.')
         });
         return;
      }
      const startDateTs = new Date(startDate).getTime();
      if (!startDate || isNaN(startDateTs)) {
         eventbus.emit('toast', {
            severity: 'error',
            content: t('tip.edit.invalid.date', 'Please type a valid date.')
         });
         return;
      }
      const obj = {
         T: new Date(startDate).getTime(),
         code: selected.code,
         name: selected.name,
         origin: data,
      };
      const bT = new Date(biDate).getTime();
      if (isNaN(bT)) {
         eventbus.emit('toast', {
            severity: 'error',
            content: t('tip.edit.invalid.buyin.date', 'Please type a valid date for buy-in.')
         });
         return;
      }
      obj.B = { T: bT, P: -Infinity };
      // obj.S = { T: sT, P: Infinity };
      onClose(obj);
   };

   return <Dialog open={open} onClose={close} fullWidth maxWidth="lg">
      <DialogTitle sx={{ m: 0, p: 2 }}>
         Stock Trade
      </DialogTitle>
      <Tooltip title={t('t.close.ui', 'Close')}><IconButton
         aria-label="close"
         onClick={close}
         sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
         }}>
         <CloseIcon />
      </IconButton></Tooltip>
      <DialogContent dividers sx={{ minHeight: '400px' }}>
         <Box sx={{ width: '100%' }}>
            <Autocomplete disabled={!!data} sx={{ '.MuiInputBase-input': { height: '10px' } }} fullWidth disablePortal
               options={stockList || []}
               value={selected}
               getOptionLabel={option => `${option.code} ${option.name}${option.area ? ` (${option.area})` : ''}`}
               onChange={(_, val) => {
                  setSelected(val);
                  cache.current.selected = val;
               }}
               renderInput={params =>
                  <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }}
                     placeholder={t('tip.stock.autocomplete', "Stock Code / Name")}
                     {...params}
                  />
               }
               noOptionsText={<Box>
                  {t('tip.stock.list.empty', 'No available stocks.')}
               </Box>}
            />
            <TextField disabled={!!data} value={startDate} onChange={(evt) => {
               const val = evt.target.value;
               setStartDate(val);
               cache.current.startDate = val;
            }} label={t('t.start.date', "Start Date")} fullWidth variant="standard" />
            <TextField value={biDate} onChange={(evt) => {
               const val = evt.target.value;
               setBiDate(val);
               cache.current.buyinDate = val;
            }} label={t('t.buyin.date', 'Buy-in Date')} fullWidth variant="standard" />
         </Box>
      </DialogContent>
      <DialogActions>
         <Button onClick={onSaveClick} variant="contained">
            {t('t.save', 'Save')}
         </Button>
         <Button onClick={close}>
            {t('t.cancel', 'Cancel')}
         </Button>
      </DialogActions>
   </Dialog>;
}

async function getTradeData(year) {
   const obj = {};
   obj.years = (await databox.stock.getStockTradeWatchYears()) || [new Date().getFullYear()];
   obj.trades = (await databox.stock.getStockTradeWatchList(year)) || [];
   const scan = obj.years.filter(z => z < year);
   for(let i = 0, n = scan.length; i < n; i++) {
      const y = scan[i];
      const trades0 = (await databox.stock.getStockTradeWatchList(y)) || [];
      const trades = trades0.filter(z => {
         if (!z.S) return true;
         const y0 = new Date(z.S.T).getFullYear();
         return y0 >= year;
      });
      obj.trades = obj.trades.concat(trades);
   }
   return obj;
}

export default function StockTradeWatch() {
   const { t } = useTranslation('trade');

   // stock.trade.year{Y}
   const [year, setYear] = useState(new Date().getFullYear());
   const [years, setYears] = useState([new Date().getFullYear()]);
   const [data, setData] = useState({
      Y: 0,
      Ts: [],
   });
   const cache = useRef({
      lastUpdate: false,
   });
   const [editOpen, setEditOpen] = useState(false);
   const [editSelected, setEditSelected] = useState(null);

   useEffect(() => {
      (async () => {
         const r = await getTradeData(year);
         setYears(r.years);
         setData({ Y: year, Ts: r.trades });
      })();
   }, [year]);

   useEffect(() => {
      const updateTradeDataStat = {
         timer: null,
         busy: false,
         ts: 0,
      };
      updateTradeDataStat.timer = setInterval(updateTradeData, 10 * 1000);
      eventbus.on('stock.strategy.add', onStockStrategyAdd);
      eventbus.on('stock.strategy.edit', onStockStrategyEdit);
      eventbus.on('stock.strategy.del', onStockStrategyDel);
      return () => {
         if (updateTradeDataStat.timer) clearInterval(updateTradeDataStat.timer);
         eventbus.off('stock.strategy.add', onStockStrategyAdd);
         eventbus.off('stock.strategy.edit', onStockStrategyEdit);
         eventbus.off('stock.strategy.del', onStockStrategyDel);
      };

      async function updateTradeData() {
         if (updateTradeDataStat.busy) return;
         if (!data?.Ts) return;
         const todayTs = config.util.getTodayTs();
         if (cache.current.lastUpdate) {
            // only get data once when trade active is false
            // and if over one day, also update at least once
            if (!databox.stock.getTradeActive() && updateTradeDataStat.ts >= todayTs) return;
            // otherwise, fetch latest data per 10s
         }
         updateTradeDataStat.busy = true;
         updateTradeDataStat.ts = todayTs;
         const codemap = {};
         try {
            const list = data.Ts.map(z => {
               if (codemap[z.code]) return null;
               if (!z.S || z.S.T === todayTs) {
                  codemap[z.code] = 1;
                  return z.code;
               }
               return null;
            }).filter(z => !!z);
            if (list.length) {
               const rts = await databox.stock.getStockRealtime(list);
               rts.forEach(z => {
                  eventbus.emit(`stock.one.${z.code}.trade.update`, z);
               });
            }
            cache.current.lastUpdate = true;
         } catch (_) {
         }
         updateTradeDataStat.busy = false;
      }

      async function onStockStrategyAdd() {
         setEditSelected(null);
         setEditOpen(true);
      }

      function onStockStrategyEdit(index) {
         const origin = data.Ts[index];
         if (!origin) return;
         eventbus.emit('stock.trade.edit.select', origin);
         setTimeout(() => {
            setEditSelected(Object.assign({ index }, origin));
            setEditOpen(true);
         });
      }

      function onStockStrategyDel(index) {
         if (!data?.Ts || !data.Ts.length) return;
         if (index < 0 || data.Ts.length <= index) return;
         const item = data.Ts[index];
         if (!confirm(`${t('edit.warn.remove', 'Are you sure to remove stock trade data for')} "${item.code} ${item.name}"?`)) return;
         data.Ts.splice(index, 1);
         const year = new Date(item.T).getFullYear();
         databox.stock.setStockTradeWatchList(year, data.Ts);
         setData({...data});
      }
   }, [data]);

   const onUpdateClick = () => {
      cache.current.lastUpdate = false;
      setData({...data});
   };
   const onAddClick = () => {
      eventbus.emit('stock.trade.edit.select', null);
      setEditSelected(null);
      setEditOpen(true)
   };
   const onEditDialogClose = (item) => {
      setEditOpen(false);
      if (!item || !data?.Ts) return;
      const origin = item.origin;
      delete item.origin;
      if (origin) {
         const index = origin.index || data.Ts.length;
         data.Ts.splice(index, 1, item);
      } else {
         data.Ts.push(item);
      }
      // TODO: check year
      const year = new Date(item.T).getFullYear();
      databox.stock.setStockTradeWatchList(year, data.Ts);
      if (!years.includes(year)) {
         const currentYear = new Date().getFullYear();
         for (let y = currentYear; y >= year; y--) {
            if (!years.includes(y)) years.push(y);
         }
         years.sort((a, b) => b - a);
         setYears(years);
         databox.stock.setStockTradeWatchYears(years);
      }
      cache.current.lastUpdate = false;
      setData({...data});
   };

   return <Box sx={{
      width: '100%',
      height: '100%',
      maxWidth: '800px',
      minWidth: '200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column'
   }}>
      <Box>
         <Select variant="standard" value={year} onChange={(evt) => setYear(evt.target.value)}>
            {years.map(Y => <MenuItem key={Y} value={Y}>{Y}</MenuItem>)}
         </Select>
         <Tooltip title={t('t.refresh', 'Refresh')}><IconButton onClick={onUpdateClick}><UpdateIcon /></IconButton></Tooltip>
         <Tooltip title={t('t.add.trade', 'Add Trade')}><IconButton onClick={onAddClick}><AddRoadIcon /></IconButton></Tooltip>
      </Box>
      {/* TODO: summary of this year */}
      <Box sx={{ flex: '1 0 auto', marginBottom: '10px', height: '0px', width: '100%', overflow: 'auto' }}>
         <StockTradeTimeline data={data}/>
      </Box>
      <EditDialog data={editSelected} open={editOpen} onClose={onEditDialogClose}/>
   </Box>;
}
