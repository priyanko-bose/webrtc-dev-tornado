#!/usr/bin/env python3
import hmac, hashlib
import zlib
from Crypto.Cipher import AES
from base64 import urlsafe_b64encode as base64encode
from base64 import urlsafe_b64decode as base64decode
import time
from threading import Lock, RLock # used for thread safe sets and Trees

admin_secret="Priyanko_03"

#-------------------Utility classes--------------------------------------------

class LockedSet(set):
    """A set where add() and remove() are thread-safe"""

    def __init__(self, *args, **kwargs):
        self._lock = Lock()
        super(LockedSet, self).__init__(*args, **kwargs)

    def add(self, elem):
        with self._lock:
            super(LockedSet, self).add(elem)

    def remove(self, elem):
        with self._lock:
            super(LockedSet, self).remove(elem)

    # try to make a thread safe way to access all items
    def getAll(self):
        count = 0
        with self._lock:
            retval = [];
            for item in self:
                retval.append(item)
                count = count + 1
            return count,retval

def rightAdjustForAES(input_text):
    if len(input_text) <= 16:
        return input_text.rjust(16)
    elif len(input_text) <= 32:
        return input_text.rjust(32)
    elif len(input_text) <= 48:
        return input_text.rjust(48)
    else:
        return input_text.rjust(64)
#password = currenttime + admin_secret input_text=uid
def encryptAES(password,input_text):
    textplain = rightAdjustForAES(input_text)
    secret = rightAdjustForAES(password + admin_secret)
    cipher = AES.new(secret,AES.MODE_ECB)
    result = base64encode(cipher.encrypt(textplain)).decode("utf-8")
    return result

#password = currenttime + admin_secret input_text=uid
def decryptAES(password, input_text):
    secret= rightAdjustForAES(password + admin_secret)
    cipher = AES.new(secret,AES.MODE_ECB)
    result = cipher.decrypt(base64decode(input_text.encode("utf-8"))).decode("utf-8")
    return result

def generateUniqueId(text):
    print("generateUniqueId:text: %s" % text)
    result = zlib.crc32(text.encode('utf-8'))
    uid = str(result)
    return uid

