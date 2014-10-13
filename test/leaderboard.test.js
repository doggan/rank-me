'use strict';
/*jshint expr: true*/
/*global describe, it, before*/

var expect = require('chai').expect,
    async = require('async'),
    Leaderboard = require('./../index');

var TEST_LEADERBOARD_ID = 'test_leaderboard_0';
var TEST_LEADERBOARD_DB = 5;
var lb = new Leaderboard(TEST_LEADERBOARD_ID, { db: TEST_LEADERBOARD_DB });

describe('leaderboard', function() {
    var entryIds = {};

    before(function(done) {
        lb.client.flushdb(function() {
            async.series([
                function(cb) {
                    lb.addScore('Bob', 4, function(err, entryId) {
                        expect(err).to.not.exist;
                        entryIds.bob = entryId;
                        cb();
                    });
                }, function(cb) {
                    lb.addScore('Joe', 10, function(err, entryId) {
                        expect(err).to.not.exist;
                        entryIds.joe = entryId;
                        cb();
                    });
                }, function(cb) {
                    lb.addScore('Helen', 8, function(err, entryId) {
                        expect(err).to.not.exist;
                        entryIds.helen = entryId;
                        cb();
                    });
                }], function() {
                    done();
                });
        });
    });

    it('can query the rankings for specified entries', function(done) {
        lb.getScoreCount(function(err, count) {
            expect(err).to.not.exist;
            expect(count).to.equal(3);

            lb.getRank(entryIds.bob, function(err, rank) {
                expect(err).to.not.exist;
                expect(rank).to.equal(2);

                lb.getRank(entryIds.joe, function(err, rank) {
                    expect(err).to.not.exist;
                    expect(rank).to.equal(0);

                    lb.getRank(entryIds.helen, function(err, rank) {
                        expect(err).to.not.exist;
                        expect(rank).to.equal(1);

                        done();
                    });
                });
            });
        });
    });

    it('can query the rankings for a range of ranks', function(done) {
        lb.getScoreCount(function(err, count) {
            expect(err).to.not.exist;
            expect(count).to.equal(3);

            lb.getScoresForRankRange(1, 3, function(err, list) {
                expect(err).to.not.exist;

                expect(list.length).to.equal(2);

                var h = list[0];
                expect(h.name).to.equal('Helen');
                expect(h.score).to.equal(8);

                var b = list[1];
                expect(b.name).to.equal('Bob');
                expect(b.score).to.equal(4);

                lb.getScoresForRankRange(2, 4, function(err, list) {
                    expect(err).to.not.exist;

                    expect(list.length).to.equal(1);

                    b = list[0];
                    expect(b.name).to.equal('Bob');
                    expect(b.score).to.equal(4);

                    done();
                });
            });
        });
    });
});
