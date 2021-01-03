import React, { useEffect, useState, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Controlled as CodeMirror } from "react-codemirror2";
import EditorControls from "./EditorControls/EditorControls";
import Gallery from "./Gallery/Gallery";
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

  // Simple state variables for the editor controls.
  const [socketState, setSocketState] = useState(-1);
  const [controlsActive, setControlsActive] = useState(false);
  const [value, setValue] = useState(START_MSG);
  const [language, setLanguage] = useState(DEFAULT_LANG);

  const [viewing, setViewing] = useState(props.name);

  // Map of names to basic user data.
  const [users, setUsers] = useState({});
  let mutableUsers = { ...users };
  console.log(users);

  // Websocket for all communication.
  const ws = useRef(props.ws || null);

  // TODO: Handle name acquisition.
  const name = props.name;
  console.info(`Using name: ${name}`);

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
          console.info("Identifying myself.");
          ws.current.send(
            JSON.stringify({
              type: "IAM",
              name,
              value: value,
            })
          );
          break;

        // Received a message from someone identifying
        // themselves.
        case "IAM":
          console.info("IAM Received.");
          if (msg.name in users) return;
          mutableUsers[msg.name] = {
            value: msg.value,
            canEdit: false,
            switchTo: () => {
              console.log(`Switched to ${msg.name}`);
              setViewing(msg.name);
            },
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

        // Someone tries to write to an editor. Whether
        // it is accepted is left to fate.
        case "TRYWRITE":
          console.info("Someone tried to write to an editor");
          break;

        // Someone wrote to an editor.
        case "WRITE":
          console.info("Write event");
          mutableUsers[msg.name].value = msg.value;
          setUsers(mutableUsers);
          break;

        // Someone selected within an editor.
        case "SELECT":
          break;

        // Unknown event.
        default:
          console.info("Some unknown event occurred.");
      }
    };

    return ws.current ? undefined : socket.close;
  }, []);

  // if (socketState === SOCKET_ERR)
  //   return <h1>Failed to connect!</h1>;

  return (
    <div className="editor-container">
      <div className="controls-toggle">
        <ExitButton />
        <input
          type="button"
          onClick={() => setControlsActive(true)}
          value="Change sharing"
        />
      </div>

      {controlsActive && (
        <EditorControls
          onClose={() => setControlsActive(false)}
          users={users}
        />
      )}

      <CodeMirror
        value={value}
        options={{
          mode: "javascript",
          theme: "material",
          lineNumbers: true,
          tabSize: 2,
          smartIndent: true,
        }}
        onBeforeChange={(e, d, v) => {
          ws.current.send(
            JSON.stringify({
              name,
              type: "WRITE",
              value: v,
            })
          );
          setValue(v);
        }}
        onChange={(e, d, v) => {
          console.info(d);
        }}
      />

      <Gallery name={name} users={users} />
    </div>
  );
}
