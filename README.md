# isw-visuals
This repository contains web-based visualizations to view, explore, and gain insights into the [ISW Web Scrape and NLP Enrichment](https://www.kaggle.com/connerbrew2/isw-web-scrape-and-nlp-enrichment) dataset. 

The dataset was created from a web scraping of Institute for the Study of War. It includes metadata about each scraped publication along with its full text and extracted keywords, places, and people names.

## Visualizations
- Co-Occurrence Matrix: View how often two people are mentioned in the same publication. 
  [Live demo](https://rhammell.github.io/isw-visuals/co-occurrence.html)
- Force-directed Network: View a network of the most mentioned people, where links are defined by mentions in the same publication. 
  [Live demo](https://rhammell.github.io/isw-visuals/force-directed.html)
- World Map: View a map of the world that highlights how many publications mentioned each country. 
  [Live Demo](https://rhammell.github.io/isw-visuals/world-map.html)
- Timeline: View how often a person was mentioned in publications on a monthly basis. 
  [Live Demo](https://rhammell.github.io/isw-visuals/timeline.html)
- Word Bubble: View how frequently individual words appear in the publications. 
  [Live Demo](https://rhammell.github.io/isw-visuals/word-bubble.html)

## Formatting ISW Data
A copy of the ISW Web Scrape and NLP Enrichment dataset is located in the `data` directory. Some visualizations utilize this dataset directly, while others rely on newly formatted datasets derived from it.

Create updated versions of these datasets by running the `format_data.py` Python script. This script loads the ISW dataset from `isw_products.json`, builds new datasets used by the visualizations, and writes them out in JSON format. Versions of these files are included in the `data` directory. 
```bash
# Go to data dir
cd data

# Create JSON data files
python3 format_data.py
```