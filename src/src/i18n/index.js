import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import local from '$/service/local';
import zhCn from '$/i18n/zh-cn';

const lang = (
   (local.load('sdokelang') || {}).lang ||
   window.navigator.language
);

i18n.use(initReactI18next).init({
   lng: lang,
   fallbackLng: 'en',
   debug: true,
   resources: {
      en: {},
      'zh-CN': zhCn,
   }
});

window._debugI18n = i18n;
export default i18n;