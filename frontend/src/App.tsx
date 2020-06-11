import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';

import HeaderMenu from './components/HeaderMenu';
import Index from './pages/Index';
import Sample from './pages/Sample';
import './App.css';

function App() {
  return (
    <div className='App'>
      <Router>
        <HeaderMenu />
        <Switch>
          <Route path='/home' exact component={Index} />
          <Route path='/sample' exact component={Sample} />
          <Redirect to='/home' />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
