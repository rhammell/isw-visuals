// SVG size
var width = 960;
var height = 750;

// Initiate SVG
var svg = d3.select("#chart")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [-width/2, -height/2, width, height]);

// Create a tooltip
var tooltip = d3.select("body").append("div")    
    .attr("id", "tooltip")                
    .style("opacity", 0);

// Load json data
d3.json("data/nodes.json", function(data) {

  // Node and link data
  var nodes = data.nodes;
  var links = data.links;
  //links = [];

  // Initiate d3 force simulation
  var simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-500)) 
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("collide", d3.forceCollide(25).iterations(10))
    .force('link', d3.forceLink()
      .id(link => link.index)
      .distance(50)
    )
    .on('tick', tick)

  // Drage and drop functionality for nodes - pin on release
  var dragDrop = d3.drag()
    .on("start", function(node) {
      node.fx = node.x
      node.fy = node.y
      d3.select(this).classed("fixed", true);
    })
    .on("drag", function(node) {
      simulation.alphaTarget(0.3).restart()
      node.fx = d3.event.x
      node.fy = d3.event.y
    })

  // Double click callback for nodes to un-pin
  function dblclick(node) {
    d3.select(this).classed("fixed", false);
    node.fx = null
    node.fy = null
  }

  // Create link elements
  var linkElements = svg.append('g')
    .selectAll('line')
    .data(links)
    .enter().
      append('line')

  // Create fill elements
  var patternElements = svg.append('defs')
    .selectAll('pattern')
    .data(nodes)
    .enter()
      .append('pattern')
        .attr("id", node => node.name.replaceAll(' ','_') )
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", 1)
        .append('image')
          .attr("xlink:href", node => node.img)
          .attr("x", 0)
          .attr("y", 0)
          .attr("height", 60)
          .attr("width", 60)
          .attr("transform", "translate(-10,-5)")

  // Create node elements
  var radius = 20;
  var nodeElements = svg.append('g')
    .selectAll('circle')
    .data(nodes)
    .enter()
      .append('circle')
        .attr("r", radius)
        .attr("fill", node => "url(#" + node.name.replaceAll(' ','_') + ")" )
        .call(dragDrop)
        .on("mouseover", mouseover) 
        .on("mousemove", mousemove)
        .on("mouseout", mouseout)
        .on("dblclick", dblclick)

  // Add nodes & links to simulation
  simulation.nodes(nodes);
  simulation.force("link").links(links)

  // Simulation tick callback to update node/line element positions
  function tick() {
    nodeElements
      .attr("cx", function(node) {return node.x = Math.max(radius - width/2, Math.min(width/2 - radius, node.x)) ;})
      .attr("cy", function(node) {return node.y = Math.max(radius - height/2, Math.min(height/2 - radius, node.y)) ;})

    linkElements
     .attr('x1', function(link) { return link.source.x})
     .attr('y1', function(link) { return link.source.y})
     .attr('x2', function(link) { return link.target.x})
     .attr('y2', function(link) { return link.target.y})
  }

  // Callback for mouse movement into circle
  function mousemove(d) {     
    var matrix = this.getScreenCTM()
      .translate(+ this.getAttribute("cx"), + this.getAttribute("cy")); 

    tooltip
      .html("<p><strong>" + d.name + "</strong></p>") 
      .style("left", (window.pageXOffset + matrix.e - $("#tooltip").outerWidth() / 2) + "px")
      .style("top", (window.pageYOffset + matrix.f + 20 + 3) + "px")
      .style("opacity", 1)
   }

  // Callback for mouse movment out of circle
  function mouseout(d) {        
    tooltip
      .html("") 
      .style("opacity", 0); 

    nodeElements
      .classed("highlight", false); 
    linkElements
      .classed("highlight", false);
  }

  // Callback for mouse movment out of circle
  function mouseover(d) {        

    var neighbors = []
    links.forEach(function(link){
      if (link.target.name == d.name) {neighbors.push(link.source.name)}
      if (link.source.name == d.name) {neighbors.push(link.target.name)}
    })

    nodeElements
      .classed("highlight", function(node) {
          return (neighbors.indexOf(node.name) != -1)
      })

    linkElements
      .classed("highlight", function(link){ 
        return (link.target.name == d.name || link.source.name == d.name)
      })

    d3.select(this)
      .classed("highlight", true); 
  }

});
