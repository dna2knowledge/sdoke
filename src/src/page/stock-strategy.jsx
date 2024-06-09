import { Box } from '@mui/material';
import StockStrategy from '$/component/stock/stock-strategy';

export default function Stock() {
   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <StockStrategy />
   </Box>
}
