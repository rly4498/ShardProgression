const sparkChargeBegin = require("others/bullets").sparkE1;
const sparkCharge = require("others/bullets").sparkE2;
const sparkShoot = require("others/bullets").sparkE3;

const orbBullet = require("others/bullets").sparkB1;
const staticBullet = require("others/bullets").sparkB2;

//for displaying name and icon on turret stat
const chargeMode = extend(StatusEffect, "charge-icon", {
  localizedName: Core.bundle.get("status.shards-progress-" + orbBullet.modeName + ".name"),
  show: false
});

const staticShotMode = extend(StatusEffect, "static-shot-icon", {
  localizedName: Core.bundle.get("status.shards-progress-" + staticBullet.modeName + ".name"),
  show: false
});

importPackage(java.lang);

function nFixed(num, place){
  return parseFloat(num.toFixed(place));
}

const spark = extendContent(Turret, "spark", {
  trBarrel: new Vec2(),
  shootCone: 30,
  rotateSpeed: 9,
  spread: 0,
  range: 174,
  reloadTime: 60,
  chargeTime: 60,
  chargeMaxDelay: 40,
  togglePowerUse: 6,

  toggleTime: 60 * 3.5,
  extendInterp: Interp.pow4In,
  extendX: 2,
  outlineIcon: false,
  mIconSize: 100,

  chargeBeginEffect: sparkChargeBegin,
  chargeEffects: 7,
  chargeEffect: Fx.none,
  shootEffect: Fx.none,
  smokeEffect: Fx.none,
  shootTypes: [
    orbBullet,
    staticBullet
  ],
  
  shootSound: Sounds.spark,
  toggleLoopSound: Sounds.build,
  toggleSoundVolume: 0.4,

  setStats(){
    this.super$setStats();
    this.stats.remove(Stat.powerUse);
    this.stats.remove(Stat.reload);

    for(let i = 0, reload = "", powerUse = ""; i < this.shootTypes.length; i++){
      let ammo = this.shootTypes[i], shots = ammo.shots != undefined ? ammo.shots : spark.shots;
      let isLast = this.shootTypes.length - (i + 1) == 0;
      reload += nFixed(60 / (ammo.reloadTime) * (this.alternate ? 1 : shots), 3) + " " + StatUnit.perSecond.localized() + 
      (isLast ? "" : " /\n");
      powerUse +=  + ammo.powerUse * 60 + " " + StatUnit.powerSecond.localized() + (isLast ? "" : " /\n");
      (isLast ? "" : " /\n");

      if(isLast){
        this.stats.add(Stat.reload, reload);
        this.stats.add(Stat.powerUse, powerUse)
      };
    }

    this.stats.add(Stat.ammo, StatValues.ammo(ObjectMap.of(chargeMode, orbBullet)));
    this.stats.add(Stat.ammo, StatValues.ammo(ObjectMap.of(staticShotMode, staticBullet)));

  },

  init(){
    
    this.consumes.powerDynamic(build => build.requestedPowerUse());
    this.super$init();
  },

  load(){
    this.super$load();
    this.region = Core.atlas.find(this.name);
    this.leftBarrelRegion = Core.atlas.find(this.name + "-barrel1");
    this.rightBarrelRegion = Core.atlas.find(this.name + "-barrel2");
    this.leftBarrelOutlineRegion = Core.atlas.find(this.name + "-barrel1-outline");
    this.rightBarrelOutlineRegion = Core.atlas.find(this.name + "-barrel2-outline");
  },
  //i gave up
  drawRequestConfig(req, list){
    if(req.config == null || req.config != 1) return;
    let region = Core.atlas.find("shards-progress-spark-icon" + (req.config + 1));
    
    Draw.rect(this.baseRegion, req.drawx(), req.drawy());
    Draw.rect(region, req.drawx(), req.drawy());
  },

  icons(){
    this.super$icons();
    return [
      this.baseRegion,
      Core.atlas.find(this.name + "-icon" + 1),
    ]
  },
});

spark.config(Integer, (build, mode) => {
    build.setMode(mode);
  });

spark.buildType = () => extend(Turret.TurretBuild, spark, {
  cMode: 0,
  extended: false, 
  toggleSound: new SoundLoop(spark.toggleLoopSound, spark.toggleSoundVolume),
  bDisabled: false,
  table: undefined,
  
  requestedPowerUse(){
    if(this.isToggling()) return spark.togglePowerUse;
    if(this.isActive()) return this.currentAmmo.powerUse;
    return 0;
  },

  bPressed(table){
    if(table instanceof Table) this.table = table;
    this.bDisabled = true;
    this.cMode += 1;
    if(this.cMode >= spark.shootTypes.length) this.cMode = 0;
  
    this.toggleMode();
    this.configure(new Integer(this.cMode));
    if(this.table instanceof Table) this.rebuild(this.table);
  },
  
  setMode(value){
    this.cMode = new Integer(value);
    this.currentAmmo = spark.shootTypes[this.cMode];
  },
    
  toggleMode(){
    this.currentAmmo = spark.shootTypes[this.cMode];
  },
  
  buildConfiguration(table){
    this.rebuild(table);
  },
  
  rebuild(table){
    this.toggleSound.update(this.x, this.y, this.bDisabled && this.consValid() ? true : false);
  
    table.clearChildren();
    table.table(Tex.inventory, cons(content => {
      let iconSize = spark.mIconSize, cBullet = this.currentAmmo;
      let modeName = this.bDisabled ? "[gray]<toggling>[]" : "[white]" + Core.bundle.get("status.shards-progress-" + cBullet.modeName + ".name") + "[]";
  
      content.table(cons(mode => {
        mode.table(Tex.button, cons(mIcon => mIcon.image(new TextureRegionDrawable(Core.atlas.find("shards-progress-" + cBullet.modeName + "-icon"))).size(iconSize)));
          
        mode.button(Icon.refresh, () => {
          this.bPressed(table);
        }).disabled(b => this.bDisabled).bottom().left().padLeft(iconSize / -2.5).padBottom(iconSize / -5 + iconSize / 10);
      })).pad(4).padBottom(iconSize / 5);
      
      content.table(cons(cText => cText.add("[accent]Mode:[]\n" + modeName))).growX();
    }));
  },

  onProximityAdded(){
    this.super$onProximityAdded();
    this.toggleMode();
  },

  placed(){
    this.super$placed();
    this.toggleMode();
    this.extended = this.currentAmmo.barrelExtend;
  },
  
  onConfigureTileTapped(other){
    if(this == other){
      this.deselect();
      return false;
    }
    return true;
  },
  
  config(){
    return this.cMode;
  },
  
  getBarrelRegion(i, outline){
    if(outline){
      switch(i){
        case -1: return spark.leftBarrelOutlineRegion;
        case 1: return spark.rightBarrelOutlineRegion;
      }
    }else{
      switch(i){
        case -1: return spark.leftBarrelRegion;
        case 1: return spark.rightBarrelRegion;
      }
    }
    
    return null;
  },
    //it begins
  sense(sensor){
    switch(sensor){
        case LAccess.ammo: return this.powerStatus;
        case LAccess.ammoCapacity: return 1;
        case LAccess.rotation: return this.rotation;
        case LAccess.shootX: return World.conv(this.targetPos.x);
        case LAccess.shootY: return World.conv(this.targetPos.y);
        case LAccess.shooting: return this.isShooting() ? 1 : 0;
        case LAccess.progress: return Mathf.clamp(this.reload / this.reloadTime);
        default: this.super$sense(sensor);
      }
    },
  
  useAmmo(){
    return this.currentAmmo;
  },

  hasAmmo(){
    return true;
  },

  peekAmmo(){
    return this.currentAmmo;
  },

  isToggling(){
    return this.toggleProgress > 0;
  },

  toggleProgress: 0,
  updateTile(){
    this.updateToggling();
    
    if(!this.validateTarget()) this.target = null;
    this.wasShooting = false;

    let type = this.currentAmmo;
    this.recoil = Mathf.lerpDelta(this.recoil, 0, type.tEffects[5]); //restitution
    this.heat = Mathf.lerpDelta(this.heat, 0, type.tEffects[6]); //cooldown
  
    let unit = this.unit;
    unit.tile(this);
    unit.rotation = this.rotation;
    unit.team = this.team;
    unit.ammo = this.power.status * unit.type.ammoCapacity;

    if(this.logicControlTime > 0){
      this.logicControlTime -= Time.delta;
    }
  
    if(this.hasAmmo()){
      if(Float.isNaN(this.reload)) this.reload = 0;
      
      if(this.timer.get(spark.timerTarget, spark.targetInterval)){
        this.findTarget();
      }
      
      if(this.validateTarget()){
        this.canShoot = true;
         
        if(this.isControlled()){
          //player behavior
          this.targetPos.set(unit.aimX, unit.aimY);
          this.canShoot = unit.isShooting;
        
        }else if(this.logicControlled()){ 
          //logic behavior
          this.canShoot = this.logicShooting;
        
        }else{ 
          //default AI behavior
          this.targetPosition(this.target);
          if(Float.isNaN(this.rotation)) this.rotation = 0;
        }
        
        this.targetRot = this.angleTo(this.targetPos);
          
        if(this.shouldTurn() && !this.isToggling()){
          this.turnToTarget(this.targetRot);
        }
  
        if(Angles.angleDist(this.rotation, this.targetRot) < spark.shootCone && this.canShoot){
          this.wasShooting = true;
          this.updateShooting();
        }
      }
    }

    if(spark.acceptCoolant){
      this.updateCooling();
    }
  },

  updateShooting(){
    let type = this.currentAmmo;
    this.reload += this.delta() * type.reloadMultiplier * this.baseReloadSpeed();
  
    if(this.reload >= type.reloadTime && !this.charging){
      this.shoot(type);
      
      this.reload %= type.reloadTime;
    }
  },

  updateToggling(){
    if(this.bDisabled && this.consValid()){
      this.toggleProgress += this.delta() * this.baseReloadSpeed();
      this.reload = -69420;
    }
  
    if(this.toggleProgress >= spark.toggleTime){
      this.bDisabled = false;
      this.extended = !this.extended;
      if(this.table instanceof Table) this.rebuild(this.table);
        
      this.reload = 0;
      this.toggleProgress = 0;
    }
      
    this.toggleSound.update(this.x, this.y, this.bDisabled && this.consValid() ? true : false);
  },

  shoot(type){
    let x = this.x, y = this.y, tr = spark.tr, ammo = this.currentAmmo;
    let shots = ammo.shots == undefined ? spark.shots : ammo.shots;
    //when charging is enabled, use the charge shoot pattern
    if(ammo.chargeTime > 0){
      this.useAmmo();
        
      tr.trns(this.rotation, spark.shootLength);
      ammo.tEffects[0].at(x + tr.x, y + tr.y, this.rotation); //chargeBeginEffect
      ammo.tEffects[1].at(x + tr.x, y + tr.y, 1); //chargeEffect
        
      for(let i = 0; i < ammo.tEffects[2]; i++){ //chargeEffects
        Time.run(Mathf.random(ammo.chargeMaxDelay), () => {
          if(this.dead) return;
          tr.trns(this.rotation, spark.shootLength);
          ammo.tEffects[1].at(x + tr.x, y + tr.y, this.rotation); //chargeEffect
        });
      }
        
      this.charging = true;
      Time.run(ammo.chargeTime, () => {
        if(this.dead) return;
        tr.trns(this.rotation, spark.shootLength);
        this.recoil = ammo.tEffects[3]; //recoilAmount
        this.heat = 1;
        this.bullet(type, this.rotation + Mathf.range(spark.inaccuracy + type.inaccuracy));
        this.effects();
        this.charging = false;
      });
  
    //when burst spacing is enabled, use the burst pattern
    }else if(ammo.burstSpacing > 0.0001){
      for(let i = 0; i < shots; i++){
        let ii = i;
        Time.run(ammo.burstSpacing * i, () => {
          if(this.dead || !this.hasAmmo()) return;
          tr.trns(this.rotation, spark.shootLength, Mathf.range(spark.xRand));
          this.bullet(type, this.rotation + Mathf.range(spark.inaccuracy + type.inaccuracy) + (ii - (shots / 2)) * spark.spread);
          this.effects();
          this.useAmmo();
          this.recoil = ammo.tEffects[3]; //recoilAmount
          this.heat = 1;
        });
      }
    }else{
      
      //otherwise, use the normal shot pattern(s)
      if(spark.alternate){
        let i = (this.shotCounter % shots) - (shots-1)/2;
  
        tr.trns(this.rotation - 90, spark.spread * i + Mathf.range(spark.xRand), spark.shootLength);
        this.bullet(type, rotation + Mathf.range(inaccuracy + type.inaccuracy));
      }else{
        tr.trns(this.rotation, spark.shootLength, Mathf.range(spark.xRand));
        for(let i = 0; i < ammo.shots; i++){
          this.bullet(type, this.rotation + Mathf.range(spark.inaccuracy + type.inaccuracy) + (i - (shots / 2)) * spark.spread);
        }
      }
          
      this.shotCounter++;
      this.recoil = ammo.tEffects[3]; //recoilAmount
      this.heat = 1;
      this.effects();
      this.useAmmo();
    }
  },
  
  draw(){
    Draw.rect(spark.baseRegion, this.x, this.y);
    Draw.color();
  
    Draw.z(Layer.turret);
  
    let drawProgress = this.extended && !this.bDisabled ? 1 : this.toggleProgress / spark.toggleTime;
    let extendX = spark.extendX, elevation = spark.elevation, tr2 = spark.tr2;
    spark.trBarrel.trns(this.rotation, 0, -spark.extendInterp.apply(this.bDisabled && this.extended ? 1 - drawProgress : drawProgress) * extendX); 
    let trBarrelX = spark.trBarrel.x, trBarrelY = spark.trBarrel.y;
    tr2.trns(this.rotation, -this.recoil);
  
    Drawf.shadow(spark.region, this.x + tr2.x - elevation, this.y + tr2.y - elevation, this.rotation - 90);
    
    for(let i of Mathf.signs){
      Drawf.shadow(this.getBarrelRegion(i, true), this.x + tr2.x + trBarrelX * i - elevation, this.y + tr2.y + trBarrelY * i - elevation, this.rotation - 90);
      Draw.rect(this.getBarrelRegion(i, true), this.x + tr2.x + trBarrelX * i, this.y + tr2.y + trBarrelY * i, this.rotation - 90);
    }
  
    Draw.rect(spark.region, this.x + tr2.x, this.y + tr2.y, this.rotation - 90);
  
      for(let i of Mathf.signs){
        Draw.rect(this.getBarrelRegion(i, false), this.x + tr2.x + trBarrelX * i, this.y + tr2.y + trBarrelY * i, this.rotation - 90);
      }
  },
  
  write(write){
    this.super$write(write);
    write.s(this.cMode);
    write.s(this.toggleProgress);
    write.bool(this.bDisabled);
    write.bool(this.extended);
   },
  
  read(read, revision){
    this.super$read(read, revision);
    this.cMode = read.s();
    this.toggleProgress = read.s();
   },
  
   readAll(read, revision){
    this.super$readAll(read, revision);
  
    if(revision == 1){
      this.bDisabled = read.bool();
      this.extended = read.bool();
    }
  }
});
