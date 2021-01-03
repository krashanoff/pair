import React, { useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Editor from "./Editor/Editor";
import Landing from "./Landing/Landing";

export default function App() {
  const [name, setName] = useState("");

  return (
    <BrowserRouter>
      <Switch>
        <Route path="/s/:id">
          <Editor name={name} />
        </Route>
        <Route path="/">
          <Landing name={name} setName={setName} />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
