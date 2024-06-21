import { useState, useEffect, useRef } from 'react';
import { Box, ClickAwayListener, IconButton, Paper, Popper, MenuList, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import config from '$/component/stock/stock-trade-config';

function paintHistory(canvas, w0, h0, item, history) {
   const pen = canvas.getContext('2d');
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w0, h0);
   if (history.length <= 1) return;
   const stat = { max: 0, min: Infinity, last: history[0] };
   history.forEach(z => {
      if (z.H > stat.max) stat.max = z.H;
      if (z.L < stat.min) stat.min = z.L;
   });
   const dm = stat.max - stat.min;
   const T0 = item.T;
   const tsa = item.T;
   const tsb = item?.S?.T || new Date().getTime();
   const n0 = Math.floor((tsb - tsa)/config.dayms);

   // draw special point background
   if (item.B) {
      const stI = Math.floor((tsb - item.B.T)/config.dayms);
      pen.fillStyle = 'yellow';
      const y = config.dh * stI + config.dh;
      pen.beginPath();
      pen.moveTo(0, y); pen.lineTo(w0, y); pen.lineTo(w0/2, y-config.dh); pen.lineTo(0, y);
      pen.fill();
   }
   if (item.S) {
      const edI = Math.floor((tsb - item.S.T)/config.dayms);
      const y = config.dh * edI;
      pen.fillStyle = 'yellow';
      pen.beginPath();
      pen.moveTo(0, y); pen.lineTo(w0, y); pen.lineTo(w0/2, y+config.dh); pen.lineTo(0, y);
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
      const stI = Math.floor((tsb - item.B.T)/config.dayms);
      const xP = (item.B.P - stat.min) / dm * w0;
      pen.fillStyle = 'orange';
      pen.fillRect(xP-3, stI*config.dh + config.dh/2-3, 6, 6);
   }
   if (item.S) {
      const edI = Math.floor((tsb - item.S.T)/config.dayms);
      const xP = (item.S.P - stat.min) / dm * w0;
      pen.fillStyle = 'orange';
      pen.fillRect(xP-3, edI*config.dh + config.dh/2-3, 6, 6);
   }
}

export default function StockOneTrade(props) {
   const { x, y, w, h, data } = props;
   const canvasRef = useRef(null);
   const anchorRef = useRef(null);
   const cache = useRef({});
   const [menuOpen, setMenuOpen] = useState(false);

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
         const last = hdata[hdata.length-1];
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
         paintHistory(canvasRef.current, w-5, h, data, hdata);
      }
   }, [data]);

   useEffect(() => {
      let needData = true;
      const dataPromise = databox.stock.getStockHistory(data.code)
      cache.current.dataPromise = dataPromise;
      dataPromise.then((raw) => {
         if (!needData) return;
         const tsa = data.T;
         const tsb = data?.S?.T || new Date().getTime();
         const hdata = raw.filter(z => z.T >= tsa && z.T <= tsb);
         const i = raw.indexOf(hdata[0]);
         hdata.unshift(i === 0 ? null : raw[i-1]);
         cache.current.hdata = hdata;
         paintHistory(canvasRef.current, w-5, h, data, hdata);
      });
      return () => {
         needData = false;
      };
   });

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
         <Box>{data.code} {data.name}</Box>
         <Box sx={{ display: 'flex' }}>
            <Box sx={{ flex: '1 0 auto' }}></Box>
            <IconButton ref={anchorRef} sx={{ width: '16px', height: '16px' }} onClick={onMenuOpen}><MoreVertIcon /></IconButton>
            <Popper open={menuOpen} anchorEl={anchorRef.current} disablePortal><Paper>
               <ClickAwayListener onClickAway={onMenuClose}><MenuList>
                  <MenuItem onClick={onEditClick}>Edit</MenuItem>
                  <MenuItem onClick={onDelClick}>Remove</MenuItem>
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