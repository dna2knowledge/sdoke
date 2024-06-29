import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import NoData from '$/component/shared/no-data';
import StockTradeTooltip from '$/component/stock/stock-trade-tooltip';
import StockOneTrade from '$/component/stock/stock-one-trade';
import config from '$/component/stock/stock-trade-config';

import { useTranslation } from 'react-i18next';

function pad0(num) {
   if (num >= 10) return `${num}`;
   return `0${num}`;
}

function buildDateList(firstDay, endDay) {
   let cur = firstDay.getTime();
   const endCur = endDay.getTime();
   const dateList = [];
   while (cur <= endCur) {
      const curd = new Date(cur);
      dateList.unshift(`${curd.getFullYear()}-${pad0(curd.getMonth()+1)}-${pad0(curd.getDate())}`);
      cur += 24 * 3600 * 1000;
   }
   return dateList;
}

function measureDayH(elem) {
   // TODO: calc correct div height with font
   const canvas = document.createElement('canvas');
   const pen = canvas.getContext('2d');
   pen.font = window.getComputedStyle(elem).font;
   const box = pen.measureText('2024-01-01');
   config.dh = box.hangingBaseline;
   return box.hangingBaseline;
}

function buildTradeList(firstDay, endDay, trades) {
   const tradeList = trades.map((z, index) => Object.assign({ index }, z)).sort((a, b) => {
      if (a.S && !b.S) return -1;
      if (!a.S && b.S) return 1;
      const dt = a.T - b.T;
      if (dt !== 0) return dt;
      if (!a.S && !b.S) return 0;
      return a.S.T - b.S.T;
   });
   const slots = [{ ts: -1, i: 0 }];
   const ts = config.util.getTodayTs();
   let maxI = 0;
   const edTs = endDay.getTime();
   // header height is equal to how many days
   const headerT = Math.ceil(config.th1/config.dh+1) * config.dayms;
   tradeList.forEach(z => {
      let slotI = 0;
      while ( slots[slotI].ts > z.T ) {
         slotI ++;
         if (slotI >= slots.length) slots.push({ ts: -1, i: slotI });
      }
      const slot = slots[slotI];
      const edT = z.S?.T || ts;
      const edI = Math.floor((edTs - edT) / config.dayms);
      const stI = Math.ceil((edTs - z.T) / config.dayms);
      slot.ts = edT + headerT;
      z.I = slotI;
      if (slotI > maxI) maxI = slotI;
      z.stI = stI;
      z.edI = edI;
   });
   slots.sort((a, b) => b.ts - a.ts);
   const slotmap = {};
   slots.forEach((z, i) => { slotmap[z.i] = i; });
   tradeList.forEach(z => {
      //z.I = maxI - z.I;
      z.I = slotmap[z.I];
   });
   return tradeList;
}

function trimDateTradeList(dateList, tradeList) {
   let maxI = 0;
   tradeList.forEach(z => {
      if (z.stI > maxI) maxI = z.stI;
   });
   dateList.splice(maxI, dateList.length-maxI);
}

export default function StockTradeTimeline(props) {
   const { t } = useTranslation('trade');

   const { data } = props;
   const boxRef = useRef(null);
   const containerRef = useRef(null);
   const hilightRef = useRef(null);
   const year = data?.Y || new Date().getFullYear();
   const trades = data?.Ts || [];

   const tso = new Date();
   let firstDay = new Date(`${year}-01-01`);
   let endDay;
   if (tso.getFullYear() === year) {
      endDay = tso;
   } else {
      endDay = new Date(`${year}-12-31`);
   }
   const wd = firstDay.getDay();
   const dateList = buildDateList(firstDay, endDay);
   const tradeList = buildTradeList(firstDay, endDay, trades);
   trimDateTradeList(dateList, tradeList);

   useEffect(() => {
      if (containerRef.current) {
         containerRef.current.addEventListener('mouseleave', onCancelHighlight);
         containerRef.current.addEventListener('mousemove', onMoveHighlight);
      }
      return () => {
         if (containerRef.current) {
            containerRef.current.removeEventListener('mousemove', onMoveHighlight);
            containerRef.current.removeEventListener('mouseleave', onCancelHighlight);
         }
      }

      function onCancelHighlight() {
         hilightRef.current.style.display = 'none';
      }
      function onMoveHighlight(evt) {
         const target = evt.target;
         if (target.classList.contains('cell')) {
            hilightRef.current.style.display = 'block';
            hilightRef.current.style.top = `${target.offsetTop}px`;
            const dateBoxW = containerRef.current.children[0].offsetWidth;
            const offset = containerRef.current.parentNode.scrollLeft;
            hilightRef.current.style.width = `${containerRef.current.offsetWidth-dateBoxW}px`;
            hilightRef.current.style.left = `${offset-10}px`;
         } else onCancelHighlight();
      }
   });

   if (!tradeList.length) return <NoData>{t('tip.nodata', 'There is no track of stock history.')}</NoData>;
   return <Box ref={containerRef} sx={{
      display: 'flex',
      '.cell': { height: `${config.dh}px`, userSelect: 'none' }
   }}>
      <Box sx={{
         zIndex: '100',
         position: 'sticky', left: '0px',
         marginRight: '10px',
         padding: '0 5px',
         backgroundColor: 'white',
      }}>
         <Box sx={{ height: `${config.th1 + 10}px` }}> </Box>
         {dateList.map((z, i) => <Box className="cell" key={i}>{z}</Box>)}
         <Box sx={{ height: `${config.th1 + 10}px` }}> </Box>
      </Box>
      <Box ref={boxRef} sx={{ position: 'relative' }}>
         <Box ref={hilightRef} sx={{
            height: `${config.dh}px`,
            userSelect: 'none',
            backgroundColor: 'yellow',
            opacity: '0.3',
            position: 'absolute',
            zIndex: '1000',
            left: '0px',
         }}>&nbsp;</Box>
         <StockTradeTooltip />
         {tradeList.map((z, i) => <StockOneTrade
            key={i}
            x={z.I * config.tw1}
            y={z.edI * config.dh + 10}
            w={config.tw1}
            h={(z.stI - z.edI) * config.dh + config.th1}
            year={year}
            data={z}
         />)}
      </Box>
   </Box>;
}