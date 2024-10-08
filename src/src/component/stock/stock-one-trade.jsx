import { useState, useEffect, useRef } from 'react';
import { Box, ClickAwayListener, IconButton, Paper, Popper, MenuList, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import config from '$/component/stock/stock-trade-config';

import { useTranslation } from 'react-i18next';

function paintHistory(canvas, w0, h0, year, item, history) {
   const stDate = new Date(item.T);
   const edDate = item?.S?.T ? new Date(item.S.T) : new Date();
   const T0 = stDate.getFullYear() === year ? item.T : new Date(`${year}-01-01`).getTime();
   const tsa = T0;
   const tsb = edDate.getFullYear() === year ? edDate.getTime() : new Date(`${year}-12-31`).getTime();

   const hi0 = history, partial = {};
   history = hi0.slice(1).filter(z => new Date(z.T).getFullYear() === year);
   const relocLast = history.length > 0 ? hi0[hi0.filter(z => !z || z.T < history[0].T).length-1] : null;
   history.unshift(relocLast);
   if (canvas.style.height) {
      canvas.height = '';
      canvas.style.height = '';
      canvas.parentNode.style.height = '';
      canvas.parentNode.parentNode.style.height = '';
      canvas.parentNode.parentNode.style.top = '';
   }
   if (history.length !== hi0.length && history.length) {
      partial.st = hi0[1];
      partial.ed = hi0[hi0.length-1];
      if (new Date(partial.st.T).getFullYear() === year) partial.st = null;
      if (new Date(partial.ed.T).getFullYear() === year) partial.ed = null;
      const resizeH = (
         Math.floor(
            (new Date(history[history.length-1].T).getTime() - new Date(history[1].T).getTime())/config.dayms
         ) * config.dh
      ) + (partial.st ? config.dh : 0);
      canvas.height = `${resizeH}`;
      canvas.style.height = `${resizeH}px`;
      canvas.parentNode.style.height = `${resizeH}px`;
      canvas.parentNode.parentNode.style.height = `${resizeH + config.th1}px`;
      if (partial.ed) {
         canvas.parentNode.parentNode.style.top = `${10}px`;
      }
      h0 = resizeH;
   }
   const pen = canvas.getContext('2d');
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w0, h0);
   if (history.length <= 1) return;
   const stat = { max: 0, min: Infinity, last: history[0], maxv: 0 };
   history.forEach(z => {
      if (!z) return;
      if (z.H > stat.max) stat.max = z.H;
      if (z.L < stat.min) stat.min = z.L;
      if (z.V > stat.maxv) stat.maxv = z.V;
   });
   const dm = stat.max - stat.min;
   const dmv = stat.maxv === 0 ? 1 : stat.maxv;
   const n0 = Math.floor((tsb - tsa)/config.dayms);

   // draw volumn
   for (let i = 1, n = history.length; i < n; i++) {
      const j = n - i;
      const z = history[j];
      const T = z.T;
      const w = z.V ? (z.V / dmv * w0) : 2;
      const y = config.dh * (n0 - Math.floor((T - T0)/config.dayms));
      pen.fillStyle = '#ddd';
      pen.fillRect(w0 - w, y+config.dh/4, w, config.dh/2);
   }

   // draw special point background
   const stI = item.B ? Math.floor((tsb - item.B.T)/config.dayms) : 0;
   const edI = item.S ? Math.floor((tsb - item.S.T)/config.dayms) : 0;
   if (item.B) {
      const lastP = item.S ? item.S.P : history[history.length-1].C;
      if (item.B.P === lastP) pen.fillStyle = 'yellow';
      else if (item.B.P < lastP) pen.fillStyle = 'rgb(255, 200, 200)';
      else pen.fillStyle = 'rgb(200, 255, 200)';
      const y = config.dh * stI + config.dh;
      pen.beginPath();
      pen.moveTo(0, y); pen.lineTo(w0, y); pen.lineTo(w0/2, y-config.dh); pen.lineTo(0, y);
      pen.fill();
   }
   if (item.S) {
      const y = config.dh * edI;
      if (!item.B || item.B.P === item.S.P) pen.fillStyle = 'yellow';
      else if (item.S.P > item.B.P) pen.fillStyle = 'rgb(255, 200, 200)';
      else pen.fillStyle = 'rgba(200, 255, 200)';
      pen.fillRect(0, config.dh * edI, w0, config.dh * (stI - edI + 1));
      /* original design: a down triangle
      pen.beginPath();
      pen.moveTo(0, y); pen.lineTo(w0, y); pen.lineTo(w0/2, y+config.dh); pen.lineTo(0, y);
      pen.fill();
      */
   }
   if (partial.st) {
      pen.fillStyle = 'rgb(200, 200, 255)';
      pen.beginPath();
      pen.moveTo(0, h0-config.dh); pen.lineTo(w0, h0-config.dh); pen.lineTo(w0/2, h0); pen.lineTo(0, h0-config.dh);
      pen.fill();
   }
   if (partial.ed) {
      pen.fillStyle = 'rgb(200, 200, 255)';
      pen.beginPath();
      pen.moveTo(0, config.dh); pen.lineTo(w0, config.dh); pen.lineTo(w0/2, 0); pen.lineTo(0, config.dh);
      pen.fill();
   }

   // draw history
   for (let i = 1, n = history.length; i < n; i++) {
      const j = n - i;
      const z = history[j];
      const T = z.T;
      const xL = (z.L - stat.min) / dm * w0;
      const xH = (z.H - stat.min) / dm * w0;
      const xO = (z.O - stat.min) / dm * w0;
      const xC = (z.C - stat.min) / dm * w0;
      const y = config.dh * (n0 - Math.floor((T - T0)/config.dayms));
      if (z.O < z.C) {
         pen.fillStyle = 'red';
      } else if (z.O > z.C) {
         pen.fillStyle = 'green';
      } else {
         if (stat.last) {
            if (stat.last.C < z.C) {
               pen.fillStyle = 'red';
            } else if (stat.last.C > z.C) {
               pen.fillStyle = 'green';
            } else pen.fillStyle = '#ccc';
         } else  pen.fillStyle = '#ccc';
      }
      pen.fillRect(xL, y+config.dh/2-1, xH - xL, 2);
      if (z.O < z.C) {
         pen.fillRect(xO, y+config.dh/4, xC - xO, config.dh/2);
      } else if (z.O > z.C) {
         pen.fillRect(xC, y+config.dh/4, xO - xC, config.dh/2);
      } else {
         pen.fillRect(xO, y+config.dh/4, 2, config.dh/2);
      }
      stat.last = z;
   }

   // draw special point B S
   if (item.B) {
      const xP = (item.B.P - stat.min) / dm * w0;
      pen.fillStyle = 'orange';
      pen.fillRect(xP-3, stI*config.dh + config.dh/2-3, 6, 6);
   }
   if (item.S) {
      const xP = (item.S.P - stat.min) / dm * w0;
      pen.fillStyle = 'orange';
      pen.fillRect(xP-3, edI*config.dh + config.dh/2-3, 6, 6);
   }
}

function calcRate(stP, edP) {
   if (stP <= 0 || edP <= 0) return '---';
   const rate = ((edP - stP) / stP * 100).toFixed(4);
   return `${rate}`;
}

export default function StockOneTrade(props) {
   const { t } = useTranslation('trade');

   const { x, y, w, h, year, data } = props;
   const canvasRef = useRef(null);
   const anchorRef = useRef(null);
   const cache = useRef({});
   const [menuOpen, setMenuOpen] = useState(false);
   const [rate, setRate] = useState('---');

   useEffect(() => {
      if (canvasRef.current) {
         canvasRef.current.addEventListener('mousemove', onMouseMove);
         canvasRef.current.addEventListener('mouseleave', onMouseLeave);
      }
      return () => {
         if (canvasRef.current) {
            canvasRef.current.removeEventListener('mousemove', onMouseMove);
            canvasRef.current.removeEventListener('mouseleave', onMouseLeave);
         }
      };

      function onMouseMove(evt) {
         const hdata = cache.current.hdata;
         if (!hdata || !hdata.length) return;
         const i = Math.floor(evt.offsetY/config.dh);
         if (cache.current.lastI === i) return;
         cache.current.lastI = i;
         const edDate = data?.S?.T ? new Date(data.S.T) : new Date(config.util.getTodayTs());
         const tsb = edDate.getFullYear() === year ? edDate.getTime() : new Date(`${year}-12-31`).getTime();
         const T = tsb - config.dayms * i;
         const h = hdata.find(z => z.T === T);
         const hi = hdata.indexOf(h);
         const lastH = hdata[hi-1];
         if (!h) {
            eventbus.emit('stock.trade.tooltip', null);
            return;
         }
         const container = canvasRef.current.parentNode.parentNode;
         const box = container.getBoundingClientRect();
         const x = box.left;
         const y = evt.pageY + i * config.dh - evt.offsetY - config.th1;
         const obj = { x, y, ... h };
         if (lastH) obj.lastC = lastH.C;
         if (data?.B?.T === T) obj.B = data.B;
         if (data?.S?.T === T) obj.S = data.S;
         eventbus.emit('stock.trade.tooltip', obj);
      }

      function onMouseLeave() {
         cache.current.lastI = -1;
         eventbus.emit('stock.trade.tooltip', null);
      }
   });

   useEffect(() => {
      eventbus.on(`stock.one.${data?.code}.trade.update`, onStockTradeUpdated);
      return () => {
         eventbus.off(`stock.one.${data?.code}.trade.update`, onStockTradeUpdated);
      };

      async function onStockTradeUpdated(rt) {
         if (!rt) return;
         if (data?.S && data.S.T !== rt.T) return;
         if (!cache.current.dataPromise) return;
         await cache.current.dataPromise;
         const hdata = cache.current.hdata;
         if (!hdata) return;
         const last = hdata.length <= 1 ? {T:0} : hdata[hdata.length-1];
         if (last.T === rt.T) {
            last.O = rt.O;
            last.C = rt.C;
            last.L = rt.L;
            last.H = rt.H;
            last.V = rt.V;
         } else {
            hdata.push({
               T: rt.T,
               O: rt.O,
               C: rt.C,
               L: rt.L,
               H: rt.H,
               V: rt.V,
            });
         }
         const stP = data.B && data.B.P !== -Infinity && data.B.P !== null ? data.B.P : hdata[1].C;
         const edP = data.S ? data.S.P : hdata[hdata.length-1].C;
         setRate(calcRate(stP, edP));
         paintHistory(canvasRef.current, w-5, h, year, data, hdata);
      }
   }, [data]);

   useEffect(() => {
      let needData = true;
      const dataPromise = databox.stock.getStockHistory(data?.code, data?.S?.T);
      cache.current.dataPromise = dataPromise;
      dataPromise.then((raw) => {
         if (!needData) return;
         const tsa = data.T;
         const tsb = data?.S?.T || new Date().getTime();
         const hdata = raw.filter(z => z.T >= tsa && z.T <= tsb);
         const i = hdata.length ? raw.indexOf(hdata[0]) : (raw.length-1);
         hdata.unshift(i === 0 ? null : raw[i-1]);
         cache.current.hdata = hdata;
         const stP = data.B ? (data.B.P === -Infinity || data.B.P === null ? hdata.find(z => z.T === data.B.T)?.O : data.B.P) : hdata[1].C;
         const edP = data.S ? data.S.P : hdata[hdata.length-1].C;
         setRate(calcRate(stP, edP));
         paintHistory(canvasRef.current, w-5, h, year, data, hdata);
      });
      return () => {
         needData = false;
      };
   }, [x, y, w, h, data]);

   const onMenuClose = () => {
      setMenuOpen(false);
   };
   const onMenuOpen = () => {
      setMenuOpen(true);
   };
   const onEditClick = () => {
      eventbus.emit('stock.strategy.edit', data?.index);
      onMenuClose();
   };
   const onDelClick = () => {
      eventbus.emit('stock.strategy.del', data?.index);
      onMenuClose();
   };
   const onStockTitleClick = () => {
      const holdData = data;
      eventbus.comp.waitUntil('comp.stock.stock-panel').then(() => {
         eventbus.emit('stock.pinned.click', {
            code: holdData.code,
            name: holdData.name,
         });
      });
   };

   return <Box sx={{
      position: 'absolute',
      top: `${y}px`,
      left: `${x}px`,
      width: `${w-5}px`,
      marginRight: '5px',
      height: `${h}px`,
      backgroundColor: 'red'
   }}>
      <Box sx={{ height: `${config.th1}px`, backgroundColor: '#ccc', fontSize: '10px' }}>
         <Box><a href="#/" onClick={onStockTitleClick}>{data.code} {data.name}</a></Box>
         <Box sx={{ display: 'flex' }}>
            <Box sx={{
               display: 'flex',
               flex: '1 0 auto',
               '.red': { color: 'red' },
               '.green': { color: 'green' },
               '.gray': { color: 'gray' },
            }}>
               <Box className={rate > 0 ? 'red' : (rate < 0 ? 'green' : 'gray')}>{rate}%</Box>
            </Box>
            <IconButton ref={anchorRef} sx={{ width: '16px', height: '16px' }} onClick={onMenuOpen}><MoreVertIcon /></IconButton>
            <Popper open={menuOpen} anchorEl={anchorRef.current}><Paper>
               <ClickAwayListener onClickAway={onMenuClose}><MenuList>
                  <MenuItem onClick={onEditClick}>{t('t.edit', 'Edit')}</MenuItem>
                  <MenuItem onClick={onDelClick}>{t('t.remove', 'Remove')}</MenuItem>
               </MenuList></ClickAwayListener>
            </Paper></Popper>
         </Box>
      </Box>
      <Box sx={{
         height: `${h-config.th1}px`,
         '> canvas': {
            width: `${w-5}px`,
            height: `${h-config.th1}px`
         },
      }}>
         <canvas width={w-5} height={h-config.th1} ref={canvasRef}></canvas>
      </Box>
   </Box>;
}