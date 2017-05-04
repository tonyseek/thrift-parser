#!/usr/bin/env node
'use strict';

var parser = require('../lib/thrift-parser');
var fs = require('fs');
var args = process.argv.slice(2);

if (args.length) {
  args.forEach(function (path) {
    console.log(JSON.stringify(parser(fs.readFileSync(path)), null, 2)); // eslint-disable-line
  });
} else {
  var receiver = [];
  process.stdin.on('data', function (data) {
    return receiver.push(data);
  });
  process.stdin.on('end', function () {
    console.log(JSON.stringify(parser(Buffer.concat(receiver)), null, 2)); // eslint-disable-line
  });
}