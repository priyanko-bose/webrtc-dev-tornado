#!/bin/bash
pid=`cat sig-server.pid`
kill -9 $pid
rm -f sig-server.pid
