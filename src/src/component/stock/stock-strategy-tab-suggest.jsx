import { useState, useEffect } from 'react';
import {
   Box, LinearProgress, Pagination, IconButton, Tooltip, Button,
   Table, TableRow, TableCell, TableBody, TableHead,
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import DownloadIcon from '@mui/icons-material/Download';
import NoData from '$/component/shared/no-data';
import StockLink from '$/component/stock/stock-link';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import download from '$/util/file-download';
import { compileRule, analyzeOne } from '$/analysis/strategy/customized';

import { useTranslation } from 'react-i18next';

/*
local.data.strategySuggest = {
   ts,
   strategy,
   i, n,
   result,
};
 */

function StockSuggestProgressBar() {
   const [i, setI] = useState(0);
   const [n, setN] = useState(0);
   const [meta, setMeta] = useState(null);

   useEffect(() => {
      eventbus.on('stock.strategy.suggest.progress', onStockUpdateProgress);
      return () => {
         eventbus.off('stock.strategy.suggest.progress', onStockUpdateProgress);
      };

      function onStockUpdateProgress(data) {
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
      <Box sx={{ whiteSpace: 'nowrap', fontSize: '10px' }}>{`${i} / ${n}`}{meta ? ` - ${meta.code} ${meta.name}` : ''}</Box>
   </Box>;
}

function dup(list) {
   if (!list) return [];
   return list.map(z => Object.assign({}, z));
}

function StockSearchResultList() {
   const { t } = useTranslation('strategy');

   const [data, setData] = useState([]);
   const [loading, setLoading] = useState(false);
   const [pageList, setPageList] = useState([]);
   const [page, setPage] = useState(1);
   const [pageTotal, setPageTotal] = useState(0);
   const [pageSize] = useState(15);
   useEffect(() => {
      eventbus.on('stock.strategy.suggest.search', onStockSuggestUpdate);
      eventbus.on('stock.strategy.suggest.result', onStockSuggestResultUpdate);
      eventbus.on('stock.strategy.suggest.download', onStockSuggestDownload);
      return () => {
         eventbus.off('stock.strategy.suggest.search', onStockSuggestUpdate);
         eventbus.off('stock.strategy.suggest.result', onStockSuggestResultUpdate);
         eventbus.off('stock.strategy.suggest.download', onStockSuggestDownload);
      };

      function onStockSuggestUpdate() {
         setLoading(true);
      }

      function onStockSuggestResultUpdate(data) {
         if (!data) return;
         let { list } = data;
         list = list || [];
         setData(list);
         setPage(1);
         setPageTotal(Math.ceil(list.length / pageSize));
         setPageList(list.slice(0, pageSize));
         setLoading(false);
      }

      function onStockSuggestDownload() {
         if (!data) return;
         download(
            t('t.search.download.filename', `stockSearch.csv`),
            `${t('t.score', 'Score')},${t('t.stock', 'Stock')}," "
${data.length ? data.map(z => `${z.score || 0},"${z.code}","${z.name}"`).join('\n') : t('tip.nodata', 'No satisified stock')}`
         );
      }
   });

   const onPageChange = (_, newPage) => {
      const pm1 = newPage - 1;
      setPage(newPage);
      setPageList(data.slice(pageSize * pm1, pageSize * newPage));
   };

   if (loading) {
      return <NoData>{t('tip.suggest.loading', 'Loading ...')}</NoData>;
   }
   if (!data.length) {
      return <NoData>{t('tip.suggest.noresult', 'No Data')}</NoData>;
   }
   return <Box sx={{ flex: '1 0 auto', height: '0px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {data.length > pageSize ? <Box sx={{ display: 'flex', justifyContent: 'center' }}>
         <Pagination count={pageTotal} page={page} onChange={onPageChange}/>
      </Box> : null}
      <Box sx={{ flex: '1 0 auto', height: '0px', overflow: 'auto', mb: 2 }}>
         <Table size="small"><TableHead><TableRow>
            <TableCell>{t('t.stock', 'Stock')}</TableCell>
            <TableCell>{t('t.score', 'Score')}</TableCell>
         </TableRow></TableHead><TableBody>
            {pageList.map((z, i) => <TableRow key={i}>
               <TableCell><StockLink data={z} /></TableCell>
               <TableCell>{z.score || 0}</TableCell>
            </TableRow>)}
         </TableBody></Table>
      </Box>
   </Box>;
}

export default function StockStrategyEditTab (props) {
   const { t } = useTranslation('strategy');

   const { tab, data } = props;

   useEffect(() => {
      eventbus.on('stock.strategy.suggest', onSuggest);
      eventbus.on('stock.strategy.suggest.cancel', onSuggestCancel);
      return () => {
         eventbus.off('stock.strategy.suggest', onSuggest);
         eventbus.off('stock.strategy.suggest.cancel', onSuggestCancel);
      };

      async function onSuggest(data) {
         if (!data) return;
         const { stg, fav } = data;
         local.data.lastStrategySuggest = data;
         if (!stg) {
            local.data.strategySuggest = null;
            eventbus.emit('stock.strategy.suggest.progress', { i: 0, n: 0 });
            eventbus.emit('stock.strategy.suggest.result', { list: [] });
            return;
         }
         const sig = `${JSON.stringify(stg)}${fav ? '-fav' : ''}`;
         if (local.data.strategySuggest) {
            if (local.data.strategySuggest.sig === sig) return;
         }
         const list = dup((fav ? (await databox.stock.getPinnedStockList()) : (await databox.stock.getStockList())) || []);
         if (!list.length) {
            local.data.strategySuggest = null;
            eventbus.emit('stock.strategy.suggest.progress', { i: 0, n: 0 });
            eventbus.emit('stock.strategy.suggest.result', { list: [] });
            return;
         }
         const ts = new Date().getTime();
         local.data.strategySuggest = {
            ts, sig,
            strategy: stg,
            i: 0, n: list.length,
            result: list,
         };
         const compiledRule = await compileRule(stg);
         eventbus.emit('stock.strategy.suggest.search');
         eventbus.emit('stock.strategy.suggest.progress', { i: 0, n: list.length });
         for (let i = 0, n = list.length; i < n; i++) {
            if (!local.data.strategySuggest) return; // canceled
            const stock = list[i];
            eventbus.emit('stock.strategy.suggest.progress', { i: i+1, n: list.length, meta: stock });
            const data = (await databox.stock.getStockHistoryRaw(stock.code)) || [];
            const r = await analyzeOne({ meta: stock, raw: data }, compiledRule);
            stock.score = r ? r.score : -Infinity;
         }
         list.sort((a, b) => b.score - a.score);
         eventbus.emit('stock.strategy.suggest.progress', { i: 0, n: 0 });
         eventbus.emit('stock.strategy.suggest.result', { list });
      }

      function onSuggestCancel() {
         const prevList = local.data.strategySuggest?.result || [];
         local.data.strategySuggest = null;
         eventbus.emit('stock.strategy.suggest.result', { list: prevList });
      }
   });

   const onRefreshClick = () => {
      const last = local.data.lastStrategySuggest;
      local.data.strategySuggest = null;
      if (last) eventbus.emit('stock.strategy.suggest', last);
   };
   const onFilterClick = () => {
      const last = local.data.lastStrategySuggest;
      local.data.strategySuggest = null;
      if (last) eventbus.emit('stock.strategy.suggest', {...last, fav: false});
   };
   const onFilterFavClick = () => {
      const last = local.data.lastStrategySuggest;
      local.data.strategySuggest = null;
      if (last) eventbus.emit('stock.strategy.suggest', {...last, fav: true});
   };
   const onDownloadClick = () => {
      eventbus.emit('stock.strategy.suggest.download');
   };

   return <Box sx={{
      display: tab === 'suggest' ? 'flex' : 'none',
      flexDirection: 'column',
      flex: '1 0 auto',
      height: '0px',
      overflowY: 'hidden',
      mb: 1
   }}>
      <Box>
         <Tooltip title={t('t.refresh', 'Refresh')}>
            <IconButton onClick={onRefreshClick}><UpdateIcon /></IconButton>
         </Tooltip>
         <Tooltip><Button onClick={onFilterClick}>{t('t.filter', 'Filter')}</Button></Tooltip>
         <Tooltip><Button onClick={onFilterFavClick}>{t('t.filter.fav', 'Filter in Fav')}</Button></Tooltip>
         <Tooltip title={t('t.download', 'Download result')}>
            <IconButton onClick={onDownloadClick}><DownloadIcon /></IconButton>
         </Tooltip>
      </Box>
      {data.new ? <NoData>
         {t('tip.warn.notsaved', 'Stock strategy has been not saved yet.')}
      </NoData> : <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
         <Box><StockSuggestProgressBar /></Box>
         <StockSearchResultList />
      </Box>}
   </Box>;
}