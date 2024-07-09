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

import { useTranslation } from 'react-i18next';

function paintStrategyOne(pen, vx, h0, signal) {
   if (!signal) return;
   let score = signal.score;
   if (score > 1) score = 1; else if (score < -1) score = -1;
   if (score > 0) {
      pen.save(); pen.beginPath(); pen.strokeStyle = `rgba(255, 231, 231, ${score})`;
      pen.moveTo(vx, 0); pen.lineTo(vx, h0); pen.stroke(); pen.restore();
   } else if (score < 0) {
      pen.save(); pen.beginPath(); pen.strokeStyle = `rgba(231, 255, 231, ${-score})`;
      pen.moveTo(vx, 0); pen.lineTo(vx, h0); pen.stroke(); pen.restore();
   }
}

function paintBasic(canvas, data) {
   if (!data || !data.data) return;
   const overview = data.data;
   const strategy = data.strategy;

   data = data.data.raw;
   const wc = canvas.offsetWidth;
   let scale = Math.floor(wc / data.length);
   if (scale <= 0) scale = 1;
   else if (scale > 10) scale = 10;
   const shiftw = Math.floor((wc - data.length * scale) / 2);
   const pen = canvas.getContext('2d');
   const w0 = 365 * scale;
   const h0 = 150;
   const lx = scale;
   let min = Infinity, max = 0, minm = Infinity, maxm = 0;
   data.forEach((item) => {
      if (min > item.L) min = item.L;
      if (max < item.H) max = item.H;
      if (minm > item.V) minm = item.V;
      if (maxm < item.V) maxm = item.V;
   });
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w0, h0);
   pen.lineWidth = lx;

   if (strategy && strategy.meta.code === overview.meta.code) {
      const vx = (data.length-1) * lx + shiftw;
      paintStrategyOne(pen, vx, h0, strategy);
      for (let i = data.length-2, j = 0; i >= 0; i--, j++) {
         const sg = strategy?.stat?.d250?.[j];
         const vx = i * lx + shiftw;
         paintStrategyOne(pen, vx, h0, sg);
      }
   }

   const hm = maxm - minm;
   if (hm === 0) {
      pen.fillStyle = '#ddd';
      pen.fillRect(0, 0, w0, h0);
   } else {
      pen.strokeStyle = '#ddd';
      data.forEach((item, i) => {
         const x = i * lx + shiftw;
         const y = Math.round(h0 * (1 - (item.V - minm)/hm));
         pen.beginPath(); pen.moveTo(x, h0); pen.lineTo(x, y); pen.stroke();
      });
   }

   const h = max - min;
   if (h === 0) {
      pen.fillStyle = 'gray';
      pen.fillRect(0, 10, w0, h0-10);
   } else {
      for (let i = 1; i < 12; i++) {
         const vx = data.length * lx / 12 * i + shiftw;
         pen.save(); pen.beginPath(); pen.strokeStyle = '#5ff'; pen.moveTo(vx, 0); pen.lineTo(vx, 4); pen.stroke(); pen.restore();
      }
      let lastitem = null;
      const lxw = Math.ceil(lx/5);
      data.forEach((item, i) => {
         const ymin = Math.round(h0 * (1 - (item.L - min)/h));
         const yst = Math.round(h0 * (1 - (item.O - min)/h));
         const yed = Math.round(h0 * (1 - (item.C - min)/h));
         const ymax = Math.round(h0 * (1 - (item.H - min)/h));
         const x = i * lx + shiftw;
         if (item.O === item.C) {
            const cr = lastitem ? ((item.C - lastitem.C) / lastitem.C) : 0;
            if (cr < -0.099) {
               const yex =  Math.round(h0 * (1 - (lastitem.C - min)/h));
               pen.fillStyle = 'green'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
               pen.fillRect(x-lx/2, yex, lx, yst - yex);
            } else if (cr > 0.099) {
               const yex =  Math.round(h0 * (1 - (lastitem.C - min)/h));
               pen.fillStyle = 'red'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
               pen.fillRect(x-lx/2, yst, lx, yex - yst);
            } else {
               pen.fillStyle = '#gray'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
               pen.fillRect(x-lx/2, yst, lx, 2);
            }
         } else if (item.O < item.C) {
            pen.fillStyle = 'red'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
            pen.fillRect(x-lx/2, yst, lx, yed - yst);
         } else if (item.O > item.C) {
            pen.fillStyle = 'green'; pen.fillRect(x-1, ymin,lxw, ymax-ymin);
            pen.fillRect(x-lx/2, yed, lx, yst - yed);
         } else {
            pen.fillStyle = 'gray'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
            pen.fillRect(x-lx/2, yst, lx, 2);
         }
         lastitem = item;
      });
   }
}

function paintIndex(canvas, data) {
   if (!data.index) {
      canvas.style.display = 'none';
      return;
   }
   const vis = {};
   data.index.forEach(z => {
      if (!z.group) return; // TODO draw '' group on primary chart (BOLL, SMA)
      if (!vis[z.group]) vis[z.group] = [];
      vis[z.group].push(z);
   });
   const nvis = Object.keys(vis).length;
   if (!nvis) return;

   const n = data?.data?.raw?.length || 1;
   const h1 = 80;
   const h0 = h1 * nvis;
   canvas.style.display = 'block';
   canvas.style.height = `${h0}px`;
   canvas.height = h0;

   const wc = canvas.offsetWidth;
   let scale = Math.floor(wc / n);
   if (scale <= 0) scale = 1;
   else if (scale > 10) scale = 10;
   const shiftw = Math.floor((wc - n * scale) / 2);
   const pen = canvas.getContext('2d');
   const w0 = 365 * scale;
   const lx = scale;

   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w0, h0);
   pen.lineWidth = lx;

   let ci = 0; // color index
   Object.keys(vis).forEach((gn, i) => {
      const group = vis[gn];
      let min = Infinity, max = 0;
      group.forEach(one => {
         if (Array.isArray(one.val)) {
            one.val.forEach(z => {
               if (z < min) min = z;
               if (z > max) max = z;
            });
         } else {
            if (one.val < min) min = one.val;
            if (one.val > max) max = one.val;
         }
      });

      pen.save();
      pen.translate(0, h1 * i);
      let box = pen.measureText(gn);
      pen.fillStyle = '#aaa';
      pen.font = '14px serif';
      pen.fillText(gn, Math.round((wc - box.width) / 2), 12);
      pen.fillText(max.toFixed(2), 10, 12);
      pen.fillText(min.toFixed(2), 10, h1 - 3);
      // TODO: draw info
      const dm = max === min ? (max/2) : (max-min);
      if (max === min) min = 0;
      pen.lineWidth = 1;
      group.forEach(one => {
         const color = one.c || pickHSLColor(ci);
         ci ++;
         pen.strokeStyle = color;
         pen.fillStyle = color;
         let lasty = null;
         const shiftn = n - one.val.length;
         if (Array.isArray(one.val)) {
            pen.beginPath();
            one.val.forEach((z, k) => {
               const x = shiftw + (k+shiftn)*lx;
               if (x < shiftw) return;
               const y = h1 - Math.round((z - min) / dm * h1);
               if (lasty === null) {
                  pen.moveTo(x+lx/2, y);
               } else {
                  pen.lineTo(x+lx/2, y);
               }
               lasty = y;
            });
            pen.stroke();
            lasty = null;
            one.val.forEach((z, k) => {
               const x = shiftw + (k+shiftn)*lx;
               if (x < shiftw) return;
               const y = h1 - Math.round((z - min) / dm * h1);
               pen.fillRect(x+lx/2-1, y-1, 2, 2);
               lasty = y;
            });
         } else {
            const y = h1 - Math.round((one.val - min) / dm * h1);
            pen.beginPath();
            pen.moveTo(shiftw, y);
            pen.lineTo(shiftw + n * lx, y);
            pen.stroke();
         }
      });
      pen.restore();
   });
}

const nshow = 250;
function initChartConfig() {
   // t = 'd'/daily, 'w'/weekly, 'm'/monthly
   if (!local.data.view.chartConfig) local.data.view.chartConfig = { i: 0, n: nshow, t: 'd' };
}

const repaintStat = {
   busy: false,
};
async function repaint(kCanvas, indexCanvas, data) {
   if (repaintStat.busy) return;
   if (!kCanvas) return;
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
      if (n0-nshow+i < 0) {
         data.data.raw = data.data.raw.slice(0, n);
      } else {
         data.data.raw = data.data.raw.slice(n0-nshow+i, n0-nshow+i+n);
      }

      data.strategy = local.data.view.strategy;
      // TODO if 'w', 'm', scan 'd' data into bucket of 'w' or 'm'
      if (data.strategy && data.config.t === 'd') {
         data.strategy = {...data.strategy};
         data.strategy.stat = {...data.strategy.stat};
         const stat = data.strategy.stat;
         const dn = stat.d250.length;
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
            let i1 = i+1-250+dn, i2 = i1+n;
            if (i2 <= 0) {
               data.strategy = null;
            } else if (i1 < 0) {
               const last = stat.d250[0];
               stat.d250 = stat.d250.slice(1, i2);
               data.strategy.score = last.score;
               stat.d250.reverse();
            } else {
               const last = stat.d250[i1];
               stat.d250 = stat.d250.slice(i1+1, i2);
               data.strategy.score = last.score;
               stat.d250.reverse();
            }
         }
      } else {
         data.strategy = null;
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

   const canvasRef = useRef(null);
   const indexCanvasRef = useRef(null);
   const dataRef = useRef({});

   useEffect(() => {
      const canvas = canvasRef.current;
      const indexCanvas = indexCanvasRef.current;
      if (!canvas || !indexCanvas) return;
      canvas.style.width = '100%';
      canvas.style.height = '150px';
      canvas.width = canvas.offsetWidth;
      canvas.height = 150;
      indexCanvas.style.width = '100%';
      indexCanvas.width = canvas.offsetWidth;
      indexCanvas.style.display = 'none';
      if (local.data.view) {
         repaint(canvasRef.current, indexCanvas.current, dataRef.current);
      }
   });

   const cursorMove = (evt) => {
      const wc = canvasRef.current.offsetWidth;
      const n = dataRef.current.data?.raw?.length || 0;
      let scale = Math.floor(wc / n);
      if (scale <= 0) scale = 1;
      else if (scale > 10) scale = 10;
      const shiftw = Math.floor((wc - n * scale) / 2);
      const x = evt.offsetX;
      const y = evt.offsetY;
      const i = Math.floor((x - shiftw) / scale);
      if (dataRef.current.i === i) return;
      dataRef.current.i = i;
      const one = dataRef.current.data?.raw?.[i];
      if (one) {
         const info = {...one};
         info.t = t;
         info.x = evt.clientX;
         info.y = evt.clientY;
         const d250 = dataRef.current.strategy?.stat?.d250;
         const dn = d250?.length || 0;
         const stg = (
            i >= dn-1 ?
            dataRef.current.strategy?.score :
            dataRef.current.strategy?.stat?.d250?.[dn-2-i]?.score
         ) || undefined;
         const vis = dataRef.current.index ? dataRef.current.index.map((z, j) => ({
            g: z.group,
            i: z.id,
            c: z.c || pickHSLColor(j),
            v: Array.isArray(z.val) ? z.val[i] : z.val,
         })).filter(z => !isNaN(z.v)).reduce((a, z) => {
            if (!a[z.g]) a[z.g] = [];
            a[z.g].push({ i: z.i, v: z.v, c: z.c });
            return a;
         }, {}) : undefined;
         info.stg = stg;
         info.vis = vis;
         eventbus.emit('stock.chart.tooltip', info);
      } else {
         eventbus.emit('stock.chart.tooltip', null);
      }
   };
   const cursorLeave = (evt) => eventbus.emit('stock.chart.tooltip', null);

   useEffect(() => {
      eventbus.comp.register('stock.chart');
      eventbus.on('stock.chart.basic', handleStockChartRepaint);
      eventbus.on('stock.chart.strategy', handleStockChartRepaint);
      eventbus.on('stock.chart.index', handleStockChartRepaint);
      canvasRef.current.addEventListener('mousemove', cursorMove);
      indexCanvasRef.current.addEventListener('mousemove', cursorMove);
      canvasRef.current.addEventListener('mouseleave', cursorLeave);
      indexCanvasRef.current.addEventListener('mouseleave', cursorLeave);
      return () => {
         eventbus.off('stock.chart.basic', handleStockChartRepaint);
         eventbus.off('stock.chart.strategy', handleStockChartRepaint);
         eventbus.off('stock.chart.index', handleStockChartRepaint);
         eventbus.comp.unregister('stock.chart');
         if (canvasRef.current) {
            canvasRef.current.removeEventListener('mousemove', cursorMove);
            canvasRef.current.removeEventListener('mouseleave', cursorLeave);
         }
         if (indexCanvasRef.current) {
            indexCanvasRef.current.removeEventListener('mousemove', cursorMove);
            indexCanvasRef.current.removeEventListener('mouseleave', cursorLeave);
         }
      };
      function handleStockChartRepaint() {
         repaint(canvasRef.current, indexCanvasRef.current, dataRef.current);
      }
   }, []);

   const onDayClick = () => {
      initChartConfig();
      local.data.view.chartConfig.t = 'd';
      repaint(canvasRef.current, indexCanvasRef.current, dataRef.current);
   };
   const onWeekClick = () => {
      initChartConfig();
      local.data.view.chartConfig.t = 'w';
      repaint(canvasRef.current, indexCanvasRef.current, dataRef.current);
   };
   const onMonthClick = () => {
      initChartConfig();
      local.data.view.chartConfig.t = 'm';
      repaint(canvasRef.current, indexCanvasRef.current, dataRef.current);
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
      <canvas ref={canvasRef}>(Not support &lt;canvas&gt;)</canvas>
      <canvas ref={indexCanvasRef}>(Not support &lt;canvas&gt;)</canvas>
      <StockChartTooltip />
   </Box>;
}