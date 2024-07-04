import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import eventbus from '$/service/eventbus';
import local from '$/service/local';

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
      data.forEach((item, i) => {
         const ymin = Math.round(h0 * (1 - (item.L - min)/h));
         const yst = Math.round(h0 * (1 - (item.O - min)/h));
         const yed = Math.round(h0 * (1 - (item.C - min)/h));
         const ymax = Math.round(h0 * (1 - (item.H - min)/h));
         const x = i * lx + shiftw;
         if (item.O === item.C && item.O === item.L && item.O === item.H) {
            const cr = lastitem ? ((item.C - lastitem.C) / lastitem.C) : 0;
            if (cr < -0.099) {
               const yex =  Math.round(h0 * (1 - (lastitem.C - min)/h));
               pen.strokeStyle = 'green'; pen.beginPath(); pen.moveTo(x, yst); pen.lineTo(x, yex); pen.stroke();
            } else if (cr > 0.099) {
               const yex =  Math.round(h0 * (1 - (lastitem.C - min)/h));
               pen.strokeStyle = 'red'; pen.beginPath(); pen.moveTo(x, yst); pen.lineTo(x, yex); pen.stroke();
            } else {
               pen.strokeStyle = 'gray'; pen.beginPath(); pen.moveTo(x, yst); pen.lineTo(x, yst+2); pen.stroke();
            }
         } else if (item.O < item.C) {
            if (ymin > yst) {pen.beginPath(); pen.strokeStyle = '#f66'; pen.moveTo(x, ymin); pen.lineTo(x, yst); pen.stroke();}
            if (ymax < yed) {pen.strokeStyle = '#f66'; pen.beginPath(); pen.moveTo(x, yed); pen.lineTo(x, ymax); pen.stroke();}
            pen.strokeStyle = 'red'; pen.beginPath(); pen.moveTo(x, yst); pen.lineTo(x, yed); pen.stroke();
         } else if (item.O > item.C) {
            if (ymin > yed) {pen.strokeStyle = '#6f6'; pen.beginPath(); pen.moveTo(x, ymin); pen.lineTo(x, yed); pen.stroke();}
            if (ymax < yst) {pen.strokeStyle = '#6f6'; pen.beginPath(); pen.moveTo(x, yst); pen.lineTo(x, ymax); pen.stroke();}
            pen.strokeStyle = 'green'; pen.beginPath(); pen.moveTo(x, yed); pen.lineTo(x, yst); pen.stroke();
         } else {
            if (ymin > yed) {pen.strokeStyle = 'gray'; pen.beginPath(); pen.moveTo(x, ymin); pen.lineTo(x, yed); pen.stroke();}
            if (ymax < yst) {pen.strokeStyle = 'gray'; pen.beginPath(); pen.moveTo(x, yst); pen.lineTo(x, ymax); pen.stroke();}
            pen.strokeStyle = 'gray'; pen.beginPath(); pen.moveTo(x, yed+2); pen.lineTo(x, yst); pen.stroke();
         }
         lastitem = item;
      });
   }
}

const hslColors = [
   'hsl(360 100% 50%)',
   'hsl(225 100% 50%)',
   'hsl(90 100% 50%)',
   'hsl(315 100% 50%)',
   'hsl(135 100% 50%)',
   'hsl(270 100% 50%)',
   'hsl(0 100% 50%)',
   'hsl(180 100% 50%)',
   'hsl(45 100% 50%)',
];
function randomHsl() {
   const h = Math.round(Math.random() * 360);
   const s = Math.round(Math.random() * 70 + 30);
   const l = Math.round(Math.random() * 40 + 30);
   return `hsl(${h} ${s}% ${l}%)`;
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
      group.forEach((one, j) => {
         const color = j < hslColors.length ? hslColors[j] : randomHsl();
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
                  pen.moveTo(x, y);
               } else {
                  pen.lineTo(x, y);
               }
               lasty = y;
            });
            pen.stroke();
            lasty = null;
            one.val.forEach((z, k) => {
               const x = shiftw + (k+shiftn)*lx;
               if (x < shiftw) return;
               const y = h1 - Math.round((z - min) / dm * h1);
               pen.fillRect(x-1, y-1, 2, 2);
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

export default function StockOneChart() {
   const { t } = useTranslation('viewer');

   const canvasRef = useRef(null);
   const indexCanvasRef = useRef(null);
   const tooltipRef = useRef(null);
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
         Object.assign(dataRef.current, {
            data: local.data.view.one,
            strategy: local.data.view.strategy,
            index: local.data.view.index,
         });
         paintBasic(canvasRef.current, dataRef.current);
         paintIndex(indexCanvasRef.current, dataRef.current);
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
      tooltipRef.current.innerHTML = '&nbsp;';
      if (one) {
         tooltipRef.current.appendChild(document.createTextNode(
            `${new Date(one.T).toISOString().split('T')[0]} `
         ));
         tooltipRef.current.appendChild(document.createTextNode(
            `${t(
               't.open', 'open'
            )}=${one.O.toFixed(2)} ${t(
               't.close', 'close'
            )}=${one.C.toFixed(2)} ${t(
               't.low', 'low'
            )}/${t(
               't.high', 'high'
            )}=${one.L.toFixed(2)}/${one.H.toFixed(2)}`
         ));
         tooltipRef.current.appendChild(document.createTextNode(
            ` ${t('t.vol', 'vol')}=${one.V}`
         ));
      }
   };

   useEffect(() => {
      eventbus.comp.register('stock.chart');
      eventbus.on('stock.chart.basic', handleStockChartBasic);
      eventbus.on('stock.chart.strategy', handleStockChartStrategy);
      eventbus.on('stock.chart.index', handleStockChartIndex);
      canvasRef.current.addEventListener('mousemove', cursorMove);
      indexCanvasRef.current.addEventListener('mousemove', cursorMove);
      return () => {
         eventbus.off('stock.chart.basic', handleStockChartBasic);
         eventbus.off('stock.chart.strategy', handleStockChartStrategy);
         eventbus.off('stock.chart.index', handleStockChartIndex);
         eventbus.comp.unregister('stock.chart');
         if (canvasRef.current) canvasRef.current.removeEventListener('mousemove', cursorMove);
         if (indexCanvasRef.current) indexCanvasRef.current.removeEventListener('mousemove', cursorMove);
      };
      function handleStockChartBasic() {
         if (!canvasRef.current) return;
         if (!local.data.view.one) local.data.view.one = [];
         dataRef.current.data = local.data.view.one;
         dataRef.current.strategy = local.data.view.strategy;
         dataRef.current.index = local.data.view.index;
         paintBasic(canvasRef.current, dataRef.current);
         paintIndex(indexCanvasRef.current, dataRef.current);
      }
      function handleStockChartStrategy() {
         if (!canvasRef.current) return;
         dataRef.current.data = local.data.view.one;
         dataRef.current.strategy = local.data.view.strategy;
         dataRef.current.index = local.data.view.index;
         paintBasic(canvasRef.current, dataRef.current);
         paintIndex(indexCanvasRef.current, dataRef.current);
      }
      function handleStockChartIndex() {
         if (!canvasRef.current) return;
         dataRef.current.data = local.data.view.one;
         dataRef.current.strategy = local.data.view.strategy;
         dataRef.current.index = local.data.view.index;
         paintBasic(canvasRef.current, dataRef.current);
         paintIndex(indexCanvasRef.current, dataRef.current);
      }
   }, []);

   return <Box>
      <canvas ref={canvasRef}>(Not support &lt;canvas&gt;)</canvas>
      <canvas ref={indexCanvasRef}>(Not support &lt;canvas&gt;)</canvas>
      <Box sx={{ textAlign: 'right' }} ref={tooltipRef}>&nbsp;</Box>
   </Box>;
}