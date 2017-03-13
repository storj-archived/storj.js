#!/bin/bash

# Startup script from sitespeedio/sitespeed.io-docker
set -e
date
echo 'Starting Xvfb ...'
export DISPLAY=:99
2>/dev/null 1>&2 Xvfb :99 -shmem -screen 0 1366x768x16 &
exec "$@"
