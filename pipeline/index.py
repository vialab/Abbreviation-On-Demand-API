import codecs
import requests
import json
import urllib
import csv

base_url = "http://localhost:10010"
abbr_list = {}
keep_list = {}

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

	with open("abbr/abbr_aggregate.csv", "wb") as csv_file:
	    wr = csv.writer(csv_file)
	    wr.writerows(csv_list)

## create list of lists to output into csv
def format_csv(data):
	for key, val in data.iteritems():
		word_abbr = str(key).split("|")
		word_abbr.append(val)
		yield word_abbr

## combine the counts for each abbreviation for each word
def aggregate_abbr(data):
	for i, row in enumerate(data):
		if i == 0:
			continue
		word_abbr = row[0] + "|" + row[1]
		if word_abbr in abbr_list:
			abbr_list[word_abbr] += 1
		else:
			abbr_list[word_abbr] = 1
		count_kept(row)

## figure out the letter position probabilities
def count_kept(row):
	x = 0
	for y in range(0, len(row[1])):
		if y not in keep_list:
			keep_list[y] = {"p":0, "total":0}
		if row[0][x] == row[1][y]: # was it kept?
			keep_list[y]["p"] += 1
			x += 1
		keep_list[y]["total"] += 1

## write our new study data to the appropriate format
def write_csv(file_name, list, header=["original", "abbreviation","count"]):
	csv_list = [header]
	csv_list.extend(format_csv(list));
	with open(file_name, "w+") as csv_file:
	    wr = csv.writer(csv_file)
	    wr.writerows(csv_list)

def write_keeplist(file_name):
	new_list = {}
	for i in keep_list:
		new_list[i] = int(round((keep_list[i]["p"] / float(keep_list[i]["total"]))*100))
	write_csv(file_name, new_list, ["position","prob"])

def process_data():
	## vectorize the new study data
	with open('cf_report_1292098_full.csv') as csv_file:
		raw_data = csv.reader(csv_file, delimiter=',')
		aggregate_abbr(raw_data)
	# write_csv("processed/abb_pilot.csv", abbr_list)
	write_keeplist("processed/dropProb_new.csv")

	## aggregate the old data now too
	with open('abbStudy_data.csv') as csv_file:
		raw_data = csv.reader(csv_file, delimiter=',')
		aggregate_abbr(raw_data)
	# write_csv("processed/abb_aggregate.csv", abbr_list)
	write_keeplist("processed/dropProb_aggregate.csv")

abbreviate_test()
# process_data()
