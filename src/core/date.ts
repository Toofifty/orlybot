/**
 * Get a date with application timezone instead of system
 */
export const dateTZ = (data?: string | number | Date, tz?: string) => {
    const date = data ? new Date(data) : new Date();
    const target = new Date(
        date.toLocaleString('en-US', {
            timeZone: tz || process.env.TIMEZONE || 'UTC',
        })
    );
    return new Date(date.getTime() + (date.getTime() - target.getTime()));
};
