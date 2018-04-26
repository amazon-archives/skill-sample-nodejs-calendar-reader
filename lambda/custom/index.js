const Alexa = require('alexa-sdk');
const ical = require('ical');
const utils = require('util');

const states = {
    SEARCHMODE: '_SEARCHMODE',
    DESCRIPTION: '_DESKMODE',
};
// local variable holding reference to the Alexa SDK object
let alexa;

//OPTIONAL: replace with "amzn1.ask.skill.[your-unique-value-here]";
let APP_ID = undefined;

// URL to get the .ics from, in this instance we are getting from Stanford however this can be changed
const URL = "http://events.stanford.edu/eventlist.ics";

// Skills name
const skillName = "Events calendar:";

// Message when the skill is first called
const welcomeMessage = "You can ask for the events today. Search for events by date. or say help. What would you like? ";

// Message for help intent
const HelpMessage = "Here are some things you can say: Get me events for today. Tell me whats happening on the 18th of July. What events are happening next week? Get me stuff happening tomorrow. ";

const descriptionStateHelpMessage = "Here are some things you can say: Tell me about event one";

// Used when there is no data within a time period
const NoDataMessage = "Sorry there aren't any events scheduled. Would you like to search again?";

// Used to tell user skill is closing
const shutdownMessage = "Ok see you again soon.";

// Message used when only 1 event is found allowing for difference in punctuation
const oneEventMessage = "There is 1 event ";

// Message used when more than 1 event is found allowing for difference in punctuation
const multipleEventMessage = "There are %d events ";

// text used after the number of events has been said
const scheduledEventMessage = "scheduled for this time frame. I've sent the details to your Alexa app: ";

const firstThreeMessage = "Here are the first %d. ";

// the values within the {} are swapped out for variables
const eventSummary = "The %s event is, %s at %s on %s ";

// Only used for the card on the companion app
const cardContentSummary = "%s at %s on %s ";

// More info text
const haveEventsreprompt = "Give me an event number to hear more information.";

// Error if a date is out of range
const dateOutOfRange = "Date is out of range please choose another date";

// Error if a event number is out of range
const eventOutOfRange = "Event number is out of range please choose another event";

// Used when an event is asked for
const descriptionMessage = "Here's the description ";

// Used when an event is asked for
const killSkillMessage = "Ok, great, see you next time.";

const eventNumberMoreInfoText = "For more information on a specific event number, try saying: what's event one?";

// used for title on companion app
const cardTitle = "Events";

// output for Alexa
let output = "";

// stores events that are found to be in our date range
let relevantEvents = new Array();

// Adding session handlers
const newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = states.SEARCHMODE;
        this.response.speak(skillName + " " + welcomeMessage).listen(welcomeMessage);
        this.emit(':responseReady');
    },
    "searchIntent": function()
    {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("searchIntent");
    },
    'Unhandled': function () {
        this.response.speak(HelpMessage).listen(HelpMessage);
        this.emit(':responseReady');
    },
};

// Create a new handler with a SEARCH state
const startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
    'AMAZON.YesIntent': function () {
        output = welcomeMessage;
        alexa.response.speak(output).listen(welcomeMessage);
        this.emit(':responseReady');
    },

    'AMAZON.NoIntent': function () {
        this.response.speak(shutdownMessage);
        this.emit(':responseReady');
    },

    'AMAZON.RepeatIntent': function () {
        this.response.speak(output).listen(HelpMessage);
    },

    'searchIntent': function () {
        // Declare variables
        let eventList = new Array();
        const slotValue = this.event.request.intent.slots.date.value;
        if (slotValue != undefined)
        {
            let parent = this;

            // Using the iCal library I pass the URL of where we want to get the data from.
            ical.fromURL(URL, {}, function (error, data) {
                // Loop through all iCal data found
                for (let k in data) {
                    if (data.hasOwnProperty(k)) {
                        let ev = data[k];
                        // Pick out the data relevant to us and create an object to hold it.
                        let eventData = {
                            summary: removeTags(ev.summary),
                            location: removeTags(ev.location),
                            description: removeTags(ev.description),
                            start: ev.start
                        };
                        // add the newly created object to an array for use later.
                        eventList.push(eventData);
                    }
                }
                // Check we have data
                if (eventList.length > 0) {
                    // Read slot data and parse out a usable date
                    const eventDate = getDateFromSlot(slotValue);
                    // Check we have both a start and end date
                    if (eventDate.startDate && eventDate.endDate) {
                        // initiate a new array, and this time fill it with events that fit between the two dates
                        relevantEvents = getEventsBeweenDates(eventDate.startDate, eventDate.endDate, eventList);

                        if (relevantEvents.length > 0) {
                            // change state to description
                            parent.handler.state = states.DESCRIPTION;

                            // Create output for both Alexa and the content card
                            let cardContent = "";
                            output = oneEventMessage;
                            if (relevantEvents.length > 1) {
                                output = utils.format(multipleEventMessage, relevantEvents.length);
                            }

                            output += scheduledEventMessage;

                            if (relevantEvents.length > 1) {
                                output += utils.format(firstThreeMessage, relevantEvents.length > 3 ? 3 : relevantEvents.length);
                            }

                            if (relevantEvents[0] != null) {
                                let date = new Date(relevantEvents[0].start);
                                output += utils.format(eventSummary, "First", removeTags(relevantEvents[0].summary), relevantEvents[0].location, date.toDateString() + ".");
                            }
                            if (relevantEvents[1]) {
                                let date = new Date(relevantEvents[1].start);
                                output += utils.format(eventSummary, "Second", removeTags(relevantEvents[1].summary), relevantEvents[1].location, date.toDateString() + ".");
                            }
                            if (relevantEvents[2]) {
                                let date = new Date(relevantEvents[2].start);
                                output += utils.format(eventSummary, "Third", removeTags(relevantEvents[2].summary), relevantEvents[2].location, date.toDateString() + ".");
                            }

                            for (let i = 0; i < relevantEvents.length; i++) {
                                let date = new Date(relevantEvents[i].start);
                                cardContent += utils.format(cardContentSummary, removeTags(relevantEvents[i].summary), removeTags(relevantEvents[i].location), date.toDateString()+ "\n\n");
                            }

                            output += eventNumberMoreInfoText;
                            alexa.response.cardRenderer(cardTitle, cardContent);
                            alexa.response.speak(output).listen(haveEventsreprompt);
                        } else {
                            output = NoDataMessage;
                            alexa.emit(output).listen(output);
                        }
                    }
                    else {
                        output = NoDataMessage;
                        alexa.emit(output).listen(output);
                    }
                } else {
                    output = NoDataMessage;
                    alexa.emit(output).listen(output);
                }
            });
        }
        else{
            this.response.speak("I'm sorry.  What day did you want me to look for events?").listen("I'm sorry.  What day did you want me to look for events?");
        }

        this.emit(':responseReady');
    },

    'AMAZON.HelpIntent': function () {
        output = HelpMessage;
        this.response.speak(output).listen(output);
        this.emit(':responseReady');
    },

    'AMAZON.StopIntent': function () {
        this.response.speak(killSkillMessage);
    },

    'AMAZON.CancelIntent': function () {
        this.response.speak(killSkillMessage);
    },

    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },

    'Unhandled': function () {
        this.response.speak(HelpMessage).listen(HelpMessage);
        this.emit(':responseReady');
    }
});

// Create a new handler object for description state
const descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTION, {
    'eventIntent': function () {

        const reprompt = " Would you like to hear another event?";
        let slotValue = this.event.request.intent.slots.number.value;

        // parse slot value
        const index = parseInt(slotValue, 10) - 1;

        if (relevantEvents[index]) {

            // use the slot value as an index to retrieve description from our relevant array
            output = descriptionMessage + removeTags(relevantEvents[index].description);

            output += reprompt;

            this.response.cardRenderer(relevantEvents[index].summary, output);
            this.response.speak(output).listen(reprompt);
        } else {
            this.response.speak(eventOutOfRange).listen(welcomeMessage);
        }

        this.emit(':responseReady');
    },

    'AMAZON.HelpIntent': function () {
        this.response.speak(descriptionStateHelpMessage).listen(descriptionStateHelpMessage);
        this.emit(':responseReady');
    },

    'AMAZON.StopIntent': function () {
        this.response.speak(killSkillMessage);
        this.emit(':responseReady');
    },

    'AMAZON.CancelIntent': function () {
        this.response.speak(killSkillMessage);
        this.emit(':responseReady');
    },

    'AMAZON.NoIntent': function () {
        this.response.speak(shutdownMessage);
        this.emit(':responseReady');
    },

    'AMAZON.YesIntent': function () {
        output = welcomeMessage;
        alexa.response.speak(eventNumberMoreInfoText).listen(eventNumberMoreInfoText);
        this.emit(':responseReady');
    },

    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },

    'Unhandled': function () {
        this.response.speak(HelpMessage).listen(HelpMessage);
        this.emit(':responseReady');
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
    let date = new Date(Date.parse(rawDate));
    // create an empty object to use later
    let eventDate = {

    };

    // if could not parse data must be one of the other formats
    if (isNaN(date)) {
        // to find out what type of date this is, we can split it and count how many parts we have see comments above.
        const res = rawDate.split("-");
        // if we have 2 bits that include a 'W' week number
        if (res.length === 2 && res[1].indexOf('W') > -1) {
            let dates = getWeekData(res);
            eventDate["startDate"] = new Date(dates.startDate);
            eventDate["endDate"] = new Date(dates.endDate);
            // if we have 3 bits, we could either have a valid date (which would have parsed already) or a weekend
        } else if (res.length === 3) {
            let dates = getWeekendData(res);
            eventDate["startDate"] = new Date(dates.startDate);
            eventDate["endDate"] = new Date(dates.endDate);
            // anything else would be out of range for this skill
        } else {
            eventDate["error"] = dateOutOfRange;
        }
        // original slot value was parsed correctly
    } else {
        eventDate["startDate"] = new Date(date).setUTCHours(0, 0, 0, 0);
        eventDate["endDate"] = new Date(date).setUTCHours(24, 0, 0, 0);
    }
    return eventDate;
}

// Given a week number return the dates for both weekend days
function getWeekendData(res) {
    if (res.length === 3) {
        const saturdayIndex = 5;
        const sundayIndex = 6;
        const weekNumber = res[1].substring(1);

        const weekStart = w2date(res[0], weekNumber, saturdayIndex);
        const weekEnd = w2date(res[0], weekNumber, sundayIndex);

        return {
            startDate: weekStart,
            endDate: weekEnd,
        };
    }
}

// Given a week number return the dates for both the start date and the end date
function getWeekData(res) {
    if (res.length === 2) {

        const mondayIndex = 0;
        const sundayIndex = 6;

        const weekNumber = res[1].substring(1);

        const weekStart = w2date(res[0], weekNumber, mondayIndex);
        const weekEnd = w2date(res[0], weekNumber, sundayIndex);

        return {
            startDate: weekStart,
            endDate: weekEnd,
        };
    }
}

// Used to work out the dates given week numbers
const w2date = function (year, wn, dayNb) {
    const day = 86400000;

    const j10 = new Date(year, 0, 10, 12, 0, 0),
        j4 = new Date(year, 0, 4, 12, 0, 0),
        mon1 = j4.getTime() - j10.getDay() * day;
    return new Date(mon1 + ((wn - 1) * 7 + dayNb) * day);
};

// Loops though the events from the iCal data, and checks which ones are between our start data and out end date
function getEventsBeweenDates(startDate, endDate, eventList) {

    const start = new Date(startDate);
    const end = new Date(endDate);

    let data = new Array();

    for (let i = 0; i < eventList.length; i++) {
        if (start <= eventList[i].start && end >= eventList[i].start) {
            data.push(eventList[i]);
        }
    }

    console.log("FOUND " + data.length + " events between those times");
    return data;
}
