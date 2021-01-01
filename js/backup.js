function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// SVG size
var margin = {top: 0, right: 0, bottom: 0, left: 0};
var width = 960;
var height = 450;

// Initiate SVG
var svg = d3.select("#chart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("viewBox", [-width/2, -height/2, width, height])
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create a tooltip
var tooltip = d3.select("body").append("div")    
    .attr("id", "tooltip")                
    .style("opacity", 0);

// Load country and population data
queue()
    .defer(d3.json, "data/words.json")
    .defer(d3.json, "data/isw_products.json")
    .await(ready);

// Load data callback 
function ready(error, words, products) {

  var vocab = words.words;
  var keywords = words.keywords;

  // Select random keywords
  //keywords = keywords.sort(() => 0.5 - Math.random());
  keywords = keywords.slice(0, 60);

  nodes = []
  keywords.forEach(function(keyword){
    nodes.push({
      "word": keyword,
      "count": vocab[keyword]
    })
  })

  //nodes.push({
  //  "word": "the",
  //  "count": vocab["the"]
  //})

  // Scale function for radius
  r_scale = d3.scaleSqrt()
              .domain(d3.extent(Object.values(vocab)))
              .range([3,150])
              .exponent(0.5)

  // Initiate d3 force simulation
  var simulation = d3.forceSimulation()
    //.force("charge", d3.forceManyBody().strength(-20)) 
    .force("x", d3.forceX(0).strength(0.02))
    .force("y", d3.forceY(0))
    .force("collide", d3.forceCollide().radius(d => r_scale(d.count) + 2).iterations(20))
    .on('tick', tick)

  // Drage and drop functionality for nodes - pin on release
  var dragDrop = d3.drag()
    .on("start", function(node) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      node.fx = node.x
      node.fy = node.y
    })
    .on("drag", function(node) {
      node.fx = d3.event.x
      node.fy = d3.event.y
    })
    .on("end", function(node){
      if (!d3.event.active) simulation.alphaTarget(0.3);
      node.fx = null;
      node.fy = null;  
    })

  // Create node elements
  var nodeElements = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
        .append("g")
        .call(dragDrop)
        .on("click", nodeClick)
        .each(buildElements)

  function buildElements() {
    d3.select(this).append("circle")
      .attr("class", "circle")
      .attr("r", d => r_scale(d.count))
      .on("mouseover", mouseover) 
      .on("mousemove", mousemove)
      .on("mouseout", mouseout)

    d3.select(this).append("text")
      .attr("class", "label")
      .text(d => capitalizeFirstLetter(d.word))
      .attr("text-anchor", "middle")
      .attr("font-size", function(d) {
        var length = d.word.length;
        var radius = r_scale(d.count);
        var size = (radius * 3) / length;
        return Math.max(size, 8)
      })
      .attr("x", 0)
      .attr("y", function(d){
        var size = this.getAttribute("font-size");
        return size / 3
      })
  }

  // Add nodes & links to simulation
  simulation.nodes(nodes);

  // Simulation tick callback to update node/line element positions
  function tick() {
    nodeElements
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
  }

  // Callback for mouse movement into circle
  function mousemove(d) {     
    var matrix = this.getScreenCTM()
      .translate(+ this.getAttribute("cx"), + this.getAttribute("cy")); 

    var radius = this.getAttribute("r");

    tooltip
      .html("<p><strong>" + d.count + "</strong></p>") 
      .style("left", (window.pageXOffset + matrix.e - $("#tooltip").outerWidth() / 2) + "px")
      .style("top", (window.pageYOffset + matrix.f + parseInt(radius) + 3) + "px")
      .style("opacity", 1)
   }

  // Callback for mouse movment out of circle
  function mouseout(d) {        
    tooltip
      .html("") 
      .style("opacity", 0); 

    d3.selectAll("circle")
      .classed("highlight", false); 
  }

  // Callback for mouse movment out of circle
  function mouseover(d) {        
    d3.select(this)
      .classed("highlight", true); 
  }

  // Node click callback
  function nodeClick(d) {
    console.log(d);
  }

};
