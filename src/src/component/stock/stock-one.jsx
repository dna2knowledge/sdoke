import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import NoData from '$/component/shared/no-data';
import Chart from '$/component/stock/stock-one-chart';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';

import { useTranslation } from 'react-i18next';

export default function StockOne() {
   const { t } = useTranslation('viewer');

   const [meta, setMeta] = useState(null);
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState(null);
   const oneKey = useRef(null);

   const updateData = async (one) => {
      const key = `stock.one.${one.code}.${Math.random()}`;
      oneKey.current = key;
      let ret;
      setLoading(true);
      try {
         ret = (await databox.stock.getStockHistory(one.code)) || [];
         ret = ret.map(z => ({...z}));
      } catch(err) { }
      setLoading(false);
      if (oneKey.current !== key) return false;
      if (!ret || !ret.length) {
         eventbus.emit('toast', {
            content: t('view.warn.internal.error', 'No data; due to an internal server error.'),
            severity: 'error'
         });
         return;
      }
      setData(ret);
      if (!local.data.view) local.data.view = {};
      local.data.view.one = {
         raw: ret,
         meta: { code: one.code, name: one.name, area: one.area },
      };
      eventbus.comp.waitUntil('stock.chart').then(() => {
         eventbus.emit('stock.chart.basic');
      });
      return true;
   };

   useEffect(() => {
      eventbus.on('stock.one', handleStockOne);
      return () => {
         eventbus.off('stock.one', handleStockOne);
      };
      function handleStockOne(one) {
         setMeta(one);
         if (one) updateData(one);
      }
   }, []);

   if (!meta) return null;
   if (loading) return <NoData>{t('tip.one.loading', 'Loading data for')} {meta.code} {meta.name} ...</NoData>;
   return <Box>
      { data && data.length ? (<Box>
         <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Tooltip title={t('t.add.fav', 'Add to favorite')}><IconButton
               sx={{ width: '12px', height: '12px' }}
               onClick={() => eventbus.emit('stock.pinned.add', meta)}
            ><BookmarkAddIcon /></IconButton></Tooltip> {meta.code} {meta.name}
            {meta.area ? ` (${meta.area})` : null}
            <Tooltip title={t('t.one.redownload', 'Re-download data')}>
               <IconButton onClick={() => eventbus.emit('stock.data.redownload', meta)}><SettingsBackupRestoreIcon /></IconButton>
            </Tooltip>
         </Box>
         <Box><Chart /></Box>
      </Box>) : <NoData>{t(
         'tip.one.nodata', 'No Data; no records for {{code}} {{name}}',
         { code: meta.code, name: meta.name }
      )}</NoData> }
   </Box>;
}