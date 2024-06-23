import { Box } from '@mui/material';

export default function About(props) {
   return <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      textAlign: 'center',
      height: '100%',
      alignItems: 'center',
   }}>
      <table>
         <tr><td><strong>Name</strong></td><td>Sdoke</td></tr>
         <tr><td><strong>Author</strong></td><td>Seven Liu and its contributors</td></tr>
      </table>
   </Box>;
}
