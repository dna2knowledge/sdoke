import { useEffect, useRef, useState } from "react";
import { Box, Drawer, Slider } from "@mui/material";
import { ChipDistCalculator } from '$/analysis/trend/chipdist';
import eventbus from '$/service/eventbus';
import local from '$/service/local';

function getRate(data, p) {
   const xsum = data.x.reduce((a, b) => a+b, 0);
   let x0sum = 0;
   data.y.forEach((z, i) => {
      if (z > p) return;
      x0sum += data.x[i];
   });
   return Math.round(x0sum / xsum * 100000)/1000;
}

function paintChipdist(canvas, data, index) {
   if (!canvas) return;
   const stat = data.stat;
   const chipdist = data.chipdist[index];

   const w = canvas.offsetWidth;
   const h = canvas.offsetHeight;
   canvas.width = w;
   canvas.height = h;
   const pen = canvas.getContext('2d');
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w, h);

   if (stat.ymin === stat.ymax) {
      // only one point
      return;
   }

   const ydm = stat.ymax - stat.ymin;
   pen.strokeStyle = 'black';
   pen.fillStyle = 'rgba(0, 0, 0, 0.3)';
   pen.beginPath();
   pen.moveTo(0, 0);
   let px = w * (chipdist.y[0] - stat.ymin) / ydm, py = h * chipdist.x[0]/stat.xmax;
   pen.lineTo(px, py);
   for (let i = 1, n = chipdist.x.length; i < n; i++) {
      const x = w * (chipdist.y[i] - stat.ymin) / ydm;
      const y = h * chipdist.x[i] / stat.xmax;
      const mx = (x + px) / 2;
      pen.bezierCurveTo(mx, py, mx, y, x, y);
      px = x;
      py = y;
   }
   pen.lineTo(w, 0);
   pen.lineTo(0, 0);
   pen.fill();
   pen.stroke();
   pen.fillStyle = 'rgba(255, 0, 0, 0.3)';
   const avgx = w * (chipdist.avgCost - stat.ymin) / ydm;
   pen.fillRect(avgx-1, 0, 2, h);
   pen.fillStyle = 'rgba(0, 0, 255, 0.3)';
   const cx = w * (chipdist.C - stat.ymin) / ydm;
   pen.fillRect(cx-1, 0, 2, h);

   const avgrate = getRate(chipdist, chipdist.avgCost);
   const crate = getRate(chipdist, chipdist.C);
   const text = `${chipdist.C.toFixed(2)} (${crate}%) v.s. ${chipdist.avgCost.toFixed(2)} (${avgrate}%)`;
   pen.fillStyle = 'black';
   pen.fillText(text, 10, h - 10);
}

export default function StockOneChipdist() {
   const [index, setIndex] = useState(0);
   const [open, setOpen] = useState(false);
   const [data, setData] = useState(null);
   const canvasRef = useRef(null);
   const close = () => setOpen(false);

   const cts = data?.chipdist ? new Date(data.chipdist[index].T) : null;
   const currentDate = cts ? `${cts.getFullYear()}-${cts.getMonth()+1}-${cts.getDate()}` : '';
   const onChangeIndex = (evt) => {
      setIndex(evt.target.value);
   };

   useEffect(() => {
      paintChipdist(canvasRef.current, data, index);
   }, [index, canvasRef]);

   useEffect(() => {
      eventbus.on('stock.one.chipdist', handleChipdist);
      return () => {
         eventbus.off('stock.one.chipdist', handleChipdist);
      };

      function handleChipdist(evt) {
         // evt = { meta, data: historyData }
         if (!evt || !evt.meta || !evt.data || !evt.data.length) return;
         eventbus.emit('loading');
         (async () => {
            const h = evt.data;
            const calcObj = new ChipDistCalculator(h);
            const last = h[h.length - 1];
            const obj = { calc: calcObj, chipdist: [], latestTs: new Date(last.T) };
            obj.stat = { xmin: Infinity, xmax: -Infinity, ymin: Infinity, ymax: -Infinity };
            for (let i = 0, n = h.length; i < 60 && i < n; i++) {
               await ((async () => {
                  const hi = h.length - i - 1;
                  const hp = h[hi];
                  const r = calcObj.calc(hi);
                  r.C = hp.C;
                  r.T = hp.T;
                  r.x.forEach(z => {
                     if (obj.stat.xmin > z) obj.stat.xmin = z;
                     if (obj.stat.xmax < z) obj.stat.xmax = z;
                  });
                  r.y.forEach(z => {
                     if (obj.stat.ymin > z) obj.stat.ymin = z;
                     if (obj.stat.ymax < z) obj.stat.ymax = z;
                  });
                  obj.chipdist.push(r);
               })());
            }
            setIndex(0);
            setData(obj);
            setOpen(true);
            setTimeout(() => paintChipdist(canvasRef.current, obj, 0));
            eventbus.emit('loaded');
         })();
      }
   });

   return <Drawer open={open} anchor="bottom" onClose={close}><Box sx={{
      minHeight: '300px', padding: '10px',
      width: '100%', maxWidth: '800px', margin: '0 auto',
      overflowX: 'hidden', overflowY: 'auto',
      canvas: { width: '100%', height: '200px' },
   }}>
      {data ? <Box sx={{ display: 'flex' }}>
         <Box sx={{ width: '110px', lineHeight: '30px' }}>{currentDate}</Box>
         <Box sx={{ flex: '1 0 auto' }}>
            <Slider valueLabelDisplay="off" min={0} max={59} value={index} onChange={onChangeIndex}/>
         </Box>
      </Box> : null}
      <canvas ref={canvasRef}>(not support canvas)</canvas>
   </Box></Drawer>;
}