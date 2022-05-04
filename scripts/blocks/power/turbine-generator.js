let tilesize = Vars.tilesize;
let tw = Blocks.taintedWater;

function nFixed(num, place){
  return parseFloat(num.toFixed(place));
}

const tg = extendContent(BurnerGenerator, "turbine-generator", {
  powerProduction: 7.7,
  itemDuration: 60,
  
  explodeEffect: Fx.generatespark,
  generateEffect: Fx.generatespark,
  heatColor: Color.valueOf("ff9b59"),
  
  waterProdRate: 1.8 * 60,
  waterProd: 0.5,
  pumpAmount: 0.025,
  
  amountPenalty: 1,
  waterPenalty: 0.5,
  
  init(){
    this.waterProdRate /= (this.powerProduction * 60);

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
  
  isLiquidTile(floor){
    return floor.isLiquid &&
    floor.liquidDrop != null &&
    floor.liquidDrop.canExtinguish() &&
    floor.liquidDrop.viscosity <= 0.5;
  },
  
  wAttribute(tile, tblock){
    let amount = 0, count = 0, prod = this.waterProd;
    let block = tblock.tempTiles !== undefined ? tblock : tblock.tile.block();

    tile.getLinkedTilesAs(block, block.tempTiles).each(cTile => {
      let cFloor = cTile.floor();

      if(this.isLiquidTile(cFloor)){
        count += cFloor.isDeep() && cFloor !== tw ? prod + (prod / 2) : prod;
        if(cFloor.liquidDrop === Liquids.water) amount += cFloor.liquidMultiplier;
      }
    });
    
    let attr = [count, amount];
    return attr;
  },

  getRequestRegion(req, list){
    if(!this.onLiquid){
      return Core.atlas.find(this.name + "-icon1");
    }

    return Core.atlas.find(this.name + "-icon2");
  },

  getNearbyPos(x, y, rotation, i, out){
    let s = this.size;
    let cornerX = x - (s - 1) / 2;
		let cornerY = y - (s - 1) / 2;
    switch(rotation){
      case 0: out.set(cornerX + s, cornerY + i);
      break;
      case 1: out.set(cornerX + i, cornerY + s); 
      break;
      case 2: out.set(cornerX - 1, cornerY + i); 
      break;
      case 3: out.set(cornerX + i, cornerY - 1);
    }
  },

  onLiquid: false,
  drawPlace(x, y, rotation, valid){
    this.super$drawPlace(x, y, rotation, valid);
    this.onLiquid = rotation == 5 ? true : false;
    let isPlaced = rotation > 4;
    let size = this.size, t = Vars.world.tile(x, y);
    let amount = 0, count = 0;
    
		if(t != null){
      if(!isPlaced){
        let attr = this.wAttribute(t, this);
        count = attr[0], amount = attr[1];
        this.onLiquid = count > 0 || amount > 0;
      }

		  if(this.onLiquid){
		    for(let i = 0; i < size; i++){
          for(let j = 0; j < 4; j++){
            let point = Tmp.p1;
            this.getNearbyPos(x, y, j, i, point);
            let nt = Vars.world.tile(point.x, point.y);
            
            if(nt != null){
              let lcolor = valid ? Pal.placing : Pal.remove;
              if(nt.block() !== Blocks.air && nt.solid() && this.isLiquidTile(nt.floor())){
                lcolor = Pal.remove;
                let penaltyMultiplier = nt.block().size > 1 ? 2 : 1;
                
                count -= this.waterPenalty * penaltyMultiplier;
                amount -= this.amountPenalty * penaltyMultiplier;
              }
              
              Drawf.dashLine(lcolor, point.x * tilesize, point.y * tilesize, (point.x + Geometry.d4x[Mathf.mod(j, 4)]) * tilesize, (point.y + Geometry.d4y[Mathf.mod(j, 4)]) * tilesize);
            }
          }
		    }
		  }

      if(!isPlaced){
        t.getLinkedTilesAs(this, this.tempTiles).each(cTile => {
          if(this.isLiquidTile(cTile.floor())){
            let liquid = this.consumes.get(ConsumeType.liquid).liquid;
            let v = valid && count > 0 ? true : false;
            let textOffset = amount > 0 ? 2 : 0;
            if(amount > 0){
              let width = this.drawPlaceText(Core.bundle.format("stats.shards-progress.passivespeed", amount * this.pumpAmount * 60, 0), x, y + 1, v);
              let dx = x * tilesize + this.offset - width / 2 - 4,
              dy = (y + 1) * tilesize + this.offset + size * tilesize / 2 + 5;
              let s = Vars.iconSmall / 4;
            
              Draw.mixcol(Color.darkGray, 1);
              Draw.rect(liquid.fullIcon, dx, dy - 1, s, s);
              Draw.reset();
              Draw.rect(liquid.fullIcon, dx, dy, s, s);
            }
            
            this.drawPlaceText(Core.bundle.formatFloat("bar.efficiency", count * 100, 1), x, y + textOffset, v);
          }
        });
      }
    }
  },
  
  setStats(){
    this.super$setStats();
    let prod = this.waterProd, size = this.size;
    let wPenalty = this.waterPenalty, aPenalty = this.amountPenalty;
    let powerProduction = this.powerProduction * 60, prodRate = this.waterProdRate;
    
    this.stats.remove(Stat.basePowerGeneration);
    this.stats.add(this.generationType, "  [lightgray]Hydro Base Power Generation:[] " + powerProduction * prodRate + " power units/second /\n" 
    + "  [lightgray]Steam Base Power Generation:[] " + nFixed(powerProduction, 4) + " power units/second");
    
    Vars.content.blocks().each(b => {
      if(this.isLiquidTile(b)){
        let efficiency = b.isDeep() && b !== tw ? (prod + (prod / 2)) * size * size : prod * size * size;
        this.stats.add(Stat.tiles, StatValues.blockEfficiency(b, efficiency, true));
      }
    });
    
    this.stats.add(Stat.affinities, wPenalty * 100 + "% to " + wPenalty * 100 * 2 + 
    "% [scarlet]-Efficiency[] and " + aPenalty + " to " + aPenalty * 2 + " liquid units [scarlet]-Passive Speed []\n per nearby block (scales with nearby block size)" + 
    "\n\n [lightgray]Passive Speed:[] " + 60 * this.pumpAmount + " liquid units/second per liquid tile");
  },
  
  setBars(){
    this.super$setBars();
    this.bars.add("efficiency", func(e => 
      new Bar(prov(() =>
      Core.bundle.format("bar.efficiency", Mathf.floor(e.waterEfficiency() * 100))),
      prov(() => Pal.lightOrange), floatp(() => e.waterEfficiency()))));
  },
  
  icons(){
    return [
      this.region,
      Core.atlas.find(this.name + "-icon1")
      ];
  }
});

tg.buildType = () => extend(BurnerGenerator.BurnerGeneratorBuild, tg, {
  wEfficiency: 0,
  lastEfficiency: 0,
  isUpdating: false,
  amount: 0, 
  
  onProximityUpdate(){
    this.onProximityAdded();
    this.updateProductionEff();
  },

  onProximityAdded(){
   this.super$onProximityAdded();
   this.updateProductionEff();
  },
  
  rSpeed: 0,
  fSpeed: 0,
  lastSolidDoors: 0,
  updateTile(){
    if(this.generateTime <= 0){
      this.isUpdated = false;
    }
    this.super$updateTile();
    let solidDoors = 0;
    let rotateSpeed = nFixed(this.productionEfficiency * (1 - tg.waterProdRate), 3) + nFixed(this.wEfficiency * tg.waterProdRate, 3) * 2 / 2;
    this.rSpeed = Mathf.lerpDelta(this.rSpeed, this.wEfficiency >= 0.2 ? 1 : rotateSpeed, 0.05);
    this.fSpeed += this.rSpeed * Time.delta;

    if(this.amount > 0){
      let maxPump = Math.min(tg.liquidCapacity - this.liquids.total(), this.amount * tg.pumpAmount * this.edelta());
      this.liquids.add(tg.consumes.get(ConsumeType.liquid).liquid, maxPump);
    }
    
    
    if(this.onLiquid){
      this.proximity.each(nearby => {
        if(nearby.block instanceof Door || nearby.block.solidifes){
          if(nearby.checkSolid() && tg.isLiquidTile(nearby.floor())){
            solidDoors += 1;
          }
        } 
      });
    
      if(this.lastSolidDoors != solidDoors){
        this.lastSolidDoors = solidDoors;
        this.updateProductionEff();
      }
    }

    if(!this.isUpdated){ 
      this.isUpdated = true;
        this.productionEfficiency += nFixed(this.wEfficiency * tg.waterProdRate, 4);
    }
  },
  
  draw(){
    Draw.z(Layer.blockUnder - 0.5);
    Draw.color(0, 0, 0, 0.5);
    Draw.rect(tg.shadowRegion, this.x, this.y, tg.size / 2 * 32, tg.size / 2 * 32);
    Draw.color();

    Draw.z(Layer.block);
    if(!this.onLiquid) Draw.rect(tg.bottomRegion, this.x, this.y);
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
    let drawLines = this.onLiquid ? 5 : 6;
    tg.drawPlace(this.x / 8, this.y / 8, drawLines, true);
  },

  onLiquid: false,
  updateProductionEff(){
    let attr = tg.wAttribute(this.tile, this);
    let count = attr[0], size = tg.size;
    this.amount = attr[1];
    this.onLiquid = count > 0 || this.amount > 0;
    
    if(count > 0 || this.amount > 0){
      for(let i = 0; i < size; i++){
        for(let j = 0; j < 4; j++){
          let point = Tmp.p1, tilesize = Vars.tilesize;
          tg.getNearbyPos(this.x / tilesize, this.y / tilesize, j, i, point);
          let nt = Vars.world.tile(point.x, point.y);
          
          if(nt != null){
            if(nt.block() !== Blocks.air && nt.solid() &&
            tg.isLiquidTile(nt.floor())){
              let penaltyMultiplier = nt.block().size > 1 ? 2 : 1;
              
              count -= tg.waterPenalty * penaltyMultiplier;
              this.amount -= tg.amountPenalty * penaltyMultiplier;
            }
          }
        }
      }
    }
    
    this.wEfficiency = count > 0 ? count : 0;
    this.isUpdated = false;
  },

  waterEfficiency(){
    return this.wEfficiency;
  }
});