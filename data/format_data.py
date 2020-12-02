# Format ISW product data into new datasets that are utilized
# by the various visualizations

import json
import requests
import dateutil.parser

# Open ISW product data
fname = "isw_products.json"
with open(fname, "r") as f: 
    products = json.load(f)

# Create histogam of people and how many products they are included in
hist = {}
for product in products:
    for name in product["people"]:
        hist[name] = hist.get(name, 0) + 1

# Create list of nodes ordred by hist value - subset to top 50
nodes = [{"name": x[0]} for x in sorted(hist.items(), key=lambda item: item[1], reverse=True)]
nodes = nodes[0:50]

# Add image link to each node
for node in nodes: 

    # Set request parameters
    params = {
        "action": "query",
        "prop": "pageimages",
        "format": "json",
        "pithumbsize": 200,
        "titles": node["name"].replace("al ","al-")
    }

    # Make request to wikipedia api
    r = requests.get("https://en.wikipedia.org/w/api.php", params=params)

    # Parse iamge link from JSON or use default image if fails
    data = r.json()
    try:
        pages = data["query"]["pages"]
        thumb_url = pages[list(pages.keys())[0]]["thumbnail"]["source"]
        node["img"] = thumb_url
    except: 
        node["img"] = "https://upload.wikimedia.org/wikipedia/commons/7/7e/Replace_this_image_male.svg"

# Output network links
links = []

# Determine links between nodes
for i, source_node in enumerate(nodes[:-1]):
    for j, target_node in enumerate(nodes[i+1:]):

        # Get node names
        source_name = source_node["name"]
        target_name = target_node["name"]

        # Determine products that mention both names
        linked_products = []
        for product in products:
            if (source_name in product["people"] and 
               target_name in product["people"]):

                # Add product info 
                linked_products.append({
                    "title": product["title"],
                    "url": product["url"]
                })

        # Add link information for nodes
        if linked_products:
            links.append({
                "source": i,
                "target": i+j+1,
                "value": len(linked_products),
                "products": linked_products
            })  

# Set output format
output = {
    "nodes": nodes,
    "links": links
}

# Save json formatted data
with open('nodes.json', 'w') as f:
    json.dump(output, f, indent=4)


# Loop through each node
for node in nodes: 

    # Init timeline data for each node
    node['timeline'] = {}
    node['count'] = 0

    # Loop through each product 
    for product in products:

        # Check if node name is included in product's pepole 
        if node["name"] in product["people"]:

            # Process if valid date
            if product["date"]:

                # Convert to month date string
                date = dateutil.parser.parse(product["date"]).strftime('%Y-%m')

                # Product entry details
                details = {"title": product["title"],
                           "url": product["url"]}

                # Add to timeline data
                node["timeline"][date] = node["timeline"].get(date, []) + [details]
                node['count'] += 1

# Save json formatted data
with open('timeline.json', 'w') as f:
    json.dump(nodes, f, indent=4)







    






