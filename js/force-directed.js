var width = 960;
var height = 750;

// Set size and viewport of chart
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
      .id(function(link) {return link.index})
      .distance(50)
    )
    .on('tick', tick)

  // Creare drag and drop functionality
  var dragDrop = d3.drag()
    .on("start", function(node) {
      node.fx = node.x
      node.fy = node.y
    })
    .on("drag", function(node) {
      simulation.alphaTarget(0.3).restart()
      node.fx = d3.event.x
      node.fy = d3.event.y
    })
    .on("end", function(node) {
      if (!d3.event.active) {
        simulation.alphaTarget(0)
      }
      node.fx = null
      node.fy = null
    })

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
        .attr("id", function(node){ return node.name.replaceAll(' ','_') })
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", 1)
        .append('image')
          .attr("xlink:href", function(node){ return node.img })
          .attr("x", 0)
          .attr("y", 0)
          .attr("height", 60)
          .attr("width", 60)
          .attr("transform", "translate(-10,-5)")

  // Create node elements
  var nodeElements = svg.append('g')
    .selectAll('circle')
    .data(nodes)
    .enter()
      .append('circle')
        .attr("r", 20)
        .attr("fill", function(node){ return "url(#" + node.name.replaceAll(' ','_') + ")" })
        .call(dragDrop)
        .on("mouseover", mouseover) 
        .on("mousemove", mousemove)
        .on("mouseout", mouseout) 

  // Add nodes & links to simulation
  simulation.nodes(nodes);
  simulation.force("link").links(links)

  // Simulation tick callback to update node/line element positions
  function tick() {
    nodeElements
      .attr("cx", function(node) {return node.x})
      .attr("cy", function(node) {return node.y})

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
      .html(
         "<p><strong>" + d.name + "</strong></p>"
      ) 
      .style("left", (window.pageXOffset + matrix.e - $("#tooltip").outerWidth() / 2) + "px")
      .style("top", (window.pageYOffset + matrix.f + 20 + 3) + "px")
      .style("opacity", 1)
      //.style("left", (window.pageXOffset + matrix.e + 18) + "px")
      //.style("top", (window.pageYOffset + matrix.f - 32) + "px") 
   }

  // Callback for mouse movment out of circle
  function mouseout(d) {        
    tooltip
      .html("") 
      .style("opacity", 0); 

    d3.select(this)
      .attr("class", "")   
  }

   // Callback for mouse movment out of circle
  function mouseover(d) {        
    d3.select(this)
      .attr("class", "highlight")   
  }

});