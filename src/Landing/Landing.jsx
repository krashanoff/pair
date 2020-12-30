import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { SERVER_URL } from "../constants";

//
// Landing
//
// The start page.
//

export default function Landing() {
  const history = useHistory();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <h1>pair</h1>
      <p>collaborative coding for the rest of us.</p>
      <form
        onSubmit={e => {
          e.preventDefault();
          console.info(e);
          console.info(`${SERVER_URL}/create`);
          // TODO
          history.push(`s/bbbb`);
        }}
      >
        <label htmlFor="name">Name:</label>
        <br />
        <input
          name="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <br />

        <label htmlFor="password">Room Password:</label>
        <br />
        <input
          name="password"
          type="password"
          maxLength="100"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <br />

        <input type="submit" value="Create!" />
      </form>
    </>
  );
}
