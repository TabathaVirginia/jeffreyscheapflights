// Globals
var origin = "";
var dest = "";
var date;
var flightIDs = [];
var flightInfo = [];
var airports = [];
var map;
var service;
var infoWindow;


// JQuery Logic
$(document).ready(function () {

    //Login
    login();

    //Begin taking input.
    $("#dateInput").datepicker({
        format: "yyyy-mm-dd",
        onSelect: function () {
            date = $(this).datepicker('getDate');
            $(".in").html("<p>Where are you flying from? Please input an airport code.</p><input id='originInput' type='text'>");
            $("#originInput").focus();
            var rightMonth = date.getMonth() + 1;
            var d = date.getFullYear() + "-" + rightMonth + "-" + date.getDate();

            $.ajax({
                xhrFields: { withCredentials: true },
                type: "GET",
                async: false,
                url: "http://comp426.cs.unc.edu:3001/airports"
            }).done(function (data) {
                for (var i = 0; i < data.length; i++) {
                    airports[data[i].id] = data[i].code + ";" + data[i].name;
                }
            });

            $.ajax({
                xhrFields: { withCredentials: true },
                type: "GET",
                async: false,
                url: "http://comp426.cs.unc.edu:3001/instances?filter[date]=" + d
            }).done(function (data) {
                flightIDs = data.map(entry => entry.flight_id);
                for (var i = 0; i < flightIDs.length; i++) {
                    (function (i) {
                        $.ajax({
                            xhrFields: { withCredentials: true },
                            type: "GET",
                            async: false,
                            url: "http://comp426.cs.unc.edu:3001/flights/ " + flightIDs[i]
                        }).done(function (data) {
                            var dept = airports[data.departure_id];
                            var arr = airports[data.arrival_id];
                            origin = dept;
                            dest = arr;
                            flightInfo[flightIDs[i]] = dept + ";" + arr;
                        });
                    })(i);
                }
                printIDs();
                handleOrigin();
            });
        }
    });

    $("#goToHome").click(function (e) {
        location.reload();
    });

    $("#goToTickets").click(function (e) {
        alert("Ticket functionality coming!");
    });
});

function handleOrigin() {
    $('#originInput').keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            origin = $(this).val();
            $(".in").empty();
            $(".in").html("<p>Where are you flying to?</p><input id='destInput' type='text'>");
            $("#destInput").focus();
            handleDest();
        }
    });
}

function handleDest() {
    $("#destInput").keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            dest = $(this).val();
            $(".in").empty();
            $(".in").html("<p>Displaying ajax response...</p>");
            display();
        }
    });
}

function printIDs() {
    for (var i = 0; i < flightIDs.length; i++) {
        console.log("Flight " + flightIDs[i] + ": " + flightInfo[flightIDs[i]]);
    }
}

function display() {
    $(".in").empty();
    var empty = true;
    var d = "<table><tr><th>Flight</th><th>Destination</th><th>Arrival</th><th>Buy Ticket</th></tr>";
    for (var i = 0; i < flightIDs.length; i++) {
        var info = flightInfo[flightIDs[i]].split(";");
        if (info[0] === origin && info[2] === dest) {
            empty = false;
            console.log("Match!");
            d += "<tr><th>" + flightIDs[i] + "</th><th>" + info[0] + "</th><th>" + info[2] + "</th><th><button class='buyTicket' flightId=" + flightIDs[i] + ">Buy Ticket</th></tr>";
        }
    }
    d += "</table>";
    if (!empty) {
        $(".in").html(d);
    } else {
        $(".in").html("<p>Uh oh! Looks like no flights match that date and destination-origin combo. Please try again.</p>");
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
// Skeleton for using places instead of actual map
function initPlace() {
    var mapCenter = new google.maps.LatLng(-33.8617374, 151.2021291);

    map = new google.maps.Map(document.getElementById('destMap'), {
        center: mapCenter,
        zoom: 15
    });

    var request = {
        query: 'Museum of Contemporary Art Australia',
        fields: ['photos', 'formatted_address', 'name', 'rating', 'opening_hours', 'geometry'],
    };

    service = new google.maps.places.PlacesService(map);
    service.findPlaceFromQuery(request, callback);
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            // createMarker(results[i]);
            console.log(place)
        }
    }
}

// Only map without all the fun attractions
function initMap(location) {
    // Figure out how to center on location of airport
    map = new google.maps.Map(document.getElementById('destMap'), {
        center: { lat: 35.9132, lng: -79.0558 },
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    });
}

function blank() {

}