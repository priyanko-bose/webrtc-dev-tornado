#!/usr/bin/env python
import os
import json

CONFIG_FILENAME = "sig-server.conf"
# used to resolve relative directories for static assets
rel = lambda *x: os.path.abspath(os.path.join(os.path.dirname(__file__), *x))

#-------------------Configuration reader---------------------------------------
class Config(object):
    instance = None
    @staticmethod
    def getInstance():
        """Static method access"""
        if Config.instance == None:
            Config()
        return Config.instance 

    def __init__(self):
        """Virtually private constructor"""
        if Config.instance != None:
            raise Exception("This class is a singleton!")
        else:
            Config.instance = self
        self.conf_data = {} 
        self.conf_file = CONFIG_FILENAME 
        self.logfile_name = "sig-server.log" 
        self.server_name = "myserver.com" 
        self.http_port = "80"
        self.https_port = "433"

    def readConfig(self):
        res=False
        try:
            with open(self.conf_file) as mfile:
                self.conf_data = json.load(mfile)
            print("Read config: %s" % (self.conf_data))
            self.logfile_name = self.conf_data['logger']['file_name']
            self.server_name = self.conf_data['server']['public_fqdn']
            self.http_port = self.conf_data['server']['http_port']
            self.https_port = self.conf_data['server']['https_port']
            self.ssl_enabled = self.conf_data['server']['ssl_enabled']
            res = True
        except Exception as err:
            print("Config read error reason:%s" %(err))
        finally:
            return res

    def getLogFileName(self):
        return  self.logfile_name

    def getServerName(self):
        return  self.server_name

    def getServerPort(self):
        return  (self.ssl_enabled, self.https_port) if self.ssl_enabled else (self.ssl_enabled,self.http_port)
