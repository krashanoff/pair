import React, { useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Editor from "./Editor/Editor";
import Landing from "./Landing/Landing";

export default function App() {
  const [name, setName] = useState("");

  return (
    <BrowserRouter>
      <Switch>
        <Route path="/s/:id" component={Editor} />
        <Route path="/" component={Landing} />
      </Switch>
    </BrowserRouter>
  );
}
