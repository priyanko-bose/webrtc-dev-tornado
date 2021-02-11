/*This file includes all javascript functions performed from GUI */

function JoinRoom(username, roomurl){
    var addUrl = document.location.protocol + "//" +document.location.host + "/joinroom/";
    $.ajax({
        type : "POST",
        async : true,
        url : addUrl,
        data : {
           'roomurl' : roomurl,
           'username' : username,
        },
        success : function(result) {
            console.log(result);
            var jsonObject = null;
 	     jsonObject = jQuery.parseJSON(result);
	     if (jsonObject == null) {
	        $('#errorMessageHome').text('Data sent by the server is invalid');
	        console.log('JSON parsing error');
	     }
            else{
                if(jsonObject.status == true){
                    loginurl  = document.location.protocol + "//" +document.location.host + '/meetin/'+ jsonObject.roomid + "?user=" + jsonObject.uid;
		    window.location.replace(loginurl);
                }
                else{
                    errMsg = jsonObject.errMsg;
                    $('#errorMessageHome').text(errMsg);
                    console.log(errMsg);
                }
            }
        },
        error : function() {
           console.log("failed to connect to portal server");
        }
    });
    return true;
}

function CreateRoom(username, roomname ){
    var addUrl = document.location.protocol + "//" +document.location.host + "/createroom/";
    $.ajax({
        type : "POST",
        async : true,
        url : addUrl,
        data : {
           'roomname' : roomname,
           'username' : username,
        },
        success : function(result) {
            console.log(result);
            var jsonObject = null;
 	     jsonObject = jQuery.parseJSON(result);
	     if (jsonObject == null) {
	        $('#errorMessageHome').text('Data sent by the server is invalid');
	        console.log('JSON parsing error');
	     }
            else{
                if(jsonObject.status == true){
                   loginurl  = document.location.protocol + "//" +document.location.host + '/meetin/' + jsonObject.roomid + "?user=" + jsonObject.uid;
		   window.location.replace(loginurl);
                }
                else{
                    errMsg = jsonObject.errMsg;
                    $('#errorMessageHome').text(errMsg);
                    console.log(errMsg);
                }
            }
        },
        error : function() {
           console.log("failed to connect to portal server");
        }
    });
    return true;
}


/* All functions related to Home page  UI */

function resetHomeUI(){
    $('#user-name-create').val("");
    $('#room-name-create').val("");
    $('#user-name-join').val("");
    $('#room-url-join').val("");
    $('#errorMessageHome').val("");
}

jQuery(document).ready(function($){
    resetHomeUI();  
});

$('#join-button').on('click',function(event){
    var roomurl = $('#room-url-join').val().trim();
    var username = $('#user-name-join').val().trim();
    if( roomurl == undefined || roomurl == "" || roomurl == null)
	alert("Enter some valid roomurl");
    else if( username == undefined || username == "" || username == null)
	alert("Enter some valid username ");
    else {
        JoinRoom(username , roomurl);
    }
    resetHomeUI();
});

$('#create-button').on('click',function(event){
    var username = $('#user-name-create').val().trim();
    var roomname = $('#room-name-create').val().trim();
    if( roomname == undefined || roomname == "" || roomname == null)
	alert("Enter some valid room name");
    else if( username == undefined || username == "" || username == null)
	alert("Enter some valid username ");
    else{
	CreateRoom(username , roomname );
    }
    resetHomeUI();
});

//
var unloadEvent = window.attachEvent || window.addEventListener;
var chkevent = window.attachEvent ? 'onbeforeunload' : 'beforeunload'; /// make IE7, IE8 compitable
unloadEvent(chkevent, function(e) { // For >=IE7, Chrome, Firefox
    logoffFromSigServer();
});
    


