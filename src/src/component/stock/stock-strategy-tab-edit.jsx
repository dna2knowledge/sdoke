import { useState } from 'react';
import { Box, TextField, Grid, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function StrategyVariable(props) {
   const { data } = props;
   const [variables, setVariables] = useState(data || []);
   return <Box sx={{ mt: 1, mb: 1 }}>
      Variables
      <Box sx={{ color: '#999', fontSize: '10px' }}>Define variables for using in score rules</Box>
      {variables.map(z => <Grid container spacing={2}>
         <Grid item xs={4}><TextField fullWidth label="Name" variant="standard" /></Grid>
         <Grid item xs={8}><TextField fullWidth label="Formula" variant="standard" /></Grid>
      </Grid>)}
      <Box><IconButton><AddIcon /></IconButton></Box>
   </Box>;
}

function StrategyScoreRule(props) {
   const { data } = props;
   const [rules, setRules] = useState(data || []);
   return <Box sx={{ mt: 1, mb: 1 }}>
      Score Rules
      <Box sx={{ color: '#999', fontSize: '10px' }}>Define rules for buy/sell scoring; 1 is the strongest buying signal, meanwhile -1 is the strongest selling signal</Box>
      {rules.map(z => <Grid container spacing={2}>
         <Grid item xs={6}><TextField fullWidth label="Condition" variant="standard" /></Grid>
         <Grid item xs={6}><TextField fullWidth label="Score Formula" variant="standard" /></Grid>
      </Grid>)}
      <Box><IconButton><AddIcon /></IconButton></Box>
   </Box>;
}

function StrategyVisualization(props) {
   const { data } = props;
   const [visualizations, setVisualizations] = useState(data || []);
   return <Box sx={{ mt: 1, mb: 1 }}>
      Visualization
      <Box sx={{ color: '#999', fontSize: '10px' }}>Define groups for visualization</Box>
      {visualizations.map(z => <Grid container spacing={2}>
         <Grid item xs={4}><TextField fullWidth label="Name" variant="standard" /></Grid>
         <Grid item xs={8}><TextField fullWidth label="Formula" variant="standard" /></Grid>
      </Grid>)}
      <Box><IconButton><AddIcon /></IconButton></Box>
   </Box>;
}

export default function StockStrategyEditTab (props) {
   const { tab, data } = props;
   const [name, setName] = useState(data?.name || '');
   const [desc, setDesc] = useState(data?.desc || '');

   return <Box sx={{ display: tab === 'edit' ? 'block' : 'none', overflowY: 'auto', height: '0px', flex: '1 0 auto' }}>
      <Box>
         <Button>Save</Button>
         <Button>Cancel/Reset</Button>
         <Button>Fill Example</Button>
      </Box>
      <Box>
         Basic Info
         <TextField fullWidth label="Strategy Name" variant="standard" />
         <TextField fullWidth label="Strategy Description" variant="standard" />
      </Box>
      <StrategyVariable data={data?.var} />
      <StrategyScoreRule data={data?.rule} />
      <StrategyVisualization data={data?.vis} />
   </Box>;
}