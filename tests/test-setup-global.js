// Global Jest setup that runs before test environment
const { TextEncoder, TextDecoder } = require("util");
const { crypto } = require("crypto");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.crypto = crypto;
