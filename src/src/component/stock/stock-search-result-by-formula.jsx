import { useState, useEffect } from 'react';
import {
   Box, Pagination,
   Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import NoData from '$/component/shared/no-data';
import StockLink from '$/component/stock/stock-link';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import calc from '$/analysis/math/calc';
import shallowDupObjectList from '$/util/shallow-dup-objlist';

import { useTranslation } from 'react-i18next';

async function filterStock(stockList, searchFormula, sortFormula, t) {
   if (searchFormula) {
      const searchTitle = t('t.search', 'Search');
      const expr = calc.compile(calc.tokenize(searchFormula));
      if (expr.err) {
         eventbus.emit('toast', {
            severity: 'error',
            content: `${t('tip.search.syntax.error', 'Search formula syntax error')} - ${JSON.stringify(expr.err)}`
         });
         return stockList;
      }
      const r = [];
      const n = stockList.length;
      eventbus.emit('stock.search.progress', { t: searchTitle, i: 0, n });
      for (let i = 0; i < n; i++) {
         // TODO: report progress
         const stock = stockList[i];
         if (!stock) continue;
         eventbus.emit('stock.search.progress', { t: searchTitle, i: i+1, n, meta: stock });
         const hdata = await databox.stock.getStockHistoryRaw(stock.code);
         const val = await calc.evaluate(expr, hdata);
         if (val) r.push(stock);
      }
      eventbus.emit('stock.search.progress', { i: 0, n: 0 });
      stockList.forEach(z => { z.score = 0; });
      return sortFormula ? (await sortStock(r, sortFormula, t)) : r;
   } else {
      return await sortStock(stockList, sortFormula, t);
   }
}

async function sortStock(stockList, sortFormula, t) {
   if (sortFormula) {
      const sortTitle = t('t.sort', 'Sort');
      const expr = calc.compile(calc.tokenize(sortFormula));
      if (expr.err) {
         eventbus.emit('toast', {
            severity: 'error',
            content: `${t('tip.sort.syntax.error', 'Sort formula syntax error')} - ${JSON.stringify(expr.err)}`
         });
         return stockList;
      }
      const n = stockList.length;
      eventbus.emit('stock.search.progress', { t: sortTitle, i: 0, n });
      for (let i = 0; i < n; i++) {
         // TODO: report progress
         const stock = stockList[i];
         if (!stock) continue;
         eventbus.emit('stock.search.progress', { t: sortTitle, i: i+1, n, meta: stock });
         const hdata = await databox.stock.getStockHistoryRaw(stock.code);
         const score = await calc.evaluate(expr, hdata);
         stock.score = score;
      }
      stockList.sort((a, b) => {
         if (!a || a.score === undefined) return -1;
         if (!b || b.score === undefined) return 1;
         return b.score - a.score;
      });
      eventbus.emit('stock.search.progress', { i: 0, n: 0 });
   }
   return stockList;
}

export default function StockSearchResultListByFormula() {
   const { t } = useTranslation('search');

   const [data, setData] = useState([]);
   const [loading, setLoading] = useState(false);
   const [query, setQuery] = useState('');
   const [pageList, setPageList] = useState([]);
   const [page, setPage] = useState(1);
   const [pageTotal, setPageTotal] = useState(0);
   const [pageSize] = useState(15);
   useEffect(() => {
      eventbus.on('stock.search.search', onStockSearchSearchUpdate);
      eventbus.on('stock.search.result', onStockSearchResultUpdate);
      return () => {
         eventbus.off('stock.search.search', onStockSearchSearchUpdate);
         eventbus.off('stock.search.result', onStockSearchResultUpdate);
      };

      async function onStockSearchSearchUpdate(Q) {
         if (Q) {
            if (!Q.query && !Q.sort) return;
            const lastStep = local.data.searchResult.steps[local.data.searchResult.i];
            if (lastStep.query === Q.query && lastStep.sort === Q.sort && lastStep.fav === Q.fav) return;
            setLoading(true);
            eventbus.emit('loading');
            if (Q.nest) {
               // nested; search in result
               const step = {
                  query: Q.query,
                  sort: Q.sort,
                  list: await filterStock(shallowDupObjectList(data), Q.query, Q.sort, t)
               };
               local.data.searchResult.steps = local.data.searchResult.steps.slice(0, local.data.searchResult.i + 1);
               local.data.searchResult.i = local.data.searchResult.steps.length;
               local.data.searchResult.steps.push(step);
               eventbus.emit('stock.search.result', step);
            } else {
               // search
               const stockList = shallowDupObjectList(
                  Q.fav ?
                  (await databox.stock.getPinnedStockList()) :
                  (await databox.stock.getStockList())
               );
               const step = {
                  fav: Q.fav,
                  query: Q.query,
                  sort: Q.sort,
                  list: await filterStock(stockList, Q.query, Q.sort, t),
               };
               local.data.searchResult.steps = [local.data.searchResult.steps[0]];
               local.data.searchResult.steps.push(step);
               local.data.searchResult.i = 1;
               eventbus.emit('stock.search.result', step);
            }
         } else {
            const stockList = shallowDupObjectList(await databox.stock.getStockList());
            local.data.searchResult = { steps: [{ query: '', sort: '', list: stockList }], i: 0 };
            eventbus.emit('stock.search.result', local.data.searchResult.steps[0]);
         }
      }
      function onStockSearchResultUpdate(data) {
         if (!data) return;
         let { query, list } = data;
         list = list || [];
         setQuery(query);
         setData(list);
         setPage(1);
         setPageTotal(Math.ceil(list.length / pageSize));
         setPageList(list.slice(0, pageSize));
         setLoading(false);
         eventbus.emit('loaded');
      }
   });

   const onPageChange = (a, newPage) => {
      const pm1 = newPage - 1;
      setPage(newPage);
      setPageList(data.slice(pageSize * pm1, pageSize * newPage));
   };

   if (!data.length) {
      if (query) {
         return <NoData>{t('tip.noquery', 'No Data; no result for')} "<strong>{query}</strong>".</NoData>;
      } else {
         return <NoData>{t('tip.noresult', 'No Data; type sth for a search.')}</NoData>;
      }
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