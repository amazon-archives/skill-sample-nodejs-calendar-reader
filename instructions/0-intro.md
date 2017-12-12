# Build A Calendar Reader Skill
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/fact/header._TTH_.png" />

[![Voice User Interface](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/navigation/1-off._TTH_.png)](1-voice-user-interface.md)[![Lambda Function](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/navigation/2-off._TTH_.png)](2-lambda-function.md)[![Connect VUI to Code](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/navigation/3-off._TTH_.png)](3-connect-vui-to-code.md)[![Testing](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/navigation/4-off._TTH_.png)](4-testing.md)[![Customization](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/navigation/5-off._TTH_.png)](5-customization.md)[![Publication](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/navigation/6-off._TTH_.png)](6-publication.md)

# How to Build a Calendar Reader for Alexa

To introduce another way to help you build useful and meaningful skills for Alexa quickly, we’ve launched a calendar reader skill template. This new Alexa skill template makes it easy for developers to create a skill like an “Event Calendar,” or “Community Calendar,” etc. The template leverages [AWS Lambda](https://aws.amazon.com/lambda/), the [Alexa Skills Kit (ASK)](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit), and the [Alexa SDK for Node.js](https://developer.amazon.com/public/community/post/Tx213D2XQIYH864/Announcing-the-Alexa-Skills-Kit-for-Node-js), while providing the business logic, use cases, error handling and help functions for your skill.

For this tutorial, we'll be working with the calendar from Stanford University.  The user of this skill will be able to ask things like:

   * "What is happening tonight?
   * "What events are going on next Monday?"
   * "Tell me more about the second event."

You will be able to plug your own public calendar feed (an .ICS file) into the sample provided, so that you can interact with your calendar in the same way. This could be useful for small businesses, community leaders, event planners, realtors, or anyone that wants to share a calendar with their audience.

Using the [Alexa Skills Kit](https://developer.amazon.com/alexa-skills-kit), you can build an application that can receive and respond to voice requests made on the Alexa service. In this tutorial, you’ll build a web service to handle requests from Alexa and map this service to a skill in the Amazon Developer Portal, making it available on your device and to all Alexa users after certification.

After completing this tutorial, you'll know how to do the following:

   * Create a calendar reader skill - This tutorial will walk first-time Alexa skills developers through all the required steps involved in creating a skill that reads calendar data, called "Stanford Calendar".
   * Understand the basics of VUI design - Creating this skill will help you understand the basics of creating a working Voice User Interface (VUI) while using a cut/paste approach to development. You will learn by doing, and end up with a published Alexa skill. This tutorial includes instructions on how to customize the skill and submit for certification. For guidance on designing a voice experience with Alexa you can also [watch this video](https://goto.webcasts.com/starthere.jsp?ei=1087592).
   * Use JavaScript/Node.js and the Alexa Skills Kit to create a skill - You will use the template as a guide but the customization is up to you. For more background information on using the Alexa Skills Kit please [watch this video](https://goto.webcasts.com/starthere.jsp?ei=1087595).
   * Get your skill published - Once you have completed your skill, this tutorial will guide you through testing your skill and sending your skill through the certification processso it can be enabled by any Alexa user.
   * Interact with a calendar (.ics file) using voice commands.

<a href="1-voice-user-interface.md"><img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/buttons/button_get_started._TTH_.png" /></a>

<img height="1" width="1" src="https://www.facebook.com/tr?id=1847448698846169&ev=PageView&noscript=1"/>
