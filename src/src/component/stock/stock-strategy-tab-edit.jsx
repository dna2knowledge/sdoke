import { useState, useEffect } from 'react';
import { Box, TextField, Grid, Button, IconButton, Divider, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CircleIcon from '@mui/icons-material/Circle';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import eventbus from '$/service/eventbus';
import selectColor from '$/util/color-select';
import pickHSLColor from '$/util/color-hsl-pick';
import downloadAsFile from '$/util/file-download';
import { triggerFileSelect, readText } from '$/util/file-reader';

import { useTranslation } from 'react-i18next';

function GridTextEditor(props) {
   const {i, t, k, v, kl, vl, kn, vn, data} = props;
   const [key, setKey] = useState(data[k] || '');
   const [val, setVal] = useState(data[v] || '');
   if (key !== data[k]) setKey(data[k]);
   if (val !== data[v]) setVal(data[v]);

   const onRemoveClick = () => eventbus.emit(`stock.strategy.edit.${t}.remove`, { i });
   const onUpwardClick = () => eventbus.emit(`stock.strategy.edit.${t}.up`, { i, j: i-1 });
   const onDownwardClick = () => eventbus.emit(`stock.strategy.edit.${t}.down`, { i, j: i+1 });
   const onChangeColor = async (evt) => {
      // data['c'] is reserved for coloring
      const color = await selectColor(evt.target, data?.c || null);
      if (color) {
         data.c = color;
      } else {
         delete data.c;
      }
      eventbus.emit(`stock.strategy.edit.vis.color`, { i });
   };

   return <Box sx={{ display: 'flex', '.item-btn': { width: '40px', height: '40px', marginTop: '12px' } }}>
      <IconButton className="item-btn" onClick={onDownwardClick}><ArrowDownwardIcon /></IconButton>
      <IconButton className="item-btn" onClick={onUpwardClick}><ArrowUpwardIcon /></IconButton>
      <IconButton className="item-btn" onClick={onRemoveClick}><CloseIcon /></IconButton>
      {t === 'vis' ? <IconButton className="item-btn" sx={{ color: data?.c || pickHSLColor(i) }} onClick={onChangeColor}><CircleIcon /></IconButton> : null}
      <Grid sx={{ flex: '1 0 auto', width: '0px' }} container spacing={2}>
      <Grid item xs={kn}><TextField fullWidth label={kl} variant="standard" value={key} onChange={(evt) => {
         const x = evt.target.value;
         data[k] = x;
         setKey(x);
      }} /></Grid>
      <Grid item xs={vn}><TextField fullWidth label={vl} variant="standard" value={val} onChange={(evt) => {
         const x = evt.target.value;
         data[v] = x;
         setVal(x);
      }} /></Grid>
      </Grid>
   </Box>;
}

function StrategyScoreRule(props) {
   const { t } = useTranslation('strategy');

   const { data } = props;
   const [rules, setRules] = useState(data?.rule || []);
   if (data?.rule && data.rule !== rules) setRules(data.rule);

   useEffect(() => {
      eventbus.on('stock.strategy.edit.rule.remove', onEditRemove);
      eventbus.on('stock.strategy.edit.rule.up', onEditUpward);
      eventbus.on('stock.strategy.edit.rule.down', onEditDownward);
      return () => {
         eventbus.off('stock.strategy.edit.rule.remove', onEditRemove);
         eventbus.off('stock.strategy.edit.rule.up', onEditUpward);
         eventbus.off('stock.strategy.edit.rule.down', onEditDownward);
      };

      function onEditRemove(evt) {
         if (!data) return;
         rules.splice(evt.i, 1);
         const newlist = [...rules];
         setRules(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'rule', V: newlist });
      }
      function onEditUpward(evt) {
         if (!data) return;
         if (evt.i <= 0) return;
         const t = rules[evt.i];
         rules[evt.i] = rules[evt.j];
         rules[evt.j] = t;
         const newlist = [...rules];
         setRules(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'rule', V: newlist });
      }
      function onEditDownward(evt) {
         if (!data) return;
         if (evt.i >= rules.length) return;
         const t = rules[evt.i];
         rules[evt.i] = rules[evt.j];
         rules[evt.j] = t;
         const newlist = [...rules];
         setRules(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'rule', V: newlist });
      }
   }, [data, rules]);

   const onAddClick = () => {
      const newlist = [...rules, { C: '', F: '' }];
      setRules(newlist);
      eventbus.emit('stock.strategy.edit.update', { T: 'rule', V: newlist });
   };

   return <Box sx={{ mt: 1, mb: 1 }}>
      {t('t.scorerule', 'Score Rules')}
      <Box sx={{ color: '#999', fontSize: '10px' }}>
         {t('t.desc.scorerule', 'Define rules for buy/sell scoring; 1 is the strongest buying signal, meanwhile -1 is the strongest selling signal')}
      </Box>
      {rules.map((z, i) => <GridTextEditor
         key={i} i={i} t="rule"
         kl={t('t.scorerule.condition', "Condition")}
         vl={t('t.scorerule.scoreformula', "Score Formula")}
         kn={6} vn={6} k="C" v="F" data={z} />)}
      <Box><Tooltip title={t('t.add.scorerule', 'Add Score Rule')}>
         <IconButton onClick={onAddClick}><AddIcon /></IconButton>
      </Tooltip></Box>
   </Box>;
}

function StrategyVisualization(props) {
   const { t } = useTranslation('strategy');

   const { data } = props;
   const [visualizations, setVisualizations] = useState(data?.vis || []);
   if (data?.vis && data.vis !== visualizations) setVisualizations(data.vis);

   useEffect(() => {
      eventbus.on('stock.strategy.edit.vis.remove', onEditRemove);
      eventbus.on('stock.strategy.edit.vis.up', onEditUpward);
      eventbus.on('stock.strategy.edit.vis.down', onEditDownward);
      eventbus.on('stock.strategy.edit.vis.color', onEditColor);
      return () => {
         eventbus.off('stock.strategy.edit.vis.remove', onEditRemove);
         eventbus.off('stock.strategy.edit.vis.up', onEditUpward);
         eventbus.off('stock.strategy.edit.vis.down', onEditDownward);
         eventbus.off('stock.strategy.edit.vis.color', onEditColor);
      };

      function onEditRemove(data) {
         if (!data) return;
         visualizations.splice(data.i, 1);
         const newlist = [...visualizations];
         setVisualizations(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'vis', V: newlist });
      }
      function onEditUpward(evt) {
         if (!data) return;
         if (evt.i <= 0) return;
         const t = visualizations[evt.i];
         visualizations[evt.i] = visualizations[evt.j];
         visualizations[evt.j] = t;
         const newlist = [...visualizations];
         setVisualizations(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'vis', V: newlist });
      }
      function onEditDownward(evt) {
         if (!data) return;
         if (evt.i >= visualizations.length) return;
         const t = visualizations[evt.i];
         visualizations[evt.i] = visualizations[evt.j];
         visualizations[evt.j] = t;
         const newlist = [...visualizations];
         setVisualizations(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'vis', V: newlist });
      }
      function onEditColor(evt) {
         if (!data) return;
         const newlist = [...visualizations];
         setVisualizations(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'vis', V: newlist });
      }
   }, [data, visualizations]);

   const onAddClick = () => {
      const newlist = [...visualizations, { G: '', F: '' }];
      setVisualizations(newlist);
      eventbus.emit('stock.strategy.edit.update', { T: 'vis', V: newlist });
   };

   return <Box sx={{ mt: 1, mb: 1 }}>
      {t('t.vis', 'Visualization')}
      <Box sx={{ color: '#999', fontSize: '10px' }}>
         {t('t.desc.vis', 'Define groups for visualization within latest data of 250 days')}
      </Box>
      {visualizations.map((z, i) => <GridTextEditor
         key={i} t="vis" i={i}
         kl={t('t.vis.group', "Group")}
         vl={t('t.vis.visformula', "Visualization Formula")}
         kn={4} vn={8} k="G" v="F" data={z} />)}
      <Box><Tooltip title={t('t.add.vis', 'Add Visualization')}>
         <IconButton onClick={onAddClick}><AddIcon /></IconButton>
      </Tooltip></Box>
   </Box>;
}

export default function StockStrategyEditTab (props) {
   const { t } = useTranslation('strategy');

   const { tab } = props;
   const [data, setData] = useState({...props.data});
   const [name, setName] = useState(data?.name || '');
   const [desc, setDesc] = useState(data?.desc || '');

   useEffect(() => {
      eventbus.on('stock.strategy.edit.open', onEditOpen);
      eventbus.on('stock.strategy.edit.update', onEditUpdate);
      return () => {
         eventbus.off('stock.strategy.edit.open', onEditOpen);
         eventbus.off('stock.strategy.edit.update', onEditUpdate);
      };

      function onEditOpen(item) {
         if (!item) return;
         setName(item?.name || '');
         setDesc(item?.desc || '');
         setData({...item});
      }
      function onEditUpdate(newdata) {
         if (!newdata || !data) return;
         if (newdata.V && newdata.X) {
            newdata.V = newdata.V.filter((_, i) => i === newdata.X);
         }
         switch (newdata.T) {
            case 'rule': data.rule = newdata.V; break;
            case 'vis': data.vis = newdata.V; break;
         }
         setData({...data});
      }
   }, [data]);

   const onNameChange = (evt) => {
      if (!data) return;
      data.name = evt.target.value;
      setName(evt.target.value);
   };
   const onDescChange = (evt) => {
      if (!data) return;
      data.desc = evt.target.value;
      setDesc(evt.target.value);
   };
   const onSaveClick = () => {
      eventbus.emit('stock.strategy.save', data);
   };
   const onCancelClick = () => {
      setName(props.data?.name || '');
      setDesc(props.data?.desc || '');
      setData({...props.data});
   };
   const onFillExampleClick = () => {
      const newname = 'RSI15-3/7';
      const newdesc = t('t.example.desc.rsibase', 'RSI (<30 => buy, >70 => sell)');
      setName(newname);
      setDesc(newdesc);
      setData({
         dirty: true,
         new: !!data?.new,
         name: newname,
         desc: newdesc,
         rule: [
            { C: '.C.rsi15() < 30', F: '1' },
            { C: '.C.rsi15() > 70', F: '-1' },
            { C: '', F: '1 - 2 * (.C.rsi15() - 30) / (70 - 30)' },
         ],
         vis: [
            { G: 'rsi.70', F: '70' },
            { G: 'rsi.rsi15', F: '.C.rsi15.atrange(index(-250, 0))' },
            { G: 'rsi.30', F: '30' },
         ],
      });
   };
   const onDeleteClick = () => {
      if (!data) return;
      if (data.new) {
         if (!confirm(`${t('tip.warn.discard.new', 'Are you sure to discard the new stock strategy')} ${data.name ? `"${data.name}"` : ''}?`)) return;
      } else if (!confirm(`${t('tip.warn.delete', 'Are you sure to delete the stock strategy')} "${data.name}"?`)) return;
      eventbus.emit("stock.strategy.del", data);
   };
   const onDownloadClick = () => {
      const obj = {};
      obj.type = 'strategy';
      obj.name = data.name;
      obj.desc = data.desc;
      obj.rule = data.rule;
      obj.vis = data.vis;
      downloadAsFile(
         t('t.strategy.download.filename', 'strategy.sdoke'),
         JSON.stringify(obj)
      );
   };
   const onUploadClick = async () => {
      const file = (await triggerFileSelect() || [])[0];
      if (!file) return;
      try {
         const obj = JSON.parse(await readText(file));
         if (!obj || obj.type !== 'strategy') throw 'invalid';
         setName(obj.name);
         setDesc(obj.desc);
         setData(obj);
      } catch(_) {
         eventbus.emit('toast', {
            severity: 'error',
            content: t('tip.strategy.upload.fail', 'Failed to upload strategy data, please check file format.')
         });
      }
   };

   return <Box sx={{ display: tab === 'edit' ? 'block' : 'none', overflowY: 'auto', height: '0px', flex: '1 0 auto' }}>
      <Box sx={{ mt: 1 }}>
         <Button variant="contained" color="success" onClick={onSaveClick}>{t('t.save', 'Save')}</Button>
         <Tooltip title={t('t.strategy.download', 'Strategy Download')}>
            <IconButton onClick={onDownloadClick}><DownloadIcon /></IconButton>
         </Tooltip>
         <Tooltip title={t('t.strategy.upload', 'Strategy Upload')}>
            <IconButton onClick={onUploadClick}><UploadIcon /></IconButton>
         </Tooltip>
         <Button onClick={onCancelClick}>{t('t.cancel', 'Cancel/Reset')}</Button>
         <Button onClick={onFillExampleClick}>{t('t.fillexample', 'Fill Example')}</Button>
         <Button onClick={onDeleteClick} color="error">{t('t.delete', 'Delete')}</Button>
      </Box>
      <Divider sx={{ mt: 1, mb: 1 }} />
      <Box>
         {t('t.basic', 'Basic Info')}
         <TextField fullWidth label={t('t.basic.name', "Strategy Name")} variant="standard" value={name} onChange={onNameChange} />
         <TextField fullWidth label={t('t.basic.desc', "Strategy Description")} variant="standard" value={desc} onChange={onDescChange} />
      </Box>
      <Divider sx={{ mt: 1, mb: 1 }} />
      <StrategyScoreRule data={data} />
      <Divider sx={{ mt: 1, mb: 1 }} />
      <StrategyVisualization data={data} />
   </Box>;
}