// required node modules
let scraperjs = require('scraperjs');
let json2csv = require('json2csv');
let fs = require('fs');
let request = require('request');
let util = require('util');
let str2json = require('string-to-json');

// let allProducts = 'http://www.ulta.com/brand/revlon-makeup?N=1z141giZ26y1&Nrpp=90'
//
// scraperjs.StaticScraper.create(allProducts)
//     .scrape($ => {
//         let total = $('.productQvContainer');
//         let urlPath = [];
//
//         for (var i = 0; i < total.length; i++) {
//             let productObj = {productUrl: total[i].children[3].children[1].attribs.href, contentNum: ''};
//             urlPath.push(productObj);
//         }
//
//         let paths = JSON.stringify(urlPath);
//
//         fs.writeFile('paths.json', paths, (err) => {
//             if (err) throw err;
//         });
//     });

// read and parse paths.json use that to start scrape
fs.readFile('paths.json', 'utf8', function (err, data) {
  if (err) throw err;
  var obj = JSON.parse(data);

  var productUrl = [];
  var contentNum = [];
  var prodId = [];

  for (var i = 0; i < obj.length; i++) {
      productUrl.push(obj[i].productUrl);
      contentNum.push(obj[i].contentNum);

    let url = 'http://www.ulta.com' + productUrl[i];
    // product ID of item
    let productId = url.split('=');
    productId = productId.pop();

    let contNum = contentNum[i];
//start scraping
console.log(i);
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
            for (let j = 1; j <= numPages; j++) {
                    // each path = 1 page
                    let path = "http://www.ulta.com/reviewcenter/pwr/content"+ contNum + "/" + productId + "-en_US-" + j + "-reviews.js";
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
                        for (let k = 0; k < parsed.length; k++) {
                            let revObj = {url: url, name: parsed[k].r.n, location: parsed[k].r.w, rating: parsed[k].r.r, review: parsed[k].r.p};
                            // push review objects to list
                            list.push(revObj);
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

    }
});
