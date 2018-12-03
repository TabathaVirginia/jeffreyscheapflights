// Globals
var origin = "";
var dest = "";
var date;
var data;

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
                url: "http://comp426.cs.unc.edu:3001/instances?filter[date]=" + d
            }).done(function(data) {
                data = data.filter(entry => entry.date == d); //making extra fucking sure
                var flightIDs = data.map(entry => entry.flight_id);
                var idInfo = {};
                for (var i = 0; i < flightIDs.length; i++) {
                    (function(i) { // Mr Closure
                        $.ajax({
                            xhrFields: {withCredentials: true},
                            type: "GET",
                            async: false,
                            url: "http://comp426.cs.unc.edu:3001/flights?filter[id]=" + flightIDs[i]
                        }).done(function(data1) {
                            data1 = data1.filter(x => x.id === flightIDs[i]); //making extra fucking sure
                            var dept_id = data1[0].departure_id;
                            var arr_id = data1[0].arrival_id;
                            var dept = "";
                            var arr = "";
                            //grab dept airport
                            (function(dept_id, dept) {
                                $.ajax({
                                    xhrFields: {withCredentials: true},
                                    type: "GET",
                                    async: false,
                                    url: "http://comp426.cs.unc.edu:3001/airports?filter[id]=" + dept_id
                                }).done(function(d) {
                                    d = d.filter(x => x.id === dept_id);
                                    dept = d[0].code;
                                    console.log("Departure from " + dept);
                                });
                            })(dept_id, dept);
                            
                            (function(arr_id, arr) {
                                $.ajax({
                                    xhrFields: {withCredentials: true},
                                    type: "GET",
                                    async: false,
                                    url: "http://comp426.cs.unc.edu:3001/airports?filter[id]=" + arr_id
                                }).done(function(d) {
                                    d = d.filter(x => x.id === arr_id);
                                    arr = d[0].code;
                                    console.log("Arrival to " + dept);
                                });
                            })(arr_id, arr);
                            
                        });
                    })(i);
                }
            });
            handleOrigin();
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