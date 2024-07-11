import { Box } from '@mui/material';
import StockLink from '$/component/stock/stock-link';

export default function StockSearchResultItemByFourier(props) {
   const { data } = props;
   if (!data) return null;
   if (!data.cycle) return null;
   return <Box>
      <Box>
         <StockLink data={data.meta} />
         {data.cycle.c.vis.phi} / {
            data.cycle.c.vis.watch ?
            <strong>{data.cycle.c.vis.nextHalfPhi}</strong> :
            <span>{data.cycle.c.vis.nextHalfPhi}</span>
         } / {data.cycle.c.vis.nextPhi} / d={data.cycle.c.w} err={data.cycle.c.err.toFixed(4)}</Box>
   </Box>;
}