var windowHeight = $(window).height();
var extentButtons;
var sectorButtons;
var visibleExtents = [];
var visibleSectors = [];
var extentTags = [];
var sectorTags = [];
var thumbnails;
var mapsData;
var centroids = [];
var markersBounds = [];
var displayedPoints = [];
var markers = new L.MarkerClusterGroup();

var centroidOptions = {
    radius: 8,
    fillColor: "#ED1B2E",
    color: "#FFF",
    weight: 2.5,
    opacity: 1,
    fillOpacity: 1
};

var mapUrl = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
var mapAttribution = 'Map data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | Map style by <a href="http://hot.openstreetmap.org" target="_blank">H.O.T.</a> | &copy; <a href="http://redcross.org" title="Red Cross" target="_blank">Red Cross</a> 2013 | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';
var mapTiles = L.tileLayer(mapUrl, {attribution: mapAttribution});

var map = L.map('map', {
    zoom: 0,
    maxZoom: 15,
    scrollWheelZoom: false,
    layers: [mapTiles]
});

function callModal (item) {
	var modalDescription = $(item).find('.modalDescription').html();
    var mapJpg = $(item).find('img').attr("data-original").slice(0,-10) + '.jpg';
    var img_maxHeight = (windowHeight*0.60).toString() + "px";
    $(".modal-detailedDescription").empty();
    $(".modal-detailedDescription").html(modalDescription);
    $(".modal-img").css('max-height', img_maxHeight);
    $(".modal-img").attr('src', mapJpg);
    $('#myModal').modal();
}

function toggleSearchType (item) {
    var option = $(item).attr("id");
    switch (option) {
        case "filterSearchBtn":
            $(".filterinput").val('');
            toggleFilter("REFRESH");
            $("#filterSearchBtn").removeClass("inactiveSearchType").addClass("activeSearchType");
            $("#textSearchBtn").addClass("inactiveSearchType").removeClass("activeSearchType");
            $("#filterSearch").show();
            $("#textSearch").hide();
            break;
        case "textSearchBtn":
            toggleFilter("REFRESH");
            $("#textSearchBtn").removeClass("inactiveSearchType").addClass("activeSearchType");
            $("#filterSearchBtn").addClass("inactiveSearchType").removeClass("activeSearchType");
            $("#textSearch").show();
            $("#filterSearch").hide();
            break;
    }
}

//disclaimer text
function showDisclaimer() {
    window.alert("The maps on this page do not imply the expression of any opinion on the part of the International Federation of Red Cross and Red Crescent Societies or National Societies concerning the legal status of a territory or of its authorities.");
}

// on marker click open modal
function centroidClick (e) {
    var thumbnail_id = "#" + e.target.feature.properties.thumbnail_id;
    if ($(thumbnail_id).hasClass("ONLINE")) {
        url = $(thumbnail_id).find('a').attr('href');
        window.open(url, '_blank');
    } else {
        callModal(thumbnail_id);
    }
}
// on marker mouseover
function displayName(e) {
    var target = e.target;
    target.openPopup();
}
// on marker mouseout
function clearName(e) {
    var target = e.target;
    target.closePopup();
}


// beginning of function chain to initialize
function getCentroids() {
  d3.csv("../data/nepal-maps.csv", function(data){
    mapsData = data;
    generatepreviewhtml(data);
  });
}

//generates html for preview boxes
function generatepreviewhtml(data){
    var html = "";
    function formatDate(date){
        var formattedDate = new Date(date).toString().substring(4,15);
        return formattedDate;
    }

    $.each(data, function(index, item){
        var pdfSrc = 'https://s3-us-west-2.amazonaws.com/arcmaps/nepal/'+item.filename;
        var link = '';
        if (item.link){
            link = '<p style="font-size:small; margin:6px 0 0 10px;"><b>Source:</b> <a href="'+item.link+'" target="_blank">'+item.link+'</a></p>';
        };
        var itemhtml =
            '<div id="'+item.thumbnail_id+'" style="display:none," class="thumbnailWrap col-sm-3 ALL-EXTENT ALL-SECTOR mapped '+item.extent+' '+item.sector+'">'+
                '<div onclick="callModal(this);" class="thumbnail">'+
                    '<img class="lazy" data-original="img/thumbs/'+item.filename.slice(0,-4)+'_thumb.jpg'+'" width="300" height="200" alt="" >'+
                    '<div class="caption">'+
                        '<h5 style="font-weight:bold;">'+item.title+'</h5>'+
                        '<p style="font-size:small; margin:6px 0 0 0;">' + formatDate(item.date) +'</p>'+
                    '</div>'+
                    '<div class="modalDescription" style="display:none;">'+
                        '<h4 style="font-weight:bold;">'+item.title+' <small>('+formatDate(item.date)+')</small></h4>'+
                        '<p style="font-size:small; margin:6px 0 0 10px;">'+item.description+'</p>'+
                        '<p style="font-size:small; margin:6px 0 0 10px;"><b>Extent tags:</b> '+item.extent.replace(/\s/g, ', ')+'</p>'+
                        '<p style="font-size:small; margin:6px 0 0 10px;"><b>Type tags:</b> '+item.sector.replace(/\s/g, ', ')+'</p>'+ link +
                        '<br><a class="btn btn-primary btn-mini" href="'+pdfSrc+'" target="_blank">Download PDF ('+(item.pdf_size/1024/1024).toFixed(2)+' MB)</a>'+
                    '</div>'+
               '</div>'+
            '</div>';
        html=html+itemhtml;
        var itemExtents = item.extent.match(/\S+/g);
        $.each(itemExtents, function(index, extent){
            if (extentTags.indexOf(extent) === -1){
                extentTags.push(extent);
            }
        });
        var itemSectors = item.sector.match(/\S+/g);
        $.each(itemSectors, function(index, sector){
            if (sectorTags.indexOf(sector) === -1){
                sectorTags.push(sector);
            }
        });
    });
    $('#mappreviews').html(html);
    thumbnails = $(".thumbnailGallery").children();
    generateFilterButtons();
}

function generateFilterButtons(){
    extentTags.sort();
    var extentFilterHtml = '<button id="ALL-EXTENT" class="btn btn-small btn-extent filtering all" type="button" onclick="toggleFilter('+"'ALL-EXTENT'"+', this);"'+
        ' style="margin-right:10px;">All<span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
    $.each(extentTags, function(index, tag){
        var itemHtml = '<button id="'+tag+'" class="btn btn-small btn-extent" type="button" onclick="toggleFilter('+"'"+tag+"'"+', this);">'+tag+
            '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
        extentFilterHtml += itemHtml;
    });
    $('#extentButtons').html(extentFilterHtml);
    extentButtons = $("#extentButtons").children();

    sectorTags.sort();
    var sectorFilterHtml = '<button id="ALL-SECTOR" class="btn btn-small btn-sector filtering all" type="button" onclick="toggleFilter('+"'ALL-SECTOR'"+', this);"'+
        'style="margin-right:10px;">All <span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
    $.each(sectorTags, function(index, tag){
        var itemHtml = '<button id="'+tag+'" class="btn btn-small btn-sector" type="button" onclick="toggleFilter('+"'"+tag+"'"+', this);">'+tag+
            '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
        sectorFilterHtml += itemHtml;
    });
    $('#sectorButtons').html(sectorFilterHtml);
    sectorButtons = $("#sectorButtons").children();
    formatCentroids();
}

function formatCentroids(){
    $.each(mapsData, function(index, item) {
        latlng = [item.longitude, item.latitude];
        var mapCoord = {
            "type": "Feature",
            "properties": {
                "name": item.name,
                "thumbnail_id": item.thumbnail_id,
            },
            "geometry": {
                "type": "Point",
                "coordinates": latlng
            }
        }
        centroids.push(mapCoord);
    });
    toggleFilter("REFRESH");
}

function toggleFilter (filter, element) {
    // set both extent and sector to All, when no thumbnails are showing and refresh filters option is clicked
    $.each(thumbnails, function(i, thumbnail){
        $(thumbnail).removeClass("noSearchMatch").removeClass("mapped");
    });
    if(filter === "REFRESH"){
        $.each(extentButtons, function(i, button){
            $(button).children().removeClass("glyphicon-check");
            $(button).children().addClass("glyphicon-unchecked");
            $(button).removeClass("filtering");
        })
        $("#ALL-EXTENT").children().removeClass("glyphicon-unchecked");
        $("#ALL-EXTENT").children().addClass("glyphicon-check");
        $("#ALL-EXTENT").addClass("filtering");
        $.each(sectorButtons, function(i, button){
            $(button).children().removeClass("glyphicon-check");
            $(button).children().addClass("glyphicon-unchecked");
            $(button).removeClass("filtering");
        })
        $("#ALL-SECTOR").children().removeClass("glyphicon-unchecked");
        $("#ALL-SECTOR").children().addClass("glyphicon-check");
        $("#ALL-SECTOR").addClass("filtering");
    } else {
    // if a filter button is clicked
        var containerId = '#' + $(element).parent().attr('id');
        var sameFilterButtons = $(containerId).children();
        // check if filter is for all
        if($(element).hasClass('all')){
            $.each(sameFilterButtons, function(i, button){
                $(button).children().removeClass("glyphicon-check");
                $(button).children().addClass("glyphicon-unchecked");
                $(button).removeClass("filtering");
            })
            $(element).children().removeClass("glyphicon-unchecked");
            $(element).children().addClass("glyphicon-check");
            $(element).addClass("filtering");
        } else {
            // clear the ALL filter for the filter category
            var sameCategoryAll = $(containerId).find('.all');
            $(sameCategoryAll).children().addClass("glyphicon-unchecked");
            $(sameCategoryAll).children().removeClass("glyphicon-check");
            $(sameCategoryAll).removeClass("filtering");

            // if clicked sector filter is on, then turn it off
            if($(element).hasClass("filtering") === true){
                $(element).removeClass("filtering");
                $(element).children().removeClass("glyphicon-check");
                $(element).children().addClass("glyphicon-unchecked");
                // if no sector filters are turned on, toggle 'All' back on
                var noSectorFiltering = true;
                $.each(sameFilterButtons, function(i, button){
                    if ($(button).hasClass("filtering")){
                        noSectorFiltering = false;
                    }
                });
                if (noSectorFiltering === true){
                    $(sameCategoryAll).children().removeClass("glyphicon-unchecked");
                    $(sameCategoryAll).children().addClass("glyphicon-check");
                    $(sameCategoryAll).addClass("filtering");
                }
            // if clicked sector filter is off, then turn it on
            } else {
                $(element).addClass("filtering");
                $(element).children().removeClass("glyphicon-unchecked");
                $(element).children().addClass("glyphicon-check");
            }
        }
    }
    // check to see what which extents are active
    visibleExtents = [];
    $.each(extentButtons, function(i, button){
        if($(button).hasClass("filtering")){
            var buttonid = $(button).attr("id");
            visibleExtents.push(buttonid);
        }
    })
    // check to see what sectors are active
    visibleSectors = [];
    $.each(sectorButtons, function(i, button){
        if($(button).hasClass("filtering")){
            var buttonid = $(button).attr("id");
            visibleSectors.push(buttonid);
        }
    })
    toggleThumbnails();
}

function toggleThumbnails (){
    $(thumbnails).hide();
    $.each(thumbnails, function(iT, thumbnail){
        var hasExtent = false;
        $.each(visibleExtents, function(iE, extent){
            if($(thumbnail).hasClass(extent)){
                hasExtent = true;
            }
        });
        var hasSectors = true;
        $.each(visibleSectors, function(iS, sector){
            if($(thumbnail).hasClass(sector) === false ){
                hasSectors = false;
            }
        });
        if(hasExtent === true && hasSectors === true){
            $(thumbnail).show();
            $(thumbnail).addClass("mapped");
        }
    });
    thumbnailCount = $(thumbnails).filter(function(){return $(this).css('display') === 'block';}).length;
    if (thumbnailCount === 0){
        map.removeLayer(markers);
    } else {
        markersToMap();
    }
}

function markersToMap(){
    $(function() {
        $("img.lazy").lazyload({
            effect: "fadeIn"
        });
    });
    map.removeLayer(markers);
    markers = new L.MarkerClusterGroup({
        showCoverageOnHover:false,
        maxClusterRadius: 40,
        spiderfyDistanceMultiplier:2
    });
    idList = [];
    displayedPoints=[];
    //build array of visible thumbnail IDs
    $.each(thumbnails, function (i, thumbnail){
       if($(thumbnail).hasClass("mapped")){
           idList.push($(thumbnail).attr("id"));
       }
    })
    $.each(centroids, function (i, centroid){
       var centroid_id = centroid.properties.thumbnail_id;
       if ($.inArray(centroid_id, idList) !== -1){
           displayedPoints.push(centroid);
       }
    })
    marker = L.geoJson(displayedPoints, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, centroidOptions);
        },
        onEachFeature: function(feature, layer) {
            var thumbnail_id = "#" + feature.properties.thumbnail_id;
            var popupContent = $(thumbnail_id).find('.caption').html();
            var popupOptions = {
                'minWidth': 30,
                'offset': [0,-10],
                'closeButton': false,
            };
            layer.bindPopup(popupContent, popupOptions);
            layer.on({
                click: centroidClick,
                mouseover: displayName,
                mouseout: clearName,
            });
        }
    });
    markers.addLayer(marker);
    markers.addTo(map);
    markersBounds = markers.getBounds();
    markersBounds._northEast.lat += 0.05;
    markersBounds._northEast.lng += 0.05;
    markersBounds._southWest.lat -= 0.05;
    markersBounds._southWest.lat -= 0.05;
    map.fitBounds(markersBounds);
}

$(window).resize(function(){
    map.fitBounds(markersBounds);
    windowHeight = $(window).height();
})


// reset map bounds using Zoom to Extent button
function zoomOut() {
    map.fitBounds(markersBounds);
}


// Search Box
(function ($) {
  jQuery.expr[':'].Contains = function(a,i,m){
      return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
  };

  function filterList(header, list) {
    var form = $("<form>").attr({"class":"filterform","action":"#"}),
        input = $("<input>").attr({"class":"filterinput","type":"text"});
    $(form).append(input).appendTo(header);

    $(input)
      .change( function () {
            var filters = $(this).val().match(/\S+/g);
            $.each(thumbnails, function(index, thumbnail){
                $(thumbnail).removeClass("noSearchMatch").removeClass("mapped");
            });
            if(filters) {
                $.each(filters, function(index, filter){
                    $matches = $(list).find('.thumbnailWrap:Contains(' + filter + ')');
                    $('.thumbnailWrap', list).not($matches).addClass("noSearchMatch");
                });
            } else {
                $(thumbnails).find(".thumbnailWrap").show();
            }
            $.each(thumbnails, function(index, thumbnail){
                if($(thumbnail).hasClass("noSearchMatch")){
                    $(thumbnail).hide();
                } else {
                    $(thumbnail).addClass("mapped").show();
                }
            });
            markersToMap();
            return false;
        })
      .keyup( function () {
            $(this).change();
        });
  }
  $(function () {
    filterList($("#form"), $("#mappreviews"));
  });
}(jQuery));



// start function chain to initialize map
getCentroids();
