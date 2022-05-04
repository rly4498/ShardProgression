let tw = Blocks.taintedWater;
let tilesize = Vars.tilesize;

const hg = extendContent(PowerGenerator,"hydro-generator", {
  waterProd: 0.5,
  waterPenalty: 0.4,
  maxSizePenalty: 2,
  load(){
    this.super$load();
    this.shadowRegion = Core.atlas.find("shards-progress-custom-shadow");
    this.region = Core.atlas.find(this.name);
    this.turbineRegion = Core.atlas.find(this.name + "-turbine");
    this.topRegion = Core.atlas.find(this.name + "-top");
  },
      
  isLiquidTile(floor){
    return floor.isLiquid &&
    floor.liquidDrop != null &&
    floor.liquidDrop.canExtinguish() &&
    floor.liquidDrop.viscosity <= 0.5;
  },

  wAttribute(tile, tblock){
    let prod = this.waterProd, count = 0;
    let block = tblock.tempTiles !== undefined ? tblock : tblock.tile.block();
    
    tile.getLinkedTilesAs(block, block.tempTiles).each(cTile => {
      let cFloor = cTile.floor();
      if(this.isLiquidTile(cFloor)){
        count += cFloor.isDeep() && cFloor !== tw ? prod + (prod / 2) : prod;
      }
    });
    return count;
  },

  getNearbyPos(x, y, rotation, i, out){
    let s = this.size;
    let cornerX = x + (s - 1) / 2, cornerY = y + (s - 1) / 2;

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

  canPlaceOn: function(tile){
    return tile.getLinkedTilesAs(this, this.tempTiles).contains(
      boolf(cTile => 
        this.isLiquidTile(cTile.floor())
      ));
  },

  drawPlace(x, y, rotation, valid){
    let isPlaced = rotation == 4 ? true : false;
    let size = this.size, count = 0;
    let t = Vars.world.tile(x, y);

		if(t != null){
      if(!isPlaced) count = this.wAttribute(t, this);
      let point = Tmp.p1;

      for(let i = 0; i < size; i++){
        for(let j = 0; j < 4; j++){
          this.getNearbyPos(x, y, j, i, point);
          let nt = Vars.world.tile(point.x, point.y);
            
          if(nt != null){
            let lcolor = valid ? Pal.placing : Pal.remove;
            if(nt.block() !== Blocks.air && nt.solid() &&
             this.isLiquidTile(nt.floor())){
              lcolor = Pal.remove;
              let penaltyMultiplier = Math.min(nt.block().size, this.maxSizePenalty);
              count -= hg.waterPenalty * penaltyMultiplier;
            }
            
            Drawf.dashLine(lcolor, point.x * tilesize, point.y * tilesize, (point.x + Geometry.d4x[Mathf.mod(j, 4)]) * tilesize, (point.y + Geometry.d4y[Mathf.mod(j, 4)]) * tilesize);
            }
          }
        }

        if(!isPlaced){
          let v = valid && count > 0 ? true : false;
          this.drawPlaceText(Core.bundle.formatFloat("bar.efficiency", count * 100, 1), x, y, v);
        }
      }
  },
    
  setStats(){
    this.super$setStats();
    let prod = this.waterProd, size = this.size;
    Vars.content.blocks().each(b => {
      if(this.isLiquidTile(b)){
        let efficiency = b.isDeep() && b !== tw ? (prod + (prod / 2)) * size * size : prod * size * size;
        this.stats.add(Stat.tiles, StatValues.blockEfficiency(b, efficiency, true));
      }
    });
    
    this.stats.add(Stat.affinities, hg.waterPenalty * 100 + "% to " + hg.waterPenalty * 100 * 2 + "% [scarlet]-Efficiency[] per nearby blocks (scales with nearby block size)");
  },

	setBars(){
    this.super$setBars();
    this.bars.add("efficiency", func(e => new Bar(prov(() =>
    Core.bundle.format("bar.efficiency", Mathf.floor(e.productionEfficiency * 100))),
    prov(() => Pal.lightOrange), floatp(() => e.productionEfficiency))));
  },  
    
  icons(){
    return [
      this.region,
      Core.atlas.find(this.name + "-icon")
    ];
  }
});

hg.buildType = () => extend(PowerGenerator.GeneratorBuild, hg, {
  onProximityUpdate(){
    this.super$onProximityUpdate();
    this.updateProductionEff();
  },

  onProximityAdded(){
    this.super$onProximityAdded();
    this.updateProductionEff();
  },

  updateProductionEff(){
    let count = hg.wAttribute(this.tile, this);
    let size = hg.size, point = Tmp.p1;

    for(let i = 0; i < size; i++){
      for(let j = 0; j < 4; j++){
        hg.getNearbyPos(this.tileX(), this.tileY(), j, i, point);
        let nt = Vars.world.tile(point.x, point.y);
        if(nt != null){
          
          if(nt.block() !== Blocks.air && nt.solid() &&
          hg.isLiquidTile(nt.floor())){   
            let penaltyMultiplier = Math.min(nt.block().size, hg.maxSizePenalty);
            count -= hg.waterPenalty * penaltyMultiplier;
            }
          }
        }
      }
      
      this.productionEfficiency = count > 0 ? count : 0;
  },

  rSpeed: 0,
  fSpeed: 0,
  lastSolidDoors: 0,
  updateTile(){
    let solidDoors = 0;
    let rotateSpeed = this.productionEfficiency * 2 / 2;
    this.rSpeed = Mathf.lerpDelta(this.rSpeed, this.productionEfficiency >= 0.2 ? rotateSpeed : 0, 0.05);
    this.fSpeed += this.rSpeed * Time.delta;

    this.proximity.each(nearby => {
      if(nearby.block instanceof Door || nearby.block.solidifes){
        if(nearby.checkSolid() && hg.isLiquidTile(nearby.floor())){
          solidDoors += 1;
        }
      } 
    });

    if(this.lastSolidDoors != solidDoors){
      this.lastSolidDoors = solidDoors;
      this.updateProductionEff();
    }
  },

  draw(){
    Draw.z(Layer.blockUnder - 0.5);
    Draw.color(0, 0, 0, 0.5);
    Draw.rect(hg.shadowRegion, this.x, this.y, 32, 32);
    Draw.color();

    Draw.z(Layer.block);
    Draw.rect(hg.region, this.x, this.y);
    Drawf.spinSprite(hg.turbineRegion, this.x, this.y, this.fSpeed);
    Draw.rect(hg.topRegion, this.x, this.y);
  },
    
  drawSelect(){
    hg.drawPlace(this.x / 8, this.y / 8, 4, true);
  }
});