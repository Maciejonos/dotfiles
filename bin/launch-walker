#!/bin/bash

# Start elephant if not already running
if ! pgrep -x elephant >/dev/null 2>&1; then
  setsid uwsm app -- elephant >/dev/null 2>&1 &
fi

# Start walker if not already running
if ! pgrep -x walker >/dev/null 2>&1; then
  setsid uwsm app -- walker --gapplication-service >/dev/null 2>&1 &
fi
