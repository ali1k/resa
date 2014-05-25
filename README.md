ReSA (Real-time Semantic Annotation)
====
ReSA annotates real-time streams (e.g. Twitter streams) using Linked Data and provides views for real-time text analytics.
ReSA is an extension of conTEXT platform for lightweight text analytics available at http://context.aksw.org


How to install it?
====
install required NodeJS modules:
npm install

configure DBpedia Spotlight endpoint and Twitter API keys:
- open config.sample.js and fill in the required urls and keys
- save it as config.js
 

To start NodeJS server:
node app.js
