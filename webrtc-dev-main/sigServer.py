#!/usr/bin/env python3
import os
import re
import json
import sys
import time
import datetime

from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler
from tornado.httpserver import HTTPServer

from utils import *

class WSHandler(WebSocketHandler):
    def initialize(self, connectionList, logger, dbmgr):
        self.logger = logger
        self.connectionList = connectionList
        self.dbmgr = dbmgr

    def open(self):
        self.set_nodelay(True)
        self.lastMsgTime = time.time() # for checking timeouts
        self.connectionList.add(self)
        self.logger.info('WebSocket connection opened from: ' + self.request.remote_ip)

    def on_message(self, message):
        self.lastMsgTime = time.time() # for checking timeouts
        client_external_ip = self.request.remote_ip
        self.logger.info('Received message from: ' + client_external_ip + ': ' + message)

        try:
            jmsg = json.loads(message) 
            if jmsg['type'] == 'keepalive':
                self.handleKeepAlive(jmsg, client_external_ip)
            elif jmsg['type'] == 'login':
                self.handleLogin(jmsg)
            elif jmsg['type'] == 'logout':
                self.handleLogout(jmsg)
            #elif jmsg['type'] == 'reconnect':
            #    handleReconnect(self, jmsg)
            #elif jmsg['type'] == 'lostDataChannel' :
            #    handleLostDataChannel(self, jmsg)
            else:
                self.handleWebRTC(jmsg, message)
        except Exception as e:
            self.logger.error(e)    
            self.write_message(json.dumps({'type': 'error', 'msg': str(e)}))

    def on_close(self, close_code, close_reason):
        self.logger.info('WebSocket connection closed. Code:[%s] Reason:[%s]', self.close_code, self.close_reason)
        self.connectionList.remove(self)


    def on_connection_close(self):
        self.logger.info('WebSocket connection closed unexpectedly.')
        self.connectionList.remove(self)
        #if self.ws_connection:
        #    self.ws_connection = None
        #if not self._on_close_called:
        #    self._on_close_called = True
        #    self.on_close(1011, 'Unexpected connection closure.')



    def handleWebRTC(self, jMsg, message):
        count = 0
        connectionList = []
        toUserId = jMsg['touserid']
        self.logger.info("Sender: "+str(jMsg['fromuserid'])+" Receiver: "+str(toUserId))
        count,connectionList = self.connectionList.getAll()
        self.logger.info("Total number of connections: " + str(count));
        for hnd in connectionList:
            self.logger.info("Loop userid: "+str(hnd.userid)+" toUserId: "+str(toUserId))
            if str(hnd.userid) == str(toUserId):
                self.logger.info("Sending msg to:" + str(hnd.userid))
                self.logger.info("Message:" + str(message))
                hnd.write_message(message)
                break
    
    def handleKeepAlive(self, jMsg, clientExternIP):
        self.write_message(json.dumps({'type': 'ack', 'msg': 'ack'}))
    
    def handleLogin(self, jMsg):
        #global authmgr
        #userid = authmgr.validateToken(jMsg['userkey'])
        userid = jMsg['userkey']
        if(userid == ''):
            self.write_message(json.dumps({'type': 'error', 'msg':'session expired'})) 
        else:
            self.write_message(json.dumps({'type': 'login', 'userid': userid}))
            self.dbmgr.modifyUserStatus(userid, 1)
            self.userid = userid
            self.logger.info('Login user:' + userid)

    def handleLogout(self, jMsg):
        #global authmgr
        #userid = authmgr.validateToken(jMsg['userkey'])
        userid = jMsg['userkey']
        if(userid == ''):
            self.write_message(json.dumps({'type': 'error', 'msg':'session expired'})) 
        else:
            self.write_message(json.dumps({'type': 'logout', 'userid': userid}))
            self.dbmgr.modifyUserStatus(userid, 0)
            self.userid = userid
            self.logger.info('Logout user:' + userid)
    
