import React, {useState, useEffect, useRef} from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { useParams } from 'react-router-dom';
import 'codemirror/keymap/sublime.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

//
// Code
//
// Work on code together from a controlled
// CodeMirror.
//

export default function Code() {
  const params = useParams();
  const [value, setValue] = useState("def main():\n    print('hi')\n");
  const ws = useRef(null);

  // Create the websocket.
  useEffect(() => {
    if (ws.current)
      return;

    ws.current = new WebSocket(`ws://localhost:8081/s/${params.id}`);
    ws.current.onopen = () => console.log("Opened socket.");
    ws.current.onmessage = m => {
      console.log(`New message! ${m}`);
      setValue(m);
    }
    ws.current.onclose = () => {
      console.log("Closed socket.");
      ws.current = null;
    }
    ws.current.onerror = () => {
      console.log("Encountered an error!");
      ws.current = null;
    }

    return ws.current ? undefined : socket.close;
  });

  if (!ws.current)
    return <h1>Connection failure.</h1>
  
  return (
    <CodeMirror
      autoCursor={true}
      autoScroll={true}
      options={{
        mode: 'python',
        theme: 'material',
        keyMap: 'sublime',
        lineNumbers: true,
        indentUnit: 2,
        indentWithTabs: false,
        smartIndent: true,
        showCursorWhenSelecting: true,
      }}
      value={value}
      onBeforeChange={(_e, _d, v) => {
        setValue(v);
      }}
      onChange={(e, d, v) => {
        console.info(e, d, v);
        ws.current.send(v);
      }}
    />
  );
}