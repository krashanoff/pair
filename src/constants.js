// prettier-ignore
const START_MSG = language => `
${language === "python" ? "\"\"\"" : "/*"}
Welcome to pair!
This is your editor.

You can see others' editors in the tray on your right.
Click on an editor to view it live. If that specific user
gave you permission to edit its contents (via the "change
sharing" menu below), then you can type directly into it
and see the changes reflected live!

Any error messages will appear in this editor as a popup
below the line you are typing on at time of error.

If you are the last one to leave any session, it will be
automatically deleted in exactly five minutes.

Otherwise, if you're ready to get rolling, just try typing
something. Have fun!
${language === "python" ? "\"\"\"" : "*/"}
`;

const DEFAULT_LANG = "javascript";

let SERVER_URL = "http://localhost:8081";

export { START_MSG, DEFAULT_LANG, SERVER_URL };
