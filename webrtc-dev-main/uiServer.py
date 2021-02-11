#!/usr/bin/env python3
import os
import re
import json
import sys
import ssl
import time
import datetime
import threading
import hashlib
from threading import Lock, RLock # used for thread safe sets and Trees

from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler
from tornado.httpserver import HTTPServer

from logMgr import Logger 
from configMgr import Config
from utils import *

https_enabled = 1 
logger = None
config = None
authmgr = None
dbmgr = None

# used to resolve relative directories for static assets
rel = lambda *x: os.path.abspath(os.path.join(os.path.dirname(__file__), *x))

#-------------------Request Handler functions-----------------------------------
class MainHandler(RequestHandler):
    def initialize(self, logger):
        self.logger = logger
    def get(self):
        self.redirect('/meetin/')

class LogoutHandler(RequestHandler):
    def initialize(self, logger):
        self.logger = logger
    def post(self):
        result = {'status': False, 'errMsg':''}
        authkey = self.get_argument('authkey')
        logger.info('LogoutHandler: authkey:' + authkey)
        global authmgr
        uid = authmgr.getUidByToken(authkey)
        if(uid == ''):
            result['errMsg'] = "uid not found"
        else:
            #remove other saved information of the user
            authmgr.logoutUser(authkey)
            result['status'] = True
        output = json.dumps(result)
        self.write(output)

class CreateRoomHandler(RequestHandler):
    def initialize(self, logger, dbmgr):
        self.logger = logger
        self.dbmgr = dbmgr
    def post(self):
        ret = {"status":False, "errMsg":""}
        roomname = self.get_argument("roomname",None) 
        username = self.get_argument("username",None) 
        try:
            userData = dict()
            userData['time'] = str(time.time())
            userData['uid'] = generateUniqueId((username + userData['time']))
            userData['roomid'] = generateUniqueId((roomname + userData['time']))
            userData['name'] = username
            userData['roomname'] = roomname 
            if self.dbmgr.addUser(userData) == True:
                roomData = dict()
                roomData['roomid'] = userData['roomid']
                roomData['roomname'] = roomname
                roomData['hostid'] = userData['uid']
                if self.dbmgr.addRoom(roomData) == True:
                    ret['status'] = True
                    ret['roomid'] = userData['roomid']
                    ret['uid'] = userData['uid']
                else:
                    self.dbmgr.delUser(uid)
                    ret["errMsg"] = 'Could not create room=%s' % (roomname)
            else:                
                ret["errMsg"] = 'Could not create username=%s' % (username)
        except Exception as e:
            ret["errMsg"] = ('Could not create user=%s room=%s error:%s' % (username, roomname, str(e)))
        finally:    
            self.logger.info('CreateRoomHandler retMsg:%s' % str(ret))
            output = json.dumps(ret)
            self.write(output) 

class JoinRoomHandler(RequestHandler):
    def initialize(self, logger, dbmgr):
        self.logger = logger
        self.dbmgr = dbmgr
    def post(self):
        ret = {"status":False, "errMsg":""}
        roomurl = self.get_argument("roomurl",None) 
        username = self.get_argument("username",None) 
        try:
            roomDataList = self.dbmgr.getRoomDetails(roomurl)
            if len(roomDataList) > 0:
                roomData = roomDataList[0]
                userData = dict()
                userData['time'] = str(time.time())
                userData['uid'] = generateUniqueId((username + userData['time']))
                userData['roomid'] = roomData['roomid']
                userData['name'] = username
                userData['roomname'] = roomData['roomname'] 
                if self.dbmgr.addUser(userData) == True:
                    ret['status'] = True
                    ret['roomid'] = userData['roomid']
                    ret['uid'] = userData['uid']
                else:
                    ret["errMsg"] = 'Could not Get room by hostid=%s' % (userData['uid'])
            else:                
                ret["errMsg"] = 'Either host not joined or room not valid roomurl=%s' % (roomurl)
        except Exception as e:
            ret["errMsg"] = ('Could not get username=%s roomurl=%s error:%s' % (username, roomurl, str(e)))
        finally:    
            self.logger.info('JoinRoomHandler retMsg:%s' % str(ret))
            output = json.dumps(ret)
            self.write(output)

class RoomHandler(RequestHandler):
    def initialize(self, logger, dbmgr, ws_path):
        self.logger = logger
        self.dbmgr = dbmgr
        self.ws_path = ws_path
    def get(self, roomid):
        uid = self.get_argument("user",None)
        userList = [] 
        if uid == None or uid == "":
            self.redirect('/meetin/')
        else:    
            userList = self.dbmgr.getJoineeList(roomid)
        username = ""
        participants = ""
        participantsId = ""
        roomname = ""
        isHost = 0
        if len(userList) != 0:    
            for user in userList:
                if user['uid'] == uid:
                    username = user['name']
                    if user['uid'] == user['hostid']:
                       username += "(Host)"
                       isHost = 1
                else:    
                    tmpname = user['name']
                    if user['uid'] == user['hostid']:
                       tmpname += "(Host)"
                    participants +=  tmpname + ',' 
                    participantsId +=  user['uid'] + ','
            roomname = userList[0]['roomname']
        if username == None or username == "":    
            self.redirect('/meetin/')
            
        self.logger.info('RoomHandler: return val:%s' % str(userList))
        self.render('room.html', userid=uid, username=username,ishost=isHost,ws_path=self.ws_path, 
                     participants=participants, participantsId=participantsId, roomid=roomid, roomname=roomname)

class HomeHandler(RequestHandler):
    def initialize(self, logger):
        self.logger = logger
    def get(self):
        self.render('home.html') 

