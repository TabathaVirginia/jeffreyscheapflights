// Globals
var origin = "";
var dest = "";
var date;
var instanceIDs = [];
var flightIDs = [];
var flightInfo = [];
var airports = [];
var airportsMap = new Map();
var airlines = [];
var arrivingCache = [];
var departureCache = [];
var map;
var service;
var infoWindow;
var seats;


// JQuery Logic
$(document).ready(function () {
    login();

    //Get airlines
    pullAirlines();

    //Begin taking input.
    $("#dateInput").datepicker({
        format: "yyyy-mm-dd",
        onSelect: function () {
            date = $(this).datepicker('getDate');
            var rightMonth = date.getMonth() + 1;
            var d = date.getFullYear() + "-" + rightMonth + "-" + date.getDate();
            $(".in").html("<p>Loading your flights. This may take a few seconds.</p>");
            // alert("Loading your flights. This may take a few seconds.");
            loadDate(d);
        }
    });

    $("#goToHome").click(function (e) {
        location.reload();
    });

    $("#goToTickets").click(function (e) {
        $(".map").hide();
        $.ajax({
            url: 'http://comp426.cs.unc.edu:3001/tickets',
            type: 'GET',
            xhrFields: {
                withCredentials: true
            }
        }).done(function (data) {
            $(".in").empty();
            var d = "<table><tr><th>Ticket ID</th><th>Name</th><th>Date</th></tr>";
            for (var i = 0; i < data.length; i++) {
                var name = data[i].first_name + " " + data[i].middle_name.substring(0, 1) + ". " + data[i].last_name;
                (function (i) {
                    $.ajax({
                        url: 'http://comp426.cs.unc.edu:3001/instances/' + data[i].instance_id,
                        type: 'GET',
                        async: false,
                        xhrFields: {
                            withCredentials: true
                        }
                    }).done(function (data1) {
                        info = data1;
                        d += "<tr><th>" + data[i].id + "</th><th>" + name + "</th><th>" + data1.date + "</th></tr>";
                    });
                })(i);
            }
            d += "</table>";
            if (data.length != 0) {
                $(".in").html(d);
            } else {
                $(".in").html("<p>Uh oh! Looks like you haven't purchased any tickets yet.</p>");
            }

            airlineTable();

            $(".in").append("<button id='note'>Make a note about an airline</button>");

            $("#note").click(function (e) {
                var toNote = prompt("Enter the name of the airline");
                var found = false;
                var airID = 0;
                for (var i = 0; i < airlines.length; i++) {
                    if (airlines[i] == toNote) {
                        found = true;
                        airID = i;
                    }
                }
                if (!found) {
                    alert("Airline not found");
                } else {
                    var note = prompt("Enter your comment!");
                    $.ajax({
                        url: 'http://comp426.cs.unc.edu:3001/airlines/' + airID,
                        type: 'PUT',
                        async: false,
                        xhrFields: {
                            withCredentials: true
                        },
                        data: {
                            airline: {
                                info: note
                            }
                        }
                    }).done(function (data) {
                        airlines[airID] += ";" + note;
                        pullAirlines();
                        airlineTable();
                    });
                }
            });
        });
    });

    $("body").on("click", "#submitUserInfo", function () {
        var instanceID = parseInt($(this).attr("instanceID"));
        var flightId = parseInt($(this).attr("flightId"));
        var fName = $("#fName").val();
        var mName = $("#mName").val();
        var lName = $("#lName").val();
        var age = parseInt($("#age").val());
        var gender = $("#gender").val();
        if (!(fName && mName && lName && age && gender)) {
            return;
        }
        $(".in").empty();
        var seat_id = find_seat(flightId, instanceID);
        var dest = $(this).attr("dest");

        var destLat = airportsMap.get(dest).lat;
        var destLong = airportsMap.get(dest).long;

        if (seat_id == -1) {
            alert("This flight is filled, sorry ):");
            return;
        }

        $.ajax({
            url: 'http://comp426.cs.unc.edu:3001/tickets',
            type: 'POST',
            xhrFields: {
                withCredentials: true
            },
            data: {
                ticket: {
                    first_name: fName,
                    middle_name: mName,
                    last_name: lName,
                    age: age,
                    gender: gender,
                    is_purchased: "true",
                    price_paid: "100.00",
                    instance_id: instanceID,
                    seat_id: seat_id
                }
            }
        }).done(function (data) {
            console.log("Ticket purchased!");
        });
        var confirmationTable = "<table class='confirmationTable'><tr><th class='confirmationTableEntry'>Flight</th><th class='confirmationTableEntry'>From</th><th class='confirmationTableEntry'>To</th></tr>";
        confirmationTable += "<tr><th class='confirmationTableEntry'>" + flightId + "</th><th class='confirmationTableEntry'>" + origin + "</th><th class='confirmationTableEntry'>" + dest + "</th></table>";
        $(".in").html(confirmationTable);
        initPlace(destLat, destLong);
    })

    $("body").on("click", ".buyTicketButton", function (e) {
        e.preventDefault();
        $(".in").empty();
        var flightId = parseInt($(this).attr("flightId"));
        var instanceID = parseInt($(this).attr("instanceID"));
        dest = $(this).attr("dest")
        makeUserForm(flightId, instanceID, dest);

    })
});

function handleOrigin() {
    $(".in").html("<p>Where are you flying from? Please input an airport code.</p><input id='originInput' type='text'>");
    $("#originInput").focus();
    $('#originInput').keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            origin = $(this).val().toUpperCase();
            $(".in").empty();
            $(".in").html("<p>Where are you flying to?</p><input id='destInput' type='text'>");
            $("#destInput").focus();
            handleDest();
        }
    });

    //Suggestions logic
    var cache = {};
    var drew = false;
    $("#originInput").on("keyup", function (event) {
        var query = $("#originInput").val();
        if (query.length > 0) {
            if (query in cache) {
                results = cache[query];
            } else {
                var results = $.grep(departureCache, function (item) {
                    return item.search(RegExp(query, "i")) != -1;
                });
                cache[query] = results;
            }
            if (drew == false) {
                $("#originInput").after('<ul id="res"></ul>');
                drew = true;
                $("#res").on("click", "li", function () {
                    var curr = $(this).text();
                    $("#originInput").val(curr.substring(curr.length - 4, curr.length - 1));
                    $("#res").empty();
                });
            } else {
                $("#res").empty();
            }
            for (term in results) {
                $("#res").append("<li>" + results[term] + "</li>");
            }
        } else if (drew) {
            $("#res").empty();
        }
    });

}

function handleDest() {
    $("#destInput").keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            dest = $(this).val().toUpperCase();
            $(".in").empty();
            $(".in").html("<p>Displaying ajax response...</p>");
            display();
        }
    });

    var cache = {};
    var drew = false;
    $("#destInput").on("keyup", function (event) {
        var query = $("#destInput").val();
        if (query.length > 0) {
            if (query in cache) {
                results = cache[query];
            } else {
                var results = $.grep(departureCache, function (item) {
                    return item.search(RegExp(query, "i")) != -1;
                });
                cache[query] = results;
            }
            if (drew == false) {
                $("#destInput").after('<ul id="res"></ul>');
                drew = true;
                $("#res").on("click", "li", function () {
                    var curr = $(this).text();
                    $("#destInput").val(curr.substring(curr.length - 4, curr.length - 1));
                    $("#res").empty();
                });
            } else {
                $("#res").empty();
            }
            for (term in results) {
                $("#res").append("<li>" + results[term] + "</li>");
            }
        } else if (drew) {
            $("#res").empty();
        }
    });
}

function display() {
    $(".in").empty();
    var empty = true;
    var d = "<table><tr><th>Flight ID</th><th>Origin</th><th>Arrives At</th><th>Leaving At</th><th>Arrives</th><th>Buy Ticket</th></tr>";
    for (var i = 0; i < flightIDs.length; i++) {
        var info = flightInfo[flightIDs[i]].split(";");
        if (info[0] === origin && info[4] === dest) {
            empty = false;
            d += "<tr><th>" + flightIDs[i] + "</th><th>" + info[0] + "</th><th>" + info[4] + "</th><th>" + info[8] + "</th><th>" + info[9] + "<th><button class='buyTicketButton' flightId=" + flightIDs[i] + " instanceID=" + instanceIDs[i] + " origin=" + origin + " dest=" + dest + ">Buy Ticket</th></tr>";
        }
    }
    d += "</table>";
    if (!empty) {
        $(".in").html(d);
    } else {
        $(".in").html("<p>Uh oh! Looks like no flights match that date and destination-origin combo. Please try again.</p><button class='retry' onClick='handleOrigin()'>Retry</button><br><button class='retry' onClick='location.reload()'>Start Over</button>");
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
function initPlace(lat, long) {
    $(".map").show();
    var mapCenter = new google.maps.LatLng(lat, long);

    map = new google.maps.Map(document.getElementById('destMap'), {
        center: mapCenter,
        zoom: 15
    });

}

function loadDate(d) {
    //Get airports.
    $.ajax({
        xhrFields: {
            withCredentials: true
        },
        type: "GET",
        async: true,
        url: "http://comp426.cs.unc.edu:3001/airports"
    }).done(function (data) {
        for (var i = 0; i < data.length; i++) {
            airports[data[i].id] = data[i].code + ";" + data[i].name + ";" + data[i].latitude + ";" + data[i].longitude;
            airportsMap.set(data[i].code, {
                code: data[i].code,
                name: data[i].name,
                lat: data[i].latitude,
                long: data[i].longitude,
            });
        }
    });

    //Grab dates!
    $.ajax({
        xhrFields: {
            withCredentials: true
        },
        type: "GET",
        async: true,
        url: "http://comp426.cs.unc.edu:3001/instances?filter[date]=" + d
    }).done(function (data) {
        instanceIDs = data.map(entry => entry.id);
        flightIDs = data.map(entry => entry.flight_id);
        for (var i = 0; i < flightIDs.length; i++) {
            (function (i) {
                $.ajax({
                    xhrFields: {
                        withCredentials: true
                    },
                    type: "GET",
                    async: true,
                    url: "http://comp426.cs.unc.edu:3001/flights/" + flightIDs[i]
                }).done(function (data) {
                    var dept = airports[data.departure_id];
                    var arr = airports[data.arrival_id];
                    var dep_time = (data.departs_at).substring(11, 16);
                    var arr_time = (data.arrives_at).substring(11, 16);
                    var flightNum = data.number;
                    var planeId = data.plane_id;
                    var airline = data.airline_id;
                    flightInfo[flightIDs[i]] = dept + ";" + arr + ";" + dep_time + ";" + arr_time + ";" + flightNum + ";" + airline + ";" + planeId;
                    var x = arr.split(";");
                    var y = dept.split(";");
                    var xHas = false;
                    var yHas = false;
                    for (var j = 0; j < arrivingCache.length; j++) {
                        if (arrivingCache[j] === x[1] + " (" + x[0] + ")") {
                            xHas = true;
                        }
                    }
                    for (var j = 0; j < departureCache.length; j++) {
                        if (departureCache[j] === y[1] + " (" + y[0] + ")") {
                            yHas = true;
                        }
                    }
                    if (!xHas) {
                        arrivingCache.push(x[1] + " (" + x[0] + ")");
                    }
                    if (!yHas) {
                        departureCache.push(y[1] + " (" + y[0] + ")");
                    }
                    if (i == flightIDs.length - 1) {
                        handleOrigin();
                    }
                });
            })(i);
        }

    });
}

function find_seat(flight_id, instance_id) {
    if (seats == undefined) {
        $.ajax({
            xhrFields: {
                withCredentials: true
            },
            type: "GET",
            async: false,
            url: "http://comp426.cs.unc.edu:3001/seats"
        }).done(function (data) {
            seats = data;
        });
    }

    for (let i = 0; i < seats.length; i++) {
        if (seats[i].plane_id == flightInfo[flight_id].split(";")[12]) {
            if (!seats.info) {
                purchase_seat(seats[i].id, instance_id, seats[i].info);
                return seats[i].id;
            } else {
                let instances = seats.split(";");
                let purchased = false;
                for(let j = 0; j < instances.length; j++){
                    if(instances[j] == instance_id){
                        purchased = true;
                    }
                }
                if(!purchased){
                    purchase_seat(seats[i].id, instance_id, seats[i].info);
                    return seats[i].id;
                }
            }
        }
    }
    return -1;
}

function purchase_seat(seat_id, instance_id, info) {
    $.ajax({
        url: 'http://comp426.cs.unc.edu:3001/seats/' + seat_id,
        type: 'PUT',
        xhrFields: {
            withCredentials: true
        },
        data: {
            "seat": {
                "info": info + ";" + instance_id,
            }
        }
    }).done(function (data) {
        console.log("seat purchased!");
    });
}

function makeUserForm(flightId, instanceID, dest) {
    // $(".in").html("<div class='userInfoForm'></div>");
    $(".in").append("<table class='userInfoTable'></table>");
    $(".userInfoTable").append("<tr><td>First Name:</td><td class='userInputField'><input type='text' id='fName'></input></td></tr>");
    $(".userInfoTable").append("<tr><td>Middle Name:</td><td class='userInputField'><input type='text' id='mName'></input></td></tr>");
    $(".userInfoTable").append("<tr><td>Last Name:</td><td class='userInputField'><input type='text' id='lName'></input></td></tr>")
    $(".userInfoTable").append("<tr><td>Age:</td><td class='userInputField'><input type='text' id='age'></input></td></tr>");
    $(".userInfoTable").append("<tr><td>Gender:</td><td class='userInputField'><input type='text' id='gender'></input></td></tr>");

    $(".in").append("<button id='submitUserInfo' instanceID=" + instanceID + " dest=" + dest + " flightId=" + flightId + ">Submit</button>");

}

function pullAirlines() {
    $.ajax({
        xhrFields: {
            withCredentials: true
        },
        type: "GET",
        async: false,
        url: "http://comp426.cs.unc.edu:3001/airlines"
    }).done(function (data) {
        for (var i = 0; i < data.length; i++) {
            airlines[data[i].id] = data[i].name + ";" + data[i].info;
        }
    });
}

function airlineTable() {
    $(".in").append("<div id='air'></div>");
    var empty = true;
    var d = "<table><tr><th>Airline</th><th>Notes</th></tr>";
    for (var i = 0; i < airlines.length; i++) {
        if (airlines[i] != undefined) {
            var info = airlines[i].split(";");
            if (info.length > 1) {
                if (info[info.length - 1] != "null") {
                    empty = false;
                    d += "<tr><th>" + info[0] + "</th><th>" + info[info.length - 1] + "</th></tr>";
                }
            }
        }
    }
    d += "</table>";
    if (!empty) {
        $("#air").append(d);
    }
}

/*Todo
Fix the user info form
Add to and from to the tickets
*/
