import { useEffect, useRef } from "react";
import * as d3 from 'd3';
import { Box } from "@mui/material";
import norm from '$/analysis/math/norm';
import { onCursorMove, onCursorLeave } from "$/component/stock/stock-chart-tooltip";

export function paintBasic(svg, data) {
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
   const wc = parseInt(svg.attr('width'));
   let scale = Math.floor(wc / data.length);
   if (scale <= 0) scale = 1;
   else if (scale > 10) scale = 10;
   const shiftw = Math.floor((wc - data.length * scale) / 2);
   const h0 = 150;
   const lx = scale;

   let min = Infinity, max = 0;
   const lasted = data.map((_, i) => {
      if (i === 0) return 0;
      return data[i-1].C;
   });
   data.forEach((item) => {
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
   const h = (max - min) || 1;

   svg.selectAll('*').remove();
   const g = svg.append('g').attr('transform', `translate(${shiftw},0)`);
   const candlestick = g.selectAll('g').data(data).enter().append('g');
   const x = (_, i) => i * lx;
   const vs = norm(data.map(z => z.V), 0);
   const vytop = (_, i) => vs[i] ? (h0 * (1 - vs[i])) : 0;
   const vyh = (_, i) => h0 - vytop(_, i);
   const xmid = (_, i) => i * lx + lx/2;
   const ymin = (item) => Math.round(h0 * (1 - (item.L - min)/h))
   const yst = (item) => Math.round(h0 * (1 - (item.O - min)/h));
   const yed = (item) => Math.round(h0 * (1 - (item.C - min)/h));
   const yh = (item) => Math.abs(yst(item) - yed(item));
   const ytop = (item) => Math.min(yst(item), yed(item));
   const ymax = (item) => Math.round(h0 * (1 - (item.H - min)/h));
   const color = (item, i) => {
      if (item.O === 0) return 'gray';
      if (item.C === item.O) {
         const last = lasted[i];
         if (item.C === last) return 'gray';
         return item.C > last ? 'red' : 'green';
      } else {
         return item.C > item.O ? 'red' : 'green';
      }
   };
   if (strategy && strategy.meta.code === overview.meta.code) {
      const sdata = strategy?.stat?.d250 && strategy.stat.d250.slice();
      sdata.unshift(strategy);
      const sh = (_, i) => {
         const d = sdata[sdata.length-i-1];
         if (!d) return 0;
         return h0;
      };
      const scolor = (_, i) => {
         const d = sdata[sdata.length-i-1];
         if (!d) return 'white';
         let score = d.score;
         if (score > 1) score = 1; else if (score < -1) score = -1;
         return score > 0 ? `rgba(255, 231, 231, ${score})` : `rgba(231, 255, 231, ${-score})`;
      };
      candlestick.append('rect').attr('width', lx).attr('height', sh).attr('x', x).attr('y', 0).attr('fill', scolor);
   }
   candlestick.append('rect').attr('width', lx).attr('height', vyh).attr('x', x).attr('y', vytop).attr('fill', '#ddd');
   candlestick.append('line').attr('x1', xmid).attr('y1', ymin).attr('x2', xmid).attr('y2', ymax).attr('stroke', color).attr('stroke-width', 1);
   candlestick.append('rect').attr('width', lx).attr('height', yh).attr('x', x).attr('y', ytop).attr('rx', 1).attr('stroke', color).attr('fill', color);
   vis.forEach(item => paintIndexOne(candlestick, item.vis, min, max, wc, shiftw, lx, h0, n, item.color));
}

function paintIndexOne(g, visOne, min, max, wc, shiftw, lx, h1, n, color) {
   const dm = max === min ? (max/2) : (max-min);
   let lasty = null;
   const shiftn = n - visOne.val.length;
   if (Array.isArray(visOne.val)) {
      const line = g.selectAll('g').data(visOne.val).enter().append('g');
      const xm1 = (_, i) => (i+shiftn) * lx + lx/2 - 1;
      const ym1 = (v) => h1 - Math.round((v - min) / dm * h1) - 1;
      line.append('rect').attr('width', 2).attr('height', 2).attr('x', xm1).attr('y', ym1).attr('fill', color);
      const d = [];
      visOne.val.forEach((z, k) => {
         const x = (k+shiftn)*lx;
         if (x < 0) return;
         const y = h1 - Math.round((z - min) / dm * h1);
         if (lasty === null) {
            d.push(`M${x+lx/2},${y}`)
         } else {
            d.push(`${x+lx/2},${y}`);
         }
         lasty = y;
      });
      const pathd = d.join(' ');
      if (pathd) {
         g.append('path').attr('d', d.join(' ')).attr('stroke', color).attr('fill', 'none');
      }
   } else {
      const y = h1 - Math.round((visOne.val - min) / dm * h1);
      g.append('line').attr('x1', 0).attr('y1', y).attr('x2', wc-shiftw*2).attr('y2', y).attr('stroke', color);
   }
}

export function paintIndex(svg, data) {
   if (!data.index) {
      svg.node().style.display = 'none';
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
   svg.attr('style', `width: 100%; height: ${h0}px; display: block`);
   svg.attr('height', h0);
   svg.selectAll('*').remove();

   const wc = parseInt(svg.attr('width'));
   let scale = Math.floor(wc / n);
   if (scale <= 0) scale = 1;
   else if (scale > 10) scale = 10;
   const shiftw = Math.floor((wc - n * scale) / 2);
   const w0 = 365 * scale;
   const lx = scale;

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

      const g = svg.append('g').attr('transform', `translate(${shiftw},${h1*i})`).attr('style', 'font: 14px serif; user-select: none');
      g.append('path').attr('id', `titlepath-${i}`).attr('d', `M0,12 ${wc-shiftw*2},12`).attr('stroke', 'none').attr('fill', 'none');
      g.append('text').attr('fill', '#aaa').append('textPath').attr('xlink:href', `#titlepath-${i}`).attr('text-anchor', 'middle').attr('startOffset', '50%').text(gn);
      g.append('text').text(max.toFixed(2)).attr('x', 10).attr('y', 12).attr('fill', '#aaa').attr('text-anchor', 'start');
      g.append('text').text(min.toFixed(2)).attr('x', 10).attr('y', h1-3).attr('fill', '#aaa').attr('text-anchor', 'start');
      // TODO: draw info
      const dm = max === min ? (max/2) : (max-min);
      if (max === min) min = 0;
      group.forEach(one => {
         const color = one.c || pickHSLColor(ci);
         ci ++;
         paintIndexOne(g, one, min, max, wc, shiftw, lx, h1, n, color);
      });
   });
}

export function useChart(dataRef, t) {
   const containerRef = useRef(null);
   const canvasSvg = useRef(null);
   const indexSvg = useRef(null);

   const getWidth = () => containerRef.current ? containerRef.current.offsetWidth : 0;
   const onCursorMove_ = (evt) => onCursorMove(evt, dataRef.current, getWidth, t);

   useEffect(() => {
      if (!containerRef.current) return;
      if (!canvasSvg.current) {
         canvasSvg.current = d3.create('svg').attr(
            'width', containerRef.current.offsetWidth
         ).attr(
            'heigth', '150'
         ).attr(
            'style', 'width: 100%; height: 150px; display: block'
         );
         containerRef.current.appendChild(canvasSvg.current.node());
         canvasSvg.current.on('mousemove', onCursorMove);
         canvasSvg.current.on('mouseleave', onCursorLeave);
      }
      if (!indexSvg.current) {
         indexSvg.current = d3.create('svg').attr(
            'width', containerRef.current.offsetWidth
         ).attr(
            'heigth', '150'
         ).attr(
            'style', 'width: 100%; height: 150px; display: none'
         );
         containerRef.current.appendChild(indexSvg.current.node());
         indexSvg.current.on('mousemove', onCursorMove_);
         indexSvg.current.on('mouseleave', onCursorLeave);
      }
      return () => {
         if (canvasSvg.current) {
            canvasSvg.current.on('mousemove', null);
            canvasSvg.current.on('mouseleave', null);
            canvasSvg.current.remove();
         }
         if (indexSvg.current) {
            indexSvg.current.on('mousemove', null);
            indexSvg.current.on('mouseleave', null);
            indexSvg.current.remove();
         }
         canvasSvg.current = null;
         indexSvg.current = null;
         while(containerRef.current && containerRef.current.children.length) {
            containerRef.current.removeChild(containerRef.current.children[0]);
         }
      };
   });

   const elem = <Box ref={containerRef}></Box>;
   return [elem, canvasSvg, indexSvg];
}