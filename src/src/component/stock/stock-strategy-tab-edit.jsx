import { Box } from '@mui/material';

export default function StockStrategyEditTab (props) {
   const { tab } = props;
   return <Box sx={{ display: tab === 'edit' ? 'flex' : 'none' }}>Strategy Overview/Edit</Box>;
}