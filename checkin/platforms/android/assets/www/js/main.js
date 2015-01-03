
////////////////////////////////////////////////////////////////////////////////
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
////////////////////////////////////////////////////////////////////////////////

var user;

var users;

var checkins;


var client = new Usergrid.Client({
  appName: 'checkin1',

  //orgName: 'test-organization',
  //URI: 'http://10.1.1.161:8080',

  orgName: 'snoopdave',
  URI: 'https://api.usergrid.com',
});


var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();

document.addEventListener("deviceReady", deviceReady, false);

function deviceReady() {
  deviceReadyDeferred.resolve();
}

$(document).on("mobileinit", function () {
  jqmReadyDeferred.resolve();
});

$.when(deviceReadyDeferred, jqmReadyDeferred).then(doWhenBothFrameworksLoaded);

function doWhenBothFrameworksLoaded() {

    console.log("doWhenBothFrameworksLoaded");
 
    var username = localStorage.getItem("username");
    var access_token = localStorage.getItem("access_token");
    var expires_in = localStorage.getItem("expires_in");
    var login_date = localStorage.getItem("login_date");

    if (username && access_token && expires_in && login_date) {

        var id = {"username": username, type: "user"};
        client.getEntity(id, function(err, response, entity) {
            if (err) {
                alert(err);
                localStorage.removeItem("access_token");
                localStorage.removeItem("expires_in");
                $(":mobile-pagecontainer").pagecontainer("change", "#login-page");

            } else {
                user = entity;
                $("#checkin-list-username").append( user.get("username") );
                loadCheckinList("#checkin-list");
                loadUserListPage();
            }
        });

    } else {
        $(":mobile-pagecontainer").pagecontainer("change", "#login-page");
        $("#checkin-list-username").append( user.get("username") );
        loadCheckinList("#checkin-list");
    }
}

// *****************************************************************************

function login() {

  var username = $("#login-username").val();
  var password = $("#login-password").val();

  localStorage.removeItem("access_token");
  localStorage.removeItem("expires_in");

  client.login(username, password, function(err, response, entity) {
    if (err) {
      alert(err);

    } else {

      localStorage.setItem("username", username);
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("expires_in", response.expires_in);
      localStorage.setItem("login_date", new Date());

      $(":mobile-pagecontainer").pagecontainer("change", "#checkin-list-page");
      user = entity;

    }
  });

}


function logout() {
    user = null;
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("login_date");
    $(":mobile-pagecontainer").pagecontainer("change", "#login-page");
}


// *****************************************************************************

function signup() {

    var name = document.signupForm.name.value;
    var username = document.signupForm.username.value;
    var email = document.signupForm.email.value;
    var password = document.signupForm.password.value;
    var passwordConfirm = document.signupForm.passwordconfirm.value;

    if (password === passwordConfirm) {

        client.signup(username, password, email, name, function(err, response, entity) {
            if (err) {
                alert(err);

            } else {
                alert("signed up!");
                logout();
                document.signupForm.name.value = "";
                document.signupForm.username.value = "";
                document.signupForm.email.value = "";
                document.signupForm.password.value = "";
                document.signupForm.passwordconfirm.value = "";
            }
        });

    } else {
        alert("Password confirm does not match password");
    }

    return false;
}


// *****************************************************************************

function checkin() {

  var content =  document.checkinForm.content.value;
  var location = document.checkinForm.location.value;

  var data = {
    type: "checkin",
    content: content,
    location: location,
    verb: "post",
    actor: {
      username: user.get("username")
    }
  };

  client.createUserActivity(user.get("username"), data, function( err, response, activity ) {

    if (err) {
      alert("Error on check-in");

    } else {
      history.back();
      $("#create-content-field").val("");
      $("#create-location-field").val("");
      loadCheckinList("#checkin-list");
      document.checkinForm.content.value = "";
      document.checkinForm.location.value = "";
    }
  });

}


// *****************************************************************************

function loadViewCheckinPage(uuid) {

  var id = {'uuid': uuid, 'type': 'activity'}; 

  client.getEntity(id, function(err, result, activity) {

    if (!err && activity ) {
      $("#view-checkin-content").html( activity.get("content"));
      $("#view-checkin-location").html( activity.get("location"));
      $("#view-checkin-username").html( activity.get("actor").username );
      $(":mobile-pagecontainer").pagecontainer("change", "#view-checkin-page");

    } else {
      alert("Cannot get entity " + name);
    }
  });

}


// *****************************************************************************

function loadCheckinList(listDomId, username) {

  $(listDomId).empty();

  if (username) {

    // get feed for specific user 

    var options = {
        client: client, 
        type: "activities",
        qs: { ql: "select * where actor.username='" + username + "'" }
    };
    
    var userCheckins = new Usergrid.Collection(options);
    
    userCheckins.fetch(function(err, response, userCheckins) {

      if (err) {
        alert("read failed");

      } else {

        while (userCheckins.hasNextEntity()) {
          var c = userCheckins.getNextEntity();
          appendCheckin(listDomId, c);
        }

        $(listDomId).listview("refresh");
      }
    });


  } else {

    // get feed from all users that current user follows

    client.getFeedForUser(user.get("username"), function(err, response, userCheckins) {

      if (err) {
        alert("read failed");

      } else {

        for ( i = 0; i < userCheckins.length; i++ ) {
          var e = userCheckins[i];
          var c = new Usergrid.Entity({"client": client, "data": e }); 
          appendCheckin(listDomId, c);
        }

        $(listDomId).listview("refresh");
      }
    });

  }
}

function appendCheckin(listDomId, c) {
    $(listDomId).append(
      "<li data-theme='c'>" +
        "<a onclick='loadViewCheckinPage(\"" + c.get("uuid") + "\")'>" +
        "<b>@" + c.get("actor").username + "</b>: " + c.get("content") +
        "<p>" + c.get("location") + "</p>" +
        "</a>" +
      "</li>");
}


// *****************************************************************************

function loadUserListPage() {

  $("#user-list").empty();

  users = new Usergrid.Collection({"client": client, "type": "user" });

  users.fetch(function(err, response, self) {

    if (err) {
      alert("read failed");

    } else {

      while ( users.hasNextEntity() ) {
        var u = users.getNextEntity();
        $("#user-list").append(
            "<li data-theme='c'>" +
                "<a onclick='loadViewUserPage(\"" + u.get("uuid") + "\")'>" +
                "<h2>" + u.get("name") + "</h2>" +
                "<p>" + u.get("username") + "</p>" +
                "</a>" +
            "</li>");
      } 

      $('#user-list').listview("refresh");
    }
  });

}


// *****************************************************************************

function loadViewUserPage(uuid) {

  var id = {'uuid': uuid, 'type': 'user'}

  client.getEntity(id, function(err, result, viewedUser ) {

    if (!err && viewedUser ) {

      $(":mobile-pagecontainer").pagecontainer("change", "#view-user-page");

      $("#view-user-name").html( viewedUser.get("name"));
      $("#view-user-username").html( viewedUser.get("username"));

      $("#user-checkin-list").empty();
      loadCheckinList("#user-checkin-list", viewedUser.get("username"));

      if ( user.get("uuid") == viewedUser.get("uuid")) {
          $("#follow-button").hide();
      } else {
          $("#follow-button").show();
      }

    } else {
      alert("Cannot get user entity " + uuid);
    }
  });

// *****************************************************************************

    function followUser() {

        var target = $("#view-user-username").html();

        var options = {
            method: 'POST',
            endpoint: 'users/' + user.get("username") + '/following/users/' + target
        };

        client.request(options, function (err, data) {
            if (err) {
                alert("Unable to follow user " + target);
            } else {
                alert("Followed user " + target);
            }
        });
    }
}


