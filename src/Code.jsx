import React, {useState, useEffect, useRef} from 'react';
import ControlledEditor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';

//
// Code
//
// Work on code together from a controlled
// Monaco.
//

export default function Code(props) {
  const params = useParams();
  const [value, setValue] = useState("const a = \"Heyo Default, welcome to pair.\";");
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const ws = useRef(null);

  useEffect(() => {
    const listener = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  });

  // Create the websocket.
  useEffect(() => {
    ws.current = new WebSocket(`wss://localhost:8081/s/${params.id}`);
    ws.current.onopen = () => console.log("Opened socket.");
    ws.current.onmessage = m => console.log(`New message! ${m}`);
    ws.current.onclose = () => console.log("Closed socket.");
    ws.current.onerror = () => console.log("Encountered an error!");

    return ws.current.CLOSED ? undefined : socket.close;
  });
  
  if (!ws.current) {
    console.log(ws.current);
    return (
      <>
        <h1>Your pair session could not be found.</h1>
      </>
    );
  }

  return (
    <>
      <ControlledEditor
        language="javascript"
        width={width}
        height={height}
        theme="dark"
        value={value}
        options={{
          contextmenu: false,
          copyWithSyntaxHighlighting: true,
          scrollbar: false,
          fontFamily: "Fira Code",
          fontLigatures: true,
          fontSize: 14,
          minimap: {
            enabled: false,
          },
          renderIndicators: false,
          roundedSelection: true,
          smoothScrolling: true,
          wordWrap: "on",
        }}
        onChange={(e, v) => {
          console.log("Some change");
          console.log(e, v);
          ws.current.send({
            event: "write",
            val: v,
          });
          setValue(v);
        }}
      />
    </>
  );
}