import os
import re
from datetime import datetime

# Resolve directory of this script (project root)
directory = os.path.dirname(os.path.abspath(__file__))
current_date = datetime.utcnow().strftime("%Y-%m-%d")

# 1. Update sitemap.xml <lastmod> tags
sitemap_path = os.path.join(directory, "sitemap.xml")
if os.path.exists(sitemap_path):
    with open(sitemap_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = re.sub(r"<lastmod>\d{4}-\d{2}-\d{2}</lastmod>", f"<lastmod>{current_date}</lastmod>", content)
    
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated sitemap.xml lastmod to {current_date}")

# 2. Update llms.txt timestamp
llms_path = os.path.join(directory, "llms.txt")
if os.path.exists(llms_path):
    with open(llms_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    pattern = r"Last Updated: \d{4}-\d{2}-\d{2}"
    replacement = f"Last Updated: {current_date}"
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
    else:
        lines = content.split("\n")
        lines.insert(2, f"<!-- Last Updated: {current_date} -->")
        content = "\n".join(lines)
        
    with open(llms_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated llms.txt timestamp to {current_date}")

# 3. Update feed.xml lastBuildDate
feed_path = os.path.join(directory, "feed.xml")
if os.path.exists(feed_path):
    with open(feed_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    current_time_rfc = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")
    content = re.sub(r"<lastBuildDate>.*?</lastBuildDate>", f"<lastBuildDate>{current_time_rfc}</lastBuildDate>", content)
    
    with open(feed_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated feed.xml lastBuildDate to {current_time_rfc}")
