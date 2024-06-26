import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import eventbus from '$/service/eventbus';
import config from '$/component/stock/stock-trade-config';

function clean(elem) {
   while (elem.children.length) elem.removeChild(elem.children[0]);
   elem.textContent = '';
}

function buildInfo(container, info) {
   clean(container);
   let div, span;
   div = document.createElement('div');
   div.textContent = config.util.getDateStr(info.T);
   container.appendChild(div);

   if (info.B) {
      div = document.createElement('div');
      span = document.createElement('span');
      span.className = '';
      span.textContent = `B: ${info.B.P.toFixed(2)}`;
      div.appendChild(span);
      container.appendChild(div);
   }
   if (info.S) {
      div = document.createElement('div');
      span = document.createElement('span');
      span.className = '';
      span.textContent = `S: ${info.S.P.toFixed(2)}`;
      div.appendChild(span);
      container.appendChild(div);
   }

   div = document.createElement('div');
   span = document.createElement('span');
   span.className = 'price';
   span.textContent = `O: ${info.O.toFixed(2)}`;
   div.appendChild(span);
   span = document.createElement('span');
   span.className = 'price';
   span.textContent = `C: ${info.C.toFixed(2)}`;
   div.appendChild(span);
   container.appendChild(div);
   div = document.createElement('div');

   span = document.createElement('span');
   span.className = 'price';
   span.textContent = `L: ${info.L.toFixed(2)}`;
   div.appendChild(span);
   span = document.createElement('span');
   span.className = 'price';
   span.textContent = `H: ${info.H.toFixed(2)}`;
   div.appendChild(span);
   container.appendChild(div);

   div = document.createElement('div');
   span = document.createElement('span');
   span.className = '';
   span.textContent = `V: ${info.V.toFixed(0)}`;
   div.appendChild(span);
   container.appendChild(div);
}

export default function StockTradeTooltip() {
   const tooltipRef = useRef(null);
   useEffect(() => {
      let lastInfo = null;
      eventbus.on('stock.trade.tooltip', onTooltipUpdate);
      return () => {
         eventbus.off('stock.trade.tooltip', onTooltipUpdate);
      };

      function onTooltipUpdate(info) {
         if (info) {
            if (lastInfo && Object.keys(lastInfo).reduce((a, k) => lastInfo[k] === info[k] ? a : a+1, 0) === 0) return;
            const container = tooltipRef.current.parentNode;
            buildInfo(tooltipRef.current, info);
            tooltipRef.current.style.display = 'block';
            const w = tooltipRef.current.offsetWidth;
            const winW = window.innerWidth;
            let rx;
            if (info.x + config.tw1 + w > winW) {
               rx = info.x - w;
            } else {
               rx = info.x + config.tw1;
            }
            tooltipRef.current.style.left = `${rx}px`;
            tooltipRef.current.style.top = `${info.y}px`;
         } else {
            tooltipRef.current.style.display = 'none';
         }
         lastInfo = info;
      }
   }, [tooltipRef]);

   return <Box ref={tooltipRef} sx={{
      position: 'fixed',
      zIndex: '1001',
      fontSize: '10px',
      backgroundColor: 'yellow',
      opacity: '0.8',
      width: '100px',
      top: '0',
      left: '0',
      display: 'none',
      '.price': {
         display: 'inline-block',
         width: '50px',
      },
   }}>
   </Box>;
}
