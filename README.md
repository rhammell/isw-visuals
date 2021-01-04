# isw-visuals
This repository contains web-based visualizations to view, explore, and gain insights into the [ISW Web Scrape and NLP Enrichment](https://www.kaggle.com/connerbrew2/isw-web-scrape-and-nlp-enrichment) dataset. 

## Visualizations
- Co-Occurrence Matrix: [Live demo](https://rhammell.github.io/isw-visuals/co-occurrence.html)
- Force-directed Network: [Live demo](https://rhammell.github.io/isw-visuals/force-directed.html)
- World Map: [Live Demo](https://rhammell.github.io/isw-visuals/world-map.html)
- Timeline: [Live Demo](https://rhammell.github.io/isw-visuals/timeline.html)
- Word Bubble: [Live Demo](https://rhammell.github.io/isw-visuals/word-bubble.html)

## Formatting ISW Data
A copy of the ISW Web Scrape and NLP Enrichment dataset is located in the `data` directory. Some visualizations utilize this dataset directly, while others rely on newly formatted datasets derived from it.

Create updated versions of these datasets by running the `format_data.py` Python script. This script loads the ISW dataset from `isw_products.json`, builds new datasets used by the visualizations, and writes them out in JSON format. Versions of these files are included in the `data` directory. 
```bash
# Go to data dir
cd data

# Create JSON data files
python3 format_data.py
```