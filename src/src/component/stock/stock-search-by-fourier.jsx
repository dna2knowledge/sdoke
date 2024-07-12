import { useState, useEffect } from 'react';
import {
   Box, Button, IconButton, Tooltip, LinearProgress,
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import NoData from '$/component/shared/no-data';
import StockSearchResultItemByFourier from '$/component/stock/stock-search-result-item-by-fourier';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import { act as fourierAct } from '$/analysis/trend/fourier';

import { useTranslation } from 'react-i18next';

function StockSearchProgressBar() {
   const [text, setText] = useState('');
   const [i, setI] = useState(0);
   const [n, setN] = useState(0);
   const [meta, setMeta] = useState(null);

   useEffect(() => {
      eventbus.on('stock.search.fourier.progress', onStockUpdateProgress);
      return () => {
         eventbus.off('stock.search.fourier.progress', onStockUpdateProgress);
      };

      function onStockUpdateProgress(data) {
         setText(data.t || '');
         setI(data.i || 0);
         setN(data.n || 0);
         setMeta(data.meta || null);
      }
   }, []);

   if (n === 0) return null;
   const value = Math.floor(i / n * 100);
   return <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
         <LinearProgress variant="determinate" value={value} />
      </Box>
      <Box sx={{ whiteSpace: 'nowrap', fontSize: '10px' }}>{text || ''}{` ${i} / ${n}`}{meta ? ` - ${meta.code} ${meta.name}` : ''}</Box>
   </Box>;
}

export default function StockSearchByFourier() {
   const { t } = useTranslation('search');
   const [result, setResult] = useState(local.data.searchFourierResult || null);

   const updateData = async () => {
      const domain = local.data.searchFourierDomain || 'fav';
      eventbus.emit('loading');
      const rawList = domain === 'fav' ? (await databox.stock.getPinnedStockList()) : (await databox.stock.getStockList());
      const opt = {
         progressFn: (i, n, meta) => eventbus.emit('stock.search.fourier.progress', { i, n, meta })
      };
      if (rawList?.length) {
         const ret = await fourierAct(rawList, 20, opt);
         local.data.searchFourierResult = ret;
      } else {
         local.data.searchFourierResult = null;
      }
      eventbus.emit('stock.search.fourier.result');
      eventbus.emit('loaded');
   };

   useEffect(() => {
      eventbus.on('stock.search.fourier.result', onRoundUpdate);
      return () => {
         eventbus.off('stock.search.fourier.result', onRoundUpdate);
      };

      function onRoundUpdate() {
         setResult(local.data.searchFourierResult || null);
      }
   });

   useEffect(() => {
      if (local.data.searchFourierResult) {
         eventbus.emit('stock.search.fourier.result');
      } else {
         // XXX: cannot update when it is updated;
         //      wait for move code into components from here in page
         updateData();
      }
   }, []);

   const onRefreshClick = () => {
      local.data.searchFourierResult = null;
      updateData();
   };
   const onInFavClick = () => {
      const lastDomain = local.data.searchFourierDomain;
      if (!lastDomain || lastDomain === 'fav') return;
      local.data.searchFourierDomain = 'fav';
      updateData();
   };
   const onInAllClick = () => {
      const lastDomain = local.data.searchFourierDomain;
      if (lastDomain === 'all') return;
      local.data.searchFourierDomain = 'all';
      updateData();
   };

   return <Box sx={{
      width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px',
      margin: '0 auto', display: 'flex', flexDirection: 'column'
   }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: '10px' }}>
         <Box>
            <Tooltip title={t('t.refresh', 'Refresh')}><IconButton onClick={onRefreshClick}><UpdateIcon/></IconButton></Tooltip>
            <Button onClick={onInFavClick}>{t('t.search.fourier.infav', 'In Fav')}</Button>
            <Button onClick={onInAllClick}>{t('t.search.fourier.inall', 'In All')}</Button>
         </Box>
      </Box>
      <Box><StockSearchProgressBar/></Box>
      {result ?
         <Box sx={{ flex: '1 0 auto', height: '0px', overflowY: 'auto' }}>
            {result.map((z, i) => <StockSearchResultItemByFourier key={i} data={z} />)}
         </Box> :
         <NoData>{t('tip.search.fourier.nodata', 'No found favorite stocks and no result.')}</NoData>}
   </Box>;
}