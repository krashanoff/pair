import React, { useEffect, useState, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Controlled as CodeMirror } from "react-codemirror2";
import { START_MSG, DEFAULT_LANG, SERVER_WEBSOCKET } from "../constants";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "./Editor.css";

const SOCKET_ERR = -1;
const SOCKET_CLOSED = 0;
const SOCKET_OK = 1;

function ExitButton() {
  const history = useHistory();
  const [confirm, setConfirm] = useState(false);

  return (
    <input
      type="button"
      className="exit-button"
      value={confirm ? "Are you sure?" : "Exit"}
      onClick={() => {
        if (confirm) history.push("/");
        else {
          setConfirm(true);
          setTimeout(() => {
            setConfirm(false);
          }, 2000);
        }
      }}
    />
  );
}

export default function Editor(props) {
  const params = useParams();

  const [name, setName] = useState(
    props.name || `Random${Math.floor(Math.random() * 1000)}`
  );
  const [okName, setOkName] = useState(name !== undefined);

  // TODO: No name? Enter one.
  // if (!okName)
  //   return (
  //     <>
  //       <input
  //         type='text'
  //         value={name}
  //         onChange={e => setName(e.target.value)}
  //       />
  //       <input
  //         type='button'
  //         value="OK"
  //         onClick={() => setOkName(false)}
  //       />
  //     </>
  //   );

  // State of the websocket.
  const [socketState, setSocketState] = useState(-1);

  // Map of names to basic user data. Begins with
  // our own user data.
  const [users, setUsers] = useState({
    [name]: {
      value: START_MSG(DEFAULT_LANG),
      readOnly: false,
      switchTo: () => setViewing(name),
    },
  });
  let mutableUsers = { ...users };

  const userData = users[name];

  // Websocket for all communication.
  const ws = useRef(props.ws || null);

  // Control whose editor we are viewing at the moment.
  const [viewing, setViewing] = useState(name);
  const viewingObj = users[viewing] ? users[viewing] : users[name];

  // Create a websocket to communicate to other
  // editors if one does not exist already.
  useEffect(() => {
    if (ws.current) return;

    ws.current = new WebSocket(`${SERVER_WEBSOCKET}/${params.id}?name=${name}`);
    ws.current.onopen = () => setSocketState(SOCKET_OK);
    ws.current.onclose = () => setSocketState(SOCKET_CLOSED);
    ws.current.onerror = () => setSocketState(SOCKET_ERR);

    // The complex portion: handling websocket messages.
    ws.current.onmessage = m => {
      const msg = JSON.parse(m.data);

      // We can ignore our own updates.
      if (msg.name && msg.name === name) return;

      switch (msg.type) {
        case "IDENTIFY":
          // Identify the user and our contents.
          console.info("IDENTIFY sent.");
          ws.current.send(
            JSON.stringify({
              type: "IAM",
              name,
              value: userData.value,
            })
          );
          break;

        // Received a message from someone identifying
        // themselves.
        case "IAM":
          console.info("IAM received.");
          if (!msg.name || msg.name in users) return;
          mutableUsers[msg.name] = {
            name: msg.name,
            value: msg.value,
            readOnly: true,
            toggleEdit: () => {
              mutableUsers[msg.name].canEdit = !mutableUsers[msg.name].canEdit;
              setUsers(mutableUsers);
            },
          };
          setUsers(mutableUsers);
          break;

        // Someone left the session.
        case "LEAVE":
          console.info(`${msg.name} left!`);
          delete mutableUsers[msg.name];
          setUsers(mutableUsers);
          break;

        // Someone wrote to an editor.
        case "WRITE":
          console.info(`${msg.name} wrote!`);
          mutableUsers[msg.name].value = msg.value;
          setUsers(mutableUsers);
          break;

        // Unknown event.
        default:
          console.info("Some unknown event occurred.");
      }
    };

    return ws.current ? undefined : socket.close;
  }, []);

  if (socketState === SOCKET_ERR) return <h1>Connecting...</h1>;

  return (
    <div className="editor-container">
      <ExitButton />

      <CodeMirror
        value={viewingObj.value}
        options={{
          mode: DEFAULT_LANG,
          theme: "material",
          lineNumbers: true,
          tabSize: 2,
          smartIndent: true,
          readOnly: viewingObj.readOnly,
        }}
        onBeforeChange={(e, d, v) => {
          if (viewingObj.readOnly) return;

          // Update value.
          mutableUsers[name].value = v;
          ws.current.send(
            JSON.stringify({
              type: "WRITE",
              name: name,
              value: users[name].value,
            })
          );
          setUsers(mutableUsers);
        }}
      />

      <div>
        {Object.entries(users).map(([k, v], i) => (
          <div key={i}>
            <input
              type="button"
              value={
                k === name ? `${k} (Me)` : k === viewing ? `${k} (Viewing)` : k
              }
              onClick={() => setViewing(k)}
            />

            {v.readOnly ? (
              <input
                type="checkbox"
                onChange={() => {
                  mutableUsers[k].readOnly = false;
                  setUsers(mutableUsers);
                }}
              />
            ) : (
              <input
                type="checkbox"
                onChange={() => {
                  mutableUsers[k].readOnly = true;
                  setUsers(mutableUsers);
                }}
                checked
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
