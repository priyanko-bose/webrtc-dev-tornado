var wsClient = null;
var loginToSigServer = function ()
{
    var userid = $('#userid').val().trim();
    var username = $(".top-right-menu-text").text();
    var ret = false;
    if(userid == "")
        alert("Could not get the session token");
    else{
	//wsClient = CreateClient("ws://konnectordev.cloudapp.net:8080/ws/",
        //wsClient = CreateClient("wss://ec2-13-233-35-129.ap-south-1.compute.amazonaws.com:8443/ws/",
        var wsPath = $('#wsPath').val();
        wsClient =   CreateClient(wsPath, userid,username, onOperationSuccees, onOperationFailed);
    }
    if(wsClient == null)
        alert("Could not create WS Client");
    else
        ret = wsClient.loginToSigServer();    
}

var logoffFromSigServer = function()
{
    if(wsClient == null)
        alert("WS Client not present");
    else
        wsClient.logoffFromSigServer();
    wsClient = null;
}

var getVideoObject = function(userid,username,isOwnVideo)
{
    var videoObject = null;
    if(isOwnVideo){
    	var vSrcUserId = document.getElementById("locVideoSrcUserId");
    	$(vSrcUserId).text(userid);
    	var vSrcUserName = document.getElementById("locVideoSrcUserName");
    	$(vSrcUserName).text(username);
	videoObject = document.getElementById("locVideoSrc");
    }
    else
    {
    	var vSrcUserId = document.getElementById("remVideoSrcUserId");
    	$(vSrcUserId).text(userid);
    	var vSrcUserName = document.getElementById("remVideoSrcUserName");
    	$(vSrcUserName).text(username);
	videoObject = document.getElementById("remVideoSrc");
    }
    return videoObject;
}

var onOperationSuccees = function(operation="", msg)
{
    if(operation == "login"){
        console.log("User " + msg + " logged in successfully");
	var ownUserName = wsClient.getOwnUserName();
        var ownUserId = wsClient.getOwnUserId();
        var ownVideoSrc = getVideoObject(ownUserId, ownUserName,1);
        if(ownVideoSrc == null){
            alert("No more video could be allocated");
            return;
        }
        wsClient.startOwnCamera(ownVideoSrc,"MyVideo");
        var peerId = "";
        var isHost = $("#ishost").val();
        var partListText = $('#participantsId').val();
        if(isHost &&  partListText != ""){
	    var partList = partListText.split(",");
	    if(partList != undefined && partList != null
		&& partList.length > 1 && partList[0] != ""){
		peerId = partList[0];
            }
        }
	if(peerId  != "")
	   wsClient.connectCall(ownUserId , peerId);
    }
    else if(operation == "call"){
        showHomeTabStatusMsgFortime("User " + msg + " joined the call");
    }
    else if(operation == "connectcall"){
        var msgJObj = msg;
        if(msgJObj.method == "res"){
            if(msgJObj.accepted == true){ 
               console.log("accepted:true");
               showHomeTabStatusMsgFortime("User " + msg + " joined the call");
               var remoteVideoSrc = getVideoObject(msgJObj.fromuserid,msgJObj.fromusername);
               if(remoteVideoSrc == null){
                  alert("No more video could be allocated");
                  return;
               }
               wsClient.performCall(msgJObj.fromuserid, msgJObj.fromusername,remoteVideoSrc);
            }
        }
        if(msgJObj.method == "req"){
            var accpt = true;
            //accpt = confirm('Accept call from' + msgJObj.fromusername + '?');
            var fromuserid = msgJObj.fromuserid;
            if(accpt){
              //priybose var ownUserName = $(".top-right-menu-text").text();
              //var ownVideoSrc = getVideoObject(ownUserId,ownUserName);
	      var ownUserName = wsClient.getOwnUserName();
              var ownUserId = wsClient.getOwnUserId();
              var remoteVideoSrc = getVideoObject(msgJObj.fromuserid,msgJObj.fromusername, 0);
              if(remoteVideoSrc == null){
                  alert("No more video could be allocated");
              }
              showHomeTabStatusMsg("Establishing call...");
              wsClient.acceptCall(ownUserId, ownUserName, msgJObj.fromuserid,msgJObj.fromusername, remoteVideoSrc);
           }
           else{
           }
           
       }
    }
    else if(operation == "endcall"){
    }
    else if (operation == "chat"){
        data = '';
        data = msg;
        if(data != ''){
            var htmlData = '<span><a href="#0" class="user-icon-small img-replace">usr</a><span  class="one-typed-line">'
                            + data
                            + '</span></span><br>';
            $('.typed-message-section').append(htmlData);
        }
    }
}

var onOperationFailed = function(operation="", msg="")
{
    if(operation == "login"){ 
        showHomeTabStatusMsg(msg);
    }
    else if(operation == "call"){
        showHomeTabStatusMsg(msg);
    }
    else if(operation == "endcall"){
        showHomeTabStatusMsg(msg);
    }
}

function setErrorMsg(errMsg=''){
    $("#errorMessageRoom").html(errMsg);
}

function resetSignUpForm(){
    $('#firstName').val("");
    $('#lastName').val("");
    $('#emailId').val("");
    $('#password').val("");
    $('#signup').find("label").each(function() {
        $(this).removeClass("active");
    });
}

function resetSignInForm(){
    $('#userLogin').val("");
    $('#userPassword').val("");
    $('#login').find("label").each(function() {
    	$(this).removeClass("active");
    });
}
function sendChatData(data){
    wsClient.sendChatData(data);
}
jQuery(document).ready(function($){
	$('#send-input').on('click',function(event){
          //sendMessageToOthers();
          var data = $('textarea#type-input')[0].value;
          if(data.trim() == ""){
            $('textarea#type-input')[0].value = "";
            return;
          }
          var htmlData = '<span><a href="#0" class="user-icon-small img-replace">usr</a><span  class="one-typed-line">'
                           + '<i style="font-style: italic;">me: </i>' + data
						   + '</span></span><br>';
		  sendChatData(data);
          $('.typed-message-section').append(htmlData);
          $('textarea#type-input')[0].value = "";
	});
	$("#type-input").on('keyup',function(evt) {
           if (evt.keyCode == 13) {
             if(evt.shiftKey){
                 $('textarea#type-input')[0].value + "\n";
             } else {
                 $("#send-input").click();     
             }
           }
           evt.stopPropagation();
	});
        function publishVideo(val) {
	   var vidElem = document.getElementById('locVideoSrc');
           var stream = vidElem.srcObject;
           var tracks = stream.getVideoTracks();
           tracks.forEach(function(track) {
    		track.enabled = !track.enabled;
  	   });
        }
	$('#vidIcon').click(function(){
           publishVideo($(this).hasClass("fa-video-slash"));    
    	   $(this).toggleClass("fa-video-slash");
           $(this).toggleClass("fa-video");
        });
	function publishAudio(val) {
	   var vidElem = document.getElementById('locVideoSrc');
           var stream = vidElem.srcObject;
           var tracks = stream.getAudioTracks();
           tracks.forEach(function(track) {
    		track.enabled = !track.enabled;
  	   });
        }
	$('#micIcon').click(function(){
           publishAudio($(this).hasClass("fa-microphone-slash"));    
    	   $(this).toggleClass("fa-microphone-slash");
           $(this).toggleClass("fa-microphone");
        });
	//---Room id display modal----
	var modal = document.getElementById("roomModal");
	// Get the <span> element that closes the modal
	var span = document.getElementById("roomModalClose");
	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
  		modal.style.display = "none";
	}
 	modal.style.display = "block";
	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
  	   if (event.target == modal) {
    	   	modal.style.display = "none";
  	   }
	}
	//------------------
	loginToSigServer();
});
