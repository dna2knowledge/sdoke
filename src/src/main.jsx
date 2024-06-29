import React from 'react'
import ReactDOM from 'react-dom/client'

import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";

import initCordova from '$/service/cordova';
import _ from '$/i18n/index';

import Layout from '$/layout.jsx';
import PlaceHolder from '$/page/placeholder.jsx';
import Stock from '$/page/stock.jsx';
import StockStrategy from '$/page/stock-strategy';
import StockSearch from './page/stock-search';
import StockTrade from '$/page/stock-trade';
import About from '$/page/about.jsx';
import Loading from '$/component/shared/loading.jsx';
import Toast from '$/component/shared/toast.jsx';
import '$/index.css';

initCordova();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <HashRouter><Routes>
        <Route path="/" element={<Layout />}>
           <Route index element={<Stock name="Sdoke" />} />
           <Route path="strategy" element={<StockStrategy />} />
           <Route path="search" element={<StockSearch />} />
           <Route path="trade" element={<StockTrade />} />
           <Route path="about" element={<About />} />
        </Route>
        <Route path="/login" element={<PlaceHolder name="login" />} />
     </Routes></HashRouter>
     <Toast />
     <Loading />
  </React.StrictMode>,
);
