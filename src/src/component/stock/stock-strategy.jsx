import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Autocomplete, TextField, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NoData from '$/component/shared/no-data';
import StockStrategyEditTab from '$/component/stock/stock-strategy-tab-edit';
import StockStrategySuggestTab from '$/component/stock/stock-strategy-tab-suggest';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';

import { useTranslation } from 'react-i18next';

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

export default function StockStrategy() {
   const { t } = useTranslation('strategy');

   const [tab, setTab] = useState('edit');
   const [strategyList, setStrategyList] = useState([]);
   const [selected, setSelected] = useState(local.data.selectedStockStrategy || null);

   useEffect(() => {
      databox.stock.getStockStrategyList().then(rawList => {
         setStrategyList(rawList || []);
      });
   }, []);

   useEffect(() => {
      eventbus.on('stock.strategy.add', onStockStrategyAdd);
      eventbus.on('stock.strategy.edit', onStockStrategyEdit);
      eventbus.on('stock.strategy.save', onStockStrategySave);
      eventbus.on('stock.strategy.del', onStockStrategyDel);
      eventbus.comp.register('stock.strategy');
      return () => {
         eventbus.off('stock.strategy.add', onStockStrategyAdd);
         eventbus.off('stock.strategy.edit', onStockStrategyEdit);
         eventbus.off('stock.strategy.save', onStockStrategySave);
         eventbus.off('stock.strategy.del', onStockStrategyDel);
         eventbus.comp.unregister('stock.strategy');
      };

      function onStockStrategyAdd() {
         if (local.data.selectedStockStrategy && local.data.selectedStockStrategy.dirty) {
            if (!confirm(t(
               'tip.warn.notsaved',
               "Current strategy has been updated but not saved; do you want to discard the data and create new one?"
            ))) return;
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
         eventbus.emit('stock.strategy.edit.open', item);
      }
      function onStockStrategyEdit(item) {
         if (item && local.data.selectedStockStrategy && local.data.selectedStockStrategy.dirty) {
            if (!confirm(t(
               'tip.warn.notsaved',
               "Current strategy has been updated but not saved; do you want to discard the data and create new one?"
            ))) return;
         }
         setTab('edit');
         local.data.selectedStockStrategy = item;
         setSelected(item);
         eventbus.emit('stock.strategy.edit.open', item);
      }
      function onStockStrategySave(item) {
         if (!item || !item.name) return eventbus.emit('toast', {
            severity: 'error',
            content: t('tip.warn.name.required', 'Strategy name is required')
         });
         const item0 = strategyList.find(z => z.name === item.name);
         const isNew = item.new;
         delete item.new;
         delete item.dirty;
         delete local.data.selectedStockStrategy.dirty;
         // TODO: grammar check for all fields
         item.rule = item.rule.filter(z => /*z.C &&*/ z.F);
         item.vis = item.vis.filter(z => /*z.G &&*/ z.F);
         if (item0) {
            if (isNew) {
               if (!confirm(t(
                  'tip.warn.overwrite.existing',
                  `Are you sure to overwrite the existing strategy named as "{{v}}"`,
                  { v: item.name }
               ))) return;
            }
            Object.assign(item0, item);
         } else {
            strategyList.push(item);
         }
         setStrategyList([...strategyList]);
         setSelected({...item});
         eventbus.emit('stock.strategy.edit.open', item);
         databox.stock.setStockStrategyList(strategyList);
      }
      function onStockStrategyDel(item) {
         if (!item) return;
         if (item.new) {
            local.data.selectedStockStrategy = null;
            setSelected(null);
            return;
         }
         if (!item.name) return;
         const item0 = strategyList.find(z => z.name === item.name);
         if (!item0) return;
         const index = strategyList.indexOf(item0);
         strategyList.splice(index, 1);
         setStrategyList([...strategyList]);
         local.data.selectedStockStrategy = null;
         setSelected(null);
         databox.stock.setStockStrategyList(strategyList);
      }
   }, [strategyList, selected]);

   const onCreateStrategyClick = () => eventbus.emit('stock.strategy.add');

   return <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: '10px' }}>
         <Autocomplete sx={{ ml: 1, flex: '1 0 auto', '.MuiInputBase-input': { height: '10px' } }}
            options={strategyList}
            getOptionLabel={option => `${option.name}`}
            onChange={(_, val) => {
               eventbus.emit('stock.strategy.edit', val);
            }}
            renderOption={(props, item) => <li {...props} key={item.name}><StockStrategyOption data={item} /></li>}
            renderInput={params =>
               <TextField sx={{ width: '100%', borderBottom: '1px solid #ccc' }} placeholder={t('t.strategy.name', "Strategy Name")}
                  {...params}
               />
            }
            noOptionsText={<Box>
               {t('tip.warn.nostrategy', 'No available strategy.')} <Button
                  sx={{ marginLeft: '5px' }}
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={onCreateStrategyClick}>
                     {t('t.create.strategy', 'Create Strategy')}
               </Button>
            </Box>}
         />
      </Box>
      {selected ?
      (<Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}><Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)}>
          <Tab value="edit" label={t('t.basicinfo', "Basic Info")} />
          <Tab value="suggest" label={t('t.search', "Search")} />
        </Tabs>
      </Box>
      <StockStrategyEditTab tab={tab} data={selected} />
      <StockStrategySuggestTab tab={tab} data={selected} /></Box>) :
      <NoData>{t('tip.warn.noselect', 'No Strategy data; please search and select one or')} <Button
         sx={{ marginLeft: '5px' }}
         variant="contained"
         startIcon={<EditIcon />}
         onClick={onCreateStrategyClick}>
            {t('t.create.strategy', 'Create Strategy')}
      </Button></NoData>}
   </Box>
}