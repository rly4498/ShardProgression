//Spark's Status Effect
const overshocked = extend(StatusEffect, "overshocked", {
    color: Pal.lancerLaser,
    healthMultiplier: 0.65,
    speedMultiplier: 0.9,
    appliedStatus: StatusEffects.shocked,
    appliedStatusDuration: 30,
    statusPerTick: 24, //could be named better

    update(unit, time){
        this.super$update(unit, time);
        let fTime = time >= 10 ? parseFloat(time.toFixed(3)) : parseFloat(time.toFixed(2));

        if(fTime % this.statusPerTick == 0){
            unit.apply(this.appliedStatus, this.appliedStatusDuration);
        }
    }
    
});

module.exports = {
    SE1: overshocked,
};