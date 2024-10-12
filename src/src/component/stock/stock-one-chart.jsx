import { useRef, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import DayIcon from '@mui/icons-material/Today';
import WeekIcon from '@mui/icons-material/DateRange';
import MonthIcon from '@mui/icons-material/CalendarMonth';
import StockChartRangeSlider from '$/component/stock/stock-chart-rangeslider';
import StockChartTooltip from '$/component/stock/stock-chart-tooltip';
import eventbus from '$/service/eventbus';
import local from '$/service/local';
import pickHSLColor from '$/util/color-hsl-pick'
import dailyToWeekly from '$/analysis/transform/weekly';
import dailyToMonthly from '$/analysis/transform/monthly';
import { TYPE } from '$/analysis/math/calc';
import { useChart, paintBasic, paintIndex } from '$/component/stock/stock-chart-canvas';
// if enable d3: import { useChart, paintBasic, paintIndex } from '$/component/stock/stock-chart-d3';

import { useTranslation } from 'react-i18next';

const nshow = 250;
function initChartConfig() {
   // t = 'd'/daily, 'w'/weekly, 'm'/monthly
   if (!local.data.view.chartConfig) local.data.view.chartConfig = {
      i: 0, n: nshow,
      di: 0, dn: nshow,
      wi: 0, wn: nshow,
      mi: 0, mn: nshow,
      t: 'd',
      sliderData: null,
   };
}

const repaintStat = {
   busy: false,
};
async function repaint(kCanvas, indexCanvas, data) {
   if (repaintStat.busy) return;
   if (!kCanvas || !indexCanvas) return;
   repaintStat.busy = true;
   try {
      if (!local.data.view.one) local.data.view.one = {};
      initChartConfig();
      data.config = local.data.view.chartConfig;
      if (!data.config.n) data.config.n = nshow;

      data.data = {...local.data.view.one};
      switch(data.config.t) {
         case 'w':
            data.data.raw = dailyToWeekly(local.data.view.one.raw); break;
         case 'm':
            data.data.raw = dailyToMonthly(local.data.view.one.raw); break;
      }
      const n0 = data.data.raw.length;
      const i = data.config.i;
      const n = data.config.n > n0 ? n0 : data.config.n;
      data.config.n0 = nshow >= n0 ? n0 : nshow;
      data.config.sliderData = nshow >= n0 ? data.data.raw : data.data.raw.slice(n0-nshow);
      if (n0 <= nshow) {
         data.data.raw = data.data.raw.slice(i, i+n);
      } else {
         data.data.raw = data.data.raw.slice(n0-nshow+i, n0-nshow+i+n);
      }

      if (local.data.view.strategy) {
         data.strategy = {...local.data.view.strategy};
         data.strategy.stat = {...data.strategy.stat};
         data.strategy.stat.d250 = data.strategy.stat.d250.slice();
      }
      if (data.config.t === 'd' && local.data.view.strategy) {
      } else if (data.config.t === 'w' && data.data.raw?.length && local.data.view.strategyAll) {
         const mints = data.data.raw[0].T;
         const maxts = data.data.raw[data.data.raw.length-1].T + 24 * 3600 * 1000 * 7;
         const todo = local.data.view.strategyAll.filter(z => z.T >= mints && z.T < maxts);
         const w = data.data.raw.map(z => ({ T: z.T, score: 0, n: 0 }));
         for(let i = 0, j = w.length-1, wn = todo.length-1; i < wn && j >= 0; i++) {
            const one = todo[i];
            while (w[j] && w[j].T > one.T) j--;
            if (j < 0) break;
            const curw = w[j];
            curw.score += one.score;
            curw.n ++;
         }
         w.forEach(z => { if (z.n) z.score /= z.n; });
         w.reverse();
         data.strategy = {...local.data.view.strategy};
         data.strategy.stat = {...data.strategy.stat};
         const last = w.shift();
         data.strategy.score = last.score;
         data.strategy.stat.d250 = w;
      } else if (data.config.t === 'm' && data.data.raw?.length && local.data.view.strategyAll) {
         const mints = data.data.raw[0].T;
         const maxts = data.data.raw[data.data.raw.length-1].T + 24 * 3600 * 1000 * 30;
         const todo = local.data.view.strategyAll.filter(z => z.T >= mints && z.T < maxts);
         const m = data.data.raw.map(z => ({ T: z.T, score: 0, n: 0 }));
         for(let i = 0, j = m.length-1, mn = todo.length-1; i < mn && j >= 0; i++) {
            const one = todo[i];
            while (m[j] && m[j].T > one.T) j--;
            if (j < 0) break;
            const curm = m[j];
            curm.score += one.score;
            curm.n ++;
         }
         m.forEach(z => { if (z.n) z.score /= z.n; });
         m.reverse();
         data.strategy = {...local.data.view.strategy};
         data.strategy.stat = {...data.strategy.stat};
         const last = m.shift();
         data.strategy.score = last.score;
         data.strategy.stat.d250 = m;
      } else {
         data.strategy = null;
      }
      if (data.strategy) {
         const stat = data.strategy.stat;
         const dn = stat.d250.length;
         stat.d250.unshift({ score: data.strategy.score });
         if (dn >= nshow) {
            stat.d250 = stat.d250.slice(0, nshow);
            stat.d250.reverse();
            const last = stat.d250[i];
            stat.d250 = stat.d250.slice(i+1, i+n);
            stat.d250.reverse();
            data.strategy.score = last.score;
         } else {
            stat.d250 = stat.d250.slice();
            stat.d250.reverse();
            let i1 = dn - n0;
            if (i1 < 0) i1 = 0;
            const last = stat.d250[stat.d250.length-1];
            stat.d250 = stat.d250.slice(i1);
            data.strategy.score = last.score;
            stat.d250.reverse();
         }
      }

      data.index = local.data.view.index;
      if (data.index) {
         data.index = data.index.map((z, j) => {
            switch(data.config.t) {
               case 'd':
                  if (z.type > TYPE.DAILY) return null;
                  break;
               case 'w':
                  if (z.type > TYPE.WEEKLY || z.type === TYPE.DAILY) return null;
                  break;
               case 'm':
                  if (z.type > TYPE.MONTHLY || z.type === TYPE.DAILY || z.type === TYPE.WEEKLY) return null;
                  break;
            }
            const dup = {...z};
            if (Array.isArray(dup.val)) {
               let n1 = dup.val.length;
               let i1 = n1 - nshow + i;
               n1 = i1 + n;
               if (n1 < 0) dup.val = [];
               else if (i1 < 0) {
                  i1 = 0;
                  dup.val = dup.val.slice(i1, n1);
               } else {
                  dup.val = dup.val.slice(i1, n1);
               }
            }
            if (!dup.c) dup.c = pickHSLColor(j);
            return dup;
         }).filter(z => !!z);
      }
      paintBasic(kCanvas, data);
      paintIndex(indexCanvas, data);
      eventbus.emit('stock.chart.rangeslider');
   } catch { }
   repaintStat.busy = false;
}

export default function StockOneChart() {
   const { t } = useTranslation('viewer');

   const dataRef = useRef({});

   const reload = () => {
      repaint(canvasRef.current, indexCanvasRef.current, dataRef.current);
   };

   useEffect(() => {
      eventbus.comp.register('stock.chart');
      eventbus.on('stock.chart.basic', handleStockChartRepaint);
      eventbus.on('stock.chart.strategy', handleStockChartRepaint);
      eventbus.on('stock.chart.index', handleStockChartRepaint);
      return () => {
         eventbus.off('stock.chart.basic', handleStockChartRepaint);
         eventbus.off('stock.chart.strategy', handleStockChartRepaint);
         eventbus.off('stock.chart.index', handleStockChartRepaint);
         eventbus.comp.unregister('stock.chart');
      };
      function handleStockChartRepaint() {
         reload();
      }
   }, []);

   const [ChartImpl, canvasRef, indexCanvasRef] = useChart(dataRef, t);

   useEffect(() => local.data.view && reload());

   const onDayClick = () => {
      initChartConfig();
      const chartconfig = local.data.view.chartConfig;
      chartconfig.t = 'd';
      chartconfig.i = chartconfig.di;
      chartconfig.n = chartconfig.dn;
      reload();
   };
   const onWeekClick = () => {
      initChartConfig();
      const chartconfig = local.data.view.chartConfig;
      chartconfig.t = 'w';
      chartconfig.i = chartconfig.wi;
      chartconfig.n = chartconfig.wn;
      reload();
   };
   const onMonthClick = () => {
      initChartConfig();
      const chartconfig = local.data.view.chartConfig;
      chartconfig.t = 'm';
      chartconfig.i = chartconfig.mi;
      chartconfig.n = chartconfig.mn;
      reload();
   };

   return <Box>
      <Box sx={{ display: 'flex' }}>
         <Box sx={{ flex: '1 0 auto' }}>
            <Tooltip title={t('t.daily', 'Daily')}>
               <IconButton onClick={onDayClick}><DayIcon /></IconButton>
            </Tooltip>
            <Tooltip title={t('t.weekly', 'Weekly')}>
               <IconButton onClick={onWeekClick}><WeekIcon /></IconButton>
            </Tooltip>
            <Tooltip title={t('t.monthly', 'Monthly')}>
               <IconButton onClick={onMonthClick}><MonthIcon /></IconButton>
            </Tooltip>
         </Box>
         <StockChartRangeSlider />
      </Box>
      {ChartImpl}
      <StockChartTooltip />
   </Box>;
}