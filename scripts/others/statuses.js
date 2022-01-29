//Spark's Status Effect
const overshocked = extend(StatusEffect, "overshocked", {
    color: Pal.lancerLaser,
    healthMultiplier: 0.7,
    speedMultiplier: 0.3,
    reloadMultiplier: 0.85,
});

module.exports = {
    SE1: overshocked,
};