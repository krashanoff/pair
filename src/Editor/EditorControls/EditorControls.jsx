import React from "react";
import "./EditorControls.css";

//
// EditControls
//
// Modal to change who can modify your editor.
//

export default function EditorControls(props) {
  return (
    <div className="edit-control-modal">
      <h2>Edit Access</h2>
      <ul>
        {Object.entries(props.users).map(
          ([name, { canEdit, toggleEdit }], i) => (
            <li key={i}>
              {canEdit ? (
                <input name={i} type="checkbox" onChange={toggleEdit} checked />
              ) : (
                <input name={i} type="checkbox" onChange={toggleEdit} />
              )}
              <label htmlFor={i}>{name}</label>
            </li>
          )
        )}
      </ul>
      <button onClick={props.onClose}>Close</button>
    </div>
  );
}
