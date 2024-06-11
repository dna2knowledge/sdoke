import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import eventbus from '$/service/eventbus';
import local from '$/service/local';

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

export default function StockOneChart() {
   const canvasRef = useRef(null);
   const tooltipRef = useRef(null);
   const dataRef = useRef({});

   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.width = '100%';
      canvas.style.height = '150px';
      canvas.width = canvas.offsetWidth;
      canvas.height = 150;
      if (local.data.view) {
         Object.assign(dataRef.current, {
            data: local.data.view.one,
            strategy: local.data.view.strategy,
         });
         paintBasic(canvasRef.current, dataRef.current);
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
            `st=${one.O.toFixed(2)} ed=${one.C.toFixed(2)} min/max=${one.L.toFixed(2)}/${one.H.toFixed(2)}`
         ));
         tooltipRef.current.appendChild(document.createTextNode(
            ` vol=${one.V}`
         ));
      }
   };

   useEffect(() => {
      eventbus.comp.register('stock.chart');
      eventbus.on('stock.chart.basic', handleStockChartBasic);
      eventbus.on('stock.chart.strategy', handleStockChartStrategy);
      canvasRef.current.addEventListener('mousemove', cursorMove);
      return () => {
         eventbus.off('stock.chart.basic', handleStockChartBasic);
         eventbus.off('stock.chart.strategy', handleStockChartStrategy);
         eventbus.comp.unregister('stock.chart');
         if (canvasRef.current) canvasRef.current.removeEventListener('mousemove', cursorMove);
      };
      function handleStockChartBasic() {
         if (!canvasRef.current) return;
         if (!local.data.view.one) local.data.view.one = [];
         dataRef.current.data = local.data.view.one;
         paintBasic(canvasRef.current, dataRef.current);
      }
      function handleStockChartStrategy() {
         if (!canvasRef.current) return;
         dataRef.current.strategy = local.data.view.strategy;
         paintBasic(canvasRef.current, dataRef.current);
      }
   }, []);

   return <Box>
      <canvas ref={canvasRef}>(Not support &lt;canvas&gt;)</canvas>
      <Box sx={{ textAlign: 'right' }} ref={tooltipRef}>&nbsp;</Box>
   </Box>;
}