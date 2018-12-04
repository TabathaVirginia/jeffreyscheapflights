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
    login();
    //Begin taking input.
    $("#dateInput").datepicker({
        format: "yyyy-mm-dd",
        onSelect: function () {
            date = $(this).datepicker('getDate');
            var rightMonth = date.getMonth() + 1;
            var d = date.getFullYear() + "-" + rightMonth + "-" + date.getDate();
            loadDate(d);
        }
    });

    $("#goToHome").click(function (e) {
        location.reload();
    });

    $("#goToTickets").click(function (e) {
        alert("Ticket functionality coming!");
    });

    $("body").on("click", ".buyTicketButton", function () {
        $(".in").empty();
        var flightId = parseInt($(this).attr("flightId"));
        var origin = $(this).attr("origin");
        var dest = $(this).attr("dest")
        var tableHTML = "<table><tr><th>Flight</th><th>Destination</th><th>Arrival</th></tr>";
        tableHTML += "<tr><th>" + flightId + "</th><th>" + dest + "</th><th>" + origin + "</th></table>";
        $(".in").html(tableHTML);
    })
});

function handleOrigin() {
    $(".in").show();
    $("#loading").html("<p></p>");
    $(".in").html("<p>Where are you flying from? Please input an airport code.</p><input id='originInput' type='text'>");
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
    var d = "<table><tr><th>Flight</th><th>Destination</th><th>Arrival</th><th>Leaving</th><th>Arrives</th><th>Buy Ticket</th></tr>";
    for (var i = 0; i < flightIDs.length; i++) {
        var info = flightInfo[flightIDs[i]].split(";");

        if (info[0] === origin && info[2] === dest) {
            empty = false;
            console.log("Match!");
            d += "<tr><th>" + flightIDs[i] + "</th><th>" + info[0] + "</th><th>" + info[2] + "</th><th>" + info[4] + "</th><th>" + info[5] + "<th><button class='buyTicketButton' flightId=" + flightIDs[i] + " origin=" + origin + " dest=" + dest + " destLat=" + +" destLong=" + +">Buy Ticket</th></tr>";
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

function change() {
    $(".in").html("<p>Loading...</p>");
}

// Skeleton for using places instead of actual map
function initPlace(lat, long) {
    var mapCenter = new google.maps.LatLng(lat, long);

    map = new google.maps.Map(document.getElementById('destMap'), {
        center: mapCenter,
        zoom: 15
    });

    // var request = {
    //     query: 'Museum of Contemporary Art Australia',
    //     fields: ['photos', 'formatted_address', 'name', 'rating', 'opening_hours', 'geometry'],
    // };

    // service = new google.maps.places.PlacesService(map);
    // service.findPlaceFromQuery(request, callback);
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            // createMarker(results[i]);
            // console.log(place)
        }
    }
}

function loadDate(d) {
    //Get airports.
    $.ajax({
        xhrFields: { withCredentials: true },
        type: "GET",
        async: false,
        success: function (data) {
            $("#loading").html("<p>Loading...</p>");
            $(".in").hide();
        },
        url: "http://comp426.cs.unc.edu:3001/airports"
    }).done(function (data) {
        console.log(data[0])
        for (var i = 0; i < data.length; i++) {
            airports[data[i].id] = data[i].code + ";" + data[i].name + ";" + data[i].latitude + ";" + data[i].longitude;
            // {
            //     code: data[i].code,
            //     name: data[i].name,
            //     lat: data[i].latitude,
            //     long: data[i].longitude,
            // }

            console.log("Airport info:" + data[i].code + ";" + data[i].name + ";" + data[i].latitude + ";" + data[i].longitude);
        }
    });

    $.ajax({
        xhrFields: { withCredentials: true },
        type: "GET",
        async: false,
        success: function (data) {
            $("#loading").html("<p>Bebop</p>");
        },
        url: "http://comp426.cs.unc.edu:3001/instances?filter[date]=" + d
    }).done(function (data) {
        flightIDs = data.map(entry => entry.flight_id);
        for (var i = 0; i < flightIDs.length; i++) {
            (function (i) {
                $.ajax({
                    xhrFields: { withCredentials: true },
                    type: "GET",
                    async: false,
                    complete: function (data) {
                        $("#loading").html("<p>Bebop</p>");
                    },
                    url: "http://comp426.cs.unc.edu:3001/flights/" + flightIDs[i]
                }).done(function (data) {
                    var dept = airports[data.departure_id];
                    var arr = airports[data.arrival_id];
                    var dep_time = (data.departs_at).substring(11, 16);
                    var arr_time = (data.arrives_at).substring(11, 16);
                    var flightNum = data.number;
                    var airline = data.airline_id;
                    // console.log(dept + ";" + arr + ";" + dep_time + ";" + arr_time + ";" + flightNum + ";" + airline);
                    // origin = dept;
                    // dest = arr;
                    flightInfo[flightIDs[i]] = dept + ";" + arr + ";" + dep_time + ";" + arr_time + ";" + flightNum + ";" + airline;
                });
            })(i);
        }
        //printIDs();
        handleOrigin();
    });
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
