let mineableFloor = [Blocks.stone, Blocks.dacite, Blocks.craters, Blocks.charr, Blocks.basalt, Blocks.hotrock,
  Blocks.magmarock, Blocks.sand, Blocks.darksand, Blocks.dirt, Blocks.mud, Blocks.grass];

const ap = extendContent(AttributeCrafter, "automated-press", {
  baseEff: 0.5,
  drillEffect: Fx.mineBig,
  drillEffectRnd: 4,
  drillEffectChance: 0.02,
  rotateSpeed: 2,
  warmupSpeed: 0.015,
  
  load(){
    this.super$load();      
    this.region = Core.atlas.find(this.name);
    this.rotatorRegion = Core.atlas.find(this.name + "-rotator");
    this.topRegion = Core.atlas.find(this.name + "-top");
    this.overlapRegion = Core.atlas.find(this.name + "-overlap");
    this.liquidRegion = Core.atlas.find(this.name + "-liquid");
  },

  isMineable(floor){
    for(let i of mineableFloor){
      if(i === floor) return true;
    }
    return false;
  },

  canPlaceOn: function(tile){
    return tile.getLinkedTilesAs(this, this.tempTiles).contains(
        boolf(cTile => this.isMineable(cTile.floor())));
      },
  
  attrEfficiency(x, y){
    let efficiency = 0, tile = Vars.world.tile(x, y);
    if(tile == null) return 0;
    tile.getLinkedTilesAs(this, this.tempTiles).each(cTile => {
      let cFloor = cTile.floor(), size = this.size;
      if(this.isMineable(cFloor)){
        let floorAttr = cFloor.attributes.get(this.attribute);
        efficiency += floorAttr != 0 ? floorAttr : this.baseEff / (size * size) / this.boostScale;
      }
    });

    return efficiency;
  },
  
  setStats(){
    this.super$setStats();
    this.stats.remove(Stat.affinities);

    Vars.content.blocks().each(b => {
      if(this.isMineable(b)){
        let floorAttr = b.attributes.get(this.attribute), size = this.size;
        let efficiency = floorAttr != 0 ? Math.min(this.maxBoost, floorAttr * size * size): this.baseEff;
        this.stats.add(Stat.tiles, StatValues.blockEfficiency(b, efficiency, true));
      }
    });
  },

  drawPlace(x, y, rotation, valid){
    this.drawPlaceText(Core.bundle.formatFloat("bar.efficiency", this.baseEfficiency + Math.min(this.maxBoost, this.boostScale * this.attrEfficiency(x, y)) * 100, 0), x, y, valid);
  },

  
  icons(){
    return[
        this.region,
        Core.atlas.find(this.name + "-icon")
    ]
  }
});

ap.buildType = () => extend(AttributeCrafter.AttributeCrafterBuild, ap, {

  onProximityUpdate(){
    this.attrsum = 0, this.attrsum = ap.attrEfficiency(this.x / 8, this.y / 8);
  },

  rSpeed: 0,
  fSpeed: 0,
  uEffect: Fx.pulverizeMedium,
  updateTile(){
    this.super$updateTile();
    let size = ap.size, itemColor = Items.coal.color;
    if(this.consValid()){
      this.rSpeed = Mathf.lerpDelta(this.rSpeed, ap.rotateSpeed, ap.warmupSpeed);
    }else{
      this.rSpeed = Mathf.lerpDelta(this.rSpeed, 0, ap.warmupSpeed);
    }
    this.fSpeed += this.rSpeed * Time.delta;

    if(this.consValid()){
      if(Mathf.chanceDelta(ap.drillEffectChance * this.rSpeed))
      this.uEffect.at((this.x - 5) + Mathf.range(size * 2), (this.y + 5) + Mathf.range(size * 2));
      if(Mathf.chanceDelta(this.attrsum / (size * size) * 0.015))
      ap.drillEffect.at(this.x - 5 + Mathf.range(ap.drillEffectRnd), this.y + 5 + Mathf.range(ap.drillEffectRnd), itemColor);
    }
  },

  craft(){
    this.super$craft();
    let tilesize = Vars.tilesize, size = ap.size;
    this.uEffect.at(this.x + tilesize + Mathf.range(size / 2 * 4), this.y - tilesize + Mathf.range(size / 2 * 4));
  },

  draw(){
    Draw.rect(ap.region, this.x, this.y);
    Drawf.spinSprite(ap.rotatorRegion, this.x - 5, this.y + 5, this.fSpeed);
    Draw.rect(ap.topRegion, this.x, this.y);
    Draw.rect(ap.overlapRegion, this.x, this.y);
    Drawf.liquid(ap.liquidRegion, this.x, this.y, this.liquids.total() / ap.liquidCapacity, this.liquids.current().color);
  },
});