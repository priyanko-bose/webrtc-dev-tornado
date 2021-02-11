var SignalServerConn = function(webSocketURL) {
    var self = new Object();
    self.url = webSocketURL;
    self.authkey= "";
    self.wsConn = null;
    self.loggedIn = false;
    self.myIpAddress = "";

    var outMessageQueue = [];
    var outMessage = null;
    var lastMetricsSentTime = null;
    var lastMetricsAckReceivedTime = null;
    // Send metrics periodically and check for ack response from signaling server
    var keepAliveIntervalID = null;
    var ackKeepAliveIntervalID = null;
    var outMessageQueue = [];
    
    self.onLoginSuccess = null;
    self.onLoginFailure = null ;


    // queued send to signaling server
    self.queueMessageToSend = function(jsonMessage) {
        outMessageQueue.push(jsonMessage);
        checkMessageQueue();
    };

    var checkMessageQueue = function() {
        if(outMessageQueue.length == 0 || self.loggedIn == false || self.wsConn == null || self.wsConn.readyState != 1) {
            // the queue is empty or comm is reconnecting, so return;
            return;
        };

       if(outMessage != null) {
            // still waiting to send last message, so return to avoid multiple wait loops;
            return;
        };

    	 // ready to send next message - try to send it
        outMessage = outMessageQueue[0];
	 try {
	     self.wsConn.send(JSON.stringify(outMessage)); 
	 } 
	 catch(e) {
	     logError(e);
	 }

        var waitForSendToComplete = function() {
            if(outMessage == null || outMessageQueue.length == 0) {
                // queue is empty or connection may have been reset - stop looping
        	  outMessage = null;
        	  return;
            };
            // we need to be logged in and ready before sending out any queued messages
	     if(self.loggedIn == true && self.wsConn != null && self.wsConn.readyState == 1 && self.wsConn.bufferedAmount == 0) {
	         // outgoing message was sent
		  outMessage = null;
		  outMessageQueue.shift(); 
		  if(outMessageQueue.length != 0) {
		      checkMessageQueue(); // send next message
		  };
		  return;
            };
	     // still waiting ...
            setTimeout(function() {waitForSendToComplete();}, 200);
        };
        waitForSendToComplete();
    };


    self.connect = function (myIp, authkey, onLoginSuccessCB,onLoginFailureCB ) {
        self.onLoginSuccess = onLoginSuccessCB;
        self.onLoginFailure = onLoginFailureCB ;
        if(authkey == null || authkey == ""){
            logError({"name": "SigServerConn.connect()", "message": "authkey is null"});
            onLoginFailureCB("authkey is null");
            return;
        }
        if(myIp == "" || myIp == null){
            logError({"name": "SigServerConn.connect()", "message": "my ip is null"});
            onLoginFailureCB("my ip is null");
            return;
        }
        if(self.wsConn != null) {
	     logError({"name": "SigServerConn.connect()", "message": "connect() called more than once."});
             onLoginFailureCB("connect() called more than once.");
	     return;
         }
    
	 self.myIpAddress = myIp;
	 self.wsConn = new WebSocket(self.url);
         if(self.wsConn == null){
           self.myIpAddress = "";
           logError({"name": "SigServerConn.connect()", "message": "could not create web socket"});
           onLoginFailureCB("could not create web socket");
           return;
         }
      
         // configure the callback handlers
	 self.wsConn.onopen = function () { 
	    logToConsole("Connected to the signaling server at: " + self.url + " with my Ip: " + self.myIpAddress);
            // this is the first time connecting
            loginToSignalServer(authkey);
        };
        
        self.wsConn.onclose = function (event) { 
	    logWarn("Signal Connection Closed.  Reason:[" + event.reason + "] WasClean:[" + event.wasClean + "]"); 
	    stopPeriodicKeepAlive();
	    self.onDisconnect(); 
	 };
        
        self.wsConn.onerror = function (err) { 
	    logError("Signal Connection Error. Type:[" + err.type + "]   Closing Signal Connection..."); 
	    stopPeriodicKeepAlive();
	    var errMsg = err.type;
	    if(err.hasOwnProperty('message')) {
	        errMsg = err['message'];
	    };
 	    // web socket error - so close connection
	    self.wsConn.close(4001, errMsg);
            self.onDisconnect();
	 };
        self.wsConn.onmessage = function (msg) { 
	    logToConsole("Got signailing message", msg.data); 
	    var jsonData = JSON.parse(msg.data); 
	    switch(jsonData.type) { 
		case "ack": 
	 	    //acknowledgment from sending periodic metrics
		    // set ack time
		    lastMetricsAckReceivedTime = Date.now(); 
		    break;
		case "login":
		    self.loggedIn = true;
		    self.onLogin(jsonData);
		    startPeriodicKeepAlive();
		    break;
               case "connectcall": 
		    self.onConnectCall(jsonData);
		    break;
               case "offer": 
		    self.onOffer(jsonData);
		    break; 
	       case "answer":
		    self.onAnswer(jsonData);
		    break; 
		case "candidate": 
		    self.onIceCandidate(jsonData);
		    break; 
		case "error": 
		    self.onError(jsonData);
		    break; 
		default: 
		    break;
           };
        };
    };

    self.onLogin = function(jsonData) {
	 // override this for any actions
	 logError("SignalServerConn- Error: Must override onLogin()"); 
    };
    
    self.onDisconnect = function() {
        // override this for any actions
        logError("SignalServerConn- Error: Must override onDisconnect()"); 
        self.wsConn = null;
	self.loggedIn = false;
        self.url = "";
        self.userid = "";
        self.myIpAddress = "";
    };

    //received connect from signal server
    self.onConnectCall = function(jsonData) {
	 // override this for any actions
	 logError("SignalServerConn- Error: Must override onConnectCall()"); 
    };

    // received offer from signal server
    self.onOffer = function(jsonData) {
	 // override this for any actions
	 logError("SignalServerConn- Error: Must override onOffer()"); 
    };

    // received answer from signal server
    self.onAnswer = function(jsonData) {
        // override this for any actions
	 logError("SignalServerConn- Error: Must override onAnswer()"); 
    };

    // received Ice from signal server
    self.onIceCandidate = function(jsonData) {
	// override this for any actions
	logError("SignalServerConn- Error: Must override onIceCandidate()"); 
    };

    // received error from signal server
    self.onError = function(jsonData) {
	// override this for any actions
	logError("SigServerConn: Signal Server Error. Msg:[" + jsonData.msg + "]"); 
    };
    
    self.logoffFromSigServer = function(authkey){
        var loginJsonMsg = {type: "logout", userkey: authkey};
        // send message directly - do not queue message 
        self.wsConn.send(JSON.stringify(loginJsonMsg));
        if(self.wsConn != null) {
            self.wsConn.close(4000, "Page_Unloaded"); // signal server will look for this message
        };
        stopPeriodicKeepAlive();
        self.onDisconnect();
    }

    self.sendResponse = function(userId, userName, peerId, accpt){
        var loginJsonMsg = {type: "connectcall", method: "res", fromuserid: userId, fromusername:userName,touserid:peerId, accepted: accpt};
        self.wsConn.send(JSON.stringify(loginJsonMsg));
    }
   
    self.connectCall = function(userId, peerId){
        var loginJsonMsg = {type: "connectcall", method:"req", fromuserid:userId, touserid: peerId};
        self.wsConn.send(JSON.stringify(loginJsonMsg)); 
    }


    var loginToSignalServer = function(authkey) {
        var loginJsonMsg = {type: "login",myIpAddress: self.myIpAddress, userkey: authkey};
        // send message directly - do not queue message 
        self.wsConn.send(JSON.stringify(loginJsonMsg)); 
    };

    var sendPeriodicMetrics = function() {
	var message = {};
       message.type = 'keepalive';
       self.queueMessageToSend(message);
       lastMetricsSentTime = Date.now();
    };

    var startPeriodicKeepAlive = function() {
    	if(keepAliveIntervalID == null) {
 	    sendPeriodicMetrics();
	    keepAliveIntervalID = window.setInterval(sendPeriodicMetrics, 20000);
	};
    	/*if(ackKeepAliveIntervalID  == null) {
	    ackKeepAliveIntervalID  = window.setInterval(checkForFailedAckResponse, 5000);
	};*/
    };

    var stopPeriodicKeepAlive = function() {
    	/*if(ackKeepAliveIntervalID  != null) {
    	    clearInterval(ackKeepAliveIntervalID );
	    ackKeepAliveIntervalID  = null;
    	};*/
    	if(keepAliveIntervalID != null) {
	    clearInterval(keepAliveIntervalID);
	    keepAliveIntervalID = null;
    	};
    	lastMetricsSentTime = null; 
    	lastMetricsAckReceivedTime = null; 
    };

    return self;
}
