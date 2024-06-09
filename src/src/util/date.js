export function getDateTodayTs(offsetMs) {
    const ts = new Date().getTime();
    return ts - (ts % (24 * 3600 * 1000)) + (offsetMs || 0);
}