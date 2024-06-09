import { useState } from 'react';
import { Box, Tabs, Tab, Autocomplete, TextField, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NoData from '$/component/shared/no-data';
import StockStrategyEditTab from '$/component/stock/stock-strategy-tab-edit';
import StockStrategySuggestTab from '$/component/stock/stock-strategy-tab-suggest';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';

export default function StockStrategy() {
   const [tab, setTab] = useState('edit');
   const [strategyList, setStrategyList] = useState([]);

   return <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: '10px' }}>
         <Autocomplete sx={{ ml: 1, flex: '1 0 auto', '.MuiInputBase-input': { height: '10px' } }} disablePortal
            options={strategyList}
            getOptionLabel={option => `${option.name}`}
            onChange={(_, val) => {
               eventbus.emit('stock.pinned.add', val);
            }}
            renderInput={params =>
               <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder="Strategy Name"
                  {...params}
               />
            }
            noOptionsText={<Box>
               No available strategy. <Button sx={{ marginLeft: '5px' }} variant="contained" startIcon={<EditIcon />}>
                  Create Strategy
               </Button>
            </Box>}
         />
      </Box>
      {strategyList.length ?
      (<Box><Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)}>
          <Tab value="edit" label="Basic Info" />
          <Tab value="suggest" label="Search" />
        </Tabs>
      </Box>
      <StockStrategyEditTab tab={tab} />
      <StockStrategySuggestTab tab={tab} /></Box>) :
      <NoData>No Strategy data; please search and select one or <Button sx={{ marginLeft: '5px' }} variant="contained" startIcon={<EditIcon />}>
         Create Strategy
      </Button></NoData>}
   </Box>
}
