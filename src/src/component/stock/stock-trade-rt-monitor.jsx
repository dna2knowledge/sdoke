import { useEffect, useState } from "react";
import { Box, Drawer } from "@mui/material";
import eventbus from '$/service/eventbus';
import local from '$/service/local';

export default function StockTradeRtMonitor() {
   const [open, setOpen] = useState(false);
   const close = () => setOpen(false);

   useEffect(() => {
      eventbus.on('stock.trade.mointor.edit', openRtMonitorEditor);
      return () => {
         eventbus.off('stock.trade.mointor.edit', openRtMonitorEditor);
      };

      function openRtMonitorEditor() {
         setOpen(true);
      }
   });

   return <Drawer anchor="bottom" open={open} onClose={close}>
      <Box sx={{ minHeight: '300px', textAlign: 'center' }}>(-------^v----^v------)</Box>
   </Drawer>;
}