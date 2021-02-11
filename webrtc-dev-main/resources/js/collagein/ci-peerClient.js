DefaultIceConfiguration = { 
	//"iceServers": [{ "urls": ["stun:stun3.l.google.com:19302", "stun:stun4.l.google.com:19302"] }]
	'iceServers': [
    {'urls': 'stun:stun.services.mozilla.com'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
}; 
var PeerClient = function(signalingServerURL, authkey) {

    var peerConnections = HashTable();
    var sigServerConn = SignalServerConn(signalingServerURL);
    if(sigServerConn == null){
        peerConnections = null;
        return null;
    }
    var self = new Object();
    self.authkey= authkey;
    self.myIp = "";
    self.ownUserId = "";
    self.localStream = null;
    self.onCallSuccess = null;
    self.onCallFailure = null;
    self.onConnectCallSuccess = null;
    self.onConnectCallFailure = null;
    self.onStopCallSuccess = null;
    self.onStopCallFailure = null;
    self.onLoginSuccess = null;
    self.onLoginFailure = null;
    self.onRecvChatData = null;

    sigServerConn.onLogin = function(msgData) {
        self.ownUserId = msgData.userid;
        // possible external hook
        if (self.onLoginSuccess != null) { 
            self.onLoginSuccess(self.ownUserId);
        };
    };

    sigServerConn.onConnectCall = function(msgData){
        self.onConnectCallSuccess(msgData)
    }

    self.connectCall = function(userId, peerId)
    {   
        sigServerConn.connectCall(userId,peerId);
    }

    self.sendResponse = function(userId, userName, peerId, accepted)
    {
        sigServerConn.sendResponse(userId, userName, peerId, accepted);
    }

    //when somebody sends us an offer 
    sigServerConn.onOffer = function(msgData) {
        var peerUserId = msgData.fromuserid;
        var peerConn = null;
        //Starting a peer connection 
        // see if we already have a connection to this node
        if((peerConn = peerConnections.getItem(peerUserId)) != null) {
           logToConsole("We already have a connection for peerUserId sending answer:[" + peerUserId + "]");
           peerConn.createAnswer(msgData.offer);
           return;
        }
        /*var peerConn = PeerConnection(sigServerConn , self.ownUserId , peerUserId,"testname",
                                         DefaultIceConfiguration, self.localStream,
                                             self.onCallSuccess, self.onCallFailure); 

        // put this new rtcPeer connection into our hashtable of connections
        peerConnections.setItem(peerUserId, peerConn);*/
        logToConsole("Got offer establishing connection from offer", msgData.fromuserid);
        peerConn.establishConnectionFromOffer(msgData.offer);   
    };

    sigServerConn.onAnswer = function(msgData) {
        var peerConn = peerConnections.getItem(msgData.fromuserid);
        if(peerConn != null) {
            peerConn.handleAnswer(msgData.answer); 
        };
    };

    //when a remote peer sends an ice candidate to us
    sigServerConn.onIceCandidate = function(msgData) {
        var peerConn = peerConnections.getItem(msgData.fromuserid);
        if(peerConn != null) {
            peerConn.handleCandidate(msgData.candidate); 
        };
    };
   
    sigServerConn.onDisconnect = function() {
        // attempt a reconnect
        //setTimeout(sigServerConn.connect, 2000, sigServerConn.myIpAddress);  // try again in a bit
    };

    sigServerConn.onError = function(msgData){
        if (typeof onLoginSuccessFn == 'function') { 
            onLoginFailure(msgData.msg);
        }
    }
    
   var onResolvedIP = function(myIpAddress) {
        self.myIp = myIpAddress;
        sigServerConn.connect(self.myIp, self.authkey, self.onLoginSuccess,self.onLoginFailure);
    };


    self.setPeerClientLocalStream = function(localStream, peerId){
        self.localStream = localStream;
        //for (var i = 0, vals = peerConnections.values(), len = vals.length; i < len; i++) {
        //    vals[i].setLocalStream(localStream);; 
        //}
        if(pConn = peerConnections.getItem(peerId)){
            pConn.setLocalStream(localStream);
        }

    }

    self.loginToSigServer = function(onLoginSuccessCB,onLoginFailureCB,
                                      onConnectCallSuccessCB,onConnectCallFailureCB,
                                      onCallSuccessCB,onCallFailureCB,
                                      onStopCallSuccessCB, onStopCallFailureCB, onRecvChatDataCB)
    {
        self.onLoginSuccess = onLoginSuccessCB;
        self.onLoginFailure = onLoginFailureCB;
        self.onConnectCallSuccess = onConnectCallSuccessCB;
        self.onConnectCallFailure = onConnectCallFailureCB;
        self.onStopCallSuccess = onStopCallSuccessCB;
        self.onStopCallFailure = onStopCallFailureCB;
        self.onCallSuccess = onCallSuccessCB;
        self.onCallFailure = onCallFailureCB;
	self.onRecvChatData = onRecvChatDataCB;    
	    resolveMyIP(onResolvedIP);
    }

    self.logoffFromSigServer = function() {
         
        // also, try to close any peer connections, usually the page is unloaded before the close requests can complete.
        for (var i = 0, vals = peerConnections.values(), len = vals.length; i < len; i++) {
            self.stopCall(vals[i].targetUserId); 
        };
        sigServerConn.logoffFromSigServer(self.authkey);
        self.onLoginSuccess = null;
        self.onLoginFailure = null;
        self.onConnectCallSuccess = null;
        self.onConnectCallFailure = null;
        self.onCallSuccess = null;
        self.onCallFailure = null;
        self.onStopCallSuccess = null;
        self.onStopCallFailure = null;

        peerConnections = null;
        sigServerConn = null;
        self.myIp = "";
        self.ownUserId = "";
        self.localStream = null;

    };

    self.performCall = function(peerUserId, peerName){
        if(peerConnections.getItem(peerUserId )) {
                logError("We already have a peer connection for peerUserId :[" + peerUserId + "]");
                return;
        }
        var peerConn = PeerConnection(sigServerConn ,self.ownUserId, peerUserId , peerName,
                                         DefaultIceConfiguration, self.localStream,
                                            self.onCallSuccess, self.onCallFailure, self.onRecvChatData);
        // put this new connection into our hashtable of connections
        peerConnections.setItem(peerUserId, peerConn);
        peerConn.establishConnection();
    }
    
    self.acceptCall = function(peerUserId, peerName){
        if(peerConnections.getItem(peerUserId )) {
                logError("We already have a peer connection for peerUserId :[" + peerUserId + "]");
                return;
        }
        var peerConn = PeerConnection(sigServerConn ,self.ownUserId, peerUserId , peerName,
                                        DefaultIceConfiguration, self.localStream,
                                            self.onCallSuccess, self.onCallFailure, self.onRecvChatData);
        // put this new connection into our hashtable of connections
        peerConnections.setItem(peerUserId, peerConn);
    }

    self.sendChatData = function(ownUserId, ownUserName, peerInfo,data){
        peerConn = peerConnections.getItem(peerInfo.peerId);
        if(peerConn  != null ) {
            peerConn.sendChatData(ownUserName, data);
        }
    }

    self.stopCall = function(peerUserId)
    {
        var peerConn = null;
        peerConn = peerConnections.getItem(peerUserId);
        if(peerConn  == null ) {
                logError("There is no peer with Id :[" + peerUserId + "]");
                if(self.onStopCallFailure!= null)
                    self.onStopCallFailure("The user: " + peerConn.peerName + " is not in call");
        }
        else{
             peerConn.close();
             peerConnections.removeItem(peerUserId);
             if(self.localStream != null)
                 self.localStream = null;
             if(self.onStopCallSuccess != null)
                 self.onStopCallSuccess(peerUserId,peerConn);
        }
    }
    return self;
   
}
