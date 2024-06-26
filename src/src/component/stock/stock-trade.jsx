import { useState, useEffect, useRef } from 'react';
import {
   Box, Select, MenuItem, IconButton, Button, Switch,
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

function EditDialog(props) {
   const { open, onClose, data } = props;
   const cache = useRef({
      showBuyin: false,
      showSellout: false,
      startDate: config.util.getDateStr(new Date().getTime()),
   });
   const [showBuyin, setShowBuyin] = useState(cache.current.showBuyin || false);
   const [showSellout, setShowSellout] = useState(cache.current.showSellout || false);
   const [stockList, setStockList] = useState(cache.current.stockList || []);
   const [selected, setSelected] = useState(cache.current.selected || null);
   const [startDate, setStartDate] = useState(cache.current.startDate || '');
   const [biDate, setBiDate] = useState(cache.current.buyinDate || '');
   const [biPrice, setBiPrice] = useState(cache.current.buyinPrice || '');
   const [soDate, setSoDate] = useState(cache.current.selloutDate || '');
   const [soPrice, setSoPrice] = useState(cache.current.selloutPrice || '');

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
            setShowBuyin(cache.current.showBuyin);
            setShowSellout(cache.current.showSellout);
            setSelected(cache.current.selected);
            return;
         }
         cache.current.startDate = config.util.getDateStr(item.T);
         cache.current.showBuyin = !!item.B;
         cache.current.showSellout = !!item.S;
         cache.current.selected = stockList.find(z => z.code === item.code);
         setShowBuyin(cache.current.showBuyin);
         setShowSellout(cache.current.showSellout);
         setStartDate(cache.current.startDate);
         setSelected(cache.current.selected);
         if (cache.current.showBuyin) {
            cache.current.biDate = config.util.getDateStr(item.B.T);
            cache.current.biPrice = `${item.B.P}`;
            setBiDate(cache.current.biDate);
            setBiPrice(cache.current.biPrice);
         }
         if (cache.current.showSellout) {
            cache.current.soDate = config.util.getDateStr(item.S.T);
            cache.current.soPrice = `${item.S.P}`;
            setSoDate(cache.current.soDate);
            setSoPrice(cache.current.soPrice);
         }
      }
   }, [stockList]);

   const close = () => onClose(null);
   const onSaveClick = () => {
      if (!selected) {
         eventbus.emit('toast', { severity: 'error', content: 'Please select a stock for trade track.' });
         return;
      }
      const startDateTs = new Date(startDate).getTime();
      if (!startDate || isNaN(startDateTs)) {
         eventbus.emit('toast', { severity: 'error', content: 'Please type a valid date.' });
         return;
      }
      const obj = {
         T: new Date(startDate).getTime(),
         code: selected.code,
         name: selected.name,
         origin: data,
      };
      if (showBuyin) {
         const bT = new Date(biDate).getTime();
         const bP = parseFloat(biPrice);
         if (isNaN(bT)) {
            eventbus.emit('toast', { severity: 'error', content: 'Please type a valid date for buy-in.' });
            return;
         }
         if (isNaN(bP)) {
            eventbus.emit('toast', { severity: 'error', content: 'Please type a valid price for buy-in.' });
            return;
         }
         obj.B = { T: bT, P: bP };
      }
      if (showSellout) {
         if (!obj.B) {
            eventbus.emit('toast', { severity: 'error', content: 'Please correctly set up buy-in first.' });
            return;
         }
         const sT = new Date(soDate).getTime();
         const sP = parseFloat(soPrice);
         if (isNaN(sT)) {
            eventbus.emit('toast', { severity: 'error', content: 'Please type a valid date for buy-in.' });
            return;
         }
         if (isNaN(sP)) {
            eventbus.emit('toast', { severity: 'error', content: 'Please type a valid price for buy-in.' });
            return;
         }
         obj.S = { T: sT, P: sP };
      }
      onClose(obj);
   };

   return <Dialog open={open} onClose={close} fullWidth maxWidth="lg">
      <DialogTitle sx={{ m: 0, p: 2 }}>
         Stock Trade
      </DialogTitle>
      <IconButton
         aria-label="close"
         onClick={close}
         sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
         }}>
         <CloseIcon />
      </IconButton>
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
                  <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder="Stock Code / Name"
                     {...params}
                  />
               }
               noOptionsText={<Box>
                  No available stocks.
               </Box>}
            />
            <TextField disabled={!!data} value={startDate} onChange={(evt) => {
               const val = evt.target.value;
               setStartDate(val);
               cache.current.startDate = val;
            }} label="Start Date" fullWidth variant="standard" />
            <Box sx={{ marginTop: '20px', marginBottom: '-5px' }}>
               <Switch value={showBuyin} onChange={(_, val) => {
                  setShowBuyin(val);
                  cache.current.showBuyin = val;
                  if (!val) {
                     setShowSellout(false);
                     cache.current.showSellout = false;
                  }
               }} /> Buy in
            </Box>
            {showBuyin ? <Box>
               <TextField value={biDate} onChange={(evt) => {
                  const val = evt.target.value;
                  setBiDate(val);
                  cache.current.buyinDate = val;
               }} label="Buyin Date" fullWidth variant="standard" />
               <TextField value={biPrice} onChange={(evt) => {
                  const val = evt.target.value;
                  setBiPrice(val);
                  cache.current.buyinPrice = val;
               }} label="Buyin Price" fullWidth type="number" variant="standard" />
               <Box sx={{ marginTop: '20px', marginBottom: '-5px' }}>
                  <Switch value={showSellout} onChange={(_, val) => {
                     setShowSellout(val);
                     cache.current.showSellout = false;
                  }} /> Sell out
               </Box>
               {showSellout ? <Box>
                  <TextField value={soDate} onChange={(evt) => {
                     const val = evt.target.value;
                     setSoDate(val);
                     cache.current.selloutDate = val;
                  }} label="Sellout Data" fullWidth variant="standard" />
                  <TextField value={soPrice} onChange={(evt) => {
                     const val = evt.target.value;
                     setSoPrice(val);
                     cache.current.selloutPrice = val;
                  }} label="Sellout Price" fullWidth type="number" variant="standard" />
               </Box> : null }
            </Box> : null}
         </Box>
      </DialogContent>
      <DialogActions>
         <Button onClick={onSaveClick}>
            Save
         </Button>
         <Button onClick={close}>
            Cancel
         </Button>
      </DialogActions>
   </Dialog>;
}

async function getTradeData(year) {
   const obj = {};
   obj.years = (await databox.stock.getStockTradeYears()) || [new Date().getFullYear()];
   obj.trades = (await databox.stock.getStockTradeList(year)) || [];
   const scan = obj.years.filter(z => z < year);
   for(let i = 0, n = scan.length; i < n; i++) {
      const y = scan[i];
      const trades0 = (await databox.stock.getStockTradeList(y)) || [];
      const trades = trades0.filter(z => {
         if (!z.S) return true;
         const y0 = new Date(z.S.T).getFullYear();
         return y0 >= year;
      });
      obj.trades = obj.trades.concat(trades);
   }
   return obj;
}

export default function StockTrade() {
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
         if (!confirm(`Are you sure to remove stock trade data for "${item.code} ${item.name}"?`)) return;
         data.Ts.splice(index, 1);
         const year = new Date(item.T).getFullYear();
         databox.stock.setStockTradeList(year, data.Ts);
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
      databox.stock.setStockTradeList(year, data.Ts);
      if (!years.includes(year)) {
         const currentYear = new Date().getFullYear();
         for (let y = currentYear; y >= year; y--) {
            if (!years.includes(y)) years.push(y);
         }
         years.sort((a, b) => b - a);
         setYears(years);
         databox.stock.setStockTradeYears(years);
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
         <IconButton onClick={onUpdateClick}><UpdateIcon /></IconButton>
         <IconButton onClick={onAddClick}><AddRoadIcon /></IconButton>
      </Box>
      {/* TODO: summary of this year */}
      <Box sx={{ flex: '1 0 auto', marginBottom: '10px', height: '0px', width: '100%', overflow: 'auto' }}>
         <StockTradeTimeline data={data}/>
      </Box>
      <EditDialog data={editSelected} open={editOpen} onClose={onEditDialogClose}/>
   </Box>;
}
