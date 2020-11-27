// SVG size params
var margin = {top: 0, right: 0, bottom: 10, left: 140};
var width = 720;
var height = 720;
var rowHeight = 15;

// Initiate SVG
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
  
var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load json data
d3.json("data/timeline.json", function(data) {

  // Resize svg heighg
  svg.attr("height", data.length * rowHeight)

  // Precompute the orders.
  var orders = {
    name: d3.range(data.length).sort(function(a, b) { return d3.ascending(data[a].name, data[b].name); }),
    count: d3.range(data.length).sort(function(a, b) { return d3.descending(data[a].count, data[b].count); })
  };

  // Date parsing 
  var parseDate = d3.timeParse("%Y-%m");

  // Color scale
  var domain = d3.extent([0,10]);
  var range = [d3.interpolateBlues(0.2),d3.interpolateBlues(1)]
  var color = d3.scaleSqrt()
                  .domain(domain)
                  .range(range);
  
  // Vertical scale
  var y = d3.scaleBand()
            .domain(orders.count)
            .range([0, data.length * rowHeight])

  // Horizontal scale
  var startDate = parseDate("2010-01")
  var endDate = parseDate("2021-01")
  var x = d3.scaleBand()
            .domain(d3.timeMonths(startDate, endDate))
            .range([0,width])

  // Create background cells
  var months = d3.timeMonths(startDate, endDate);
  months.forEach(function(month){
    d3.range(data.length).forEach(function(i){
        g.append("rect")
          .attr("x", x(month) )
          .attr("y", y.bandwidth() * i)
          .attr("width", x.bandwidth()-1)
          .attr("height", rowHeight-1)
          .attr("fill", "#e2e2e2")
    })
  })

  // Create rows
  var rows = g.selectAll(".row")
      .data(data)
    .enter().append("g")
      .attr("class", "row")
      .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; })
    .each(buildCells)
    .append("text")
      .attr("x", -2)
      .attr("y", rowHeight - 4)  
      .attr("font-size", 11)
      .attr("text-anchor", "end")
      .text(function(d, i) { return d.name; });

  
  // Create cells
  function buildCells(row) {
    d3.select(this).selectAll(".cell")
      .data(Object.keys(row.timeline))
    .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d,i) { return x(parseDate(d)) })
        .attr("width", x.bandwidth()-1 )
        .attr("height", rowHeight-1)
        .style("fill", function(d) { return color(row.timeline[d].length) })
        .on("click", click);
  }

  // Click function for individual cells
  function click(p, e){
    $(".cell").toggleClass("active", false);
    $(this).toggleClass("active", true);

    var html = '';

    html += '<div class="person">' + 
            '<img src="' + source_node.img + '">' + 
            '<span>' + source_node.name + '</span>' + 
            '</div>';

    html += '<div class="person">' + 
            '<img src="' + target_node.img + '">' + 
            '<span>' + target_node.name + '</span>' + 
            '</div>';

    html += '<p class="n-products">' + p.products.length + ' ISW article' + (p.products.length != 1 ? 's': '') + '</p>';

    html += '<ul>';
    p.products.forEach(function(product){
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
        .delay(function(d, i) { return y(i) * 2; })  
        .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; })
  });

    
})