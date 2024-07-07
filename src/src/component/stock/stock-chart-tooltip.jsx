import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import eventbus from '$/service/eventbus';
import config from '$/component/stock/stock-trade-config';

function clean(elem) {
   while (elem.children.length) elem.removeChild(elem.children[0]);
   elem.textContent = '';
}

function nop() {}
function o(tag) { return document.createElement(tag); }
function a(p, elem) { p.appendChild(elem); return p; }
function txt(elem, txt) { elem.textContent = txt; return elem; }

function buildInfo(container, info) {
   const t = info ? info.t : nop;
   clean(container);
   a(container, a(o('div'), txt(o('span'), config.util.getDateStr(info.T))));
   a(container, a(o('div'), txt(o('span'), `${t('t.open', 'open')}: ${info.O.toFixed(2)}`)));
   a(container, a(o('div'), txt(o('span'), `${t('t.close', 'close')}: ${info.C.toFixed(2)}`)));
   a(container, a(o('div'), txt(o('span'), `${t('t.low', 'low')}: ${info.L.toFixed(2)}`)));
   a(container, a(o('div'), txt(o('span'), `${t('t.high', 'high')}: ${info.H.toFixed(2)}`)));
   a(container, a(o('div'), txt(o('span'), `${t('t.vol', 'vol')}: ${info.V.toFixed(2)}`)));
   if (info && !isNaN(info.stg)) {
      const div = o('div');
      a(div, txt(o('span'), `${t('t.score', 'score')}: `));
      const span = o('span');
      if (info.stg > 0) {
         span.style.color = 'red';
         if (info.stg >= 1) span.style.fontWeight = 'bold';
      } else if (info.stg < 0) {
         span.style.color = 'green';
         if (info.stg <= 1) span.style.fontWeight = 'bold';
      }
      a(container, a(div, txt(span, `${info.stg.toFixed(4)}`)));
   }
   if (info && info.vis) {
      const gs = Object.keys(info.vis);
      if (!gs.length) return;
      a(container, o('hr'));
      gs.forEach(gn => {
         a(container, a(o('div'), txt(o('span'), `${gn}:`)));
         info.vis[gn].forEach(z => {
            const div = o('div');
            const span = o('span');
            span.style.color = z.c;
            span.style.fontWeight = 'bold';
            a(container, a(div, txt(span, `-- ${z.i}`)));
            a(div, txt(o('span'), `: ${z.v.toFixed(2)}`));
         });
      });
   }
}

export default function StockChartTooltip() {
   const tooltipRef = useRef(null);
   useEffect(() => {
      let lastInfo = null;
      eventbus.on('stock.chart.tooltip', onTooltipUpdate);
      return () => {
         eventbus.off('stock.chart.tooltip', onTooltipUpdate);
      };

      function onTooltipUpdate(info) {
         if (info) {
            if (lastInfo && Object.keys(lastInfo).reduce((a, k) => lastInfo[k] === info[k] ? a : a+1, 0) === 0) return;
            const container = tooltipRef.current.parentNode;
            const box = container.getBoundingClientRect();
            buildInfo(tooltipRef.current, info);
            tooltipRef.current.style.display = 'block';
            const w = tooltipRef.current.offsetWidth;
            const h = tooltipRef.current.offsetHeight;
            tooltipRef.current.style.left = `${info.x > box.left + box.width/2 ? box.left : (box.left + box.width - w)}px`;
            tooltipRef.current.style.top = `${box.top + box.height - h}px`;
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
      opacity: '0.7',
      width: '100px',
      top: '0',
      left: '0',
      display: 'none',
   }}>
   </Box>;
}
