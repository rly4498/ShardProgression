const waterJetShot = require("others/bullets").streamlineB1;
const cryoJetShot = require("others/bullets").streamlineB2;
const slagJetShot = require("others/bullets").streamlineB3;
const oilJetShot = require("others/bullets").streamlineB4;
const moltenTinJetShot = require("others/bullets").streamlineB5;

const streamline = extendContent(LiquidTurret, "streamline", {
    minimumChargeTime: 180,
    maximumChargeTime: 450,
    allowedShootingBarColor: Color.valueOf("33a3ff"),
    defaultBarColor: Pal.lancerLaser,
    shootingBarColor: Pal.remove,
    chargeCooldown: 120,
    chargePowerUse: 8,

    init(){
      this.consumes.powerCond(this.chargePowerUse, build => build.isCharging());

      this.super$init();
    },

    load(){
      this.super$load();
      this.liquid2Region = Core.atlas.find(this.name + "-liquid2");
      this.top2Region = Core.atlas.find(this.name + "-top2");
    },

    setStats(){
      this.super$setStats();
      this.stats.remove(Stat.reload);
      this.stats.remove(Stat.powerUse);

      this.stats.add(Stat.powerUse, "[lightgray]Charging Power Use:[] " + (this.chargePowerUse * 60) + " " + StatUnit.powerSecond.localized());
      this.stats.add(Stat.reload, " " + (60 / (this.reloadTime) * (this.alternate ? 1 : this.shots)) + " " + StatUnit.perSecond.localized() + "  \n\n" +
       " [lightgray]Minimum Charge Time:[] " + (this.minimumChargeTime / 60) + " " + StatUnit.seconds.localized() + "  \n" +
       " [lightgray]Maximum Charge Time:[] " + (this.maximumChargeTime / 60) + " " + StatUnit.seconds.localized() + "  \n" +
       " [lightgray]Charge Cooldown:[] " + (this.chargeCooldown / 60) + " " + StatUnit.seconds.localized());
    },

    setBars(){
      this.super$setBars();
      this.bars.add("charge", func(e => new Bar(prov(() =>
      Core.bundle.format("stats.shards-progress.charge")),
      prov(() => e.barColor()), floatp(() => e.chargeTime() / (this.minimumChargeTime / 60) * 0.01))));
    },

    icons(){
      this.super$icons();
      return [
        this.baseRegion,
        this.region,
      ]
    }
});

streamline.ammo(
  Liquids.water, waterJetShot,
  Liquids.cryofluid, cryoJetShot,
  Liquids.slag, slagJetShot,
  Liquids.oil, oilJetShot,
  moltenTinJetShot.liquid, moltenTinJetShot 
);

streamline.buildType = () => extend(LiquidTurret.LiquidTurretBuild, streamline, {
    currentlyCharging: false,
    chargingProgress: 0,
    chargingCooldown: 0,
    charged: false,

    updateTile(){
        this.updateCharging();

        if(!this.validateTarget()) this.target = null;
        this.wasShooting = false;
    
        this.recoil = Mathf.lerpDelta(this.recoil, 0, streamline.restitution); //restitution
        this.heat = Mathf.lerpDelta(this.heat, 0, streamline.cooldown); //cooldown
      
        let unit = this.unit;
        unit.tile(this);
        unit.rotation = this.rotation;
        unit.team = this.team;
        unit.ammo = unit.type.ammoCapacity * this.liquids.currentAmount() / streamline.liquidCapacity;

        if(this.logicControlTime > 0){
          this.logicControlTime -= Time.delta;
        }
      
        if(this.hasAmmo()){
          if(Float.isNaN(this.reload)) this.reload = 0;
          
          if(this.timer.get(streamline.timerTarget, streamline.targetInterval)){
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
              
            if(this.shouldTurn()){
              this.turnToTarget(this.targetRot);
            }
      
            if(Angles.angleDist(this.rotation, this.targetRot) < streamline.shootCone && this.canShoot && this.charged){
              this.chargingProgress -= this.edelta();
              if(this.chargingProgress <= 0){
                  this.chargingProgress = 0;
                  this.charged = false;
                  this.reload = 0;
                }else{
              this.wasShooting = true;
              this.updateShooting();
                }
            }
          }
        }
    
        if(streamline.acceptCoolant){
          this.updateCooling();
        }
      },

      turnToTarget(targetRot){
        this.rotation = Angles.moveToward(this.rotation, this.targetRot, streamline.rotateSpeed * this.delta());
    },

      updateCharging(){
        let powerValid = this.power.status > 0;
        this.currentlyCharging = false;

          if(this.wasShooting) this.chargingCooldown = streamline.chargeCooldown;
          if(!this.wasShooting && this.chargingCooldown > 0 && this.chargingProgress < streamline.maximumChargeTime){
            this.charged = false;
          }

          if(this.chargingCooldown > 0 && powerValid && this.enabled) this.chargingCooldown -= this.edelta();

          if(this.chargingCooldown <= 0 && !this.wasShooting && this.chargingProgress < streamline.maximumChargeTime && powerValid && this.enabled){
              this.chargingProgress += this.edelta();
              if(this.chargingProgress > streamline.maximumChargeTime) this.chargingProgress = streamline.maximumChargeTime;

              this.currentlyCharging = true;
            }
          if(this.chargingProgress >= streamline.minimumChargeTime || this.chargingProgress >= streamline.maximumChargeTime){
              this.charged = true;
          }
      },

      updateShooting(){
        this.reload += this.delta() * this.peekAmmo().reloadMultiplier;

        if(this.reload >= streamline.reloadTime && !this.charging){
            let type = this.peekAmmo();

            this.shoot(type);

            this.reload %= this.reloadTime;
        }
    },

      isCharging(){
        return this.currentlyCharging;
      },

      chargeTime(){
        return this.chargingProgress;
      },

      barColor(){
        if(this.wasShooting) return streamline.shootingBarColor;
        if(this.chargeTime() >= streamline.minimumChargeTime) return streamline.allowedShootingBarColor;
        return streamline.defaultBarColor;
      },

      draw(){
        this.super$draw();
        Drawf.liquid(streamline.liquid2Region, this.x + streamline.tr2.x, this.y + streamline.tr2.y, (this.chargingProgress / streamline.maximumChargeTime) * (this.liquids.total() / streamline.liquidCapacity), this.liquids.current().color, this.rotation - 90);
        Draw.rect(streamline.top2Region, this.x + streamline.tr2.x, this.y + streamline.tr2.y, this.rotation - 90);
      },

      write(write){
        this.super$write(write);
        write.s(this.chargingProgress);
        write.s(this.chargingCooldown);
        write.bool(this.charged);
       },
      
      read(read, revision){
        this.super$read(read, revision);
        this.chargingProgress = read.s();
        this.chargingCooldown = read.s();
       },

       readAll(read, revision){
        this.super$readAll(read, revision);
      
        if(revision == 1){
          this.charged = read.bool();
        }
      }
});
