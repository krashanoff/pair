import React, {useState, useEffect} from 'react';
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

  useEffect(() => {
    const listener = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  });

  let broadcast;
  useEffect(() => {
    let socket = new WebSocket(`wss://pear.krashanoff.com/${params.id || "new"}`);
    socket.onopen = () => console.log("Opened socket.");
    socket.onmessage = m => console.log(`New message! ${m}`);
    socket.onclose = () => console.log("Closed socket.");
    socket.onerror = () => console.log("Encountered an error!");

    broadcast = socket.CLOSED ? (() => null) : socket.send;

    return socket.CLOSED ? (() => null) : socket.close;
  });

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
          broadcast({
            event: "write",
            val: v,
          });
          setValue(v);
        }}
      />
    </>
  );
}