/*let sFloors = [Blocks.stone, Blocks.craters, Blocks.charr, Blocks.basalt, 
  Blocks.hotrock, Blocks.magmarock, Blocks.sand, Blocks.darksand];

const ap = extendContent(GenericCrafter, "automated-press", {
    load(){
        this.super$load();      
        this.region = Core.atlas.find(this.name);
        this.rotatorRegion = Core.atlas.find(this.name + "-rotator");
        this.topRegion = Core.atlas.find(this.name + "-top");
        this.overlapRegion = Core.atlas.find(this.name + "-overlap");
        this.liquidRegion = Core.atlas.find(this.name + "-liquid");
    },

    canPlaceOn: function(tile){
        return tile.getLinkedTilesAs(this, this.tempTiles).contains(
            boolf(cTile =>
                cTile.floor().blendGroup != null &&
                cTile.floor().blendGroup === Blocks.basalt ||
                cTile.floor().blendGroup === Blocks.stone));
    },

    setStats(){
        this.super$setStats();
        //Stats for booster
        this.stats.add(Stat.booster, new  LiquidValue(Liquids.water, 4, true));
        this.stats.add(Stat.boostEffect, "1.96x speed");
        //Stata for stone floors
        this.stats.add(Stat.tiles, new FloorEfficiencyValue(Blocks.dacite, 1.24, true));
        Vars.content.blocks().each(b => {
            let bGBlock = b.blendGroup;
            if(bGBlock === Blocks.stone)
            this.stats.add(Stat.tiles, new FloorEfficiencyValue(b, 1.24, true));
            if(bGBlock === Blocks.basalt &&
                b.attributes.get(Attribute.heat) > 0){
                    this.stats.add(Stat.tiles, new FloorEfficiencyValue(b, 0.84, true));
                }else{
                    if(bGBlock === Blocks.basalt)
                    this.stats.add(Stat.tiles, new FloorEfficiencyValue(b, 1, true));
                }
            });
        },

    drawPlace(x, y, rotation, valid){
        let count = 0;
        var t = Vars.world.tile(x, y);
        if(t != null){
          //Efficiency for stone floors
          t.getLinkedTilesAs(this, this.tempTiles).each(cTile => {
                if(cTile.floor().blendGroup === Blocks.stone ||
                cTile.floor() === Blocks.dacite) count += 0.0775;
                if(cTile.floor().blendGroup === Blocks.basalt &&
                cTile.floor().attributes.get(Attribute.heat) != 0) {
                    count += 0.0525;
                }else{
                    if(cTile.floor().blendGroup === Blocks.basalt)
                    count += 0.0625;
                }
            });
        }
        this.drawPlaceText(Core.bundle.formatFloat("bar.efficiency", count * 100, 1), x, y, valid);
    },
  
    setBars(){
        this.super$setBars();
        this.bars.add("efficiency", func(e => new Bar(prov(() => 
        Core.bundle.formatFloat("bar.efficiency", e.dEfficiency() * 100 * Mathf.clamp(e.dWarmup(1, false), 0, 1), 0)),
         prov(() => Pal.ammo), floatp(() => e.dWarmup(1, false))
         )));
      },  

    icons(){
        return[
            this.region,
            Core.atlas.find(this.name + "-icon")
        ]
    }
});

ap.buildType = () => extend(GenericCrafter.GenericCrafterBuild, ap, {
        //Totally not copied and renamed from the other scripts
        dEfficiency(){
          let count = 0;
          //Liquid boost efficiency
          if(this.liquids.total() >= 6.5)
          count = 0.4;
          //Efficiency for stone floors
          this.tile.getLinkedTilesAs(this.tile.block(), this.tile.block().tempTiles).each(cTile => {
            let cFloor = cTile.floor();
            if(cFloor.blendGroup === Blocks.stone ||
            cFloor === Blocks.dacite) count += 0.0775;
            if(cFloor.blendGroup === Blocks.basalt &&
            cFloor.attributes.get(Attribute.heat) != 0){
              count += 0.0625;
            }else{
            if(cFloor.blendGroup === Blocks.basalt)
              count += 0.0725;
            }
            });
            return count;
        },
        
        rSpeed: 0,
        dWarmup(a, b){
          let speed = a;
          //Liquid boost speed
          if(b === true && this.liquids.total() >= 6.5) speed = 1.4;
          speed *= this.efficiency();
          if(this.cons.valid() === true){
            this.rSpeed = Mathf.lerpDelta(this.rSpeed, speed, 0.02);
          }else{
            this.rSpeed = Mathf.lerpDelta(this.rSpeed, 0, 0.02);
          }
            return this.rSpeed;
        },
        
        fSpeed: 0,
        draw(){
          this.fSpeed += this.dWarmup(1, true) * this.delta() * this.dEfficiency();
          Draw.rect(ap.region, this.x, this.y);
          Draw.rect(ap.rotatorRegion, this.x - 5, this.y + 5, this.fSpeed);
          Draw.rect(ap.topRegion, this.x, this.y);
          Draw.rect(ap.overlapRegion, this.x, this.y);
          Drawf.liquid(ap.liquidRegion, this.x, this.y, this.liquids.total() / ap.liquidCapacity, this.liquids.current().color);
        },
        
        updateTile(){
          this.super$updateTile();
          let bTime = 90;
            if(this.dEfficiency() != 1)
            ap.craftTime = (bTime - bTime * this.dEfficiency()) / 2 + bTime;

          /*print("craftTime: " + ap.craftTime + " dEfficiency: " + this.dEfficiency()
           + " dWarmup: " + this.dWarmup(1, false) + " \nliquids.total: " + this.liquids.total() + " efficiency: " + this.efficiency());*/
          /*var coalColor = Color.valueOf("272727");
          if(this.cons.valid() && Mathf.chanceDelta(0.02 * this.dWarmup(1, false)))
          Fx.pulverizeMedium.at(this.x - 5 + Mathf.range(8),this.y + 5 + Mathf.range(8));
          if(this.cons.valid() && Mathf.chance(0.012))
          Fx.mineBig.at(this.x - 5 + Mathf.range(4), this.y + 5 + Mathf.range(4), coalColor);
          //Effect for press
          if(this.cons.valid() && this.progress >= 0.97)
          Fx.pulverizeMedium.at(this.x + 8, this.y - 8);
        }
});*/