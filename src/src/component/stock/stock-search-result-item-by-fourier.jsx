import { Box, TableCell, TableRow } from '@mui/material';
import StockLink from '$/component/stock/stock-link';

export default function StockSearchResultItemByFourier(props) {
   const { data, t } = props;
   if (!data) return null;
   if (!data.cycle) return null;
   return <TableRow>
      <TableCell><StockLink data={data.meta} /></TableCell>
      <TableCell><Box className="period">
         <Box>{data.cycle.c.w}</Box>
         <Box className="split">/</Box>
         <Box>{data.cycle.c.err.toFixed(2)}</Box>
      </Box></TableCell>
      <TableCell>{data.cycle.c.vis.phi}</TableCell>
      <TableCell>{ data.cycle.c.vis.watch ?
         <strong>{data.cycle.c.vis.nextHalfPhi}</strong> :
         <span>{data.cycle.c.vis.nextHalfPhi}</span> }</TableCell>
      <TableCell>{data.cycle.c.vis.nextPhi}</TableCell>
   </TableRow>;
}