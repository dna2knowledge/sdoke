import { Box } from '@mui/material';
import NoData from '$/component/shared/no-data';

import { useTranslation } from 'react-i18next';

export default function StockStrategyEditTab (props) {
   const { t } = useTranslation('strategy');

   const { tab, data } = props;

   return <Box sx={{ display: tab === 'suggest' ? 'flex' : 'none', flexDirection: 'column' }}>
      {data.new ? <NoData>
         {t('tip.warn.notsaved', 'Stock strategy has been not saved yet.')}
      </NoData> : <Box>Strategy Suggestion</Box>}
   </Box>;
}