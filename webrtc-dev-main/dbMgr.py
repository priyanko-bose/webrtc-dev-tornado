#!/usr/bin/env python3
import sys
from logMgr import Logger
import pymysql 

class DBManager(object):
    instance = None
    dbfile_name = 'sig-server.db'
    db_conn = None
    db_user = 'collagein'
    db_pass = 'Colin@1'
    db_name = 'collageindb'
    db_server = '127.0.0.1'

    @staticmethod
    def getInstance():
        """Static method access"""
        if DBManager.instance == None:
            DBManager()
        return DBManager.instance

    def __init__(self):
        """Virtually private constructor"""
        if DBManager.instance != None:
            raise Exception("This class is a singleton!")
        else:
            DBManager.instance = self

        self.flagConnOpen = False
        #Assign server and create DB connection
        self.db_conn = pymysql.connect(self.db_server,self.db_user,
                                        self.db_pass,self.db_name)
        if self.db_conn:
            self.flagConnOpen = True
        self.logger = Logger.getInstance()

    def isDBConnOpen(self):
        self.logger.info("dbMgr is connected to the DB")
        return self.flagConnOpen

    def executeCmd(self, sql):
        try:
            # prepare a cursor object using cursor() method
            cursor = self.db_conn.cursor()
            self.logger.info("SQL Query:" + sql)
            # Execute the SQL command
            out = cursor.execute(sql)
            # Commit your changes in the database
            self.db_conn.commit()
            return out,cursor
        except Exception as err:
            # Rollback in case there is any error
            self.db_conn.rollback()
            self.logger.error("logMgr executeCmd error, reason:%s" % (err))
            return 0,None

    def createDB(self):
        res=False
        try:
            # prepare a cursor object using cursor() method
            cursor = self.db_conn.cursor()

            # Drop table if it already exist using execute() method.
            cursor.execute("DROP TABLE IF EXISTS Users")
            cursor.execute("DROP TABLE IF EXISTS Rooms")

            # Create table as per requirement
            sql = """CREATE TABLE Users (uid CHAR(64) NOT NULL,
                  name VARCHAR(32), time VARCHAR(32),
                  roomid CHAR(64), ustatus tinyint(1))"""

            self.logger.info("createDB SQL:" + sql)
            cursor.execute(sql)
        
            sql = """CREATE TABLE Rooms (roomid CHAR(64) NOT NULL,
                                         roomname VARCHAR(32), hostid CHAR(64), 
                                         rstatus tinyint(1))"""
            self.logger.info("createDB SQL:" + sql)
            cursor.execute(sql)
            res=True
        except Exception as err:
            # Rollback in case there is any error
            self.logger.error("logMgr createDB error, reason:%s" % (err))
        finally:
            return res 

    def closeDB(self):
        # disconnect from server
        try:
            self.db_conn.close()    
        except Exception as err:
            self.logger.error("logMgr closeDB error, reason:%s" % (err))
        finally:
            return True    

    #Adds a new user on sign up
    def addUser(self,userData):
        res=False
        try:
            # Prepare SQL query to SELECT records into the database.
            sql = """INSERT INTO Users(uid, name, time, roomid, ustatus)
                      VALUES ('%s', '%s', '%s', '%s', 0)""" % \
                   (userData['uid'], userData['name'],  
                       userData['time'], userData['roomid'])
        
            self.logger.info("Inserting userData" + str(userData))
            out,result = self.executeCmd(sql)
            if result != None and  out == 1:
                res = True
        except Exception as err:
            # Rollback in case there is any error
            self.logger.error("logMgr addUser error, reason:%s" % (err))
        finally:
            return res

    def delUser(self, uid):
        res=False
        try:
            # Prepare SQL query to DELETE records into the database.
            sql = """DELETE FROM Users WHERE uid='%s'""" % (uid)
            self.logger.info("Deleting userData: " + uid)
            out,result = self.executeCmd(sql)
            if result != None and  out == 1:
                res = True
        except Exception as err:
            # Rollback in case there is any error
            self.logger.error("logMgr delUser error, reason:%s" % (err))
        finally:
            return res

    def modifyUserStatus(self, uid, status):
        try:
            sql = ""
            res = False
            sql = """UPDATE Users SET ustatus='%d' WHERE uid='%s'""" % (status, uid)
            out,result = self.executeCmd(sql)
            if result != None and out == 1:
                res = True
        except Exception as err:
            self.logger.error("logMgr modifyUserStatus error, reason:%s" % (err))
        finally:
            return res

    def getJoineeList(self,roomid):
        userlist = []
        try:
            # Prepare SQL query to INSERT a record into the database.
            #sql = """SELECT * FROM Users WHERE (roomid='%s')""" % (roomid)
            sql = """SELECT * FROM Users AS users 
                      INNER JOIN Rooms AS rooms ON rooms.roomid = users.roomid 
                       WHERE rooms.roomid='%s' AND rooms.rstatus = 1""" % (roomid)
            self.logger.info("Searching room with id:" + roomid)

            self.logger.info("Fetching joinee list for roomid: " + roomid)
            res,result = self.executeCmd(sql)
            if result != None and res > 0:
                rows = result.fetchall()
                for row in rows:
                    user = dict()
                    user['uid'] = row[0]
                    user['name'] = row[1]
                    user['time'] = row[2]
                    user['roomid'] = row[3]
                    user['ustatus'] = row[4]
                    user['roomname'] = row[6]
                    user['hostid'] = row[7]
                    userlist.append(user)
                    # Now print fetched result
            self.logger.info("Got userData:" + str(userlist))            
        except Exception as err:
            self.logger.error("logMgr getFriendList error, reason:%s" % (err))
        finally:
            return userlist 

    def addRoom(self, roomData):
        res = False
        try:
            sql = """INSERT INTO Rooms (roomid, roomname, hostid, rstatus) 
                          VALUES('%s','%s','%s',1)""" % \
                            (roomData['roomid'], roomData['roomname'], roomData['hostid'])
            self.logger.info("Add room request" + roomData['roomid'])
            out,result = self.executeCmd(sql)
            if result != None and out == 1:
               res = True
        except Exception as err:
            self.logger.error("logMgr addRoom error, reason:%s" % (err))
        finally:
            return res                     

    def delRoom(self, roomid):
        res=False
        try:
            # Prepare SQL query to DELETE records into the database.
            sql = """DELETE FROM Rooms WHERE roomid='%s'""" % (uid)
            self.logger.info("Deleting roomData:" + roomid)
            out,result = self.executeCmd(sql)
            if result != None and  out == 1:
                res = True
        except Exception as err:
            # Rollback in case there is any error
            self.logger.error("logMgr delUser error, reason:%s" % (err))
        finally:
            return res

    def modifyRoomStatus(self, roomid, status):
        try:
            sql = ""
            res = False
            sql = """UPDATE Rooms SET rstatus='%d' WHERE roomid='%s'""" % (status, roomid)
            out,result = self.executeCmd(sql)
            if result != None and out == 1:
                res = True
        except Exception as err:
            self.logger.error("logMgr modifyRoomStatus error, reason:%s" % (err))
        finally:
            return res

    def getRoomDetails(self, roomid):
        roomDataList = [] 
        try:
            # Prepare SQL query to SELECT records into the database.
            sql = """SELECT * FROM Users AS users 
                      INNER JOIN Rooms AS rooms ON rooms.hostid = users.uid 
                       WHERE rooms.roomid='%s' AND rooms.rstatus = 1
                        AND users.ustatus = 1""" % (roomid)
            self.logger.info("Searching room with id:" + roomid)
            res,result = self.executeCmd(sql)
            if result != None and res > 0:
                # Fetch all the rows in a list of lists.
                rows = result.fetchall()
                for row in rows:
                    roomData = dict()
                    roomData['uid'] = row[0]
                    roomData['name'] = row[1]
                    roomData['roomid'] = row[5]
                    roomData['roomname'] = row[6]
                    roomData['hostid'] = row[7]
                    roomData['rstatus'] = row[8]
                    roomDataList.append(roomData)
                    # Now print fetched result
                self.logger.info("Got roomData:" + str(roomDataList))
        except Exception as err:
            self.logger.error("logMgr getUserDetails error, reason:%s" % (err))
        finally:
            return roomDataList
def main():
    res=False
    try:
        dbmgr = DBManager.getInstance()
        if dbmgr:
            dbmgr.createDB()
            res=dbmgr.isDBConnOpen()
        if res:
            dbmgr.closeDB()
    except Exception as err:
        print("create failed, reason: %s" % (err))
    finally:
        return res

if __name__ == '__main__':
    main()
