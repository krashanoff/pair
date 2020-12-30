// prettier-ignore
const START_MSG = language => `
${language === "python" ? "\"\"\"" : "/*"}
Welcome to pair!
This is your editor. It's just a stripped-down VSCode.

You can see others' editors (if they allowed you) in the
tray on your right.

Any error messages will appear in this editor as a gutter
message.

If you are the last one to leave the session, it will be
automatically deleted in exactly five minutes.

Otherwise, if you're ready to get rolling, just try typing
something. Have fun!
${language === "python" ? "\"\"\"" : "*/"}
`;

const DEFAULT_LANG = "javascript";

let SERVER_URL = "localhost:8080";

export { START_MSG, DEFAULT_LANG, SERVER_URL };
