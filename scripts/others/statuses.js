//Spark's Status Effect
const overshocked = extend(StatusEffect, "overshocked", {
    color: Pal.lancerLaser,
    healthMultiplier: 0.65,
    speedMultiplier: 0.9,
    appliedStatus: StatusEffects.shocked,
    appliedStatusDuration: 30,
    TickPerStatus: 24, 

    setStats(){
        this.super$setStats();
        
        this.stats.add(Stat.affinities, "Applies " + this.appliedStatus.emoji() + "[accent]" + this.appliedStatus.toString() + "[] every " +  this.TickPerStatus / 60 + " seconds")
    },

    timer: 0,
    update(unit, time){
        this.super$update(unit, time);
        this.timer += 1;

        if(this.timer >= this.TickPerStatus){
            unit.apply(this.appliedStatus, this.appliedStatusDuration);
            this.timer = 0;
        }
    }
    
});

module.exports = {
    SE1: overshocked,
};