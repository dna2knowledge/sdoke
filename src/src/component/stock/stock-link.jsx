import { Box } from '@mui/material';
import eventbus from '$/service/eventbus';

export default function StockLink(props) {
   const { data } = props;
   const onStockTitleClick = () => {
      const holdData = data;
      eventbus.comp.waitUntil('comp.stock.stock-panel').then(() => {
         eventbus.emit('stock.pinned.click', {
            code: holdData.code,
            name: holdData.name,
         });
      });
   };
   return <Box><a href="#/" onClick={onStockTitleClick}>{data.code} {data.name}</a></Box>;
}
