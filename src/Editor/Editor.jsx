import React, { useEffect, useState, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Controlled as CodeMirror } from "react-codemirror2";
import EditorControls from "./EditorControls/EditorControls";
import Gallery from "./Gallery/Gallery";
import { START_MSG, DEFAULT_LANG } from "../constants";
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

  // Map of names to user data.
  const [users, setUsers] = useState([]);

  // Websocket for all communication.
  const ws = useRef(props.ws || null);

  // TODO: Handle name acquisition.
  const [name, setName] = useState(`Test${Math.random()}`);
  console.info(`Using name: ${name}`);

  // Create a websocket to communicate to other
  // editors if one does not exist already.
  useEffect(() => {
    if (ws.current) return;

    ws.current = new WebSocket(`${SERVER_WEBSOCKET}/${params.id}?name=${name}`);
    ws.current.onopen = () => setSocketState(SOCKET_CLOSED);
    ws.current.onclose = () => setSocketState(SOCKET_CLOSED);
    ws.current.onerror = () => setSocketState(SOCKET_ERR);

    // The complex portion: handling websocket messages.
    ws.current.onmessage = m => {
      const msg = JSON.parse(m.data);

      // We can ignore our own updates.
      if (msg.name === name) return;

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

        // Received a message from someone explaining
        // themselves.
        case "IAM":
          console.info("IAM Received.");
          setUsers(
            users.concat({
              name: msg.name,
              value: msg.value,
            })
          );
          break;

        // Someone left the session.
        case "LEAVE":
          console.info("Someone left!");
          break;

        // Someone tries to write to an editor. Whether
        // it is accepted is left to fate.
        case "TRYWRITE":
          break;

        // Someone wrote to an editor.
        case "WRITE":
          console.info("Write event");
          break;

        // Someone selected within an editor.
        case "SELECT":
          break;

        // Unknown event.
        default:
      }
      console.info("Received a message through the websocket", m.data);
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
          users={[
            {
              name: "A",
              canEdit: false,
              toggleEdit: () => console.info("A can now edit."),
            },
            {
              name: "B",
              canEdit: true,
              toggleEdit: () => console.info("B can no longer edit."),
            },
          ]}
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
