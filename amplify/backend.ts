import { postConfirmation } from './functions/postConfirmation/resource'
import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'

const backend = defineBackend({
	auth,
	data,
	postConfirmation,
})

const cfnOauthStateTable =
	backend.data.resources.cfnResources.amplifyDynamoDbTables['OAuthState']

cfnOauthStateTable.timeToLiveAttribute = {
	attributeName: 'ttl',
	enabled: true,
}
