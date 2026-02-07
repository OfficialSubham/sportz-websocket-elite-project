import { MATCH_STATUS } from "../validations/matches.js";

export const getMatchStatus = (startTime, endTime, now = new Date()) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    if (now < start) {
        return MATCH_STATUS.SCHEDULED;
    } else if (now >= end) return MATCH_STATUS.FINISHED;

    return MATCH_STATUS.LIVE;
};

//Here i am syncing my match status with db
export const syncMatchStatus = async (match, updateStatus) => {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);

    if (!nextStatus) return match.status;

    if (match.status != nextStatus) {
        await updateStatus(nextStatus);
        match.status = nextStatus;
    }
};
