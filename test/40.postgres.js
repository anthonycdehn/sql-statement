#!/usr/bin/env mocha -R spec

var assert = require("assert");
var pg = require("pg");
var promisen = require("promisen");

var TESTNAME = __filename.replace(/^.*\//, "");
var SQL = require("../sql");

var go = process.env.PGHOST || process.env.PGDATABASE;
if (!go) describe = describe.skip;
var suffix = go ? " testing" : " skipped. To test this, please set PGHOST=127.0.0.1 PGDATABASE=test";

describe(TESTNAME + suffix, function() {
  var sql1 = new SQL('SELECT ? AS "foo"', "FOO");
  it(sql1.query(), function(done) {
    var client = new pg.Client();
    client.connect(function(err) {
      if (err) return done(err);
      client.query(sql1 + "", function(err, result) {
        if (err) return done(err);
        var rows = result.rows;
        assert.equal(typeof rows, "object");
        var row = result.rows[0];
        assert.equal(typeof row, "object");
        assert.equal(row.foo, "FOO");
        done(err);
      });
    });
  });

  var sql2 = new SQL("SELECT 'FOO' AS \"foo\"");
  it("promisen.denodeify(client.query).apply(client, sql)", function(done) {
    var client = new pg.Client();
    client.connect(function(err) {
      if (err) return done(err);
      promisen.denodeify(client.query).apply(client, sql2).then(wrap(done, function(result) {
        var rows = result.rows;
        assert.equal(typeof rows, "object");
        var row = rows[0];
        assert.equal(typeof row, "object");
        assert.equal(row.foo, "FOO");
      })).catch(done);
    });
  });
});

function wrap(done, test) {
  return function() {
    try {
      test.apply(this, arguments);
      done();
    } catch (e) {
      done(e);
    }
  };
}