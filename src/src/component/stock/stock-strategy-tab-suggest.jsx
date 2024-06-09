import { Box } from '@mui/material';

export default function StockStrategyEditTab (props) {
   const { tab } = props;
   return <Box sx={{ display: tab === 'suggest' ? 'flex' : 'none' }}>Strategy Suggestion</Box>;
}