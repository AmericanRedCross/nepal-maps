var extentButtons;
var sectorButtons;
var visibleExtents = [];
var visibleSectors = [];
var extentTags = [];
var sectorTags = [];
var thumbnails;
var windowHeight = $(window).height();

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
}

//disclaimer text
function showDisclaimer() {
    window.alert("The maps on this page do not imply the expression of any opinion on the part of the British Red Cross, American Red Cross or the International Federation of Red Cross and Red Crescent Societies or National Societies concerning the legal status of a territory or of its authorities.");
}

function callModal (thumbnail) {    
    var description = $(thumbnail).find('.caption').html();
    var previewImgSrc = "img/" + $(thumbnail).find('.pdfButton').attr("href").slice(50,-4) + '(low-quality).jpg';
    var modalPdfButton = $(thumbnail).find('.pdfButtonContainer').html();
    var img_maxHeight = (windowHeight*0.60).toString() + "px";
    $(".modal-detailedDescription").empty();    
    $(".modal-detailedDescription").html(description); 
    $(".modal-img").css('max-height', img_maxHeight);
    $(".modal-img").attr('src', previewImgSrc);
    $(".modalPdfButton").html(modalPdfButton);    
    $('#myModal').modal();    
}

// beginning of function chain
function getCentroids() {
    $.ajax({
        type: 'GET',
        url: '../data/centroids.json',
        contentType: 'application/json',
        dataType: 'json',
        timeout: 10000,
        success: function(data) {                             
            //generate html to display map thumbnails
            generatepreviewhtml(data);
        },
        error: function(e) {
            console.log(e);
        }
    });
}

//generates html for preview boxes using data from centroid.json
function generatepreviewhtml(data){
    var html="";
    function formatDate(date){
        var formattedDate = new Date(date).toString().substring(4,15);
        return formattedDate;
    }
    $.each(data, function(index, item){
        var pdfSrc = 'https://s3-us-west-2.amazonaws.com/arcmaps/haiyan/' + item.filename + '.pdf';
        var small_pdf = '';
        if(item.small_pdf == "TRUE"){
            small_pdf = '<a href="https://s3-us-west-2.amazonaws.com/arcmaps/haiyan/'+item.filename+'(small).pdf'+'" target="_blank" style="margin:2px;" class="btn btn-primary btn-mini">Reduced-size PDF ('+(item.small_pdf_size/1024).toFixed(0)+' KB)</a>'; 
        };
        var link = '';
        if (item.link){
            link = '<p style="font-size:small; margin:0 0 0 10px;"><b>Source:</b> <a href="'+item.link+'" target="_blank">'+item.link+'</a></p>';
        };
        var itemhtml = '<div id="'+item.thumbnail_id+'" style="display:none," class="thumbnailWrap ALL-EXTENT ALL-SECTOR mapped '+item.extent+' '+item.sector+'">' +
            '<div class="row thumbnail" style="min-height:0; margin-left:0; margin-right:0; padding:10px">'+            
                '<div class="caption col-sm-8" style="padding:0;">'+            
                    '<h5 style="margin:0; font-weight:bold;">'+item.title+'<small> - '+formatDate(item.date)+'</small>'+'</h5>'+                        
                        '<p style="font-size:small; margin:0 0 0 10px;"><b>Description: </b>'+item.description+'</p>'+ 
                        '<p style="font-size:small; margin:0 0 0 10px;"><b>Extent tags: </b>'+item.extent.replace(/\s/g, ', ')+'</p>'+                         
                        '<p style="font-size:small; margin:0 0 0 10px;"><b>Type tags: </b>'+item.sector.replace(/\s/g, ', ')+'</p>'+link+

                '</div>'+           
                '<div class="col-sm-4">'+
                    '<div class="pdfButtonContainer">'+
                        '<a href="' + pdfSrc + '" target="_blank" style="margin:2px;" class="pdfButton btn btn-primary btn-mini">Download PDF ('+(item.pdf_size/1024/1024).toFixed(2)+' MB)</a>'+
                        small_pdf +
                    '</div>' +
                    '<button type="button" onclick="callModal(' + item.thumbnail_id + ');" class="btn btn-link btn-mini">Preview low-quality JPG</button><br>' +
                '</div></div></div>';
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