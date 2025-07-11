import { type ClientSchema, a, defineData } from '@aws-amplify/backend'
import { postConfirmation } from '../functions/postConfirmation/resource'
import { generateGoogleOauthAuthorizationUrl } from '../functions/google/generate-authorization-url/resource'
import { disconnectFromGoogleOauth } from '../functions/google/disconnect/resource'
import { googleOauthCallback } from '../functions/google/callback/resource'
import { listGoogleCalendarEvents } from '../functions/google/listGoogleCalendarEvents/resource'

const schema = a
	.schema({
		User: a
			.model({
				email: a.email().required(),
				owner: a
					.string()
					.required()
					.authorization((allow) => [allow.owner().to(['read'])]),
				providers: a.ref('Providers'),
			})
			.authorization((allow) => [allow.owner()]),
		Providers: a.customType({
			//* The providers that the user has connected (providers are configured in the providerConfig.ts file)
			google: a.customType({
				oauth: a.ref('OauthBase'),
			}),
		}),
		OauthBase: a.customType({
			accessToken: a.string(),
			refreshToken: a.string(),
			scope: a.string(),
			expiresAt: a.integer(),
		}),
		GoogleEvent: a.customType({
			id: a.string(),
			summary: a.string(),
			description: a.string(),
			startTime: a.string(),
			endTime: a.string(),
		}),
		SupportedProviders: a.enum(['google']), //* Which providers are supported
		generateOauthAuthorizationUrl: a
			.mutation()
			.handler(a.handler.function(generateGoogleOauthAuthorizationUrl))
			.arguments({
				userId: a.string().required(),
				provider: a.ref('SupportedProviders'),
			})
			.returns(a.customType({ authorizationUrl: a.url() }))
			.authorization((allow) => [allow.authenticated()]),
		OAuthState: a
			.model({
				userId: a.string().required(), // user id from cognito. Needed to fetch state
				state: a.string().required(), // 'random-id::user-id::provider-name'
				ttl: a.integer().required(), // tell dynamodb to delete this item after this time
			})
			.authorization((allow) => [allow.group('NONE')]) // called on the backend.
			.secondaryIndexes((index) => [index('userId')]),
		disconnectFromGoogleOauth: a
			.mutation()
			.handler(a.handler.function(disconnectFromGoogleOauth))
			.arguments({
				userId: a.string().required(),
			})
			.returns(a.customType({ success: a.boolean(), message: a.string() }))
			.authorization((allow) => [allow.authenticated()]),

		//! Provider specific functions //
		listGoogleCalendarEvents: a
			.query()
			.handler(a.handler.function(listGoogleCalendarEvents))
			.arguments({
				userIdInDb: a.string().required(),
				timeMin: a.string().required(),
				timeMax: a.string().required(),
			})
			.returns(
				a.customType({
					events: a.ref('GoogleEvent').array(),
					error: a.string(),
				})
			)
			.authorization((allow) => [allow.authenticated()]),
	})
	.authorization((allow) => [
		allow.resource(postConfirmation).to(['mutate']), // adds user to db
		allow.resource(generateGoogleOauthAuthorizationUrl).to(['mutate']), // creates oauth state in db
		allow.resource(googleOauthCallback).to(['mutate', 'query']), // lambda furl. lists tokens from db. updates tokens in db if expired
		allow.resource(disconnectFromGoogleOauth).to(['mutate', 'query']), // removes tokens from db
		allow.resource(listGoogleCalendarEvents).to(['query', 'mutate']), // fetch user from db. updates tokens in db if expired
	])

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
	name: 'googleCalendar',
	schema,
	authorizationModes: {
		defaultAuthorizationMode: 'userPool',
	},
})

// todo: authorize from frontend
// todo: deauthorize from frontend
// todo: authorize from frontend
// todo: list calendar events from frontend
// todo: let an hour go by, list calendar events again and see if the token is refreshed
