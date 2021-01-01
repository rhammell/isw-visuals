function cleanText(s) {
  return s.trim().toLowerCase();
}

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

// Load country and population data
queue()
    .defer(d3.json, "data/words.json")
    .defer(d3.json, "data/isw_products.json")
    .await(ready);

// Load data callback 
function ready(error, words, products) {

  // Get words and vocab
  var vocab = words.words;
  var keywords = words.keywords;

  // Init nodes
  var nodes = [];

  // Scale function for radius
  r_scale = d3.scaleSqrt()
              .domain(d3.extent(Object.values(vocab)))
              .range([3,150])
              .exponent(0.5)

  // Initiate d3 force simulation
  var simulation = d3.forceSimulation()
    //.force("charge", d3.forceManyBody().strength(-20)) 
    .force("x", d3.forceX(0).strength(0.1))
    .force("y", d3.forceY(0).strength(0.6))
    .force("collide", d3.forceCollide()
      .radius(d => r_scale(d.count) + 2 )
      .iterations(20))
    .on("tick", ticked)

  // Drag and drop functionality for nodes
  var dragDrop = d3.drag()
    .on("start", function(node) {
      node.fx = node.x
      node.fy = node.y
    })
    .on("drag", function(node) {
      simulation.alphaTarget(0.1).restart();
      node.fx = d3.event.x
      node.fy = d3.event.y
    })
    .on("end", function(node){
      simulation.alphaTarget(0.0);
      node.fx = null;
      node.fy = null;  
    })
  
  // Create node group element 
  var nodeGroup = svg.append("g")
              .attr("class", "nodes")
  var nodeElements = nodeGroup.selectAll(".node")

  // Initiatite
  //keywords = keywords.sort(() => 0.5 - Math.random());
  keywords.slice(0, 80).forEach(function(word){
    addNode(cleanText(word));
  })

  // Add new node
  function addNode(word) {

    // Add node for word if it doesn't exist
    nodeWords = nodes.map(node => node.word)
    if (!nodeWords.includes(word)) {

      // Get word count from vocab
      var count = 0
      if (word in vocab) {
        count = vocab[word]
      }

      // Update list of nodes
      nodes.push({
        "word": word,
        "count": count
      });

      update();
    }
  }

    // Select node
  function selectNode(word) {

    nodeGroup.selectAll(".node")
      .classed("selected", function(d) { return d.word === word; }); 

    //d3.timeout(function(){processWord(word)}, 50);

  }

  // Update chart elelments
  function update() {

    // Add nodes to simulation
    simulation.nodes(nodes)

    // Add updated nodes to elements
    nodeElements = nodeGroup.selectAll(".node").data(nodes)
    
    nodeEnter = nodeElements.enter()
       .append("g")
       .attr("class", "node")
       .each(buildNode)
       .call(dragDrop)
       .on("mouseover", mouseover) 
       .on("mouseout", mouseout)
       .on("click", nodeClick)
    
    nodeElements = nodeEnter.merge(nodeElements)

    simulation.alpha(0.1).restart()
  }

  // Simulation tick callback to update node positions
  function ticked(){
    nodeElements
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
  }

  // Build circle and text elemsnts for node element
  function buildNode() {
    var minSize = 10
    var maxSize = 50

    var data = d3.select(this).data()[0];
    var radius = r_scale(data.count);
    var length = data.word.length;
    var size = (radius * 3) / length;
    var fontSize = Math.max(Math.min(size,maxSize),minSize);

    d3.select(this).append("circle")
      .attr("r", radius)

    var g = d3.select(this).append("g")
      .attr("class","subgroup")

    g.append("text")
      .text(d => capitalizeFirstLetter(d.word))
      .attr("font-size", fontSize)
      .attr("line-height", fontSize)
      .attr("y", function(d){return -10})

    g.append("text")
      .text(d => d.count)
      .attr("font-size", 8)

    var bbox = g.node().getBBox();
    console.log(bbox);
    var height = bbox.height;
    g.attr("transform", function(d) {
      return "translate(0," + ((height / 2) - fontSize/10) + ")"
    })
  }

  // Callback for mouse movment out of circle
  function mouseout(d) {       
    d3.select(this)
      .classed("hover", false); 
  }

  // Callback for mouse movment out of circle
  function mouseover(d) {        
    d3.select(this)
      .classed("hover", true); 
  }

  // Node click callback
  function nodeClick(d) {
    selectNode(d.word);
  }

  $("#wordInput").on("keyup", function(e) {
    if(e.which === 13){
      $("#wordButton").click();
    }
  });

  $("#wordButton").on("click", function(){
    var input = cleanText($("#wordInput").val());
    if (input.length > 0) {
      addNode(input);
      selectNode(input);
    }
  });

  function processWord(word) {
    allSentences = [];
    products.forEach(function(product, i) {
      console.log(i);
      sentences = product["full text"].split(".")
      
      sentences.forEach(function(sentence) {
        if (sentence.toLowerCase().includes(word)) {
          allSentences.push(sentence);
          console.log(sentence);
        }
      })
    })

    console.log(allSentences.length)
  }


};
