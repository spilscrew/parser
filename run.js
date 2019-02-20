'use strict'

const http = require('http');
const fs = require('fs');
const rp = require('request-promise');
const $ = require('cheerio');
const ejs = require('ejs');

//Variables init
let list = [];
let allFoundItems = '';
let itemsPerPage = '';
let pagesCount = '';
let currentPage = 1
let address = '';

//Request settings
let search_terms = 'Rainbow+Shops'
let geo_location_terms = 'ny';

let options = {
	uri: 'https://www.yellowpages.com/search?search_terms=' + search_terms + '&geo_location_terms=' + geo_location_terms + '&page=' + currentPage,
	transform: function (body) {
		return $.load(body);
	},
	json: true
};

let outerRP = () =>  {
	rp(options)
		.then(($) => {
			if (currentPage === 1) {
				allFoundItems = Number($('.pagination > p').contents()[1].data);
				itemsPerPage = $('.v-card').length;
				pagesCount = Math.round(allFoundItems / itemsPerPage);
			}
			for (let i = 0; i <= itemsPerPage; i++) {
				if($('.v-card .business-name span')[i]) {
					options.uri = 'https://www.yellowpages.com' + $('.business-name')[i].attribs.href;
					innerRP();
									
				}
			}
			console.log(currentPage + ' / ' + pagesCount + ' - pages is parsed');
			nextPage();
		})
		.catch((err) => {
			console.log(err);
		});
};

let innerRP = (link) =>  {
	rp(options)
		.then(($) => {
			list.push({
				name: $('.sales-info h1').text(),
				address: $('.contact .address').text(),
				phone: $('.contact .phone').text()
			});
			
		});
	
};

let nextPage = () => {
	currentPage++;
	if(currentPage <= pagesCount) {		
		options.uri = 'https://www.yellowpages.com/search?search_terms=' + search_terms + '&geo_location_terms=' + geo_location_terms + '&page=' + currentPage;
		outerRP();
	}
}
		
outerRP();

http.createServer((req,res) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	fs.readFile('index.html', 'utf-8', (err, content) => {
		if (err) {
			res.end('error occurred');
			return;
		}
		var renderedHtml = ejs.render(content, {dataObj: list});
		res.end(renderedHtml);
  });
}).listen(80);


