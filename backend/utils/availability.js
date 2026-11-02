//STUB until Lala's L2 is merged.
//Agreed signature: checkAvailability(campgroundId, checkInDate, nights, excludeBookingId?)
//  -> { available: boolean, remaining: number }
//Replace the body with the real per-night capacity check; callers don't need to change.
exports.checkAvailability = async (campgroundId, checkInDate, nights, excludeBookingId) => {
    return { available: true, remaining: Infinity };
};
