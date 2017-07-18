#WARNING: BEFORE YOU RUN THIS SCRIPT
#Ensure that you have the BeautifulSoup and python-dateutil installed. To do so, run the following
#pip install bs4
#pip install python-dateutil

#import libraries
from bs4 import BeautifulSoup as soup
from urllib2 import urlopen as openUrl
from datetime import date
from dateutil.relativedelta import relativedelta
#from pymongo import MongoClient

import re
import json

#mongoDB
#client = MongoClient()
#client = MongoClient('mongodb://localhost:27017/')
#db = client.test_database
#db = client.

#scrape options: adjust values where necessary
monthsToScrape = 6
entriesToExtract = str(200)
baseURL = "https://www.sistic.com.sg"
outFile = 'events_data.out'

event_id, webLinks, imageLinks, titles, startDates, venues, categories = [], [], [], [], [], [], []

#remove all html tags from a given line and return it
def cleanHtml(rawHtml):
    cleaner = re.compile('<.*?>')
    cleanedHtml = re.sub(cleaner, '', rawHtml)
    return cleanedHtml

#extracts the event URL, image URL and title of the event
def cleanImageandTitle(imageAndTitleData):
    imageAndTitleData = imageAndTitleData.split("\n")
    imageLine = imageAndTitleData[1]
    titleLine = imageAndTitleData[2]

    imageData = imageLine.split("=")

    siteLink = imageData[2].split("\"")[1]
    imageLink = imageData[3].split("\"")[1]

    #for index, stuff in enumerate(imageData):
        #out.write(str(index) + ": " + stuff + "\n")

    #out.write("**URL: " + baseURL + siteLink.rstrip() + "\n")
    #out.write("**Image: " + baseURL + imageLink.rstrip() + "\n")
    #out.write("**Title: " + cleanHtml(titleLine).rstrip() + "\n")

    #Append to the array
    event_id.append(siteLink[8:])
    webLinks.append(baseURL + siteLink.rstrip())
    imageLinks.append(baseURL + imageLink.rstrip())
    titles.append(cleanHtml(titleLine).rstrip())

#cleans the html data and extract relevant data for each event
def processEntry(entryData):
    imageAndTitleLine = entryData[1]
    dateLine = entryData[2]
    venueLine = entryData[3]
    categoryLine = entryData[4]

    #image and title line is requires more cleaning up compared to the other data, so we will clean them in a seperate function
    cleanImageandTitle(imageAndTitleLine)
    #rest of the data can be cleaned simply
    #out.write("**Date: " + cleanHtml(dateLine).rstrip()+"\n")
    #out.write("**Venue: " + cleanHtml(venueLine).rstrip()+"\n")
    #out.write("**Category: " + cleanHtml(categoryLine).rstrip()+"\n")

    #Append to the array
    startDates.append(cleanHtml(dateLine).rstrip())
    venues.append(cleanHtml(venueLine).rstrip())
    categories.append(cleanHtml(categoryLine).rstrip())

#converts the date format given by python date() into a string usable to parse into sistic URL
def formatDate(date):
    date = date.split("-")
    year = date[0]
    month = date[1]
    day = date[2]
    return day+"/"+month+"/"+year

#generates source URL from current date, and scrape options defined before
def getSourceURL():
    startDate = formatDate(str(date.today()))
    endDate = formatDate(str(date.today() + relativedelta(months=+monthsToScrape)))
    print("Extracting events from " + startDate + " to " + endDate + "\n")
    srcURL = 'https://www.sistic.com.sg/events/search?s='+startDate+'&e='+endDate+'&l='+entriesToExtract+'&o=1&p=1'
    return srcURL

print("")
print("SCRAPE SETTINGS")
print("---------------")
print("Months to scrape: " + str(monthsToScrape))
print("Entries to scrape: " + entriesToExtract)
print("")

srcURL = getSourceURL()
print("Source URL: " + srcURL)

#given source URL, open a connection and retrieve html
client = openUrl(srcURL)
page_html = client.read()
client.close()

#parse html into baseURLtifulSoup and extract all the rows under <div class="result">
#Understanding this code requires you to look into the html structure of the sistic results page
pageSoup = soup(page_html, "html.parser")
result = pageSoup.find("div", {"class":"result"}).findAll("tr")

#open output file handler
out = open(outFile, 'w')


#for each result returned by the soup html parser, we process the data
for line in result[1:]:
    currData = str(line)
    entryData  = currData.split("<td>")
    processEntry(entryData)
    #out.write("---------------------------------------------------------------------------------\n")

#store all the arrays
events_data =[{"Event_id": e, "URL": u, "Image": i, "Title": t, "Date": d, "Venue": v, "Category": c}
            for e, u, i, t, d, v, c in zip(event_id, webLinks, imageLinks, titles, startDates, venues, categories)]

json.dump(events_data, out)
#output = {"stuff": [1, 2, 3]}
#json.dump(output, file)
#print json.dumps(events_data)
#print events_data.type()

out.flush()
out.close()
