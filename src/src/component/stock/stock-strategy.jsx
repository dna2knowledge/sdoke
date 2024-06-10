import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Autocomplete, TextField, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NoData from '$/component/shared/no-data';
import StockStrategyEditTab from '$/component/stock/stock-strategy-tab-edit';
import StockStrategySuggestTab from '$/component/stock/stock-strategy-tab-suggest';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';

export default function StockStrategy() {
   const [tab, setTab] = useState('edit');
   const [strategyList, setStrategyList] = useState([]);
   const [selected, setSelected] = useState(local.data.selectedStockStrategy);

   useEffect(() => {
      eventbus.on('stock.strategy.add', onStockStrategyAdd);
      eventbus.on('stock.strategy.edit', onStockStrategyEdit);
      return () => {
         eventbus.off('stock.strategy.add', onStockStrategyAdd);
         eventbus.off('stock.strategy.edit', onStockStrategyEdit);
      };

      function onStockStrategyAdd() {
         if (local.data.selectedStockStrategy && local.data.selectedStockStrategy.dirty) {
            if (!confirm("The previous strategy has been updated but not saved; do you want to discard the data and create new one?")) return;
         }
         setTab('edit');
         const item = {
            name: '',
            desc: '',
            new: true,
            dirty: true,
            var: [], rule: [], vis: [],
         };
         local.data.selectedStockStrategy = item;
         setSelected(item);
      }
      function onStockStrategyEdit(item) {
         if (item && local.data.selectedStockStrategy && local.data.selectedStockStrategy.dirty) {
            if (!confirm("The previous strategy has been updated but not saved; do you want to discard the data and create new one?")) return;
         }
         setTab('edit');
         local.data.selectedStockStrategy = item;
         setSelected(item);
      }
   }, []);

   const onCreateStrategyClick = () => eventbus.emit('stock.strategy.add');

   return <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: '10px' }}>
         <Autocomplete sx={{ ml: 1, flex: '1 0 auto', '.MuiInputBase-input': { height: '10px' } }} disablePortal
            options={strategyList}
            getOptionLabel={option => `${option.name}`}
            onChange={(_, val) => {
               eventbus.emit('stock.strategy.edit', val);
            }}
            renderOption={(props, item) => <li key={item.name} {...props}><StockStrategyOption data={item} /></li>}
            renderInput={params =>
               <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder="Strategy Name"
                  {...params}
               />
            }
            noOptionsText={<Box>
               No available strategy. <Button
                  sx={{ marginLeft: '5px' }}
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={onCreateStrategyClick}>
                     Create Strategy
               </Button>
            </Box>}
         />
      </Box>
      {selected ?
      (<Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}><Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)}>
          <Tab value="edit" label="Basic Info" />
          <Tab value="suggest" label="Search" />
        </Tabs>
      </Box>
      <StockStrategyEditTab tab={tab} />
      <StockStrategySuggestTab tab={tab} /></Box>) :
      <NoData>No Strategy data; please search and select one or <Button
         sx={{ marginLeft: '5px' }}
         variant="contained"
         startIcon={<EditIcon />}
         onClick={onCreateStrategyClick}>
            Create Strategy
      </Button></NoData>}
   </Box>
}

function StockStrategyOption(props) {
   const { data } = props;
   return <Box sx={{ width: '100%' }}>
      <Box><strong>{data.name}</strong></Box>
      {data.desc ? <Box sx={{
         fontSize: '0.8rem',
         color: 'gray',
         width: '100%',
         overflow: 'hidden',
         textOverflow: 'ellipsis',
         whiteSpace: 'nowrap'
      }}>
         {data.desc}
      </Box> : null}
   </Box>
}