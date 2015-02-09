var Snaphook = angular.module('Snaphook', []);
 

$( document ).ready(function() {
//	$( "#LobbyChatControllerOuter" ).mousedown(function() {
//		$('#LobbyChatInput').focus();
//	});
});

 function parseLinks(input) {

    var current=0;
    var output="";
    var found=0;
    var start=0;

    while (current<input.length) {

      var char = input.charAt(current);

      if (!found) {

        if (input.substring(current,current+4)=="www.") {

          start=current;
          output+="<a target=_blank href=\"http://";
          found=1;
        }

        if (input.substring(current,current+8)=="https://") {

          start=current;
          output+="<a target=_blank href=\"http://";
          found=1;
        }

        if (input.substring(current,current+7)=="http://") {

          start=current;
          output+="<a target=_blank href=\"";
          found=1;
        }


      } else {

        if (char==" ") {

          output+="\">" + input.substring(start, current) + "</a>";
          found=0;
        }
      }

      output+=char;
      current++;
    }

    if (found==1) output+="\">" + input.substring(start,current) + "</a>";

    return output;
 }

 function parseDecoration(input, what, insertbefore, insertafter) {

    var current=0;
    var output="";
    var found=0;

    while (current<input.length) {

      var char = input.charAt(current);

      if (!found) {

        if (input.substring(current,current+what.length)==what) {

	  current+=what.length;
          output+=insertbefore;
          found=1;
          continue;
        }
      } else {

        if (input.substring(current,current+what.length)==what) {

	  current+=what.length;
          output+=insertafter;
          found=0;
 	  continue;
        }
      }

      output+=char;
      current++;
    }

    if (found==1) output+="\">" + input.substring(start,current) + "</a>";

    return output;
 }

 function parseSize(input) {

   var output="";
   var current = 0;
   var dicksInARow=0;
   var stop=false;

   while (current <input.length) {

	var char = input.charAt(current);
	
	if (char=="<") stop=true;
	if (char==">" && stop) {
		stop=false;
	}

	if (!stop) {
		if (char=='\t' || char==" " || char=="." || char=="\n") dicksInARow=0; else dicksInARow++;

		if (dicksInARow==80) {

	       		dicksInARow=0;
			output+="<span style=\"font-size:0pt;\"> </span>";
		}
	}

	current++;
	output+=char;
   }

   return output;
 }

 function parse(input) {

    var output = parseLinks(input);
  
    return parseSize(output);
 }

 function log(msg)
 {
    $('#DebugInner').append("> " + msg + "<br/>");
    $("#DebugInner").scrollTop($("#DebugInner")[0].scrollHeight);
 }

 function AppendLobbyChat(from, msg)
 {
	var id=0;

	for (var a=0; a<from.length; a++) {
		id += from[a].charCodeAt(0);
	}
	id = id%8;		

	$('#ChatTable tr:last').after("<tr><td class=chat_nick style=\"text-align:right;\"><div class=text"+id+"><span style=\"color:rgba(0,0,0,0);font-size:0pt;\">&lt;</span>" + from + "<span style=\"color:rgba(0,0,0,0);font-size:0pt;\">&gt;</span></div></td><td class=chat_divider></td><td class=chat_body><div class=text"+id+">"+parse(msg)+"</div></td></tr>");

	$("#LobbyChatControllerInner").scrollTop($("#LobbyChatControllerInner")[0].scrollHeight);
 }


 Snaphook.controller('BBSHandler',
        function ($scope)
        {

        }
    );

 Snaphook.controller('LobbyChatController',
    function ($scope) {
        $scope.lobbymessaged = function(x)
        {
            if(x.which != 13)
                return;
            var body = $('#LobbyChatInput').val();
            var reply = $msg({to: 'lobby@conference.system', from: Snaphook.Connection.jid, type: 'groupchat'}).c("body","",body);
            Snaphook.Connection.send(reply.tree());
            
            $('#LobbyChatInput').val('');
        }

    }
);


 Snaphook.controller('MainWindowController',
    function ($scope) {
        $scope.ShowLobby =  function() { 
            $('#BoardRoomOuter').hide();
            $('#LobbyChatControllerOuter').show();
        }

        $scope.ShowBoardRoom =  function() { 
            $('#LobbyChatControllerOuter').hide();
            $('#BoardRoomOuter').show();
        }    
    }
);

GlobalLobbyRoster = [];

Snaphook.controller('CommunicationController', 
    function ($scope) 
    {
        $scope.BOSH_SERVICE = 'http://snaphook.se:7070/http-bind';
        $scope.Connection = null;
        $scope.JID = '';
        $scope.Snaphooker = '';

        $('#loginbutton').removeAttr("disabled");

        $scope.OnMessage = function(msg) {
            var connection = $scope.Connection;

            var to = msg.getAttribute('to');
            var from = msg.getAttribute('from');
            var type = msg.getAttribute('type');
            var elems = msg.getElementsByTagName('body');


            if (type == "groupchat" && elems.length > 0) {
                from = Strophe.getResourceFromJid(from);
                var body = elems[0];

                AppendLobbyChat(from, Strophe.getText(body));
                return true;
            }
            if (type == "chat" && elems.length > 0) {
                var body = elems[0];

                log('Chat message from ' + from + ': ' + 
                    Strophe.getText(body));
                
                return true;
            }
            return true;

        }


        $scope.OnPresence= function(pres)
        {
            log("on presence..")
        }

        $scope.OnRoster= function(roster)
        {
            log("on roster..");
            GlobalLobbyRoster.push(roster);
            log("/on roster..");
        }

        $scope.GotUsers= function(users)
        {
            // "<iq xmlns="jabber:client" from="lobby@conference.system" to="stefan@users" id="2:sendIQ" type="result"><query xmlns="http://jabber.org/protocol/disco#items"><item jid="lobby@conference.system/stefan" name="stefan"/><item jid="lobby@conference.system/dxmpp" name="dxmpp"/></query></iq>"
            log("GotUsers");
        }

        $scope.NotGotUsers= function(users)
        {
            log("NotGotUsers");
        }


        $scope.Connected = function()
        {
            var con = $scope.Connection;
            $('#LoginControllerOuter').fadeOut();
            con.muc.init($scope.Connection);

            con.muc.join('lobby@conference.system', $scope.Snaphooker, 
                null, $scope.OnPresence, $scope.OnRoster );

            log("joined lobby");

            con.muc.createInstantRoom("lobby@conference.system");

            con.muc.queryOccupants("lobby@conference.system", $scope.GotUsers, $scope.NotGotUsers)


            Snaphook.Connection = con;

		for (var a=0; a<60; a++) AppendLobbyChat("&nbsp;", "&nbsp;");

            $('#MainWindow').fadeIn();
	    $('#LobbyChatInput').focus();
        }

        $scope.OnConnect = function(status)
        {
            if (status == Strophe.Status.CONNECTING) {
                log('Connecting.');
            } else if (status == Strophe.Status.CONNFAIL) {
                log('Failed to connect.');
                $('#loginbutton').removeAttr("disabled");
            } 
            else if (status == Strophe.Status.AUTHFAIL) {
                log('Failed to authenticate.');
                $('#loginbutton').removeAttr("disabled");
            } else if (status == Strophe.Status.DISCONNECTING) {
                log('Disconnecting.');
                $('#loginbutton').removeAttr("disabled");
            } else if (status == Strophe.Status.DISCONNECTED) {
                log('Disconnected.');
                $('#loginbutton').removeAttr("disabled");
            } else if (status == Strophe.Status.CONNECTED) {
                log('Connected.');
                $scope.Connection.addHandler($scope.OnMessage, null, 'message', null, null,  null); 
                $scope.Connection.addHandler($scope.OnRoster, null, 'roster', null, null,  null); 
                $scope.Connection.send($pres().tree());
                $scope.Connected();                
            }            
        }

        $scope.OnAuthenticationFail = function ()
        {
            log('Failed to authenticate.');
            $('#loginbutton').removeAttr("disabled");
        }
        $scope.OnConnectFail = function ()
        {
            log('Failed to connect.');
            $('#loginbutton').removeAttr("disabled");
        }
         $scope.OnDisconnected = function ()
        {
            log('Disconnecting.');
            $('#loginbutton').removeAttr("disabled");
        }



        $scope.OnConnectRegister = function(status)
        {
            if(status == Strophe.Status.REGISTER)
            {
                $scope.Connection.register.fields.username = $('#username').val();
                $scope.Connection.register.fields.password = $('#password').val();
                $scope.Connection.register.submit();
            }
            else if(status == Strophe.Status.REGISTERED)
            {
                log("registered!");
            }
            else if (status == Strophe.Status.CONNECTING) 
            {
                log('Connecting.');
            } 
            else if (status == Strophe.Status.CONNFAIL) 
            {
                $scope.OnConnectFail();
            } 
            else if (status == Strophe.Status.AUTHFAIL) 
            {
                $scope.OnAuthenticationFail();
            } 
            else if (status == Strophe.Status.DISCONNECTING) 
            {
                $scope.OnDisconnected();
            } 
            else if (status == Strophe.Status.DISCONNECTED) 
            {
                $scope.OnDisconnected();
            } 
            else if (status == Strophe.Status.CONNECTED) 
            {
                log('Connected.');
                $scope.Connection.addHandler($scope.OnMessage, null, 'message', null, null,  null); 
                $scope.Connection.addHandler($scope.OnRoster, null, 'roster', null, null,  null); 
                $scope.Connection.send($pres().tree());
                $scope.Connected();                
            }            
        }
        $scope.Login =  function() { 
                $('#loginbutton').attr("disabled", "disabled");
                $scope.Connection = new Strophe.Connection($scope.BOSH_SERVICE);
                $scope.Snaphooker= $('#username').val();
                $scope.JID =  $scope.Snaphooker + '@snaphookers';
                $scope.Connection.connect($scope.JID, $('#password').val(), $scope.OnConnect);
            }


         $scope.Register =  function() { 
                log("will register");
                $('#loginbutton').attr("disabled", "disabled");
                $scope.Connection = new Strophe.Connection($scope.BOSH_SERVICE);
                $scope.Snaphooker= $('#username').val();
                $scope.JID =  $scope.Snaphooker + '@snaphookers';

                  var callback = function (status) {
                    if (status === Strophe.Status.REGISTER) {
                        $scope.Connection.register.fields.username = $('#username').val();
                        $scope.Connection.register.fields.password = $('#password').val();
                        $scope.Connection.register.submit();
                    } else if (status === Strophe.Status.REGISTERED) {
                        log("registered!");
                        connection.authenticate();
                    } else if (status === Strophe.Status.CONNECTED) {
                        log("logged in!");
                    } else {
                        log("no idea");
                        // every other status a connection.connect would receive
                    }
                };    

                //$scope.Connection.connect($scope.JID, $('#password').val(), $scope.OnConnectRegister);

                  

                log("calling register connect");
                $scope.Connection.register.connect("snaphookers", $scope.OnConnectRegister, 60, 1);
                log("called register connect");

            }            
        }
 
    );

