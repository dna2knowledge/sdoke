import React from 'react'
import ReactDOM from 'react-dom/client'

import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";

import initCordova from '$/service/cordova';

import Layout from '$/Layout.jsx';
import PlaceHolder from '$/page/PlaceHolder.jsx';
import Loading from '$/component/shared/Loading.jsx';
import Toast from '$/component/shared/Toast.jsx';
import '$/index.css';

initCordova();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <HashRouter><Routes>
        <Route path="/" element={<Layout />}>
           <Route index element={<PlaceHolder name="Sdoke" />} />
           <Route path="about" element={<PlaceHolder name="About" />} />
        </Route>
        <Route path="/login" element={<PlaceHolder name="login" />} />
     </Routes></HashRouter>
     <Toast />
     <Loading />
  </React.StrictMode>,
);
