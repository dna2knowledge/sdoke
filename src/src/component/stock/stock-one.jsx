import { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import NoData from '$/component/shared/no-data';
import Chart from '$/component/stock/stock-one-chart';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';

export default function StockOne() {
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
         ret = await databox.stock.getStockHistory(one.code);
         ret = ret.slice(ret.length < 250 ? 0 : (ret.length-250));
      } catch(err) { }
      setLoading(false);
      if (oneKey.current !== key) return false;
      if (!ret || !ret.length) {
         eventbus.emit('toast', { content: 'No data; due to an internal server error.', severity: 'error' });
         return;
      }
      setData(ret);
      if (!local.data.view) local.data.view = {};
      local.data.view.one = {
         raw: ret,
         meta: { code: one.code, name: one.name },
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
         (async () => {
            if (one) await updateData(one);
         })();
      }
   }, []);

   if (!meta) return null;
   if (loading) return <NoData>Loading data for {meta.code} {meta.name} ...</NoData>;
   return <Box>
      { data && data.length ? (<Box>
         <Box sx={{ textAlign: 'center', width: '100%' }}>{meta.code} {meta.name}</Box>
         <Box><Chart /></Box>
      </Box>) : <NoData>No Data; no records for <strong>{meta.code} {meta.name}</strong></NoData> }
   </Box>;
}