import { useState, useEffect } from 'react';
import {
   Box, Button, TextField, Pagination,
   Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NoData from '$/component/shared/no-data';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import calc from '$/analysis/math/calc';

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
      <Box>
         <Typography sx={{ whiteSpace: 'nowrap' }} variant="body2" color="text.secondary">{text || ''}{` ${i} / ${n}`}</Typography>
      </Box>
   </Box>;
}

function dup(list) {
   if (!list) return [];
   return list.map(z => Object.assign({}, z));
}

async function filterStock(stockList, searchFormula, sortFormula) {
   if (searchFormula) {
      const expr = calc.compile(calc.tokenize(searchFormula));
      if (expr.err) {
         eventbus.emit('toast', { severity: 'error', content: `Search formula syntax error - ${JSON.stringify(expr.err)}` });
         return stockList;
      }
      const r = [];
      const n = stockList.length;
      eventbus.emit('stock.search.progress', { t: 'Search', i: 0, n });
      for (let i = 0; i < n; i++) {
         // TODO: report progress
         const stock = stockList[i];
         if (!stock) continue;
         const hdata = await databox.stock.getStockHistoryRaw(stock.code);
         const val = await calc.evaluate(expr, hdata);
         if (val) r.push(stock);
         eventbus.emit('stock.search.progress', { t: 'Search', i, n });
      }
      stockList.forEach(z => { z.score = 0; });
      return sortFormula ? (await sortStock(r, sortFormula)) : r;
   } else {
      return await sortStock(stockList, sortFormula);
   }
}

async function sortStock(stockList, sortFormula) {
   if (sortFormula) {
      const expr = calc.compile(calc.tokenize(sortFormula));
      if (expr.err) {
         eventbus.emit('toast', { severity: 'error', content: `Sort formula syntax error - ${JSON.stringify(expr.err)}` });
         return stockList;
      }
      const n = stockList.length;
      eventbus.emit('stock.search.progress', { t: 'Sort', i: 0, n });
      for (let i = 0; i < n; i++) {
         // TODO: report progress
         const stock = stockList[i];
         if (!stock) continue;
         const hdata = await databox.stock.getStockHistoryRaw(stock.code);
         const score = await calc.evaluate(expr, hdata);
         stock.score = score;
         eventbus.emit('stock.search.progress', { t: 'Sort', i, n });
      }
      stockList.sort((a, b) => {
         if (!a || a.score === undefined) return -1;
         if (!b || b.score === undefined) return 1;
         return b.score - a.score;
      });
   }
   return stockList;
}

function StockSearchResultList() {
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
            setLoading(true);
            eventbus.emit('loading');
            if (Q.nest) {
               // nested; search in result
               eventbus.emit('stock.search.result', {
                  query: Q.query,
                  list: await filterStock(data, Q.query, Q.sort),
               });
            } else {
               // search
               const stockList = dup(await databox.stock.getStockList());
               eventbus.emit('stock.search.result', {
                  query: Q.query,
                  list: await filterStock(stockList, Q.query, Q.sort),
               });
            }
         } else {
            const stockList = dup(await databox.stock.getStockList());
            eventbus.emit('stock.search.result', { query: '', list: stockList });
         }
      }
      function onStockSearchResultUpdate(data) {
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
         return <NoData>No Data; no result for "<strong>{query}</strong>".</NoData>;
      } else {
         return <NoData>No Data; type sth for a search.</NoData>;
      }
   }
   return <Box sx={{ flex: '1 0 auto', height: '0px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {data.length > pageSize ? <Box sx={{ display: 'flex', justifyContent: 'center' }}>
         <Pagination count={pageTotal} page={page} onChange={onPageChange}/>
      </Box> : null}
      <Box sx={{ flex: '1 0 auto', height: '0px', overflow: 'auto', mb: 2 }}>
         <Table size="small"><TableHead><TableRow>
            <TableCell>Stock</TableCell>
            <TableCell>Score</TableCell>
         </TableRow></TableHead><TableBody>
            {pageList.map((z, i) => <TableRow key={i}>
               <TableCell>{z.code} {z.name}</TableCell>
               <TableCell>{z.score || 0}</TableCell>
            </TableRow>)}
         </TableBody></Table>
      </Box>
   </Box>;
}

export default function StockSearch() {
   const [query, setQuery] = useState('');
   const [sort, setSort] = useState('');
   useEffect(() => {
      databox.stock.getStockList().then(rawList => {
         eventbus.emit('stock.search.result', { query: '', list: dup(rawList) });
      });
   }, []);

   const onSearch = (nest) => {
      if (!nest && !query && !sort) {
         eventbus.emit('stock.search.search', null);
         return;
      }
      eventbus.emit('stock.search.search', {
         nest,
         query,
         sort,
      });
   };

   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <Box sx={{ width: '100%', height: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
         <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: '10px' }}>
            <TextField sx={{ mt: 1, ml: 1, flex: '1 0 auto' }} fullWidth label="Filter formula"
               placeholder="e.g. (.C.at(day(0)) - .C.at(day(-1)))/.C.at(day(-1))>0.05"
               value={query} onChange={(evt) => setQuery(evt.target.value || '')} />
            <TextField sx={{ mt: 1, ml: 1, flex: '1 0 auto' }} fullWidth label="Sort formula"
               placeholder="e.g. .H.at(day(0))"
               value={sort} onChange={(evt) => setSort(evt.target.value || '')} />
            <Box>
               <Button type="button" sx={{ p: '10px' }} onClick={() => onSearch(false)}><SearchIcon /> Search</Button>
               <Button type="button" sx={{ p: '10px' }} onClick={() => onSearch(true)}><SearchIcon /> Search in result</Button>
            </Box>
         </Box>
         <Box><StockSearchProgressBar/></Box>
         <StockSearchResultList />
      </Box>
   </Box>;
}
