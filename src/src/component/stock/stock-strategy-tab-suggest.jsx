import { Box } from '@mui/material';
import NoData from '$/component/shared/no-data';

export default function StockStrategyEditTab (props) {
   const { tab, data } = props;

   return <Box sx={{ display: tab === 'suggest' ? 'flex' : 'none' }}>
      {data.new ? <NoData>Stock strategy has been not saved yet.</NoData> : <Box>Strategy Suggestion</Box>}
   </Box>;
}