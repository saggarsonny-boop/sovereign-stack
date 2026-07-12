<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:template match="/">
    <html>
      <head>
        <title>XML Sitemap | Sovereign System</title>
        <style>
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            background-color: #0a0b10; 
            color: #f3f4f6; 
            padding: 40px; 
            max-width: 1000px;
            margin: 0 auto;
          }
          h2 { 
            font-weight: 800; 
            letter-spacing: -0.03em;
            margin-bottom: 10px;
          }
          p {
            color: #9ca3af;
            margin-bottom: 30px;
            font-size: 0.95rem;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            padding: 12px 16px; 
            border: 1px solid #27273a; 
            text-align: left; 
            font-size: 0.9rem;
          }
          th { 
            background-color: #12131a; 
            color: #a5b4fc;
            font-weight: 600;
          }
          tr:hover td {
            background-color: #12131a;
          }
          a { 
            color: #6366f1; 
            text-decoration: none; 
            font-weight: 500;
          }
          a:hover { 
            text-decoration: underline; 
          }
        </style>
      </head>
      <body>
        <h2>Sovereign System XML Sitemap</h2>
        <p>This is a dynamically styled XML Sitemap generated for search engine indexing and AI crawler discoverability.</p>
        <table>
          <tr>
            <th>URL Location</th>
            <th>Priority</th>
            <th>Change Frequency</th>
            <th>Last Modified</th>
          </tr>
          <xsl:for-each select="s:urlset/s:url">
            <tr>
              <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
              <td><xsl:value-of select="s:priority"/></td>
              <td><xsl:value-of select="s:changefreq"/></td>
              <td><xsl:value-of select="s:lastmod"/></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
