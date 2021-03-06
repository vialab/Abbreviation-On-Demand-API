setwd("/Users/jayrsawal/GitHub/Abbreviation-On-Demand-API/pipeline/abbr")
mydata = read.csv("abbr_comparison.csv")

mydata[6] <- apply(mydata, 1, function(a) adist(a[2], a[3]))
mydata[7] <- apply(mydata, 1, function(a) adist(a[2], a[4]))
mydata[8] <- apply(mydata, 1, function(a) adist(a[2], a[5]))

write.csv(file="levenshtein.csv", x=mydata)


