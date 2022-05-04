const absorberWall = extend(Wall, "absorber-wall", {
  powerUse: 8,

  absorbedHealthCap: 18000,
  absorbedHealthHealFract: 0.75,
  absorbedHealthFract: 0.5,
  regenAmount: 0.002,
  regenCooldown: 210,
  wallQueue: new Queue(),
  
  barColor: Pal.accent,
  interruptedBarColor: Pal.accentBack,
  otherWallColor: Color.sky,
  nearbyColor: Pal.lightOrange,

  init(){
    this.consumes.powerDynamic(build => build.requestedPowerUse());

    this.super$init();
  },

  setBars(){
    this.super$setBars();

    this.bars.add("added-health", func(e => new Bar(prov(() =>
    Core.bundle.format("stat.shards-progress.addedhealth", e.buildMaxAddedHealth())),
    prov(() => e.barColor()), floatp(() => e.addedHealthf()))));
    
  },
  
  setStats(){
    this.super$setStats();

    this.stats.remove(Stat.health);
    this.stats.remove(Stat.powerUse);

    this.stats.add(Stat.powerUse, this.powerUse * 60, StatUnit.powerSecond);

    this.stats.add(Stat.health, this.health + 
    " \n\n[lightgray]Max Projected Health:[] " + this.absorbedHealthCap + 
    " \n[lightgray]Projected Health Heal Percent:[] " + this.absorbedHealthHealFract * 100 + "% healing" +
    " \n[lightgray]Absorbed Health Percent:[] " + this.absorbedHealthFract * 100 + "% of nearby buildings" +
    " \n\n[lightgray]Startup Amount:[] " + this.regenAmount * 100 + "% of current max health");
  },

  drawPlace(x, y, rotation, valid){
    let s = this.size, point = Tmp.p1;
    let t = Vars.world.tile(x, y);
    let cornerX = x + (s - 1) / 2, cornerY = y + (s - 1) / 2;
    let nearby = [];

    if(t != null){
      for(let i = 0; i < s; i++){
        for(let j = 0; j < 4; j++){
          switch(j){
            case 0: point.set(cornerX + s, cornerY + i);
            break;
            case 1: point.set(cornerX + i, cornerY + s); 
            break;
            case 2: point.set(cornerX - 1, cornerY + i); 
            break;
            case 3: point.set(cornerX + i, cornerY - 1);
          }

          let nt = Vars.world.build(point.x, point.y);

          if(nt != null && nt.block !== Blocks.air && !nearby.includes(nt)){
            if(nt.block == this){
              nt.buildChained(null).each(nc => {
                if(nc.block == this){
                  nearby.push(nc);

                  nc.proximity.each(other => {
                    if(!nearby.includes(other)) nearby.push(other);
                  });
                }
              })
            } 
            nearby.push(nt);
          }
        }
      }
    }

    this.drawNearbyBlocks((x + (this.size / 2) / 2) * 8, (y + (this.size / 2) / 2) * 8, valid, nearby, false);
  },
  
  drawNearbyBlocks(x, y, valid, array, isInsulated){
    array.forEach(nt => {
      let lcolor = nt.block == this ? this.otherWallColor : this.nearbyColor;
      if(!valid) lcolor = Pal.remove;
      Drawf.selected(nt, lcolor); 
    });
    
    Lines.stroke(3, Pal.gray);
    Lines.square(x, y, this.size * Vars.tilesize / 2 + 2);

    if(isInsulated){
      Draw.tint(Pal.plasticSmoke, Pal.plastanium, 0.4);
    }else{
      Draw.color(this.otherWallColor);
    }
   
    Lines.stroke(1);
    Lines.square(x, y, this.size * Vars.tilesize / 2 + 1);
    Draw.reset();
  }
});

absorberWall.buildType = () => extend(Wall.WallBuild, absorberWall, {
    startedUp: false,
    addedHealth: 0,
    maxAddedHealth: 0,
    regenedHealth: 0,
    cooldown: 0,

    hasAddedHealth: false,
    heat: 0,

    requestedPowerUse(){
      return this.maxAddedHealth > 0 ? absorberWall.powerUse : 0;
    },

    updateTile(){
      if(this.power.status == 1 && this.maxAddedHealth > 0){        
        this.cooldown -= this.delta();

        if(!this.startedUp && this.cooldown < 0){
          let regenAmount = absorberWall.regenAmount * this.maxAddedHealth * this.edelta();
          this.addedHealth += regenAmount;
          this.regenedHealth += regenAmount;

          if(this.regenedHealth >= this.maxAddedHealth){
            this.regenedHealth = 0;
            this.startedUp = true;
          }
        }
        this.clampAddedHealth();

        this.heat = Mathf.lerpDelta(this.heat, 1, 0.08);
      }else{

        this.heat = Mathf.lerpDelta(this.heat, 0, 0.08);
        this.addedHealth = 0;
        this.regenedHealth = 0;
        this.startedUp = false;
      } 
    },

    onProximityUpdate(){
      this.super$onProximityUpdate();
      this.updateChained();
    },

    onProximityAdded(){
      this.super$onProximityAdded();
      this.updateChained();
    },

    onProximityRemoved(){
      this.super$onProximityRemoved();

      this.proximity.each(b => {
        if(b.block == absorberWall){
          b.updateChained();
        }
      });
    },

    collision(bullet){
      this.super$collision(bullet);
      this.cooldown = absorberWall.regenCooldown;

      return true;
    },

    buildMaxAddedHealth(){
      return this.maxAddedHealth;
    },

    buildChained(chained){
      if(chained == null) return this.chained;
      this.chained = chained;
    },

    nearbyBlocks: [],
    nearbyInsulated: false,
    updateAddedHealth(){
      this.nearbyBlocks = [], this.nearbyInsulated = false;
      let absorbedFract = absorberWall.absorbedHealthFract;
      let currentMaxAddedHealth = 0;

      this.chained.each(otherWall =>{
        if(this.chained.size > 1) currentMaxAddedHealth += otherWall.block.health * absorbedFract;
        if(otherWall != this) this.nearbyBlocks.push(otherWall);

        otherWall.proximity.each(nearby => {
          if(nearby.block != absorberWall){
            currentMaxAddedHealth += nearby.block.health * absorbedFract;
            this.nearbyBlocks.push(nearby);
          }
        });
      });
      
      currentMaxAddedHealth = Math.min(currentMaxAddedHealth, absorberWall.absorbedHealthCap);

      if(currentMaxAddedHealth != this.maxAddedHealth){
        this.maxAddedHealth = currentMaxAddedHealth;
      }

      this.nearbyBlocks.forEach(nt => {
        if(!this.nearbyInsulated && nt.block != absorberWall) this.nearbyInsulated = nt.isInsulated();
      });
    },

    chained: new Seq(),
    updateChained(){
      let wallQueue = absorberWall.wallQueue;
      this.chained = new Seq();
      wallQueue.clear();
      wallQueue.add(this);

      while(!wallQueue.isEmpty()){
        let next = wallQueue.removeLast();
        this.chained.add(next);

        next.proximity.each(nearby => {
          if(nearby.block == absorberWall && nearby.buildChained(null) != this.chained){
            nearby.buildChained(this.chained);

            wallQueue.addFirst(nearby);
          
          }
        });
      }

      this.chained.each(otherWall => {
        otherWall.updateAddedHealth();
      });
    },

    damage(source, damage){
      this.damageAddedHealth(damage);
    },

    damagePierce(amount, withEffect){
      let pre = this.hitTime;

      this.damageAddedHealth(amount);

      if(!withEffect){
        this.hitTime = pre;
      }
    },

    cooldown: 0,
    damageAddedHealth(amount){
      if(this.dead) return;
      let dm = Vars.state.rules.blockHealth(this.team);

      let damage = Math.min(Math.max(this.addedHealth, 0), amount);
      if(Mathf.zero(dm)){
        if(this.addedHealth > 0){
          this.addedHealth -= this.addedHealth;
        }else{
          amount = this.health + 1;
        }

      }else{
        damage /= dm;
        this.addedHealth -= damage;
        amount -= damage;
      }

      this.hitTime = 1;
      this.cooldown = absorberWall.regenCooldown;

      if(amount > 0) this.health -= amount;

      if(this.health <= 0 && !this.dead) this.kill();
    },

    clampAddedHealth(){
      this.addedHealth = Math.min(this.addedHealth, this.maxAddedHealth);
    },

    heal(){
      if(this.health == this.maxHealth){
        this.addedHealth = this.maxAddedHealth;
      }else{
        this.super$heal();
      }
    },

    heal(amount){
      if(this.health == this.maxHealth){
        this.addedHealth += amount * absorberWall.absorbedHealthHealFract;
        this.clampAddedHealth();
      }else{
        this.super$heal(amount);
      }
    },

    healFract(amount){
      if(this.health == this.maxHealth){
        this.heal(amount * this.maxAddedHealth);
      }else{
        this.super$healFract(amount);
      }
    },

    damaged(){
      if(this.power.status != 1 || this.health < this.maxHealth - 0.001){
        return this.health < this.maxHealth - 0.001;
      }

      return this.addedHealth < this.maxAddedHealth;
    },

    addedHealthf(){
      return this.addedHealth / this.maxAddedHealth;
    },

    barColor(){
      if(this.power.status == 1 && this.maxAddedHealth > 0){ 
        if(!this.startedUp && this.cooldown > 0){
          return absorberWall.interruptedBarColor;
        }

        return absorberWall.barColor;
      }

      return absorberWall.interruptedBarColor;
    },

    absorbLasers(){
      return this.nearbyInsulated && this.power.status == 1;
    },

    isInsulated(){
      return this.nearbyInsulated && this.power.status == 1;
    },

    drawSelect(){
      absorberWall.drawNearbyBlocks(this.x, this.y, this.consValid(), this.nearbyBlocks, this.isInsulated());
    },

    draw(){
      this.super$draw();
      if(!Vars.state.isPaused()){
        this.hit = Mathf.clamp(this.hit - Time.delta / 10);
      }

      let size = absorberWall.size;
      let tilesize = Vars.tilesize;
      let realRadius = size * size, radius = this.heat * realRadius;
      let f = 1 - (Time.time / 100) % 1;
      let r = Math.max(0, Mathf.clamp(2 - f * 2) * size * tilesize / 2 - f - 0.2), w = Mathf.clamp(0.5 - f) * size * tilesize;

      Draw.color(this.team.color, Color.white, this.hit);
      Draw.z(Layer.blockOver);
      Draw.alpha(1);
      Lines.stroke(1.2 * this.heat);
      Lines.poly(this.x, this.y, 4, radius * 1.4, 180);


      Draw.alpha(this.maxAddedHealth / absorberWall.absorbedHealthCap * 1.5 * this.power.status);
      Fill.poly(this.x, this.y, 4, realRadius / 3, 180);
      ////
      if(Core.settings.getBool("animatedshields")){
        Draw.z(Layer.buildBeam);
        Draw.alpha(this.heat);
        Fill.poly(this.x, this.y, 4, radius * 1.4, 180);

        Draw.alpha(this.heat * f * 2);
      }else{
        Draw.alpha(0.2 + Mathf.clamp(0.1 * this.hit));
        Fill.poly(this.x, this.y, 4, radius * 1.4, 180);

        Draw.alpha(this.heat * f * 0.4);
      }

      if(this.isInsulated()) Draw.tint(Pal.plasticSmoke, Pal.plastanium, 0.4);
      Fill.polyBegin();
      for(let i = 0; i < 4; i++){
        Fill.polyPoint(this.x + Geometry.d4[Mathf.mod(i, 4)].x * r +  Geometry.d4[Mathf.mod(i, 4)].y * w, this.y + Geometry.d4[Mathf.mod(i, 4)].y * r - Geometry.d4[Mathf.mod(i, 4)].x * w);
        if(f < 0.5){
          Fill.polyPoint(this.x + Geometry.d4[Mathf.mod(i, 4)].x * r - Geometry.d4[Mathf.mod(i, 4)].y * w, this.y + Geometry.d4[Mathf.mod(i, 4)].y * r + Geometry.d4[Mathf.mod(i, 4)].x * w);
      }
    }

      Fill.polyEnd();
      Draw.reset();
    },

    write(write){
      this.super$write(write);
      write.s(this.addedHealth);
      write.s(this.maxAddedHealth);
      write.s(this.regenedHealth);
      write.s(this.cooldown);
      write.bool(this.startedUp);
    },

    read(read, revision){
      this.super$read(read, revision);
      this.addedHealth = read.s();
      this.maxAddedHealth = read.s();
      this.regenedHealth = read.s();
      this.cooldown = read.s();
      this.startedUp = read.bool();
    },
});