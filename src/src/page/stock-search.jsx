import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import local from '$/service/local';
import StockSearchByFormula from '$/component/stock/stock-search-by-formula';
import StockSearchByFourier from '$/component/stock/stock-search-by-fourier';

import { useTranslation } from 'react-i18next';

export default function StockSearch() {
   const { t } = useTranslation('search');

   const [tab, setTab] = useState(local.data.searchTab || 'formula');
   const onTabChange = (_, val) => {
      local.data.searchTab = val;
      setTab(val);
   };

   return <Box sx={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <Box sx={{ width: '100%', maxWidth: '800px', minWidth: '200px', margin: '0 auto' }}>
         <Tabs value={tab} onChange={onTabChange}>
            <Tab value="formula" label={t('t.formula', "Formula Search")} />
            <Tab value="fourier" label={t('t.fourier', "Fourier Search")} />
         </Tabs>
      </Box>
      {tab === 'formula' ? <StockSearchByFormula /> : null}
      {tab === 'fourier' ? <StockSearchByFourier /> : null}
   </Box>;
}
