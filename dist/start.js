#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
app_1.run()
    .then(() => { })
    .catch(msg => console.log(msg));
;