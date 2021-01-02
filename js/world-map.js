// SVG size params
var width = 960;
var height = 500;

// Create a tooltip
var tooltip = d3.select("body").append("div")    
    .attr("id", "tooltip")                
    .style("opacity", 0);

// Initiate SVG
var svg = d3.select("#chart")
            .attr("width", width)
            .attr("height", height)  

// Define natural earth projection
var projection = d3.geoNaturalEarth()

// Define path
var path = d3.geoPath().projection(projection);
var graticule = d3.geoGraticule();

// Add gridlines
svg.append("g")
    .attr("id", "gridLines")
    .append('path')
      .datum(graticule)
        .attr("class", "gridline")
         .attr("d", path)

// Load country and population data
queue()
    .defer(d3.json, "data/world_countries.json")
    .defer(d3.json, "data/isw_products.json")
    .await(ready);

// Load data callback 
function ready(error, countries, products) {

  // Calculate publications per country
  publicationTotals = {}
  products.forEach(function(product){
    product.countries['all mentioned countries'].forEach(function(country){
      publicationTotals[country] = (publicationTotals[country] || 0) + 1;
    })
  })

  // Calculate publications per country 
  countries.features.forEach(function(feature) {
    feature.properties.publications = publicationTotals[feature.properties.name] || 0;
  });

  // Color domain and ranges
  var domain = d3.extent(countries.features, d => d.properties.publications);
  var range = [d3.interpolateBlues(0),d3.interpolateBlues(1)]
  var color = d3.scaleSqrt()
                  .domain(domain)
                  .range(range);

  // Add country elements
  svg.append("g")
      .attr("id", "countries")
    .selectAll("path")
      .data(countries.features)
    .enter().append("path")
      .attr("d", path)
      .attr("class", "country")
      .style("fill", d => color(d.properties.publications))
      .on('mouseover', mouseover)
      .on('mouseout', mouseout)
      .on("click", click)

  // Add map outline
  svg.append("g")
      .attr("id", "outline")
      .append('path')
        .datum(graticule.outline())
          .attr("class", "outline")
           .attr("d", path)

  // Country mouseover callback 
  function mouseover(d) {        
    d3.select(this)
      .classed("highlight", true);

    var bbox = this.getBBox();
    var matrix = this.getScreenCTM()
      .translate(+ bbox.x, + bbox.y); 

    tooltip
      .html(
        "<p><span class='label'>Country: </span>" + d.properties.name + "</p>" + 
        "<p><span class='label'>Publications: </span>" + d.properties.publications + "</p>"
      ) 
      .style("left", (window.pageXOffset + matrix.e + (bbox.width/2) - ($("#tooltip").outerWidth()/2) ) + "px")
      .style("top", (window.pageYOffset + matrix.f - $("#tooltip").outerHeight() - 5) + "px")
      .style("opacity", 1)
  }

  // Country mouseout callback 
  function mouseout(d) {        
    tooltip
      .html("") 
      .style("opacity", 0); 

    d3.select(this)
      .classed("highlight", false);
  }

  // Country click callback to display related products
  function click(d) {
    console.log(d.properties.name)

    // Filter products by selected country name 
    var filteredProducts = products.filter(function(product){
      return product.countries['all mentioned countries'].indexOf(d.properties.name) > -1
    })

    // 
    $("#results").html('<h2>' + 
                       d.properties.name + ': ' + 
                       d.properties.publications + ' ISW article' + (d.properties.publications != 1 ? 's': '') + 
                       '</h2>')

    filteredProducts.forEach(function(product){
      $("#results").append("<div class='result'>" + 
                           "<p><a href='" + product.url + "' target='_blank'>" + product.title + '</a></p>' + 
                           '<p><strong>Publication Date</strong>: ' + product.date.split('T')[0] + '</p>' +
                           '<p><strong>Countries Mentioned</strong>: ' + product.countries['all mentioned countries'].join(', ') + '</p>' +
                           '<p><strong>People:</strong> ' + product.people.join(', ') + '</p>' +
                           '<p><strong>Keywords:</strong> ' + product.keywords.join(', ') + '</p>' +
                           '<hr>' + 
                           '</div>')
    })
  }
}