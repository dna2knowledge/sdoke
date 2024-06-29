import { useState } from 'react';
import { Box, Select, MenuItem } from '@mui/material';
import local from '$/service/local';

import { useTranslation } from 'react-i18next';

export default function About() {
   const { t, i18n } = useTranslation('about');

   const [lang, setLang] = useState(i18n.language);

   const onChnageLanguage = (evt) => {
      const newL = evt.target.value;
      if (i18n.language === newL) return;
      local.save('sdokelang', { lang: newL });
      i18n.changeLanguage(newL, () => {
         setLang(evt.target.value);
      });
   };

   return <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      textAlign: 'center',
      height: '100%',
      alignItems: 'center',
      '.table': {
         maxWidth: '500px',
      },
      '.keycell': {
         width: '100px',
      },
      '.valcell': {
         textAlign: 'left',
         marginLeft: '5px',
      },
   }}>
      <table className="table"><tbody>
         <tr>
            <td className="keycell"><strong>{t('t.name', 'Name')}</strong></td>
            <td className="valcell">{t('t.nameval', 'Sdoke')}</td>
         </tr><tr>
            <td className="keycell"><strong>{t('t.author', 'Author')}</strong></td>
            <td className="valcell">{t('t.authorval', 'Seven Liu and its contributors')}</td>
         </tr><tr>
            <td className="keycell"><strong>{t('t.license', 'License')}</strong></td>
            <td className="valcell"><a href="https://www.apache.org/licenses/LICENSE-2.0.html" target="_blank">Apache-2.0</a></td>
         </tr><tr>
            <td className="keycell"><strong>{t('t.note', 'Notes')}</strong></td>
            <td className="valcell">{t('t.noteval', 'The stock market is risky, and investors need to be cautious.')}</td>
         </tr><tr>
            <td className="keycell"><strong>{t('t.language', 'Language')}</strong></td>
            <td className="valcell">
            <Select
               value={lang}
               label={t('t.language', 'Language')}
               onChange={onChnageLanguage}
            >
               <MenuItem value="en">English</MenuItem>
               <MenuItem value="zh-CN">简体中文</MenuItem>
            </Select>
            </td>
         </tr>
      </tbody></table>
   </Box>;
}
