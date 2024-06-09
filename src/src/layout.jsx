import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Box, IconButton, Link, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const titleMap = {
   '/': 'Sdoke',
   '/about': 'About',
};

export default function Layout() {
   const loc = useLocation();
   const title = titleMap[loc.pathname] || 'Sdoke';

   const [anchorEl, setAnchorEl] = useState(null);
   const open = !!anchorEl;

   const onMenuOpen = (evt) => setAnchorEl(evt.currentTarget);
   const onMenuClose = () => setAnchorEl(null);

   return <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
   }}>
      <Box>
         <IconButton onClick={onMenuOpen}><MenuIcon /></IconButton> {title}
         <Menu anchorEl={anchorEl} open={open} onClose={onMenuClose}>
            <Link onClick={onMenuClose} href="#/" underline="none"><MenuItem>Stock Panel</MenuItem></Link>
            <Link onClick={onMenuClose} href="#/index" underline="none"><MenuItem>Index Panel</MenuItem></Link>
            <Link onClick={onMenuClose} href="#/about" underline="none"><MenuItem>About</MenuItem></Link>
         </Menu>
      </Box>
      <Box sx={{ flex: '1 0 auto', height: '0' }}><Outlet /></Box>
   </Box>
}
