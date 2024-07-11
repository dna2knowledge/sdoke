import { useState, useEffect } from 'react';
import {
   Box, Button, IconButton, Tooltip, TextField, LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DownloadIcon from '@mui/icons-material/Download';
import StockSearchResultListByFormula from '$/component/stock/stock-search-result-by-formula';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import download from '$/util/file-download';
import shallowDupObjectList from '$/util/shallow-dup-objlist';

import { useTranslation } from 'react-i18next';

function StockSearchProgressBar() {
   const [text, setText] = useState('');
   const [i, setI] = useState(0);
   const [n, setN] = useState(0);
   const [meta, setMeta] = useState(null);

   useEffect(() => {
      eventbus.on('stock.search.progress', onStockUpdateProgress);
      return () => {
         eventbus.off('stock.search.progress', onStockUpdateProgress);
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

export default function StockSearchByFormula() {
   const { t } = useTranslation('search');

   const [query, setQuery] = useState('');
   const [sort, setSort] = useState('');
   const [round, setRound] = useState(local.data.searchResult?.i || 0);
   const [total, setTotal] = useState(0);

   useEffect(() => {
      eventbus.on('stock.search.result', onRoundUpdate);
      return () => {
         eventbus.off('stock.search.result', onRoundUpdate);
      };

      function onRoundUpdate(step) {
         if (!step) return;
         const i = local.data.searchResult.i;
         setRound(i);
         setTotal(step.list?.length || 0);
         setQuery(step.query);
         setSort(step.sort);
      }
   });

   useEffect(() => {
      if (local.data.searchResult?.steps?.length) {
         const steps = local.data.searchResult.steps;
         const i = steps.length - 1;
         const step = steps[i];
         local.data.searchResult.i = i;
         eventbus.emit('stock.search.result', step);
      } else {
         // XXX: cannot update when it is updated;
         //      wait for move code into components from here in page
         databox.stock.getStockList().then(rawList => {
            const list = shallowDupObjectList(rawList);
            local.data.searchResult = { steps: [{ list, query: '', sort: '' }], i: 0 };
            eventbus.emit('stock.search.result', local.data.searchResult.steps[0]);
         });
      }
   }, []);

   const onRoundPrev = () => {
      const i = local.data.searchResult.i;
      if (i <= 0) return;
      local.data.searchResult.i --;
      eventbus.emit('stock.search.result', local.data.searchResult.steps[i-1]);
   };
   const onRoundNext = () => {
      const i = local.data.searchResult.i;
      if (i >= local.data.searchResult.steps.length - 1) return;
      local.data.searchResult.i ++;
      eventbus.emit('stock.search.result', local.data.searchResult.steps[i+1]);
   };

   const onSearch = (nest, fav) => {
      if (!nest && !query && !sort) {
         eventbus.emit('stock.search.search', null);
         return;
      }
      eventbus.emit('stock.search.search', {
         nest,
         fav,
         query,
         sort,
      });
   };

   const onDownloadClick = () => {
      if (!local.data.searchResult) return;
      const i = local.data.searchResult.i;
      const step = local.data.searchResult.steps[i];
      if (!step) return;
      download(
         t('t.search.download.filename', `stockSearch.csv`),
         `${t('t.score', 'Score')},${t('t.stock', 'Stock')}," "
"${t('t.filter.formula', 'Filter Formula')}: ${step.query}"
"${t('t.sort.formula', 'Sort Formula')}: ${step.sort}"
${step.list.length ? step.list.map(z => `${z.score || 0},"${z.code}","${z.name}"`).join('\n') : t('tip.nodata', 'No satisified stock')}`
      );
   };

   return <Box sx={{
      width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px',
      margin: '0 auto', display: 'flex', flexDirection: 'column'
   }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: '10px' }}>
         <TextField sx={{ mt: 1, ml: 1, flex: '1 0 auto' }} fullWidth label={t('t.filter.formula', "Filter formula")}
            placeholder="e.g. (.C.at(day(0)) - .C.at(day(-1)))/.C.at(day(-1))>0.05"
            value={query} onChange={(evt) => setQuery(evt.target.value || '')} />
         <TextField sx={{ mt: 1, ml: 1, flex: '1 0 auto' }} fullWidth label={t('t.sort.formula', "Sort formula")}
            placeholder="e.g. .H.at(day(0))"
            value={sort} onChange={(evt) => setSort(evt.target.value || '')} />
         <Box>
            <IconButton onClick={onRoundPrev}><KeyboardArrowLeftIcon/></IconButton>
            <span>{t('t.round', 'Round {{v}}', { v: round })}</span>, <span>{t('t.result.total', 'Total {{v}}', { v: total })}</span>
            <IconButton onClick={onRoundNext}><KeyboardArrowRightIcon/></IconButton>
            <Tooltip title={t('t.download', 'Download result')}>
               <IconButton onClick={onDownloadClick}><DownloadIcon /></IconButton>
            </Tooltip>
            <Button onClick={() => onSearch(false, false)}><SearchIcon /> {t('t.search', 'Search')}</Button>
            <Button onClick={() => onSearch(false, true)}><SearchIcon /> {t('t.search.fav', 'Search in fav')}</Button>
            <Button onClick={() => onSearch(true, false)}><SearchIcon /> {t('t.search.result', 'Search in result')}</Button>
         </Box>
      </Box>
      <Box><StockSearchProgressBar/></Box>
      <StockSearchResultListByFormula />
   </Box>;
}