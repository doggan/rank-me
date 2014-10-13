rank-me
=======

Minimalistic leaderboards for the ranking of non-unique usernames.

Every new name/score pair added to a leaderboard will generate a unique id
associated with the transaction. This id can be stored and used to query
additional information about the transaction at a later time.

## Installation
``` bash
npm install rank-me
```

## API
### Constructor

```javascript
var Leaderboard = require('rank-me');

var leaderboard = new Leaderboard('leaderboard_id', [options]);
```

#### Options

 * `host` (default: 127.0.0.1)
  * The host address of the redis server.
 * `port` (default: 6379)
  * The port of the redis server.
 * `db` (default: 0)
  * Select the specified redis DB.

### Methods

#### getScoreCount(callback)
Gets the total # of stores stored in the leaderboard.

```javascript
leaderboard.getScoreCount(function(err, count) {
    // count - The # of scores in the leaderboard.
});
```

#### addScore(name, score, callback)
Adds a score to the leaderboard for a given user name.</br>
Names are __not__ required to be unique. For every name/score that
is added to the leaderboard, a unique `entryId` will be generated.
This unique id is passed as a parameter to the callback of `addScore`.
Using this unique id, information about the added score entry can be
queried if desired.

```javascript
leaderboard.addScore('Bob', 4, function(err, entryId) {
    // entryId - The unique id for the added score.
});
```

#### getRank(entryId, callback)
Gets the rank for a given leaderboard entry.

```javascript
leaderboard.getRank(entryId, function(err, rank) {
    // rank - The rank of the user, or -1 if it didn't exist.
});
```

#### getScoresForRankRange(fromRank, toRank, callback)
Gets the names and scores for a given range of ranks.</br>
Note that `fromRank` and `toRank` indices are both inclusive.

```javascript
//   Get the top 3 ranks:
leaderboard.getScoresForRankRange(0, 2, function(err, list) {
    // list - List of names ordered from highest to lowest score
    // [
    //   { name: 'bob', rank: 0, score: 30 },
    //   { name: 'joe', rank: 1, score: 20 },
    //   { name: 'sue', rank: 2, score: 10 }
    // ]
});
```
