// SVG size params
var margin = {top: 0, right: 0, bottom: 0, left: 140};
var width = 720;
var height = 720;
var rowHeight = 15;

// Initiate SVG
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
    .style("margin-top", "10px")
  
var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load json data
d3.json("data/timeline.json", function(data) {

  // Calc new height
  height = (data.length * rowHeight) + 1;

  // Resize svg
  svg.attr("height", height);

  // Precompute sort orders
  var orders = {
    name: d3.range(data.length).sort((a, b) => d3.ascending(data[a].name, data[b].name)),
    count: d3.range(data.length).sort((a, b) => d3.descending(data[a].count, data[b].count))
  };

  // Date parsing function
  var parseDate = d3.timeParse("%Y-%m");

  // Color scale
  var color = d3.scaleSqrt()
                .domain([0,10])//   d3.extent(data, function(d){ return d.count }))
                .range([d3.interpolateBlues(0.2), d3.interpolateBlues(1)]);
  
  // Vertical scale
  var y = d3.scaleBand()
            .domain(orders.count)
            .range([rowHeight, height])

  // Horizontal scale
  var startDate = parseDate("2015-01");
  var endDate = parseDate("2021-01");
  var months = d3.timeMonths(startDate, endDate);
  var years = d3.timeYears(startDate, endDate);
  var x = d3.scaleBand()
            .domain(months)
            .range([0,width])

  // Background rectangle
  var background = g.append("g")
    .attr("transform", "translate(" + 0 + "," + rowHeight + ")")
    .attr("id", "background")
  background.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)

  // Vertical grid lines
  months.forEach(function(month){
    var xloc = x(month)-0.5;
    
    background.append("line")
      .attr("class","grid-line")
      .attr("x1", xloc )
      .attr("x2", xloc )
      .attr("y1", 0)
      .attr("y2", height)
  })

  // Horizontal grid lines
  d3.range(data.length).forEach(function(i){
    var yloc = (y.bandwidth() * i)-0.5;
    
    background.append("line")
      .attr("class","grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yloc)
      .attr("y2", yloc)
  })

  // X Axis time scale 
  xAxisScale = d3.scaleTime()
                 .domain([startDate, endDate])
                 .range([0, width])
  
  // Create axis
  var xAxis = g.append("g")
    .attr("id", "xaxis")
  
  years.forEach(function(year){
    var xloc = xAxisScale(year);
    xAxis.append("line")
      .attr("class", "axis-line")
      .attr("x1", xloc)
      .attr("x2", xloc)
      .attr("y1", rowHeight - 14)
      .attr("y2", rowHeight)

    xAxis.append("text")
      .attr("class", "axis-text")
      .attr("x", xloc + 3)
      .attr("y", rowHeight - 3)  
      .text(year.getFullYear());
  })  

  // Create rows
  var rows = g.selectAll(".row")
      .data(data)
    .enter().append("g")
      .attr("class", "row")
      .attr("transform", (d, i) => "translate(0," + y(i) + ")")
    .each(buildCells)
    
  // Text labels
  rows.append("text")
    .attr("class", "axis-text")
    .attr("x", -5)
    .attr("y", rowHeight - 4)  
    .attr("text-anchor", "end")
    .text((d, i) => d.name);

  // Create cells
  function buildCells(row) {

     d3.select(this).selectAll(".cell")
        .data(d3.keys(row.timeline).filter(d => parseDate(d) >= startDate))
      .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => x(parseDate(d)))
        .attr("width", x.bandwidth()-1 )
        .attr("height", y.bandwidth()-1)
        .style("fill", d => color(row.timeline[d].length))
        .on('click', click)
  }

  // Click function for individual cells
  function click(d, e){
    $(".cell").toggleClass("active", false);
    $(this).toggleClass("active", true);

    var parentData = d3.select(this.parentNode).data()[0];

    var html = '';

    html += '<div class="person">' + 
            '<img src="' + parentData.img + '">' + 
            '<span>' + parentData.name + '</span>' + 
            '</div>';

    var products = parentData.timeline[d]
    html += '<p class="n-products">' + d + '</p>';
    html += '<p class="n-products">' + products.length + ' ISW article' + (products.length != 1 ? 's': '') + '</p>';

    html += '<ul>';
    products.forEach(function(product){
      html += '<li><a href="' + product.url + '" target="_blank">' + product.title + '</a></li>'
    })
    html += '</ul>'

    $("#display").html(html)
  }


  // Callback for order select 
  d3.select("#order").on("change", function() {
    
    // Reset y domain
    y.domain(orders[this.value]);

    // Update row positions
    var t = svg.transition().duration(2500);
    t.selectAll(".row")
        .delay((d, i) => y(i) * 2)  
        .attr("transform", (d, i) => "translate(0," + y(i) + ")")
  });

    
})