import { useState, useRef, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import UpdateIcon from '@mui/icons-material/Update';
import InsightsIcon from '@mui/icons-material/Insights';
import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton } from '@mui/material';
import { Table, TableHead, TableRow, TableBody, TableCell, Menu, MenuItem } from '@mui/material';
import { Autocomplete, TextField, ButtonGroup, Button } from '@mui/material';
import NoData from '$/component/shared/no-data';
import eventbus from '$/service/eventbus';

export default function StockPanel() {
   const [search, setSearch] = useState('');
   const [query, setQuery] = useState('');
   const [data, setData] = useState(null);
   const searchKey = useRef(null);
   const statRef = useRef({});
   statRef.current.pinnedStocks = [].filter(z => !!z);
   const [pinnedStocks, setPinnedStocks] = useState([...statRef.current.pinnedStocks]);

   useEffect(() => {
      eventbus.on('stock.pinned.add', onStockPinnedAdd);
      eventbus.on('stock.pinned.remove', onStockPinnedRemove);
      eventbus.on('stock.pinned.click', onStockPinnedClick);

      let statTimer = null;
      updateStat();
      return () => {
         eventbus.off('stock.pinned.add', onStockPinnedAdd);
         eventbus.off('stock.pinned.remove', onStockPinnedRemove);
         eventbus.off('stock.pinned.click', onStockPinnedClick);

         if (statTimer) clearTimeout(statTimer);
      };

      async function updateStat() {
      }

      function onStockPinnedAdd(data) {
         if (!data) return;
         const one = statRef.current.pinnedStocks.find(z => z.code === data.code);
         if (!one) {
            statRef.current.pinnedStocks.push(data);
            setPinnedStocks([...statRef.current.pinnedStocks]);
         }
         eventbus.emit('stock.pinned.click', data);
      }
      function onStockPinnedRemove(data) {
         const one = statRef.current.pinnedStocks.find(z => z.id === data.id);
         if (!one) return;
         const i = statRef.current.pinnedStocks.indexOf(one);
         statRef.current.pinnedStocks.splice(i, 1);
         setPinnedStocks([...statRef.current.pinnedStocks]);
      }
      function onStockPinnedClick(data) {
         setQuery(data?.code);
         eventbus.emit('stock.one', data);
         eventbus.emit('stock.strategy.one', { meta: data });
      }
   }, []);

   const onUpdateClick = async () => {
   };
   const onInsightClick = () => eventbus.emit(`stock.strategy.suggest`, 'strategy.newbie');

   const fnSearch = async (q, p) => {
   };

   return <Box sx={{ height: '100%' }}>
      <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
         <Box sx={{ display: 'flex', width: '100%', mb: '10px' }}>
            <IconButton onClick={onUpdateClick} type="button" sx={{ p: '10px' }}><UpdateIcon /></IconButton>
            <IconButton onClick={onInsightClick} type="button" sx={{ p: '10px' }}><InsightsIcon /></IconButton>
            <Autocomplete sx={{ ml: 1, flex: '1 0 auto', '.MuiInputBase-input': { height: '10px' } }} disablePortal
               options={data || []}
               getOptionLabel={option => `${option.code} ${option.name}`}
               onChange={(evt, val) => {
                  eventbus.emit('stock.pinned.add', val);
               }}
               renderInput={params =>
                  <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder="Stock Code"
                     {...params}
                     value={search} onChange={(evt) => evt.target.value && fnSearch(evt.target.value, 0)}/>
               }
            />
            <IconButton type="button" sx={{ p: '10px' }}><SearchIcon /></IconButton>
         </Box>
         <Box>{pinnedStocks.map((meta, i) => <StockButton key={i} data={meta} isStarred={true} />)}</Box>
         {query ? null : <NoData>No Data; type something for search</NoData>}
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
