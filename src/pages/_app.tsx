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
    </React.Fragment>
  );
}

export default MyApp;