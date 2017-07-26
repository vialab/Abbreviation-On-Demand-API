/******************************************************************************
Developer's notes: This is the main controller file for Swagger to use.
- VS 07/25/2017
*******************************************************************************/

'use strict';

var util = require('util');
var aod = require('../abbOnDemand.js');

module.exports = {
    abbreviate: api_abbreviate,
    abbreviatelist: api_abbreviateList
};

/******************************************************************************
Functions called by Swagger
*******************************************************************************/

function api_abbreviate(req, res, next) {
    var strWord = req.swagger.params.word.value;
    var nLen = req.swagger.params.length.value;
    var jsonResponse = {
        word: strWord,
        abbr: abbreviate(strWord, nLen),
        length: nLen
    };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jsonResponse || {}, null, 2));
}

function api_abbreviateList(req, res, next) {
    var aWordList = req.swagger.params.body.value;
    var jsonResponse = [];

    for (var i=0; i<aWordList.length; i++) {
        var strWord = aWordList[i].word;
        var nLen = aWordList[i].length;
        var jsonWord = {
            word: strWord,
            abbr: abbreviate(strWord, nLen),
            length: nLen
        };
        jsonResponse.push(jsonWord);
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jsonResponse || {}, null, 2));
}

/******************************************************************************
Wrapper functions for abbOnDemand.js
*******************************************************************************/

function abbreviate(word, size) {
    if (size < 1) {
        return "ERROR: ZERO LENGTH";
    }

    if (size > word.length) {
        return "ERROR: LENGTH MUST BE LESS THAN WORD LENGTH"
    }
    
    if(word.indexOf(' ') >= 0) {
        return abbreviate_phrase(word, size, global.alpha, global.digraph, global.monograph, global.correlationMatrix, global.dropProbability);
    } else {
        return aod.abbreviate(word, size, global.alpha, global.digraph, global.monograph, global.correlationMatrix, global.dropProbability);
    }
}

function abbreviate_phrase(phrase, size) {
    var newPhrase = phrase;
    while (newPhrase.length > size){
        var aux = newPhrase.split(" "), longest = 0;        
        for(a in aux){
            if (aux[a].length > aux[longest].length){
                longest = a;                    
            }                
        }
        aux[longest] = aod.abbreviateTweet(aux[longest], aux[longest].length-1, global.alpha, global.digraph, global.monograph, global.correlationMatrix, global.dropProbability);
        newPhrase = "";
        for (a in aux){
            newPhrase+=aux[a]+" ";
        }
        newPhrase = newPhrase.trim();
    }
    return newPhrase;
}