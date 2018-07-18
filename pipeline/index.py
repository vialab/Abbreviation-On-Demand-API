import codecs
import requests
import json
import urllib
import csv

base_url = "https://abbreviation.vialab.science.uoit.ca"
abbr_list = {}

## run current algo on our test sample
def abbreviate_test():
	csv_list = [["original","abbreviation","length"]]
	with open('abbr_coca_sample.csv') as csv_file:
		raw_data = csv.reader(csv_file, delimiter=',')
		for x, row in enumerate(raw_data):
			if x == 0:
				continue
			post_list = []
			for i in range(3, len(row[1])-1):
				post_list.append({"word": row[1], "length": i})
			if len(post_list) == 0:
				continue
			r = requests.post(base_url + "/abbreviatelist", json=post_list)
			for abbr in r.json():
				csv_list.append([abbr["word"], abbr["abbr"], abbr["length"]])

	with open("abbr_test.csv", "wb") as csv_file:
	    wr = csv.writer(csv_file)
	    wr.writerows(csv_list)

## create list of lists to output into csv
def format_csv(data):
	for key, val in data.iteritems():
		word_abbr = key.split("|")
		word_abbr.append(val)
		yield word_abbr

## combine the counts for each abbreviation for each word
def aggregate_abbr(data):
	for i, row in enumerate(data):
		if i == 0:
			continue
		word_abbr = row[1] + "|" + row[0]
		if word_abbr in abbr_list:
			abbr_list[word_abbr] += 1
		else:
			abbr_list[word_abbr] = 1

## write our new study data to the appropriate format
def write_csv(file_name):
	csv_list = [["original", "abbreviation","count"]]
	csv_list.extend(format_csv(abbr_list));
	with open(file_name, "wb") as csv_file:
	    wr = csv.writer(csv_file)
	    wr.writerows(csv_list)

abbreviate_test()

## vectorize the new study data
with open('abb_pilot_raw.csv') as csv_file:
	raw_data = csv.reader(csv_file, delimiter=',')
	aggregate_abbr(raw_data)

write_csv("abb_pilot.csv")

## aggregate the old data now too
with open('abbStudy_data.csv') as csv_file:
	raw_data = csv.reader(csv_file, delimiter=',')
	aggregate_abbr(raw_data)

write_csv("abb_aggregate.csv")

