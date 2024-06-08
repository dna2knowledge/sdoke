import { useState, useRef, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import UpdateIcon from '@mui/icons-material/Update';
import InsightsIcon from '@mui/icons-material/Insights';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton } from '@mui/material';
import { Autocomplete, TextField, ButtonGroup, Button } from '@mui/material';
import NoData from '$/component/shared/no-data';
import StockOne from '$/component/stock/stock-one';
import StockOneStrategy from '$/component/stock/stock-one-strategy';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import { triggerFileSelect } from '$/util/file-reader';

export default function StockPanel() {
   const [data, setData] = useState(null);
   const statRef = useRef({});
   statRef.current.pinnedStocks = statRef.current.pinnedStocks || [];
   const [pinnedStocks, setPinnedStocks] = useState([]);

   useEffect(() => {
      databox.stock.getStockList().then(rawList => {
         if (!rawList) return;
         setData(rawList);
      });
      databox.stock.getPinnedStockList().then(rawList => {
         if (!rawList) return;
         statRef.current.pinnedStocks = rawList;
         setPinnedStocks([...rawList]);
      });
      eventbus.on('stock.pinned.add', onStockPinnedAdd);
      eventbus.on('stock.pinned.remove', onStockPinnedRemove);
      eventbus.on('stock.pinned.click', onStockPinnedClick);

      return () => {
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
         eventbus.emit('stock.pinned.click', data);
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
         eventbus.emit('stock.one', data);
         eventbus.emit('stock.strategy.one', { meta: data });
      }
   }, []);

   const onUpdateClick = async () => {};
   const onInsightClick = () => {};
   const onUpdateStockList = () => triggerFileSelect().then(async (raw) => {
      if (!raw) return eventbus.emit('toast', { severity: 'error', content: 'Cannot load stock list' });
      const list = raw.split('\n').reduce((a, z) => {
         if (!z) return a;
         const ps = z.split(',');
         if (!ps[0] || !ps[1]) return a;
         const item = { code: ps[0], name: ps[1], latest: null };
         a.push(item);
         return a;
      }, []);
      await databox.stock.setStockList(list);
      setData(list);
   });

   return <Box sx={{ height: '100%' }}>
      <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
         <Box sx={{ display: 'flex', width: '100%', mb: '10px' }}>
            <IconButton onClick={onUpdateClick} type="button" sx={{ p: '10px' }}><UpdateIcon /></IconButton>
            <IconButton onClick={onInsightClick} type="button" sx={{ p: '10px' }}><InsightsIcon /></IconButton>
            <Autocomplete sx={{ ml: 1, flex: '1 0 auto', '.MuiInputBase-input': { height: '10px' } }} disablePortal
               options={data || []}
               getOptionLabel={option => `${option.code} ${option.name}`}
               onChange={(_, val) => {
                  eventbus.emit('stock.pinned.add', val);
               }}
               renderInput={params =>
                  <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder="Stock Code / Name"
                     {...params}
                  />
               }
               noOptionsText={<Box>
                  No Options
                  <Button sx={{ marginLeft: '5px' }} variant="contained" startIcon={<EditIcon />} onClick={onUpdateStockList}>Update Stock List</Button>
               </Box>}
            />
            <IconButton type="button" sx={{ p: '10px' }}><SearchIcon /></IconButton>
         </Box>
         <Box sx={{ maxHeight: '100px', overflowY: 'auto' }}>
            {pinnedStocks.map((meta, i) => <StockButton key={i} data={meta} isStarred={true} />)}
         </Box>
         {pinnedStocks.length ? null : <NoData>No Data; type something for search</NoData>}
         <StockOne />
         <StockOneStrategy />
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
