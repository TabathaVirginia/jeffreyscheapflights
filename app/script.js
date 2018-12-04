// Globals
var date;
var flightIDs = [];
var flightInfo = [];
var airports =[];

// JQuery Logic
$(document).ready(function() {
    
    //Login
    login();
    
    //Begin taking input.
    $("#dateInput").datepicker({
        format: "yyyy-mm-dd",
        onSelect: function() { 
            date = $(this).datepicker('getDate'); 
            $(".in").html("<p>Where are you flying from? Please input an airport code.</p><input id='originInput' type='text'>");
            var rightMonth = date.getMonth()+1;
            var d = date.getFullYear() + "-" + rightMonth + "-" + date.getDate();
            
            $.ajax({
                xhrFields: {withCredentials: true},
                type: "GET",
                async: false,
                url: "http://comp426.cs.unc.edu:3001/airports"
            }).done(function(data) {
                for (var i = 0; i < data.length; i++) {
                    airports[data[i].id] = data[i].code;
                }
            });
            
            $.ajax({
                xhrFields: {withCredentials: true},
                type: "GET",
                async: false,
                url: "http://comp426.cs.unc.edu:3001/instances?filter[date]=" + d
            }).done(function(data) {
                flightIDs = data.map(entry => entry.flight_id);
                for (var i = 0; i < flightIDs.length; i++) {
                    (function(i) {
                        $.ajax({
                            xhrFields: {withCredentials: true},
                            type: "GET",
                            async: false,
                            url: "http://comp426.cs.unc.edu:3001/flights/ " + flightIDs[i]
                        }).done(function(data) {
                            var dept = airports[data.departure_id];
                            var arr = airports[data.arrival_id];
                            flightInfo[flightIDs[i]] = "From " + dept + " to " + arr;
                        });
                    })(i);
                }
                printIDs();
                handleOrigin();
            });
        }
    });

    
});

function handleOrigin() {
    $('#originInput').keypress( function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13'){
            origin = $(this).val();
            $(".in").empty();
            $(".in").html("<p>Where are you flying to?</p><input id='destInput' type='text'>");
            handleDest();
        }
    });
}

function handleDest() {
    $("#destInput").keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13'){
            dest = $(this).val();
            $(".in").empty();
            $(".in").html("<p>Displaying ajax response...</p>");
            handleDate();
        }
    });
}

function printIDs() {
    for (var i = 0; i < flightIDs.length; i++) {
        console.log("Flight " + flightIDs[i] + ": " + flightInfo[flightIDs[i]]);
    }
}

function login() {
    $.ajax({
        url: 'http://comp426.cs.unc.edu:3001/sessions',
        type: 'POST',
        data: {
            user: {
                username: 'tabathav',
                password: '730010609',
            },
        },
        xhrFields: {
            withCredentials: true
        },
    });
}