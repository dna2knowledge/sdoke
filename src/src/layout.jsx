import { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Box, IconButton, Link, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { useTranslation } from 'react-i18next';

const i18nKeyMap = {
   '/': 't.stock.viewer',
   '/strategy': 't.stock.strategy',
   '/search': 't.stock.search',
   '/trade': 't.stock.trade',
   '/about': 't.about',
};
const titleMap = {
   '/': 'Stock Viewer',
   '/strategy': 'Stock Strategy',
   '/search': 'Stock Search',
   '/trade': 'Stock Trade',
   '/about': 'About',
};

export default function Layout() {
   const { t } = useTranslation();

   const loc = useLocation();
   const title = t(i18nKeyMap[loc.pathname], titleMap[loc.pathname]) || 'Sdoke';

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
            <Link onClick={onMenuClose} href="#/" underline="none"><MenuItem>{t('t.stock.viewer', 'Stock Viewer')}</MenuItem></Link>
            <Link onClick={onMenuClose} href="#/strategy" underline="none"><MenuItem>{t('t.stock.strategy', 'Stock Strategy')}</MenuItem></Link>
            <Link onClick={onMenuClose} href="#/search" underline="none"><MenuItem>{t('t.stock.search', 'Stock Search')}</MenuItem></Link>
            <Link onClick={onMenuClose} href="#/trade" underline="none"><MenuItem>{t('t.stock.trade', 'Stock Trade')}</MenuItem></Link>
            <Link onClick={onMenuClose} href="#/about" underline="none"><MenuItem>{t('t.about', 'About')}</MenuItem></Link>
         </Menu>
      </Box>
      <Box sx={{ flex: '1 0 auto', height: '0' }}><Outlet /></Box>
   </Box>
}
