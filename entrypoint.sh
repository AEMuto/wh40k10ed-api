#!/bin/sh

# Start the cron daemon in the background
crond

# Start the main application (passed as an argument)
# Using "exec" is important to ensure signals are handled correctly
exec "$@"
