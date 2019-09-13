export const error = msg => {
    throw new UserError(msg)
}

export default class UserError extends Error { }
