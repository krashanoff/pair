import React, { useState, useEffect, useRef } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import "./Gallery.css";

function GalleryItem(props) {
  const nodeWidget = useRef(document.createElement("p"));
  nodeWidget.current.innerHTML = props.name;
  nodeWidget.current.className = "gallery-name";
  const lineWidget = useRef(null);

  return (
    <div
      className="gallery-item"
      onClick={props.switchTo ? props.switchTo() : null}
    >
      <CodeMirror
        className="gallery-editor"
        options={{
          readOnly: true,
        }}
        value={props.value}
        editorDidMount={e => {
          lineWidget.current = e.addLineWidget(
            e.lineCount() - 1,
            nodeWidget.current
          );
        }}
        onChange={e => {
          e.removeLineWidget(lineWidget.current);
          lineWidget.current = e.addLineWidget(
            e.lineCount() - 1,
            nodeWidget.current
          );
        }}
      />
    </div>
  );
}

export default function Gallery(props) {
  const [start, setStart] = useState(0);
  const widgetNode = useRef(null);
  const widget = useRef(null);

  return (
    <div className="gallery-container">
      {props.users.slice(start, start + 3).map((v, i) => (
        <GalleryItem key={i} {...v} />
      ))}
      <div className="gallery-controls">
        <input
          type="button"
          onClick={() => setStart(Math.max(0, start - 1))}
          value="Back"
        />
        <input
          type="button"
          onClick={() => setStart((start + 1) % props.users.length)}
          value="Next"
        />
      </div>
    </div>
  );
}
