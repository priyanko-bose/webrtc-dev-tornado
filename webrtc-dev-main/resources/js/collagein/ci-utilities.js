var setCookie = function(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

var getCookiebyName = function(cname){
    var pair = document.cookie.match(new RegExp(cname + '=([^;]+)'));
    return !!pair ? pair[1] : null;
};

var deleteCookie = function(cname){
    document.cookie = cname + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

var delayInMilliseconds = 1000; //1 second

/* Show the message in home tab status */
var showHomeTabStatusMsg = function(msg)
{
  $("#home-tab-header-status").text("");
  $("#home-tab-header-status").text(msg);

}

/* Show the message in home tab status header for one second */
var showHomeTabStatusMsgFortime = function(msg)
{
    $("#home-tab-header-status").text("");
    $("#home-tab-header-status").text(msg);
    $('#home-tab-header-status').fadeIn('slow', function(){
        $('#home-tab-header-status').delay(delayInMilliseconds).fadeOut(); 
    });
    $("#home-tab-header-status").text("");
}

var HashTable = function()
{

    var HashItem = function (key, value) {
        var self = new Object();
        self.key = key;
        self.value = value;
        return self;
    };

    var self = new Object();
    
    var items = [];

    self.length = function() {
        return items.length;
    };

    self.setItem = function(key, value)
    {
        for (var i = 0; i < items.length; i++) {
            if (items[i].key == key) {
                items[i].value = value;
            };
        };
        var newItem = HashItem(key, value);
        items.push(newItem);
    };

    self.getItem = function(key) {
        for (var i = 0; i < items.length; i++) {
            if(items[i].key == key)
            {
                return items[i].value;
            };
        }
        return null;
    }

    self.removeItem = function(key)
    {
        for (var i = 0; i < items.length; i++) {
            if(items[i].key == key)
            {
                items.splice(i, 1); // remove item from the array
                return;
            };
        };
    }

    self.values = function() {
        var copyOfValues = [];
        for (var i = 0; i < items.length; i++) {
            copyOfValues.push(items[i].value);
        };
        return copyOfValues;
    };

    self.clear = function()
    {
        items = [];
    };

    return self;
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function enableBtn(btnId)
{
	document.getElementById(btnId).disabled = false;
}

function disableBtn(btnId)
{
	document.getElementById(btnId).disabled = true;
}

function genUniqueId(username, roomname)
{
	var roomNameStr = username + roomname;
	var roomId = roomNameStr.toString('base64');
	return roomId;
}

function genRoomDivName(roomName) {
    return "roomblock_" + roomName;
}

function genRoomOccupantName(roomName) {
    return "roomOccupant_" + roomName;
}

function resolveMyIPOLD(onIPCallback)
{
    var dummyPeerConn = new RTCPeerConnection({iceServers:[]}), noop = function(){};
    //create a dummy data channel
    dummyPeerConn.createDataChannel("");    
    // create offer and set local description
    dummyPeerConn.createOffer(dummyPeerConn.setLocalDescription.bind(dummyPeerConn), noop);    
    dummyPeerConn.onicecandidate = function(ice){  //listen for candidate events
        if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
        var myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate);
        onIPCallback(myIP);   
        dummyPeerConn.onicecandidate = noop;
        dummyPeerConn.close();
    };
}
function resolveMyIP(onIPCallback)
{
    $.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
	if (!data) return;
        console.log(data);	
	var myIP =  data.match(/ip=(.*)/)[1];
        console.log(myIP);	
	onIPCallback(myIP);
    });
}

function logToConsole() {
	var args = [];
	if(arguments.length) {
		args = Array.from(arguments);
		args.splice(0, 0, new Date().toISOString() + ": "); 
	};
	console.log.apply(console, args);
};


function logWarn() {
        var args = [];
	if(arguments.length) {
		args = Array.from(arguments);
		args.splice(0, 0, new Date().toISOString() + ": "); 
	};
	console.warn.apply(console, args);
};


// error function for catch() blocks
function logError() {
        var args = [];
	if(arguments.length) {
		args = Array.from(arguments);
		args.splice(0, 0, new Date().toISOString() + ": "); 
	};
	console.error.apply(console, args);
};
