import { defineFunction } from '@aws-amplify/backend'

export const postConfirmation = defineFunction({
	name: 'oauth2-post-confirmation',
	resourceGroupName: 'auth',
	entry: './main.ts',
	runtime: 22,
})
