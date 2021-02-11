#!/usr/bin/env python3

import logging

#-------------------Responsible for logging-------------------------------------
class Logger(object):
    instance = None
    log = None
    logfile = ''
    @staticmethod
    def getInstance():
        """Static method access"""
        if Logger.instance == None:
            Logger()
        return Logger.instance

    def __init__(self):
        """Virtually private constructor"""
        if Logger.instance != None:
            raise Exception("This class is a singleton!")
        else:
            Logger.instance = self
        logging.basicConfig(level=logging.NOTSET)
        self.log = logging.getLogger('sig-server')
        self.log.propagate = False
        self.logfile = ''
     
    def configLogger(self, fileName):
        res=False
        try:
            self.logfile = fileName
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
            handler = logging.handlers.RotatingFileHandler(self.logfile,
                                               maxBytes=2000000,
                                               backupCount=50)
            handler.setFormatter(formatter)
            self.log.addHandler(handler)
            logging.getLogger("tornado.access").addHandler(handler)
            logging.getLogger("tornado.access").propagate = False
            res = True
        except Exception as err:
            print("configLogger error, reason: %s" % (err))
        finally:
            return res

    def info(self, msg) :
        if self.logfile != '':
            self.log.info(msg)
        else:
            print (msg)

    def error(self, msg):
        if self.logfile != '':
            self.log.error(msg)
        else:
            print (msg)

    def debug(self, msg):
        if self.logfile != '':
            self.log.debug(msg)
        else:
            print (msg)

