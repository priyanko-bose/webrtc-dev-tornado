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

from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler
from tornado.httpserver import HTTPServer

from utils import *
from configMgr import Config
from logMgr import Logger
from dbMgr import DBManager

from uiServer import MainHandler 
from uiServer import HomeHandler 
from uiServer import RoomHandler 
from uiServer import LogoutHandler 
from uiServer import CreateRoomHandler 
from uiServer import JoinRoomHandler 

from sigServer import WSHandler

https_enabled = 1 
logger = None
config = None
authmgr = None
dbmgr = None

# used to resolve relative directories for static assets
rel = lambda *x: os.path.abspath(os.path.join(os.path.dirname(__file__), *x))

def init_config():
    global config
    res=False 
    try:
        config = Config.getInstance()
        if config:
            res=config.readConfig()
    except Exception as err:
        print("init_config failed, reason: %s" % (err))
    finally:
        return res

def init_logger():
    global logger
    res=False 
    try:
        logger = Logger.getInstance()
        if logger:
            res=logger.configLogger(config.getLogFileName())
    except Exception as err:
        print("init_logger failed, reason: %s" % (err))
    finally:
        return res
    
def init_dbmgr():
    global dbmgr
    res=False
    try:
        dbmgr = DBManager.getInstance()
        if dbmgr:
            res=dbmgr.isDBConnOpen()
    except Exception as err:
        print("init_dbmgr failed, reason: %s" % (err))
    finally:
        return res

def deinit_db():
    global dbmgr
    res=False
    try:
        dbmgr = DBManager.getInstance()
        if dbmgr:
            res=DBManager.closeDB()
    except Exception as err:
        print("deinit_dbmgr failed, reason: %s" % (err))
    finally:
        return res
    
def checkAllConnectionsForLastResponse():
    global logger
    logger.info("checking all connections for last response...")

def main():
    if not init_config():
        sys.exit("Could not load the config. Hence exiting...")
    if not init_logger():
        sys.exit("Could not initialize log file. Hence exiting...")
    if not init_dbmgr():
        sys.exit("Could not initialize db manager. Hence exiting...")
    else:
        pass
    global logger
    global dbmgr
    settings = dict(
        template_path=rel('webpages'),
        static_path=rel('resources'),
        debug=True
    )
    logger.info('Found webpages path: ' + settings['template_path'])
    logger.info('Found resources path: ' + settings['static_path'])

    global https_enabled
    https_enabled, port_val = config.getServerPort()
    prefix="ws://"
    if https_enabled:
        ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
        ssl_ctx.load_cert_chain(rel('certs') + '/certificate.pem', rel('certs') + '/key.pem')
        prefix="wss://"
    
    ws_path=prefix + config.getServerName() + ":" + port_val + "/ws/"
    logger.info("Request websocket at: " + ws_path)
    connectionList = LockedSet()  #static class variable used for testing for activity timeout
    application = Application([
        (r'/', MainHandler, dict(logger=logger)),
        (r'/meetin/?', HomeHandler, dict(logger=logger)),
        (r'/logout/?', LogoutHandler, dict(logger=logger)),
        (r'/createroom/', CreateRoomHandler, dict(logger=logger, dbmgr=dbmgr)),
        (r'/joinroom/', JoinRoomHandler, dict(logger=logger, dbmgr=dbmgr)),
        (r'/meetin/(.*)?', RoomHandler, dict(logger=logger, dbmgr=dbmgr, ws_path=ws_path)),
        (r'/ws/?', WSHandler, dict(connectionList=connectionList, logger=logger, dbmgr=dbmgr)),
    ], **settings)
    
    prefix="http://"
    if https_enabled:
        server = HTTPServer(application, ssl_options=ssl_ctx)
        prefix="https://"
    else:    
        server = HTTPServer(application)
    server.listen(port=int(port_val))
    print("Started listening at " + prefix + config.getServerName() + ":" + port_val + "/")
    commCheckThread = threading.Thread(target = checkAllConnectionsForLastResponse)
    commCheckThread.daemon = True  # daemon threads will exit when the main thread terminates
    commCheckThread.start()
    #IOLoop.instance().start()
    IOLoop.current().start()
    deinit_db()

if __name__ == '__main__':
    main()
