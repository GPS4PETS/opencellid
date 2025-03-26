#!/usr/bin/env node

const http = require('http');
const sqlite3 = require('sqlite3');
const path = require('path');
const Url = require('url');
const util = require('util');
const fs = require('fs');
const ociDb = new sqlite3.Database('/opt/opencellid/sqlite/oci_cells.sqlite', sqlite3.OPEN_READONLY);

const approximatedRange = 2147483648;

const defaultLatitude = 46.909009;
const defaultLongitude = 7.360584;
const defaultRange = 4294967295;

const ociDbMtime = new Date(fs.statSync('/opt/opencellid/sqlite/oci_cells.sqlite').mtime).getTime()/1000|0;
console.log('Main database (opencellid) last modifed at:', ociDbMtime);

const OPENCELLID_API_KEY = process.env.OPENCELLID_API_KEY;
if (typeof OPENCELLID_API_KEY != 'undefined') {
  console.log('Using OpenCellId API key:', OPENCELLID_API_KEY);
} else {
  console.warn('No OpenCellId API key supplied via: OPENCELLID_API_KEY');
}

// https://carto.com/blog/center-of-points/
const CENTER_OF_CELLS_QUERY = '\
SELECT \
  s.avg_lat AS lat, \
  180 * atan2(s.zeta, s.xi) / pi() AS lon \
FROM \
  ( \
  SELECT  \
    avg(lat) AS avg_lat, \
    avg(sin(pi() * lon / 180)) AS zeta, \
    avg(cos(pi() * lon / 180)) AS xi \
  FROM cells WHERE mcc = ? AND mnc = ? AND lac = ? \
  ) AS s'

ociDb.loadExtension(path.join(__dirname,'libsqlitefunctions.so'), function(err) {
  if (err) {
    console.error('Could not load libsqlitefunctions.so extension');
  }
});

var numValidRequests = 0;
var numOpenCellIdResponses = 0;
var numMozillaResponses = 0;
var numUnwiredLabsResponses = 0;
var numApproximatedResponses = 0;
var numDefaultResponses = 0;

var numApproximatedCells = 0;
var numUnknownCells = 0;

http.createServer(function(req, res) {
  const url = Url.parse(req.url, true);
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/')) {
    if (!url.query.mcc || !url.query.mnc || !url.query.lac || !url.query.cell_id) {
      res.writeHead(400);
      return res.end('Need mcc, mnc, lac, cell_id passed in as query parameters');
    } else if ((url.query.mcc > 999) || (url.query.mnc > 999) || (url.query.lac > 65535) || (url.query.cell_id > 268435455)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({"lat":defaultLatitude,"lon":defaultLongitude,"range":defaultRange}));
      return;
    }

    numValidRequests++;
    ociDb.get('SELECT lat, lon, range FROM cells WHERE mcc = ? AND mnc = ? AND lac = ? AND cellid = ?', {
      1: url.query.mcc,
      2: url.query.mnc,
      3: url.query.lac,
      4: url.query.cell_id
      }, function(err, row) {
        if (err) {
          console.error('Error querying OpenCellId database');
          res.writeHead(500);
          res.end(JSON.stringify(err));
          return;
        } else {
          if (row === "") { 
            numOpenCellIdResponses++;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(row));
          } else {
	    console.error('nothing found');
            res.writeHead(500);
            res.end(JSON.stringify("nothing found"));
            return;
	  }
        }
      }
    );
  } else if (req.method === 'GET' && (url.pathname === '/version' || url.pathname === '/api/version/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(ociDbMtime.toString());
  } else {
    res.writeHead(404);
    res.end('Nothing to see here');
  }

}).listen(process.env.PORT || 5265, process.env.IP || '0.0.0.0');

process.on('SIGHUP', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGQUIT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGTSTP', shutdown);
function shutdown() {
  ociDb.close();
  console.log("");
  console.log("Closed databases and exiting now");
  process.exit(0)
}

console.log('Running at port:', process.env.PORT || 5265);
