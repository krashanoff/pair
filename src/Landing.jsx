import React from 'react';
import { useHistory } from 'react-router-dom';

//
// Landing
//
// The start page.
//

export default function Landing(props) {
  const history = useHistory();

  return (
    <>
      <p>Our Landing</p>
      <p>Create a session by clicking below.</p>
      <button
        onClick={() => {
          fetch("http://localhost:8081/new", {
            method: "post",
            mode: "cors",
          })
          .then(r => r.text())
          .then(t => {
            history.push(`/s/${t}`);
          })
          .catch(e => console.error(e));
        }}
      >
        New session
      </button>
    </>
  );
}
