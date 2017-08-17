// 'use strict';

var google;
var ko;
var console;
// var $;
var alert;
var distance_func = google.maps.geometry.spherical.computeDistanceBetween;
// console.log(distance_func({lat: place['lat'], lng: place['lon']}, {lat: centerLat(), lng: centerLon()}))


function AppViewModelDef() {
    this.self = this;
    this.lat =  ko.observable(32.7157);
    this.lon = ko.observable(-117.1611);
    this.radius = ko.observable(25);
    this.places = ko.observableArray([]);
    this.currentPlace = ko.observable({'name' : 'qwertyuiop'});
    this.filteredPlaces = ko.computed(function(places, centerLat, centerLon, maxDistance) {
            return function () {
                var p = places();
                var q = p.filter(function (place) {
                    var centerCoor = new google.maps.LatLng(parseFloat(centerLat()), parseFloat(centerLon()));
                    // console.log(centerCoor);
                    var placeCoor = new google.maps.LatLng(parseFloat(place.lat), parseFloat(place.lon));
                    // console.log(place.lat);

                    //convert meters to miles
                    var dist = 0.000621371 * distance_func(centerCoor, placeCoor);
                    // console.log(dist);
                    return maxDistance() >= dist;
                });
                console.log('q:');
                console.log(q);
                return q;
            };

    }(this.places, this.lat, this.lon, this.radius)
    );


}
var AppViewModel = new AppViewModelDef();
ko.applyBindings(AppViewModel);



function updatePlaces(lat, lon, radius, maxNumTrails) {
    if (maxNumTrails === undefined) {
        maxNumTrails = 25;
    }
    if (lat === undefined) {
        lat = AppViewModel.lat();
    }
    if (lon === undefined) {
        lon = AppViewModel.lon();
    }

    if (radius === undefined) {
        radius = AppViewModel.radius();
    }
    $.ajax(
        {
            context: AppViewModel,
            url: "https://trailapi-trailapi.p.mashape.com/",
            type: 'GET',
            data: {
                lat: lat,
                lon: lon,
                radius: radius,
                limit: maxNumTrails
            },
            datatype: 'json',

            success: function () {
                console.log('Ajax success');
                var places = arguments[0].places.map(function(place) {
                    place.marker = null;
                    place.current = AppViewModel.currentPlace;
                    return place;
                });

                // console.log('places: ', places);
                // self.removeAllActivities();
                AppViewModel.places(places);
            },
            error: function () {
                console.log('Ajax Error');
                // console.log(arguments);
                alert('Sorry, could not access the trails-api');
                // console.log(textStatus);
                // console.log(errorThrown);
                // console.log(jqXHR)
            },
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-Mashape-Key", "PlbWQer6JkmshNDg1SKfp9sYYbHUp1JmM0ojsn2VR4UR2K39Iz");
                xhr.setRequestHeader('Accept', 'text/plain');
            }
        });

}


var map;
var markers = [];
function clearMarkers(){
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 32.7, lng: -117.2},
        zoom: 8
    });
    AppViewModel.filteredPlaces.subscribe(function(filteredPlaces) {
        clearMarkers();
        for(var i = 0; i < filteredPlaces.length; i++) {
            var place = filteredPlaces[i];
//                console.log('pushing');
//             var marker = new google.maps.Marker({
//
//                 position: {
//                     lat: place.lat,
//                     lng: place.lon
//                 },
//                 map: map,
//                 title: place.name
//             });
// //                console.log(marker);
//             markers.push(marker);
// //                markLink = '<a href="' + place['activities'][0]['url'] + '">url</a>';
//             var markName = '<h1>' + marker.title + '</h1>';
//             var markCoor = '<p> (lat, lon):  ' + place.lat + ', ' + place.lon + '</p>';
//             attachInfoWindow(marker, markName + '\n' + markCoor, place);
//             place.marker = marker;
            createAttachMarker(place);
//                mark.infoWindow = new google.maps.InfoWindow({
//                    content:    '<div id="content">' +
//                    markName +
//                    markCoor +
//                    '</div>'
//                });
//                mark.addListener('click', function() {
//                    mark.infoWindow.open(map, mark)
//                })
        }
        // console.log(markers);
        // console.log('subscribed!');
    });

}
initMap();

function onGMapsError() {
    alert('Sorry, an error occured when trying to load the Google Maps API.');
}

function createAttachMarker(place) {
    var marker = new google.maps.Marker({

        position: {
            lat: place.lat,
            lng: place.lon
        },
        map: map,
        title: place.name
    });
    markers.push(marker);
    var markName = '<h1>' + marker.title + '</h1>';
    var markCoor = '<p> (lat, lon):  ' + place.lat + ', ' + place.lon + '</p>';
    attachInfoWindow(place, marker, markName + '\n' + markCoor);
    place.marker = marker;
}

function showPlaceInfoWindow(place) {
    place.isActive = true;
    var m = place.marker;
    m.infowindow.open(m.get('map'), m);
    m.setAnimation(google.maps.Animation.BOUNCE);
    console.log(AppViewModel.currentPlace());
    var curr = AppViewModel.currentPlace();
    if(AppViewModel.currentPlace() !== null && curr.marker !== undefined) {
        AppViewModel.currentPlace().isActive = false;
        AppViewModel.currentPlace().marker.setAnimation(null);
        AppViewModel.currentPlace().marker.infowindow.close();
        AppViewModel.currentPlace(place);
    } else {
        AppViewModel.currentPlace(place);
    }
}
function attachInfoWindow(place, marker, contentString ) {
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    marker.infowindow = infowindow;
    place.marker = marker;
    marker.addListener('click', function() {
        // infowindow.open(marker.get('map'), marker);
        showPlaceInfoWindow(place);
    });
}