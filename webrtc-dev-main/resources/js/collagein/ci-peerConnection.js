var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

var mediaConstraints = {
    mandatory: {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
    },
    'offerToReceiveAudio': true,
    'offerToReceiveVideo': true    
};

var PeerConnection = function(sigServerConn, localUserId, targetUserId,
	                       targetUserName, iceConfig, localStream,
	                        onCallSuccessFn, onCallFailedFn, onRecvChatDataFn) {
    var self = new Object();
    self.rtcPeerConn = null;
    self.sigServerConn = sigServerConn;
    self.localUserId = localUserId;
    self.targetUserId = targetUserId;
    self.targetUserName = targetUserName;
    self.iceConfig = iceConfig;
    self.localStream = localStream;
    self.remoteStream = null;
    self.onCallSuccess = onCallSuccessFn;
    self.onCallFailure = onCallFailedFn;
    self.dataChannel = null;
    self.onRecvChatData = onRecvChatDataFn;
    var initializeTime = Date.now();  // if datachannel is not working after an elapsed time, then mark this connection as a failure

    var commonRTCSetup = function() {
		if(self.rtcPeerConn != null) {
			logError("Can not setup more than one PeerConnection for each object");
			self.onCallFailure(self.targetUserName + " can not be called more than once.");
                     return;
		};
        self.rtcPeerConn = new RTCPeerConnection(self.iceConfig);

		self.rtcPeerConn.ondatachannel = function(event) {
			logToConsole("Got Data channel event");
			self.dataChannel = event.channel;
			if(self.dataChannel){
				self.dataChannel.onopen = function(event) {
					self.dataChannel.send('Hi back!');
				}
				self.dataChannel.onmessage = function(event) {
					self.onRecvChatData(event.data);
				console.log(event.data);
				}
			}
		}
		self.rtcPeerConn.onnegotiationneeded = function() {
			logToConsole('renegotiation needed');
			self.rtcPeerConn.createOffer(creatOfferSuccess ,creatOfferFailure, mediaConstraints);
		}
        self.rtcPeerConn.onsignalingstatechange = function(event) {
            logToConsole("rtcPeerConn.onsignalingstatechange:[" + self.targetUserId + "]:", self.rtcPeerConn.signalingState); 
        };

        /*self.rtcPeerConn.oniceconnectionstatechange = function() {
	     if(self.rtcPeerConn.iceConnectionState == 'failed' || self.rtcPeerConn.iceConnectionState == 'closed') {
	         logWarn("rtcPeerConn.oniceconnectionstatechange:[" + self.targetUserId + "]:", self.rtcPeerConn.iceConnectionState); 
                self.close();
            }
	    };*/

	    // Setup ice handling 
	    self.rtcPeerConn.onicecandidate = function (event) { 
	        if (event.candidate != null) { 
	     	    var message = {};
	     	    message.type = 'candidate', 
			    message.fromuserid = self.localUserId;
			    message.candidate = event.candidate;
	   		    message.touserid = self.targetUserId;
	            //self.sigServerConn.queueMessageToSend(message); 
	            self.sigServerConn.wsConn.send(JSON.stringify(message)); 
	        }
	    }

	    self.rtcPeerConn.ontrack = function (event) {
            if (event.streams[0]) {
                self.onCallSuccess(event.streams[0],self.targetUserId, self.targetUserName);
                console.log('ontrack:  received remote stream');
            }
		}
		/* for mozilla*/
		if(self.localStream != null){
	    	self.localStream.getTracks().forEach(
            	function(track) {
                	self.rtcPeerConn.addTrack(track,self.localStream);
            	}
			);
		}
		/* for chrome*/
        /*if(self.localStream != null){
            self.rtcPeerConn.addStream(self.localStream);
        }*/
	};

    self.sendChatData = function(ownUserName, data){
		if(self.dataChannel){
			self.dataChannel.send(ownUserName + ': ' +data);
		}
    }
    self.setLocalStream = function(stream){
		self.localStream = stream;
		/* for chrome*/
		//self.rtcPeerConn.addStream(self.localStream);
		/* for mozilla*/
		self.localStream.getTracks().forEach(
			function(track) {
				self.rtcPeerConn.addTrack(track,self.localStream);
			}
		);
    }

    var createDescription = function(description) {
    	console.log(description)
        self.rtcPeerConn.setLocalDescription(description).then(function() {
		        // Send the offer to the remote peer through the signaling server
		    var message = {};
		    message.type = description.type, 
		    message.fromuserid = self.localUserId;
		    message.touserid = self.targetUserId;
		    if (description.type == 'offer'){
		        message.offer = self.rtcPeerConn.localDescription;
		    }
		    else if (description.type == 'answer'){
		        message.answer = self.rtcPeerConn.localDescription;
		    }
		    //self.sigServerConn.queueMessageToSend(message);
		    self.sigServerConn.wsConn.send(JSON.stringify(message));
		}).catch(logError);
    }
    var creatOfferSuccess = function (desc)
    {
        createDescription(desc);
    }
    var creatOfferFailure = function (reason)
    {
        // An error occurred, so handle the failure to connect
        logError(reason);
    }

	self.establishConnection = function() {
		if(self.rtcPeerConn == null) {
			logError({"name": "PeerConnection", "error": "commonRTCSetup() must be called prior to establishConnection."});
			self.onCallFailure(self.targetUserName + " can not be called more than once.");
                     return;
		};
		//commonRTCSetup();
		logToConsole("Creating Data channel event");
		self.dataChannel = self.rtcPeerConn.createDataChannel("chat");
		if(self.dataChannel){
			self.dataChannel.onopen = function(event) {
				self.dataChannel.send('Hi you!');
			}
			self.dataChannel.onmessage = function(event) {
			        self.onRecvChatData(event.data);
				console.log(event.data);
			}
		}
	    self.rtcPeerConn.createOffer(creatOfferSuccess ,creatOfferFailure, mediaConstraints);
	};

	self.createAnswer = function(offer){
		self.rtcPeerConn.setRemoteDescription(new RTCSessionDescription(offer)).then(
			function () {
	   		    self.rtcPeerConn.createAnswer().then(createDescription).catch(logError); 
	   		}
	   	).catch(logError);
	}
	self.establishConnectionFromOffer = function(offer) {
		if(self.rtcPeerConn != null) {
			logError({"name": "KPeerConnection", "message": "establishConnectionFromOffer() called more than once."});
			return;
		};
		commonRTCSetup();

		//create an answer to an offer 
		/*self.rtcPeerConn.setRemoteDescription(new RTCSessionDescription(offer)).then(
			function () {
	   		    self.rtcPeerConn.createAnswer().then(createDescription).catch(logError); 
	   		}
		   ).catch(logError);*/
		self.createAnswer(offer);
	};
 
	//when we got an answer from a remote user 
	self.handleAnswer = function(answer) { 
	    self.rtcPeerConn.setRemoteDescription(new RTCSessionDescription(answer))
	    .then(function () {
	       logToConsole("Processed answer!");
	    })
	    .catch(logError); 
	};
 	
	//when we got an ice candidate from a remote user 
	self.handleCandidate = function(candidate) { 
		self.rtcPeerConn.addIceCandidate(new RTCIceCandidate(candidate))
		.then(function () {
    		logToConsole("Processed Ice candidate!");
		})
		.catch(logError); 
	};

	self.isDataChannelOpen = function() { 
		if(self.kChannelMessaging != null && self.kChannelMessaging.channel.readyState == "open") {
			return true;
		};
		return false;
	};

	self.isDataChannelFailed = function() {
		if(self.kChannelMessaging != null && self.kChannelMessaging.channel.readyState == "open") {
			return false; // good to go (common case)
		};

		// check setup time elapsed
		var timeSinceInitialize =  Date.now() - initializeTime;
		if(timeSinceInitialize < KComm.DataChannelSetupMaxDurationMillisec) {
			// could still be setting up the datachannel, so not failed yet
			return false;
		};
		
		// Failed - not open and expired setup duration
		return true;
	};


	// stop all WebRTC activity and close channel
	self.close = function() {
		self.rtcPeerConn.onicecandidate = function (event) {};
		self.rtcPeerConn.onnegotiationneeded = function() {};
		self.handleCandidate = function(candidate) {}; 
		self.establishConnection = function () {};
		self.establishConnectionFromOffer = function(offer) {};
		if(self.rtcPeerConn.signalingState != "closed") {
			self.rtcPeerConn.close();
		};
	};
	//Setup RTCPeerConnection object
	commonRTCSetup();
	return self;
};
