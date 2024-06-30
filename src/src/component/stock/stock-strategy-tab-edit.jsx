import { useState, useEffect } from 'react';
import { Box, TextField, Grid, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import eventbus from '$/service/eventbus';

function GridTextEditor(props) {
   const {i, t, k, v, kl, vl, kn, vn, data} = props;
   const [key, setKey] = useState(data[k] || '');
   const [val, setVal] = useState(data[v] || '');

   const onRemoveClick = () => {
      eventbus.emit(`stock.strategy.edit.${t}.remove`, { i });
   };

   return <Box sx={{ display: 'flex' }}>
      <IconButton sx={{ width: '40px', height: '40px', marginTop: '12px' }} onClick={onRemoveClick}><CloseIcon /></IconButton>
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
   const { data } = props;
   const [rules, setRules] = useState(data?.rule || []);
   if (data?.rule && data.rule !== rules) setRules(data.rule);

   useEffect(() => {
      eventbus.on('stock.strategy.edit.rule.remove', onEditRemove);
      return () => {
         eventbus.off('stock.strategy.edit.rule.remove', onEditRemove);
      };

      function onEditRemove(evt) {
         if (!data) return;
         rules.splice(evt.i, 1);
         const newlist = [...rules];
         setRules(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'rule', V: newlist });
      }
   }, [data]);

   const onAddClick = () => {
      const newlist = [...rules, { C: '', F: '' }];
      setRules(newlist);
      eventbus.emit('stock.strategy.edit.update', { T: 'rule', V: newlist });
   };

   return <Box sx={{ mt: 1, mb: 1 }}>
      Score Rules
      <Box sx={{ color: '#999', fontSize: '10px' }}>Define rules for buy/sell scoring; 1 is the strongest buying signal, meanwhile -1 is the strongest selling signal</Box>
      {rules.map((z, i) => <GridTextEditor key={i} i={i} t="rule" kl="Condition" vl="Score Formula" kn={6} vn={6} k="C" v="F" data={z} />)}
      <Box><IconButton onClick={onAddClick}><AddIcon /></IconButton></Box>
   </Box>;
}

function StrategyVisualization(props) {
   const { data } = props;
   const [visualizations, setVisualizations] = useState(data?.vis || []);
   if (data?.vis && data.vis !== visualizations) setVisualizations(data.vis);

   useEffect(() => {
      eventbus.on('stock.strategy.edit.vis.remove', onEditRemove);
      return () => {
         eventbus.off('stock.strategy.edit.vis.remove', onEditRemove);
      };

      function onEditRemove(data) {
         if (!data) return;
         visualizations.splice(data.i, 1);
         const newlist = [...visualizations];
         setVisualizations(newlist);
         eventbus.emit('stock.strategy.edit.update', { T: 'vis', V: newlist });
      }
   }, [data]);

   const onAddClick = () => {
      const newlist = [...visualizations, { G: '', V: '' }];
      setVisualizations(newlist);
      eventbus.emit('stock.strategy.edit.update', { T: 'vis', V: newlist });
   };

   return <Box sx={{ mt: 1, mb: 1 }}>
      Visualization
      <Box sx={{ color: '#999', fontSize: '10px' }}>Define groups for visualization</Box>
      {visualizations.map((z, i) => <GridTextEditor key={i} t="vis" i={i} kl="Group" vl="Variables" kn={4} vn={8} k="G" v="V" data={z} />)}
      <Box><IconButton onClick={onAddClick}><AddIcon /></IconButton></Box>
   </Box>;
}

export default function StockStrategyEditTab (props) {
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
      const newdesc = 'RSI (<30 => buy, >70 => sell)';
      setName(newname);
      setDesc(newdesc);
      setData({
         dirty: true,
         new: !!data?.new,
         name: newname,
         desc: newdesc,
         rule: [{ C: '.C.rsi15() <= 30', F: '1' }, { C: '.C.rsi15() >= 70', F: '-1' }, { C: '', F: '1 - 2 * (.C.rsi15() - 30) / (70 - 30)' }],
         vis: [{ G: 'rsi', V: '.C.rsi15.atrange(index(-250, 0))' }],
      });
   };
   const onDeleteClick = () => {
      if (!data) return;
      if (data.new) {
         if (!confirm(`Are you sure to discard the new stock strategy ${data.name ? `"${data.name}"` : ''}`)) return;
      } else if (!confirm(`Are you sure to delete the stock strategy "${data.name}"?`)) return;
      eventbus.emit("stock.strategy.del", data);
   }

   return <Box sx={{ display: tab === 'edit' ? 'block' : 'none', overflowY: 'auto', height: '0px', flex: '1 0 auto' }}>
      <Box>
         <Button variant="contained" color="success" onClick={onSaveClick}>Save</Button>
         <Button onClick={onCancelClick}>Cancel/Reset</Button>
         <Button onClick={onFillExampleClick}>Fill Example</Button>
         <Button onClick={onDeleteClick} color="error">Delete</Button>
      </Box>
      <Box>
         Basic Info
         <TextField fullWidth label="Strategy Name" variant="standard" value={name} onChange={onNameChange} />
         <TextField fullWidth label="Strategy Description" variant="standard" value={desc} onChange={onDescChange} />
      </Box>
      <StrategyScoreRule data={data} />
      <StrategyVisualization data={data} />
   </Box>;
}