import { useState, useRef, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import UpdateIcon from '@mui/icons-material/Update';
import InsightsIcon from '@mui/icons-material/Insights';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton } from '@mui/material';
import { Autocomplete, TextField, ButtonGroup, Button, LinearProgress, Typography } from '@mui/material';
import NoData from '$/component/shared/no-data';
import StockOne from '$/component/stock/stock-one';
import StockOneStrategy from '$/component/stock/stock-one-strategy';
import StockCapitalTrend from '$/component/stock/stock-capital-trend';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import { triggerFileSelect, readText } from '$/util/file-reader';

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
      <Box>
         <Typography sx={{ whiteSpace: 'nowrap' }} variant="body2" color="text.secondary">{`${i} / ${n}`}</Typography>
      </Box>
   </Box>;
}

const sp = {
   autocompleteN: 10,
};
export default function StockPanel() {
   const [data, setData] = useState(null);
   const [query, setQuery] = useState('');
   const [selected, setSelected] = useState(null);
   const statRef = useRef({});
   statRef.current.pinnedStocks = statRef.current.pinnedStocks || [];
   const [pinnedStocks, setPinnedStocks] = useState([]);

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

      return () => {
         eventbus.comp.unregister('comp.stock.stock-panel');
         eventbus.off('stock.pinned.add', onStockPinnedAdd);
         eventbus.off('stock.pinned.remove', onStockPinnedRemove);
         eventbus.off('stock.pinned.click', onStockPinnedClick);
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
         eventbus.emit('stock.one', data);
         eventbus.emit('stock.strategy.one', { meta: data });
      }
   }, [data, pinnedStocks, selected]);

   const onUpdateClick = async () => {
      if (!local.data.updateStockProgress) local.data.updateStockProgress = {};
      const stat = local.data.updateStockProgress;
      if (stat.ts) {
         const ts = new Date().getTime();
         if (ts - stat.ts < 12 * 3600 * 1000) {
            if (!confirm(`Are you sure to update the history for stocks again in 12h? Last updated time is ${new Date(stat.ts).toString()}.`)) return;
         }
      }
      let fetchErrorOnly = false;
      if (stat.error?.length > 0 && confirm(
         `Last time there are ${stat.error.length} failures to fetch stock history. Do you want to only fetch history for stocks?`
      )) {
         fetchErrorOnly = true;
      }
      let rawList = fetchErrorOnly ? stat.error.map(z => ({ code: z })) : await databox.stock.getStockList();
      if (!rawList || !rawList.length) {
         eventbus.emit('toast', {
            severity: 'error',
            content: 'There is no stock in the list. Please update your stock list first.'
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
               content: `Failed to get stock history for ${error.slice(0, 10).join(', ')} ${error.length >= 10 ? '...' : ''}.`
            });
         }
      }
      stat.error = error;
      if (!error.length) {
         eventbus.emit('toast', {
            severity: 'success',
            content: 'All stock history are up-to-date now.'
         });
      }
      stat.n = 0;
      eventbus.emit('stock.update.progress', { i: 0, n: 0 });
   };
   const onInsightClick = () => {
      if (local.data.updateStockProgress?.n) {
         eventbus.emit('toast', { severity: 'warning', content: 'Stock data are upadating. Please try later after it is complete.' });
         return;
      }
      eventbus.emit('stock.analysis.captr');
   };
   const onUpdateStockList = () => triggerFileSelect().then(async (files) => {
      if (!files || !files.length) return; // user cancel
      const raw = await readText(files[0]);
      if (!raw) return eventbus.emit('toast', { severity: 'error', content: 'Cannot load stock list' });
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

   return <Box sx={{ height: '100%' }}>
      <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
         <Box sx={{ display: 'flex', width: '100%', mb: '10px' }}>
            <IconButton onClick={onUpdateClick} type="button" sx={{ p: '10px' }}><UpdateIcon /></IconButton>
            <IconButton onClick={onInsightClick} type="button" sx={{ p: '10px' }}><InsightsIcon /></IconButton>
            <Autocomplete sx={{ ml: 1, flex: '1 0 auto', '.MuiInputBase-input': { height: '10px' } }} disablePortal
               options={data || []}
               getOptionLabel={option => `${option.code} ${option.name}${option.area ? ` (${option.area})` : ''}`}
               onChange={(_, val) => {
                  eventbus.emit('stock.pinned.click', val);
               }}
               renderInput={params =>
                  <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder="Stock Code / Name"
                     {...params} value={query} onChange={onSearch}
                  />
               }
               noOptionsText={<Box>
                  No available stocks. <Button sx={{ marginLeft: '5px' }} variant="contained" startIcon={<EditIcon />} onClick={onUpdateStockList}>
                     Update Stock List
                  </Button>
               </Box>}
            />
            <IconButton type="button" sx={{ p: '10px' }}><SearchIcon /></IconButton>
         </Box>
         <Box><StockUpdateProgressBar/></Box>
         <Box sx={{ maxHeight: '100px', overflowY: 'auto' }}>
            {pinnedStocks.map((meta, i) => <StockButton key={i} data={meta} isStarred={true} />)}
         </Box>
         {selected ? null : <NoData>No Data; please search and select one stock</NoData>}
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
