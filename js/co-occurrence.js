// Matrix chart size params
var margin = {top: 140, right: 0, bottom: 0, left: 140};
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
var grid = svg.append("g")
   .attr("id", "background")

grid.append("rect")
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
    matrix[i] = d3.range(n).map(j => ({"x": j, y: i, z: 0, products: []}) );
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
    name: d3.range(n).sort((a, b) => d3.ascending(nodes[a].name, nodes[b].name)),
    count: d3.range(n).sort((a, b) => nodes[b].count - nodes[a].count),
  };

  // The default sort order.
  x.domain(orders.name);

  // Grid lines
  d3.range(n+1).forEach(function(i){
    var loc = (x.bandwidth() * i) - 0.5;
    
    grid.append("line")
      .attr("class","grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", loc)
      .attr("y2", loc)

    grid.append("line")
      .attr("class","grid-line")
      .attr("x1", loc)
      .attr("x2", loc)
      .attr("y1", 0)
      .attr("y2", height)
  })

  // Create columns
  var column = svg.selectAll(".column")
      .data(matrix)
    .enter().append("g")
      .attr("class", "column")
      .attr("transform", (d,i) => "translate(" + x(i) + ")rotate(-90)" );

  // Column text labels
  column.append("text")
      .attr("class", "axis-text")
      .attr("x", 6)
      .attr("y", x.bandwidth() / 2)
      .attr("text-anchor", "start")
      .text((d, i) => nodes[i].name);

  // Create rows
  var rows = svg.selectAll(".row")
      .data(matrix)
    .enter().append("g")
      .attr("class", "row")
      .attr("transform", (d, i) => "translate(0," + (x(i)) + ")")
    .each(row)

  // Row text labels
  rows.append("text")
      .attr("class", "axis-text")
      .attr("x", -6)
      .attr("y", x.bandwidth() / 2)
      .attr("text-anchor", "end")
      .text((d, i) => nodes[i].name);

  // Create rect elements for matrix
  function row(row) {
    d3.select(this).selectAll(".cell")
        .data(row.filter(d => d.z))
      .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => x(d.x))
        .attr("width", x.bandwidth()-1)
        .attr("height", x.bandwidth()-1)
        .style("fill-opacity", d => z(d.z))
        .style("fill", "orange")
        .on("click", click);
  }

  // Click callback to display co-occurrence details
  function click(p, e){
    $(".cell").toggleClass("active", false)
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
    var delay = 4;

    t.selectAll(".row")
        .delay((d, i) => x(i) * delay)
        .attr("transform", (d, i) => "translate(0," + x(i) + ")")
      .selectAll(".cell")
        .delay(d => x(d.x) * delay)
        .attr("x", d => x(d.x));

    t.selectAll(".column")
        .delay((d, i) => x(i) * delay)
        .attr("transform", (d, i) => "translate(" + x(i) + ")rotate(-90)");
  }

});
