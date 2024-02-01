// jest.polyfill.js
// jest.polyfills.js

const { fetch, Headers, Request, Response } = require('cross-fetch')

global.fetch = fetch
global.Headers = Headers
global.Request = Request
global.Response = Response

const { TextDecoder, TextEncoder, ReadableStream } = require("node:util");

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder }
});