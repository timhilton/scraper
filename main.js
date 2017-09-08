let scraperjs = require('scraperjs');
let json2csv = require('json2csv');
let fs = require('fs');
let request = require('request');
let util = require('util');
let str2json = require('string-to-json');

scraperjs.StaticScraper.create('http://www.ulta.com/liquid-glow?productId=xlsImpprod16451223')
    .scrape($ => {
        // create CSV fields
        const fields = ['name', 'location', 'rating', 'review'];
        // new line for CSV
        const newLine= "\r\n";
        // create heading on csv
        let csv = json2csv({fields: fields}) + newLine;
        // create the csv file
        fs.writeFile('ulta-reviews.csv', csv, (err) => {
          if (err) throw err;
        });
        // counts number of reviews
        const pages = $('.count');
        // number of reviews divided by 10 always round up to get pagination
        const numPages = Math.ceil((pages.text()/10));
        // start loop to loop through pagination
        for (let i = 1; i <= numPages; i++) {
                // each path = 1 page
                let path = "http://www.ulta.com/reviewcenter/pwr/content/07/92/xlsImpprod16451223-en_US-" + i + "-reviews.js";
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
                        let obj = {name: parsed[j].r.n, location: parsed[j].r.w, rating: parsed[j].r.r, review: parsed[j].r.p};
                        // push review objects to list
                        list.push(obj);
                    }
                    // create json object to convert to csv from list - no column titles
                    let toCsv = {data: list, fields: fields, hasCSVColumnTitle: false};
                    // convert toCsv to csv
                    let csv = json2csv(toCsv) + newLine;
                    // append to the csv file
                    fs.appendFile('ulta-reviews.csv', csv, (err) => {
                        if(err) throw err;
                    });
                });
        }
    })
