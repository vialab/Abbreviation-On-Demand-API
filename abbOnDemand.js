/******************************************************************************
Developer's notes: This abbOnDemand.js was modified so that the functions 
found in wordVis.js has been appended to it. This change was made for 
convenience when running this code server side.
- VS 07/25/2017
*******************************************************************************/
var csv = require('csvtojson');
module.exports = {
    init_data: init_data,
    abbreviate: abbreviate,
    abbreviateTweet: abbreviateTweet
};

// This data was being loaded browser side in order for the algorithm to function.
// Load it globally server-side once and use it in the wrapper (aod.js).
function init_data() {
    global.letterFreq = "etaoinsrhldcumfpgwybvkxjqz";
    global.labels = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    global.matLabel = getLabels(labels);
    global.alpha = {};
    global.correlationMatrix = [];
    global.useAccuracy = false;
    global.digraph = {}, global.monograph = {}, global.loadedData, global.dropProbability;
    csv().fromFile("./data/abbStudy_data.csv").on("end_parsed", function(data) {
        csv().fromFile("./data/rankbigraph.csv").on("end_parsed", function(rank) {  
            global.digraph = processRank(rank);
            csv().fromFile("./data/monograph.csv").on("end_parsed", function(mono) {         
                csv().fromFile("./data/accuracy.csv").on("end_parsed", function(acc) {
                    csv().fromFile("./data/dropProbability.csv").on("end_parsed", function(dropProb) {
                        global.loadedData = process(data);
                        var alphaVector = stats(global.loadedData,global.labels);
                        global.monograph = getDrop(alphaVector);
                        global.dropProbability = dropProb;
                        global.loadedData = process2(acc);
                        global.alpha = statsMatrixBigraph(global.loadedData,global.matLabel);
                        global.correlationMatrix = getDrop1(global.alpha, global.digraph);
                    });
                });
            });
        });
    });
}


/******************************************************************************
abbOnDemand.js - Unmodified
*******************************************************************************/

function abbreviateCamelCase(word, size, alpha, digraph, monograph, correlationMatrix, dropProb, labels){
    var letters = [];
    
    var total=0;
    for (a in alpha){
        for(b in alpha[a].pair){
            total+= parseInt(alpha[a].pair[b].max);
        }
    }

    var dropped = [];
    var scale = getDropProb(dropProb, word.length);
    
    for (var w=0; w<word.length;w++){
        var l = word[w].toUpperCase();
        
        if(word[w]==l){
            var score = 0.0;
        }else{
            if (w==0){
                var score = parseFloat(monograph[word[w].rank]*(1-scale[w]/100));                
            }else{                                    
                var score = parseFloat(correlationMatrix[labels.indexOf(word[w-1].toUpperCase())][labels.indexOf(l)] * (1-scale[w]/100));
            }
        }
        
        var letter = {char: word[w], mono: score, deleted: 0};
        
        if (isNaN(letter.mono))
            letter.mono = -1;

        dropped.push(letter);        
    }
    
    var i=0, str="";
    while((countNonDeleted(dropped)>size) && (countNonDeleted(dropped)>0) && (i<countNonDeleted(dropped))){
        i++;
        var max = -1;
        for (var i=0; (max==-1 && i<dropped.length); i++){
            if (dropped[i].deleted==0)
                max = i;
        }
        
        for (a in dropped ){
            if ((dropped[a].deleted==0)&&(dropped[a].mono>=dropped[max].mono)){
                max = a;
            }
        }
        dropped[max].deleted = 1;
    }

    return getAbbreviation(dropped);
}

function abbreviate(word, size, alpha, digraph, monograph, correlationMatrix, dropProb){
    var letters = [];
    var total=0;
    for (a in alpha){
        for(b in alpha[a].pair){
            total+= parseInt(alpha[a].pair[b].max);
        }
    }

    var dropped = [];
    var scale = getDropProb(dropProb, word.length);
    
    for (var w=0; w<word.length;w++){
        var l = word[w].toUpperCase();
        
        if (w==0 || word[w-1] == " "){
            var score = parseFloat(monograph[word[w].rank]*(1-scale[w]/100));
        }else{        
            var score = parseFloat(correlationMatrix[labels.indexOf(word[w-1].toUpperCase())][labels.indexOf(l)] * (1-scale[w]/100));
        }
        
        var letter = {char: word[w], mono: score, deleted: 0};
        
        if (isNaN(letter.mono))
            letter.mono = -1;

        dropped.push(letter);        
    }
//    console.log(dropped);
    
    
    var i=0, str="";
    
//    str += " "+ (getAbbreviation(dropped) + "  ,  " + countNonDeleted(dropped));

    while((countNonDeleted(dropped)>size) && (countNonDeleted(dropped)>0) && (i<countNonDeleted(dropped))){
        i++;
        var max = -1;
        for (var i=0; (max==-1 && i<dropped.length); i++){
            if (dropped[i].deleted==0)
                max = i;
        }
        
        for (a in dropped ){
            if ((dropped[a].deleted==0)&&(dropped[a].mono>=dropped[max].mono)){
                max = a;
            }
        }
        dropped[max].deleted = 1;
    }  
    
    return getAbbreviation(dropped);
}

function abbreviateTweet(word, size, alpha, digraph, monograph, correlationMatrix, dropProb){
    var letters = [];
    
    var total=0;
    for (a in alpha){
        for(b in alpha[a].pair){
            total+= parseInt(alpha[a].pair[b].max);
        }
    }

    var dropped = [];
    var scale = getDropProb(dropProb, word.length);
    
    for (var w=0; w<word.length;w++){
        if(word[w].match("[^a-zA-Z]+")){
            var letter = {char: word[w], mono: -1, deleted: 0};
            
        }else{
            var l = word[w].toUpperCase();
            if (w==0){                
                var score = parseFloat(monograph[word[w].rank]*(1-scale[w]/100));
            }else {
                if(word[w-1].match("[^a-zA-Z]+")){
                    var score = parseFloat(monograph[l].rank * (1-scale[w]/100));
                    var letter = {char: word[w], mono: score, deleted: 0};            
                }else{        
                    var score = parseFloat(correlationMatrix[labels.indexOf(word[w-1].toUpperCase())][labels.indexOf(l)] * (1-scale[w]/100));
                }                
            }

            var letter = {char: word[w], mono: score, deleted: 0};
        }
        
        if (isNaN(letter.mono))
            letter.mono = -1;

        dropped.push(letter);        
    }    
    
    var i=0, str="";
    while((countNonDeleted(dropped)>size) && (countNonDeleted(dropped)>0) && (i<countNonDeleted(dropped))){
        i++;
        var max = -1;
        for (var i=0; (max==-1 && i<dropped.length); i++){
            if (dropped[i].deleted==0)
                max = i;
        }
        
        for (a in dropped ){
            if ((dropped[a].deleted==0)&&(dropped[a].mono>=dropped[max].mono)){
                max = a;
            }
        }
        dropped[max].deleted = 1;
    }

    return getAbbreviation(dropped);
}

    
function getDropProb(prob, size){
    var aux = [], newScale = [];
    for (var i=0;i<size;i++){
        newScale[i] = [];    
    }
    var max = size-1;
    for (p in prob){
        aux[p] = parseInt((max/prob[prob.length-1].position) * (p-prob[prob.length-1].position) + max);
    }
    for (a in aux){
        newScale[aux[a]].push(prob[a].prob);
    }

    var scale = [];
    for (n in newScale){
        var sum = 0;
        for (s in newScale[n]){
            sum += parseFloat(newScale[n][s]);
        }
        scale[n] = parseFloat(sum/newScale[n].length);
    }

    return scale;
}

function getAbbreviation(letters){
    var abb = "";
    for(a in letters){
        if(letters[a].deleted==0)
            abb += letters[a].char;
    }
    return abb;
}

function countNonDeleted(letters){
    var size =0;
    for(a in letters){
        if(letters[a].deleted==0)
            size++;
    }
    return size;
}

function getDrop1(alpha, digraph){
        var matrix = [], str=[], total = 0;

        for (a in alpha){
            for(b in alpha[a].pair){
                total+= parseInt(alpha[a].pair[b].max);
            }
        }
        var maxDB = alpha['A'].pair['B'].max/total;

        for (a in alpha){
            for(b in alpha[a].pair){
                if (maxDB<(alpha[a].pair[b].max/total))
                    maxDB = (alpha[a].pair[b].max/total);
            }
        }

        var max = parseFloat((alpha['A'].pair['B'].max/total)*digraph['AB'].freq*calcAccuracy(alpha['A'].pair['B'].accuracy));


        for (a in alpha){
            var vec = [];
            for(b in alpha[a].pair){
                var info = alpha[a].pair[b];
                var c = parseFloat((info.dropAfter/info.max)*(info.max/total)*calcAccuracy(info.accuracy));
                
                if (c>max)
                    max = c;
                vec.push(c);    
            }  
            matrix.push(vec);
        }  

        for (m in matrix){
            for (v in matrix[m]){
                matrix[m][v] = matrix[m][v] / max;
            }
        }
    
        return matrix;
}

/******************************************************************************
wordVis.js - unmodified
*******************************************************************************/

function process(data){
    var dict = {};
    for(var obj in data){
        var key = data[obj].original;
        if (key in dict){
            var auxObj = dict[key];
            var vec = auxObj.vec;
            auxObj.total = parseInt(auxObj.total)+parseInt(data[obj].count); 
            var aux = {};
            aux.abbr = data[obj].abbreviation;
            aux.count = data[obj].count;
            vec.push(aux);
            auxObj.vec = vec;
            dict[key] = auxObj;
        }else{
            dict[key] ={total:data[obj].count, vec: [{abbr:data[obj].abbreviation, count:data[obj].count}]};
        }
    }    
    return dict;    
}

function getDrop(alpha){
    var matrix = [], str=[];
    for (a in alpha){
        str.push({letter:a, count:parseInt((alpha[a].drop/alpha[a].max)*100)});
    }                       
    return str;
} 

function process2(data){
    var dict = {};
    for(var obj in data){
        var key = data[obj].original;
        if (key in dict){
            var auxObj = dict[key];
            var vec = auxObj.vec;
            auxObj.total = parseInt(auxObj.total)+parseInt(data[obj].count); 
            var aux = {};
            aux.abbr = data[obj].abbreviation;
            aux.count = data[obj].count;
            aux.acc = data[obj].accuracy;
            vec.push(aux);
            auxObj.vec = vec;
            dict[key] = auxObj;
        }else{
            dict[key] ={total:data[obj].count, vec: [{abbr:data[obj].abbreviation, count:data[obj].count, acc:data[obj].accuracy}]};
        }
    }    
    return dict;    
}

function calcAccuracy(accuracy){
    // if we are not using accuracy, return 100% accurate for everything
    if(!global.useAccuracy) return 1;
    
    var correct = wrong = score = 0;
    for (x in accuracy){        
        switch(x) {
            case "correct":
            case "semantic":
            case "plural":
            case "typo":
                correct += parseInt(accuracy[x]);
                break;
            default:
                wrong += parseInt(accuracy[x]);
        }
    }
    score = parseFloat(correct/(correct+wrong));
    if (isNaN(score))
        return 0;
    return score;
    
}


function processRank(data){
    var dict = {};
    for(var obj in data){
        var key = data[obj].digraph;
        dict[key] ={count:data[obj].count, freq: data[obj].freq, rank: data[obj].rank};
    }    
    return dict;    
}

function processMonograph(data){
    var dict = {};
    for(var obj in data){
        var key = data[obj].letter;
        dict[key] ={count:data[obj].rank, rank: data[obj].freq};
    }    
    return dict;    
}


function stats(data, label){
    var set = {}, alpha={};
    for (var i in label){
        alpha[label[i]] = {drop:0, add:0, kept:0, max:0};                
    }
    for(var a in alpha){
        for(var key in data){ 
            var k = key.toUpperCase();
            var max = k.split(a).length-1;
            alpha[a].max += max*data[key].total;
            var vec = data[key].vec;
            for(var v in vec){
                var ab = vec[v].abbr.toUpperCase();
                var n = ab.split(a).length-1;
                n = n-max;
                if (n>0){
                    alpha[a].add += n*vec[v].count;
                }else if (n==0 && max!=0){
                    alpha[a].kept+=parseInt(vec[v].count);
                }else if(n<0){
                    alpha[a].drop += (-1*n)*vec[v].count;    
                }                       
            }
        }                
    }         
    return alpha;
}

function orderby(str,order){
            var matrix = [], lbMatrx = [];
            if (order=='0'){
            }else if (order=='1'){
                str = str.sort(function(a,b){
                    if(isNaN(a.count))
                        return 1;
                    return b.count - a.count;
                });                
            } else if (order=='2'){
                str = str.sort(function(a,b){
                    var iA = letterFreq.indexOf(a.letter.toLowerCase());
                    var iB = letterFreq.indexOf(b.letter.toLowerCase());
                    return iA-iB;
                });
            }
            var aux = [];
            for (var s in str){
                lbMatrx.push(str[s].letter);
                aux.push(str[s].count);
            }
            matrix.push(aux);
            return {matrix:matrix, lbMatrix:lbMatrx};
        }
        



function statsMatrixBigraph(data, alpha){
    var set = {};
    
    for(var a in alpha){        
        for(var b in alpha[a].pair){
            var search = a+b;
            for(var key in data){ 
                var k = key.toUpperCase();
                var max = k.split(search).length-1;
                alpha[a].pair[b].max += max*data[key].total;
                var vec = data[key].vec;
                for(var v in vec){
                    var ab = vec[v].abbr.toUpperCase();
                    var n = ab.split(search).length-1;
                    n = n-max;                  
                                     
                    if (n>0){
                        alpha[a].pair[b].add += n*vec[v].count;
                    }else if (n==0 && max!=0){
                        alpha[a].pair[b].kept+=parseInt(vec[v].count);
                    }else if(n<0){
                        alpha[a].pair[b].drop += (-1*n)*vec[v].count;
                    }                       
                }
            } 
        }
    }
    for(var key in data){ 
        var k = key.toUpperCase();        
        var vec = data[key].vec;
        for(var v in vec){
            var ab = vec[v].abbr.toUpperCase();
            
            var index = 1;
            for(var i=1; (i<k.length) && (index<ab.length);i++){
                if (k[i]==ab[index]){
                    index++;
                }else{
                    alpha[k[i-1]].pair[k[i]].dropAfter += parseInt(vec[v].count);
                    if (vec[v].acc in alpha[k[i-1]].pair[k[i]].accuracy)
                            alpha[k[i-1]].pair[k[i]].accuracy[vec[v].acc] += parseInt(vec[v].count);
                        else
                            alpha[k[i-1]].pair[k[i]].accuracy[vec[v].acc] = parseInt(vec[v].count);
                }
            }
        }
            
    }         
    return alpha;
}

function statsMatrix(data, alpha){
    var set = {};
    
    for(var a in alpha){        
        for(var b in alpha[a].pair){
            var search = a+b;
            for(var key in data){ 
                var k = key.toUpperCase();
                var max = k.split(search).length-1;
                alpha[a].pair[b].max += max*data[key].total;
                var vec = data[key].vec;
                for(var v in vec){
                    var ab = vec[v].abbr.toUpperCase();
                    var n = ab.split(search).length-1;
                    n = n-max;
                    if (n>0){
                        alpha[a].pair[b].add += n*vec[v].count;
                    }else if (n==0 && max!=0){
                        alpha[a].pair[b].kept+=parseInt(vec[v].count);
                    }else if(n<0){
                        alpha[a].pair[b].drop += (-1*n)*vec[v].count;
                        if (vec[v].acc in alpha[a].pair[b].accuracy)
                            alpha[a].pair[b].accuracy[vec[v].acc] += parseInt(vec[v].count);
                        else
                            alpha[a].pair[b].accuracy[vec[v].acc] = parseInt(vec[v].count);
                    }                       
                }
            } 
        }
    }         
    console.log(alpha);            
    return alpha;
}

function comPair(word, abbr, alpha){
    var i=0, result = {};
    word = word.toUpperCase();
    abbr = abbr.toUpperCase();
    for(var w in word){
        if (word[w]==abbr[i]){   
        }   
    }    
}

function getLabels(label){
    var alpha = {};
    for (var l in label){
        var dict = {};
        for (var lb in label){
            dict[label[lb]] = {drop:0, dropAfter:0, add:0, kept:0, max:0, accuracy:{}};
        }
        alpha[label[l]] = {pair:dict};
    }
    return alpha;
}