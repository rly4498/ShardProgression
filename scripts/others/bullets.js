//Spark's bullet
const sparkChargeBegin = new Effect(61, e => {
  Draw.color(Pal.lancerLaser);
  Fill.circle(e.x, e.y, e.fin() * 8);
  
  Draw.color(Color.white);
  Fill.circle(e.x, e.y, e.fin() * 5.4);
});

const sparkCharge = new Effect(15, e => {
  Draw.color(Color.white, Pal.lancerLaser, e.fin());
  Draw.z(108);
  
  Lines.stroke(e.fout() * 1.3);
  Angles.randLenVectors(e.id, 1, 11.5, e.rotation, 200, (x, y) => {
    Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), 3.1);
  });
  Angles.randLenVectors(e.id, 1, 10, e.rotation, 200, (x, y) => {
    Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), 3.1); 
  });
});

const orbShoot = new Effect(16, e => {
  Draw.color(Color.white, Pal.lancerLaser, e.fin());
  Lines.stroke(e.fout() * 1.1 + 0.5);
  Lines.circle(e.x, e.y, e.fin() * 14);
  
  e.scaled(3, s => {
    staticShoot.at(e.x, e.y, e.rotation);
  });
});

const staticShoot = new Effect(16, e => {
  Draw.color(Color.white, Pal.lancerLaser, e.fin());
  Lines.stroke(e.fout() * 1.2 + 0.5);
  
  Angles.randLenVectors(e.id, 4, e.finpow() * 25, e.rotation, 250, (x, y) => { 
    Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), e.fin() * 2 + 3.2);
  });
});


const arcTrail = new Effect(12, e => {
  Draw.color(Color.white, Pal.lancerLaser, e.fin());
  Lines.stroke(e.fout() * 1.2 + 0.5);
  
  Angles.randLenVectors(e.id, 1, e.finpow() * 25, e.rotation, 180, (x, y) => { 
    Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), e.fin() * 5 + 2);
  });
});

/*const orbHit = new Effect(18, e => {
  Draw.color(Color.white, Pal.lancerLaser, e.fin());

  e.scaled(16, s => {
    Lines.stroke(s.fout() + 1.2);
    Lines.circle(e.x, e.y, s.fin() * 44);
  });

  Lines.stroke(e.fout() * 1.5 + 0.5);
  Angles.randLenVectors(e.id, 8, e.finpow() * 44, (x, y) => {
    Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), e.fin() * 7 + 2);
  });
});*/

let radius = 65;
const orbHit = new Effect(40, 100, e => {
  e.scaled(10, b => {
    Draw.color(Color.white, b.fout());
    Fill.circle(e.x, e.y, radius * b.fin());
  });
 
 e.scaled(24, c => {
   Draw.color(Pal.lancerLaser, Color.white, c.fin());
  Lines.stroke(12 * c.fout());
  Lines.circle(e.x, e.y, radius * c.fin());
  let points = 10;
  let offset = Mathf.randomSeed(e.id, 360);
  for(let i = 0; i < points; i++){
    let angle = i* 360 / points + offset;
    let height = Mathf.randomSeed(i * 2, points * 3, 75);
    Drawf.tri(e.x  + Angles.trnsx(angle, radius * c.fin()), e.y  + Angles.trnsy(angle, radius * c.fin()), 6, height * e.fout()  * c.fin(), angle);
  }
});

  Draw.color();
  Fill.circle(e.x, e.y, 6 * e.fout());
  Drawf.light(e.x, e.y, radius * 1.6, Pal.lancerLaser, e.fout());
});
 

const staticHit = new Effect(18, e => {
  Draw.color(Color.white, Pal.lancerLaser, e.fin());

  e.scaled(12, s => {
    Lines.stroke(2 * s.fout());
    Lines.circle(e.x, e.y, s.fin() * 12);
  });

  Lines.stroke(2 * e.fout());
  Angles.randLenVectors(e.id, 5, e.finpow() * 24, (x, y) => {
    Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), e.fin() * 4.5 + 1.2);
  });
});

const arcFrag3 = extend(LightningBulletType, {
  lightningDamage: 3,
  lightningLength: 3,
  lightningLengthRand: 1,
  lightningCone: 0
});

const plholder2 = extend(BulletType, {
  speed: 2.5,
  lifetime: 8,
  hittable: false,
  absorbable: false,
  reflectable: false,
  hitEffect: Fx.none,
  despawnEffect: Fx.none,
  
  damage: 0,
  fragCone: 0,
  fragBullets: 1,
  fragBullet: arcFrag3
});

const arcFrag2 = extend(LightningBulletType, {
  lightningDamage: 3,
  lightningLength: 5.5,
  lightningLengthRand: 1,
  lightningCone: 0,
  
  fragCone: 0,
  fragBullets: 1,
  fragBullet: plholder2
});

const plholder1 = extend(BulletType, {
  speed: 5,
  lifetime: 8,
  hittable: false,
  absorbable: false,
  reflectable: false,
  hitEffect: Fx.none,
  despawnEffect: Fx.none,
  
  damage: 0,
  fragCone: 0,
  fragBullets: 1,
  fragBullet: arcFrag2
});

const arcFrag1 = extend(LightningBulletType, {
  lightningDamage: 3,
  lightningLength: 8,
  lightningLengthRand: 1,
  lightningCone: 0,
  
  fragCone: 0,
  fragBullets: 1,
  fragBullet: plholder1
});

const staticBullet = extend(BasicBulletType, {
  modeName: "static-shot",
  reloadTime: 42,
  shootEffect: staticShoot,
  tEffects: [Fx.none, Fx.none, 0, 1.2, 1.2, 0.02, 0.02],
  barrelExtend: false,
  shots: 2,
  burstSpacing: 6,

  speed: 5,
  drag:  0.012,
  lifetime: 47,
  hitSize: 10.5,
  inaccuracy: 8.5,
  hittable: false,
  reflectable: false,
  
  damage: 40,
  status: StatusEffects.shocked,
  statusDuration: 6,
  fragBullets: 3,
  fragBullet: arcFrag1,


  sprite: "circle-bullet",
  frontColor: Color.white,
  backColor: Pal.lancerLaser,
  width: 10,
  height: 13,
  shrinkX: 0.145,
  shrinkY: 0.145,
  trailChance: 0.1,
  trailEffect: arcTrail,
  hitEffect: staticHit,
  despawnEffect: staticHit,
});

const overshocked = require("others/statuses").SE1;
//empn't
const orbBullet = extend(BasicBulletType, {
  modeName: "charge",
  reloadTime: 192,
  chargeTime: 60,
  chargeMaxDelay: 45,
  shootEffect: orbShoot,
  tEffects: [sparkChargeBegin, sparkCharge, 25, 3.2, 2, 0.0185, 0.0185],
  barrelExtend: true,
  
  speed: 3.25,
  lifetime: 68,
  scaleVelocity: true,
  despawnHit: true,
  hitSize: 24,
  hittable: false,
  reflectable: false,
  
  damage: 200,
  radius: radius,
  maxBuildingTarget: 20,
  status: overshocked,
  status2: StatusEffects.shocked,
  statusDuration: 18,
  statusDuration2: 30,
  timeIncrease: 0,
  timeDuration: 0,
  powerDamageScl: 1,
  powerSclDecrease: 1,
  
  sprite: "circle-bullet",
  frontColor: Color.white,
  backColor: Pal.lancerLaser,
  width: 18,
  height: 18,
  shrinkX: 0.165,
  shrinkY: 0.165,
  trailChance: 0.26,
  trailEffect: arcTrail,
  hitEffect: orbHit,
  hitPowerEffect: staticHit,
  chainEffect: Fx.chainEmp,

  hit(b, x, y){
    this.super$hit(b, b.x, b.y);
    if(!b.absorbed){
      let target = 0;
      Vars.indexer.allBuildings(b.x, b.y, this.radius, other => {
        if(other.team != b.team){
          target++;
          let damage = this.damage * this.buildingDamageMultiplier;
          if(target > this.maxBuildingTarget) damage = damage - (target * (target / 2) * this.buildingDamageMultiplier * damage);
          let absorber = Damage.findAbsorber(b.team, b.x, b.y, other.x, other.y);
          if(absorber != null) other = absorber;

          other.damage(damage <= 0 ? 0 : damage);
          this.hitPowerEffect.at(other.x, other.y, b.angleTo(other), this.hitColor);
          this.chainEffect.at(b.x, b.y, 0, this.hitColor, other);
        }
      });

      Units.nearbyEnemies(b.team, b.x, b.y, this.radius, other => {
        if(other.team != b.team){
          let absorber = Damage.findAbsorber(b.team, b.x, b.y, other.x, other.y);
          if(absorber != null) return;

          other.damage(this.damage);
          other.apply(this.status, this.statusDuration);
          other.apply(this.status2, this.statusDuration2);
          this.hitPowerEffect.at(other.x, other.y, b.angleTo(other), this.hitColor);
          this.chainEffect.at(b.x, b.y, 0, this.hitColor, other);
        }
      });
    }
  }
});

module.exports = {
  sparkE1: sparkChargeBegin,
  sparkE2: sparkCharge,
  sparkE3: orbShoot,
  sparkB1: orbBullet,
  sparkB2: staticBullet
};