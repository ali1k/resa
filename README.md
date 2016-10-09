[![Dependency Status](https://david-dm.org/ali1k/resa.svg)](https://david-dm.org/ali1k/resa)
[![devDependency Status](https://david-dm.org/ali1k/resa/dev-status.svg)](https://david-dm.org/ali1k/resa#info=devDependencies)


ReSA (Real-time Semantic Annotation)
====
ReSA annotates real-time streams (e.g. Twitter streams) using Linked Data and provides views for real-time text analytics.
ReSA is an extension of conTEXT platform for lightweight text analytics available at http://context.aksw.org


How to install it?
====
1. install required NodeJS modules:
 - npm install

2. configure DBpedia Spotlight endpoint and Twitter API keys:
 - open config.sample.js and fill in the required urls and keys
 - save it as config.js


3. To start NodeJS server:
 - node app.js [port number (default port is 5555)]

4. Run the web browser
 - http://localhost:5555
