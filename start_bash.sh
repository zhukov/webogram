#! /bin/sh

node server.js&
chromium-browser http://localhost:8000/app/index.html&
