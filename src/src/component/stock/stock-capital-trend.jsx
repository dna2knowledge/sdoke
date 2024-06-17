import { useState, useRef, useEffect } from 'react';
import { Box, Drawer, Divider, IconButton, Link } from '@mui/material';
import { Button, ButtonGroup } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import NoData from '$/component/shared/no-data';
import eventbus from '$/service/eventbus';
import local from '$/service/local';
import captialTrendAnalysis from '$/analysis/trend/capital';

function transform(data) {
   return { S: transformOne(data.S), K: transformOne(data.K) };
}
function transformOne(areas) {
   const gain = [], loss = [];
   Object.values(areas).forEach(item => {
      if (item.avg >= 0) gain.push(item);
      else loss.push(item);
   });
   if (gain.length) gain.sort((a, b) => b.avg - a.avg);
   if (loss.length) loss.sort((a, b) => a.avg - b.avg);
   return { gain, loss };
}

function paintTrendHist(canvas, data) {
   const pen = canvas.getContext('2d');
   const w0 = canvas.offsetWidth;
   const h0 = canvas.offsetHeight;
   if (!w0 || !h0) return;
   const w1 = 2;
   const max = data.reduce((a, x) => a > x ? a : x, 1);
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w0, h0);
   pen.strokeStyle = '#ddd';
   pen.strokeRect(0, 0, w0, h0);
   pen.fillStyle = 'green';
   for (let i = 0; i < 201; i++) {
      if (i % 10 === 0) {
         pen.save(); pen.fillStyle = '#eee'; pen.fillRect(i*w1, 0, w1, h0);
         pen.restore();
         if (i === 100) pen.fillStyle = 'red';
         pen.fillText(`${Math.floor(Math.abs((i-99)/10))}`, i*w1+w1*10/2-2, 14);
      }
      if (i === 100) pen.fillStyle = 'gray';
      else if (i === 101) pen.fillStyle = 'red';
      const d = data[i];
      if (d === 0) continue;
      let h1 = Math.floor(d/max*h0);
      pen.fillRect(i*w1, h0-h1, w1, h1);
   }
}
function paintTrendHistory(canvas, data) {
   const pen = canvas.getContext('2d');
   const w0 = canvas.offsetWidth;
   const h0 = canvas.offsetHeight;
   if (!w0 || !h0) return;
   const w1 = 2;
   let max = 0, min = Infinity;
   data.forEach(z => {
      if (z > max) max = z;
      if (z < min) min = z;
   });
   pen.fillStyle = 'white';
   pen.fillRect(0, 0, w0, h0);
   let lastpt;
   const md = max === min ? 1 : (max - min);
   pen.fillStyle = 'black';
   pen.fillText(`${(max*100).toFixed(4)}`, 5, 14);
   pen.fillText(`${(min*100).toFixed(4)}`, 5, h0-2);
   for (let i = 200; i >= 0; i -= 20) {
      pen.save(); pen.fillStyle = '#eee'; pen.fillRect(i*w1, 0, w1, h0);
      pen.restore();
      pen.fillText(`${Math.floor((200-i)/20)}`, i*w1+w1*20/2-2, 28);
   }

   const horg = h0 - Math.floor((0-min)/md*h0);
   pen.save(); pen.strokeStyle = '#ddd';
   pen.beginPath(); pen.moveTo(0, horg); pen.lineTo(w0, horg);
   pen.stroke(); pen.restore();

   for (let i = 0, n = data.length; i < n; i++) {
      const d = data[i];
      const x = w1 * (i + 201-n);
      let h1 = Math.floor((d-min)/md*h0);
      if (max === min) h1 = Math.floor(h0/2);
      const y = h0 - h1;
      if (lastpt) {
         pen.save(); if (d < 0) pen.strokeStyle = 'green'; else pen.strokeStyle = 'red';
         pen.beginPath(); pen.moveTo(lastpt.x, lastpt.y); pen.lineTo(x, y);
         pen.stroke(); pen.restore();
      }
      if (d < 0) pen.fillStyle = 'green'; else pen.fillStyle = 'red';
      pen.fillRect(x-1, y-1, 3, 3);
      lastpt = {x, y};
   }
}

function CapitalTrendOne(props) {
   const { data } = props;
   const [viewtype, setViewtype] = useState(local.data.captr?.viewtype || 'histogram');
   const canvasRef = useRef(null);
   const canvashRef = useRef(null);
   const h0 = 80;

   useEffect(() => {
      eventbus.on('stock.analysis.captr.viewtype', handleUpdateStockCaptrViewType);
      return () => {
         eventbus.off('stock.analysis.captr.viewtype', handleUpdateStockCaptrViewType);
      };

      function handleUpdateStockCaptrViewType(viewtype_) {
         setViewtype(viewtype_);
      }
   }, [viewtype]);

   useEffect(() => {
      const canvas = canvasRef.current;
      const canvash = canvashRef.current;
      if (canvas) {
         canvas.style.width = `${data.b.length*2}px`;
         canvas.style.height = `${h0}px`;
         canvas.width = canvas.offsetWidth;
         canvas.height = h0;
         paintTrendHist(canvas, data.b);
      }
      if (canvash) {
         canvash.style.width = `${data.h.length*2}px`;
         canvash.style.height = `${h0}px`;
         canvash.width = canvash.offsetWidth;
         canvash.height = h0;
         paintTrendHistory(canvash, data.h);
      }
   });

   if (data && data.L) data.L.sort((a, b) => b.rate - a.rate);

   return <Box sx={{ '.hide': { display: 'none' } }}>
      <Box>{data.t} ({data.n}) {(data.avg*100).toFixed(4)}</Box>
      <Box className={viewtype !== 'histogram' ? 'hide' : ''}><canvas ref={canvasRef}>(Not support &lt;canvas&gt;)</canvas></Box>
      <Box className={viewtype !== 'history' ? 'hide' : ''}><canvas ref={canvashRef}>(Not support &lt;canvas&gt;)</canvas></Box>
      <Box className={viewtype !== 'list' ? 'hide' : ''} sx={{
         maxHeight: '80px', overflowY: 'auto',
         '> span': { display: 'inline-block', marginRight: '5px', marginLeft: '5px', color: 'gray' },
         '> span.green': { color: 'green' },
         '> span.red': { color: 'red' },
      }}>
         {data.L.map((z, i) => <span className={z.rate > 0 ? 'red' : (z.rate < 0 ? 'green' : '')} key={i}>
            {z.name}/{z.code} ({(z.rate*100).toFixed(4)})
         </span>)}
      </Box>
   </Box>;
}

function CaptialTrendGroup(props) {
   const { data } = props;
   return <Box sx={{ display: 'flex', width: '100%' }}>
      <Box sx={{ width: 'calc(50% - 20px)', marginLeft: '10px', marginRight: '5px' }}>
         <Box>GAIN</Box>
         {data.gain.map((z, i) => <CapitalTrendOne key={i} data={z}/>)}
      </Box>
      <Box sx={{ width: 'calc(50% - 20px)', marginLeft: '5px', marginRight: '10px' }}>
         <Box>LOSS</Box>
         {data.loss.map((z, i) => <CapitalTrendOne key={i} data={z}/>)}
      </Box>
   </Box>;
}

export default function CapitalTrend() {
   const [anchor] = useState('left');
   const [suggested, setSuggested] = useState(false);
   const [loading, setLoading] = useState(false);
   const [data, setData] = useState(null);
   const [unit, setUnit] = useState(local.data.captr?.unit || 'daily');
   const [viewtype, setViewtype] = useState(local.data.captr?.viewtype || 'histogram');
   const oneKey = useRef(null);

   const onClose = () => setSuggested(false);
   const onUpdateClick = () => {
      const unit = local.data.captr?.unit || 'daily';
      if (local.data.captr?.[unit]) delete local.data.captr[unit];
      eventbus.emit('stock.analysis.captr');
      eventbus.emit('stock.analysis.captr.viewtype', local.data.captr?.viewtype);
   };

   const updateData = async () => {
      const key = `stock.analysis.captr.${Math.random()}`;
      const unit = local.data.captr?.unit || 'daily';
      oneKey.current = key;
      let ret;
      setLoading(true);
      try {
         if (!local.data.captr) local.data.captr = {};
         if (local.data.captr[unit]) {
            ret = local.data.captr[unit];
         } else {
            const retp = await captialTrendAnalysis.act(null, unit);
            // assemble partial results
            ret = retp;
         }
      } catch(err) { }
      setLoading(false);
      if (oneKey.current !== key) return false;
      if (!ret || !ret.S || !ret.K) {
         eventbus.emit('toast', { content: 'No data; due to an internal server error.', severity: 'error' });
         local.data.captr[unit] = null;
         setData(null);
         return;
      }
      local.data.captr[unit] = ret;
      const captr = transform(ret);
      setData(captr);
      return true;
   };

   useEffect(() => {
      eventbus.on('stock.analysis.captr', handleStockAnalyzeCaptr);
      eventbus.on('stock.analysis.captr.viewtype', handleUpdateStockCaptrViewType);
      return () => {
         eventbus.off('stock.analysis.captr', handleStockAnalyzeCaptr);
         eventbus.off('stock.analysis.captr.viewtype', handleUpdateStockCaptrViewType);
      };
      function handleStockAnalyzeCaptr(data) {
         if (loading) return;
         if (data?.unit) {
            local.data.captr.unit = data.unit || 'daily';
            setUnit(local.data.captr.unit);
         }

         setSuggested(true);
         setLoading(true);
         updateData();
      }
      function handleUpdateStockCaptrViewType(viewtype_) {
         local.data.captr.viewtype = viewtype_ || 'histogram';
         setViewtype(local.data.captr.viewtype);
      }
   }, [unit, viewtype, loading]);

   return <Drawer open={suggested} anchor={anchor} onClose={onClose}>
      {suggested ? (loading ? <NoData>Loading capital trend data ...</NoData>
      : (data ? <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }}>
         <Box sx={{ marginBottom: '10px' }}>
            <IconButton onClick={onUpdateClick} type="button" sx={{ p: '10px' }}><UpdateIcon /></IconButton>
            Analysis of Capital Trend
            <Box>
               <ButtonGroup>
                  <Button variant={unit === 'daily'?'contained':'outlined'}
                     onClick={() => eventbus.emit('stock.analysis.captr', { unit: 'daily'})}>Daily</Button>
                  <Button variant={unit === 'weekly'?'contained':'outlined'}
                     onClick={() => eventbus.emit('stock.analysis.captr', { unit: 'weekly'})}>Weekly</Button>
                  <Button variant={unit === 'monthly'?'contained':'outlined'}
                     onClick={() => eventbus.emit('stock.analysis.captr', { unit: 'monthly'})}>Monthly</Button>
                  <Button variant={unit === 'yearly'?'contained':'outlined'}
                     onClick={() => eventbus.emit('stock.analysis.captr', { unit: 'yearly'})}>Yearly</Button>
               </ButtonGroup>
               <ButtonGroup>
                  <Button variant={viewtype === 'histogram'?'contained':'outlined'}
                     onClick={() => eventbus.emit('stock.analysis.captr.viewtype', 'histogram')}>Histogram</Button>
                  <Button variant={viewtype === 'list'?'contained':'outlined'}
                     onClick={() => eventbus.emit('stock.analysis.captr.viewtype', 'list')}>List</Button>
                  <Button variant={viewtype === 'history'?'contained':'outlined'}
                     onClick={() => eventbus.emit('stock.analysis.captr.viewtype', 'history')}>History</Button>
               </ButtonGroup>
            </Box>
         </Box>
         <Divider />
         <Box sx={{ flex: '1 0 auto', width: '100%', height: '0px', overflowY: 'auto' }}>
            <Box>Standard</Box>
            <CaptialTrendGroup data={data.S}/>
            <Divider />
            <Box>Creative</Box>
            <CaptialTrendGroup data={data.K}/>
         </Box>
      </Box>: <NoData>No capital trend data</NoData>)) : null}
   </Drawer>;
}