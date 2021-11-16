let tilesize = Vars.tilesize;
let tw = Blocks.taintedWater;

function nFixed(num, place){
  return parseFloat(num.toFixed(place));
}

const tg = extendContent(PowerGenerator, "turbine-generator", {
  powerProduction: 9.5,
  minItemEfficiency: 0.2,
  itemDuration: 60,
  randomlyExplode: true,
  
  explodeEffect: Fx.generatespark,
  generateEffect: Fx.generatespark,
  heatColor: Color.valueOf("ff9b59"),
  
  waterProdRate: 0,
  waterProd: 0.5,
  pumpAmount: 0.025,
  
  amountPenalty: 1,
  waterPenalty: 0.5,
  
  init(){
    this.consumes.add(new ConsumeItemFilter(boolf(item => item.flammability >= this.minItemEfficiency)));
    
    this.waterProdRate = 108 / (this.powerProduction * 60);
    
    this.super$init();
  },
  
  load(){
    this.super$load();
    this.shadowRegion = Core.atlas.find("shards-progress-custom-shadow");
    this.bottomRegion = Core.atlas.find(this.name + "-bottom");
    this.rotatorRegion = Core.atlas.find(this.name + "-rotator");
    this.region = Core.atlas.find(this.name);
    this.capRegion = Core.atlas.find(this.name + "-cap");
    this.liquidRegion = Core.atlas.find(this.name + "-liquid");
    this.topRegion = Core.atlas.find(this.name + "-top");
  },
  
  isWater(floor){
    return floor.isLiquid &&
    floor.liquidDrop != null &&
    floor.liquidDrop.canExtinguish() &&
    floor.liquidDrop.viscosity <= 0.5;
  },
  
  liquidAmount(tile, tblock){
    let amount = 0;
    let block = tblock.tempTiles !== undefined ? tblock : tblock.tile.block();
    
    tile.getLinkedTilesAs(block, block.tempTiles).each(cTile => {
      let cFloor = cTile.floor();
      if(tg.isWater(cFloor) &&
      cFloor.liquidDrop === Liquids.water){
        amount += cFloor.liquidMultiplier;
      }
    });
    return amount;
  },
  
  wAttribute(tile, tblock){
    let prod = tg.waterProd;
    let count = 0;
    let block = tblock.tempTiles !== undefined ? tblock : tblock.tile.block();
    
    tile.getLinkedTilesAs(block, block.tempTiles).each(cTile => {
      let cFloor = cTile.floor();
      if(tg.isWater(cFloor)){
          count += cFloor.isDeep() && cFloor !== tw ? prod + (prod / 2) : prod;
      }
    });
    return count;
  },
  
  count: 0,
  drawPlace(x, y, rotation, valid){
    this.super$drawPlace(x, y, rotation, valid);
    let isPlaced = rotation == 4 ? true : false;
    let amount = 0;
    let size = this.size;
    let t = Vars.world.tile(x, y);
    
		if(t != null){
		  this.count = this.wAttribute(t, this);
		  amount = this.liquidAmount(t, this);
		  
		  if(this.count > 0 || amount > 0){
		    for(let i = 0; i < size; i++){
		      let cornerX = x - (size - 1 ) / 2;
		      let cornerY = y - (size - 1 ) / 2;
          let point = Tmp.p1;
          
          for(let j = 0; j < 4; j++){
            switch(j){
              case 0: point.set(cornerX + size, cornerY + i);
              break;
              case 1: point.set(cornerX + i, cornerY + size); 
              break;
              case 2: point.set(cornerX - 1, cornerY + i); 
              break;
              case 3: point.set(cornerX + i, cornerY - 1);
            }
            let nt = Vars.world.tile(point.x, point.y);
            
            if(nt != null){
              let lcolor = valid ? Pal.placing : Pal.remove;
              
              if(nt.block() !== Blocks.air && nt.block().solid && this.isWater(nt.floor())){
                lcolor = Pal.remove;
                let penaltyMultiplier = nt.block().size > 1 ? 2 : 1;
                
                this.count -= this.waterPenalty * penaltyMultiplier;
                amount -= this.amountPenalty * penaltyMultiplier;
              }
              
              Drawf.dashLine(lcolor, point.x * tilesize, point.y * tilesize, (point.x + Geometry.d4x[Mathf.mod(j, 4)]) * tilesize, (point.y + Geometry.d4y[Mathf.mod(j, 4)]) * tilesize);
            }
          }
		    }
		  }

      t.getLinkedTilesAs(this, this.tempTiles).each(cTile => {
        if(!isPlaced && this.isWater(cTile.floor())){
          let v = valid && this.count > 0 ? true : false;
          
          if(amount > 0){
            let width = this.drawPlaceText(Core.bundle.format("stats.shards-progress.passivespeed", amount * this.pumpAmount * 60, 0), x, y + 1, v);
            let dx = x * tilesize + this.offset - width / 2 - 4,
            dy = (y + 1) * tilesize + this.offset + size * tilesize / 2 + 5;
            let s = Vars.iconSmall / 4;
            
            Draw.mixcol(Color.darkGray, 1);
            Draw.rect(Liquids.water.fullIcon, dx, dy - 1, s, s);
            Draw.reset();
            Draw.rect(Liquids.water.fullIcon, dx, dy, s, s);
          }
          
          this.drawPlaceText(Core.bundle.formatFloat("bar.efficiency", this.count * 100, 1), x, y + 2, v);
        }
      });
		}
  },
  
  setStats(){
    this.super$setStats();
    let prod = this.waterProd, size = this.size;
    let wPenalty = this.waterPenalty, aPenalty = this.amountPenalty;
    let powerProduction = this.powerProduction * 60, prodRate = this.waterProdRate;
    
    this.stats.remove(Stat.basePowerGeneration);
    this.stats.add(this.generationType, powerProduction * prodRate + " power units/second /\n" + nFixed(powerProduction * (1 -prodRate), 3) + " power units/second");
    
    this.stats.add(Stat.productionTime, this.itemDuration / 60, StatUnit.seconds);
    
    Vars.content.blocks().each(b => {
      if(this.isWater(b)){
        let efficiency = b.isDeep() && b !== tw ? (prod + (prod / 2)) * size * size : prod * size * size;
        this.stats.add(Stat.tiles, StatValues.blockEfficiency(b, efficiency, true));
      }
    });
    
    this.stats.add(Stat.affinities, wPenalty * 100 + "% to " + wPenalty * 100 * 2 + 
    "% [scarlet]-Efficiency[] and " + aPenalty + " to " + aPenalty * 2 + " liquid units [scarlet]-Passive Speed []\n per nearby block (scales with nearby block size)" + 
    "\n\n [lightgray]Passive Speed:[] " + 60 * this.pumpAmount + " liquid units/second per water tile");
  },
  
  setBars(){
    this.super$setBars();
    
    this.bars.add("efficiency", func(e =>
      new Bar(prov(() =>
    Core.bundle.format("bar.efficiency", Mathf.floor(this.count * 100))),
    prov(() => Pal.lightOrange), floatp(() => this.count))));
  },
  
  icons(){
    return [
      this.region,
      Core.atlas.find(this.name + "-icon")
      ]
  }
});


tg.buildType = () => extend(PowerGenerator.GeneratorBuild, tg, {
  wEfficiency: 0,
  sEfficiency: 0,
  isUpdating: false,
  amount: 0, 
  
  onProximityUpdate(){
   this.super$onProximityUpdate();
   let count = tg.wAttribute(this.tile, this);
   let size = tg.size;
   this.amount = tg.liquidAmount(this.tile, this);
   
   if(count > 0 || this.amount > 0){
		 for(let i = 0; i < size; i++){
		   let cornerX = (this.x / 8) - (size-1)/2;
		   let cornerY = (this.y / 8) - (size-1)/2;
       let point = Tmp.p1;
       
       for(let j = 0; j < 4; j++){
         switch(j){
           case 0: point.set(cornerX + size, cornerY + i);
           break;
           case 1: point.set(cornerX + i, cornerY + size); 
           break;
           case 2: point.set(cornerX - 1, cornerY + i); 
           break;
           case 3: point.set(cornerX + i, cornerY - 1);
         }
         let t = Vars.world.tile(point.x, point.y);
         
         if(t != null){           
           if(t.block() !== Blocks.air && t.block().solid &&
           tg.isWater(t.floor())){
             let penaltyMultiplier = t.block().size > 1 ? 2 : 1;
             
             count -= tg.waterPenalty * penaltyMultiplier;
             this.amount -= tg.amountPenalty * penaltyMultiplier;
           }
         }
       }
		 }
   }
   
   this.wEfficiency = count > 0 ? count : 0;
   if(!this.isUpdating) this.productionEfficiency = nFixed(this.wEfficiency * tg.waterProdRate, 3);
  },
  
  rSpeed: 0,
  fSpeed: 0,
  heat: 0,
  totalTime: 0,
  updateTile(){
    let item, explosiveness = 0;
    let size = tg.size;
    let rotateSpeed = nFixed(this.sEfficiency * (1 - tg.waterProdRate), 3) + nFixed(this.wEfficiency * tg.waterProdRate, 3) * 2 / 2;
    this.rSpeed = Mathf.lerpDelta(this.rSpeed, this.wEfficiency >= 0.2 ? 1 : rotateSpeed, 0.05);
    this.fSpeed += this.rSpeed * Time.delta;
    this.heat = Mathf.lerpDelta(this.heat, this.generateTime >= 0.001 && this.consValid() ? 1 : 0, 0.05);
    this.totalTime += this.heat * Time.delta;

    if(this.amount > 0){
      let maxPump = Math.min(tg.liquidCapacity - this.liquids.total(), this.amount * tg.pumpAmount * this.edelta());
      this.liquids.add(Liquids.water, maxPump);
    }
    
    if(!this.consValid()){ 
      this.sEfficiency = 0;
      this.productionEfficiency = nFixed(this.wEfficiency * tg.waterProdRate, 3);
      return;
    }

    if(this.items.total() > 0 && this.generateTime <= 0){
      item = this.items.take();
      explosiveness = item.explosiveness;
      this.sEfficiency = item.flammability;
      this.productionEfficiency = nFixed(this.sEfficiency * (1 - tg.waterProdRate), 3) + nFixed(this.wEfficiency * tg.waterProdRate, 3);
      this.generateTime = 1;
      
      tg.generateEffect.at(this.x + Mathf.range(3), this.y + Mathf.range(3));
      
    }

    if(this.generateTime > 0){
      this.generateTime -= Math.min(1 / tg.itemDuration * this.delta() * this.power.graph.getUsageFraction(), this.generateTime);
      
      if(tg.randomlyExplode && 
      Vars.state.rules.reactorExplosions && 
      Mathf.chance(this.delta() * 0.06 * Mathf.clamp(explosiveness - 0.5))){
        Core.app.post(() => {
        this.damage(Mathf.random(11));
        
        tg.explodeEffect.at(this.x + Mathf.range(size * tilesize / 2), this.y + Mathf.range(size * tilesize / 2));
        });
      }
    }else{
      this.sEfficiency = 0;
      this.productionEfficiency = nFixed(this.wEfficiency * tg.waterProdRate, 3);
    }
    this.isUpdating = true;
  },
  
  draw(){
    Draw.z(Layer.blockUnder - 0.5);
    Draw.color(0, 0, 0, 0.5);
    Draw.rect(tg.shadowRegion, this.x, this.y, tg.size / 2 * 32, tg.size / 2 * 32);
    Draw.color();

    Draw.z(Layer.block);
    this.tile.getLinkedTilesAs(this.tile.block(), this.tile.block().tempTiles).each(cTile => {
      if(!tg.isWater(cTile.floor())) Draw.rect(tg.bottomRegion, this.x, this.y);
    }); 
    Draw.rect(tg.region, this.x, this.y);

    Draw.color(tg.heatColor);
    Draw.alpha(this.heat * 0.4 + Mathf.absin(Time.time, 8, 0.6) * this.heat);
    Draw.rect(tg.topRegion, this.x, this.y);
    Draw.reset();

    Drawf.spinSprite(tg.rotatorRegion, this.x, this.y, this.fSpeed + this.totalTime);
    Draw.rect(tg.capRegion, this.x, this.y);
    Drawf.liquid(tg.liquidRegion, this.x, this.y, this.liquids.total() / tg.liquidCapacity, this.liquids.current().color);
  },

  drawSelect(){
    tg.drawPlace(this.x / 8, this.y / 8, 4, true);
  }
});