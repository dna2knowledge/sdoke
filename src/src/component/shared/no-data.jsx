import { Box } from '@mui/material';

export default function NoData(props) {
   const { children } = props;
   return <Box sx={{ padding: '20px', textAlign: 'center', border: '2px dashed #ccc', color: '#ccc' }}>{children}</Box>
}
