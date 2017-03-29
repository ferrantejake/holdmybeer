// Create a new token
export function create(characterSet?: string, length?: number) {
    // We will assume in the general case that tokens being created
    // are authorization tokens. For this reason, the parameters are
    // optional as we can make global constants to address tis commonality.
}

// Whitelist a new token + user.
export function whitelist() {
    // Takes in a user and token record (must already be created so we know
    // we will not run into a conflict) and adds the user to the token context.
}