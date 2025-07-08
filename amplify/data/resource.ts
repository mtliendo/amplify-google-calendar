import { type ClientSchema, a, defineData } from '@aws-amplify/backend'
import { postConfirmation } from '../functions/postConfirmation/resource'

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
		SupportedProviders: a.enum(['google']), //* Which providers are supported
		generateOauthAuthorizationUrl: a
			.mutation()
			.handler(a.handler.function(generateOauthAuthorizationUrl))
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
		disconnectFromOauth: a
			.mutation()
			.handler(a.handler.function(disconnectFromOauth))
			.arguments({
				userId: a.string().required(),
				provider: a.ref('SupportedProviders').required(),
			})
			.returns(a.customType({ success: a.boolean(), message: a.string() }))
			.authorization((allow) => [allow.authenticated()]),

		//! Provider specific functions //
		fetchCalendarEvents: a
			.query()
			.handler(a.handler.function(fetchCalendarEvents))
			.arguments({
				userId: a.string().required(),
				provider: a.ref('SupportedProviders'),
			})
			.returns(a.customType({ events: a.string() })),
	})
	.authorization((allow) => [
		allow.resource(postConfirmation).to(['mutate']), // adds user to db
		allow.resource(generateOauthAuthorizationUrl).to(['mutate']), // creates oauth state in db
		allow.resource(oauthCallback).to(['mutate', 'query']), // lambda furl. lists tokens from db. updates tokens in db if expired
		allow.resource(disconnectFromOauth).to(['mutate', 'query']), // removes tokens from db
		allow.resource(fetchCalendarEvents).to(['mutate', 'query']), // fetch user from db. updates tokens in db if expired
	])

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
	name: 'googleCalendar',
	schema,
	authorizationModes: {
		defaultAuthorizationMode: 'userPool',
	},
})
