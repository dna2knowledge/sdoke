import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import eventbus from '$/service/eventbus';
import local from '$/service/local';
import makeMask from '$/util/make-mask';

const config = {
   w: 260,
   shift: 5,
   h: 40,
};

function paintRangeSlider(canvas) {
   // data.one, data.strategy, data.index
   if (!local.data.view) return;
   const data = {
      one: local.data.view.one,
      strategy: local.data.view.strategy,
      index: local.data.view.index,
      config: local.data.view.chartConfig,
   };
   const hdata = (data.one?.raw || []).map(z => z.C);
   if (!data.config) data.config = { i: 0, n: 250 };
   if (hdata.length < data.config.n) data.config.n = hdata.length;
   const chartconfig = data.config;

   let min = Infinity, max = -Infinity;
   hdata.forEach(z => {
      if (z < min) min = z;
      if (z > max) max = z;
   });

   const pen = canvas.getContext('2d');
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, config.w, config.h);
   pen.strokeStyle = '#ccc';
   pen.beginPath();
   if (min === max) {
      pen.moveTo(config.shift, config.h/2);
      pen.lineTo(config.w - config.shift, config.h/2);
   } else {
      const dm = max - min;
      hdata.forEach((z, i) => {
         const y = config.h - (z - min) / dm * config.h;
         if (i === 0) {
            pen.moveTo(config.shift, y);
         } else {
            pen.lineTo(config.shift+i, y);
         }
      });
   }
   pen.stroke();

   pen.strokeStyle = 'black';
   pen.fillStyle = 'rgba(0, 0, 0, 0.2)';
   pen.fillRect(chartconfig.i, 0, chartconfig.n+config.shift*2, config.h);
   pen.strokeRect(config.shift+chartconfig.i, 0, chartconfig.n-1, config.h-1);
   pen.strokeRect(config.shift/2+chartconfig.i-1, 13, 1, 15);
   pen.strokeRect(config.shift+chartconfig.i+chartconfig.n+2, 13, 1, 15);
}

export default function StockChartRangeSlider() {
   const sliderRef = useRef(null);

   useEffect(() => {
      const sliderStat = {};
      eventbus.on('stock.chart.basic', handleStockChartRepaint);
      if (sliderRef.current) {
         sliderRef.current.style.cursor = 'pointer';
         sliderRef.current.addEventListener('mousedown', onMouseDown);
         sliderRef.current.addEventListener('touchstart', onTouchStart);
         sliderRef.current.addEventListener('touchmove', onTouchMove);
         sliderRef.current.addEventListener('touchend', _onDrop);
      }
      return () => {
         eventbus.off('stock.chart.basic', handleStockChartRepaint);
         if (sliderRef.current) {
            sliderRef.current.removeEventListener('mousedown', onMouseDown);
            sliderRef.current.removeEventListener('touchstart', onTouchStart);
            sliderRef.current.removeEventListener('touchmove', onTouchMove);
            sliderRef.current.removeEventListener('touchend', _onDrop);
         }
         if (sliderStat.div) _onDrop();
      };

      function handleStockChartRepaint() {
         if (!sliderRef.current) return;
         paintRangeSlider(sliderRef.current);
      }
      function onMouseDown(evt) { _onInit(evt.clientX, evt.clientY); }
      function onMouseMove(evt) { _onDragMove(evt.clientX, evt.clientY); }
      function onTouchStart(evt) { _onInit(evt.touches[0].clientX, evt.touches[0].clientY); }
      function onTouchMove(evt) { _onDragMove(evt.touches[0].clientX, evt.touches[0].clientY); }
      function _onInit(x, y) {
         if (!sliderRef.current) return;
         if (sliderStat.div) return;
         const chartconfig = local.data.view.chartConfig;
         const box = sliderRef.current.getBoundingClientRect();
         x -= box.left;
         y -= box.top;
         sliderStat.x = x;
         sliderStat.y = y;
         sliderStat.i = chartconfig.i;
         sliderStat.n = chartconfig.n;
         const xr1 = chartconfig.i;
         const xb1 = xr1 + config.shift;
         const xb2 = xb1 + chartconfig.n;
         const xr2 = xb2 + config.shift;
         if (x >= xb1 && x <= xb2) {
            sliderStat.o = 'block';
         } else if (x >= xr1 && x < xb1) {
            sliderStat.o = 'Lrange';
         } else if (x > xb2 && x <= xr2) {
            sliderStat.o = 'Rrange';
         }
         sliderStat.div = makeMask();
         document.body.appendChild(sliderStat.div);
         sliderStat.div.addEventListener('mousemove', onMouseMove);
         sliderStat.div.addEventListener('mouseup', _onDrop);
      }
      function _onDragMove(x, y) {

         if (!sliderStat?.o) return;
         const chartconfig = local.data.view.chartConfig;
         const box = sliderRef.current.getBoundingClientRect();
         const n = local.data.view?.one?.raw?.length || 0;
         x -= box.left;
         const dx = x - sliderStat.x;
         if (n < 20) {
            chartconfig.i = 0;
            chartconfig.n = n;
         } else {
            switch (sliderStat.o) {
               case 'block':
                  chartconfig.i = sliderStat.i + dx > 0 ? (sliderStat.i + dx) : 0;
                  if (chartconfig.i + sliderStat.n > n) chartconfig.i = n - sliderStat.n;
                  if (chartconfig.i + chartconfig.n > chartconfig.n0) chartconfig.i = chartconfig.n0 - chartconfig.n;
                  break;
               case 'Lrange':
                  chartconfig.i = sliderStat.i + dx > 0 ? (sliderStat.i + dx) : 0;
                  chartconfig.n = sliderStat.n + (sliderStat.i - chartconfig.i);
                  if (chartconfig.i + chartconfig.n > n) chartconfig.n = n - chartconfig.i;
                  if (chartconfig.n < 20) {
                     chartconfig.i -= 20 - chartconfig.n;
                     chartconfig.n = 20;
                     if (chartconfig.i + chartconfig.n > n) chartconfig.i = n - chartconfig.n;
                     if (chartconfig.i < 0) chartconfig.i = 0;
                  }
                  break;
               case 'Rrange':
                  chartconfig.n = sliderStat.n + dx;
                  if (chartconfig.n < 20) {
                     chartconfig.n = 20;
                     if (chartconfig.i + chartconfig.n > n) chartconfig.i = n - chartconfig.n;
                     if (chartconfig.i < 0) chartconfig.i = 0;
                  }
                  if (chartconfig.i + chartconfig.n > chartconfig.n0) {
                     chartconfig.n = chartconfig.n0 - chartconfig.i;
                  }
               }
            }
         if (chartconfig.i !== sliderStat.i || chartconfig.n !== sliderStat.n) {
            paintRangeSlider(sliderRef.current);
            sliderStat.change = true;
            eventbus.emit('stock.chart.basic'); // debug
         }
      }
      function _onDrop() {
         document.body.removeChild(sliderStat.div);
         sliderStat.div.removeEventListener('mousemove', onMouseMove);
         sliderStat.div.removeEventListener('mouseup', _onDrop);
         if (sliderStat.change) eventbus.emit('stock.chart.basic');
         sliderStat.change = false;
         sliderStat.div = null;
         sliderStat.x = null;
         sliderStat.y = null;
         sliderStat.o = null;
      }
   });

   return <Box sx={{ width: '260px', canvas: { width: `${config.w}px`, height: `${config.h}px` } }}>
      <canvas width={config.w} height={config.h} ref={sliderRef}>(Not support &lt;canvas&gt;)</canvas>
   </Box>
}