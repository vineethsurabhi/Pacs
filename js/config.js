 $(document).ready(function() {
     // Set up SCP 
     var settings = {
         "async": true,
         "crossDomain": true,
         "url": "http://localhost:1337/scp",
         "method": "POST",
         "headers": {
             "cache-control": "no-cache",
         }
     }

     $.ajax(settings).done(function(response) {
         console.log(response);
     }).fail(function(message) {
         alert('SCP Connection Failed')
     })

     $(document).on('keypress', 'input[name=peerPort]', function(e) {
         var key = e.which;
         if (key == 13) // the enter key code
         {
             $('#submit').click();
             return false;
         }
     })

     // Set up SCU

     $('#submit').on('click', function(e) {
         e.preventDefault();
         var btnScope = $(this);
         $(this).addClass('loading')

         var configData = {
             "AETitle": $('input[name=peerAETitle]').val(),
             "Hostname": $('input[name=peerHost]').val(),
             "Port": parseInt($('input[name=peerPort]').val())
         }

         localStorage.setItem("AETitle", configData["AETitle"])
         localStorage.setItem("Hostname", configData["Hostname"])
         localStorage.setItem("Port", configData["Port"])

         configData = JSON.stringify(configData)
         var settings = {
             "async": true,
             "crossDomain": true,
             "url": "http://localhost:1337/scu",
             "method": "POST",
             "processData": false,
             "headers": {
                 "content-type": "application/json",
             },
             "data": configData
         }

         $.ajax(settings).done(function(response) {
                 console.log(response);
                 if (response.C_Echo == true) {
                     var message = '<div class="ui icon message">\
                                       <i class="notched circle loading icon"></i>\
                                       <div class="content">\
                                         <div class="header">\
                                           Connection Successful\
                                         </div>\
                                         <p> <b>We are redirecting you to PACS Explorer</b></p>\
                                       </div>\
                                     </div>'
                     $('#configuration').html(message);
                     setTimeout(function() { window.location.href = "dashboard.html" }, 1000)
                     $(btnScope).removeClass('loading');
                 } else {
                     var message = "<div class='ui message'>\
                                      <i class='close icon'></i>\
                                      <div class='header'>\
                                        Connection Unsuccessful\
                                      </div>\
                                      <p>Please re-check configuration details\
                                    </p></div>"
                     $('#configuration').html(message);
                     $(btnScope).removeClass('loading');

                     $(document).on('click', '.message .close', function() {
                         console.log('closing')
                         $(this).closest('.message').transition('fade');
                     })
                 }
             })
             .fail(function(err) {
                 $(btnScope).removeClass('loading');
                 console.log(err)
                 alert('Connection Failed')
                 console.log('Connection Failed')
             })
     })
 })