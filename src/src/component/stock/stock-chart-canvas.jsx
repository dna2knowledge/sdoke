import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import norm from '$/analysis/math/norm';
import { onCursorMove, onCursorLeave } from "$/component/stock/stock-chart-tooltip";

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

export function paintBasic(canvas, data) {
   if (!data || !data.data) return;
   const overview = data.data;
   const strategy = data.strategy;

   const n = data?.data?.raw?.length || 1;
   const vis = [];
   data.index && data.index.forEach((z, i) => {
      if (z.group) return; // group = '' or '.xxx'
      vis.push({ vis: z, color: z.c || pickHSLColor(i) });
   });

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
   let min = Infinity, max = 0;
   const vs = norm(data.map(z => z.V), 0);
   data.forEach((item) => {
      if (item.V === 0 && item.H === 0 && item.L === 0 && item.O === 0) return;
      if (min > item.L) min = item.L;
      if (max < item.H) max = item.H;
   });
   vis.forEach(one => {
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

   pen.strokeStyle = '#ddd';
   vs.forEach((z, i) => {
      const x = i * lx + shiftw;
      const y = Math.round(h0 * (1 - z));
      pen.beginPath(); pen.moveTo(x, h0); pen.lineTo(x, y); pen.stroke();
   });

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
         if (item.O === 0 && item.C > 0) {
            pen.fillStyle = 'gray'; pen.fillRect(x-lx/2, yed, lx, 2);
         } else if (item.O === item.C) {
            const cr = lastitem ? ((item.C - lastitem.C) / lastitem.C) : 0;
            if (cr < 0) {
               pen.fillStyle = 'green'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
               pen.fillRect(x-lx/2, yst, lx, 2);
            } else if (cr > 0) {
               pen.fillStyle = 'red'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
               pen.fillRect(x-lx/2, yst, lx, 2);
            } else {
               pen.fillStyle = 'gray'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
               pen.fillRect(x-lx/2, yst, lx, 2);
            }
         } else if (item.O < item.C) {
            pen.fillStyle = 'red'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
            pen.fillRect(x-lx/2, yst, lx, yed === yst ? 1 : (yed - yst));
         } else if (item.O > item.C) {
            pen.fillStyle = 'green'; pen.fillRect(x-1, ymin,lxw, ymax-ymin);
            pen.fillRect(x-lx/2, yed, lx, yed === yst ? 1 : (yst - yed));
         } else {
            pen.fillStyle = 'gray'; pen.fillRect(x-1, ymin, lxw, ymax-ymin);
            pen.fillRect(x-lx/2, yst, lx, 2);
         }
         lastitem = item;
      });
   }

   vis.forEach(item => paintIndexOne(pen, item.vis, min, max, shiftw - lx/2, lx, h0, n, item.color));
}

function paintIndexOne(pen, visOne, min, max, shiftw, lx, h1, n, color) {
   pen.save();
   pen.strokeStyle = color;
   pen.fillStyle = color;
   pen.lineWidth = 1;
   const dm = max - min;
   if (Array.isArray(visOne.val)) {
      let lasty = null;
      const shiftn = n - visOne.val.length;
      pen.beginPath();
      visOne.val.forEach((z, k) => {
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
      visOne.val.forEach((z, k) => {
         const x = shiftw + (k+shiftn)*lx;
         if (x < shiftw) return;
         const y = h1 - Math.round((z - min) / dm * h1);
         pen.fillRect(x+lx/2-1, y-1, 2, 2);
         lasty = y;
      });
   } else {
      const y = h1 - Math.round((visOne.val - min) / dm * h1);
      pen.beginPath();
      pen.moveTo(shiftw, y);
      pen.lineTo(shiftw + n * lx, y);
      pen.stroke();
   }
   pen.restore();
}

export function paintIndex(canvas, data) {
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
         paintIndexOne(pen, one, min, max, shiftw, lx, h1, n, color);
      });
      pen.restore();
   });
}

export function useChart(dataRef, t) {
   const canvasRef = useRef(null);
   const indexCanvasRef = useRef(null);

   const getWidth = () => {
      if (!canvasRef.current) return 0;
      return canvasRef.current.offsetWidth;
   }
   const onCursorMove_ = (evt) => onCursorMove(evt, dataRef.current, getWidth, t);

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

      canvasRef.current.addEventListener('mousemove', onCursorMove_);
      canvasRef.current.addEventListener('mouseleave', onCursorLeave);
      indexCanvasRef.current.addEventListener('mousemove', onCursorMove_);
      indexCanvasRef.current.addEventListener('mouseleave', onCursorLeave);

      return () => {
         if (canvasRef.current) {
            canvasRef.current.removeEventListener('mousemove', onCursorMove_);
            canvasRef.current.removeEventListener('mouseleave', onCursorLeave);
         }
         if (indexCanvasRef.current) {
            indexCanvasRef.current.removeEventListener('mousemove', onCursorMove_);
            indexCanvasRef.current.removeEventListener('mouseleave', onCursorLeave);
         }
      };
   });

   const elem = <Box>
      <canvas ref={canvasRef}>(Not support &lt;canvas&gt;)</canvas>
      <canvas ref={indexCanvasRef}>(Not support &lt;canvas&gt;)</canvas>
   </Box>;
   return [elem, canvasRef, indexCanvasRef];
}