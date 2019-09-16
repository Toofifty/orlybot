/**
 * Throw a user error
 */
export const error = (msg: string) => {
    throw new UserError(msg);
};

/**
 * An error that can be shown to the user via Slack
 * created for validation errors etc rather than
 * runtime errors and crashes
 */
export default class UserError extends Error {}
