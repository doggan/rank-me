'use strict';

var redis = require('redis'),
    async = require('async');

var ENTRY_ID_SUFFIX = ':entry_id_cnt';
var SCORE_ID_SUFFIX = ':scores';
var NAME_ID_SUFFIX = ':name:';

function defaultFor(arg, val) {
    return typeof arg !== 'undefined' ? arg : val;
}

function Leaderboard(id, options) {
    options = defaultFor(options, {});

    this.id = id;

    this._connect(options);
}

Leaderboard.prototype._connect = function (options) {
    var port = defaultFor(options.port, 6379);
    var host = defaultFor(options.host, '127.0.0.1');

    console.log('Creating redis client (' + this.id + '): ' + host + ':' + port);
    this.client = redis.createClient(port, host);

    if (typeof options.db !== 'undefined') {
        console.log('Switch to db: ' + options.db);
        this.client.select(options.db);
    }

    this.client.on("error", function (err) {
        console.log("Error " + err);
    });
};

/**
 * Gets the total # of stores stored in the leaderboard.
 */
Leaderboard.prototype.getScoreCount = function (cb) {
    var self = this;

    self.client.zcard(self.id + SCORE_ID_SUFFIX, function(err, count) {
        if (err) return cb(err);

        cb(null, count);
    });
};

/**
 * Adds a score to the leaderboard for a given user name.
 */
Leaderboard.prototype.addScore = function (name, score, cb) {
    var self = this;

    self.client.incr(self.id + ENTRY_ID_SUFFIX, function(err, entryId) {
        // Treat as a single transaction.
        var multi = self.client.multi();
        multi.zadd([self.id + SCORE_ID_SUFFIX, score, entryId]);
        multi.set(self.id + NAME_ID_SUFFIX + entryId, name);
        multi.exec(function(err, replies) {
            if (err) return cb(err);

            cb(null, entryId);
        });
    });
};

/**
 * Gets the rank for a given leaderboard entry.
 */
Leaderboard.prototype.getRank = function (entryId, cb) {
    var self = this;

    var req = [self.id + SCORE_ID_SUFFIX, entryId];
    self.client.zrevrank(req, res);

    function res(err, rank) {
        if (err) return cb(err);

        if (rank === null) cb(null, -1);
        else cb(null, +rank);
    }
};

/**
 * Gets the names and scores for a given range of ranks.
 */
Leaderboard.prototype.getScoresForRankRange = function (fromRank, toRank, cb) {
    var self = this;

    var req = [self.id + SCORE_ID_SUFFIX, fromRank, toRank, 'WITHSCORES'];
    self.client.zrevrange(req, res);

    function res(err, range) {
        if (err) return cb(err);

        var i,
            ids = [], len = range.length,
            scores = [], names = [], ranks = [];

        // Get all the ids and scores for this range.
        for (i = 0; i < len; i += 2) {
            ids.push(range[i]);
            scores.push(Number(range[i + 1]));
        }

        // For each id, look up the associated name.
        async.eachSeries(ids, function(id, next) {
            self.client.get(self.id + NAME_ID_SUFFIX + id, function(err, name) {
                if (err) return next(err);

                names.push(name);

                // Also get the rank for each id.
                self.getRank(id, function(err, rank) {
                    if (err) return next(err);

                    ranks.push(rank);

                    next();
                });
            });
        }, function(err) {
            if (err) return cb(err);

            if (scores.length !== names.length ||
                scores.length !== ranks.length) {
                return cb('Invalid array length.');
            }

            // Construct a nice list with the results.
            var list = [];
            len = scores.length;
            for (i = 0; i < len; i++) {
                list.push({
                    name: names[i],
                    rank: ranks[i],
                    score: scores[i]
                });
            }

            cb(null, list);
        });
    }
};

module.exports = Leaderboard;
