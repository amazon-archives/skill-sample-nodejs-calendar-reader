var Alexa = require('alexa-sdk');
var request = require('superagent');
var utils = require('util');

var states = {
    SEARCHMODE: '_SEARCHMODE',
    DESCRIPTION: '_DESKMODE',
};
// local variable holding reference to the Alexa SDK object
var alexa;

var gymID = process.env.MICO_ID;

//OPTIONAL: replace with "amzn1.ask.skill.[your-unique-value-here]";
var APP_ID = undefined;

// Skills name
var skillName = "Oh, you gym rat. ";

// Message when the skill is first called
var welcomeMessage = "Alright, which day? ";

// Message for help intent
var HelpMessage = "Try saying: Tomorrow? What classes are there on this Tuesday?";

var UnhandledMessage = "Looks like I didn't quite get that. ";

var descriptionStateHelpMessage = "Here are some things you can say: Tell me about class one";

// Used when there is no data within a time period
var NoDataMessage = "Sorry there aren't any classes scheduled. Would you like to search again?";

// Used to tell user skill is closing
var shutdownMessage = "Ok see you again soon.";

// Message used when only 1 class is found allowing for difference in punctuation
var oneEventMessage = "There is 1 class ";

// Message used when more than 1 class is found allowing for difference in punctuation
var multipleEventMessage = "There are %d classes ";

// text used after the number of classes has been said
var scheduledEventMessage = "on %s. ";

var firstFiveMessage = "Here are the first %d. ";

// the values within the {} are swapped out for variables
var classSummary = "%s is at %s with %s. ";

// Only used for the card on the companion app
var cardContentSummary = "%s at %s with %s ";

// More info text
var haveClassesRepromt = "Give me an class name to hear more information.";

// Error if a date is out of range
var dateOutOfRange = "Date is out of range please choose another date";

// Error if a class number is out of range
var classOutOfRange = "Sorry. I didn't recognize the class name.";

// Used when an class is asked for
var descriptionMessage = "Description for %s: %s";

// Used when an class is asked for
var killSkillMessage = "Ok, great, see you next time.";

var classNumberMoreInfoText = "You can say the class name for more information.";

// used for title on companion app
var cardTitle = "Classes";

// output for Alexa
var output = "";

// stores classes that are found to be in our date range
var relevantClasses = new Array();

// Adding session handlers
var newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = states.SEARCHMODE;
        this.emit(':ask', skillName + " " + welcomeMessage, welcomeMessage);
    },
    "searchIntent": function()
    {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("searchIntent");
    },
    'Unhandled': function () {
        this.emit(':ask', HelpMessage, HelpMessage);
    },
};

// Create a new handler with a SEARCH state
var startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
    'AMAZON.YesIntent': function () {
        output = welcomeMessage;
        alexa.emit(':ask', output, welcomeMessage);
    },

    'AMAZON.NoIntent': function () {
        this.emit(':tell', shutdownMessage);
    },

    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', output, HelpMessage);
    },

    'searchIntent': function () {
        // Declare variables
        var classList = new Array();
        var slotValue = this.event.request.intent.slots.date.value;
        if (slotValue != undefined)
        {
            var parent = this;
            weekDates = getWeekDates();
            // Using the iCal library I pass the URL of where we want to get the data from.
            request
            .get('https://mico.myiclubonline.com/iclub/scheduling/classSchedule.htm?club='+gymID+'&lowDate='+weekDates[0]+'&highDate='+weekDates[1])
            .end(function(err, res){
              console.log("Number of classes retrieved" + res.body.length);

              var classList = res.body;
              for(var j = 0; j < classList.length; j ++){
                var instructorNames = classList[j].employeeName.split(' ');
                classList[j].instructor = instructorNames[0];
              }
                // Check we have data
                if (classList.length > 0) {
                    // Read slot data and parse out a usable date
                    var classDate = getDateFromSlot(slotValue);
                    // Check we have both a start and end date
                    if (classDate.startDate && classDate.endDate) {
                        // initiate a new array, and this time fill it with classes that fit between the two dates
                        relevantClasses = getClassesBeweenDates(classDate.startDate, classDate.endDate, classList);
                        // console.log(relevantClasses);

                        if (relevantClasses.length > 0) {
                            // change state to description
                            parent.handler.state = states.DESCRIPTION;

                            // Create output for both Alexa and the content card
                            var cardContent = "";
                            output = oneEventMessage;
                            if (relevantClasses.length > 1) {
                                output = utils.format(multipleEventMessage, relevantClasses.length);
                            }

                            output += utils.format(scheduledEventMessage, slotValue);

                            var numberToReadOut = relevantClasses.length > 5 ? 5 : relevantClasses.length;

                            if (relevantClasses.length > 1) {
                                output += utils.format(firstFiveMessage, numberToReadOut);
                            }

                            for(var m = 0; m < numberToReadOut; m++){
                              if (relevantClasses[m] != null) {
                                  output += utils.format(classSummary, relevantClasses[m].eventName, relevantClasses[m].eventStartTime, relevantClasses[m].instructor);
                              }
                            }
                            // if (relevantClasses[1]) {
                            //     output += utils.format(classSummary, "Second", relevantClasses[1].eventName, relevantClasses[1].eventStartTime, relevantClasses[1].instructor);
                            // }
                            //
                            // if (relevantClasses[2]) {
                            //     output += utils.format(classSummary, "Third", relevantClasses[2].eventName, relevantClasses[2].eventStartTime, relevantClasses[2].instructor);
                            // }

                            for (var i = 0; i < relevantClasses.length; i++) {
                                var date = new Date(relevantClasses[i].start);
                                cardContent += utils.format(cardContentSummary, relevantClasses[i].eventName, relevantClasses[i].eventStartTime, relevantClasses[i].instructor);
                            }

                            output += classNumberMoreInfoText;
                            alexa.emit(':askWithCard', output, haveClassesRepromt, cardTitle, cardContent);
                        } else {
                            output = NoDataMessage;
                            alexa.emit(':ask', output, output);
                        }
                    }
                    else {
                        output = NoDataMessage;
                        alexa.emit(':ask', output, output);
                    }
                } else {
                    output = NoDataMessage;
                    alexa.emit(':ask', output, output);
                }
            });
        }
        else {
            this.emit(":ask", "I'm sorry.  What day did you want me to look for classes?", "I'm sorry.  What day did you want me to look for classs?");
        }
    },

    'AMAZON.HelpIntent': function () {
        output = HelpMessage;
        this.emit(':ask', output, output);
    },

    'AMAZON.StopIntent': function () {
        this.emit(':tell', killSkillMessage);
    },

    'AMAZON.CancelIntent': function () {
        this.emit(':tell', killSkillMessage);
    },

    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },

    'Unhandled': function () {
        this.emit(':ask', HelpMessage, HelpMessage);
    }
});

// Create a new handler object for description state
var descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTION, {
    'classIntent': function () {

        var repromt = " Would you like to hear about another class?";
        var slotValue = this.event.request.intent.slots.className.value;
        // var slotValue = "Cycle";

        var availableClasses = new Array();
        for (var k = 0; k < relevantClasses.length; k++) {
          if (relevantClasses[k].eventName == slotValue) {
            availableClasses.push(relevantClasses[k]);
            console.log(slotValue);
          }
        }

        if(availableClasses.length > 0) {
          for(var j = 0; j < availableClasses.length; j ++){
            output += utils.format(descriptionMessage, availableClasses[j].eventName, availableClasses[j].eventDescription);
          }

          this.emit(':askWithCard', output, repromt, availableClasses[0].eventName, availableClasses[0].eventDescription);

        } else {
            this.emit(':tell', classOutOfRange);
        }
    },

    'AMAZON.HelpIntent': function () {
        this.emit(':ask', descriptionStateHelpMessage, descriptionStateHelpMessage);
    },

    'AMAZON.StopIntent': function () {
        this.emit(':tell', killSkillMessage);
    },

    'AMAZON.CancelIntent': function () {
        this.emit(':tell', killSkillMessage);
    },

    'AMAZON.NoIntent': function () {
        this.emit(':tell', shutdownMessage);
    },

    'AMAZON.YesIntent': function () {
        output = welcomeMessage;
        alexa.emit(':ask', classNumberMoreInfoText, classNumberMoreInfoText);
    },

    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },

    'Unhandled': function () {
        this.emit(':ask', HelpMessage, HelpMessage);
    }
});

// register handlers
exports.handler = function (event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(newSessionHandlers, startSearchHandlers, descriptionHandlers);
    alexa.execute();
};
//======== HELPER FUNCTIONS ==============

// Remove HTML tags from string
function removeTags(str) {
    if (str) {
        return str.replace(/<(?:.|\n)*?>/gm, '');
    }
}

// Given an AMAZON.DATE slot value parse out to usable JavaScript Date object
// Utterances that map to the weekend for a specific week (such as �this weekend�) convert to a date indicating the week number and weekend: 2015-W49-WE.
// Utterances that map to a month, but not a specific day (such as �next month�, or �December�) convert to a date with just the year and month: 2015-12.
// Utterances that map to a year (such as �next year�) convert to a date containing just the year: 2016.
// Utterances that map to a decade convert to a date indicating the decade: 201X.
// Utterances that map to a season (such as �next winter�) convert to a date with the year and a season indicator: winter: WI, spring: SP, summer: SU, fall: FA)
function getDateFromSlot(rawDate) {
    // try to parse data
    var date = new Date(Date.parse(rawDate));
    var result;
    // create an empty object to use later
    var classDate = {

    };

    // if could not parse data must be one of the other formats
    if (isNaN(date)) {
        // to find out what type of date this is, we can split it and count how many parts we have see comments above.
        var res = rawDate.split("-");
        // if we have 2 bits that include a 'W' week number
        if (res.length === 2 && res[1].indexOf('W') > -1) {
            var dates = getWeekData(res);
            classDate["startDate"] = new Date(dates.startDate);
            classDate["endDate"] = new Date(dates.endDate);
            // if we have 3 bits, we could either have a valid date (which would have parsed already) or a weekend
        } else if (res.length === 3) {
            var dates = getWeekendData(res);
            classDate["startDate"] = new Date(dates.startDate);
            classDate["endDate"] = new Date(dates.endDate);
            // anything else would be out of range for this skill
        } else {
            classDate["error"] = dateOutOfRange;
        }
        // original slot value was parsed correctly
    } else {
        classDate["startDate"] = new Date(date).setUTCHours(0, 0, 0, 0);
        classDate["endDate"] = new Date(date).setUTCHours(24, 0, 0, 0);
    }
    return classDate;
}

// Given a week number return the dates for both weekend days
function getWeekendData(res) {
    if (res.length === 3) {
        var saturdayIndex = 5;
        var sundayIndex = 6;
        var weekNumber = res[1].substring(1);

        var weekStart = w2date(res[0], weekNumber, saturdayIndex);
        var weekEnd = w2date(res[0], weekNumber, sundayIndex);

        return Dates = {
            startDate: weekStart,
            endDate: weekEnd,
        };
    }
}

// Given a week number return the dates for both the start date and the end date
function getWeekData(res) {
    if (res.length === 2) {

        var mondayIndex = 0;
        var sundayIndex = 6;

        var weekNumber = res[1].substring(1);

        var weekStart = w2date(res[0], weekNumber, mondayIndex);
        var weekEnd = w2date(res[0], weekNumber, sundayIndex);

        return Dates = {
            startDate: weekStart,
            endDate: weekEnd,
        };
    }
}

// Used to work out the dates given week numbers
var w2date = function (year, wn, dayNb) {
    var day = 86400000;

    var j10 = new Date(year, 0, 10, 12, 0, 0),
        j4 = new Date(year, 0, 4, 12, 0, 0),
        mon1 = j4.getTime() - j10.getDay() * day;
    return new Date(mon1 + ((wn - 1) * 7 + dayNb) * day);
};

// Loops though the classes from the iCal data, and checks which ones are between our start data and out end date
function getClassesBeweenDates(startDate, endDate, classList) {

    var start = new Date(startDate);
    var end = new Date(endDate);

    var data = new Array();

    for (var i = 0; i < classList.length; i++) {
      var classDateParts =classList[i].eventDate.split('/');
      //please put attention to the month (parts[0]), Javascript counts months from 0:
      // January - 0, February - 1, etc
      var classEventDate = new Date(classDateParts[2],classDateParts[0]-1,classDateParts[1]);

        if (start.getTime() <= classEventDate.getTime() && end.getTime() >= classEventDate.getTime()) {
            data.push(classList[i]);
        }
    }

    console.log("FOUND " + data.length + " classes between those times");
    return data;
}

function getWeekDates(){
  var curr = new Date; // get current date
  var first = curr.getDate(); // First day is the day of the month - the day of the week
  var last = first + 6; // last day is the first day + 6

  var firstday = new Date(curr.setDate(first));
  var lastday = new Date(curr.setDate(last));

  var firstdayURLString = urlStringifyDate(firstday);
  var lastdayURLString = urlStringifyDate(lastday);

  return [firstdayURLString, lastdayURLString];
}

function urlStringifyDate(dateObj){
  var month = '';
  if((dateObj.getMonth()+1) < 10){
    month = '0'+ (dateObj.getMonth()+1);
  } else {
    month = (dateObj.getMonth()+1)
  }

  var dayOfMonth = '';
  if (dateObj.getDate() < 10){
    dayOfMonth = '0' + dateObj.getDate();
  } else {
    dayOfMonth = dateObj.getDate();
  }
  return month+'%2F'+dayOfMonth+'%2F'+dateObj.getFullYear();

}
