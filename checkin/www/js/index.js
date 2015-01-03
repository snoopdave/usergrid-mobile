
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
  orgName: 'test-organization',
  URI: 'http://10.1.1.161:8080',

  //orgName: 'snoopdave',
  //URI: 'https://api.usergrid.com',
});

$(document).on("mobileinit", function() {
 
    console.log("Entering mobileinit");

    var username = localStorage.getItem("username");
    var access_token = localStorage.getItem("access_token");
    var expires_in = localStorage.getItem("expires_in");
    var login_date = localStorage.getItem("login_date");

    if (username && access_token && expires_in && login_date) {

        var id = {"username": username, type: "user"};
        client.getEntity(id, function(err, response, entity) {
            if (err) {
                logout();
                localStorage.removeItem("access_token");
                localStorage.removeItem("expires_in");
                $(":mobile-pagecontainer").pagecontainer("change", "#login-page", {
                    transition: 'flow',
                    reload: true
                 });

            } else {
                user = entity;
            }
        });

    } else {
        console.log("mobileinit: directing to login-page");
        $(":mobile-pagecontainer").pagecontainer("change", "#login-page", {
            transition: 'flow',
            reload: true
        });
    }

});

// *****************************************************************************

function login() {

  var username = $("#login-username").val();
  var password = $("#login-password").val();

  client.login(username, password, function(err, response, entity) {
    if (err) {
      alert(err);

    } else {

      user = entity;

      localStorage.setItem("username", username);
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("expires_in", response.expires_in);
      localStorage.setItem("login_date", new Date());

      document.loginForm.username.value = "";
      document.loginForm.password.value = "";

      $(":mobile-pagecontainer").pagecontainer("change", "#checkin-list-page", {
        transition: 'flow',
        reload: true
      });
    }
  });

}


function logout() {

    client.logout();

    user = null;

    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("login_date");

    $(":mobile-pagecontainer").pagecontainer("change", "#login-page", {
        transition: 'flow',
        reload: true
    });
}


// *****************************************************************************

function signup() {

    logout();

    var name = document.signupForm.name.value;
    var username = document.signupForm.username.value;
    var email = document.signupForm.email.value;
    var password = document.signupForm.password.value;
    var passwordConfirm = document.signupForm.passwordconfirm.value;

    if (password === passwordConfirm) {

        client.signup(username, password, email, name, 
          function(err, response, entity) {
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