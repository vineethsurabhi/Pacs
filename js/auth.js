$(document).ready(function() {
    var shell = require('electron').shell;
    var log = require('electron').remote.getGlobal('logObject');

    //open links externally by default
    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    // Login
    var token = localStorage.getItem('token');
    var tokenVerifySettings = {
        "crossDomain": true,
        "url": "https://liver.prediblehealth.com/validate_token",
        "method": "POST",
        "headers": {
            "content-type": "text/plain"
        },
        "processData": false,
        "data": token
    }

    log.info('sending token for validation')

    $.ajax(tokenVerifySettings).done(function(response) {
        console.log(response);
        //token = response;
        $("#splashScreen").hide()
        localStorage.setItem("token", response)
        if (response != null) {
            log.info('token validation successfull')
            $("#splashScreen").show()
            // document.cookie = "user_token=" + response;
            window.location.href = "./config.html"
        } else {}
    }).fail(function(response) {
        log.error('token validation unsuccessful')
        $("#navbar").show()
        $("#footer").show()
        $("#splashScreen").hide()
        $('<style>body {\
              background-color: #373737;\
              background-image: url("./images/Banners/Asset 65.png");\
              background-size: 100% 100%;\
              background-repeat: no-repeat;\
          }</style>').appendTo("body")
        $("#loginForm").show();
    })

    $("#login").on('click', function(e) {
        e.preventDefault();
        var btn = $(this);
        $(this).addClass('loading')
        var settings = {
            "crossDomain": true,
            "url": "https://liver.prediblehealth.com/generate_user_token",
            "method": "POST",
            "headers": {
                "content-type": "application/json",
            },
            // "mimeType":"multipart/form-data",
            // "xhrFields": {
            //     withCredentials: true
            // },
            "processData": false,
            "data": JSON.stringify({
                "username": $('input[name=email]').val(),
                "password": $('input[name=password]').val()
            })
            // "data":form
        }

        $.ajax(settings).done(function(response) {
                // console.log(response);
                //token = response;
                btn.removeClass('loading');
                localStorage.setItem("token", response);
                localStorage.setItem("user",$('input[name=email]').val());
                if (response != null) {
                    log.info('Login successfull');
                    // document.cookie = "user_token=" + response;
                    window.location.href = "./config.html"
                } else {

                }
            })
            .fail(function(response) {
                log.error('Attempted to login with invalid credentials');
                btn.removeClass('loading')
                var message = "<div class='ui negative message'>\
                                      <i class='close icon'></i>\
                                      <div class='header'>\
                                        Authentication Failed\
                                      </div>\
                                      <p>" + response.responseText + "\
                                    </p></div><br/>"
                $('#status').html(message)
            })
    })


    // Signup
    $('#signup').on('click', function(e) {
        e.preventDefault();
        var settings = {
            "crossDomain": true,
            "url": "http://35.154.186.7:1337/signup_api",
            "method": "POST",
            "headers": {
                "content-type": "application/json",
            },
            "processData": false,
            "data": JSON.stringify({
                "name": $('input[name=name]').val(),
                "email": $('input[name=email]').val(),
                "org_name": $('input[name=organisation]').val(),
                "org_location": $('input[name=location]').val(),
                "password": $('input[name=password]').val()
            })
        }

        $.ajax(settings).done(function(response) {
            console.log(response);
            if (response.status == "success") {
                var message = '<div class="ui icon message">\
                                       <i class="notched circle loading icon"></i>\
                                       <div class="content">\
                                         <div class="header">\
                                           Signup Successfull\
                                         </div>\
                                         <p> <b>We are redirecting you to Login page</b></p>\
                                       </div>\
                                     </div>'
                $('#status').html(message);
                setTimeout(function() { window.location.href = "index.html" }, 1000)

            } else {
                var message = "<br/><div class='ui negative message'>\
                                      <i class='close icon'></i>\
                                      <div class='header'>\
                                        Signup Failed\
                                      </div>\
                                      <p>" + response.message + "\
                                    </p></div>"
                $('#status').html(message)
            }
        });
    })

    $(document).on('click', '.negative.message .close', function() {
        $(this)
            .closest('.message')
            .transition('fade');
    })
})