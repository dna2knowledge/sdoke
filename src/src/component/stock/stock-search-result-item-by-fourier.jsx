import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import NoData from '$/component/shared/no-data';
import StockLink from '$/component/stock/stock-link';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';

export default function StockSearchResultItemByFourier(props) {
   const { data } = props;
   if (!data) return null;
   return <Box>
      <Box>
         <StockLink data={data.meta} />
         {data.cycle.c.vis.phi} / {
            data.cycle.c.vis.watch ?
            <strong>{data.cycle.c.vis.nextHalfPhi}</strong> :
            <span>{data.cycle.c.vis.nextHalfPhi}</span>
         } / {data.cycle.c.vis.nextPhi} / d={data.cycle.c.w}</Box>
   </Box>;
}