let tw = Blocks.taintedWater;
let tilesize = Vars.tilesize;

const hg = extendContent(PowerGenerator,"hydro-generator", {
  waterProd: 0.5,
  waterPenalty: 0.4,

  load(){
    this.super$load();
    this.shadowRegion = Core.atlas.find("shards-progress-custom-shadow");
    this.region = Core.atlas.find(this.name);
    this.turbineRegion = Core.atlas.find(this.name + "-turbine");
    this.topRegion = Core.atlas.find(this.name + "-top");
  },
      
  isWater(floor){
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
      if(this.isWater(cFloor)){
        count += cFloor.isDeep() && cFloor !== tw ? prod + (prod / 2) : prod;
      }
    });
    return count;
  },

  canPlaceOn: function(tile){
		return tile.getLinkedTilesAs(this, this.tempTiles).contains(
      boolf(cTile => 
        this.isWater(cTile.floor())
      ));
  },

  drawPlace(x, y, rotation, valid){
    let isPlaced = rotation == 4 ? true : false;
    let size = this.size, count = 0;
    let t = Vars.world.tile(x, y);

		if(t != null){
      if(!isPlaced) count = this.wAttribute(t, this);
      
      for(let i = 0; i < size; i++){
        let cornerX = x + (size - 1) / 2, cornerY = y + (size - 1) / 2;
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
            if(nt.block() !== Blocks.air && nt.block().solid &&
             this.isWater(nt.floor())){
              color = Pal.remove;
              let penaltyMultiplier = nt.block().size > 1 ? 2 : 1;
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
      if(this.isWater(b)){
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
    let count = hg.wAttribute(this.tile, this);
    let size = hg.size;
    
    for(let i = 0; i < size; i++){
      let cornerX = (this.x / 8) - ((size - 1) / 2), cornerY = (this.y / 8) - ((size - 1) / 2);
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
          hg.isWater(t.floor())){
            let penaltyMultiplier = t.block().size > 1 ? 2 : 1;
            count -= hg.waterPenalty * penaltyMultiplier;
            }
          }
        }
      }
      
      this.productionEfficiency = count > 0 ? count : 0;
  },

  rSpeed: 0,
  fSpeed: 0,
  updateTile(){
    let rotateSpeed = this.productionEfficiency * 2 / 2;
    this.rSpeed = Mathf.lerpDelta(this.rSpeed, this.productionEfficiency >= 0.2 ? rotateSpeed : 0, 0.05);
    this.fSpeed += this.rSpeed * Time.delta;
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