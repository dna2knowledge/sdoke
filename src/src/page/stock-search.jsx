import { useState, useEffect } from 'react';
import {
   Box, Button, IconButton,
   TextField, Pagination, LinearProgress,
   Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import NoData from '$/component/shared/no-data';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';
import calc from '$/analysis/math/calc';

import { useTranslation } from 'react-i18next';

function StockSearchProgressBar() {
   const [text, setText] = useState('');
   const [i, setI] = useState(0);
   const [n, setN] = useState(0);

   useEffect(() => {
      eventbus.on('stock.search.progress', onStockUpdateProgress);
      return () => {
         eventbus.off('stock.search.progress', onStockUpdateProgress);
      };

      function onStockUpdateProgress(data) {
         setText(data.t || '');
         setI(data.i || 0);
         setN(data.n || 0);
      }
   }, []);

   if (n === 0) return null;
   const value = Math.floor(i / n * 100);
   return <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
         <LinearProgress variant="determinate" value={value} />
      </Box>
      <Box sx={{ whiteSpace: 'nowrap', fontSize: '10px' }}>{text || ''}{` ${i} / ${n}`}</Box>
   </Box>;
}

function dup(list) {
   if (!list) return [];
   return list.map(z => Object.assign({}, z));
}

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
         const hdata = await databox.stock.getStockHistoryRaw(stock.code);
         const val = await calc.evaluate(expr, hdata);
         if (val) r.push(stock);
         eventbus.emit('stock.search.progress', { t: searchTitle, i, n });
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
         const hdata = await databox.stock.getStockHistoryRaw(stock.code);
         const score = await calc.evaluate(expr, hdata);
         stock.score = score;
         eventbus.emit('stock.search.progress', { t: sortTitle, i, n });
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

function StockLink(props) {
   const { data } = props;
   const onStockTitleClick = () => {
      const holdData = data;
      eventbus.comp.waitUntil('comp.stock.stock-panel').then(() => {
         eventbus.emit('stock.pinned.click', {
            code: holdData.code,
            name: holdData.name,
         });
      });
   };
   return <Box><a href="#/" onClick={onStockTitleClick}>{data.code} {data.name}</a></Box>;
}

function StockSearchResultList() {
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
                  list: await filterStock(dup(data), Q.query, Q.sort, t)
               };
               local.data.searchResult.steps = local.data.searchResult.steps.slice(0, local.data.searchResult.i + 1);
               local.data.searchResult.i = local.data.searchResult.steps.length;
               local.data.searchResult.steps.push(step);
               eventbus.emit('stock.search.result', step);
            } else {
               // search
               const stockList = dup(
                  Q.fav ?
                  (await databox.stock.getPinnedStockList()) :
                  (await databox.stock.getStockList())
               );
               const step = {
                  fav: Q.fav,
                  query: Q.query,
                  sort: Q.sort,
                  list: await filterStock(stockList, Q.query, Q.sort),
               };
               local.data.searchResult.steps = [local.data.searchResult.steps[0]];
               local.data.searchResult.steps.push(step);
               local.data.searchResult.i = 1;
               eventbus.emit('stock.search.result', step);
            }
         } else {
            const stockList = dup(await databox.stock.getStockList());
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

export default function StockSearch() {
   const { t } = useTranslation('search');

   const [query, setQuery] = useState('');
   const [sort, setSort] = useState('');
   const [round, setRound] = useState(local.data.searchResult?.i || 0);

   useEffect(() => {
      eventbus.on('stock.search.result', onRoundUpdate);
      return () => {
         eventbus.off('stock.search.result', onRoundUpdate);
      };

      function onRoundUpdate(step) {
         if (!step) return;
         const i = local.data.searchResult.i;
         setRound(i);
         setQuery(step.query);
         setSort(step.sort);
      }
   });

   useEffect(() => {
      if (local.data.searchResult?.steps?.length) {
         const steps = local.data.searchResult.steps;
         const i = steps.length - 1;
         const step = steps[i];
         eventbus.emit('stock.search.result', step);
      } else {
         // XXX: cannot update when it is updated;
         //      wait for move code into components from here in page
         databox.stock.getStockList().then(rawList => {
            const list = dup(rawList);
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

   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
         <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: '10px' }}>
            <TextField sx={{ mt: 1, ml: 1, flex: '1 0 auto' }} fullWidth label={t('t.filter.formula', "Filter formula")}
               placeholder="e.g. (.C.at(day(0)) - .C.at(day(-1)))/.C.at(day(-1))>0.05"
               value={query} onChange={(evt) => setQuery(evt.target.value || '')} />
            <TextField sx={{ mt: 1, ml: 1, flex: '1 0 auto' }} fullWidth label={t('t.sort.formula', "Sort formula")}
               placeholder="e.g. .H.at(day(0))"
               value={sort} onChange={(evt) => setSort(evt.target.value || '')} />
            <Box>
               <IconButton onClick={onRoundPrev}><KeyboardArrowLeftIcon/></IconButton>
               <span>{t('t.round', 'Round {{v}}', { v: round })}</span>
               <IconButton onClick={onRoundNext}><KeyboardArrowRightIcon/></IconButton>
               <Button type="button" onClick={() => onSearch(false, false)}><SearchIcon /> {t('t.search', 'Search')}</Button>
               <Button type="button" onClick={() => onSearch(false, true)}><SearchIcon /> {t('t.search.fav', 'Search in fav')}</Button>
               <Button type="button" onClick={() => onSearch(true, false)}><SearchIcon /> {t('t.search.result', 'Search in result')}</Button>
            </Box>
         </Box>
         <Box><StockSearchProgressBar/></Box>
         <StockSearchResultList />
      </Box>
   </Box>;
}
