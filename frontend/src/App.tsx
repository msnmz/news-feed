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
import Mapping from './pages/Mapping';
import './App.css';

function App() {
  return (
    <div className='App'>
      <Router>
        <HeaderMenu />
        <Switch>
          <Route path='/home' component={Index} />
          <Route path='/sample' exact component={Sample} />
          <Route path='/mapping' exact component={Mapping} />
          <Redirect to='/home' />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
