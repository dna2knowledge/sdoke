import { Box } from '@mui/material';
import StockTrade from '$/component/stock/stock-trade';

export default function Stock() {
   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <StockTrade />
   </Box>
}
