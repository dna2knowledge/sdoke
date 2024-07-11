import { Box } from '@mui/material';
import StockSearchByFormula from '$/component/stock/stock-search-by-formula';

export default function StockSearch() {
   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <StockSearchByFormula />
   </Box>;
}
