import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { SERVER_URL } from "../constants";
import "./Landing.css";

//
// Landing
//
// The start page.
//

export default function Landing(props) {
  const history = useHistory();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);

  return (
    <div className="landing">
      <h1>pair</h1>
      <p>collaborative coding for the rest of us.</p>
      <form
        onSubmit={e => {
          // Create the new session.
          e.preventDefault();
          fetch(`${SERVER_URL}/create`, {
            method: "post",
            mode: "cors",
            body: JSON.stringify({
              name: props.name,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then(r => {
              if (r.status === 200) return r.text();
              return false;
            })
            .then(t =>
              t ? history.push(`s/${t}`) : setErr("Something went wrong")
            )
            .catch(e => setErr(e));
        }}
      >
        <label htmlFor="name">Name:</label>
        <br />
        <input
          name="name"
          type="text"
          value={props.name}
          onChange={e => props.setName(e.target.value)}
          required
        />
        <br />

        <input
          type="submit"
          value={err ? "An error occurred! Try again." : "Create!"}
        />
      </form>
    </div>
  );
}
