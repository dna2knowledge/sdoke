import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import local from '$/service/local';
import StockTrade from '$/component/stock/stock-trade';

import { useTranslation } from 'react-i18next';
import StockTradeWatch from '../component/stock/stock-trade-watch';

export default function StockTradePage() {
   const { t } = useTranslation('trade');

   const [tab, setTab] = useState(local.data.tradeTab || 'trade');
   const onTabChange = (_, val) => {
      local.data.tradeTab = val;
      setTab(val);
   };

   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ width: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto' }}>
         <Tabs value={tab} onChange={onTabChange}>
            <Tab value="trade" label={t('t.trade', "Trade")} />
            <Tab value="watch" label={t('t.watch', "Watch")} />
         </Tabs>
      </Box>
      <Box sx={{ height: '0px', overflowY: 'hidden', flex: '1 0 auto', mb: 1 }}>
         {tab === 'trade' ? <StockTrade /> : null}
         {tab === 'watch' ? <StockTradeWatch /> : null}
      </Box>
   </Box>
}
