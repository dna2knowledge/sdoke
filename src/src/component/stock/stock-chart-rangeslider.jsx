import { useRef, useEffect, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import eventbus from '$/service/eventbus';
import local from '$/service/local';
import makeMask from '$/util/make-mask';

const config = {
   maxW: 260,
   shift: 5,
   h: 40,
};

function downsampleData(data, targetLen) {
   if (!data || data.length === 0) return [];
   if (data.length <= targetLen) return data;

   const result = [];
   const bucketSize = data.length / targetLen;

   for (let i = 0; i < targetLen; i++) {
      const start = Math.floor(i * bucketSize);
      const end = Math.floor((i + 1) * bucketSize);
      // Use Largest-Triangle-Three-Buckets inspired averaging for smoothness
      let sum = 0;
      let count = 0;
      for (let j = start; j < end && j < data.length; j++) {
         sum += data[j];
         count++;
      }
      result.push(count > 0 ? sum / count : data[start]);
   }
   return result;
}

function paintRangeSlider(canvas, sliderW) {
   if (!local.data.view) return;
   const data = {
      one: local.data.view.one,
      strategy: local.data.view.strategy,
      index: local.data.view.index,
      config: local.data.view.chartConfig,
   };
   if (!data.config) return;
   const rawHdata = (data.config.sliderData || data.one?.raw || []).map(z => z.C);
   if (rawHdata.length < data.config.n) data.config.n = rawHdata.length;
   const chartconfig = data.config;

   const w = sliderW;
   const drawW = w - config.shift * 2; // drawable area width
   const fullDataLen = rawHdata.length;

   // Downsample data to fit the drawable width
   const hdata = downsampleData(rawHdata, drawW);
   const sampledLen = hdata.length;

   // Scale factor: map original data indices to sampled indices
   const scale = sampledLen > 0 ? sampledLen / fullDataLen : 1;

   let min = Infinity, max = -Infinity;
   hdata.forEach(z => {
      if (z < min) min = z;
      if (z > max) max = z;
   });

   const pen = canvas.getContext('2d');
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w, config.h);
   pen.strokeStyle = '#ccc';
   pen.beginPath();
   if (min === max) {
      pen.moveTo(config.shift, config.h / 2);
      pen.lineTo(w - config.shift, config.h / 2);
   } else {
      const dm = max - min;
      const xStep = drawW / (sampledLen > 1 ? sampledLen - 1 : 1);
      hdata.forEach((z, i) => {
         const x = config.shift + i * xStep;
         const y = config.h - (z - min) / dm * config.h;
         if (i === 0) {
            pen.moveTo(x, y);
         } else {
            pen.lineTo(x, y);
         }
      });
   }
   pen.stroke();

   // Map chartconfig.i and chartconfig.n from original data space to pixel space
   const scaledI = chartconfig.i * scale;
   const scaledN = chartconfig.n * scale;

   pen.strokeStyle = 'black';
   pen.fillStyle = 'rgba(0, 0, 0, 0.2)';

   const xStep = drawW / (sampledLen > 1 ? sampledLen - 1 : 1);
   const blockX = scaledI * xStep;
   const blockW = scaledN * xStep;

   pen.fillRect(blockX, 0, blockW + config.shift * 2, config.h);
   pen.strokeRect(config.shift + blockX, 0, blockW - 1, config.h - 1);
   pen.strokeRect(config.shift / 2 + blockX - 1, 13, 1, 15);
   pen.strokeRect(config.shift + blockX + blockW + 2, 13, 1, 15);
}

export default function StockChartRangeSlider() {
   const sliderRef = useRef(null);
   const containerRef = useRef(null);
   const [sliderW, setSliderW] = useState(config.maxW);

   const updateWidth = useCallback(() => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      // Calculate available width: parent width minus siblings' width
      let siblingsWidth = 0;
      for (const child of parent.children) {
         if (child !== containerRef.current) {
            siblingsWidth += child.getBoundingClientRect().width;
         }
      }
      const available = parent.getBoundingClientRect().width - siblingsWidth - 16; // 16px padding buffer
      const newW = Math.max(60, Math.min(config.maxW, Math.floor(available)));

      if (newW !== sliderW) {
         setSliderW(newW);
      }
   }, [sliderW]);

   useEffect(() => {
      updateWidth();

      const resizeObserver = new ResizeObserver(() => {
         updateWidth();
      });

      if (containerRef.current?.parentElement) {
         resizeObserver.observe(containerRef.current.parentElement);
      }

      return () => {
         resizeObserver.disconnect();
      };
   }, [updateWidth]);

   useEffect(() => {
      if (sliderRef.current) {
         // Update canvas resolution
         sliderRef.current.width = sliderW;
         sliderRef.current.height = config.h;
         // Repaint with new width
         paintRangeSlider(sliderRef.current, sliderW);
      }
   }, [sliderW]);

   useEffect(() => {
      const sliderStat = {};
      eventbus.on('stock.chart.basic', handleStockChartRepaint);
      eventbus.on('stock.chart.rangeslider', handleStockChartRepaint);
      if (sliderRef.current) {
         sliderRef.current.style.cursor = 'pointer';
         sliderRef.current.addEventListener('mousedown', onMouseDown);
         sliderRef.current.addEventListener('touchstart', onTouchStart);
         sliderRef.current.addEventListener('touchmove', onTouchMove);
         sliderRef.current.addEventListener('touchend', _onDrop);
      }
      return () => {
         eventbus.off('stock.chart.basic', handleStockChartRepaint);
         eventbus.off('stock.chart.rangeslider', handleStockChartRepaint);
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
         paintRangeSlider(sliderRef.current, sliderW);
      }
      function onMouseDown(evt) { _onInit(evt.clientX, evt.clientY); }
      function onMouseMove(evt) { _onDragMove(evt.clientX, evt.clientY); }
      function onTouchStart(evt) { _onInit(evt.touches[0].clientX, evt.touches[0].clientY); }
      function onTouchMove(evt) { _onDragMove(evt.touches[0].clientX, evt.touches[0].clientY); }

      function _getScale() {
         const rawHdata = (local.data.view?.chartConfig?.sliderData || local.data.view?.one?.raw || []);
         const fullDataLen = rawHdata.length;
         const drawW = sliderW - config.shift * 2;
         const sampledLen = Math.min(fullDataLen, drawW);
         const scale = sampledLen > 0 ? sampledLen / fullDataLen : 1;
         const xStep = drawW / (sampledLen > 1 ? sampledLen - 1 : 1);
         return { scale, xStep, fullDataLen };
      }

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

         const { scale, xStep } = _getScale();
         const scaledI = chartconfig.i * scale;
         const scaledN = chartconfig.n * scale;
         const blockX = scaledI * xStep;
         const blockW = scaledN * xStep;

         const xr1 = blockX;
         const xb1 = xr1 + config.shift;
         const xb2 = xb1 + blockW;
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
         const pixelDx = x - sliderStat.x;

         const { scale, xStep } = _getScale();
         // Convert pixel movement to data-space movement
         const dataDx = xStep > 0 ? pixelDx / (scale * xStep) : 0;

         if (n < 20) {
            chartconfig.i = 0;
            chartconfig.n = n;
         } else {
            switch (sliderStat.o) {
               case 'block':
                  chartconfig.i = sliderStat.i + dataDx > 0 ? (sliderStat.i + dataDx) : 0;
                  if (chartconfig.i + sliderStat.n > n) chartconfig.i = n - sliderStat.n;
                  if (chartconfig.i + chartconfig.n > chartconfig.n0) chartconfig.i = chartconfig.n0 - chartconfig.n;
                  break;
               case 'Lrange':
                  chartconfig.i = sliderStat.i + dataDx > 0 ? (sliderStat.i + dataDx) : 0;
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
                  chartconfig.n = sliderStat.n + dataDx;
                  if (chartconfig.n < 20) {
                     chartconfig.n = 20;
                     if (chartconfig.i + chartconfig.n > n) chartconfig.i = n - chartconfig.n;
                     if (chartconfig.i < 0) chartconfig.i = 0;
                  }
                  if (chartconfig.i + chartconfig.n > chartconfig.n0) {
                     chartconfig.n = chartconfig.n0 - chartconfig.i;
                  }
            }
            chartconfig.i = Math.floor(chartconfig.i);
            chartconfig.n = Math.floor(chartconfig.n);
         }
         if (chartconfig.i !== sliderStat.i || chartconfig.n !== sliderStat.n) {
            paintRangeSlider(sliderRef.current, sliderW);
            sliderStat.change = true;
            eventbus.emit('stock.chart.basic');
         }
      }
      function _onDrop() {
         if (!sliderStat.div) return;
         document.body.removeChild(sliderStat.div);
         sliderStat.div.removeEventListener('mousemove', onMouseMove);
         sliderStat.div.removeEventListener('mouseup', _onDrop);
         if (sliderStat.change) {
            const chartconfig = local.data.view.chartConfig;
            switch (chartconfig.t) {
               case 'w':
                  chartconfig.wi = chartconfig.i;
                  chartconfig.wn = chartconfig.n;
                  break;
               case 'm':
                  chartconfig.mi = chartconfig.i;
                  chartconfig.mn = chartconfig.n;
                  break;
               case 'd':
               default:
                  chartconfig.di = chartconfig.i;
                  chartconfig.dn = chartconfig.n;
            }
            eventbus.emit('stock.chart.basic');
         }
         sliderStat.change = false;
         sliderStat.div = null;
         sliderStat.x = null;
         sliderStat.y = null;
         sliderStat.o = null;
      }
   }, [sliderW]);

   return <Box ref={containerRef} sx={{
      maxWidth: `${config.maxW}px`,
      width: '100%',
      flexShrink: 1,
      minWidth: '60px',
      canvas: {
         width: `${sliderW}px`,
         height: `${config.h}px`,
         display: 'block',
      }
   }}>
      <canvas width={sliderW} height={config.h} ref={sliderRef}>(Not support &lt;canvas&gt;)</canvas>
   </Box>
}