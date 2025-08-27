"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
var Redis = require("ioredis");
var env_js_1 = require("./env.js");
// @ts-ignore
exports.connection = new Redis.default(env_js_1.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});
