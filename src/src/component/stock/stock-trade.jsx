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
import NoData from '$/component/shared/no-data';
import StockOneTrade from '$/component/stock/stock-one-trade';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import config from '$/component/stock/stock-trade-config';

function pad0(num) {
   if (num >= 10) return `${num}`;
   return `0${num}`;
}

function buildDateList(firstDay, endDay) {
   let cur = firstDay.getTime();
   const endCur = endDay.getTime();
   const dateList = [];
   while (cur <= endCur) {
      const curd = new Date(cur);
      dateList.unshift(`${curd.getFullYear()}-${pad0(curd.getMonth()+1)}-${pad0(curd.getDate())}`);
      cur += 24 * 3600 * 1000;
   }
   return dateList;
}

function getTodayTs() {
   const ts = new Date().getTime();
   return ts - ts % (24 * 3600 * 1000);
}

function getDateStr(ts) {
   return new Date(ts).toISOString().split('T')[0];
}

function measureDayH(elem) {
   // TODO: calc correct div height with font
   const canvas = document.createElement('canvas');
   const pen = canvas.getContext('2d');
   pen.font = window.getComputedStyle(elem).font;
   const box = pen.measureText('2024-01-01');
   config.dh = box.hangingBaseline;
   return box.hangingBaseline;
}

function buildTradeList(firstDay, endDay, trades) {
   const tradeList = trades.map((z, index) => Object.assign({ index }, z)).sort((a, b) => {
      if (a.S && !b.S) return -1;
      if (!a.S && b.S) return 1;
      const dt = a.T - b.T;
      if (dt !== 0) return dt;
      if (!a.S && !b.S) return 0;
      return a.S.T - b.S.T;
   });
   const slots = [{ ts: -1, i: 0 }];
   const ts = getTodayTs();
   let maxI = 0;
   const edTs = endDay.getTime();
   // header height is equal to how many days
   const headerT = Math.ceil(config.th1/config.dh+1) * config.dayms;
   tradeList.forEach(z => {
      let slotI = 0;
      while ( slots[slotI].ts > z.T ) {
         slotI ++;
         if (slotI >= slots.length) slots.push({ ts: -1, i: slotI });
      }
      const slot = slots[slotI];
      const edT = z.S?.T || ts;
      const edI = Math.floor((edTs - edT) / config.dayms);
      const stI = Math.ceil((edTs - z.T) / config.dayms);
      slot.ts = edT + headerT;
      z.I = slotI;
      if (slotI > maxI) maxI = slotI;
      z.stI = stI;
      z.edI = edI;
   });
   slots.sort((a, b) => b.ts - a.ts);
   const slotmap = {};
   slots.forEach((z, i) => { slotmap[z.i] = i; });
   tradeList.forEach(z => {
      //z.I = maxI - z.I;
      z.I = slotmap[z.I];
   });
   return tradeList;
}

function trimDateTradeList(dateList, tradeList) {
   let maxI = 0;
   tradeList.forEach(z => {
      if (z.stI > maxI) maxI = z.stI;
   });
   dateList.splice(maxI, dateList.length-maxI);
}

function StockTradeTimeline(props) {
   const { data } = props;
   const boxRef = useRef(null);
   const containerRef = useRef(null);
   const hilightRef = useRef(null);
   const year = data?.Y || new Date().getFullYear();
   const trades = data?.Ts || [];

   const tso = new Date();
   let firstDay = new Date(`${year}-01-01`);
   let endDay;
   if (tso.getFullYear() === year) {
      endDay = tso;
   } else {
      endDay = new Date(`${year}-12-31`);
   }
   const wd = firstDay.getDay();
   const dateList = buildDateList(firstDay, endDay);
   const tradeList = buildTradeList(firstDay, endDay, trades);
   trimDateTradeList(dateList, tradeList);

   useEffect(() => {
      if (containerRef.current) {
         containerRef.current.addEventListener('mouseleave', onCancelHighlight);
         containerRef.current.addEventListener('mousemove', onMoveHighlight);
      }
      return () => {
         if (containerRef.current) {
            containerRef.current.removeEventListener('mousemove', onMoveHighlight);
            containerRef.current.removeEventListener('mouseleave', onCancelHighlight);
         }
      }

      function onCancelHighlight() {
         hilightRef.current.style.display = 'none';
      }
      function onMoveHighlight(evt) {
         const target = evt.target;
         if (target.classList.contains('cell')) {
            hilightRef.current.style.display = 'block';
            hilightRef.current.style.top = `${target.offsetTop}px`;
            const dateBoxW = containerRef.current.children[0].offsetWidth;
            const offset = containerRef.current.parentNode.scrollLeft;
            hilightRef.current.style.width = `${containerRef.current.offsetWidth-dateBoxW}px`;
            hilightRef.current.style.left = `${offset-10}px`;
         } else onCancelHighlight();
      }
   });

   if (!tradeList.length) return <NoData>There is no track of stock history.</NoData>;
   return <Box ref={containerRef} sx={{
      display: 'flex',
      '.cell': { height: `${config.dh}px`, userSelect: 'none' }
   }}>
      <Box sx={{
         zIndex: '100',
         position: 'sticky', left: '0px',
         marginRight: '10px',
         padding: '0 5px',
         backgroundColor: 'white',
      }}>
         <Box sx={{ height: `${config.th1 + 10}px` }}> </Box>
         {dateList.map((z, i) => <Box className="cell" key={i}>{z}</Box>)}
         <Box sx={{ height: `${config.th1 + 10}px` }}> </Box>
      </Box>
      <Box ref={boxRef} sx={{ position: 'relative' }}>
         <Box ref={hilightRef} sx={{
            height: `${config.dh}px`,
            userSelect: 'none',
            backgroundColor: 'yellow',
            opacity: '0.3',
            position: 'absolute',
            zIndex: '1000',
            left: '0px',
         }}>&nbsp;</Box>
         {tradeList.map((z, i) => <StockOneTrade
            key={i}
            x={z.I * config.tw1}
            y={z.edI * config.dh + 10}
            w={config.tw1}
            h={(z.stI - z.edI) * config.dh + config.th1}
            data={z}
         />)}
      </Box>
   </Box>;
}

function EditDialog(props) {
   const { open, onClose, data } = props;
   const cache = useRef({
      showBuyin: false,
      showSellout: false,
      startDate: getDateStr(new Date().getTime()),
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
         cache.current.startDate = getDateStr(item.T);
         cache.current.showBuyin = !!item.B;
         cache.current.showSellout = !!item.S;
         cache.current.selected = stockList.find(z => z.code === item.code);
         setShowBuyin(cache.current.showBuyin);
         setShowSellout(cache.current.showSellout);
         setStartDate(cache.current.startDate);
         setSelected(cache.current.selected);
         if (cache.current.showBuyin) {
            cache.current.biDate = getDateStr(item.B.T);
            cache.current.biPrice = `${item.B.P}`;
            setBiDate(cache.current.biDate);
            setBiPrice(cache.current.biPrice);
         }
         if (cache.current.showSellout) {
            cache.current.soDate = getDateStr(item.S.T);
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

export default function StockTrade() {
   // stock.trade.year{Y}
   const [year, setYear] = useState(new Date().getFullYear());
   const [data, setData] = useState({
      year: 0,
      Ts: [],
   });
   const cache = useRef({
      lastUpdate: false,
   });
   const [editOpen, setEditOpen] = useState(false);
   const [editSelected, setEditSelected] = useState(null);

   useEffect(() => {
      databox.stock.getStockTradeList(year).then(rawList => {
         setData({ year, Ts: rawList || [], });
      });
   }, []);

   useEffect(() => {
      let timer = null;
      let busy = false;
      timer = setInterval(async () => {
         if (busy) return;
         if (!data?.Ts) return;
         if (cache.current.lastUpdate) {
            // only get data once when trade active is false
            if (!databox.stock.getTradeActive()) return;
            // otherwise, fetch latest data per 10s
         }
         busy = true;
         const codemap = {};
         try {
            const list = data.Ts.map(z => {
               if (codemap[z.code]) return null;
               codemap[z.code] = 1;
               return z.code;
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
         busy = false;
      }, 10 * 1000);
      eventbus.on('stock.strategy.add', onStockStrategyAdd);
      eventbus.on('stock.strategy.edit', onStockStrategyEdit);
      eventbus.on('stock.strategy.del', onStockStrategyDel);
      return () => {
         if (timer) clearInterval(timer);
         eventbus.off('stock.strategy.add', onStockStrategyAdd);
         eventbus.off('stock.strategy.edit', onStockStrategyEdit);
         eventbus.off('stock.strategy.del', onStockStrategyDel);
      };

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
            <MenuItem value={2024}>2024</MenuItem>
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
