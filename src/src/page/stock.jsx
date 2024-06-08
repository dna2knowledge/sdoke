import { Box } from '@mui/material';
import StockPanel from '$/component/stock/stock-panel';

export default function Stock() {
   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <StockPanel />
   </Box>
}
