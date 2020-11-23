// Matrix chart size params
var margin = {top: 140, right: 0, bottom: 10, left: 140};
var width = 720;
var height = 720;

// d3 scales
var x = d3.scaleBand().range([0, width]),
    z = d3.scaleLinear().domain([0, 5]).clamp(true),
    c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));

// Initiate svg
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Background rectangle
svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height);

// Load json data
d3.json("data/nodes.json", function(data) {

  var nodes = data.nodes;
  var links = data.links;

  // Initiate matrix
  var matrix = []
  var n = nodes.length;

  // Compute index per node.
  nodes.forEach(function(node, i) {
    node.count = 0;
    matrix[i] = d3.range(n).map(function(j){ return {x: j, y: i, z: 0, products: []}; });
  });

  // Convert links to matrix; count character occurrences.
  links.forEach(function(link) {
    matrix[link.source][link.target].z += link.value;
    matrix[link.target][link.source].z += link.value;
    matrix[link.source][link.target].products.push(...link.products);
    matrix[link.target][link.source].products.push(...link.products); 
    nodes[link.source].count += link.value;
    nodes[link.target].count += link.value;
  });

  // Precompute the orders.
  var orders = {
    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
    count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
  };

  // The default sort order.
  x.domain(orders.name);

  // Create grid lines
  var enterLines = svg.selectAll(".lines")
      .data(matrix)
      .enter()

  enterLines.append("g")
                .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; })
            .append("line")
              .attr("x1", -width);

  enterLines.append("g")
              .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
            .append("line")
              .attr("x2", width);

  // Create columns
  var column = svg.selectAll(".column")
      .data(matrix)
    .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

  column.append("text")
      .attr("x", 6)
      .attr("y", x.bandwidth() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return nodes[i].name; });

  // Create rows
  var row = svg.selectAll(".row")
      .data(matrix)
    .enter().append("g")
      .attr("class", "row")
      .attr("transform", function(d, i) { return "translate(0," + (x(i) + 0.5) + ")"; })
    .each(row)

  row.append("text")
      .attr("x", -6)
      .attr("y", x.bandwidth() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "end")
      .text(function(d, i) { return nodes[i].name; });

  // Create rect elements for matrix
  function row(row) {
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
      .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) { return x(d.x) + 0.5; })
        .attr("width", x.bandwidth()-1.0)
        .attr("height", x.bandwidth()-1.0)
        .style("fill-opacity", function(d) { return z(d.z); })
        .style("fill", "orange")
        .on("click", click);
  }

  // Click callback to display co-occurrence details
  function click(p, e){
    $("rect").toggleClass("active", false)
    $(this).toggleClass("active", true)

    var source_node = nodes[p.y];
    var target_node = nodes[p.x];

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

  d3.select("#order").on("change", function() {
    order(this.value);
  });

  function order(value) {
    x.domain(orders[value]);

    var t = svg.transition().duration(2500);

    t.selectAll(".row")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .selectAll(".cell")
        .delay(function(d) { return x(d.x) * 4; })
        .attr("x", function(d) { return x(d.x); });

    t.selectAll(".column")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  }

});
