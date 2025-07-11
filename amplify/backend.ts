import { postConfirmation } from './functions/postConfirmation/resource'
import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { googleOauthCallback } from './functions/google/callback/resource'
import { generateGoogleOauthAuthorizationUrl } from './functions/google/generate-authorization-url/resource'
import { disconnectFromGoogleOauth } from './functions/google/disconnect/resource'
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'
import { listGoogleCalendarEvents } from './functions/google/listGoogleCalendarEvents/resource'

const backend = defineBackend({
	auth,
	data,
	postConfirmation,
	googleOauthCallback,
	generateGoogleOauthAuthorizationUrl,
	disconnectFromGoogleOauth,
	listGoogleCalendarEvents,
})

const cfnOauthStateTable =
	backend.data.resources.cfnResources.amplifyDynamoDbTables['OAuthState']

cfnOauthStateTable.timeToLiveAttribute = {
	attributeName: 'ttl',
	enabled: true,
}

const googleOauthCallbackLambda = backend.googleOauthCallback.resources.lambda

const lambdafUrl = googleOauthCallbackLambda.addFunctionUrl({
	authType: FunctionUrlAuthType.NONE,
})

backend.addOutput({
	custom: {
		oauthCallbackUrl: lambdafUrl.url,
	},
})
