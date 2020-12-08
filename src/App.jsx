import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Code from './Code';
import Landing from './Landing';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/s/:id" component={Code} />
        <Route path="/" component={Landing} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
