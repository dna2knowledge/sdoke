import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import eventbus from '$/service/eventbus';

function Toast() {
   const [open, setOpen] = useState(false);
   const [duration, setDuration] = useState(3000);
   const [severity, setSeverity] = useState('');
   const [content, setContent] = useState('');
   useEffect(() => {
      eventbus.on('toast', handleToast);
      return () => {
         eventbus.off('toast', handleToast);
      };
      function handleToast(evt) {
         if (!evt.content) return;
         setOpen(true);
         setContent(evt.content);
         if (evt.duration) setDuration(evt.duration);
         if (evt.severity) setSeverity(evt.severity);
      }
   }, []);

   const handleClose = (_, reason) => reason !== 'clickaway' && setOpen(false);
   return (
      <Snackbar open={open} autoHideDuration={duration} onClose={handleClose} anchorOrigin={{ horizontal: 'center', vertical: 'top' }}>
         {severity ? <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
            {content}
         </Alert> : <div>{content}</div>}
      </Snackbar>
   );
}

export default Toast;
