#!/bin/bash
python3 server.py &
echo $! > sig-server.pid
