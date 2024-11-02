import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import eventbus from '$/service/eventbus';

function Loading () {
   const [show, setShow] = useState(false);
   const [text, setText] = useState('');
   useEffect(() => {
      eventbus.on('loading', handleLoading);
      eventbus.on('loaded', handleLoaded);
      return () => {
         eventbus.off('loading', handleLoading);
         eventbus.off('loaded', handleLoaded);
      };
      function handleLoading(newText) {
         setText(newText || '');
         setShow(true);
      }
      function handleLoaded() {
         setShow(false);
      }
   }, []);

   if (!show) return null;
   return (<Box>
      <Box sx={{
         zIndex: '1000',
         position: 'fixed',
         width: '100vw',
         height: '100vh',
         opacity: '0.5',
         backgroundColor: 'white',
         userSelect: 'none',
         top: '0',
         left: '0',
      }}>&nbsp;</Box>
      <Box sx={{
         zIndex: '1001',
         display: 'flex',
         flexDirection: 'column',
         position: 'fixed',
         width: '100vw',
         height: '100vh',
         placeItems: 'center',
         placeContent: 'center',
         userSelect: 'none',
         top: '0',
         left: '0',
      }}>
         <CircularProgress />
         {text ? <Box>{text}</Box> : null}
      </Box>
   </Box>);
}

export default Loading;
