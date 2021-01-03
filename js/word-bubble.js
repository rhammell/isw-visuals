var $grid = $('#results-body').masonry({
              itemSelector: '.result',
              columnWidth: 480
            });

function cleanText(s) {
  return s.trim().toLowerCase().split(' ')[0].split('-')[0];
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function countMentions(results, word) {
    var count = 0;
    results.forEach(function(result){
      n = result.matchData.metadata[word][searchField].position.length;
      count += n;
    })

    return count;
}

function findSentence(text, position) {
  sentenceStartPos = Math.max(text.lastIndexOf('. ', position[0]), 0)
  if (sentenceStartPos != 0) {
    sentenceStartPos += 2;
  }

  sentenceEndPos = Math.min(text.indexOf('. ', position[0]), text.length);

  return text.slice(sentenceStartPos, sentenceEndPos) + '.'
}

function buildIndex(docs) {

  // Build lunr index from input docs
  var idx = lunr(function () {

    // Define field and id unique to ISW
    this.ref(searchId)
    this.field(searchField)

    // Return string postion with each results
    this.metadataWhitelist = ['position']

    // Only use spaces as word delineators
    //this.tokenizer.separator = /[\s]+/;

    // Pipline processes
    this.pipeline.remove(lunr.stemmer)
    this.pipeline.remove(lunr.stopWordFilter)
    this.searchPipeline.remove(lunr.stemmer)
    this.searchPipeline.remove(lunr.stopWordFilter)

    // Add each doc to the index
    docs.forEach(function (doc) {
      this.add(doc)
    }, this)
  })

  return idx;
}

function generateKeywords(products, idx) {

  // Get list of all unique keywords
  var allKeywords = products.map(function(a) {return a.keywords;}).flat();
  var keywords = Array.from(new Set(allKeywords));

  // Get mention counts for all keywords
  var counts = keywords.map(function(word){
    var results = idx.search(word);
    var count = countMentions(results, word);

    return {'word': word, 'count': count};
  })

  // Order list of keywords by count
  counts.sort((a, b) => (a.count < b.count) ? 1 : -1)
  keywords = counts.map(d => d.word);

  return keywords;
}

// Define field names specific to ISW dataset used for lunr index
var searchId = '_id';
var searchField = 'full text';

// SVG size
var margin = {top: 10, right: 0, bottom: 10, left: 0};
var width = 960;
var height = 450;

// Initiate SVG
var svg = d3.select('#chart')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .attr('viewBox', [-width/2, -height/2, width, height])
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Create loading display
var loadingText = svg.append('text')
  .attr('class', 'loading-text')
  .text('Loading...')

// Load ISW JSON data
d3.json('data/isw_products.json', function(products) {

  // Create lunr index for word searching 
  var idx = buildIndex(products);

  // Get initial list of keywords to visualize
  var keywords = generateKeywords(products, idx); 

  // Close loading display
  loadingText.remove();

  // Init nodes
  var nodes = [];

  // Scale function for radius
  r_scale = d3.scaleSqrt()
              .domain([0,50000])
              .range([3,150])
              .exponent(0.5)

  // Initiate d3 force simulation
  var simulation = d3.forceSimulation()
    .force('x', d3.forceX(0).strength(0.1))
    .force('y', d3.forceY(0).strength(0.6))
    .force('collide', d3.forceCollide()
      .radius(d => r_scale(d.count) + 2 )
      .iterations(20))
    .on('tick', ticked)

  // Drag and drop functionality for nodes
  var dragDrop = d3.drag()
    .on('start', function(node) {
      node.fx = node.x
      node.fy = node.y
    })
    .on('drag', function(node) {
      simulation.alphaTarget(0.1).restart();
      node.fx = d3.event.x
      node.fy = d3.event.y
    })
    .on('end', function(node){
      simulation.alphaTarget(0.0);
      node.fx = null;
      node.fy = null;  
    })
  
  // Create node group element 
  var nodeGroup = svg.append('g')
              .attr('class', 'nodes')
  var nodeElements = nodeGroup.selectAll('.node')

  // Add nodes for initial keywords
  keywords.slice(0, 80).forEach(function(word){
    addNode(cleanText(word));
  })

  // Add new node
  function addNode(word) {

    // Add node for word if it doesn't exist
    nodeWords = nodes.map(node => node.word)
    if (!nodeWords.includes(word)) {

      // Search index for word
      var results = idx.search(word);
      var count = countMentions(results, word)

      // Update list of nodes
      nodes.push({
        'word': word,
        'count': count,
        'results': results
      });

      update();
    }
  }

  // Select node
  function selectNode(word) {
    nodeGroup.selectAll('.node')
      .classed('selected', false)

    var selectedNode = nodeGroup.selectAll('.node')
                         .filter(function(d) { return d.word === word; });
    selectedNode.classed('selected', true);

    displayResults(selectedNode.data()[0]) 
  }

  // Update chart elelments
  function update() {

    // Add nodes to simulation
    simulation.nodes(nodes)

    // Add updated nodes to elements
    nodeElements = nodeGroup.selectAll('.node').data(nodes)
    
    nodeEnter = nodeElements.enter()
       .append('g')
       .attr('class', 'node')
       .each(buildNode)
       .call(dragDrop)
       .on('mouseover', mouseover) 
       .on('mouseout', mouseout)
       .on('click', nodeClick)
    
    nodeElements = nodeEnter.merge(nodeElements)

    simulation.alpha(0.1).restart()
  }

  // Simulation tick callback to update node positions
  function ticked(){
    nodeElements
      .attr('transform', d => 'translate('+ d.x + ',' + d.y + ')')
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

    d3.select(this).append('circle')
      .attr('r', radius)

    var g = d3.select(this).append('g')
      .attr('class','subgroup')

    g.append('text')
      .text(d => capitalizeFirstLetter(d.word))
      .attr('font-size', fontSize)
      .attr('line-height', fontSize)
      .attr('y', -10)

    g.append('text')
      .text(d => d.count)
      .attr('font-size', 8)

    var bbox = g.node().getBBox();
    var height = bbox.height;
    g.attr('transform', function(d) {
      return 'translate(0,' + ((height / 2) - fontSize/10) + ')'
    })
  }

  // Callback for mouse movment out of circle
  function mouseout(d) {       
    d3.select(this)
      .classed('hover', false); 
  }

  // Callback for mouse movment out of circle
  function mouseover(d) {        
    d3.select(this)
      .classed('hover', true); 
  }

  // Node click callback
  function nodeClick(d) {
    selectNode(d.word);
  }

  // Display word results in body
  function displayResults(data) {

    var nResults = data.results.length; 

    // Update results header
    $('#results-header').html('<h2>The word ' + 
                              '<span class="header-highlight">' + data.word + '</span>' + 
                              ' appears ' + numberWithCommas(data.count) + ' time' + (data.count != 1 ? 's': '') + 
                              ' in ' + numberWithCommas(nResults) + ' ISW publication' + (nResults != 1 ? 's': '') + '</h2>');
    
    // Clear out results body grid
    $grid.masonry('remove', $grid.find('.result'));  

    // Loop through results
    data.results.slice(0,100).forEach(function(result, i){
      var product = products.filter(d => d._id == result.ref)[0]
      var textBody = product['full text'];
      var date = product.date.split('T')[0]
      var keywordLinks = product.keywords.map(
        word => '<a href="#" class="keyword">' + word + '</a>'
      )

      // Create result div
      var resultEl = $('<div class="result">' + 
                     '<p class="title"><a href="' + product.url + '" target="_blank">' + product.title + '</a>' + (date != '' ? '<small> | ' + date + '</small>': '') + '</p>' + 
                     '<p><small>Keywords: ' + keywordLinks.join(', ') + '</small></p>' +
                     '</div>')

      // Find word positions within body text and add highlighted excerpts
      var positions = result.matchData.metadata[data.word][searchField].position;
      var sentences = []
      positions.forEach(function(position){
        sentences.push(findSentence(textBody, position));
      })

      // Add unique sentences to result
      sentences = Array.from(new Set(sentences));
      sentences.forEach(function(sentence){

        // Highlight word in sentence
        var search_regexp = new RegExp(data.word, "gi");
        //search_regexp.ignoreCase;
        sentence = sentence.replace(search_regexp,'<span class="quote-highlight">'+data.word+'</span>');

        resultEl.append('<p>' + sentence + '</p>');
      })

      resultEl.append('<hr>');

      // Append result div to grid
      $grid.append(resultEl).masonry('appended', resultEl);
    })

    // Move results into masonry style positions
    $grid.masonry()  
  }

  // Text input Enter button callback
  $('#wordInput').on('keyup', function(e) {
    if(e.which === 13){
      $("#wordButton").click();
    }
  });

  // Add button callback
  $('#wordButton').on('click', function(){
    var word = cleanText($('#wordInput').val());
    $('#wordInput').val('');
    if (word.length > 0) {
      addNode(word);
      selectNode(word);
    }
  });

  $("body").on('click', '.keyword', function(e){
    e.preventDefault();
    var word = cleanText($(this).html());
    if (word.length > 0) {
      addNode(word);
      selectNode(word);
    }
  });

});
