# The Vault — File Manager (Node.js)

A small Express app for create/read/update/delete file operations,
with a UI built around a central floating emblem and four action
buttons arranged in a diamond around it, instead of a typical form
or sidebar.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000

## Notes

- All file operations are sandboxed to the `storage/` folder (created
  automatically on first run) — the app can't touch files anywhere
  else on your machine, and filenames are validated to block path
  traversal (e.g. `../../etc/passwd`).
- Click any of the four nodes (Create, Read, Update, Delete) to open
  its action in a centered modal. Update supports rename, append,
  and overwrite via a mode switch.
- The ledger panel in the bottom-right logs the last 8 actions with
  timestamps.
