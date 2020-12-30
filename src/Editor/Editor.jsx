import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
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

export default function Editor() {
  const params = useParams();
  const [socketState, setSocketState] = useState(-1);
  const [value, setValue] = useState(START_MSG);
  const [language, setLanguage] = useState(DEFAULT_LANG);
  const [controlsActive, setControlsActive] = useState(false);
  const ws = useRef(null);

  // Create a websocket to communicate to other
  // editors.
  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8081/s/${params.id}`);
    ws.current.onopen = () => setSocketState(SOCKET_CLOSED);
    ws.current.onclose = () => setSocketState(SOCKET_CLOSED);
    ws.current.onerror = () => setSocketState(SOCKET_ERR);

    // The complex portion: handling websocket messages.
    ws.current.onmessage = m => {
      setValue(m.data); // TODO
      setSocketState(SOCKET_OK);
    };

    return ws.current ? undefined : socket.close;
  }, []);

  // if (socketState === SOCKET_ERR)
  //   return <h1>Failed to connect!</h1>;

  return (
    <div className="editor-container">
      <input
        className="controls-toggle"
        type="button"
        onClick={() => setControlsActive(true)}
        value="Change sharing"
      />

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
          setValue(v);
        }}
        onChange={(e, d, v) => {
          console.info(d);
        }}
      />

      <Gallery
        users={[
          {
            name: "A",
            value: "example code\nline2\nline3\nline4",
            switchTo: () => console.info("Switch to another editor."),
          },
          {
            name: "B",
            value: "example code\nline2\nline3",
            switchTo: () => console.info("Switch to another editor."),
          },
          {
            name: "C",
            value: "example code\nline2\nline3",
            switchTo: () => console.info("Switch to another editor."),
          },
          {
            name: "E",
            value: "example other code\nhe",
            switchTo: () => console.info("Switch to another editor."),
          },
        ]}
      />
    </div>
  );
}
