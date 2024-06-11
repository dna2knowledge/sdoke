import { useEffect } from 'react';
import { Box } from '@mui/material';
import StockStrategy from '$/component/stock/stock-strategy';
import local from '$/service/local';

export default function Stock() {
   useEffect(() => {
      return () => {
         local.data.selectedStockStrategy = null;
      };
   });

   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <StockStrategy />
   </Box>
}
