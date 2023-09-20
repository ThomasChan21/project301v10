var lyrOSM;
var lyrWatercolor;
var lyrTopo;
var lyrImagery;
var lyrOutdoors;
var ctlSidebar;
var lyrICIRecords;
var lyrFirstHandResSale;
var lyrMarkerCluster;
var arICIFilter = [];
var arFirstHandResFilter = [];

$(document).ready(function () {
  // map class initialize
  var map = L.map('map').setView([22.38503, 114.14374], 12);
  map.zoomControl.setPosition('topleft');

  // adding side bar

  ctlSidebar = L.control.sidebar('side-bar').addTo(map);

  // adding easy button
  var ctlEasybutton;
  ctlEasybutton = L.easyButton(
    '<img src="./lib/svg/transfer-svgrepo-com.svg" style="width:14px">',
    function () {
      ctlSidebar.toggle();
    }
  ).addTo(map);

  // adding osm tilelayer
  // lyrOSM = L.tileLayer.provider('OpenStreetMap.Mapnik');
  lyrTopo = L.tileLayer.provider('OpenTopoMap');
  lyrImagery = L.tileLayer.provider('Esri.WorldImagery');
  lyrOutdoors = L.tileLayer.provider('Thunderforest.Outdoors');
  lyrWatercolor = L.tileLayer.provider('Stamen.Watercolor');

  var lyrTopo_tc = L.layerGroup.hongKong('topography.tc');
  var lyrImagery_tc = L.layerGroup.hongKong('imagery.tc');

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });

  lyrTopo_tc.addTo(map);

  //add map scale
  L.control.scale().addTo(map);

  //Map coordinate display
  map.on('mousemove', function (e) {
    $('.coordinate').html(
      `Lat: ${e.latlng.lat.toFixed(5)} Lng: ${e.latlng.lng.toFixed(5)}`
    );
  });

  //Addming marker in the center of map

  var icnLAMSubject = L.AwesomeMarkers.icon({
    icon: 'home',
    markerColor: 'pink',
    prefix: 'fa',
  });

  var singleMarker = L.marker([22.38503, 114.14374], {
    icon: icnLAMSubject,
    draggable: true,
  })
    .bindPopup('Subject Property')
    .addTo(map)
    .openPopup();

  //Leaflet layer control
  var baseMaps = {
    'Topography Chinese': lyrTopo_tc,
    'Imagery Chinese': lyrImagery_tc,
    OSM: osm,
    Imagery: lyrImagery,
    'Topo Map': lyrTopo,
    Outdoors: lyrOutdoors,
    Watercolor: lyrWatercolor,
  };

  var overlayMaps = {
    'Single Marker': singleMarker,
  };

  ctlLayers = L.control
    .layers(baseMaps, overlayMaps, { collapsed: true, position: 'topright' })
    .addTo(map);

  //Leaflet browser print function
  L.control.browserPrint({ position: 'topright' }).addTo(map);

  //Leaflet search
  L.Control.geocoder().addTo(map);

  //Leaflet measure
  L.control
    .measure({
      primaryLengthUnit: 'kilometers',
      secondaryLengthUnit: 'meter',
      primaryAreaUnit: 'sqmeters',
      secondaryAreaUnit: undefined,
    })
    .addTo(map);

  //zoom to layer
  $('.zoom-to-layer').click(function () {
    map.setView([22.38503, 114.14374], 12);
  });

  // create different icons
  icnRedSprite = L.spriteIcon('red');
  icnVioletSprite = L.spriteIcon('violet');
  icnBlueSprite = L.spriteIcon('blue');
  icnLAMWB = L.AwesomeMarkers.icon({
    icon: 'flag',
    markerColor: 'orange',
    prefix: 'fa',
  });
  icnLAMOthers = L.AwesomeMarkers.icon({
    icon: 'star',
    markerColor: 'red',
    prefix: 'fa',
  });
  icnLAMIB = L.AwesomeMarkers.icon({
    icon: 'building',
    markerColor: 'darkred',
    prefix: 'fa',
  });

  // ~~ Loading data session ~~

  // **************** ICI transaction rexcords - data from local file **************

  var url_ici = 'data/wb_all_220818.geojson';

  // Loop to get the property type and disctrict list

  var arrTypeFilter = [];
  var arrDistrictFilter = [];

  $.getJSON(url_ici, function (data) {
    $.each(data.features, function (key, value) {
      if (arrTypeFilter.indexOf(value.properties.property_type_ZH) == -1) {
        arrTypeFilter.push(value.properties.property_type_ZH);
      }
      if (arrDistrictFilter.indexOf(value.properties.subdistrict_ZH) == -1) {
        arrDistrictFilter.push(value.properties.subdistrict_ZH);
      }
    });
    arrTypeFilter.sort();
    arrDistrictFilter.sort();

    $.each(arrTypeFilter, function (index, value) {
      $('#typeFilter').append(
        '<option value="' + value + '">' + value + '</option>'
      );
    });
    $.each(arrDistrictFilter, function (index, value) {
      $('#districtFilter').append(
        '<option value="' + value + '">' + value + '</option>'
      );
    });
  });

  lyrMarkerCluster = L.markerClusterGroup();
  lyrICIRecords = L.geoJSON.ajax(url_ici, {
    pointToLayer: returnICIMarker,
    filter: filterLICI,
  });

  lyrICIRecords.on('data:loaded', function () {
    lyrMarkerCluster.clearLayers();
    lyrMarkerCluster.addLayer(lyrICIRecords);
    lyrMarkerCluster;
    map.fitBounds(lyrMarkerCluster.getBounds());
  });
  ctlLayers.addOverlay(lyrMarkerCluster, '工商舖成交個案');

  $('#typeFilter').change(function (e) {
    console.log(e.target.value);
    // console.log($("#userFilter").val());
  });

  $('#btnFilterICI').click(function () {
    var flagICI;
    if (lyrICIRecords) {
      console.log('will remove layer - lyrLandSaleRecords ...');
      ctlLayers.removeLayer(lyrICIRecords);
      lyrICIRecords.remove();
    }
    lyrICIRecords = L.geoJSON.ajax(url_ici, {
      pointToLayer: returnICIMarker,
      onEachFeature: processICI,
      filter: filterLICI,
    });
    lyrICIRecords.on('data:loaded', function () {
      lyrMarkerCluster.clearLayers();
      lyrMarkerCluster.addLayer(lyrICIRecords);
      lyrMarkerCluster.addTo(map);
      map.fitBounds(lyrMarkerCluster.getBounds());
      flagICI = 1;
      if (arICIFilter.length > 0) {
        $('#divICISaleQty').html(
          'No. of Records found : ' + arICIFilter.length
        );
      }
    });
    if (flagICI != 1) {
      $('#divICISaleQty').html('No. of Records found : 0');
    }
    arICIFilter = [];
  });

  // Loading Data of First hand residential sale

  // **************** First hand residential sale - data from local file **************

  var url_firsthandres = 'data/first_hand_res_211021.geojson';

  // Loop to get the sale status and disctrict list

  var arrsaleStatusFilter = [];
  var arrDistrictFilter2 = [];

  $.getJSON(url_firsthandres, function (data) {
    $.each(data.features, function (key, value) {
      if (arrsaleStatusFilter.indexOf(value.properties.Status) == -1) {
        arrsaleStatusFilter.push(value.properties.Status);
      }
      if (arrDistrictFilter2.indexOf(value.properties.district) == -1) {
        arrDistrictFilter2.push(value.properties.district);
      }
    });
    arrsaleStatusFilter.sort();
    arrDistrictFilter2.sort();

    $.each(arrsaleStatusFilter, function (index, value) {
      $('#saleStatusFilter').append(
        '<option value="' + value + '">' + value + '</option>'
      );
    });
    $.each(arrDistrictFilter2, function (index, value) {
      $('#districtFilter2').append(
        '<option value="' + value + '">' + value + '</option>'
      );
    });
  });

  lyrFirstHandResSale = L.geoJSON.ajax(url_firsthandres, {
    pointToLayer: returnFirstHandResMarker,
    onEachFeature: processFirstHandRes,
    filter: filterFirstHandRes,
  });

  ctlLayers.addOverlay(lyrFirstHandResSale, '一手住宅銷售');

  $('#btnFilterFirstHandRes').click(function () {
    var flagFirstHandRes;
    if (lyrFirstHandResSale) {
      ctlLayers.removeLayer(lyrFirstHandResSale);
      lyrFirstHandResSale.remove();
    }
    lyrFirstHandResSale = L.geoJSON
      .ajax(url_firsthandres, {
        pointToLayer: returnFirstHandResMarker,
        onEachFeature: processFirstHandRes,
        filter: filterFirstHandRes,
      })
      .addTo(map);
    ctlLayers.addOverlay(lyrFirstHandResSale, '一手住宅銷售');
    lyrFirstHandResSale.on('data:loaded', function () {
      map.fitBounds(lyrFirstHandResSale.getBounds());
      flagFirstHandRes = 1;
      if (arFirstHandResFilter.length > 0) {
        $('#divFirstHandResQty').html(
          'No. of Records found : ' + arFirstHandResFilter.length
        );
      }
    });
    if (flagFirstHandRes != 1) {
      $('#divFirstHandResQty').html('No. of Records found : 0');
    }
    arFirstHandResFilter = [];
  });
});

//Full screen map view
var mapId = document.getElementById('map');
function fullScreenView() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    mapId.requestFullscreen();
  }
}

function processICI(json) {
  var att = json.properties;
  arICIFilter.push(att.street_EN.toString());
}

function filterLICI(json) {
  var att = json.properties;
  var optTypeFilter = $('#typeFilter').val();
  var optDistrictFilter = $('#districtFilter').val();

  if (optTypeFilter == 'ALL' && optDistrictFilter == 'ALL') {
    return true;
  } else if (optTypeFilter == 'ALL' && optDistrictFilter != 'ALL') {
    return att.subdistrict_ZH == optDistrictFilter;
  } else if (optDistrictFilter == 'ALL' && optTypeFilter != 'ALL') {
    return att.property_type_ZH == optTypeFilter;
  } else {
    return (
      att.property_type_ZH == optTypeFilter &&
      att.subdistrict_ZH == optDistrictFilter
    );
  }
}

function returnICIMarker(json, latlng) {
  var att = json.properties;
  if (att.floor_ZH == '全幢') {
    var icnICI = icnLAMWB;
  } else {
    var icnICI = icnLAMOthers;
  }

  return L.marker(latlng, { icon: icnICI }).bindPopup(
    '<h4>' +
      att.property_type_ZH +
      '成交</h4>' +
      '成交日期: ' +
      att.Date +
      '<br>地區: ' +
      att.subdistrict_ZH +
      '<br>地址: ' +
      att.street_ZH +
      att.floor_ZH +
      att.unit_ZH +
      "<a href='" +
      att.link +
      "' target='blank'>" +
      "<img src='image/" +
      att.photo_name +
      "' width='300px' height='250px'></a>" +
      '<br>建築面積 (平方呎): ' +
      formatNumber(att.existing_gfa_total) +
      '<br>成交金額 (HK$M): ' +
      formatNumber(att.txn_amt) +
      '<br>Remark: ' +
      att.remark
  );
}

function returnFirstHandResMarker(json, latlng) {
  var att = json.properties;
  var sold_percentage = 100 * (att.No_Of_Units_Sold / att.Total_No_Of_Units);

  return L.marker(latlng).bindPopup(
    '<b>發展項目: </b>' +
      att.New_Property_Name +
      '<br>' +
      '<b>項目位置: </b>' +
      att.Address +
      '<br>' +
      '<b>項目單位數目: </b>' +
      formatNumber(att.Total_No_Of_Units) +
      '<br>' +
      '<b>已售單位數目: </b>' +
      formatNumber(att.No_Of_Units_Sold) +
      '<br>' +
      '<b>售出單位百分比: </b>' +
      "<progress id='file' max='100' value='" +
      sold_percentage.toFixed(0) +
      "'> </progress>" +
      sold_percentage.toFixed(0) +
      '%' +
      '<br>' +
      '<b>平均呎價: $' +
      formatNumber(att.Avg_Unit_Rate) +
      '</b>' +
      '<br>' +
      '<b>項目發展商: </b>' +
      att.Developer +
      '<br>' +
      '<b>首次出售日期: </b>' +
      att.First_Sales_Date +
      '<br>' +
      '<b>更新日期: </b>' +
      att.Date_Of_Information +
      '<br>'
  );
}

function processFirstHandRes(json) {
  var att = json.properties;
  arFirstHandResFilter.push(att.Address.toString());
}

function filterFirstHandRes(json) {
  var att = json.properties;
  var optStatusFilter = $('#saleStatusFilter').val();
  var optDistrictFilter2 = $('#districtFilter2').val();

  if (optStatusFilter == 'ALL' && optDistrictFilter2 == 'ALL') {
    return true;
  } else if (optStatusFilter == 'ALL' && optDistrictFilter2 != 'ALL') {
    return att.district == optDistrictFilter2;
  } else if (optDistrictFilter2 == 'ALL' && optStatusFilter != 'ALL') {
    return att.Status == optStatusFilter;
  } else {
    return att.Status == optStatusFilter && att.district == optDistrictFilter2;
  }
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}
