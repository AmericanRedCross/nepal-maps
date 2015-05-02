var windowHeight = $(window).height();
var markers = new L.MarkerClusterGroup();
var thumbnails;
var extentButtons;
var sectorButtons;
var visibleExtents = [];
var visibleSectors = [];
var extentTags = [];
var sectorTags = [];
var hasInteractiveMapTags = [];
var markersBounds = [];


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

// beginning of function chain to initialize
function getMeta() {
  d3.csv("data/nepal-maps.csv", function(metadata){
    generateThumbnails(metadata);
  });
}

function generateThumbnails(metadata){

  function generateThumbnailHtml(item){
    var s3 = 'https://s3-us-west-2.amazonaws.com/arcmaps/nepal/'+item.filename;
    var link = '';
    if (item.link){
        link = '<p style="font-size:small; margin:6px 0 0 10px;"><b>Source:</b> <a href="'+item.link+'" target="_blank">'+item.link+'</a></p>';
    };
    var itemHtml = '<div onclick="callModal(this);" class="thumbnail">'+
        '<img class="lazy" data-original="img/thumbs/'+item.filename.slice(0,-4)+'_thumb.jpg'+'" width="300" height="200">'+
        '<div class="caption">'+
            '<h5 style="font-weight:bold;">'+item.title+'</h5>'+
            '<p style="font-size:small; margin:6px 0 0 0;">' + formatDate(new Date(item.date)) +'</p>'+
        '</div>'+
        '<div class="modalDescription" style="display:none;">'+
            '<h4 style="font-weight:bold;">'+item.title+' <small>('+formatDate(new Date(item.date))+')</small></h4>'+
            '<p style="font-size:small; margin:6px 0 0 10px;">'+item.description+'</p>'+
            '<p style="font-size:small; margin:6px 0 0 10px;"><b>Extent tags:</b> '+item.extent.replace(/\s/g, ', ')+'</p>'+
            '<p style="font-size:small; margin:6px 0 0 10px;"><b>Type tags:</b> '+item.sector.replace(/\s/g, ', ')+'</p>'+ link +
            '<br><a class="btn btn-primary btn-mini" href="'+s3+'" target="_blank">Download file ('+(item.map_size/1024/1024).toFixed(2)+' MB)</a>'+     
            ((item.interactiveMapLink != '') ? '<a class="btn btn-primary btn-mini" href="'+item.interactiveMapLink+'" target="_blank">Interactive Map</a>' : '') +
        '</div>'+
   '</div>';
   return itemHtml;
  }

  thumbnails = d3.select("#mappreviews").selectAll('div')
    .data(metadata).enter().append('div')
    .attr('id', function(d){ return d.thumbnail_id; })
    .classed('thumbnailWrap col-sm-3', true)
    .html(function(d) {return generateThumbnailHtml(d); })

    thumbnails.each(function(d){
        var element = d3.select(this);
        element.classed(d.extent, true);
        element.classed(d.sector, true);
        element.classed(d.hasInteractiveMap, true);

        // build arrays of tags
        var itemExtents = d.extent.match(/\S+/g);
        $.each(itemExtents, function(index, extent){
            if (extentTags.indexOf(extent) === -1){
                extentTags.push(extent);
            }
        });
        var itemSectors = d.sector.match(/\S+/g);
        $.each(itemSectors, function(index, sector){
            if (sectorTags.indexOf(sector) === -1){
                sectorTags.push(sector);
            }
        });
        
        var itemHasInteractiveMap = d.hasInteractiveMap.match(/\S+/g);
        $.each(itemHasInteractiveMap, function(index, hasInteractiveMap){
            if (hasInteractiveMapTags.indexOf(hasInteractiveMap) === -1){
                hasInteractiveMapTags.push(hasInteractiveMap);
            }
        });
      }
    )

    thumbnails.sort(function(a,b){
        var p = b.priority - a.priority;
      return b.priority - a.priority || new Date(b.date) - new Date(a.date);
    });

    $(function() {
        $("img.lazy").lazyload({
            effect: "fadeIn"
        });
    });

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
    
    hasInteractiveMapTags.sort();
    var hasInteractiveMapFilterHtml = '<button id="ALL-HASINTERACTIVEMAP" class="btn btn-small btn-sector filtering all" type="button" onclick="toggleFilter('+"'ALL-MAPTYPE'"+', this);"'+
        'style="margin-right:10px;">All <span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
    $.each(hasInteractiveMapTags, function(index, tag){
        var itemHtml = '<button id="'+tag+'" class="btn btn-small btn-sector" type="button" onclick="toggleFilter('+"'"+tag+"'"+', this);">'+tag+
            '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
        hasInteractiveMapFilterHtml += itemHtml;
    });
    $('#hasInteractiveMapButtons').html(hasInteractiveMapFilterHtml);
    hasInteractiveMapButtons = $("#hasInteractiveMapButtons").children();

    markersToMap();
}

// filter function
// ===============
function toggleFilter (filter, element) {
    // set both extent and sector to All, when no thumbnails are showing and refresh filters option is clicked
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
        
        $.each(hasInteractiveMapButtons, function(i, button){
            $(button).children().removeClass("glyphicon-check");
            $(button).children().addClass("glyphicon-unchecked");
            $(button).removeClass("filtering");
        })
        $("#ALL-HASINTERACTIVEMAP").children().removeClass("glyphicon-unchecked");
        $("#ALL-HASINTERACTIVEMAP").children().addClass("glyphicon-check");
        $("#ALL-HASINTERACTIVEMAP").addClass("filtering");
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
    
    // check to see what mapTypes are active
    visibleHasInteractiveMaps = [];
    $.each(hasInteractiveMapButtons, function(i, button){
        if($(button).hasClass("filtering")){
            var buttonid = $(button).attr("id");
            visibleHasInteractiveMaps.push(buttonid);
        }
    })
    toggleThumbnails();
}

function toggleThumbnails(){

  thumbnails.each(function(d){
    var thisThumbnail = d3.select(this);
    // thisThumbnail.style('display', 'none');
    var hasExtent = false;
    $.each(visibleExtents, function(iE, extent){
        if(thisThumbnail.classed(extent) || $.inArray("ALL-EXTENT", visibleExtents) != -1){
            hasExtent = true;
        }
    });
    var hasSectors = true;
    if($.inArray("ALL-SECTOR", visibleSectors) == -1){
      $.each(visibleSectors, function(iS, sector){
          if(thisThumbnail.classed(sector) === false){
              hasSectors = false;
          }
      });
    }
    var hashasInteractiveMaps = true;
    if($.inArray("ALL-HASINTERACTIVEMAPS", visibleHasInteractiveMaps) == -1){
      $.each(visibleHasInteractiveMaps, function(iS, hasInteractiveMap){
          if(thisThumbnail.classed(hasInteractiveMap) === false){
              hashasInteractiveMaps = false;
          }
      });
    }
    
    if(hasExtent === true && hasSectors === true && hashasInteractiveMaps === true){
      thisThumbnail.classed('noMatch', false);
    } else {
        thisThumbnail.classed('noMatch', true);
    }
  });
  thumbnailCount = 0;
  thumbnails.each(function(){
    if(d3.select(this).style('display') === 'block'){ thumbnailCount++; }
  });
  if (thumbnailCount === 0){
      map.removeLayer(markers);
  } else {
      markersToMap();
  }
}

function markersToMap(){
    map.removeLayer(markers);
    markers = new L.MarkerClusterGroup({
        showCoverageOnHover:false,
        maxClusterRadius: 40,
        spiderfyDistanceMultiplier:2
    });

    mappedMaps=[];

    function toGeoJson(d){
      if(d.longitude !== "null" && d.latitude !== "null"){
        latlng = [d.longitude, d.latitude];
        var mappedMap = {
          "type": "Feature",
          "properties": {
            "name": d.name,
            "thumbnail_id": d.thumbnail_id,
          },
          "geometry": {
            "type": "Point",
            "coordinates": latlng
          }
        };
        mappedMaps.push(mappedMap);
      }
    }

    thumbnails.filter(function(d){
      return d3.select(this).style('display') === "block"
    }).each(function(d){
      toGeoJson(d);
    });

    marker = L.geoJson(mappedMaps, {
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
    zoomOut();
}

$(window).resize(function(){
    map.fitBounds(markersBounds);
    windowHeight = $(window).height();
});


// reset map bounds using Zoom to Extent button
function zoomOut() {
    map.fitBounds(markersBounds);
}






// helper functions
// ================
var formatDate = d3.time.format("%b-%d");

function callModal (item) {
	var modalDescription = $(item).find('.modalDescription').html();
    var mapJpg = $(item).find('img').attr("data-original").slice(0,-10) + '_thumb.jpg';
    var img_maxHeight = (windowHeight*0.45).toString() + "px";
    $(".modal-detailedDescription").empty();
    $(".modal-detailedDescription").html(modalDescription);
    $(".modal-img").css('max-height', img_maxHeight);
    $(".modal-img").attr('src', mapJpg);
    $('#myModal').modal();
}

function toggleSearchType (item) {
    thumbnails.classed('noMatch', false);
    $(".filterinput").val('');
    var option = $(item).attr("id");
    // toggleFilter("REFRESH");
    switch (option) {
        case "filterSearchBtn":
            $("#filterSearchBtn").removeClass("inactiveSearchType").addClass("activeSearchType");
            $("#textSearchBtn").addClass("inactiveSearchType").removeClass("activeSearchType");
            $("#filterSearch").show();
            $("#textSearch").hide();
            break;
        case "textSearchBtn":
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

            thumbnails.classed('noMatch', false);

            // is there user input in the search box?
            if(filters) {
                $.each(filters, function(index, filter){
                    $matches = $(list).find('.thumbnailWrap:Contains(' + filter + ')');
                    $('.thumbnailWrap', list).not($matches).addClass('noMatch');
                });
            // if no user input, show all thumbnails
            } else {
              thumbnails.classed('noMatch', false);
            }

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


getMeta();
