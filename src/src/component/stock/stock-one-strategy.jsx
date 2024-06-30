import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Select, MenuItem, Tooltip } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import SwitchAccessShortcutIcon from '@mui/icons-material/SwitchAccessShortcut';
import NoData from '$/component/shared/no-data';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import { rsiEvaluateStrategy } from '$/analysis/strategy/rsibase';
import local from '$/service/local';

import { useTranslation } from 'react-i18next';

function StrategyStat(props) {
   const { t } = useTranslation('viewer');

   const { name, stat } = props;
   let rateK = 'num_blue', gainMinK = 'num_red', gainHiK = 'num_red', gainMaxK = 'num_red', lossK = 'num_green';
   const days = [
      <span key={"gainMinK"} className={gainMinK}> {Math.round(stat.gain.min_wait*100)/100} </span>,
      <span key={"gainHiK"} className={gainHiK}> {Math.round(stat.gain.hi_wait*100)/100} </span>,
      <span key={"gainMaxK"} className={gainMaxK}> {Math.round(stat.gain.max_wait*100)/100} </span>,
      <span key={"lossK"} className={lossK}> {Math.round(stat.loss.best_wait*100)/100} </span>,
   ];
   const lossD = days.pop();
   if (stat.loss.best_wait <= stat.gain.min_wait) days.unshift(lossD);
   else if (stat.loss.best_wait < stat.gain.hi_wait) days.splice(1, 0, lossD);
   else if (stat.loss.best_wait < stat.gain.max_wait) days.splice(2, 0, lossD);
   else if (stat.loss.best_wait >= stat.gain.max_wait) days.push(lossD);
   return <Box sx={{
      flex: '1 0 auto',
      '.num_blue': { color: '#09d', fontWeight: 'bold' },
      '.num_green': { color: 'green', fontWeight: 'bold' },
      '.num_red': { color: 'red', fontWeight: 'bold' },
   }}>
      <div>{name}</div>
      <div>{t('t.capture', 'capture')} = <strong>{stat.hit}</strong> / {stat.count}, {t('t.rate', 'rate')} =
         <span className={rateK}> {Math.round(stat.rate*10000)/100}%</span>
      </div>
      <div>{t('t.gain.min.max', 'gain min / max')} -
         <span className={gainMinK}> {Math.round(stat.gain.min_avg*10000)/100}% </span>
         <span className={gainMaxK}> {Math.round(stat.gain.max_avg*10000)/100}% </span>
      </div>
      <div>{t('t.loss.min', 'loss min')} -
         <span className={lossK}> {Math.round(stat.loss.avg*10000)/100}% </span>
      </div>
      <div>{t('t.op.window', 'op window')} - {days}</div>
   </Box>;
}

export default function StockOneStrategy() {
   const { t } = useTranslation('viewer');

   const [meta, setMeta] = useState(null);
   const [strategy, setStrategy] = useState(local.data?.view?.selectedStrategy || 'strategy-example.rsibase');
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState(null);
   const oneKey = useRef(null);

   const updateData = async (meta, strategy) => {
      const key = `stock.${strategy}.one.${meta.code}.${Math.random()}`;
      oneKey.current = key;
      let ret;
      setLoading(true);
      try {
         /* ret = {
            kb: {k,b}, kps: [], score,
            stat: {
               all: {count,hit,rate,gain:{min_wait,max_wait,hi_wait,min_avg,max_avg},loss:{avg, best_wait}},
               y3: {count,hit,rate,gain:{min_wait,max_wait,hi_wait,min_avg,max_avg},loss:{avg, best_wait}},
               d250: [{kb,kps,score}, ...]
            }
         } */
         const history = await databox.stock.getStockHistory(meta.code);
         if (strategy === 'strategy-example.rsibase') {
            ret = await rsiEvaluateStrategy({ meta, raw: history });
         } else {
            // TODO calc with customized strategy
         }
      } catch(err) { }
      setLoading(false);
      if (oneKey.current !== key) return false;
      if (!ret) {
         eventbus.emit('toast', {
            content: t('strategy.warn.internal.error', 'No data; due to an internal server error.'),
            severity: 'error'
         });
         return;
      }

      ret.meta = meta;
      local.data.view.strategy = ret;
      eventbus.comp.waitUntil('stock.chart').then(() => {
         eventbus.emit('stock.chart.strategy');
      });

      setData(ret);
      return true;
   };

   useEffect(() => {
      eventbus.on('stock.strategy.one', handleStockOne);
      return () => {
         eventbus.off('stock.strategy.one', handleStockOne);
      };
      function handleStockOne(data) {
         if (!data) return;
         setMeta(data.meta);
         if (!local.data.view) local.data.view = {};
         data.strategy = data.strategy || local.data.view.selectedStrategy || strategy || 'strategy-example.rsibase';
         local.data.view.selectedStrategy = data.strategy;
         setStrategy(data.strategy);
         if (data.meta) updateData(data.meta, data.strategy);
      }
   }, []);

   const onUpdateClick = () => {
      if (!strategy) return;
      updateData(meta, strategy);
   };
   const onSwitchStrategyClick = (evt) => {
      eventbus.emit('stock.strategy.one', { meta, strategy: evt.target.value });
   }

   if (!meta) return null;
   if (loading) return <NoData>{t(
      'tip.strategy.loading',
      'Loading {{strategy}} data for {{code}} {{name}} ...',
      { strategy, code: meta.code, name: meta.name }
   )}</NoData>;
   if (!data || !data.stat) return <NoData>{t(
      'tip.strategy.nodata',
      'No Data; no {{strategy}} records for {{code}} {{name}}',
      { strategy, code: meta.code, name: meta.name }
   )}</NoData>
   const mode = data.score > 0 ? 'buy' : (data.score < 0 ? 'sell' : 'unknown');
   return <Box sx={{
      textAlign: 'center',
      '.mode_sell': { textTransform: 'uppercase', color: 'green', backgroundColor: '#cfc' },
      '.mode_buy': { textTransform: 'uppercase', color: 'red', backgroundColor: '#fcc' },
      '.act': { display: 'inline-block', margin: '0 5px' },
      '.h_act': { fontWeight: 'bold' },
      '.strategy': { textTransform: 'capitalize', fontWeight: 'bold' },
   }}>
      <Box sx={{ textAlign: 'left' }}>
         <Tooltip title={t('t.refresh', 'Refresh')}><IconButton onClick={onUpdateClick}><UpdateIcon /></IconButton></Tooltip>
         <span><Select sx={{ lineHeight: '0.4375em', '.MuiSelect-select.MuiInputBase-input': { minHeight: 0 } }}
            value={strategy} onChange={onSwitchStrategyClick}>
            <MenuItem value={'strategy-example.rsibase'}>{t('t.strategy.example.rsibase', 'Strategy Example (RSI)')}</MenuItem>
         </Select></span>
         <Tooltip title={t('t.goto.edit.strategy', 'Go to strategy editing')}><IconButton type="button" sx={{ p: '10px' }}><SwitchAccessShortcutIcon/></IconButton></Tooltip>
      </Box>
      <Box>
         <span className={`mode_${mode}`}> {t(`t.${mode}`, mode)}</span>
         <span className={"act"}> {t('t.score', 'score')}={isNaN(data.score) ? '-' : `${data.score.toFixed(4)}`}</span>
      </Box>
      <Box sx={{ display: 'flex' }}>
         <StrategyStat name={t('t.all', "ALL")} stat={data.stat.all} />
         <StrategyStat name={t('t.3years', "3 YEARS")} stat={data.stat.y3} />
      </Box>
      <Box>{t('t.history', 'History')}: {data?.stat?.d250.slice(0, 20).map((z, i) => <span key={i}>
         <span className={`act mode_${z.score > 0 ? 'buy' : (z.score < 0 ? 'sell' : '-')} ${z.score > 0.5 || z.score < -0.5 ? 'h_act' : ''}`}>
            {z.score > 0 ? t('t.buy.s', 'B') : (z.score < 0 ? t('t.sell.s', 'S') : t('t.unknown.s', '-'))}
         </span>
      </span>)}</Box>
   </Box>;
}