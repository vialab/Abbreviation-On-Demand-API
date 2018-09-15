import codecs
import requests
import json
import urllib
import csv

base_url = "http://localhost:10010"
abbr_list = {}
keep_list = {}
for x in range(0, 20):
	keep_list[x] = {"p":0, "total":0}

## run current algo on our test sample
def abbreviate_test(tech=False):
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
				if tech:
					aod = abbr["abbr"]
					x = int(abbr["length"])
					trunc = abbr["word"][:x]
					trunc_end = abbr["word"][:x-1] + abbr["word"][-1]
					drop_vowel = abbr["word"]
					for v in "aeiou":
						drop_vowel = drop_vowel.replace(v, "")
					csv_list.append([abbr["word"], abbr["abbr"], trunc, trunc_end, drop_vowel, abbr["length"]])
				else:
					csv_list.append([abbr["word"], abbr["abbr"], abbr["length"]])

	with open("abbr/abbr_comp.csv", "wb") as csv_file:
	    wr = csv.writer(csv_file)
	    wr.writerows(csv_list)

## create list of lists to output into csv
def format_csv(data):
	for key, val in data.iteritems():
		word_abbr = str(key).split("|")
		word_abbr.append(val)
		yield word_abbr

## combine the counts for each abbreviation for each word
def aggregate_abbr(data, save_file=False, partition_file=False):
	for i, row in enumerate(data):
		if i == 0:
			continue
		word_abbr = row[0] + "|" + row[1]
		if word_abbr in abbr_list:
			abbr_list[word_abbr] += int(row[2])
		else:
			abbr_list[word_abbr] = int(row[2])
		# for x in range(0, len(row[0])):
		# 	keep_list[x]["total"] += 1
		count_kept(row)
		# write algo data every 1k words trained
		if save_file:
			if (partition_file and i % 4000 == 0) or not partition_file:
				write_csv("processed/abbStudy_" + str(i) + ".csv", abbr_list)
				write_keeplist("processed/dropProbability_" + str(i) + ".csv")

## figure out the letter position probabilities
def count_kept(row):
	orig = row[0].lower()
	abbr = row[1].replace(".","").replace("'","").replace("\"", "").replace(" ", "").lower()
	# before = 0
	n_exists = 0
	x = 0
	# filter out any results where more than 35% of characters don't exist in
	# the original word
	for y in range(len(abbr)):
		if abbr[y] in orig:
			n_exists += 1
	if (n_exists/float(len(abbr))) < 0.75:
		print orig + ", " + abbr
		return
	if len(abbr) > len(orig): # what was the point???!
		print orig + ", " + abbr
		return
	for y in range(0, len(abbr)):
		if y not in keep_list:
			keep_list[y] = {"p":0, "total":0}
		if orig[x] == abbr[y]: # was it kept?
			keep_list[y]["p"] += int(row[2])
			x += 1
		keep_list[y]["total"] += int(row[2])
	# for y in range(len(abbr)): # loop through the abbreviation
	# 	x = before
	# 	find = -1
	# 	while find==-1 and x<len(orig):
	# 		keep_list[x]["total"] += int(row[2])
	# 		if abbr[y] == orig[x]:
	# 			find = x
	# 			before = x+1
	# 		x += 1
	# 	if find != -1:
	# 		keep_list[find]["p"] += int(row[2])

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
		if keep_list[i]["total"] > 0:
			new_list[i] = int(round((keep_list[i]["p"] / float(keep_list[i]["total"]))*100))
	write_csv(file_name, new_list, ["position","prob"])

def process_data():
	## aggregate the old data now too
	with open('abbStudy_data.csv') as csv_file:
		raw_data = csv.reader(csv_file, delimiter=',')
		aggregate_abbr(raw_data)
	# write_csv("processed/abb_aggregate.csv", abbr_list)
	# write_keeplist("processed/dropProbability.csv")
	# vectorize the new study data
	with open('full_study_data.csv') as csv_file:
		raw_data = csv.reader(csv_file, delimiter=',')
		aggregate_abbr(raw_data, True, True)

abbreviate_test()
# process_data()
