// required node modules
let scraperjs = require('scraperjs');
let json2csv = require('json2csv');
let fs = require('fs');
let request = require('request');
let util = require('util');
let str2json = require('string-to-json');

let allProducts = 'http://www.ulta.com/brand/revlon-makeup?N=1z141giZ26y1&Nrpp=90'

scraperjs.StaticScraper.create(allProducts)
    .scrape($ => {
        let total = $('.productQvContainer');
        let urlPath = [];

        for (var i = 0; i < total.length; i++) {
            let productObj = {productUrl: total[i].children[3].children[1].attribs.href, contentNum: ''};
            urlPath.push(productObj);
        }

        let paths = JSON.stringify(urlPath);

        fs.writeFile('paths.json', paths, (err) => {
            if (err) throw err;
        });
    });

// url to be scraped
let url = 'http://www.ulta.com/dipbrow-pomade?productId=xlsImpprod6330246';

// product ID of item
let productId = url.split('=');
productId = productId.pop();

// start scraping
scraperjs.StaticScraper.create(url)
    .scrape($ => {
        // create CSV fields
        const fields = ['url', 'name', 'location', 'rating', 'review'];
        // new line for CSV
        const newLine= "\r\n";
        // create heading on csv
        let csv = json2csv({fields: fields}) + newLine;
        // create the csv file
        fs.writeFile('' + productId + '.csv', csv, (err) => {
          if (err) throw err;
        });
        // counts number of reviews
        let pages = $('.count');
        // number of reviews divided by 10 always round up to get pagination
        let numPages = Math.ceil((pages.text()/10));
        // start loop to loop through pagination
        for (let i = 1; i <= numPages; i++) {
                // each path = 1 page
                let path = "http://www.ulta.com/reviewcenter/pwr/content/00/49/xlsImpprod6330246-en_US-" + i + "-reviews.js";

                // request data from path
                request(path, (err, res, body) => {
                    // parse the response body
                    let data = body.split("reviews.js'] = ");
                    let content = data.pop();
                    let newData = content.replace("];", "]");
                    let json = JSON.stringify(eval("(" + newData + ")"));
                    let parsed = JSON.parse(json);
                    // create an array to contain the review objects
                    let list = [];
                    // loop through parsed json creating the review objects
                    for (let j = 0; j < parsed.length; j++) {
                        let obj = {url: url, name: parsed[j].r.n, location: parsed[j].r.w, rating: parsed[j].r.r, review: parsed[j].r.p};
                        // push review objects to list
                        list.push(obj);
                    }
                    // create json object to convert to csv from list - no column titles
                    let toCsv = {data: list, fields: fields, hasCSVColumnTitle: false};
                    // convert toCsv to csv
                    let csv = json2csv(toCsv) + newLine;
                    // append to the csv file
                    fs.appendFile('' + productId + '.csv', csv, (err) => {
                        if(err) throw err;
                    });
                });
        }
    })
