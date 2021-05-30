import App from 'next/app';
import Head from 'next/head';
import React from 'react';
import Navigation from '../containers/Navigation/Navigation';

import '../../public/css/main.css';


function MyApp({Component}) {
  return (
    <React.Fragment>
      <Head>
        <title>Bingo Game</title>
        <meta charSet="utf-8" />
      </Head>
      <Navigation />
      <div className='page'>
        <div className='main-container'>
          <Component />
        </div>
      </div>
      <script src="/socket.io/socket.io.js"></script>
    </React.Fragment>
  );
}

export default MyApp;