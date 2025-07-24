/**
 * This function is used to generate a random state and ttl for the oauth state and save it to the database
 * It is used to generate the url to the provider oauth page
 * It is modular and can be used for any provider
 * Each item in the database will only live for 5 minutes as determined by the ttl
 * @param userId - The user id of the user in the database, not the cognito user id
 * @param provider - The provider to generate the oauth state for (google, etc)
 * @returns The state and ttl for the oauth state
 */
export const generateOauthState = (userId: string, provider: string) => {
	const state = crypto.randomUUID() + '::' + userId + '::' + provider

	const unixEpochSeconds = Math.floor(Date.now() / 1000)
	const ttl = 60 * 5 + unixEpochSeconds // 5 minutes from now in seconds (unix timestamp)

	return { state, ttl }
}
