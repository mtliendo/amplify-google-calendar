# AWS Amplify with Google Calendar Integration

I created this project in Bolt. It's full complete with mock data.

My task is to setup AWS Amplify with Google Calendar so that it pulls from my actual calendar. I should be able to list all of the events I have for the day and activate/deactivate a session with google.

Three key parts of this setup:

1. A user created in the database upon signup
2. State is used to verify the user across domains
3. A lambda function url is used as the redirect uri for the oauth callback

I looked over the ![API docs](https://developers.google.com/workspace/calendar/api/quickstart/nodejs) and they seem straightforward. I'll use ChatGPT to create my fetcher function.

## Beginning Steps

1. I ran `npm i` to get my dependencies installed.
2. I deleted the `.bolt` folder since it's not longer needed
3. I ran `npm audit --fix` since some deps were out of date
4. I ran the app with `npm run dev` and verified everything worked
5. I commited my code and published to github
6. I initialized my app with Amplify: `npm create amplify@latest` and accepted all the defaults

## Initial Development

I know I need to setup my datamodel, and auth strategy. Once done, I can configure my Lambda functions to make the appropriate calls.

### Auth (Cognito)

The standard email/pw auth that comes with Amplify is fine for this app. I'll leave it alone

### API (AppSync)

I want to save the `accessToken` and `refreshToken` in my database along with when the accessToken expires.

Because the user initiates the oauth flow on my site and continues it on another site, I want to store the oauth state in my database so I can make sure the user is the same throughout. Because this is short-lived, I'll put it in DynamoDB with a ttl. This is shown in the `amplify/backend.ts` file.

### Business Logic (Lambda)
