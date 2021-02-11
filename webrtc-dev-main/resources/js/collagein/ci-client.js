var CreateClient = function(sigServerURL, authkey ,username ,onSuccessFn, onFailureFn)
{
    var self = new Object();
    self.sigServerURL = sigServerURL;
    self.authkey = authkey; 
    self.onSuccessFn = onSuccessFn;
    self.onFailureFn = onFailureFn;

    self.ownUserName = username;
    self.ownUserId = userid;
    self.localVideo = null;
    self.remoteVideo= null;

    self.peerClient = null;
    self.localStream = null;

    self.peerInfo = new Object();
    self.peerInfo.caller = false;
    self.peerInfo.peerId = "";
    self.peerInfo.peerName = "";
    self.peerInfo.call_accepted = false;

    var constraints = {
        audio: true, 
        video: true,
    }
    /* Functions related to member variables */
    self.getOwnUserId = function(){
        return self.ownUserId;
    }

    self.getOwnUserName = function() {
        return self.ownUserName;
    }
    /*----- Functions related to Local media -----*/

    function getUserMediaSuccess(stream){
        var video = self.localVideo;
        video.srcObject = stream;
        self.localStream = stream;
        video.onloadedmetadata = function(e) {
            video.play();
        };
        self.peerClient.setPeerClientLocalStream(self.localStream, self.peerInfo.peerId);
        /*if(self.currentuser.set == true)
        {
             self.sendResponse(self.currentuser.ownUserId, self.currentuser.ownUserName, self.currentuser.peerId, self.currentuser.accepted);
             self.currentuser.set = false;
             self.currentuser.ownUserId = "";
             self.currentuser.ownUserName = "";
             self.currentuser.peerId = "";
             self.currentuser.accepted = false; 
        } priybose*/
    }

    function getUserMediaError(err){
        console.log("The following error occurred: " + err.name);
    }

    self.startOwnCamera = function(localVideo) {
        self.localVideo = localVideo;
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(getUserMediaError);
        }

    }
    /*functions related to data channel*/
    self.sendChatData = function(data){
        self.peerClient.sendChatData(self.ownUserId, self.ownUserName, self.peerInfo,data);
    }

    self.onRecvChatData = function(data){
        self.onSuccessFn("chat" , data);
    }
    /*----- Functions related to Login----- */

    self.loginToSigServer = function(){
        if(self.peerClient == null)
        {
              return False;
        } 
        self.peerClient.loginToSigServer(self.onLoginSuccess, self.onLoginFailure,
                                          self.onConnectCallSuccess, self.onConnectCallFailure,
                                          self.onCallSuccess, self.onCallFailure,
                                          self.onStopCallSuccess,self.onStopCallFailure, self.onRecvChatData);
        return true;
    }

    self.logoffFromSigServer = function(){
        if(self.peerClient == null)
        {
              return False;
        } 
        self.peerClient.logoffFromSigServer();
        self.ownUserId = "";
        self.sigServerURL = ""; 
        self.authkey= "";
        self.onSuccessFn = null;
        self.onFailureFn = null;
        self.ownUserName = "";
        self.localVideo = null;
        self.peerClient = null;
        self.localStream = null;
        return true;
    }

    self.onLoginSuccess = function(ownUserId="") {
        console.log('Requesting local stream');
        if (typeof onSuccessFn == 'function') { 
            self.ownUserId = ownUserId;
            self.onSuccessFn("login" , self.ownUserId);
        }
    }

    self.onLoginFailure = function(errMsg="") {
        if (typeof onFailureFn == 'function') { 
            self.onFailureFn("login" ,errMsg);
        }
    }

    /* ------Functions related to Call Connect------ */

    self.onConnectCallSuccess = function(message)
    {
         self.onSuccessFn("connectcall" , message);
    }
    self.onConnectCallFailure = function(errMsg){
       self.onFailureFn("connectcall" ,errMsg);
    }
    self.connectCall = function(userId, peerId){
        if(self.peerClient != null ){
             self.peerClient.connectCall(userId, peerId);
        }
    }

    self.sendResponse = function(userId, userName, peerId, accepted)
    {
        self.peerClient.sendResponse(userId, userName, peerId, accepted);
    }

    /* ------Functions related to Call------ */
    self.onCallSuccess = function(stream, peerId, peerName){
        if(self.remoteVideo != null){
             self.remoteVideo.srcObject = stream;
        }
        self.remoteVideo.onloadedmetadata = function(e){
          self.remoteVideo.play();
        }
        self.onSuccessFn("call" , peerName);
    }
    self.onCallFailure = function(errMsg){
       self.onFailureFn("call" ,errMsg);
    }
    self.performCall = function(peerId, peerName, remoteVideo){
        self.peerInfo.call_accepted = true;
        self.peerInfo.peerId = peerId;
        self.peerInfo.caller = false
        self.peerInfo.peerUserName = peerName;
        self.remoteVideo = remoteVideo;
        if(self.peerClient != null ){
             self.peerClient.performCall(peerId, peerName);
        }
    }
    
    self.acceptCall = function(ownUserId, ownUserName,fromuserid, fromusername, remoteVideoSrc){
        self.peerInfo.call_accepted = true;
        self.peerInfo.peerId = fromuserid;
        self.peerInfo.caller = false
        self.peerInfo.peerUserName = fromusername;
        self.remoteVideo = remoteVideoSrc;
        logToConsole("Accepted Call Setting up peerconnection for future offer", wsClient.peerInfo.call_accepted);
        self.peerClient.acceptCall(self.peerInfo.peerId, self.peerInfo.peerUserName);
        self.sendResponse(ownUserId, ownUserName, self.peerInfo.peerId, self.peerInfo.call_accepted);
    }

    self.onStopCallSuccess = function(peerId, peerName){
        /*Stop video */
        if(self.localVideo != null)
        {
            self.localVideo.pause();
            self.localVideo.srcObject = null;
        }
        /*if(self.localStream != null)
            self.localStream.stop();
        */
        var stream = self.localStream;
        if(!stream && !stream.stop && stream.getTracks) {
            stream.stop = function(){         
                this.getTracks().forEach(function (track) {
                    track.stop();
                });
            };
        }
        self.localVideo = null;
        self.onSuccessFn("endcall",peerName);
    }
    self.onStopCallFailure = function(errMsg){
       self.onFailureFn("endcall" ,errMsg);
    }
    self.stopCall = function(peerId){
        /* stop the video */
        /*lf.remoteVideo.pause();
        self.remoteVideo.srcObject = null;
        self.remoteVideo = null;*/
        if(self.peerClient != null ){
             self.peerClient.stopCall(peerId);
        }
    }

    /* Create Peer Client */
    self.peerClient = PeerClient(self.sigServerURL, self.authkey);
    return self;
}
