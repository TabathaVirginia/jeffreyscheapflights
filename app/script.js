// Globals
var dest = "";
var date;

// JQuery Logic
$(document).ready(function() {
    
    $('#destInput').keypress( function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13'){
            dest = $(this).val();
            $(".in").empty();
            $(".in").html("<p>Which day would you like to travel?</p><input id='dateInput' type='date' name='dest'>");
            handleDate();
        }
    });

    
});

function handleDate() {
    $("#dateInput").keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13'){
            date = $(this).val();
            $(".in").empty();
            //handle the ajax call here
            $(".in").html("<p>Awesome! Here are your options. If you want to buy a ticket, click the 'Buy' button next to the entry.</p>");
        }
    });
}