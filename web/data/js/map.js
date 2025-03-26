/*global L, mnccolors, mnclinks, InfoControl*/
/*jslint browser: true*/
var map, markers, circle, httpRequest = new XMLHttpRequest(), addedPoints = [], mapInfo = new InfoControl({position: 'bottomright', content: ''});
// Initialize the infoBox to show message
var infoBox = document.getElementById('infoBox');
var theMarker = {};

function getRequests() {
    var s1 = location.search.substring(1, location.search.length).split('&');
    var r = {};
    var s2, i;
    for (i = 0; i < s1.length; i += 1) {
        s2 = s1[i].split('=');
        r[s2[0].toLowerCase()] = s2[1];
    }
    return r;
};

function setParams() {
        var QueryString = getRequests();

	if (QueryString["mcc"]) {
        	document.getElementById("mcc").value = QueryString["mcc"];
        	document.getElementById("mnc").value = QueryString["mnc"];
        	document.getElementById("lac").value = QueryString["lac"];
        	document.getElementById("cell_id").value = QueryString["cell_id"];

        	document.getElementById("submit").click();
	}
}

function displayCircle(e) {
    'use strict';
    if (circle) {
        map.removeLayer(circle);
    }
    circle = L.circle(e.target.getLatLng(), e.target.feature.properties.range);
    circle.addTo(map);
}

function showPopup(feature, layer) {
    'use strict';
    var color,
        popupContent = 
            '<b>MCC</b>: ' + feature.properties.mcc +
            '<br/><b>MNC</b>: ' + feature.properties.net +
            '<br/><b>LAC / TAC</b>: ' + feature.properties.area +
            '<br/><b>CID</b>: ' + feature.properties.cell +
            '<br/><b>Radio Type</b>: ' + (feature.properties.radio || 'Unknown') +
            '</br></br><b>Latitude</b>: ' + feature.geometry.coordinates[1] +
            '</br><b>Longitude</b>: ' + feature.geometry.coordinates[0] +
            '</br><b>Range</b>: ' + feature.properties.range + ' m' +
            '<br/><br/><i>' + feature.properties.samples + '</i> measurements' +
            '</br><b>Created</b>: ' + new Date(feature.properties.created * 1000).toISOString() +
            '</br><b>Updated</b>: ' + new Date(feature.properties.updated * 1000).toISOString();
        color = '#000000';
    layer.bindPopup(
        popupContent,
        { autoPan: false }
    );
    var radioIcon = feature.properties.radio.substr(0, 1).toLowerCase();
    var iconColor = 'default';
    if (radioIcon == "g") {
        iconColor = 'E90003';
    } else if (radioIcon == "c") {
        iconColor = 'ED1B24';
    } else if (radioIcon == "u") {
        iconColor = 'FF6600';
    } else if (radioIcon == "l") {
        iconColor = '00ACD5';
    } else if (radioIcon == "n") {
        iconColor = 'FAA732';
    } else {
        radioIcon = 'default';
        iconColor = '6E6F72';
    }

    var iconPath = "/images/radio_icons/m_" + radioIcon + "_" + iconColor + ".png";

    layer.options.icon = L.icon({
        iconUrl: iconPath,
    });
    layer.on('click', displayCircle);
}

function addNewMarkers(feature) {
    'use strict';
    if (addedPoints.indexOf(feature.geometry.coordinates[0] + ',' + feature.geometry.coordinates[1]) >= 0) {
        return false;
    }
    addedPoints.push(feature.geometry.coordinates[0] + ',' + feature.geometry.coordinates[1]);
    return true;
}

function showMarkers(e) {
    'use strict';
    if (e.target.readyState === 4 && e.target.status === 200) {
        var cells = JSON.parse(e.target.response);
        markers.addLayer(
            L.geoJson(
                cells,
                {
                    onEachFeature: showPopup,
                    filter: addNewMarkers
                }
            )
        );
    }
}

function goToCell(e) {
    'use strict';
    if (e.target.readyState === 4 && e.target.status === 200) {
        var cell = JSON.parse(e.target.response);
        // Check if cell has valid locations
        // This is done to fix no response msg for OCID website in case of no cells
        // Checking explicitly for cell === false since cell can also contain "Too many requests" error in case of rate limit.
        if (cell.hasOwnProperty('lat') && cell.hasOwnProperty('lon')) {
            	map.setView(cell, 18);
		if (map.hasLayer(theMarker)) {
   			map.removeLayer(theMarker);
		}	
		theMarker = L.marker([cell.lat,cell.lon]).addTo(map);  
	    	//Hide the InfoBox immediately in case of successful response
            	hideInfoBox(0);
        } else if (cell == "Too many requests") {
            infoBox.innerHTML = "Request exceeded the rate-limits, please try again after some time.";
            hideInfoBox(5000);
        } else if (cell === "Invalid Request") {
            infoBox.innerHTML = "Invalid Request. Please ensure that correct mcc, mnc, lac (tac) and cid values are provided.";
            hideInfoBox(5000);
        } else if (cell === false) {
            infoBox.innerHTML = "Cell not found";
            hideInfoBox(5000);
        }
    }
}

// Hide the infoBox after the seconds provided in $duration
function hideInfoBox(duration) {
    setTimeout(function() {
        //infoBox.innerHTML = 'System OK';
    }, duration);
}

var SearchCellControl = L.Control.extend(
    {
        initialize: function (options) {
            'use strict';
            L.Util.setOptions(this, options);
        },
        searchCell: function () {
            'use strict';
            var ajax = new XMLHttpRequest();
            ajax.onreadystatechange = goToCell;

            ajax.open('GET', 'https://opencellid.gps4pets.de/api/?mcc=' + document.getElementById('mcc').value + '&mnc=' + document.getElementById('mnc').value + '&lac=' + document.getElementById('lac').value + '&cell_id=' + document.getElementById('cell_id').value);
            ajax.send(null);
        },
        onAdd: function () {
            'use strict';
            var container = L.DomUtil.create('div', 'search-cell-control'), fields = ['MCC', 'MNC', 'LAC', 'Cell ID'], i, id, field, label, input, br, submitBtn = L.DomUtil.create('button', '');
            container.insertAdjacentHTML('beforeend', '<div style="margin-bottom:5px"><b>Search Cell Towers</b></div>');
            for (i = 0; i < fields.length; i += 1) {
                id = fields[i].toLowerCase().replace(' ', '_');
                field = L.DomUtil.create('div', 'cellsearch-line');
                label = L.DomUtil.create('label', 'cellsearch-label');
                label.textContent = fields[i];
                label.setAttribute('for', id);
                field.appendChild(label);
                input = L.DomUtil.create('input', 'cellsearch-input');
                input.setAttribute('type', 'number');
                input.setAttribute('id', id);
                field.appendChild(input);
                br = L.DomUtil.create('br', '');
                field.appendChild(br);
                container.appendChild(field);
            }
            submitBtn.textContent = 'Search';
	    submitBtn.id = 'submit';
            submitBtn.addEventListener('click', this.searchCell, false);
            container.appendChild(submitBtn);
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    }
);

function init() {
    'use strict';
    var key = 'pk.b3962295d51013cd924ddea0eead2a78';

    var streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoomm: 18,
	attribution: '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    });

    streets = L.tileLayer('https://osm.gps4pets.de/osm_tiles/{z}/{x}/{y}.png', {
        maxZoomm: 18,
        attribution: '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    });


    map = L.map('map', {
        center: [54.346524,10.207548], //map loads with this location as center
        zoom: 8,
        maxZoom: 18,
        minZoom: 2,
        layers: [streets] // Show 'streets' by default
    });
    map.zoomControl.setPosition('topright');

    L.control.locate({ position: 'topright' }).addTo(map); 
    
    var coverage = L.tileLayer(
        "https://opencellid.org/images/maps/opencellid/{z}/{x}/{y}.png?v=",
        {
            maxNativeZoom: 10,
            maxZoom: 15,
        }
    ), legend = L.control({position: 'topleft'});
    coverage.addTo(map);
    L.control.layers({ 'Streets': streets }, { 'Coverage': coverage }).addTo(map);
   
    map.addControl(L.control.scale());
    map.addControl(new L.Control.Permalink({ useLocation: true, text: null }));

    map.addControl(new SearchCellControl({position: 'topleft'}));
    map.addControl(mapInfo);

    setParams();
}

window.addEventListener('load', init, false);
